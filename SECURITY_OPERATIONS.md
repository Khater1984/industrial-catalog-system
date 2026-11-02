# Security & Operations Plan

**Status:** Proposed controls; no production infrastructure or credentials have been provisioned.

## 1. Security posture

The repository is public by user choice. It must contain only source code, generic documentation, synthetic tests, and non-sensitive configuration examples. Never commit API keys, OAuth tokens, private keys, service-account JSON, customer data, supplier-confidential PDFs, private images, or signed URLs.

The first release is single-primary-user, not multi-tenant. This does not mean unauthenticated: application and worker access must be restricted.

## 2. Data classification

| Class | Examples | Handling |
|---|---|---|
| Public | Generic product taxonomy, public supplier links | May be documented if rights permit |
| Internal | Canonical product labels, company notes, workflow metadata | Restricted app/Drive access |
| Confidential | Non-public catalogs, quotes, customer details, internal pricing | Private Drive only; never public GitHub |
| Secret | API keys, OAuth refresh tokens, HMAC keys, service credentials | Runtime secret store only; never Sheets/GitHub/logs |

## 3. Access control

- Restrict the Apps Script application to the approved user identity/domain.
- Do not enable public anonymous write endpoints.
- Worker endpoints require authenticated signed requests and strict action allowlists.
- Worker Drive access is limited to required folders and file IDs.
- The worker has no broad Sheets editor access unless a later security review explicitly authorizes it.
- Separate DEV, TEST, and PROD resources and credentials.
- Revoke credentials immediately when compromised; maintain a documented rotation process.

## 4. File upload and processing security

- Validate file extension, MIME type, magic bytes, size, page count, and PDF readability.
- Treat all PDF text, embedded images, metadata, filenames, and OCR output as untrusted data.
- Never interpret extracted document text as system instructions or executable code.
- Store uploaded files outside public web roots and do not expose unrestricted Drive links.
- Use isolated worker processes/containers with resource limits and bounded concurrency.
- Restrict outbound network access; no arbitrary URL fetching from PDF content.
- Keep dependencies pinned and scan for vulnerabilities.

## 5. Worker authentication requirements

Use HTTPS, request-body hashes, timestamped signatures, nonce/replay protection, short validity windows, separate environment keys, and key rotation. HMAC or signed JWT selection remains open pending Apps Script runtime compatibility testing. Never place secrets in query strings or user-visible errors.

## 6. Logging and monitoring

Log correlation IDs, operation IDs, Run_ID, Run_Unit_ID, stable error codes, timestamps, tool versions, file hashes, duration, resource usage, and state transitions.

Do not log passwords, tokens, signed URLs, full supplier PDF text, or unnecessary personal data. Logs must support incident diagnosis without duplicating confidential source content.

Alert on:
- repeated authentication failures or signature/replay violations;
- stuck runs or expired worker leases;
- rising worker/API error rates;
- hash mismatch, orphan links, duplicate keys, or sequence conflicts;
- storage/quota thresholds;
- backup failures and failed restore drills.

## 7. Backup and recovery

Before schema initialization, bulk promotion, major release, or migration:
1. Export every Sheets tab with schema version and timestamp.
2. Create a manifest of all referenced Drive files and SHA256 checksums.
3. Verify backup objects and checksums.
4. Record a consistent backup point and operation IDs.
5. Run restore drills in a disposable environment.
6. Verify PK/FK/ownership integrity, issue retrieval, and manifest hashes.

RPO, RTO, backup cadence, retention, and off-site copy policy are not yet approved and must be set before production. A backup is not considered valid until a restore test succeeds.

## 8. Operational limits

Benchmark Apps Script quotas, Sheets rows/cells and response times, Drive storage/API limits, worker memory/time, upload size, page count, concurrent jobs, and UI polling. Set explicit limits only from measured results. Define warning and hard-stop thresholds and a documented relational-database migration trigger.

## 9. Incident and recovery runbooks

Required runbooks:
- worker timeout/stuck lease;
- failed retry and duplicate callback;
- Promotion_Operation IN_DOUBT;
- Issue_Operation IN_DOUBT;
- hash mismatch or missing Drive asset;
- accidental archive/link removal;
- credential rotation/revocation;
- backup restore and integrity scan.

Recovery is report-first and idempotent. Never auto-delete, auto-merge, or overwrite conflicting evidence.
