# Phase 6 User Guide

## Design Studio (integrated in Index.html)

1. Open the Apps Script web app.
2. Scroll to the **استوديو التصميم وتوليد المستندات** panel.
3. Select or edit a Brand Identity (Apple is default).
4. Select or create a Template.
5. Choose document type (TDS / Product Catalog / Master Catalog).
6. Enter product IDs (comma-separated). For model-specific output, enter mappings such as `P001=V001, P002=V004`.
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
- Colors, paper, orientation, logo preference, and watermark are stored in Script Properties.\n- Optional font file paths must point to files available to the local worker through `--asset-root`; the worker image includes DejaVu Sans as an Arabic-capable fallback.

## Templates
- Create, update, publish, and copy.
- Version increments automatically.
- Options: index, family grouping, provenance, exclude unpublished, block on conflict.

## Important
- No new Sheets tables (schema proposal not authorized).
- Specifications come from EffectiveSpecificationResolver.
- FINAL is always blocked when ADR-040 conflicts exist; the UI cannot disable this safety rule.\n- Product/model names are read from `Product_Company` and `Variant_Company`, not from the canonical ID tables.\n- Approved product images are not yet materialized into the local snapshot; image rendering remains a separate unfinished integration.
- Real PDF is produced by the Python worker (ReportLab).
