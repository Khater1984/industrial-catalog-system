# Python worker

## Hosted Drive-backed worker integration

The hosted adapter is implemented in `catalog_worker.service` and deployed with the repository Dockerfile. `POST /run` requires a bearer token and enqueues a deterministic Cloud Task; the task handler verifies its Google OIDC identity, downloads the immutable job/PDF from Drive, runs the resumable engine, and uploads page artifacts plus `result-manifest.json`. It never writes to Sheets.

Apps Script stays owner-only (`webapp.access=MYSELF`). It dispatches the task and uses an owner-executed five-minute trigger to discover result manifests in Drive and ingest them. This intentionally avoids making an execute-as-owner Apps Script deployment public merely to receive an external callback.

Required Cloud Run environment:
- `WORKER_SHARED_TOKEN`: same high-entropy token as Apps Script `DEV_WORKER_SHARED_TOKEN`.
- `GOOGLE_CLOUD_PROJECT`, `CLOUD_TASKS_LOCATION`, `CLOUD_TASKS_QUEUE`.
- `TASK_INVOKER_SERVICE_ACCOUNT`: service account used by Cloud Tasks OIDC.
- `WORKER_PUBLIC_URL`: Cloud Run base URL, without a trailing slash.

Grant the Cloud Run runtime service account Drive access to both private DEV folders. Grant the Cloud Tasks invoker service account permission to invoke the Cloud Run service. Configure Cloud Tasks retry/backoff and queue rate limits. Deploy with `worker/Dockerfile`; the service listens on `$PORT`.

The worker writes only Drive artifacts. Apps Script validates manifest version, source SHA-256, manifest checksum, each page artifact's raw SHA-256 and identity, then idempotently creates Catalog_Pages and Run_Units and updates Run_Log. Run `installWorkerPoller` once from the Apps Script editor as the owner.

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

Not implemented: OCR, page rendering, table recognition, image extraction, product/variant inference, staging import, review/promotion, and a deployed cloud environment. The hosted adapter and Drive transport are implemented and CI-tested, but still require provisioning, deployment, IAM/Drive sharing, and a live DEV end-to-end test. No claim of live production operation is made.

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


## Optional embedded-image extraction (local DEV)

Embedded PDF image extraction is available as a separate, opt-in utility. It is
disabled unless either the command flag `--enable` is supplied or the
`CATALOG_WORKER_EXTRACT_IMAGES=1` environment variable is set.

```bash
catalog-worker-images --pdf ./catalog.pdf --output ./worker-output --enable \
  --catalog-id catalog_0001 --run-id run_0001
```

The utility writes content-addressed files under `images/page-NNNNN/` and a
checksummed `image-manifest.json`. Each record includes the page identity,
`Run_Units.Unit_Type=IMAGE`, `Image_Assets.Source_Type=CATALOG_EMBEDDED`,
file size, MIME type, and SHA-256. Repeated extraction does not overwrite image
bytes.

**Integration boundary:** this is a local DEV extraction utility only. It does
not create `Run_Units`, `Image_Assets`, or `Staging_Images` rows and does not
upload images to Drive. A trusted Apps Script/API import step must validate the
manifest and persist Drive file IDs before these artifacts are used by the
catalog workflow. The existing `catalog-worker-v21` text worker remains
unchanged and image extraction remains disabled by default.
