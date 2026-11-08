# DEV Operations & Backup Runbook

## Create a backup
Configure Script Property DEV_BACKUP_FOLDER_ID with a private Drive folder ID, then run createDevBackup from the owner-only Apps Script context. The operation creates a unique folder, one JSON snapshot per V2.1 table, copies referenced Drive/JSON files, and writes backup-manifest.json. Missing or inaccessible references produce INCOMPLETE; do not treat that backup as valid.

## Verify a backup
Run verifyDevBackup(folderId) using the returned folder ID. It verifies each table snapshot SHA-256 and record count, checks copied Drive files and sizes, and verifies SHA-256 where the source row provides an expected digest. VERIFIED means the captured backup passed these checks; it is not a restore.

## Restore policy
The current implementation is intentionally report-only and does not overwrite a live spreadsheet or restore files automatically. Rehearse restoration into a disposable spreadsheet and Drive folder first. Never overwrite source supplier files, published design versions, document versions, issued PDFs, or audit rows. Record backup ID, target IDs, operator, and verification result.

## Production gate
RPO/RTO, retention, off-site backup policy, and a successful disposable restore rehearsal remain mandatory before production.
