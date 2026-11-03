# Python Worker Specification

**Status:** Requirements remain proposed. A local DEV-only V2.1 PDF embedded-text worker prototype now exists under `worker/src/catalog_worker/resumable.py` and passes GitHub Actions tests. It is not a deployed service and does not implement the complete pipeline below.  
**Service model:** Target remains one stateless Python worker service with two job capabilities: catalog processing and PDF generation.

## 1. Responsibilities and boundaries

The worker performs CPU/memory-intensive processing. It does not become a second source of truth and does not write arbitrary rows directly into production Sheets. It consumes validated job manifests and submits results through the application API.

Capabilities:
1. PDF intake validation, page rendering, text/table extraction, OCR fallback, image extraction, and staging-manifest production.
2. HTML/CSS-to-PDF rendering, output validation, and immutable issue artifact production.

Durable state belongs in Run_Log, Run_Units, Run_Events, Drive manifests, and operation ledgers—not in process memory.

## 2. Catalog extraction pipeline

### Stage A — Validate
- Verify file ID authorization, exact SHA256, MIME signature, PDF readability, encryption/password state, page count, and configured size limits.
- Reject corrupt, unsupported, or policy-exceeding files with stable error codes.
- Never silently repair or replace the original PDF.

### Stage B — Page preparation
- Render pages at a configurable review/extraction resolution.
- Create one Run_Unit per page with input fingerprint and immutable output manifest.
- Persist page image/text artifacts in Drive and record hashes.
- Resume only from a verified completed unit; changed input or toolchain fingerprint requires reprocessing.

### Stage C — Extract
- Prefer embedded text where reliable.
- Detect tables and structured blocks.
- Apply OCR only to pages/regions where text extraction is missing or inadequate.
- Extract images with bounding/page provenance.
- Preserve page number, region/bounding box, source quote, original text, and raw units.
- Record extraction method and tool versions per result.

### Stage D — Normalize and propose
- Normalize units, numeric values, model identifiers, and attribute keys only into separate fields.
- Preserve exact source strings and raw extracted snippets.
- Generate Product/Variant candidates and similarity suggestions; never auto-merge canonical identities.
- Confidence is an aid to prioritization, not approval.
- Ambiguous, conflicting, low-confidence, or identity-sensitive records remain in staging/review.

### Stage E — Submit
- Build a deterministic result manifest.
- Upload immutable artifacts to the approved Drive location.
- Submit manifest through the application API.
- API validates schemas, file hashes, page ownership, and Run_ID before staging import.
- Worker marks the run complete only after accepted result receipt and checkpoint reconciliation.

## 3. PDF generation pipeline

1. Receive immutable issue/dependency manifest.
2. Verify all source/config/asset hashes before render.
3. Resolve no mutable "current" pointers at render time; use only pinned IDs and snapshots.
4. Build HTML/CSS using a versioned template renderer.
5. Load exact fonts and approved image renditions.
6. Render pages with explicit dimensions, margins, bleed/safe-area rules, and output profile.
7. Run preflight: missing assets, font fallback, clipping, overflow, image DPI after crop, invalid links, metadata, trim/bleed/safe areas, and printer profile requirements.
8. For PRINT_READY_PDF only, execute the approved color-management/prepress conversion and PDF conformance validator against the pinned printer specification and ICC asset. If the pipeline cannot prove conformance, reject the PRINT_READY_PDF class with a blocking error; do not silently downgrade the label.
9. Inspect PDF structure and embedded image properties where supported.
10. Compute final SHA256 and submit immutable result manifest.
11. Never overwrite an issued PDF; reproduction is a separate job/output.

## 4. Reproducibility levels

- **Retrieval reproducibility:** return the exact stored PDF bytes. This is mandatory.
- **Data/design reproducibility:** rebuild from pinned data/config/assets and matching runtime versions. Target for supported releases.
- **Byte-identical regeneration:** not promised until proven for the chosen renderer, fonts, timestamps, metadata, and deterministic asset ordering.

The original archived PDF remains authoritative even if later renderer versions produce visually or byte-wise different output.

## 5. Observability

Every job records:
- worker build and dependency lockfile hash;
- Python/runtime and OS/container image version;
- PDF/OCR/image library versions;
- input/output SHA256;
- page/unit timings and retry counts;
- memory/time/resource usage;
- warnings/errors by stable code;
- AI provider/model/version and token/cost metrics, if optional AI is later approved.

Do not log full confidential PDF text, credentials, or signed URLs.

## 6. Performance and cost benchmark

Benchmark a representative sample stratified by:
- born-digital vs scanned PDF;
- short/medium/large page counts;
- dense tables vs image-heavy pages;
- multiple languages and low-quality scans;
- catalogs with many models and repeated specs.

Report field-level precision/recall or exact-match rate, page processing time, OCR coverage, image extraction quality, human correction time, worker memory, PDF render time, and external API cost. No blanket accuracy or per-catalog cost promise before this benchmark.

## 7. Operational requirements

- Stateless workers; job leases and checkpoints in durable storage.
- Bounded concurrency and queue backpressure.
- Graceful shutdown and lease expiry.
- Idempotent result submission.
- No unbounded retries; classify retryable vs terminal errors.
- Isolate untrusted PDF parsing and validate file signatures.
- Restrict outbound network access to approved services.
- Pin dependencies and scan for vulnerabilities.
- Separate DEV/TEST/PROD deployments and credentials.

## 8. Open decisions

Worker host, queue mechanism, PDF/OCR libraries, AI provider, Drive access mechanism, memory/time limits, and target service-level objectives require measured comparison and explicit approval.
