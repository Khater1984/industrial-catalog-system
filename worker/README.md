# Python worker

## V2.1 resumable local DEV implementation

The V2.1 implementation is available as `catalog_worker.resumable` and is exposed through the `catalog-worker-v21` command. It is deliberately local-filesystem-only and is not connected to Drive, Sheets, Apps Script, or a production queue.

Implemented in V2.1:
- PDF signature, SHA-256, encryption, readability, and page-count validation.
- Page-by-page embedded-text extraction with deterministic input fingerprints.
- Stable `Run_Unit_ID` values for same-Run_ID resumption.
- Immutable page artifacts created exclusively; existing conflicts/corruption are rejected, not overwritten.
- Result-manifest checksum verification and atomic manifest updates.
- Deterministic idempotency key validation.
- Retry lineage validation: a retry uses a new `Run_ID`, positive `Attempt_Number`, and `Parent_Run_ID`.
- Local output-directory lock against concurrent processing; stale same-host locks are reclaimed only when the recorded PID is demonstrably absent. Unknown/malformed/remote-owner locks fail closed for manual inspection.
- Exact V2.1 enum values: `CATALOG_EXTRACTION`, `CATALOG_PAGE`, and registered Run/Unit statuses.

Not implemented: OCR, page rendering, table recognition, image extraction, product/variant inference, staging import, review/promotion, Drive access, Sheets writes, Apps Script callbacks, durable distributed leases, cloud queueing, and production hosting. No claim of production readiness is made.

## Setup and tests

Requires Python 3.11+.

```bash
cd worker
python -m venv .venv
# activate the virtual environment
python -m pip install -e ".[test]"
pytest -q
```

## V2.1 job manifest

```json
{
  "run_id": "run_dev_0001",
  "logical_job_id": "job_dev_0001",
  "catalog_id": "catalog_0001",
  "source_pdf_path": "/absolute/path/catalog.pdf",
  "source_sha256": "<64-character SHA-256>",
  "attempt_number": 1,
  "catalog_page_ids": ["<Catalog_Page_ID for page 1>", "<Catalog_Page_ID for page 2>"],
  "extraction_profile": "embedded-text-v1"
}
```

Run:

```bash
catalog-worker-v21 --job job.json --output ./worker-output
```

The application should provide one stable `Catalog_Page_ID` per PDF page in `catalog_page_ids`; these IDs become `Run_Units.Unit_Key` and are persisted on each page artifact. The field is optional only for isolated local tests. Run the exact same job again against the same output directory to resume verified completed page units. A changed source, extraction profile, worker version, or pypdf toolchain changes the logical input fingerprint; create a new `Logical_Job_ID` and `Run_ID` for changed logical input. A retry is a new run attempt and must identify its parent run, increment `attempt_number`, and provide a non-empty `retry_reason` (up to 1000 characters). The retry receives a distinct deterministic idempotency key because Run_Log keys are unique per attempt.

## Original 0.1 CLI

The original `catalog-worker` command remains available for compatibility. New V2.1 development and tests should use `catalog-worker-v21`.

## Production boundary

The worker must not write directly to production Sheets. Production integration still requires authenticated server-issued manifests, Drive object access, durable worker leases, API-mediated result submission, server-side validation, and deployment/security decisions from `WORKER_SPEC.md`.
