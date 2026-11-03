# Python worker — page-processing DEV spike

This is the first executable worker slice. It validates a local PDF, verifies its exact SHA-256, extracts embedded text page by page, writes page artifacts, and produces a versioned result manifest.

**Implemented:** PDF signature/hash validation, encrypted/corrupt PDF rejection, page count, embedded-text extraction, deterministic page-unit fingerprints, atomic artifact writes, checkpoint verification, and idempotent local reruns.

**Not implemented yet:** Google Drive retrieval, authenticated server-issued production jobs, worker leases/callbacks, Google Sheets writes, page image rendering, OCR, table/image extraction, product/specification inference, staging, or cloud hosting. The local JSON manifest and local file path are DEV-only and must not be exposed as a public job API.

## Local setup

Requires Python 3.11+.

```bash
cd worker
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux:
source .venv/bin/activate
python -m pip install -e ".[test]"
pytest -q
```

## Run a local catalog job

Calculate the exact PDF SHA-256:

```bash
sha256sum /absolute/path/catalog.pdf
```

Create `job.json`:

```json
{
  "protocol_version": "1",
  "run_id": "run_dev_0001",
  "logical_job_id": "job_dev_0001",
  "catalog_id": "cat_dev_0001",
  "source_pdf_path": "/absolute/path/catalog.pdf",
  "source_sha256": "REPLACE_WITH_64_CHARACTER_SHA256"
}
```

Execute:

```bash
python -m catalog_worker.cli --manifest job.json --output-dir ./worker-output
```

Outputs:

- `worker-output/pages/page-00001.json` — extracted text and page provenance.
- `worker-output/pages/page-00002.json` — one artifact per page.
- `worker-output/result-manifest.json` — page count, unit statuses, hashes, and run status.

Run the same job again against the same output directory. Verified page checkpoints are reused. A changed or corrupted checkpoint is rejected rather than silently overwritten.

## Result and persistence boundary

The result manifest reports `run_id`, `logical_job_id`, `catalog_id`, source SHA-256, page count, unit fingerprints, output hashes, and artifact paths. Artifact paths are local DEV paths in this spike. The next integration step must upload artifacts to the approved Drive folder and submit a validated result manifest through an authenticated Apps Script/API boundary. The worker must never write production Sheets rows directly.

## Extraction behavior

Only embedded PDF text is extracted. Scanned pages can legitimately produce empty text; this is not treated as OCR success. OCR and visual extraction will be separate measured stages after the page-processing/checkpoint path is proven.
