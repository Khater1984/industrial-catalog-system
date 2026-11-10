import hashlib
import json
from io import BytesIO
from pathlib import Path

import pytest
from PIL import Image, ImageDraw
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

from catalog_worker.images import (
    ImageExtractionError,
    extract_embedded_images,
    image_extraction_enabled,
)


def make_pdf_with_image(path: Path) -> bytes:
    image_buffer = BytesIO()
    Image.new("RGB", (3, 2), (220, 30, 60)).save(image_buffer, format="PNG")
    image_bytes = image_buffer.getvalue()
    pdf = canvas.Canvas(str(path))
    pdf.drawImage(ImageReader(BytesIO(image_bytes)), 72, 720, width=30, height=20)
    pdf.showPage()
    pdf.save()
    return image_bytes


def test_image_extraction_is_disabled_by_default(monkeypatch, tmp_path):
    monkeypatch.delenv("CATALOG_WORKER_EXTRACT_IMAGES", raising=False)
    assert image_extraction_enabled() is False
    result = extract_embedded_images(tmp_path / "missing.pdf", tmp_path / "out")
    assert result == {"enabled": False, "image_count": 0, "images": []}


def test_environment_flag_is_explicit_opt_in(monkeypatch):
    monkeypatch.setenv("CATALOG_WORKER_EXTRACT_IMAGES", "true")
    assert image_extraction_enabled() is True
    monkeypatch.setenv("CATALOG_WORKER_EXTRACT_IMAGES", "0")
    assert image_extraction_enabled() is False


def test_extracts_embedded_image_and_writes_sha256_manifest(tmp_path):
    source = tmp_path / "catalog.pdf"
    image_bytes = make_pdf_with_image(source)
    output = tmp_path / "out"

    result = extract_embedded_images(
        source, output, enabled=True, catalog_id="catalog_test",
        run_id="run_test", catalog_page_ids=["catalog_page_001"]
    )

    assert result["enabled"] is True
    assert result["image_count"] == 1
    image = result["images"][0]
    assert image["unit_type"] == "IMAGE"
    assert image["unit_status"] == "COMPLETED"
    assert image["catalog_page_id"] == "catalog_page_001"
    assert image["source_type"] == "CATALOG_EMBEDDED"
    assert image["sha256"] == hashlib.sha256(image_bytes).hexdigest()
    assert image["metadata_status"] == "COMPLETED"
    assert image["mime_type"] == "image/png"
    assert image["width_px"] == 3
    assert image["height_px"] == 2
    assert image["has_alpha"] is False
    assert image["file_size_bytes"] == len(image_bytes)
    artifact = output / image["artifact_path"]
    assert artifact.read_bytes() == image_bytes

    manifest = json.loads((output / "image-manifest.json").read_text(encoding="utf-8"))
    assert manifest["manifest_sha256"] == result["manifest_sha256"]
    assert manifest["image_count"] == 1


def test_repeat_extraction_is_idempotent_and_does_not_change_image_bytes(tmp_path):
    source = tmp_path / "catalog.pdf"
    make_pdf_with_image(source)
    output = tmp_path / "out"
    first = extract_embedded_images(source, output, enabled=True)
    artifact = output / first["images"][0]["artifact_path"]
    before = artifact.read_bytes()

    second = extract_embedded_images(source, output, enabled=True)

    assert second["manifest_sha256"] == first["manifest_sha256"]
    assert artifact.read_bytes() == before


def test_rejects_page_id_count_mismatch(tmp_path):
    source = tmp_path / "catalog.pdf"
    make_pdf_with_image(source)
    with pytest.raises(ImageExtractionError) as error:
        extract_embedded_images(source, tmp_path / "out", enabled=True, catalog_page_ids=[])
    assert error.value.code == "INVALID_CATALOG_PAGE_IDS"


def test_rejects_invalid_image_size_limit(tmp_path):
    source = tmp_path / "catalog.pdf"
    make_pdf_with_image(source)
    with pytest.raises(ImageExtractionError) as error:
        extract_embedded_images(source, tmp_path / "out", enabled=True, max_image_bytes=0)
    assert error.value.code == "INVALID_IMAGE_LIMIT"


def test_probe_metadata_uses_image_bytes_not_file_extension():
    from catalog_worker.images import _probe_image

    buffer = BytesIO()
    Image.new("RGBA", (7, 5), (10, 20, 30, 100)).save(buffer, format="PNG")
    result = _probe_image(buffer.getvalue())

    assert result["metadata_status"] == "COMPLETED"
    assert result["mime_type"] == "image/png"
    assert result["extension"] == ".png"
    assert result["width_px"] == 7
    assert result["height_px"] == 5
    assert result["has_alpha"] is True


def test_probe_metadata_marks_unsupported_bytes_for_review():
    from catalog_worker.images import _probe_image

    result = _probe_image(b"not-an-image")
    assert result["metadata_status"] == "FAILED"
    assert result["mime_type"] == "application/octet-stream"
    assert result["width_px"] is None
    assert result["height_px"] is None

def test_extracts_full_page_scan_and_product_photo_from_same_page(tmp_path):
    source = tmp_path / "scanned-catalog.pdf"
    scan_buffer = BytesIO()
    scan = Image.new("RGB", (900, 1200), "white")
    scan_draw = ImageDraw.Draw(scan)
    scan_draw.text((60, 80), "INDUSTRIAL CATALOG PAGE 1", fill="black")
    scan.save(scan_buffer, format="PNG")
    scan_bytes = scan_buffer.getvalue()

    photo_buffer = BytesIO()
    Image.new("RGB", (80, 60), (20, 120, 180)).save(photo_buffer, format="PNG")
    photo_bytes = photo_buffer.getvalue()

    pdf = canvas.Canvas(str(source))
    pdf.drawImage(ImageReader(BytesIO(scan_bytes)), 0, 0, width=612, height=792)
    pdf.drawImage(ImageReader(BytesIO(photo_bytes)), 430, 500, width=80, height=60)
    pdf.showPage()
    pdf.save()

    result = extract_embedded_images(source, tmp_path / "out", enabled=True)

    assert result["image_count"] == 2
    extracted_hashes = {row["sha256"] for row in result["images"]}
    assert hashlib.sha256(scan_bytes).hexdigest() in extracted_hashes
    assert hashlib.sha256(photo_bytes).hexdigest() in extracted_hashes
    assert all((tmp_path / "out" / row["artifact_path"]).is_file() for row in result["images"])
