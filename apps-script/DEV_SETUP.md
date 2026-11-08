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
- `DEV_DOCUMENTS_FOLDER_ID`: ID of a separate private DEV Drive folder for uploaded document originals and immutable versions.
- `DEV_RUNS_FOLDER_ID`: ID of a private DEV Drive folder for immutable per-run job and result files.
- `DEV_WORKER_ENDPOINT`: HTTPS Cloud Run URL ending in `/run`.
- `DEV_WORKER_SHARED_TOKEN`: high-entropy bearer token shared with Cloud Run; never commit it.
- `ALLOWED_USER_EMAIL`: exact Google account email allowed to use the application.

Follow worker/DEPLOYMENT.md for Cloud Run, Cloud Tasks, IAM, and Drive-sharing setup. The Worker is dispatched asynchronously through Cloud Tasks. It writes immutable result artifacts to Drive; Apps Script remains owner-only and polls Drive from an owner-executed time trigger. Do not expose this Apps Script Web App anonymously: an execute-as-owner public deployment could expose owner privileges.

## Initialize
1. Install Node.js 20 or later and create a standalone Apps Script project.
2. From `apps-script/`, run `npm run build` first (it regenerates the schema from the Markdown source of truth), then run `npm test`.
3. Copy the generated `dist/Code.gs` into the Apps Script project as `Code.gs`, and copy `appsscript.json` as the project manifest. The repository `.js` files are source modules; they are bundled into a valid Apps Script `.gs` file by the build script.
4. Set Script Properties above.
5. Run `initializeDevSchema` manually from the editor.
6. Confirm all 52 required tabs are created from the V2.1 registry. An unrelated default tab is not automatically deleted.
7. Confirm the header row in every tab exactly matches `src/config/Schema.js`; extra or missing columns must fail initialization.
8. Deploy only as a restricted owner-only DEV web app (`MYSELF`, execute as deploying user). Keep `appsscript.json` access set to `MYSELF`; do not make this deployment anonymous for worker callbacks.
9. Run `installWorkerPoller` once from the Apps Script editor as the owner. It installs a five-minute trigger that finds result-manifest.json in active run folders and invokes validated ingestion.
10. Confirm `ALLOWED_USER_EMAIL` matches the deploying Google account. The app fails closed if Apps Script cannot expose the effective-user identity.
11. Call `GET ?action=health` while signed in as the deploying account.

## Automated validation tests
- From this directory, run `npm test` with Node.js 20 or later.
- Run `npm run build` to create `dist/Code.gs` from the explicit source manifest.
- The suite covers the 52-table/711-column schema registry, 79 enum fields, 711 field rules, required/type/enum validation, non-destructive sheet initialization, catalog payload validation, and mocked registration/retry recovery. It is not an Apps Script or Google Sheets integration test.

## Register a synthetic PDF
- Open the owner-only web app and upload a non-confidential synthetic PDF (maximum 12 MiB) using the catalog intake form.
- Confirm the file is stored in the DEV intake folder. With worker dispatch configured, Run_Log should move to RUNNING after Cloud Tasks accepts the job; without worker configuration it remains QUEUED.
- The API `POST` action `catalog.register` remains available for controlled integration tests using `driveFileId` and `supplierName`.
- Verify Catalogs stores the exact file SHA256 and Run_Log contains one attempt (QUEUED when dispatch is not configured, RUNNING after dispatch acceptance).
- Repeat the same request with identical file and metadata: it must return the original catalog/run IDs without adding duplicate rows.
- Reuse the same PDF bytes with different supplier/catalog metadata: the API must return `DUPLICATE_SOURCE_SHA256_REQUIRES_REVIEW`; it must not silently reuse or overwrite the record.
- Simulate a failed `Run_Log` append after the `Catalogs` row is written; retrying the same source must repair the missing run row without duplicating the catalog.

## Current limitations
- Cloud Run service and Cloud Tasks queue must be deployed/configured separately; this repository does not provision cloud infrastructure.
- Share the DEV intake and DEV runs folders with the Cloud Run runtime service account; shared-drive access must be granted explicitly.
- The current Worker extracts embedded page text and stores page-level Run_Units plus Catalog_Pages. It does not perform OCR, table recognition, product/variant inference, staging, review, or promotion.
- The five-minute poller is eventual rather than an immediate push callback. Run_Log remains recoverable if a poll fails. Cloud Run must be configured with a finite Cloud Tasks retry policy and an operator review path for persistent infrastructure failures.
- The effective-user identity check must be verified in the chosen Google account/Workspace before relying on it. If Apps Script does not expose the deploying account identity, stop and use a separately reviewed authentication design; do not weaken access to anonymous.
- This slice has not been deployed or runtime-tested. The next gate is to provision the isolated DEV resources and execute the setup/registration tests.
