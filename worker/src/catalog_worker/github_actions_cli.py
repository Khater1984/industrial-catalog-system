"""GitHub Actions entry point for the Drive-backed catalog worker.

The runner publishes terminal manifests to Drive; Apps Script remains responsible
for validating and importing them into Sheets.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import tempfile
from pathlib import Path
from typing import Any

from .drive_io import DriveClient
from . import runner


def _load_job(drive: DriveClient, job_file_id: str, root: Path) -> dict[str, Any]:
    path = root / "dispatch-job.json"
    drive.download(job_file_id, path)
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError("JOB_MANIFEST_INVALID")
    return value


def _publish_terminal_failure(
    drive: DriveClient, job: dict[str, Any], exc: Exception, root: Path
) -> dict[str, Any] | None:
    """Best-effort terminal result for failures occurring outside runner's handled errors."""
    required = ("run_id", "logical_job_id", "catalog_id", "source_sha256", "run_folder_id")
    if any(not isinstance(job.get(key), str) or not job[key].strip() for key in required):
        return None
    run_id = job["run_id"].strip()
    if not re.fullmatch(r"[A-Za-z0-9_.-]{1,128}", run_id) or run_id in {".", ".."}:
        return None
    folder_id = job["run_folder_id"].strip()
    if not re.fullmatch(r"[A-Za-z0-9_-]{10,200}", folder_id):
        return None

    items = drive.list_children(folder_id)
    existing = runner._existing_terminal_result(
        drive, root / "existing-result", items,
        run_id=run_id, logical_job_id=job["logical_job_id"].strip(),
        catalog_id=job["catalog_id"].strip(), source_sha=job["source_sha256"].strip().lower(),
    )
    if existing:
        return existing

    attempt = job.get("attempt_number", 1)
    if isinstance(attempt, bool) or not isinstance(attempt, int) or attempt < 1:
        attempt = 1
    code_match = re.match(r"^([A-Z][A-Z0-9_]{2,80})", str(exc))
    error_code = code_match.group(1) if code_match else "WORKER_UNHANDLED_ERROR"
    failure = runner._failure_manifest(
        run_id=run_id,
        logical_job_id=job["logical_job_id"].strip(),
        catalog_id=job["catalog_id"].strip(),
        source_sha=job["source_sha256"].strip().lower(),
        attempt=attempt,
        parent_run_id=job.get("parent_run_id") or None,
        retry_reason=job.get("retry_reason") or None,
        error_code=error_code,
        error_message="Worker stopped unexpectedly; inspect the sanitized GitHub Actions run log.",
    )
    return runner._publish_manifest(drive, folder_id, failure)


def main() -> int:
    parser = argparse.ArgumentParser(description="Run one immutable Drive-backed catalog job.")
    parser.add_argument("--run-id", required=True)
    parser.add_argument("--job-file-id", required=True)
    args = parser.parse_args()

    if not re.fullmatch(r"[A-Za-z0-9_.-]{1,128}", args.run_id) or args.run_id in {".", ".."}:
        parser.error("run-id has an invalid format")
    if not re.fullmatch(r"[A-Za-z0-9_-]{10,200}", args.job_file_id):
        parser.error("job-file-id has an invalid format")

    with tempfile.TemporaryDirectory(prefix="catalog-worker-") as temporary:
        root = Path(temporary)
        drive = DriveClient()
        job: dict[str, Any] | None = None
        try:
            job = _load_job(drive, args.job_file_id, root)
            result = runner.run_from_drive(
                job_file_id=args.job_file_id,
                expected_run_id=args.run_id,
                drive=drive,
                output_root=root / "work",
            )
            print(json.dumps({
                "run_id": result.get("run_id"),
                "run_status": result.get("run_status"),
                "result_manifest_file_id": result.get("result_manifest_file_id"),
            }))
            return 0
        except Exception as exc:
            # Do not print exception text: API/library errors can contain sensitive details.
            print("WORKER_EXECUTION_FAILED", file=sys.stderr)
            if job is not None:
                try:
                    result = _publish_terminal_failure(drive, job, exc, root)
                    if result:
                        print(json.dumps({
                            "run_id": result.get("run_id"),
                            "run_status": result.get("run_status"),
                            "result_manifest_file_id": result.get("result_manifest_file_id"),
                        }))
                        return 0
                except Exception:
                    print("FAILURE_MANIFEST_PUBLISH_FAILED", file=sys.stderr)
            return 1


if __name__ == "__main__":
    raise SystemExit(main())
