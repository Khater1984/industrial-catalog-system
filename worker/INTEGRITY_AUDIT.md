# V2.1 Run Integrity Audit

The independent audit helpers live in `src/catalog_worker/integrity.py`.

They are read-only with respect to Google Sheets and Drive: they download and
verify evidence but do not update records, rename files, or change permissions.
The Apps Script `Ingest` module remains the authoritative ingestion path.

## Drive layout

The current Apps Script implementation creates each run folder directly under
`DEV_RUNS_FOLDER_ID`:

```text
DEV_RUNS_FOLDER_ID/
└── <RUN_ID>/
    ├── job.json
    ├── page-00001.json
    ├── page-00002.json
    └── result-manifest.json
```

There is no intermediate `runs/` folder. The worker writes the result manifest
and page artifacts into the run folder identified by `run_folder_id` in
`job.json`.

## Python usage

```python
from catalog_worker.integrity import load_manifest, verify_gate_3

manifest_result = load_manifest(
    drive,
    run_id=run_id,
    drive_root_folder_id=dev_runs_folder_id,
    explicit_file_id=result_manifest_file_id,  # optional
)

run_units_for_this_run = [
    row for row in all_run_units
    if row.get("Run_ID") == run_id
]

gate = verify_gate_3(
    drive,
    run_id=run_id,
    units=run_units_for_this_run,
    manifest_result=manifest_result,
)
```

The `drive` argument is the existing `catalog_worker.drive_io.DriveClient`.
The supplied Run_Units rows must be filtered to the requested Run_ID before
calling the gate.

## Integrity semantics

- `PASS`: every COMPLETED/REUSED row maps one-to-one to a manifest page, the
  page references the same artifact file ID as
  `Run_Units.Output_Manifest_File_ID`, the Worker-compatible content checksum
  is valid, and the raw artifact SHA-256 matches
  `artifact_file_sha256`.
- `FAIL`: an identity conflict, duplicate key/ID, malformed checksum,
  checksum mismatch, invalid artifact, or failed artifact download is detected.
- `INCOMPLETE`: the trusted result manifest or a required transport checksum
  is unavailable. This must not be treated as success.
- `SKIP`: there are no COMPLETED/REUSED units to verify.

`Run_Units.Output_Manifest_File_ID` is the page artifact's Drive file ID. It is
not the Drive file ID of `result-manifest.json`. The latter is stored separately
as the manifest lookup result / Run_Log output manifest reference.

The audit verifies both distinct SHA-256 values:
- `output_sha256`: logical page-artifact content, calculated by the Worker
  canonical JSON algorithm after excluding the `output_sha256` field.
- `artifact_file_sha256`: exact raw bytes of the uploaded artifact file.

No live Google Drive or Sheets test is implied by the unit tests. Run this audit
only with an authorized DEV Drive client and DEV Run_Units export.
