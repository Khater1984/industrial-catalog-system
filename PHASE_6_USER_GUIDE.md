# Phase 6 User Guide (updated)

## Design Studio (DEV)

1. Open the Apps Script web app (Index.html).
2. Use the Design Studio section (or include `DesignStudio.html`).
3. Configure brand colors, paper size, and orientation.
4. Save the brand preset (stored in Script Properties).
5. Enter document type, title, and items as JSON.
6. Click "إنشاء Snapshot" to generate a validated snapshot.
7. Download `snapshot.json`.
8. Run the worker:
   ```bash
   catalog-pdf-render --snapshot snapshot.json --output out.pdf --report preflight.json
   ```

## Notes
- No new Sheets tables are created (schema not authorized).
- Brand presets live in Script Properties for DEV only.
- The snapshot is compatible with `worker/src/catalog_worker/pdf_renderer.py`.
- PRINT_READY_PDF is still blocked by the renderer.
