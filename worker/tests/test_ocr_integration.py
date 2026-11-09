import hashlib
import json
from pathlib import Path
from unittest.mock import patch

import pytest
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

from catalog_worker.processor import process_catalog_job
from catalog_worker.ocr import OcrError


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _make_text_pdf(path: Path, text: str) -> None:
    c = canvas.Canvas(str(path), pagesize=letter)
    c.drawString(72, 720, text)
    c.showPage()
    c.save()


def _make_blank_pdf(path: Path) -> None:
    c = canvas.Canvas(str(path), pagesize=letter)
    c.showPage()
    c.save()


def _job(pdf: Path, **extra) -> dict:
    return {
        "run_id": "run_test",
        "logical_job_id": "job_test",
        "catalog_id": "cat_test",
        "source_pdf_path": str(pdf),
        "source_sha256": _sha256(pdf),
        **extra,
    }


def test_text_pdf_does_not_call_ocr(tmp_path):
    pdf = tmp_path / "text.pdf"
    _make_text_pdf(pdf, "This is a sufficiently long embedded text string that exceeds the usability threshold for OCR fallback.")
    with patch("catalog_worker.ocr.ocr_page_image") as mock_ocr:
        result = process_catalog_job(_job(pdf), tmp_path / "out")
        mock_ocr.assert_not_called()
    assert result["pages"][0]["extraction_method"] == "embedded_text"


def test_blank_pdf_renders_and_passes_real_image_to_ocr(tmp_path):
    pdf = tmp_path / "blank.pdf"
    _make_blank_pdf(pdf)
    captured = {}

    def capture_ocr(image_path, languages="eng"):
        captured["path"] = Path(image_path)
        assert captured["path"].exists()
        assert captured["path"].suffix == ".png"
        assert captured["path"].stat().st_size > 100
        return {"extracted_text": "OCR from rendered page", "confidence": 80.0, "warnings": []}

    with patch("catalog_worker.ocr.ocr_page_image", side_effect=capture_ocr):
        result = process_catalog_job(_job(pdf, ocr_languages="eng"), tmp_path / "out")

    assert "path" in captured
    assert not captured["path"].exists()  # cleaned up
    assert result["pages"][0]["extraction_method"] == "ocr"
    page_artifact = tmp_path / "out" / "pages" / "page-00001.json"
    saved_page = json.loads(page_artifact.read_text(encoding="utf-8"))
    assert saved_page["extracted_text"] == "OCR from rendered page"
    assert saved_page["text_char_count"] == len("OCR from rendered page")


def test_language_config_reaches_ocr(tmp_path):
    pdf = tmp_path / "blank.pdf"
    _make_blank_pdf(pdf)
    seen = {}

    def capture(image_path, languages="eng"):
        seen["langs"] = languages
        return {"extracted_text": "ok", "confidence": 70, "warnings": []}

    with patch("catalog_worker.ocr.ocr_page_image", side_effect=capture):
        process_catalog_job(_job(pdf, ocr_languages="ara+eng"), tmp_path / "out")

    assert seen.get("langs") == "ara+eng"


def test_rendering_failure_is_warning_not_crash(tmp_path):
    pdf = tmp_path / "blank.pdf"
    _make_blank_pdf(pdf)
    with patch("catalog_worker.processor._render_page_to_temp_image", return_value=None):
        result = process_catalog_job(_job(pdf), tmp_path / "out")
    assert result["run_status"] == "COMPLETED"
    assert result["pages"][0]["extraction_method"] == "embedded_text"
    assert "NO_PAGE_IMAGE_FOR_OCR" in result["pages"][0].get("warnings", [])


def test_temp_images_cleaned_even_on_ocr_exception(tmp_path):
    pdf = tmp_path / "blank.pdf"
    _make_blank_pdf(pdf)
    captured = {}

    def fail_ocr(image_path, languages="eng"):
        captured["path"] = Path(image_path)
        assert captured["path"].exists()
        raise OcrError("OCR_FAILED", "Synthetic OCR failure")

    with patch("catalog_worker.ocr.ocr_page_image", side_effect=fail_ocr):
        result = process_catalog_job(_job(pdf), tmp_path / "out")

    assert result["run_status"] == "COMPLETED"
    assert "path" in captured
    assert not captured["path"].exists()
    assert result["pages"][0]["processing_status"] == "OCR_FAILED"
    assert "OCR_FAILED" in result["pages"][0]["warnings"]
