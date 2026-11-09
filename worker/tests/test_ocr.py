import os
from pathlib import Path
from unittest.mock import patch, MagicMock

import pytest
from catalog_worker.ocr import (
    OcrError,
    extract_page_text,
    is_text_usable,
    tesseract_available,
    validate_languages,
)


def test_usable_text_detection():
    assert is_text_usable("This is a long enough embedded text line for testing purposes.") is True
    assert is_text_usable("short") is False
    assert is_text_usable("") is False


def test_validate_languages():
    assert validate_languages("eng") == "eng"
    assert validate_languages("ara+eng") == "ara+eng"
    with pytest.raises(OcrError) as e:
        validate_languages("fra")
    assert e.value.code == "UNSUPPORTED_OCR_LANGUAGE"


def test_prefers_embedded_when_usable(tmp_path):
    result = extract_page_text("Sufficient embedded text here that is longer than threshold.", None)
    assert result["extraction_method"] == "embedded_text"
    assert "Sufficient" in result["extracted_text"]
    assert result["processing_status"] == "COMPLETED"


def test_ocr_fallback_when_text_insufficient(tmp_path):
    img = tmp_path / "page.png"
    img.write_bytes(b"fake")
    with patch("catalog_worker.ocr.ocr_page_image") as mock_ocr:
        mock_ocr.return_value = {"extracted_text": "OCR result text", "confidence": 87.5, "warnings": []}
        result = extract_page_text("x", img, languages="eng")
        assert result["extraction_method"] == "ocr"
        assert result["extracted_text"] == "OCR result text"
        assert result["confidence"] == 87.5


def test_ocr_failure_does_not_lose_embedded(tmp_path):
    img = tmp_path / "page.png"
    img.write_bytes(b"fake")
    with patch("catalog_worker.ocr.ocr_page_image") as mock_ocr:
        mock_ocr.side_effect = OcrError("TESSERACT_NOT_FOUND", "missing")
        result = extract_page_text("partial", img)
        assert result["processing_status"] == "OCR_FAILED"
        assert "partial" in result["extracted_text"]
        assert "TESSERACT_NOT_FOUND" in result["warnings"]


def test_missing_tesseract_reported():
    with patch("catalog_worker.ocr.shutil.which", return_value=None):
        assert tesseract_available() is False


def test_language_pack_error_message(tmp_path):
    img = tmp_path / "page.png"
    img.write_bytes(b"fake")
    with patch("catalog_worker.ocr.ocr_page_image") as mock_ocr:
        mock_ocr.side_effect = OcrError("LANGUAGE_PACK_MISSING", "ara pack missing")
        result = extract_page_text("", img, languages="ara")
        assert result["processing_status"] == "OCR_FAILED"
        assert any("LANGUAGE_PACK_MISSING" in w for w in result["warnings"])
