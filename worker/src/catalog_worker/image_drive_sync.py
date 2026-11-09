"""Upload verified local image artifacts to Google Drive.

Reads the checksummed image-manifest.json produced by images.py,
verifies local bytes, uploads via the existing DriveClient (immutable),
and writes a separate drive-image-manifest.json.

Does not write to Sheets, create Image_Assets, or associate images with products.
"""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
from typing import Any

from catalog_worker.drive_io import DriveClient, DriveError
from catalog_worker.images import canonical_json_bytes, sha256_bytes

IMAGE_DRIVE_FOLDER_ENV = "CATALOG_WORKER_IMAGE_DRIVE_FOLDER_ID"


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
    if not relative or relative.startswith("/") or ".." in Path(relative).parts:
        raise ImageDriveSyncError("PATH_TRAVERSAL", f"Unsafe artifact path: {relative}")
    resolved = (root / relative).resolve()
    root_resolved = root.resolve()
    try:
        resolved.relative_to(root_resolved)
    except ValueError as exc:
        raise ImageDriveSyncError("PATH_TRAVERSAL", f"Path escapes root: {relative}") from exc
    return resolved


def _load_and_validate_manifest(manifest_path: Path) -> dict[str, Any]:
    if not manifest_path.is_file():
        raise ImageDriveSyncError("MANIFEST_NOT_FOUND", f"Manifest not found: {manifest_path}")
    try:
        data = json.loads(manifest_path.read_text(encoding="utf-8"))
    except Exception as exc:
        raise ImageDriveSyncError("MANIFEST_INVALID_JSON", "Manifest is not valid JSON") from exc
    if not isinstance(data, dict) or "images" not in data or "manifest_sha256" not in data:
        raise ImageDriveSyncError("MANIFEST_STRUCTURE_INVALID", "Missing required manifest fields")
    claimed = data["manifest_sha256"]
    actual = _hash_manifest(data)
    if claimed != actual:
        raise ImageDriveSyncError("MANIFEST_CHECKSUM_MISMATCH", "Manifest checksum does not match content")
    return data


def sync_images_to_drive(
    extraction_dir: str | Path,
    *,
    drive_client: DriveClient | None = None,
    folder_id: str | None = None,
) -> dict[str, Any]:
    """Upload images from a local extraction directory to Drive.

    Returns a drive-image-manifest dict and writes drive-image-manifest.json.
    """
    root = Path(extraction_dir).expanduser().resolve()
    if not root.is_dir():
        raise ImageDriveSyncError("EXTRACTION_DIR_NOT_FOUND", "Extraction directory does not exist")

    folder = (folder_id or os.environ.get(IMAGE_DRIVE_FOLDER_ENV) or "").strip()
    if not folder:
        raise ImageDriveSyncError("DRIVE_FOLDER_NOT_CONFIGURED", f"Set {IMAGE_DRIVE_FOLDER_ENV}")

    manifest_path = root / "image-manifest.json"
    source_manifest = _load_and_validate_manifest(manifest_path)

    client = drive_client or DriveClient()
    results: list[dict[str, Any]] = []
    uploaded = 0
    reused = 0
    failed = 0

    for img in source_manifest.get("images", []):
        if not isinstance(img, dict):
            results.append({"upload_status": "FAILED", "error": "INVALID_RECORD"})
            failed += 1
            continue

        rel = img.get("artifact_path") or ""
        try:
            artifact = _safe_resolve(root, rel)
        except ImageDriveSyncError as exc:
            results.append({
                "sha256": img.get("sha256"),
                "artifact_path": rel,
                "upload_status": "FAILED",
                "error": exc.code,
            })
            failed += 1
            continue

        if not artifact.is_file():
            results.append({
                "sha256": img.get("sha256"),
                "artifact_path": rel,
                "upload_status": "FAILED",
                "error": "ARTIFACT_MISSING",
            })
            failed += 1
            continue

        try:
            raw = artifact.read_bytes()
            actual_sha = sha256_bytes(raw)
            claimed_sha = (img.get("sha256") or "").lower()
            if actual_sha != claimed_sha:
                raise ImageDriveSyncError("SHA256_MISMATCH", "Local bytes do not match manifest SHA-256")

            ext = artifact.suffix or ".bin"
            drive_name = f"{actual_sha}{ext}"
            file_id, returned_digest = client.upload_bytes(
                folder, drive_name, raw, img.get("mime_type") or "application/octet-stream",
                immutable=True,
            )
            if returned_digest != actual_sha:
                raise ImageDriveSyncError("DRIVE_CHECKSUM_MISMATCH", "Drive returned different checksum")

            # Heuristic: if the file already existed with matching content, DriveClient reuses it.
            # We treat every successful return as UPLOADED or REUSED; caller can distinguish later if needed.
            status = "UPLOADED"
            uploaded += 1

            record = {
                "sha256": actual_sha,
                "drive_file_id": file_id,
                "original_name": img.get("original_name"),
                "mime_type": img.get("mime_type"),
                "width_px": img.get("width_px"),
                "height_px": img.get("height_px"),
                "file_size_bytes": img.get("file_size_bytes"),
                "has_alpha": img.get("has_alpha"),
                "catalog_id": img.get("catalog_id"),
                "run_id": img.get("run_id"),
                "page_number": img.get("page_number"),
                "catalog_page_id": img.get("catalog_page_id"),
                "artifact_path": rel,
                "upload_status": status,
            }
            results.append(record)
        except (ImageDriveSyncError, DriveError, OSError) as exc:
            code = getattr(exc, "code", None) or "UPLOAD_FAILED"
            results.append({
                "sha256": img.get("sha256"),
                "artifact_path": rel,
                "upload_status": "FAILED",
                "error": code,
            })
            failed += 1

    overall = "COMPLETED" if failed == 0 else ("PARTIAL" if uploaded > 0 else "FAILED")
    out_manifest: dict[str, Any] = {
        "manifest_version": 1,
        "source_manifest_sha256": source_manifest.get("manifest_sha256"),
        "catalog_id": source_manifest.get("catalog_id"),
        "run_id": source_manifest.get("run_id"),
        "drive_folder_id": folder,
        "image_count": len(results),
        "uploaded_count": uploaded,
        "failed_count": failed,
        "overall_status": overall,
        "images": results,
    }
    out_manifest["manifest_sha256"] = _hash_manifest(out_manifest)

    out_path = root / "drive-image-manifest.json"
    out_path.write_text(json.dumps(out_manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    return out_manifest
