"""Upload verified local image artifacts to Google Drive.

Consumes the immutable, checksummed manifest produced by images.py. It writes a
separate checksummed Drive manifest and never mutates source image artifacts.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import tempfile
from pathlib import Path, PureWindowsPath
from typing import Any

from catalog_worker.drive_io import DriveClient, DriveError
from catalog_worker.images import canonical_json_bytes, sha256_bytes

IMAGE_DRIVE_FOLDER_ENV = "CATALOG_WORKER_IMAGE_DRIVE_FOLDER_ID"
_SHA256_RE = re.compile(r"^[a-f0-9]{64}$")
_ALLOWED_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".jp2", ".jpx", ".tif", ".tiff",
    ".bmp", ".gif", ".webp", ".bin",
}


class ImageDriveSyncError(Exception):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


def _hash_manifest(value: dict[str, Any]) -> str:
    payload = dict(value)
    payload.pop("manifest_sha256", None)
    return sha256_bytes(canonical_json_bytes(payload))


def _safe_resolve(root: Path, relative: str) -> Path:
    if (not isinstance(relative, str) or not relative or "\x00" in relative
            or "\\" in relative or PureWindowsPath(relative).drive
            or Path(relative).is_absolute()):
        raise ImageDriveSyncError("PATH_TRAVERSAL", "Artifact path must be a safe relative POSIX path.")
    parts = Path(relative).parts
    if any(part in {"", ".", ".."} for part in parts):
        raise ImageDriveSyncError("PATH_TRAVERSAL", "Artifact path contains an unsafe component.")
    root_resolved = root.resolve()
    resolved = (root_resolved / relative).resolve()
    try:
        resolved.relative_to(root_resolved)
    except ValueError as exc:
        raise ImageDriveSyncError("PATH_TRAVERSAL", "Artifact path escapes extraction directory.") from exc
    return resolved


def _load_and_validate_manifest(manifest_path: Path) -> dict[str, Any]:
    if not manifest_path.is_file():
        raise ImageDriveSyncError("MANIFEST_NOT_FOUND", "image-manifest.json was not found.")
    try:
        data = json.loads(manifest_path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, ValueError) as exc:
        raise ImageDriveSyncError("MANIFEST_INVALID_JSON", "Image manifest is not valid UTF-8 JSON.") from exc
    if not isinstance(data, dict):
        raise ImageDriveSyncError("MANIFEST_STRUCTURE_INVALID", "Image manifest must be an object.")
    if data.get("manifest_version") != 1:
        raise ImageDriveSyncError("MANIFEST_VERSION_UNSUPPORTED", "Unsupported image manifest version.")
    if not isinstance(data.get("catalog_id"), str) or not data["catalog_id"].strip():
        raise ImageDriveSyncError("MANIFEST_STRUCTURE_INVALID", "catalog_id is required.")
    if not isinstance(data.get("run_id"), str) or not data["run_id"].strip():
        raise ImageDriveSyncError("MANIFEST_STRUCTURE_INVALID", "run_id is required.")
    images = data.get("images")
    if not isinstance(images, list) or isinstance(data.get("image_count"), bool) or data.get("image_count") != len(images):
        raise ImageDriveSyncError("MANIFEST_STRUCTURE_INVALID", "images and image_count are inconsistent.")
    claimed = data.get("manifest_sha256")
    if not isinstance(claimed, str) or not _SHA256_RE.fullmatch(claimed.lower()):
        raise ImageDriveSyncError("MANIFEST_CHECKSUM_INVALID", "Manifest SHA-256 must be 64 hexadecimal characters.")
    if claimed.lower() != _hash_manifest(data):
        raise ImageDriveSyncError("MANIFEST_CHECKSUM_MISMATCH", "Manifest checksum does not match content.")
    for index, record in enumerate(images):
        if not isinstance(record, dict):
            raise ImageDriveSyncError("MANIFEST_RECORD_INVALID", f"Image record {index} must be an object.")
    return data


def _atomic_write_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary = tempfile.mkstemp(prefix="." + path.name + ".", dir=path.parent)
    try:
        with os.fdopen(fd, "wb") as stream:
            stream.write(json.dumps(value, ensure_ascii=False, indent=2).encode("utf-8"))
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
    except Exception:
        try:
            os.unlink(temporary)
        except FileNotFoundError:
            pass
        raise


def _error_code(exc: Exception) -> str:
    code = getattr(exc, "code", None)
    return code if isinstance(code, str) and code else "DRIVE_UPLOAD_FAILED"


def sync_images_to_drive(
    extraction_dir: str | Path,
    *,
    drive_client: DriveClient | None = None,
    folder_id: str | None = None,
) -> dict[str, Any]:
    """Upload verified images and persist a checksummed drive-image-manifest.json."""
    root = Path(extraction_dir).expanduser().resolve()
    if not root.is_dir():
        raise ImageDriveSyncError("EXTRACTION_DIR_NOT_FOUND", "Extraction directory does not exist.")
    folder = (folder_id or os.environ.get(IMAGE_DRIVE_FOLDER_ENV) or "").strip()
    if not folder:
        raise ImageDriveSyncError("DRIVE_FOLDER_NOT_CONFIGURED", f"Set {IMAGE_DRIVE_FOLDER_ENV}.")

    source = _load_and_validate_manifest(root / "image-manifest.json")
    client = drive_client or DriveClient()
    if not callable(getattr(client, "upload_bytes_with_status", None)):
        raise ImageDriveSyncError(
            "DRIVE_CLIENT_STATUS_UNSUPPORTED",
            "Drive client must report whether an immutable object was uploaded or reused.",
        )

    results: list[dict[str, Any]] = []
    uploaded = reused = failed = 0
    for index, img in enumerate(source["images"]):
        rel = img.get("artifact_path", "")
        base = {"sha256": img.get("sha256"), "artifact_path": rel}
        try:
            artifact = _safe_resolve(root, rel)
            if not artifact.is_file():
                raise ImageDriveSyncError("ARTIFACT_MISSING", "Referenced image artifact does not exist.")
            raw = artifact.read_bytes()
            actual_sha = sha256_bytes(raw)
            claimed_sha = img.get("sha256")
            if not isinstance(claimed_sha, str) or not _SHA256_RE.fullmatch(claimed_sha.lower()):
                raise ImageDriveSyncError("IMAGE_SHA256_INVALID", "Image record has an invalid SHA-256.")
            if actual_sha != claimed_sha.lower():
                raise ImageDriveSyncError("SHA256_MISMATCH", "Local image bytes differ from manifest SHA-256.")
            expected_size = img.get("file_size_bytes")
            if expected_size is not None and (
                isinstance(expected_size, bool) or not isinstance(expected_size, int) or expected_size != len(raw)
            ):
                raise ImageDriveSyncError("FILE_SIZE_MISMATCH", "Image byte count differs from manifest.")
            suffix = artifact.suffix.lower()
            if suffix not in _ALLOWED_EXTENSIONS:
                suffix = ".bin"
            drive_name = f"{actual_sha}{suffix}"
            mime_type = img.get("mime_type")
            if not isinstance(mime_type, str) or not mime_type.strip():
                mime_type = "application/octet-stream"
            file_id, returned_digest, operation_status = client.upload_bytes_with_status(
                folder, drive_name, raw, mime_type, immutable=True
            )
            if not isinstance(file_id, str) or not file_id.strip():
                raise ImageDriveSyncError("DRIVE_FILE_ID_MISSING", "Drive did not return a file ID.")
            if returned_digest != actual_sha:
                raise ImageDriveSyncError("DRIVE_CHECKSUM_MISMATCH", "Drive checksum differs from local bytes.")
            if operation_status not in {"UPLOADED", "REUSED"}:
                raise ImageDriveSyncError("DRIVE_UPLOAD_STATUS_INVALID", "Drive returned an unknown upload status.")
            uploaded += operation_status == "UPLOADED"
            reused += operation_status == "REUSED"
            results.append({
                **base,
                "drive_file_id": file_id,
                "drive_filename": drive_name,
                "mime_type": mime_type,
                "width_px": img.get("width_px"),
                "height_px": img.get("height_px"),
                "file_size_bytes": len(raw),
                "has_alpha": img.get("has_alpha"),
                "catalog_id": img.get("catalog_id") or source["catalog_id"],
                "run_id": img.get("run_id") or source["run_id"],
                "page_number": img.get("page_number"),
                "catalog_page_id": img.get("catalog_page_id"),
                "upload_status": operation_status,
            })
        except (ImageDriveSyncError, DriveError, OSError) as exc:
            failed += 1
            results.append({**base, "upload_status": "FAILED", "error": _error_code(exc)})
        except Exception as exc:
            # Keep the batch auditable if a provider/client implementation fails unexpectedly.
            failed += 1
            results.append({**base, "upload_status": "FAILED", "error": _error_code(exc)})

    stored = uploaded + reused
    overall = "COMPLETED" if failed == 0 else ("PARTIAL" if stored else "FAILED")
    output: dict[str, Any] = {
        "manifest_version": 1,
        "source_manifest_sha256": source["manifest_sha256"],
        "catalog_id": source["catalog_id"],
        "run_id": source["run_id"],
        "drive_folder_id": folder,
        "image_count": len(results),
        "uploaded_count": uploaded,
        "reused_count": reused,
        "stored_count": stored,
        "failed_count": failed,
        "overall_status": overall,
        "images": results,
    }
    output["manifest_sha256"] = _hash_manifest(output)
    _atomic_write_json(root / "drive-image-manifest.json", output)
    return output
