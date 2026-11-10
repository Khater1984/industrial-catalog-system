from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from reportlab.pdfgen import canvas

from catalog_worker.ocr import ocr_page_image, tesseract_available
from catalog_worker.resumable import process_resumable_catalog_job, sha256_file


def _make_blank_pdf(path: Path) -> None:
    pdf = canvas.Canvas(str(path))
    pdf.showPage()
    pdf.save()


def _job_for(path: Path) -> dict:
    data = {
        "run_id": "ocr_run_001",
        "logical_job_id": "ocr_job_001",
        "catalog_id": "ocr_catalog_001",
        "source_pdf_path": str(path),
        "source_sha256": sha256_file(path),
        "attempt_number": 1,
        "catalog_page_ids": ["ocr_catalog_page_001"],
        "ocr_languages": "ara+eng",
    }
    identity = "|".join([
        data["logical_job_id"], data["run_id"], "1", "", "", data["source_sha256"]
    ])
    data["idempotency_key"] = hashlib.sha256(identity.encode()).hexdigest()
    return data


def test_resumable_drive_engine_uses_ocr_and_emits_product_candidates(monkeypatch, tmp_path):
    source = tmp_path / "scan.pdf"
    _make_blank_pdf(source)
    rendered = tmp_path / "rendered-page.png"
    Image.new("RGB", (32, 32), "white").save(rendered)

    def fake_render(pdf_path, page_index):
        assert pdf_path == source.resolve()
        assert page_index == 0
        return rendered

    def fake_ocr(embedded_text, image_path, *, languages, min_usable_chars):
        assert embedded_text == ""
        assert image_path == rendered
        assert image_path.is_file()
        assert languages == "ara+eng"
        assert min_usable_chars == 40
        return {
            "extraction_method": "ocr",
            "extracted_text": (
                "Industrial Diesel Generator Set\n"
                "Model: DG-100\n"
                "Power: 100 kVA"
            ),
            "confidence": 91.5,
            "processing_status": "COMPLETED",
            "warnings": [],
        }

    monkeypatch.setattr("catalog_worker.resumable._render_page_to_temp_image", fake_render)
    monkeypatch.setattr("catalog_worker.resumable.extract_page_text", fake_ocr)

    output = tmp_path / "out"
    result = process_resumable_catalog_job(_job_for(source), output)

    page = json.loads((output / "pages" / "page-00001.json").read_text(encoding="utf-8"))
    assert result["run_status"] == "COMPLETED"
    assert page["extraction_method"] == "OCR"
    assert page["ocr_confidence"] == 91.5
    assert page["product_candidates"]["products"]
    assert page["product_candidates"]["variants"][0]["proposed_model_number"] == "DG-100"
    assert page["product_candidates"]["specifications"][0]["attribute_key_raw"].lower() == "power"
    assert page["candidate_counts"] == {"products": 1, "variants": 1, "specifications": 1}
    assert result["candidate_counts"] == page["candidate_counts"]
    assert result["pages"][0]["catalog_page_id"] == "ocr_catalog_page_001"
    assert not rendered.exists()


def test_resumable_engine_keeps_embedded_text_without_rendering(monkeypatch, tmp_path):
    from reportlab.pdfgen import canvas

    source = tmp_path / "embedded.pdf"
    pdf = canvas.Canvas(str(source))
    pdf.drawString(72, 720, "Industrial generator model DG-100 with rated output of 100 kVA.")
    pdf.showPage()
    pdf.save()

    def unexpected_render(*args, **kwargs):
        raise AssertionError("OCR rendering should not run for usable embedded text")

    monkeypatch.setattr("catalog_worker.resumable._render_page_to_temp_image", unexpected_render)
    result = process_resumable_catalog_job(_job_for(source), tmp_path / "out")
    page = json.loads((tmp_path / "out" / "pages" / "page-00001.json").read_text(encoding="utf-8"))

    assert result["run_status"] == "COMPLETED"
    assert page["extraction_method"] == "EMBEDDED_TEXT"
    assert "DG-100" in page["extracted_text"]


def test_real_tesseract_arabic_english_runtime_smoke(tmp_path):
    import pytest

    if not tesseract_available():
        pytest.skip("Tesseract is not installed in this environment")

    image = Image.new("RGB", (1800, 360), "white")
    draw = ImageDraw.Draw(image)
    font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    font = ImageFont.truetype(font_path, 72)
    draw.text((60, 90), "INDUSTRIAL GENERATOR MODEL DG-100", fill="black", font=font)
    path = tmp_path / "ocr-smoke.png"
    image.save(path)

    result = ocr_page_image(path, languages="ara+eng")
    normalized = result["extracted_text"].upper()
    assert "GENERATOR" in normalized
    assert "DG-100" in normalized
    assert result["confidence"] is not None
