# Phase 6 Architecture (DEV)

## Layers
1. **Brand Identity** — Script Properties (`DS_BRANDS`). Independent of data and templates.
2. **Document Template** — Script Properties (`DS_TEMPLATES`). Layout rules only.
3. **Business Data** — Existing Products / Variants / EffectiveSpecificationResolver. Immutable source.
4. **Issue Snapshot** — Immutable JSON produced by `DesignStudio.buildSnapshotFromDomain`.
5. **PDF Renderer** — Python `pdf_renderer.py` (ReportLab). Consumes snapshot + local assets.

## Flow
```
UI (Index.html) → DesignStudio.js → EffectiveSpecificationResolver
                 ↓
            snapshot.json → catalog-pdf-render → PDF + preflight
```

## Constraints
- No new Sheets tables.
- No live Drive upload of generated PDFs in this phase (local generation).
- PRINT_READY_PDF remains blocked.
- ADR-040 conflicts are preserved; FINAL is unconditionally blocked in both Apps Script snapshot creation and the Python validator/renderer.\n- Product and model display data are read from `Product_Company` / `Variant_Company`; model selection is explicit in the UI.\n- Approved image assets are not yet materialized into the local PDF snapshot; image rendering integration remains open.

## Files
- `apps-script/src/domain/DesignStudio.js`
- `apps-script/DesignStudioPanel.html`
- `worker/src/catalog_worker/pdf_renderer.py`
- `worker/src/catalog_worker/snapshot_builder.py`
- `worker/src/catalog_worker/snapshot_validator.py`
