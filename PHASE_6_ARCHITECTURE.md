# Phase 6 Architecture — Design Studio & PDF Generation

## Current State (DEV)

### Implemented (Worker)
- `worker/src/catalog_worker/pdf_renderer.py` — ReportLab-based deterministic renderer
- Supports TECHNICAL_DATASHEET, PRODUCT_CATALOG, MASTER_CATALOG
- Arabic reshaping via arabic-reshaper + python-bidi
- Brand palette, paper size/orientation, watermarks, textures, image DPI checks
- Preflight report with SHA256, page count, warnings
- Blocks PRINT_READY_PDF until CMYK/PDF/X workflow exists

### Not Implemented (requires schema authorization)
The design schema (`schema/03-design-and-issued-output.md`) is marked **"Detailed proposal for review; not implementation authorization."**

Tables that cannot be created without explicit approval:
- Brands / Brand_Versions / Brand_Assets
- Templates / Template_Versions
- Papers / Paper_Versions
- Design_Assets
- Issued_Documents / Issue_Operations
- Contact_Profiles, Export_Profiles, Watermark_Presets

### Integration Model (current)
1. Apps Script or external process builds an immutable **issue snapshot JSON** (version "1").
2. Snapshot is passed to the Python worker (`catalog-pdf-render` CLI or `render_pdf()`).
3. Worker produces a real PDF + preflight report.
4. PDF and report are stored (Drive or local).

No live Google Sheets or Drive calls are made by the renderer. All assets must be supplied as local paths under an optional `asset_root`.

### Architectural Blocker
Full Design Studio (CRUD for brands/templates stored in Sheets, versioning, issue ledger) requires the design schema to be promoted from proposal to approved implementation baseline. Until then, configuration lives in snapshot JSON files.

## Data Flow
```
[User selection] → [Snapshot JSON] → [pdf_renderer.render_pdf] → [PDF + preflight]
```

Source specifications remain immutable. The snapshot must already contain resolved effective values; the renderer does not call the EffectiveSpecificationResolver.
