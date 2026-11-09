# OCR Module (Local Tesseract)

## Purpose

OCR is used **only** for pages that have insufficient embedded text (default threshold: 40 characters). Usable embedded text is never replaced.

## Installation

### Python packages
```bash
cd worker
pip install -e ".[test]"
# or
pip install pytesseract Pillow
```

### Tesseract binary + language packs

**Ubuntu / Debian:**
```bash
sudo apt-get update
sudo apt-get install -y tesseract-ocr tesseract-ocr-eng tesseract-ocr-ara
```

**macOS (Homebrew):**
```bash
brew install tesseract
brew install tesseract-lang  # includes ara and eng
```

**Windows:**  
Download installer from https://github.com/UB-Mannheim/tesseract/wiki and add to PATH. Install Arabic language data.

Verify:
```bash
tesseract --list-langs
# should show eng and ara
```

## Configuration

- Job field `ocr_languages`: `"eng"` | `"ara"` | `"ara+eng"` (default `"eng"`)
- Environment: `CATALOG_WORKER_OCR_LANGUAGES=ara+eng`
- Threshold: `OCR_MIN_USABLE_CHARS` (code default 40)

## Running tests

```bash
cd worker
pytest tests/test_ocr.py -q
```

Most tests mock Tesseract. Real OCR tests require the binary and language packs installed locally.

## Known limitations

- Page images must be supplied by the caller (current integration renders or uses existing page images when available).
- Confidence is average word confidence from Tesseract; not a page-level guarantee.
- No layout analysis or table reconstruction yet.
- Arabic quality depends on scan resolution and language pack version.
- Does not modify source PDFs.
