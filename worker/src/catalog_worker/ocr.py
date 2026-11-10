"""Local Tesseract OCR for pages with insufficient embedded text.

Supports Arabic (ara), English (eng), and ara+eng.
Never replaces usable embedded text. Independent of Google services.
"""
from __future__ import annotations

import os
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Any

try:
    import pytesseract
    from PIL import Image
    PYTESSERACT_AVAILABLE = True
except ImportError:
    PYTESSERACT_AVAILABLE = False

OCR_MIN_USABLE_CHARS = 40
SUPPORTED_LANGS = {"ara", "eng", "ara+eng"}


class OcrError(Exception):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


def tesseract_available() -> bool:
    return shutil.which("tesseract") is not None


def validate_languages(langs: str) -> str:
    cleaned = (langs or "eng").strip().lower()
    if cleaned not in SUPPORTED_LANGS:
        raise OcrError("UNSUPPORTED_OCR_LANGUAGE", f"Supported: {', '.join(sorted(SUPPORTED_LANGS))}. Got: {cleaned}")
    return cleaned


def is_text_usable(text: str, min_chars: int = OCR_MIN_USABLE_CHARS) -> bool:
    return len((text or "").strip()) >= min_chars


def ocr_page_image(image_path: Path, languages: str = "eng") -> dict[str, Any]:
    """Run OCR on a single page image. Returns text + confidence."""
    if not PYTESSERACT_AVAILABLE:
        raise OcrError("PYTESSERACT_NOT_INSTALLED", "pytesseract package is not installed.")
    if not tesseract_available():
        raise OcrError("TESSERACT_NOT_FOUND", "tesseract executable not found in PATH. Install Tesseract and language packs.")

    langs = validate_languages(languages)
    try:
        # image_to_data gives confidence per word
        data = pytesseract.image_to_data(str(image_path), lang=langs, output_type=pytesseract.Output.DICT)
        text = pytesseract.image_to_string(str(image_path), lang=langs).strip()
        confidences = []
        for raw_confidence in data.get("conf", []):
            try:
                confidence_value = float(raw_confidence)
            except (TypeError, ValueError):
                continue
            if confidence_value >= 0:
                confidences.append(confidence_value)
        avg_conf = sum(confidences) / len(confidences) if confidences else None
        return {
            "extracted_text": text,
            "confidence": round(avg_conf, 2) if avg_conf is not None else None,
            "warnings": [],
        }
    except pytesseract.TesseractNotFoundError as exc:
        raise OcrError("TESSERACT_NOT_FOUND", "Tesseract executable not found.") from exc
    except Exception as exc:
        msg = str(exc).lower()
        if "lang" in msg or "language" in msg or "traineddata" in msg:
            raise OcrError("LANGUAGE_PACK_MISSING", f"Language pack missing for '{langs}'. Install tesseract-ocr-{langs.replace('+', '-')} or equivalent.") from exc
        raise OcrError("OCR_FAILED", f"OCR failed: {exc}") from exc


def extract_page_text(
    page_text_embedded: str,
    page_image_path: Path | None,
    *,
    languages: str = "eng",
    force_ocr: bool = False,
    min_usable_chars: int = OCR_MIN_USABLE_CHARS,
) -> dict[str, Any]:
    """Decide embedded vs OCR for one page."""
    usable = is_text_usable(page_text_embedded, min_usable_chars)
    if usable and not force_ocr:
        return {
            "page_number": None,  # filled by caller
            "extraction_method": "embedded_text",
            "extracted_text": page_text_embedded,
            "confidence": None,
            "processing_status": "COMPLETED",
            "warnings": [],
        }

    if page_image_path is None or not page_image_path.exists():
        return {
            "extraction_method": "embedded_text",
            "extracted_text": page_text_embedded or "",
            "confidence": None,
            "processing_status": "COMPLETED",
            "warnings": ["NO_PAGE_IMAGE_FOR_OCR"],
        }

    try:
        ocr_result = ocr_page_image(page_image_path, languages)
        return {
            "extraction_method": "ocr",
            "extracted_text": ocr_result["extracted_text"],
            "confidence": ocr_result["confidence"],
            "processing_status": "COMPLETED",
            "warnings": ocr_result.get("warnings", []),
        }
    except OcrError as exc:
        return {
            "extraction_method": "embedded_text",
            "extracted_text": page_text_embedded or "",
            "confidence": None,
            "processing_status": "OCR_FAILED",
            "warnings": [exc.code, exc.message],
        }
