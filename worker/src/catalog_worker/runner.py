"""Drive-backed runner joining job.json to the resumable PDF engine."""
from __future__ import annotations

import hashlib
import json
import os
import re
import tempfile
from pathlib import Path
from typing import Any

import pypdf

from .drive_io import DriveClient, DriveError
from .resumable import (
    MANIFEST_VERSION, WORKER_VERSION, WorkerError, canonical_json_bytes,
    process_resumable_catalog_job, sha256_bytes,
)


class RunnerError(RuntimeError):
    pass


def _required(data: dict[str, Any], key: str) -> str:
    value = data.get(key)
    if not isinstance(value, str) or not value.strip():
        raise RunnerError("INVALID_JOB_MANIFEST")
    return value.strip()


def run_from_drive(
    *, job_file_id: str, expected_run_id: str | None = None,
    drive: DriveClient | None = None, output_root: str | Path | None = None,
) -> dict[str, Any]:
    if not re.fullmatch(r"[A-Za-z0-9_-]{10,200}", job_file_id or ""):
        raise RunnerError("INVALID_JOB_FILE_ID")
    drive = drive or DriveClient()
    work_root = Path(output_root or tempfile.gettempdir()).resolve()
    job_path = work_root / f"job-{job_file_id}.json"
    drive.download(job_file_id, job_path)
    try:
        job = json.loads(job_path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        raise RunnerError("JOB_MANIFEST_INVALID") from exc
    if not isinstance(job, dict) or job.get("contract_version") != "1":
        raise RunnerError("CONTRACT_VERSION_MISMATCH")

    run_id = _required(job, "run_id")
    if not re.fullmatch(r"[A-Za-z0-9_.-]{1,128}", run_id) or run_id in {".", ".."}:
        raise RunnerError("INVALID_RUN_ID")
    if expected_run_id and run_id != expected_run_id:
        raise RunnerError("DISPATCH_RUN_ID_MISMATCH")
    catalog_id = _required(job, "catalog_id")
    if not re.fullmatch(r"[A-Za-z0-9_.-]{1,128}", catalog_id) or catalog_id in {".", ".."}:
        raise RunnerError("INVALID_CATALOG_ID")
    logical_job_id = _required(job, "logical_job_id")
    source_file_id = _required(job, "source_pdf_file_id")
    if not re.fullmatch(r"[A-Za-z0-9_-]{10,200}", source_file_id):
        raise RunnerError("INVALID_SOURCE_FILE_ID")
    source_sha = _required(job, "source_sha256").lower()
    if not re.fullmatch(r"[a-f0-9]{64}", source_sha):
        raise RunnerError("INVALID_SOURCE_SHA256")

    run_dir = work_root / "catalog-worker" / run_id
    run_dir.mkdir(parents=True, exist_ok=True)
    pdf_path = run_dir / "source.pdf"
    drive.download(source_file_id, pdf_path)
    actual_sha = hashlib.sha256(pdf_path.read_bytes()).hexdigest()
    if actual_sha != source_sha:
        raise RunnerError("SOURCE_HASH_MISMATCH")
    try:
        page_count = len(pypdf.PdfReader(str(pdf_path), strict=True).pages)
    except Exception as exc:
        raise RunnerError("PDF_READ_FAILED") from exc
    if page_count < 1:
        raise RunnerError("PDF_HAS_NO_PAGES")

    # Deterministic Catalog_Page_IDs allow the first successful ingest to
    # create the catalog page identities without a pre-existing page-count API.
    page_ids = [f"cp_{catalog_id}_{number:05d}" for number in range(1, page_count + 1)]
    local_job = {
        "run_id": run_id, "logical_job_id": logical_job_id, "catalog_id": catalog_id,
        "source_pdf_path": str(pdf_path), "source_sha256": source_sha,
        "attempt_number": int(job.get("attempt_number", 1)),
        "parent_run_id": job.get("parent_run_id") or None,
        "retry_reason": job.get("retry_reason") or None,
        "catalog_page_ids": page_ids,
        "extraction_profile": job.get("extraction_profile", "embedded-text-v1"),
        "idempotency_key": job.get("idempotency_key"),
    }
    run_folder_id = job.get("run_folder_id")
    if not isinstance(run_folder_id, str) or not run_folder_id:
        metadata = drive.metadata(job_file_id)
        parents = metadata.get("parents") or []
        if not parents:
            raise RunnerError("RUN_FOLDER_NOT_FOUND")
        run_folder_id = parents[0]
    if not re.fullmatch(r"[A-Za-z0-9_-]{10,200}", run_folder_id):
        raise RunnerError("INVALID_RUN_FOLDER_ID")

    # Restore immutable artifacts from Drive before resuming after a Cloud Run retry.
    pages_dir = run_dir / "pages"
    pages_dir.mkdir(parents=True, exist_ok=True)
    for item in drive.list_children(run_folder_id):
        name = item.get("name", "")
        if name.startswith("page-") and name.endswith(".json"):
            drive.download(item["id"], pages_dir / name)
        elif name == "result-manifest.json":
            drive.download(item["id"], run_dir / name)

    try:
        result = process_resumable_catalog_job(local_job, run_dir)
        manifest = dict(result)
    except WorkerError as exc:
        # Publish a terminal failure result for the owner-executed Drive poller. A failed
        # attempt is never silently retried as the same logical run.
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        manifest = {
            "manifest_version": MANIFEST_VERSION, "protocol_version": "1",
            "worker_version": WORKER_VERSION, "run_type": "CATALOG_EXTRACTION",
            "run_id": run_id, "logical_job_id": logical_job_id,
            "attempt_number": local_job["attempt_number"],
            "parent_run_id": local_job["parent_run_id"],
            "retry_reason": local_job["retry_reason"], "catalog_id": catalog_id,
            "source_sha256": source_sha, "job_input_sha256": "",
            "page_count": page_count, "completed_units": 0,
            "failed_units": page_count, "reused_units": 0, "newly_processed_units": 0,
            "run_status": "FAILED", "started_at": now, "finished_at": now,
            "pages": [], "error_code": exc.code, "error_message": exc.message,
        }
    uploaded_pages = []
    for page in manifest.get("pages", []):
        artifact_path = (run_dir / page["artifact_path"]).resolve()
        if run_dir not in artifact_path.parents or not artifact_path.is_file():
            raise RunnerError("ARTIFACT_PATH_INVALID")
        artifact_id, raw_sha = drive.upload_file(
            run_folder_id, Path(page["artifact_path"]).name, artifact_path,
            "application/json",
        )
        row = dict(page)
        row["artifact_file_id"] = artifact_id
        row["artifact_file_sha256"] = raw_sha
        row["output_manifest_file_id"] = artifact_id
        uploaded_pages.append(row)
    manifest["pages"] = uploaded_pages
    manifest.pop("manifest_sha256", None)
    manifest["manifest_sha256"] = sha256_bytes(canonical_json_bytes(manifest))
    manifest_bytes = canonical_json_bytes(manifest)
    manifest_id, manifest_raw_sha = drive.upload_bytes(
        run_folder_id, "result-manifest.json", manifest_bytes, "application/json",
    )
    return {"accepted": True, "run_id": run_id, "result_manifest_file_id": manifest_id,
            "result_manifest_sha256": manifest_raw_sha, "run_status": manifest.get("run_status")}
