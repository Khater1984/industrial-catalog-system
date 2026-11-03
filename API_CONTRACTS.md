# API Contracts — Application and Worker Boundary

**Status:** Proposed logical contracts; endpoint names and transport are not yet frozen.  
**Security:** No credentials or production URLs belong in this document.

## 1. Contract principles

- The browser calls the Apps Script application API; it does not write Sheets or Drive directly.
- The Python worker receives scoped job manifests and returns structured results through an authenticated API boundary.
- Every mutating request has a request ID and a durable idempotency key. For `catalog.register`, the server derives the canonical key from the verified source PDF SHA256; the browser cannot choose or override it.
- Every response has a stable error code and correlation ID.
- The API validates all IDs, foreign-key ownership, lifecycle state, enum values, hashes, and permissions server-side.
- Large files and manifests use Drive file IDs plus SHA256, not inline JSON in Sheets/API payloads.

## 2. Common request envelope

Conceptual request:

```json
{
  "protocol_version": "1",
  "request_id": "req_<opaque-id>",
  "idempotency_key": "idem_<opaque-key>",
  "actor_id": "actor_primary",
  "action": "catalog.register",
  "payload": {}
}
```

Fields:
- `protocol_version`: required; reject unsupported versions.
- `request_id`: unique correlation identifier.
- `idempotency_key`: required for mutations and job submissions.
- `actor_id`: resolved by server authentication; clients cannot impersonate arbitrary actors.
- `action`: allowlisted operation.
- `payload`: action-specific validated object.

## 3. Common response envelope

```json
{
  "protocol_version": "1",
  "request_id": "req_<opaque-id>",
  "correlation_id": "corr_<opaque-id>",
  "ok": true,
  "data": {},
  "error": null
}
```

On failure: `ok=false`, `data=null`, and `error={code,message,retryable,details?}`. Details must not disclose secrets or confidential source content.

## 4. Application API operation groups

### Catalog intake
- `catalog.createUploadSession`
- `catalog.registerSource`
- `catalog.getDetails`
- `catalog.startExtraction`
- `catalog.listPages`

### Runs and review
- `run.getStatus`
- `run.listEvents`
- `run.retry`
- `review.listQueue`
- `review.getTask`
- `review.submitDecision`
- `review.markDeferred`

### Product management
- `product.search`
- `product.getWorkspace`
- `product.createCompanyRecord`
- `product.updateCompanyFields`
- `variant.updateCompanyFields`
- `specification.appendChange`
- `attribute.setProductValue`
- `attribute.setVariantOverride`

### Documents and images
- `document.create`
- `document.addVersion`
- `document.linkTarget`
- `image.registerOriginal`
- `image.createRendition`
- `image.linkTarget`
- `image.setApproval`

### Design and output
- `design.publishBrandVersion`
- `design.publishTemplateVersion`
- `design.publishPaperVersion`
- `preflight.create`
- `issue.start`
- `issue.getStatus`
- `issue.getOriginalPdf`
- `issue.startReproduction`

Names above are logical operation identifiers, not deployed endpoints. The final API surface must be derived from accepted use cases and security review.

## 5. Worker job contract

A job manifest is immutable and contains:
- protocol and schema versions;
- Run_ID, Logical_Job_ID, Attempt_Number, Run_Type;
- source file Drive ID and verified SHA256 or exact input manifest;
- requested operation and processing profile;
- page/unit ranges;
- output folder/manifest destination;
- expected callback correlation;
- non-secret configuration references.

The worker must not accept arbitrary file URLs, arbitrary Drive IDs, or arbitrary output paths from untrusted browser input. The API resolves and allowlists all resources before creating the job.

## 6. Worker result contract

A result manifest includes:
- Run_ID and Logical_Job_ID;
- exact input SHA256;
- worker build/version and processing tool versions;
- completed/failed unit list with input and output hashes;
- typed extraction record manifests with source page/region references;
- artifact Drive IDs, MIME types, byte sizes, and SHA256;
- warnings/errors using stable codes;
- final status and timestamp.

The API validates the manifest and every referenced file before importing staged records. Duplicate callbacks are safe and return the prior result for the same idempotency key.

## 7. Authentication design to finalize

Minimum requirements:
- HTTPS only.
- Worker-to-API requests signed with a rotatable secret or asymmetric signing key.
- Timestamp and nonce/replay protection.
- Request-body hash included in signature.
- Short validity window and bounded clock skew.
- Secrets held only in managed runtime secret storage/Apps Script Properties; never in GitHub, Sheets, query strings, or logs.
- Separate DEV/TEST/PROD credentials and scopes.
- Worker access restricted to the specific Drive folders/files required for its job.
- Key rotation and revocation runbook.

HMAC vs signed JWT, callback direction, Drive access method, and token exchange remain open ADR items; no credential is to be generated before the protocol is approved.

## 8. State and concurrency

- Job submission is idempotent by idempotency key.
- Retry is a new Run_ID under the same Logical_Job_ID.
- Review submission includes the exact staging-set manifest SHA256.
- Promotion and issue operations require deterministic keys and immutable intended-output manifests.
- Mutating product/company records use expected version/hash checks to reject stale edits.
- Long-running worker operations are asynchronous; the browser polls status or receives notifications through a future approved mechanism.

## 9. Contract testing

Before implementation, define JSON schema fixtures for every operation group. Contract tests must cover malformed payloads, missing fields, unknown enums, stale hashes, duplicate requests, replayed signatures, unauthorized Drive IDs, oversized files, worker callback duplication, and worker/API version mismatch.
