"""V2.1 resumable local DEV worker implementation.

This module is intentionally separate from the original 0.1 processor while the
new protocol is being validated. It does not access Drive or write to Sheets.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import tempfile
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import pypdf
from pypdf import PdfReader

WORKER_VERSION = "0.2.1"
PROTOCOL_VERSION = "1"
MANIFEST_VERSION = 2
RUN_TYPE = "CATALOG_EXTRACTION"
UNIT_TYPE = "CATALOG_PAGE"
RUN_STATUSES = {"QUEUED", "RUNNING", "WAITING_REVIEW", "RETRY_PENDING", "COMPLETED", "FAILED", "CANCELLED"}
UNIT_STATUSES = {"PENDING", "RUNNING", "COMPLETED", "FAILED", "SKIPPED", "REUSED"}
_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$")


class WorkerError(Exception):
    """Stable worker error with a machine-readable code."""
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code, self.message = code, message


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def canonical_json_bytes(value: Any) -> bytes:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False).encode("utf-8")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _hash_payload(value: dict[str, Any], field: str) -> str:
    body = dict(value)
    body.pop(field, None)
    return sha256_bytes(canonical_json_bytes(body))


def _atomic_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temp = tempfile.mkstemp(prefix=f".{path.name}.", dir=path.parent)
    try:
        with os.fdopen(fd, "wb") as stream:
            stream.write(canonical_json_bytes(value))
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temp, path)
    except Exception:
        try:
            os.unlink(temp)
        except FileNotFoundError:
            pass
        raise


def _read_object(path: Path, code: str) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(value, dict):
            raise ValueError("Expected JSON object")
        return value
    except (OSError, ValueError, TypeError) as exc:
        raise WorkerError(code, f"Invalid JSON artifact: {path.name}") from exc


def _create_immutable_json(path: Path, value: dict[str, Any]) -> bool:
    """Atomically publish an immutable artifact without replacing an existing file."""
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary = tempfile.mkstemp(prefix=f".{path.name}.", dir=path.parent)
    try:
        with os.fdopen(fd, "wb") as stream:
            stream.write(canonical_json_bytes(value))
            stream.flush()
            os.fsync(stream.fileno())
        try:
            os.link(temporary, path)
            return True
        except FileExistsError:
            return False
    finally:
        try:
            os.unlink(temporary)
        except FileNotFoundError:
            pass


def _required(data: dict[str, Any], key: str) -> str:
    value = data.get(key)
    if not isinstance(value, str) or not value.strip():
        raise WorkerError("INVALID_JOB_MANIFEST", f"Missing or invalid field: {key}")
    return value.strip()


def _safe_id(value: str, field: str) -> str:
    if not _ID.fullmatch(value) or value in {".", ".."}:
        raise WorkerError("INVALID_JOB_MANIFEST", f"Unsafe {field}")
    return value


@contextmanager
def _lock(root: Path):
    lock = root / ".worker.lock"
    try:
        lock.mkdir()
    except FileExistsError as exc:
        raise WorkerError("RUN_LOCKED", "Output directory is already being processed.") from exc
    try:
        (lock / "owner.json").write_bytes(canonical_json_bytes({"pid": os.getpid(), "at": _now()}))
        yield
    finally:
        try:
            (lock / "owner.json").unlink(missing_ok=True)
            lock.rmdir()
        except OSError:
            pass


def _verify_unit(path: Path, identity: dict[str, Any], input_sha: str) -> dict[str, Any] | None:
    if not path.exists():
        return None
    unit = _read_object(path, "CHECKPOINT_INVALID")
    for key, expected in identity.items():
        if unit.get(key) != expected:
            raise WorkerError("CHECKPOINT_CONFLICT", f"Checkpoint identity mismatch: {key}")
    if unit.get("input_sha256") != input_sha:
        raise WorkerError("CHECKPOINT_INPUT_MISMATCH", "Existing page checkpoint has different input.")
    if unit.get("unit_status") not in {"COMPLETED", "REUSED"}:
        raise WorkerError("CHECKPOINT_NOT_COMPLETED", "Existing non-completed checkpoint cannot be overwritten.")
    if unit.get("unit_status") == "REUSED" and not unit.get("reused_from_run_unit_id"):
        raise WorkerError("CHECKPOINT_INVALID", "A REUSED unit must identify its source Run_Unit.")
    if unit.get("output_sha256") != _hash_payload(unit, "output_sha256"):
        raise WorkerError("CHECKPOINT_OUTPUT_CORRUPT", "Existing page artifact checksum is invalid.")
    return unit


def process_resumable_catalog_job(job: dict[str, Any], output_dir: str | Path) -> dict[str, Any]:
    """Process a local job with stable unit IDs, immutable artifacts and verified resume."""
    if not isinstance(job, dict):
        raise WorkerError("INVALID_JOB_MANIFEST", "Job manifest must be an object.")
    run_id = _safe_id(_required(job, "run_id"), "run_id")
    logical_id = _safe_id(_required(job, "logical_job_id"), "logical_job_id")
    catalog_id = _safe_id(_required(job, "catalog_id"), "catalog_id")
    source = Path(_required(job, "source_pdf_path")).expanduser().resolve()
    expected_sha = _required(job, "source_sha256").lower()
    if not re.fullmatch(r"[0-9a-f]{64}", expected_sha):
        raise WorkerError("INVALID_SOURCE_SHA256", "Expected a 64-character SHA-256 hex digest.")
    attempt = job.get("attempt_number", 1)
    parent = job.get("parent_run_id")
    if isinstance(attempt, bool) or not isinstance(attempt, int) or attempt < 1:
        raise WorkerError("INVALID_ATTEMPT_NUMBER", "attempt_number must be a positive integer.")
    retry_reason = job.get("retry_reason")
    if attempt == 1 and (parent not in (None, "") or retry_reason not in (None, "")):
        raise WorkerError("INVALID_RUN_LINEAGE", "The first attempt cannot have Parent_Run_ID or Retry_Reason.")
    if attempt > 1:
        if not isinstance(parent, str) or not parent.strip() or parent == run_id:
            raise WorkerError("INVALID_RUN_LINEAGE", "Retries require a new Run_ID and the prior Run_ID as Parent_Run_ID.")
        if not isinstance(retry_reason, str) or not retry_reason.strip() or len(retry_reason.strip()) > 1000:
            raise WorkerError("INVALID_RUN_LINEAGE", "Retry_Reason is required for attempts after the first (maximum 1000 characters).")
    if not source.is_file():
        raise WorkerError("SOURCE_FILE_NOT_FOUND", "Source PDF does not exist.")
    with source.open("rb") as stream:
        if stream.read(5) != b"%PDF-":
            raise WorkerError("INVALID_PDF_SIGNATURE", "Source does not have a PDF signature.")
    actual_sha = sha256_file(source)
    if actual_sha != expected_sha:
        raise WorkerError("SOURCE_HASH_MISMATCH", "Source PDF hash differs from the job manifest.")
    try:
        reader = PdfReader(str(source), strict=True)
        if reader.is_encrypted:
            raise WorkerError("PDF_ENCRYPTED", "Encrypted PDFs are not supported.")
        page_count = len(reader.pages)
    except WorkerError:
        raise
    except Exception as exc:
        raise WorkerError("PDF_READ_FAILED", "PDF is corrupt or unreadable.") from exc
    if page_count < 1:
        raise WorkerError("PDF_HAS_NO_PAGES", "PDF contains no pages.")

    profile = job.get("extraction_profile", "embedded-text-v1")
    if not isinstance(profile, str) or not profile.strip():
        raise WorkerError("INVALID_JOB_MANIFEST", "extraction_profile must be a non-empty string.")
    toolchain = f"pypdf/{getattr(pypdf, '__version__', 'unknown')}"
    logical_input = {
        "catalog_id": catalog_id, "source_sha256": actual_sha, "page_count": page_count,
        "run_type": RUN_TYPE, "unit_type": UNIT_TYPE, "profile": profile,
        "toolchain": toolchain, "worker_version": WORKER_VERSION,
    }
    job_input_sha = sha256_bytes(canonical_json_bytes(logical_input))
    # Run_Log.Idempotency_Key is unique per attempt, not per logical job.
    # Unique per Run_Log attempt, as required by the schema.
    expected_key = sha256_bytes(f"{logical_id}|{run_id}|{attempt}|{parent or ''}|{job_input_sha}".encode())
    if job.get("idempotency_key") not in (None, expected_key):
        raise WorkerError("IDEMPOTENCY_KEY_MISMATCH", "Idempotency key does not match this run attempt.")

    root = Path(output_dir).expanduser().resolve()
    root.mkdir(parents=True, exist_ok=True)
    with _lock(root):
        manifest_path = root / "result-manifest.json"
        prior = None
        if manifest_path.exists():
            prior = _read_object(manifest_path, "RESULT_MANIFEST_INVALID")
            if prior.get("run_id") != run_id or prior.get("logical_job_id") != logical_id:
                raise WorkerError("RESULT_MANIFEST_CONFLICT", "Output directory belongs to another run.")
            if prior.get("manifest_sha256") != _hash_payload(prior, "manifest_sha256"):
                raise WorkerError("RESULT_MANIFEST_CORRUPT", "Result manifest checksum is invalid.")
            if prior.get("job_input_sha256") != job_input_sha:
                raise WorkerError("JOB_INPUT_MISMATCH", "Changed input requires a new Logical_Job_ID and Run_ID.")
        started_at = prior.get("started_at") if prior else _now()
        pages, reused, created = [], 0, 0

        # Explicit reuse is limited to a completed source run of the same logical job/input.
        reuse_source_dir = job.get("reuse_from_run_dir")
        source_manifest = None
        source_root = None
        if reuse_source_dir:
            source_root = Path(reuse_source_dir).expanduser().resolve()
            source_manifest = _read_object(source_root / "result-manifest.json", "REUSE_SOURCE_INVALID")
            if source_manifest.get("run_id") == run_id:
                raise WorkerError("REUSE_SOURCE_INVALID", "Cross-run reuse requires a different Run_ID.")
            if source_manifest.get("logical_job_id") != logical_id:
                raise WorkerError("REUSE_LOGICAL_JOB_MISMATCH", "Reuse is allowed only within the same Logical_Job_ID.")
            if source_manifest.get("job_input_sha256") != job_input_sha:
                raise WorkerError("REUSE_INPUT_MISMATCH", "Source run input fingerprint differs.")
            if source_manifest.get("run_status") != "COMPLETED":
                raise WorkerError("REUSE_SOURCE_INCOMPLETE", "Only a completed run can be reused.")
            if source_manifest.get("manifest_sha256") != _hash_payload(source_manifest, "manifest_sha256"):
                raise WorkerError("REUSE_SOURCE_CORRUPT", "Source result manifest checksum is invalid.")
            source_page_rows = source_manifest.get("pages", [])
            if len(source_page_rows) != page_count:
                raise WorkerError("REUSE_SOURCE_INCOMPLETE", "Source run does not contain every page unit.")
            source_page_numbers = [p.get("page_number") for p in source_page_rows]
            if sorted(source_page_numbers) != list(range(1, page_count + 1)):
                raise WorkerError("REUSE_SOURCE_INVALID", "Source manifest has duplicate or missing page numbers.")
        source_pages = {p.get("page_number"): p for p in source_manifest.get("pages", [])} if source_manifest else {}

        for number, page in enumerate(reader.pages, 1):
            try:
                text = page.extract_text() or ""
            except Exception as exc:
                raise WorkerError("PAGE_TEXT_EXTRACTION_FAILED", f"Text extraction failed on page {number}.") from exc
            text_sha = sha256_bytes(text.encode("utf-8"))
            unit_input = {
                "catalog_id": catalog_id, "source_sha256": actual_sha, "page_number": number,
                "page_text_sha256": text_sha, "profile": profile, "toolchain": toolchain,
                "worker_version": WORKER_VERSION,
            }
            input_sha = sha256_bytes(canonical_json_bytes(unit_input))
            unit_key = f"page:{number:05d}"
            unit_id = "unit_" + sha256_bytes(f"{run_id}|{UNIT_TYPE}|{unit_key}".encode())[:32]
            artifact = root / "pages" / f"page-{number:05d}.json"
            identity = {"run_id": run_id, "logical_job_id": logical_id, "catalog_id": catalog_id,
                        "run_unit_id": unit_id, "unit_type": UNIT_TYPE, "unit_key": unit_key}
            saved = _verify_unit(artifact, identity, input_sha)
            if saved is None:
                source_page = source_pages.get(number)
                if source_page is not None:
                    relative = Path(source_page.get("artifact_path", ""))
                    if relative.is_absolute() or ".." in relative.parts:
                        raise WorkerError("REUSE_SOURCE_INVALID", "Source artifact path is unsafe.")
                    source_artifact = (source_root / relative).resolve()
                    if source_root not in source_artifact.parents:
                        raise WorkerError("REUSE_SOURCE_INVALID", "Source artifact escapes its run directory.")
                    old = _read_object(source_artifact, "REUSE_SOURCE_INVALID")
                    if old.get("run_id") != source_manifest.get("run_id") or old.get("logical_job_id") != logical_id:
                        raise WorkerError("REUSE_SOURCE_INVALID", "Source page artifact ownership mismatch.")
                    if old.get("run_unit_id") != source_page.get("run_unit_id") or old.get("output_sha256") != source_page.get("output_sha256"):
                        raise WorkerError("REUSE_SOURCE_INVALID", "Source manifest and page artifact do not agree.")
                    if old.get("input_sha256") != source_page.get("input_sha256"):
                        raise WorkerError("REUSE_SOURCE_INVALID", "Source manifest page input fingerprint mismatch.")
                    if old.get("input_sha256") != input_sha or old.get("unit_status") not in {"COMPLETED", "REUSED"}:
                        raise WorkerError("REUSE_INPUT_MISMATCH", "Source page unit is not reusable.")
                    if old.get("output_sha256") != _hash_payload(old, "output_sha256"):
                        raise WorkerError("REUSE_SOURCE_CORRUPT", "Source page artifact checksum is invalid.")
                    if old.get("page_number") != number or old.get("unit_type") != UNIT_TYPE:
                        raise WorkerError("REUSE_SOURCE_INVALID", "Source page artifact identity mismatch.")
                    saved = {
                        "manifest_version": MANIFEST_VERSION, "protocol_version": PROTOCOL_VERSION,
                        "worker_version": WORKER_VERSION, **identity, "run_type": RUN_TYPE,
                        "page_number": number, "unit_status": "REUSED", "input_sha256": input_sha,
                        "source_pdf_sha256": actual_sha, "page_text_sha256": text_sha,
                        "extraction_method": old.get("extraction_method", "EMBEDDED_TEXT"),
                        "extraction_tool_version": toolchain, "text_char_count": old["text_char_count"],
                        "extracted_text": old["extracted_text"],
                        "reused_from_run_unit_id": old["run_unit_id"],
                    }
                    reused += 1
                else:
                    saved = {
                        "manifest_version": MANIFEST_VERSION, "protocol_version": PROTOCOL_VERSION,
                        "worker_version": WORKER_VERSION, **identity, "run_type": RUN_TYPE,
                        "page_number": number, "unit_status": "COMPLETED", "input_sha256": input_sha,
                        "source_pdf_sha256": actual_sha, "page_text_sha256": text_sha,
                        "extraction_method": "EMBEDDED_TEXT", "extraction_tool_version": toolchain,
                        "text_char_count": len(text), "extracted_text": text,
                    }
                saved["output_sha256"] = _hash_payload(saved, "output_sha256")
                created_new = _create_immutable_json(artifact, saved)
                if not created_new:
                    saved = _verify_unit(artifact, identity, input_sha)
                    if saved is None:
                        raise WorkerError("CHECKPOINT_RACE", "Could not verify concurrently-created artifact.")
                elif saved["unit_status"] == "COMPLETED":
                    created += 1
            else:
                reused += 1
            pages.append({
                "run_unit_id": unit_id, "unit_type": UNIT_TYPE, "unit_key": unit_key,
                "page_number": number, "unit_status": saved["unit_status"], "input_sha256": input_sha,
                "output_sha256": saved["output_sha256"], "artifact_path": str(artifact.relative_to(root)),
                "text_char_count": saved["text_char_count"],
                "reused_from_run_unit_id": saved.get("reused_from_run_unit_id"),
            })
            interim = {
                "manifest_version": MANIFEST_VERSION, "protocol_version": PROTOCOL_VERSION,
                "worker_version": WORKER_VERSION, "run_type": RUN_TYPE, "run_id": run_id,
                "logical_job_id": logical_id, "idempotency_key": expected_key,
                "attempt_number": attempt, "parent_run_id": parent, "retry_reason": retry_reason,
                "catalog_id": catalog_id,
                "source_sha256": actual_sha, "job_input_sha256": job_input_sha,
                "page_count": page_count, "completed_units": len(pages), "failed_units": 0,
                "reused_units": reused, "newly_processed_units": created,
                "run_status": "RUNNING", "started_at": started_at, "pages": pages,
            }
            interim["manifest_sha256"] = _hash_payload(interim, "manifest_sha256")
            _atomic_json(manifest_path, interim)

        result = {
            "manifest_version": MANIFEST_VERSION, "protocol_version": PROTOCOL_VERSION,
            "worker_version": WORKER_VERSION, "run_type": RUN_TYPE, "run_id": run_id,
            "logical_job_id": logical_id, "idempotency_key": expected_key,
            "attempt_number": attempt, "parent_run_id": parent, "retry_reason": retry_reason,
            "catalog_id": catalog_id,
            "source_sha256": actual_sha, "job_input_sha256": job_input_sha,
            "page_count": page_count, "completed_units": page_count, "failed_units": 0,
            "reused_units": reused, "newly_processed_units": created, "run_status": "COMPLETED",
            "started_at": started_at, "finished_at": _now(), "pages": pages,
        }
        result["manifest_sha256"] = _hash_payload(result, "manifest_sha256")
        _atomic_json(manifest_path, result)
        return result
