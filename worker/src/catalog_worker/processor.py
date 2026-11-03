"""Deterministic, resumable page-by-page PDF text extraction.

This first implementation deliberately extracts embedded PDF text only.
It does not perform OCR, infer products, or write directly to Google Sheets.
"""
from __future__ import annotations

import hashlib
import json
import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from pypdf import PdfReader

WORKER_VERSION = "0.1.0"
PROTOCOL_VERSION = "1"


class WorkerError(Exception):
    """A stable, user-safe worker failure."""

    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def canonical_json_bytes(value: Any) -> bytes:
    return json.dumps(
        value, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False
    ).encode("utf-8")


def atomic_write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary = tempfile.mkstemp(prefix=f".{path.name}.", dir=path.parent)
    try:
        with os.fdopen(fd, "wb") as stream:
            stream.write(canonical_json_bytes(value))
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
    except Exception:
        try:
            os.unlink(temporary)
        except FileNotFoundError:
            pass
        raise


def _required_string(manifest: dict[str, Any], key: str) -> str:
    value = manifest.get(key)
    if not isinstance(value, str) or not value.strip():
        raise WorkerError("INVALID_JOB_MANIFEST", f"Missing or invalid field: {key}")
    return value.strip()


def _page_output_path(output_dir: Path, page_number: int) -> Path:
    return output_dir / "pages" / f"page-{page_number:05d}.json"


def _load_reusable_page(path: Path, expected_input_sha: str) -> dict[str, Any] | None:
    if not path.exists():
        return None
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
        claimed_output_sha = payload.pop("output_sha256")
        actual_output_sha = sha256_bytes(canonical_json_bytes(payload))
        if payload.get("input_sha256") != expected_input_sha:
            raise WorkerError("CHECKPOINT_INPUT_MISMATCH", f"Checkpoint input mismatch: {path.name}")
        if claimed_output_sha != actual_output_sha:
            raise WorkerError("CHECKPOINT_OUTPUT_CORRUPT", f"Checkpoint checksum mismatch: {path.name}")
        payload["output_sha256"] = claimed_output_sha
        payload["unit_status"] = "REUSED"
        return payload
    except WorkerError:
        raise
    except (OSError, ValueError, KeyError, TypeError) as exc:
        raise WorkerError("CHECKPOINT_INVALID", f"Invalid page checkpoint: {path.name}") from exc


def process_catalog_job(job: dict[str, Any], output_dir: str | Path) -> dict[str, Any]:
    """Process a local DEV job manifest and return a deterministic result manifest.

    Required job fields: run_id, logical_job_id, catalog_id, source_pdf_path,
    source_sha256. The local path is for the development spike only; production
    jobs must resolve Drive files server-side and pass verified bytes to the worker.
    """
    if not isinstance(job, dict):
        raise WorkerError("INVALID_JOB_MANIFEST", "Job manifest must be a JSON object.")

    run_id = _required_string(job, "run_id")
    logical_job_id = _required_string(job, "logical_job_id")
    catalog_id = _required_string(job, "catalog_id")
    source_path_value = _required_string(job, "source_pdf_path")
    expected_pdf_sha = _required_string(job, "source_sha256").lower()
    if len(expected_pdf_sha) != 64 or any(c not in "0123456789abcdef" for c in expected_pdf_sha):
        raise WorkerError("INVALID_SOURCE_SHA256", "source_sha256 must be a 64-character SHA-256 hex digest.")

    source_path = Path(source_path_value).expanduser().resolve()
    if not source_path.is_file():
        raise WorkerError("SOURCE_FILE_NOT_FOUND", "The local source PDF does not exist.")
    with source_path.open("rb") as stream:
        if stream.read(5) != b"%PDF-":
            raise WorkerError("INVALID_PDF_SIGNATURE", "Source file does not have a PDF signature.")

    actual_pdf_sha = sha256_file(source_path)
    if actual_pdf_sha != expected_pdf_sha:
        raise WorkerError("SOURCE_HASH_MISMATCH", "Source PDF SHA-256 does not match the job manifest.")

    try:
        reader = PdfReader(str(source_path), strict=True)
        if reader.is_encrypted:
            raise WorkerError("PDF_ENCRYPTED", "Password-protected PDFs are not supported in this worker version.")
        page_count = len(reader.pages)
    except WorkerError:
        raise
    except Exception as exc:
        raise WorkerError("PDF_READ_FAILED", "The PDF is corrupt or cannot be read.") from exc

    if page_count < 1:
        raise WorkerError("PDF_HAS_NO_PAGES", "The PDF contains no pages.")

    out = Path(output_dir).expanduser().resolve()
    pages: list[dict[str, Any]] = []
    reused_count = 0
    completed_count = 0
    started_at = datetime.now(timezone.utc).isoformat()

    for page_index, page in enumerate(reader.pages, start=1):
        try:
            extracted_text = page.extract_text() or ""
        except Exception as exc:
            raise WorkerError("PAGE_TEXT_EXTRACTION_FAILED", f"Could not extract embedded text from page {page_index}.") from exc

        text_sha = sha256_bytes(extracted_text.encode("utf-8"))
        unit_input = {
            "catalog_id": catalog_id,
            "source_pdf_sha256": actual_pdf_sha,
            "page_number": page_index,
            "page_text_sha256": text_sha,
            "worker_version": WORKER_VERSION,
            "extraction_method": "EMBEDDED_TEXT",
        }
        unit_input_sha = sha256_bytes(canonical_json_bytes(unit_input))
        unit_key = f"page:{page_index:05d}"
        unit_id = "unit_" + sha256_bytes(f"{run_id}|CATALOG_PAGE|{unit_key}".encode())[:32]
        page_path = _page_output_path(out, page_index)

        existing = _load_reusable_page(page_path, unit_input_sha)
        if existing is not None:
            page_result = existing
            reused_count += 1
        else:
            page_result = {
                "protocol_version": PROTOCOL_VERSION,
                "run_id": run_id,
                "logical_job_id": logical_job_id,
                "catalog_id": catalog_id,
                "run_unit_id": unit_id,
                "unit_type": "CATALOG_PAGE",
                "unit_key": unit_key,
                "page_number": page_index,
                "input_sha256": unit_input_sha,
                "source_pdf_sha256": actual_pdf_sha,
                "page_text_sha256": text_sha,
                "extraction_method": "EMBEDDED_TEXT",
                "extraction_tool_version": f"pypdf/{getattr(__import__('pypdf'), '__version__', 'unknown')}",
                "text_char_count": len(extracted_text),
                "extracted_text": extracted_text,
                "unit_status": "COMPLETED",
            }
            page_result["output_sha256"] = sha256_bytes(canonical_json_bytes(page_result))
            atomic_write_json(page_path, page_result)
            completed_count += 1
        pages.append({
            "run_unit_id": page_result["run_unit_id"],
            "unit_type": "CATALOG_PAGE",
            "unit_key": unit_key,
            "page_number": page_index,
            "unit_status": page_result["unit_status"],
            "input_sha256": page_result["input_sha256"],
            "output_sha256": page_result["output_sha256"],
            "artifact_path": str(page_path.relative_to(out)),
            "text_char_count": page_result["text_char_count"],
        })

        result = {
            "protocol_version": PROTOCOL_VERSION,
            "worker_version": WORKER_VERSION,
            "run_id": run_id,
            "logical_job_id": logical_job_id,
            "catalog_id": catalog_id,
            "source_sha256": actual_pdf_sha,
            "page_count": page_count,
            "completed_units": len(pages),
            "failed_units": 0,
            "reused_units": reused_count,
            "run_status": "RUNNING" if len(pages) < page_count else "COMPLETED",
            "pages": pages,
        }
        atomic_write_json(out / "result-manifest.json", result)

    final_result = {
        "protocol_version": PROTOCOL_VERSION,
        "worker_version": WORKER_VERSION,
        "run_id": run_id,
        "logical_job_id": logical_job_id,
        "catalog_id": catalog_id,
        "source_sha256": actual_pdf_sha,
        "page_count": page_count,
        "completed_units": page_count,
        "failed_units": 0,
        "reused_units": reused_count,
        "newly_processed_units": completed_count,
        "run_status": "COMPLETED",
        "started_at": started_at,
        "finished_at": datetime.now(timezone.utc).isoformat(),
        "pages": pages,
    }
    final_result["manifest_sha256"] = sha256_bytes(canonical_json_bytes(final_result))
    atomic_write_json(out / "result-manifest.json", final_result)
    return final_result
