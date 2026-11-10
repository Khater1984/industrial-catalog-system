# Phase 6 User Guide — Practical Testing

## Prerequisites

1. Apps Script project deployed as a web app (or run from the editor).
2. Google Sheets containing the existing V2.1 tables (Products, Product_Company, Variants, EffectiveSpecificationResolver data, Image_Links / Image_Assets if you want images).
3. Local Python environment for the worker.

## Step 1 — Generate a snapshot from the UI

1. Open the Apps Script web app.
2. Scroll to **استوديو التصميم وتوليد المستندات**.
3. Select a brand (Apple is default).
4. Optionally create/select a template.
5. Choose document type.
6. Enter product IDs (e.g. `P001, P002`) or mappings (`P001=V001`).
7. Click **توليد Snapshot**.
8. Download `snapshot.json`.

## Step 2 — Generate the PDF locally

```bash
cd worker
pip install -e .
catalog-pdf-render --snapshot snapshot.json --output out.pdf --report preflight.json
```

Optional: place fonts and images under a folder and pass `--asset-root ./assets`.

## Notes

- Specifications come from EffectiveSpecificationResolver.
- FINAL is always blocked if conflicts exist.
- Approved images appear in the snapshot as `drive_file_id`. For the PDF to include them, download the files and set `path` (or provide a local path via asset root).
- Arabic text requires `arabic-reshaper` + `python-bidi` (already in requirements) and a font that supports Arabic (DejaVu is a fallback; custom TTF paths work better).

## What you can test now

- Brand selection and snapshot generation from real product data.
- Three document types (TDS, Product Catalog, Master Catalog).
- Conflict blocking on FINAL.
- Local PDF generation and preflight report.

## What is still limited

- Images need a manual download step to appear in the PDF.
- No automatic upload of the generated PDF back to Drive.
- Live visual preview inside the web app is not available (download + local render).
