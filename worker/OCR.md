# OCR Module (Local Tesseract + Page Rendering)

## Purpose

OCR is used **only** for pages that have insufficient embedded text (default threshold: 40 characters). Usable embedded text is never replaced.

When OCR is needed, the page is rendered to a temporary PNG (via PyMuPDF) and passed to Tesseract. Temporary files are always cleaned up.

## Installation

### Python packages
```bash
cd worker
pip install -e ".[test]"
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
brew install tesseract-lang
```

**Windows:**  
Download from https://github.com/UB-Mannheim/tesseract/wiki and add to PATH. Install Arabic language data.

Verify:
```bash
tesseract --list-langs
```

## Configuration

- Job field `ocr_languages`: `"eng"` | `"ara"` | `"ara+eng"` (Cloud Run default: `"ara+eng"`).
- Environment: `CATALOG_WORKER_OCR_LANGUAGES=ara+eng`
- Threshold: `OCR_MIN_USABLE_CHARS` (code default 40)
- Render DPI: 240 in the resumable production path. This is included in the toolchain fingerprint so older lower-resolution OCR checkpoints are not reused after the change.

## Running tests

```bash
cd worker
pytest tests/test_ocr.py tests/test_ocr_integration.py -q
```

Integration tests prove that the worker renders a real page image and supplies its path to the OCR function. Most OCR calls are mocked so CI does not require the Tesseract binary. The Cloud Run Docker image installs both Arabic and English Tesseract trained data and verifies their presence during image build.

## Known limitations

- Confidence is average word confidence from Tesseract.
- No layout analysis or table reconstruction.
- Arabic quality depends on scan resolution and language pack.
- Does not modify source PDFs.
- Page rendering requires PyMuPDF.
