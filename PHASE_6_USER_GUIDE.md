# Phase 6 User Guide (DEV)

## Generating a PDF
1. Prepare an issue snapshot JSON (see `worker/tests/test_pdf_phase6.py` for structure).
2. Run:
   ```bash
   catalog-pdf-render --snapshot snapshot.json --output out.pdf --report preflight.json
   ```
3. Open the resulting PDF. It is a real PDF/A-compatible ReportLab output (not HTML).

## Snapshot Contract (v1)
Required keys:
- `snapshot_version`: "1"
- `document_type`: TECHNICAL_DATASHEET | PRODUCT_CATALOG | MASTER_CATALOG
- `title`
- `items` or `product` (list of product/variant objects with name, specifications, optional images)
- `export_profile.output_class`: DIGITAL_PDF | PRINT_ORIENTED_PDF

Optional:
- `brand.palette`, `brand.fonts` (local paths)
- `paper.page`, `paper.background.texture_path`
- `watermark.text` or `watermark.image_path`
- `contact`

## Limitations
- No Sheets-backed brand/template library yet (schema not authorized).
- No live Google Drive upload from the renderer.
- PRINT_READY_PDF is explicitly blocked.
- Arabic requires arabic-reshaper and python-bidi (already in dependencies).
