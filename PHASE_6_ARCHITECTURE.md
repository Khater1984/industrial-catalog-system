# Phase 6 Architecture

## Current (Implemented, DEV-only)
- **PDF Renderer** (`worker/src/catalog_worker/pdf_renderer.py`): ReportLab-based, deterministic, real PDF output. Supports TDS, Product Catalog, Master Catalog.
- **Snapshot Builder** (`worker/src/catalog_worker/snapshot_builder.py`): Pure data → snapshot.
- **Design Studio** (`apps-script/src/domain/DesignStudio.js` + BrandIdentity.html): Brand presets in Script Properties.
- **Template Studio** (`apps-script/src/domain/TemplateStudio.js` + TemplateStudio.html): Lightweight templates in Script Properties.

## Separation
- Brand Identity ≠ Template ≠ Business Data
- Renderer consumes immutable snapshots only.
- No source Specifications are mutated during generation.

## Schema Blocker
`schema/03-design-and-issued-output.md` is explicitly a **proposal for review; not implementation authorization**.

Full Sheets-backed tables (Brands, Brand_Versions, Templates, Template_Versions, Issued_Documents, Issue_Operations, Design_Assets, etc.) cannot be created without approval.

## What Full Authorization Would Unlock
- Versioned, immutable brand and template configs stored in Drive + Sheets metadata.
- Issued_Documents ledger with dependency manifests.
- Asset registry separate from product images.
- Historical reproduction from pinned artifacts.

## Current Integration Boundary
Apps Script prepares snapshots → Worker renders PDF locally. No live Drive PDF upload or Sheets issue ledger in this phase.
