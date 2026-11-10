"""V2.1 resumable local DEV worker implementation.

This module is intentionally separate from the original 0.1 processor while the
new protocol is being validated. It does not access Drive or write to Sheets.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import shutil
import socket
import tempfile
import uuid
import unicodedata
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable

import pypdf
from pypdf import PdfReader

try:
    import pymupdf as fitz
    PYMUPDF_AVAILABLE = True
except ImportError:
    fitz = None
    PYMUPDF_AVAILABLE = False

from .ocr import extract_page_text, is_text_usable
from .product_extractor import extract_candidates

OCR_RENDER_DPI = 240

WORKER_VERSION = "0.2.5"
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


def _normalize_json(value: Any) -> Any:
    if isinstance(value, str):
        return unicodedata.normalize("NFC", value)
    if isinstance(value, list):
        return [_normalize_json(item) for item in value]
    if isinstance(value, dict):
        normalized = {}
        for key, item in value.items():
            normalized_key = unicodedata.normalize("NFC", str(key))
            if normalized_key in normalized:
                raise ValueError("Canonical JSON key collision after NFC normalization")
            normalized[normalized_key] = _normalize_json(item)
        return normalized
    return value


def canonical_json_bytes(value: Any) -> bytes:
    return json.dumps(_normalize_json(value), ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False).encode("utf-8")


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


def _lock_owner_is_alive(owner_path: Path) -> bool:
    """Return True only when a same-host owner PID is demonstrably alive."""
    try:
        owner = json.loads(owner_path.read_text(encoding="utf-8"))
    except (OSError, ValueError, TypeError) as exc:
        raise WorkerError("RUN_LOCK_UNVERIFIABLE", "Existing lock has no readable owner; inspect and remove it manually if stale.") from exc
    pid = owner.get("pid")
    host = owner.get("host")
    if isinstance(pid, bool) or not isinstance(pid, int) or pid < 1 or host != socket.gethostname():
        raise WorkerError("RUN_LOCK_UNVERIFIABLE", "Existing lock owner cannot be verified on this host.")
    try:
        os.kill(pid, 0)
        return True
    except ProcessLookupError:
        return False
    except PermissionError:
        return True
    except OSError as exc:
        # Unknown OS errors fail closed rather than risking two writers.
        raise WorkerError("RUN_LOCK_UNVERIFIABLE", "Could not verify existing lock owner.") from exc


@contextmanager
def _lock(root: Path):
    lock = root / ".worker.lock"
    try:
        lock.mkdir()
    except FileExistsError as exc:
        owner_path = lock / "owner.json"
        if _lock_owner_is_alive(owner_path):
            raise WorkerError("RUN_LOCKED", "Output directory is already being processed.") from exc
        # Rename is atomic on the same filesystem. Only one contender can claim
        # the stale directory; another contender will fail to create the lock.
        stale = root / (".worker.lock.stale." + uuid.uuid4().hex)
        try:
            os.rename(lock, stale)
        except OSError as rename_error:
            raise WorkerError("RUN_LOCK_RETRY", "Stale lock changed concurrently; retry the job.") from rename_error
        shutil.rmtree(stale, ignore_errors=True)
        try:
            lock.mkdir()
        except FileExistsError as retry_error:
            raise WorkerError("RUN_LOCKED", "Another worker acquired the output directory.") from retry_error
    try:
        owner = {"pid": os.getpid(), "host": socket.gethostname(), "at": _now()}
        (lock / "owner.json").write_bytes(canonical_json_bytes(owner))
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



def _verify_completed_manifest(root: Path, manifest: dict[str, Any], run_id: str,
                               logical_id: str, catalog_id: str, page_count: int) -> None:
    pages = manifest.get("pages")
    if not isinstance(pages, list) or len(pages) != page_count:
        raise WorkerError("RESULT_MANIFEST_INVALID", "Completed manifest page list does not match page count.")
    for index, row in enumerate(pages, 1):
        if not isinstance(row, dict) or row.get("page_number") != index:
            raise WorkerError("RESULT_MANIFEST_INVALID", "Completed manifest page order is invalid.")
        relative = row.get("artifact_path")
        if not isinstance(relative, str):
            raise WorkerError("RESULT_MANIFEST_INVALID", "Completed manifest artifact path is missing.")
        relative_path = Path(relative)
        if relative_path.is_absolute() or ".." in relative_path.parts:
            raise WorkerError("RESULT_MANIFEST_INVALID", "Completed manifest contains an unsafe artifact path.")
        artifact = (root / relative_path).resolve()
        if root not in artifact.parents:
            raise WorkerError("RESULT_MANIFEST_INVALID", "Artifact path escapes the output directory.")
        identity = {
            "run_id": run_id, "logical_job_id": logical_id, "catalog_id": catalog_id,
            "run_unit_id": row.get("run_unit_id"), "unit_type": UNIT_TYPE, "unit_key": row.get("unit_key"),
        }
        unit = _read_object(artifact, "CHECKPOINT_INVALID")
        for key, expected in identity.items():
            if unit.get(key) != expected:
                raise WorkerError("CHECKPOINT_CONFLICT", f"Completed artifact identity mismatch: {key}")
        if unit.get("unit_status") not in {"COMPLETED", "REUSED"}:
            raise WorkerError("CHECKPOINT_NOT_COMPLETED", "Completed run references a non-completed unit.")
        if unit.get("input_sha256") != row.get("input_sha256"):
            raise WorkerError("CHECKPOINT_INPUT_MISMATCH", "Completed artifact input does not match its manifest.")
        if unit.get("output_sha256") != row.get("output_sha256") or unit.get("output_sha256") != _hash_payload(unit, "output_sha256"):
            raise WorkerError("CHECKPOINT_OUTPUT_CORRUPT", "Completed artifact checksum does not match its manifest.")


def _render_page_to_temp_image(source_pdf: Path, page_index: int) -> Path | None:
    """Render one PDF page for OCR; the caller deletes the returned image."""
    if not PYMUPDF_AVAILABLE:
        return None
    try:
        document = fitz.open(str(source_pdf))
        try:
            if page_index < 0 or page_index >= document.page_count:
                return None
            pixmap = document[page_index].get_pixmap(dpi=OCR_RENDER_DPI, alpha=False)
            fd, filename = tempfile.mkstemp(prefix=f"catalog-ocr-{page_index + 1:05d}-", suffix=".png")
            os.close(fd)
            image_path = Path(filename)
            try:
                pixmap.save(str(image_path))
                return image_path
            except Exception:
                image_path.unlink(missing_ok=True)
                return None
        finally:
            document.close()
    except Exception:
        return None


def _extract_page_text(
    source_pdf: Path, page_index: int, embedded_text: str, languages: str,
    min_usable_chars: int,
) -> dict[str, Any]:
    """Use embedded text when usable; otherwise render and attempt configured OCR."""
    if is_text_usable(embedded_text, min_usable_chars):
        return extract_page_text(
            embedded_text, None, languages=languages, min_usable_chars=min_usable_chars
        )
    image_path = _render_page_to_temp_image(source_pdf, page_index)
    try:
        return extract_page_text(
            embedded_text, image_path, languages=languages, min_usable_chars=min_usable_chars
        )
    finally:
        if image_path is not None:
            image_path.unlink(missing_ok=True)


def process_resumable_catalog_job(
    job: dict[str, Any],
    output_dir: str | Path,
    artifact_callback: Callable[[dict[str, Any], Path], None] | None = None,
) -> dict[str, Any]:
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
        parent = _safe_id(parent.strip(), "parent_run_id")
        if not isinstance(retry_reason, str) or not retry_reason.strip() or len(retry_reason.strip()) > 1000:
            raise WorkerError("INVALID_RUN_LINEAGE", "Retry_Reason is required for attempts after the first (maximum 1000 characters).")
        retry_reason = retry_reason.strip()
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

    # The application creates stable Catalog_Pages identities before dispatching
    # a worker job. Use those IDs as Run_Units.Unit_Key whenever supplied.
    raw_page_ids = job.get("catalog_page_ids")
    if raw_page_ids is None:
        catalog_page_ids = None  # local-only fallback; production job manifests should supply IDs
    else:
        if (not isinstance(raw_page_ids, list) or len(raw_page_ids) != page_count
                or any(not isinstance(value, str) or not value.strip() or len(value.strip()) > 180
                       for value in raw_page_ids)):
            raise WorkerError("INVALID_CATALOG_PAGE_IDS", "catalog_page_ids must contain one non-empty ID per PDF page.")
        catalog_page_ids = [value.strip() for value in raw_page_ids]
        if len(set(catalog_page_ids)) != page_count:
            raise WorkerError("INVALID_CATALOG_PAGE_IDS", "catalog_page_ids must be unique within the catalog.")

    profile = job.get("extraction_profile", "embedded-text-v1")
    if not isinstance(profile, str) or not profile.strip():
        raise WorkerError("INVALID_JOB_MANIFEST", "extraction_profile must be a non-empty string.")
    ocr_languages = job.get("ocr_languages") or os.environ.get("CATALOG_WORKER_OCR_LANGUAGES", "ara+eng")
    if not isinstance(ocr_languages, str) or not ocr_languages.strip():
        raise WorkerError("INVALID_OCR_LANGUAGE", "ocr_languages must be a non-empty string.")
    ocr_languages = ocr_languages.strip().lower()
    if ocr_languages not in {"ara", "eng", "ara+eng"}:
        raise WorkerError("INVALID_OCR_LANGUAGE", "Supported OCR languages are ara, eng, and ara+eng.")
    min_usable_chars = job.get("ocr_min_usable_chars", 40)
    if isinstance(min_usable_chars, bool) or not isinstance(min_usable_chars, int) or min_usable_chars < 1:
        raise WorkerError("INVALID_OCR_THRESHOLD", "ocr_min_usable_chars must be a positive integer.")
    toolchain = (
        f"pypdf/{getattr(pypdf, '__version__', 'unknown')}|"
        f"pymupdf/{getattr(fitz, 'VersionBind', 'unavailable')}|"
        f"ocr/{ocr_languages}/min-chars-{min_usable_chars}/render-dpi-{OCR_RENDER_DPI}|product-extractor/heuristic-v1"
    )
    logical_input = {
        "catalog_id": catalog_id, "source_sha256": actual_sha, "page_count": page_count,
        "run_type": RUN_TYPE, "unit_type": UNIT_TYPE, "profile": profile,
        "toolchain": toolchain, "worker_version": WORKER_VERSION,
        "catalog_page_ids": catalog_page_ids,
    }
    job_input_sha = sha256_bytes(canonical_json_bytes(logical_input))
    # Run_Log.Idempotency_Key is unique per attempt, not per logical job.
    # Unique per Run_Log attempt, as required by the schema.
    expected_key = sha256_bytes(
        f"{logical_id}|{run_id}|{attempt}|{parent or ''}|{retry_reason or ''}|{actual_sha}".encode()
    )
    if job.get("idempotency_key") != expected_key:
        raise WorkerError("IDEMPOTENCY_KEY_MISMATCH", "Idempotency key does not match the Run_Log attempt identity.")

    root = Path(output_dir).expanduser().resolve()
    root.mkdir(parents=True, exist_ok=True)
    with _lock(root):
        manifest_path = root / "result-manifest.json"
        prior = None
        if manifest_path.exists():
            prior = _read_object(manifest_path, "RESULT_MANIFEST_INVALID")
            if prior.get("manifest_sha256") != _hash_payload(prior, "manifest_sha256"):
                raise WorkerError("RESULT_MANIFEST_CORRUPT", "Result manifest checksum is invalid.")
            if prior.get("job_input_sha256") != job_input_sha:
                raise WorkerError("JOB_INPUT_MISMATCH", "Changed input requires a new Logical_Job_ID and Run_ID.")
            expected_run_identity = {
                "run_id": run_id, "logical_job_id": logical_id, "attempt_number": attempt,
                "parent_run_id": parent, "retry_reason": retry_reason,
                "idempotency_key": expected_key, "catalog_id": catalog_id,
                "source_sha256": actual_sha,
            }
            for key, expected in expected_run_identity.items():
                if prior.get(key) != expected:
                    raise WorkerError("RESULT_MANIFEST_CONFLICT", f"Existing result manifest conflicts on {key}.")
            if prior.get("run_status") in {"FAILED", "CANCELLED"}:
                raise WorkerError("TERMINAL_RUN_CANNOT_RESUME", "A terminal run cannot be reopened; create a new Run_ID.")
            if prior.get("run_status") == "COMPLETED":
                _verify_completed_manifest(root, prior, run_id, logical_id, catalog_id, page_count)
                return prior
            if prior.get("run_status") != "RUNNING":
                raise WorkerError("RESULT_MANIFEST_CONFLICT", "Only a RUNNING run can resume.")
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
            # A retry may reuse only the immediately preceding attempt, never an
            # arbitrary older run from the same logical job.
            if attempt <= 1 or not parent:
                raise WorkerError("REUSE_SOURCE_NOT_PARENT", "Cross-run reuse is valid only for a retry attempt.")
            if source_manifest.get("run_id") != parent:
                raise WorkerError("REUSE_SOURCE_NOT_PARENT", "Reuse source must equal Parent_Run_ID.")
            if source_manifest.get("attempt_number") != attempt - 1:
                raise WorkerError("REUSE_SOURCE_NOT_PARENT", "Reuse source must be the immediately preceding attempt.")
            if source_manifest.get("run_type") != RUN_TYPE:
                raise WorkerError("REUSE_SOURCE_INVALID", "Reuse source Run_Type does not match.")
            if source_manifest.get("catalog_id") != catalog_id or source_manifest.get("source_sha256") != actual_sha:
                raise WorkerError("REUSE_INPUT_MISMATCH", "Reuse source catalog or source PDF does not match.")
            if source_manifest.get("job_input_sha256") != job_input_sha:
                raise WorkerError("REUSE_INPUT_MISMATCH", "Source run input fingerprint differs.")
            if source_manifest.get("run_status") != "COMPLETED":
                raise WorkerError("REUSE_SOURCE_INCOMPLETE", "Only a completed run can be reused.")
            if source_manifest.get("manifest_sha256") != _hash_payload(source_manifest, "manifest_sha256"):
                raise WorkerError("REUSE_SOURCE_CORRUPT", "Source result manifest checksum is invalid.")
            source_page_rows = source_manifest.get("pages", [])
            if not isinstance(source_page_rows, list) or any(not isinstance(p, dict) for p in source_page_rows):
                raise WorkerError("REUSE_SOURCE_INVALID", "Source result manifest page list is malformed.")
            if len(source_page_rows) != page_count:
                raise WorkerError("REUSE_SOURCE_INCOMPLETE", "Source run does not contain every page unit.")
            source_page_numbers = [p.get("page_number") for p in source_page_rows]
            if any(isinstance(n, bool) or not isinstance(n, int) for n in source_page_numbers):
                raise WorkerError("REUSE_SOURCE_INVALID", "Source manifest contains an invalid page number.")
            if sorted(source_page_numbers) != list(range(1, page_count + 1)):
                raise WorkerError("REUSE_SOURCE_INVALID", "Source manifest has duplicate or missing page numbers.")
        source_pages = {p.get("page_number"): p for p in source_manifest.get("pages", [])} if source_manifest else {}

        for number, page in enumerate(reader.pages, 1):
            try:
                embedded_text = page.extract_text() or ""
            except Exception as exc:
                raise WorkerError("PAGE_TEXT_EXTRACTION_FAILED", f"Text extraction failed on page {number}.") from exc
            decision = _extract_page_text(
                source, number - 1, embedded_text, ocr_languages, min_usable_chars
            )
            text = decision.get("extracted_text") or ""
            candidates = extract_candidates(text, number, catalog_page_ids[number - 1] if catalog_page_ids else None)
            candidate_counts = {
                "products": len(candidates.get("products", [])),
                "variants": len(candidates.get("variants", [])),
                "specifications": len(candidates.get("specifications", [])),
            }
            text_sha = sha256_bytes(text.encode("utf-8"))
            catalog_page_id = catalog_page_ids[number - 1] if catalog_page_ids else None
            unit_key = catalog_page_id or f"page:{number:05d}"
            unit_input = {
                "catalog_id": catalog_id, "catalog_page_id": catalog_page_id,
                "source_sha256": actual_sha, "page_number": number,
                "page_text_sha256": text_sha, "profile": profile, "toolchain": toolchain,
                "worker_version": WORKER_VERSION,
            }
            input_sha = sha256_bytes(canonical_json_bytes(unit_input))
            unit_id = "unit_" + sha256_bytes(f"{run_id}|{UNIT_TYPE}|{unit_key}".encode())[:32]
            artifact = root / "pages" / f"page-{number:05d}.json"
            identity = {"run_id": run_id, "logical_job_id": logical_id, "catalog_id": catalog_id,
                        "catalog_page_id": catalog_page_id, "run_unit_id": unit_id,
                        "unit_type": UNIT_TYPE, "unit_key": unit_key}
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
                        "page_number": number, "catalog_page_id": catalog_page_id,
                        "unit_status": "REUSED", "input_sha256": input_sha,
                        "source_pdf_sha256": actual_sha, "page_text_sha256": text_sha,
                        "extraction_method": old.get("extraction_method", "EMBEDDED_TEXT"),
                        "extraction_tool_version": toolchain, "text_char_count": old["text_char_count"],
                        "extracted_text": old["extracted_text"],
                        "ocr_confidence": old.get("ocr_confidence"),
                        "processing_status": old.get("processing_status", "COMPLETED"),
                        "warnings": old.get("warnings", []),
                        "product_candidates": old.get("product_candidates", {"products": [], "variants": [], "specifications": []}),
                        "candidate_counts": old.get("candidate_counts", {"products": 0, "variants": 0, "specifications": 0}),
                        "reused_from_run_unit_id": old["run_unit_id"],
                    }
                    reused += 1
                else:
                    saved = {
                        "manifest_version": MANIFEST_VERSION, "protocol_version": PROTOCOL_VERSION,
                        "worker_version": WORKER_VERSION, **identity, "run_type": RUN_TYPE,
                        "page_number": number, "catalog_page_id": catalog_page_id,
                        "unit_status": "COMPLETED", "input_sha256": input_sha,
                        "source_pdf_sha256": actual_sha, "page_text_sha256": text_sha,
                        "extraction_method": str(decision.get("extraction_method", "embedded_text")).upper(),
                        "extraction_tool_version": toolchain,
                        "text_char_count": len(text), "extracted_text": text,
                        "ocr_confidence": decision.get("confidence"),
                        "processing_status": decision.get("processing_status", "COMPLETED"),
                        "warnings": decision.get("warnings", []),
                        "product_candidates": candidates,
                        "candidate_counts": candidate_counts,
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
            page_result = {
                "run_unit_id": unit_id, "unit_type": UNIT_TYPE, "unit_key": unit_key,
                "catalog_page_id": catalog_page_id, "page_number": number, "unit_status": saved["unit_status"], "input_sha256": input_sha,
                "output_sha256": saved["output_sha256"], "artifact_path": str(artifact.relative_to(root)),
                "text_char_count": saved["text_char_count"],
                "extraction_method": saved.get("extraction_method", "EMBEDDED_TEXT"),
                "processing_status": saved.get("processing_status", "COMPLETED"),
                "warnings": saved.get("warnings", []),
                "candidate_counts": saved.get("candidate_counts", {"products": 0, "variants": 0, "specifications": 0}),
                "reused_from_run_unit_id": saved.get("reused_from_run_unit_id"),
            }
            # Publish each immutable checkpoint before moving to the next page.
            # A Cloud Tasks retry can then restore completed page artifacts from Drive.
            if artifact_callback is not None:
                artifact_callback(dict(page_result), artifact)
            pages.append(page_result)
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
            "reused_units": reused, "newly_processed_units": created,
            "candidate_counts": {
                "products": sum(p.get("candidate_counts", {}).get("products", 0) for p in pages),
                "variants": sum(p.get("candidate_counts", {}).get("variants", 0) for p in pages),
                "specifications": sum(p.get("candidate_counts", {}).get("specifications", 0) for p in pages),
            },
            "run_status": "COMPLETED",
            "started_at": started_at, "finished_at": _now(), "pages": pages,
        }
        result["manifest_sha256"] = _hash_payload(result, "manifest_sha256")
        _atomic_json(manifest_path, result)
        return result
