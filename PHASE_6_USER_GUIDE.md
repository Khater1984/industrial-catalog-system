# Phase 6 User Guide

## Design Studio (integrated in Index.html)

1. Open the Apps Script web app.
2. Scroll to the **استوديو التصميم وتوليد المستندات** panel.
3. Select or edit a Brand Identity (Apple is default).
4. Select or create a Template.
5. Choose document type (TDS / Product Catalog / Master Catalog).
6. Enter product IDs (comma-separated).
7. Set status (ORIGINAL / PRELIMINARY / FINAL) and options.
8. Click **توليد Snapshot**.
9. Download `snapshot.json`.
10. Generate the PDF locally:
    ```bash
    catalog-pdf-render --snapshot snapshot.json --output out.pdf --report preflight.json
    ```

## Brand Identities
- 5 built-in: Apple (default), 6D, Industrial, Minimal, Supplier.
- Custom identities can be saved.
- Colors, paper, orientation, logo preference, and watermark are stored in Script Properties.

## Templates
- Create, update, publish, and copy.
- Version increments automatically.
- Options: index, family grouping, provenance, exclude unpublished, block on conflict.

## Important
- No new Sheets tables (schema proposal not authorized).
- Specifications come from EffectiveSpecificationResolver.
- FINAL documents can be blocked when unresolved conflicts exist.
- Real PDF is produced by the Python worker (ReportLab).
