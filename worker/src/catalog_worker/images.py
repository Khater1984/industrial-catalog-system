"""Feature-flagged embedded-image extraction for local DEV catalog jobs.

This module writes content-addressed image artifacts and a checksummed local
image manifest. It never writes to Google Sheets or Google Drive.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import tempfile
from pathlib import Path
from io import BytesIO

from PIL import Image, UnidentifiedImageError
from typing import Any

from pypdf import PdfReader

try:
    import pymupdf as fitz
except ImportError:  # pragma: no cover - declared production dependency
    fitz = None

IMAGE_EXTRACTION_ENV = "CATALOG_WORKER_EXTRACT_IMAGES"
IMAGE_EXTRACTOR_VERSION = "0.2.0"
DEFAULT_MAX_IMAGE_BYTES = 25 * 1024 * 1024


class ImageExtractionError(Exception):
    """Stable image extraction failure."""

    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


def image_extraction_enabled() -> bool:
    """Read the opt-in feature flag; disabled unless explicitly enabled."""
    return os.environ.get(IMAGE_EXTRACTION_ENV, "").strip().lower() in {
        "1", "true", "yes", "on"
    }


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def canonical_json_bytes(value: Any) -> bytes:
    return json.dumps(
        value, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False
    ).encode("utf-8")


def _hash_record(record: dict[str, Any]) -> str:
    payload = dict(record)
    payload.pop("output_sha256", None)
    return sha256_bytes(canonical_json_bytes(payload))


def _safe_extension(name: str) -> str:
    suffix = Path(str(name or "")).suffix.lower()
    allowed = {".jpg", ".jpeg", ".png", ".jp2", ".jpx", ".tif", ".tiff", ".bmp", ".gif", ".webp"}
    return suffix if suffix in allowed else ".bin"


_IMAGE_FORMATS = {
    "JPEG": ("image/jpeg", ".jpg"),
    "PNG": ("image/png", ".png"),
    "WEBP": ("image/webp", ".webp"),
    "GIF": ("image/gif", ".gif"),
    "TIFF": ("image/tiff", ".tiff"),
    "BMP": ("image/bmp", ".bmp"),
    "JPEG2000": ("image/jp2", ".jp2"),
}


def _probe_image(data: bytes) -> dict[str, Any]:
    """Read image properties from actual bytes, never from the filename."""
    try:
        with Image.open(BytesIO(data)) as candidate:
            image_format = (candidate.format or "").upper()
            candidate.verify()
        with Image.open(BytesIO(data)) as image:
            width, height = image.size
            if width < 1 or height < 1 or width > 50000 or height > 50000:
                raise ValueError("Image dimensions are outside the supported range.")
            if width * height > 100000000:
                raise ValueError("Image pixel count exceeds the supported limit.")
            has_alpha = image.mode in {"RGBA", "LA", "PA"} or "transparency" in image.info
        mime_type, extension = _IMAGE_FORMATS.get(
            image_format, ("application/octet-stream", ".bin")
        )
        if mime_type == "application/octet-stream":
            raise ValueError("Image format is not supported for metadata extraction.")
        return {
            "metadata_status": "COMPLETED",
            "mime_type": mime_type,
            "extension": extension,
            "width_px": int(width),
            "height_px": int(height),
            "has_alpha": bool(has_alpha),
        }
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError) as exc:
        return {
            "metadata_status": "FAILED",
            "metadata_error": str(exc)[:300] or "IMAGE_METADATA_UNAVAILABLE",
            "mime_type": "application/octet-stream",
            "extension": ".bin",
            "width_px": None,
            "height_px": None,
            "has_alpha": None,
        }


def _write_immutable(path: Path, data: bytes) -> None:
    """Publish bytes without replacing an existing content-addressed artifact."""
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary = tempfile.mkstemp(prefix="." + path.name + ".", dir=path.parent)
    try:
        with os.fdopen(fd, "wb") as stream:
            stream.write(data)
            stream.flush()
            os.fsync(stream.fileno())
        try:
            os.link(temporary, path)
        except FileExistsError:
            if hashlib.sha256(path.read_bytes()).hexdigest() != hashlib.sha256(data).hexdigest():
                raise ImageExtractionError(
                    "IMAGE_ARTIFACT_CONFLICT", "Existing content-addressed image differs."
                )
    finally:
        try:
            os.unlink(temporary)
        except FileNotFoundError:
            pass


def _atomic_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary = tempfile.mkstemp(prefix="." + path.name + ".", dir=path.parent)
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


def extract_embedded_images(
    pdf_path: str | Path,
    output_dir: str | Path,
    *,
    enabled: bool | None = None,
    catalog_id: str = "local_catalog",
    run_id: str = "local_run",
    catalog_page_ids: list[str] | None = None,
    max_image_bytes: int = DEFAULT_MAX_IMAGE_BYTES,
) -> dict[str, Any]:
    """Extract embedded raster images into immutable, SHA-256-addressed files.

    Extraction is opt-in. The result is a local DEV manifest, not a persisted
    Run_Units or Image_Assets record. The caller must perform server-side import.
    """
    active = image_extraction_enabled() if enabled is None else bool(enabled)
    if not active:
        return {"enabled": False, "image_count": 0, "images": []}
    if isinstance(max_image_bytes, bool) or not isinstance(max_image_bytes, int) or max_image_bytes < 1:
        raise ImageExtractionError("INVALID_IMAGE_LIMIT", "max_image_bytes must be a positive integer.")

    source = Path(pdf_path).expanduser().resolve()
    if not source.is_file():
        raise ImageExtractionError("SOURCE_FILE_NOT_FOUND", "Source PDF does not exist.")
    try:
        reader = PdfReader(str(source), strict=True)
        if reader.is_encrypted:
            raise ImageExtractionError("PDF_ENCRYPTED", "Encrypted PDFs are not supported.")
        page_count = len(reader.pages)
    except ImageExtractionError:
        raise
    except Exception as exc:
        raise ImageExtractionError("PDF_READ_FAILED", "PDF is corrupt or unreadable.") from exc

    if catalog_page_ids is not None:
        if (not isinstance(catalog_page_ids, list) or len(catalog_page_ids) != page_count
                or any(not isinstance(value, str) or not value.strip() for value in catalog_page_ids)
                or len(set(catalog_page_ids)) != page_count):
            raise ImageExtractionError(
                "INVALID_CATALOG_PAGE_IDS", "catalog_page_ids must contain one unique ID per PDF page."
            )

    root = Path(output_dir).expanduser().resolve()
    root.mkdir(parents=True, exist_ok=True)
    images: list[dict[str, Any]] = []
    source_sha = hashlib.sha256(source.read_bytes()).hexdigest()

    if fitz is None:
        raise ImageExtractionError(
            "PDF_IMAGE_ENGINE_UNAVAILABLE",
            "PyMuPDF is required to enumerate image placements in PDF pages.",
        )
    try:
        image_document = fitz.open(str(source))
    except Exception as exc:
        raise ImageExtractionError("PDF_IMAGE_ENGINE_OPEN_FAILED", "Could not open PDF with the image extraction engine.") from exc

    try:
        for page_number, page in enumerate(image_document, start=1):
            try:
                blocks = page.get_text("dict").get("blocks", [])
                page_images = [
                    block for block in blocks
                    if isinstance(block, dict) and block.get("type") == 1
                ]
            except Exception as exc:
                raise ImageExtractionError(
                    "PAGE_IMAGE_ENUMERATION_FAILED", f"Could not enumerate image placements on page {page_number}."
                ) from exc

            catalog_page_id = catalog_page_ids[page_number - 1] if catalog_page_ids else None
            for image_index, image_block in enumerate(page_images, start=1):
                raw = image_block.get("image")
                if isinstance(raw, memoryview):
                    raw = raw.tobytes()
                elif isinstance(raw, bytearray):
                    raw = bytes(raw)
                if not isinstance(raw, bytes) or not raw:
                    raise ImageExtractionError(
                        "IMAGE_DATA_UNAVAILABLE",
                        f"Could not read image placement {image_index} on page {page_number}.",
                    )
                if len(raw) > max_image_bytes:
                    raise ImageExtractionError(
                        "IMAGE_TOO_LARGE",
                        f"Image placement on page {page_number} exceeds the configured size limit.",
                    )

                digest = sha256_bytes(raw)
                image_ext = str(image_block.get("ext") or "bin").lower().lstrip(".")
                original_name = f"image-{image_index}.{image_ext}"
                probe = _probe_image(raw)
                extension = probe["extension"] if probe["metadata_status"] == "COMPLETED" else _safe_extension(original_name)
                relative_path = Path("images") / f"page-{page_number:05d}" / f"{image_index:04d}-{digest}{extension}"
                artifact_path = root / relative_path
                _write_immutable(artifact_path, raw)

                bbox = image_block.get("bbox")
                placement_bbox = None
                if isinstance(bbox, (tuple, list)) and len(bbox) == 4:
                    try:
                        placement_bbox = [round(float(value), 3) for value in bbox]
                    except (TypeError, ValueError):
                        placement_bbox = None

                unit_key = f"{catalog_page_id or 'page-' + str(page_number).zfill(5)}:image:{image_index:04d}:{digest[:16]}"
                record: dict[str, Any] = {
                    "unit_type": "IMAGE",
                    "unit_key": unit_key,
                    "catalog_id": catalog_id,
                    "run_id": run_id,
                    "catalog_page_id": catalog_page_id,
                    "page_number": page_number,
                    "image_index": image_index,
                    "placement_bbox_pdf_points": placement_bbox,
                    "original_name": original_name,
                    "source_type": "CATALOG_EMBEDDED",
                    "mime_type": probe["mime_type"],
                    "width_px": probe["width_px"],
                    "height_px": probe["height_px"],
                    "has_alpha": probe["has_alpha"],
                    "metadata_status": probe["metadata_status"],
                    "metadata_error": probe.get("metadata_error", ""),
                    "quality_status": "UNASSESSED" if probe["metadata_status"] == "COMPLETED" else "NEEDS_REVIEW",
                    "file_size_bytes": len(raw),
                    "sha256": digest,
                    "source_pdf_sha256": source_sha,
                    "extractor_version": IMAGE_EXTRACTOR_VERSION,
                    "artifact_path": relative_path.as_posix(),
                    "unit_status": "COMPLETED",
                }
                record["output_sha256"] = _hash_record(record)
                images.append(record)
    finally:
        image_document.close()

    manifest: dict[str, Any] = {
        "manifest_version": 1,
        "catalog_id": catalog_id,
        "run_id": run_id,
        "source_sha256": source_sha,
        "page_count": page_count,
        "image_count": len(images),
        "feature_flag": IMAGE_EXTRACTION_ENV,
        "extractor_version": IMAGE_EXTRACTOR_VERSION,
        "images": images,
    }
    manifest["manifest_sha256"] = _hash_record(manifest)
    _atomic_json(root / "image-manifest.json", manifest)
    return {"enabled": True, **manifest}


def main() -> int:
    parser = argparse.ArgumentParser(description="Extract embedded PDF images (local DEV; opt-in).")
    parser.add_argument("--pdf", required=True, help="Path to source PDF.")
    parser.add_argument("--output", required=True, help="Output directory.")
    parser.add_argument("--catalog-id", default="local_catalog")
    parser.add_argument("--run-id", default="local_run")
    parser.add_argument("--enable", action="store_true", help="Explicitly enable image extraction.")
    args = parser.parse_args()
    enabled = args.enable or image_extraction_enabled()
    if not enabled:
        parser.error("Image extraction is disabled. Set CATALOG_WORKER_EXTRACT_IMAGES=1 or pass --enable.")
    try:
        result = extract_embedded_images(
            args.pdf, args.output, enabled=True, catalog_id=args.catalog_id, run_id=args.run_id
        )
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0
    except ImageExtractionError as exc:
        print(json.dumps({"ok": False, "error": {"code": exc.code, "message": exc.message}}), flush=True)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
