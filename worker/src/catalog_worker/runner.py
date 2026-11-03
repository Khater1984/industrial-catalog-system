"""Drive-backed runner joining immutable job manifests to the resumable PDF engine."""
from __future__ import annotations

import hashlib
import json
import re
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import pypdf

from .drive_io import DriveClient
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


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _manifest_digest(manifest: dict[str, Any]) -> str:
    unsigned = dict(manifest)
    unsigned.pop("manifest_sha256", None)
    return sha256_bytes(canonical_json_bytes(unsigned))


def _publish_manifest(drive: DriveClient, folder_id: str, manifest: dict[str, Any]) -> dict[str, Any]:
    value = dict(manifest)
    value.pop("manifest_sha256", None)
    value["manifest_sha256"] = _manifest_digest(value)
    payload = canonical_json_bytes(value)
    manifest_id, raw_sha = drive.upload_bytes(
        folder_id, "result-manifest.json", payload, "application/json"
    )
    return {
        "accepted": True,
        "run_id": value["run_id"],
        "result_manifest_file_id": manifest_id,
        "result_manifest_sha256": raw_sha,
        "run_status": value["run_status"],
    }


def _failure_manifest(
    *, run_id: str, logical_job_id: str, catalog_id: str, source_sha: str,
    attempt: int, parent_run_id: str | None, retry_reason: str | None,
    error_code: str, error_message: str, page_count: int = 0,
) -> dict[str, Any]:
    now = _utc_now()
    return {
        "manifest_version": MANIFEST_VERSION,
        "protocol_version": "1",
        "worker_version": WORKER_VERSION,
        "run_type": "CATALOG_EXTRACTION",
        "run_id": run_id,
        "logical_job_id": logical_job_id,
        "attempt_number": attempt,
        "parent_run_id": parent_run_id,
        "retry_reason": retry_reason,
        "catalog_id": catalog_id,
        "source_sha256": source_sha,
        "job_input_sha256": "",
        "page_count": page_count,
        "completed_units": 0,
        "failed_units": max(1, page_count),
        "reused_units": 0,
        "newly_processed_units": 0,
        "run_status": "FAILED",
        "started_at": now,
        "finished_at": now,
        "pages": [],
        "error_code": error_code,
        "error_message": error_message[:1500],
    }


def _existing_terminal_result(
    drive: DriveClient, run_dir: Path, items: list[dict[str, Any]],
    *, run_id: str, logical_job_id: str, catalog_id: str, source_sha: str,
) -> dict[str, Any] | None:
    for item in items:
        if item.get("name") != "result-manifest.json":
            continue
        local_path = run_dir / "result-manifest.json"
        drive.download(item["id"], local_path)
        raw = local_path.read_bytes()
        try:
            manifest = json.loads(raw.decode("utf-8"))
        except (UnicodeDecodeError, ValueError) as exc:
            raise RunnerError("RESULT_MANIFEST_INVALID") from exc
        if not isinstance(manifest, dict):
            raise RunnerError("RESULT_MANIFEST_INVALID")
        if (manifest.get("run_id") != run_id or
                manifest.get("logical_job_id") != logical_job_id or
                manifest.get("catalog_id") != catalog_id or
                manifest.get("source_sha256") != source_sha):
            raise RunnerError("RESULT_MANIFEST_IDENTITY_CONFLICT")
        if manifest.get("manifest_version") != MANIFEST_VERSION or manifest.get("protocol_version") != "1":
            raise RunnerError("RESULT_MANIFEST_VERSION_CONFLICT")
        if manifest.get("manifest_sha256") != _manifest_digest(manifest):
            raise RunnerError("RESULT_MANIFEST_CORRUPT")
        if manifest.get("run_status") in {"COMPLETED", "FAILED"}:
            return {
                "accepted": True, "run_id": run_id,
                "result_manifest_file_id": item["id"],
                "result_manifest_sha256": hashlib.sha256(raw).hexdigest(),
                "run_status": manifest["run_status"],
            }
    return None


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
    attempt = job.get("attempt_number", 1)
    if isinstance(attempt, bool) or not isinstance(attempt, int) or attempt < 1:
        raise RunnerError("INVALID_ATTEMPT_NUMBER")
    parent_run_id = job.get("parent_run_id") or None
    retry_reason = job.get("retry_reason") or None

    run_folder_id = job.get("run_folder_id")
    if not isinstance(run_folder_id, str) or not run_folder_id:
        metadata = drive.metadata(job_file_id)
        parents = metadata.get("parents") or []
        if not parents:
            raise RunnerError("RUN_FOLDER_NOT_FOUND")
        run_folder_id = parents[0]
    if not re.fullmatch(r"[A-Za-z0-9_-]{10,200}", run_folder_id):
        raise RunnerError("INVALID_RUN_FOLDER_ID")

    run_dir = work_root / "catalog-worker" / run_id
    run_dir.mkdir(parents=True, exist_ok=True)
    pages_dir = run_dir / "pages"
    pages_dir.mkdir(parents=True, exist_ok=True)
    drive_items = drive.list_children(run_folder_id)
    for item in drive_items:
        name = item.get("name", "")
        if name.startswith("page-") and name.endswith(".json"):
            drive.download(item["id"], pages_dir / name)
    existing = _existing_terminal_result(
        drive, run_dir, drive_items, run_id=run_id,
        logical_job_id=logical_job_id, catalog_id=catalog_id, source_sha=source_sha,
    )
    if existing:
        return existing

    pdf_path = run_dir / "source.pdf"
    drive.download(source_file_id, pdf_path)
    actual_sha = hashlib.sha256(pdf_path.read_bytes()).hexdigest()
    if actual_sha != source_sha:
        failure = _failure_manifest(
            run_id=run_id, logical_job_id=logical_job_id, catalog_id=catalog_id,
            source_sha=source_sha, attempt=attempt, parent_run_id=parent_run_id,
            retry_reason=retry_reason, error_code="SOURCE_HASH_MISMATCH",
            error_message="Downloaded source PDF SHA-256 differs from the immutable job manifest.",
        )
        return _publish_manifest(drive, run_folder_id, failure)
    try:
        page_count = len(pypdf.PdfReader(str(pdf_path), strict=True).pages)
    except Exception:
        failure = _failure_manifest(
            run_id=run_id, logical_job_id=logical_job_id, catalog_id=catalog_id,
            source_sha=source_sha, attempt=attempt, parent_run_id=parent_run_id,
            retry_reason=retry_reason, error_code="PDF_READ_FAILED",
            error_message="Source PDF is corrupt or unreadable.",
        )
        return _publish_manifest(drive, run_folder_id, failure)
    if page_count < 1:
        failure = _failure_manifest(
            run_id=run_id, logical_job_id=logical_job_id, catalog_id=catalog_id,
            source_sha=source_sha, attempt=attempt, parent_run_id=parent_run_id,
            retry_reason=retry_reason, error_code="PDF_HAS_NO_PAGES",
            error_message="Source PDF contains no pages.",
        )
        return _publish_manifest(drive, run_folder_id, failure)

    # Deterministic Catalog_Page_IDs are created by the Apps Script ingest step.
    page_ids = [f"cp_{catalog_id}_{number:05d}" for number in range(1, page_count + 1)]
    local_job = {
        "run_id": run_id, "logical_job_id": logical_job_id, "catalog_id": catalog_id,
        "source_pdf_path": str(pdf_path), "source_sha256": source_sha,
        "attempt_number": attempt, "parent_run_id": parent_run_id,
        "retry_reason": retry_reason, "catalog_page_ids": page_ids,
        "extraction_profile": job.get("extraction_profile", "embedded-text-v1"),
        "idempotency_key": job.get("idempotency_key"),
    }

    def publish_checkpoint(page: dict[str, Any], artifact_path: Path) -> None:
        # Upload before the engine advances. If the Cloud Task is interrupted,
        # the next attempt restores this immutable page and resumes from it.
        drive.upload_file(
            run_folder_id, artifact_path.name, artifact_path, "application/json"
        )

    try:
        result = process_resumable_catalog_job(
            local_job, run_dir, artifact_callback=publish_checkpoint
        )
        manifest = dict(result)
    except WorkerError as exc:
        manifest = _failure_manifest(
            run_id=run_id, logical_job_id=logical_job_id, catalog_id=catalog_id,
            source_sha=source_sha, attempt=attempt, parent_run_id=parent_run_id,
            retry_reason=retry_reason, error_code=exc.code,
            error_message=exc.message, page_count=page_count,
        )

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
    return _publish_manifest(drive, run_folder_id, manifest)
