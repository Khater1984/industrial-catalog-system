# Technical Design — System Contracts

**Status:** Design specification; not implementation authorization.  
**Version:** 0.1 proposal  
**Scope:** Initial single-primary-user industrial catalog platform.

## 1. Design objectives

1. Preserve supplier files and extracted source evidence.
2. Maintain stable canonical product/model identities across catalogs and revisions.
3. Separate extraction, review, promotion, enrichment, and PDF issue into explicit stages.
4. Make long-running work asynchronous, observable, resumable, and idempotent.
5. Keep the browser thin: business rules are enforced by the Apps Script application layer and worker contracts, not by UI-only validation.
6. Reproduce historical output from immutable snapshots and pinned dependencies to the documented level.

## 2. System boundaries

| Component | Owns | Must not own |
|---|---|---|
| Browser UI | User interaction, view state, client validation, previews | Source of truth, credentials, promotion rules |
| Apps Script API | Authorization, validation, IDs, Sheets reads/writes, state transitions, audit, job orchestration | Heavy OCR, large PDF rendering |
| Google Sheets | Structured records, workflow states, relationships | Binary files, large immutable manifests |
| Google Drive | Original files, immutable renditions, JSON manifests, documents, issued PDFs | Relational business logic |
| Python worker | Extraction, OCR/table/image processing, PDF rendering, technical validation | Direct uncontrolled production-table writes |
| GitHub | Source code, tests, docs, deployment definitions | Runtime secrets, supplier-confidential files, production data |

The worker submits structured results and manifests to the Apps Script boundary. It does not receive unrestricted write access to the Sheets database. Any future direct integration requires an explicit security ADR and equivalent validation/audit controls.

## 3. Data flow

### 3.1 Catalog intake

1. Browser requests an upload session; API validates file size/type policy and creates an intake record.
2. Original PDF is stored in Drive. Catalog metadata and exact file SHA256 are registered.
3. API creates Logical_Job_ID and Run_Log attempt 1, plus immutable input manifest.
4. Worker validates the PDF, determines page count, and processes pages as Run_Units.
5. Each page produces immutable artifacts and a structured extraction manifest with source locations and confidence.
6. Worker submits results to the API. API validates schema, hashes, ownership, and run state before inserting typed staging rows.
7. Review tasks and Review_Staging_Links are created for uncertain, conflicting, or identity-sensitive results.
8. Human decisions are bound to exact staging hashes.
9. Promotion_Operations applies approved mappings and source assertions. Partial writes are reconciled before completion.

### 3.2 Product enrichment

1. User opens canonical Product/Variant.
2. API resolves current company-managed identity, attributes, effective specifications, documents, and image links.
3. Company changes are stored separately from immutable supplier assertions.
4. Variant overrides use VALUE or INTENTIONALLY_EMPTY; absence of an override means inheritance.
5. Any source identity correction is recorded as an append-only decision and audited reconciliation.

### 3.3 PDF issue

1. User selects a scope and output type.
2. API builds a deterministic scope manifest and resolves all effective data.
3. API resolves exact published Brand_Version, Template_Version, Paper_Version, approved Image_Renditions, documents, watermark, contact profile, and Export_Profile.
4. Preflight creates a report and dependency manifest with SHA256 values.
5. User resolves blocking errors and explicitly accepts any permitted warnings. PRINT_READY_PDF is blocked unless the pinned printer specification, ICC profile, trim/bleed rules, and conformance validator are all available and pass.
6. Issue_Operations is created; worker renders and validates the PDF.
7. API verifies result hashes and writes final Issued_Documents and Issued_Document_Items.
8. Original PDF and snapshot are immutable. Regeneration creates a separate reproduction operation; it never overwrites the original.

## 4. Identity and key strategy

- Use opaque prefixed UUID/ULID identifiers generated server-side.
- IDs are immutable, never recycled, and never derived from sheet row numbers or display names.
- A staging ID is globally unique across typed staging sheets.
- Source occurrence keys are deterministic within a catalog/source record; canonical IDs are independent. Product keys use catalog file SHA + physical page + stable region locator + exact source product label/reference + occurrence ordinal. Variant keys add parent product-source key + exact source model label/number. Specification keys add parent source-record key + scope + exact raw label/value/unit + region locator + occurrence ordinal. The key algorithm version and extractor build are retained in run/staging metadata.
- Reprocessing with the same source bytes and same key algorithm must reproduce the same occurrence keys. A new parser/key algorithm that changes segmentation creates review candidates; it must not silently create duplicate promoted source records.
- Idempotency keys are unique per request/attempt. Logical_Job_ID groups retry attempts.
- Every multi-sheet operation has a deterministic operation key and immutable intended-output manifest.

## 5. State machines

### Run attempt

`QUEUED → RUNNING → WAITING_REVIEW | RETRY_PENDING | COMPLETED | FAILED | CANCELLED`

- Terminal attempts are never reset.
- Retry creates a new Run_ID, same Logical_Job_ID, new idempotency key, Parent_Run_ID to prior attempt, and Attempt_Number +1.
- Stalled-run detection uses heartbeat age and worker lease policy; automatic retry must not run concurrently with an active lease.

### Staging record

`NEW → NEEDS_REVIEW → REJECTED | PROMOTED`

- Approval is represented by Review_Queue, not by a duplicate APPROVED staging status.
- Any decision-relevant edit recomputes Staging_Record_Hash and marks linked approved reviews STALE.

### Promotion operation

`PREPARED → APPLYING → COMPLETED`  
Failure after writes begin: `APPLYING → IN_DOUBT → COMPLETED | QUARANTINED`

- Never blindly replay an IN_DOUBT operation.

### Issue operation

`PREPARED → PREFLIGHT → RENDERING → VALIDATING → COMPLETED`

Failure may lead to FAILED or IN_DOUBT. Only COMPLETED operations can produce an externally visible final issue.

## 6. Read and write consistency

- Every write passes through one domain service and a central validator.
- Multi-row writes acquire a bounded lock, re-read authoritative state, validate expected hashes/versions, and write in batches.
- Never hold a script lock during OCR, rendering, or external network calls.
- Long-running work uses leases and checkpoints, not long-lived locks.
- For multi-sheet operations, write the operation envelope and intended manifest first; reconcile after every uncertain failure.
- UI reads may be cached briefly, but approvals, promotion, issue, and sequence allocation always re-read authoritative state.
- The API returns a version/ETag or updated timestamp for editable company records to prevent lost updates.

## 7. Effective-data resolution

- Source Specifications are immutable and linked to one exact source record.
- Approved Specification_Changes are folded independently by Logical_Specification_Key and Sequence_No. DRAFT/REJECTED events do not participate; an approved event must have a unique positive sequence allocated under lock.
- Invalid sequences or semantic transitions quarantine the affected logical key from output.
- Product attributes are defaults. Variant override VALUE replaces; INTENTIONALLY_EMPTY suppresses; no row inherits. Removing the override restores inheritance.
- Product-scope and variant-scope source assertions remain distinct. The resolver must not assume that a variant assertion overrides a product assertion: when both normalize to the same attribute key, preserve both with provenance and emit a conflict for review. This is the approved DEV rule (ADR-040); no implicit precedence is applied.
- The unified resolver returns source-derived effective specifications and company-managed typed attributes as distinct provenance classes. It must not silently collapse a company attribute into a supplier assertion merely because display labels match.
- Documents: product INCLUDE is inherited; variant EXCLUDE removes only inherited association; direct variant INCLUDE remains. Direct variant pin/order wins, else product pin/order, else current version.
- Images: variant-approved image selection precedes product-approved selection; catalog and datasheet approvals are independent. No unapproved fallback unless user explicitly accepts a documented exception.

## 8. Error contract

Errors have stable codes and safe messages. Minimum classes:

| Class | Examples | Behavior |
|---|---|---|
| VALIDATION | INVALID_ENUM, FK_NOT_FOUND, OWNERSHIP_MISMATCH | Reject before write |
| CONFLICT | VERSION_CONFLICT, HASH_MISMATCH, SEQUENCE_CONFLICT | Re-read/review; no silent overwrite |
| AUTH | UNAUTHENTICATED, FORBIDDEN, SIGNATURE_INVALID | Reject and security-log metadata |
| CAPACITY | QUOTA_EXCEEDED, FILE_TOO_LARGE, LOCK_TIMEOUT | Retry only when safe; surface actionable message |
| WORKER | PDF_CORRUPT, OCR_FAILED, RENDER_TIMEOUT | Preserve evidence/checkpoint; retry policy |
| RECOVERY | OPERATION_IN_DOUBT, ORPHAN_RECORD | Quarantine path and operator recovery |

Never return stack traces, secrets, raw tokens, or confidential document text in user-facing errors.

## 9. Performance and capacity

No arbitrary catalog/page/row limit is declared until representative benchmarks are run. Benchmark small, median, and large catalogs, including worst-case model/spec/image relationships. Measure Apps Script quotas, Sheets batch latency, lock contention, worker memory/time, Drive upload/download, PDF size, and UI polling.

If Sheets exceeds measured thresholds, stop scale expansion and submit a storage-layer ADR. Do not silently migrate.

## 10. Unresolved technical decisions

- Worker hosting/runtime and cost.
- Apps Script ↔ worker authentication and file-transfer mechanism.
- OCR/table extraction stack and optional AI provider.
- PDF rendering engine and font licensing/embedding.
- Job polling vs callback strategy and lease timeout.
- Quantified capacity thresholds, backup cadence, RPO/RTO, and retention.
