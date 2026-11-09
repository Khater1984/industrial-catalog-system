# Catalog Worker (DEV)

Local resumable PDF extraction worker for industrial catalogs.

## Current capabilities (v0.2.2)

- Page-by-page embedded text extraction with checkpoints.
- Optional OCR fallback (local Tesseract) for pages with insufficient embedded text.
- Supports Arabic (`ara`), English (`eng`), and `ara+eng`.
- Optional embedded image extraction (feature-flagged or job flag).
- SHA-256 content addressing for images and manifests.
- Local review server (Flask) with image thumbnails.
- Heuristic product/model/spec candidate extraction (rule-based, no external AI).
- Staging promotion path to Apps Script / Sheets V2.1 (existing).

## Run locally

```bash
cd worker
pip install -e ".[test]"
python -m catalog_worker.processor ...  # or via CLI
python -m catalog_worker.review_server --staging staging.json --catalog ./output
```

### OCR setup

See [OCR.md](OCR.md) for Tesseract installation, language packs (ara/eng), and configuration.

Set job field `ocr_languages` to `"ara"`, `"eng"`, or `"ara+eng"`, or environment variable `CATALOG_WORKER_OCR_LANGUAGES`.

Set `CATALOG_WORKER_EXTRACT_IMAGES=1` or pass `extract_images: true` in the job to enable images.

## Limitations

- OCR requires local Tesseract binary + language packs; not bundled.
- Page image rendering for OCR is not yet fully automated in the main path (graceful fallback).
- Image upload to Google Drive and full Image_Assets registration is prepared in schema but not fully automated from the worker (requires Apps Script / service account).
- Product understanding is heuristic only; human review is mandatory.
- Not a production service; local DEV prototype.

See WORKER_SPEC.md and schema/02-documents-and-images.md for the target design.
