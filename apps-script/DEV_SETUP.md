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
1. Create a standalone Apps Script project.
2. Add the source files from this directory, preserving their relative load order or bundle them with the documented build step.
3. Add all files under `src/`, including `src/validation/InputValidation.js`; Apps Script loads project `.gs` files globally, but keep the repository paths in sync when copying/bundling.
4. Set Script Properties above.
5. Run `initializeDevSchema` manually from the editor.
6. Confirm exactly four tabs exist: Catalogs, Catalog_Pages, Run_Log, Run_Units.
7. Confirm the header row in every tab exactly matches `src/config/Schema.js`; extra or missing columns must fail initialization.
8. Deploy only as a restricted owner-only DEV web app (`MYSELF`, execute as deploying user).
9. Confirm `ALLOWED_USER_EMAIL` matches the deploying Google account. The app fails closed if Apps Script cannot expose the effective-user identity.
10. Call `GET ?action=health` while signed in as the deploying account.

## Register a synthetic PDF
- Place a non-confidential synthetic PDF in the DEV intake folder.
- Call the authenticated `POST` action `catalog.register` with `driveFileId` and `supplierName`.
- Verify Catalogs stores the exact file SHA256 and Run_Log contains one QUEUED attempt.
- Repeat the same request: it must reject the duplicate SHA256 without adding rows.

## Current limitations
- No worker queue, lease acquisition endpoint, page counting, page creation, PDF parsing, OCR, staging, or callback is implemented yet.
- No worker credentials or deployment exist.
- The current web-app identity behavior must be verified in the chosen Google account/Workspace before relying on it. If Apps Script does not expose the expected active-user email, use a separately reviewed authentication design; do not weaken access to anonymous.
- This slice has not been deployed or runtime-tested. The next gate is to provision the isolated DEV resources and execute the setup/registration tests.
