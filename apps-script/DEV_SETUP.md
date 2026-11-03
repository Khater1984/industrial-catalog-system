# Apps Script DEV setup

This is the first isolated implementation slice. It is not deployed and does not create or access production resources.

## Prerequisites
- A dedicated, disposable DEV Google Spreadsheet.
- A private Drive folder dedicated to DEV catalog intake.
- Apps Script project owned by the primary operator.
- Apps Script web-app deployment restricted to the owner; do not use anonymous/public access.

## Script Properties
Set these values in the Apps Script project settings (never commit them):
- `DEV_SPREADSHEET_ID`: ID of the disposable DEV spreadsheet.
- `DEV_CATALOG_FOLDER_ID`: ID of the private DEV intake folder.
- `ALLOWED_USER_EMAIL`: exact Google account email allowed to use the application.

Do not add worker credentials yet. Worker/API signing design, hosting and callback direction remain pending explicit security decisions.

## Initialize
1. Install Node.js 20 or later and create a standalone Apps Script project.
2. From `apps-script/`, run `npm run build` first (it regenerates the schema from the Markdown source of truth), then run `npm test`.
3. Copy the generated `dist/Code.gs` into the Apps Script project as `Code.gs`, and copy `appsscript.json` as the project manifest. The repository `.js` files are source modules; they are bundled into a valid Apps Script `.gs` file by the build script.
4. Set Script Properties above.
5. Run `initializeDevSchema` manually from the editor.
6. Confirm all 52 required tabs are created from the V2.1 registry. An unrelated default tab is not automatically deleted.
7. Confirm the header row in every tab exactly matches `src/config/Schema.js`; extra or missing columns must fail initialization.
8. Deploy only as a restricted owner-only DEV web app (`MYSELF`, execute as deploying user).
9. Confirm `ALLOWED_USER_EMAIL` matches the deploying Google account. The app fails closed if Apps Script cannot expose the effective-user identity.
10. Call `GET ?action=health` while signed in as the deploying account.

## Automated validation tests
- From this directory, run `npm test` with Node.js 20 or later.
- Run `npm run build` to create `dist/Code.gs` from the explicit source manifest.
- The suite covers the 52-table/711-column schema registry, 79 enum fields, 711 field rules, required/type/enum validation, non-destructive sheet initialization, catalog payload validation, and mocked registration/retry recovery. It is not an Apps Script or Google Sheets integration test.

## Register a synthetic PDF
- Place a non-confidential synthetic PDF in the DEV intake folder.
- Call the authenticated `POST` action `catalog.register` with `driveFileId` and `supplierName`.
- Verify Catalogs stores the exact file SHA256 and Run_Log contains one QUEUED attempt.
- Repeat the same request with identical file and metadata: it must return the original catalog/run IDs without adding duplicate rows.
- Reuse the same PDF bytes with different supplier/catalog metadata: the API must return `DUPLICATE_SOURCE_SHA256_REQUIRES_REVIEW`; it must not silently reuse or overwrite the record.
- Simulate a failed `Run_Log` append after the `Catalogs` row is written; retrying the same source must repair the missing run row without duplicating the catalog.

## Current limitations
- No worker queue, lease acquisition endpoint, page counting, page creation, PDF parsing, OCR, staging, or callback is implemented yet.
- No worker credentials or deployment exist.
- The effective-user identity check must be verified in the chosen Google account/Workspace before relying on it. If Apps Script does not expose the deploying account identity, stop and use a separately reviewed authentication design; do not weaken access to anonymous.
- This slice has not been deployed or runtime-tested. The next gate is to provision the isolated DEV resources and execute the setup/registration tests.
