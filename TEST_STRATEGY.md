# Test Strategy — Quality Gates

**Status:** Test plan; no automated test suite is implemented yet.

## 1. Quality objectives

Prove data integrity, source provenance, deterministic effective values, safe retries, correct document/image resolution, design immutability, PDF quality, security boundaries, and responsive usability before release.

## 2. Test layers

### Unit tests
- ID generation and validation.
- Canonical JSON serialization and SHA256.
- Specification reducer and invalid transition quarantine.
- Product/variant identity ownership.
- Attribute inheritance and intentional-empty behavior.
- Document INCLUDE/EXCLUDE and version resolution.
- Image rendition selection and effective DPI calculation.
- State transition validators.

### Contract tests
- Browser ↔ Apps Script request/response envelopes.
- Apps Script ↔ worker job/result manifests.
- Schema version compatibility.
- Auth signatures, replay protection, and idempotency behavior.
- Invalid enum, missing field, oversized payload, and malformed file handling.

### Integration tests
- Disposable Sheets workbook with all schema tabs.
- Drive test folders with synthetic files.
- FK/ownership checks, uniqueness, lock contention, batch writes.
- Staging → review → promotion mapping.
- Document first-version creation and pointer rollback.
- Issue_Operations and Promotion_Operations recovery.

### End-to-end tests
- Catalog upload to reviewed product/variant/specifications.
- Reprocessing/retry without duplicate records.
- Product enrichment and variant inheritance.
- Shared document inheritance/exclusion.
- Image upload, rendition, approvals, and preflight.
- Technical Data Sheet, Product Catalog, and Master Catalog issue.
- Retrieval of exact historical PDF after source/design changes.

### Failure and recovery tests
- Worker crash mid-page, mid-manifest, and mid-render.
- API timeout after a successful write but before response.
- Duplicate callback and duplicate user submission.
- Sheets quota/lock failure.
- Partial multi-sheet promotion and issue commit.
- Drive upload success followed by metadata write failure.
- Hash mismatch, orphan FK, duplicate sequence, redirect cycle.
- Restore from backup into a disposable environment.

### Non-functional tests
- Performance at measured small/median/large data volumes.
- Mobile and desktop layout across supported viewport sizes.
- Keyboard and accessibility checks.
- Security review, dependency scanning, upload validation, and authorization.
- PDF clipping, font embedding/fallback, image resolution, page overflow, and metadata.

## 3. Synthetic fixtures

Create synthetic supplier catalogs covering:
- born-digital text and scanned pages;
- multi-page product/model tables;
- product-wide and model-specific specs;
- repeated product names with different models;
- same canonical item in multiple catalogs/revisions;
- model-number collisions;
- low-resolution and rotated images;
- documents linked at product and variant scope;
- Arabic/English mixed labels and units.

Never use real confidential supplier catalogs in the public repository. Private fixtures belong in an access-controlled test Drive folder.

## 4. Acceptance traceability

- SAT-001–SAT-015: first-pass source, product, document, image, and issue scenarios.
- SAT-016–SAT-028: V2 identity, reducer, retry, review, and integrity scenarios.
- SAT-029–SAT-040: run checkpoint, image rendition, multi-item issue, and transaction recovery scenarios.
- SAT-041–SAT-044: canonical merge scope, typed promotion mappings, PDF reproduction, and duplicate event callbacks.

Every test result records test ID, build/version, environment, fixture hash, expected result, actual result, pass/fail, defect link, and reviewer.

## 5. Release gates

A release cannot pass with:
- any unresolved BLOCKING integrity finding;
- any duplicate canonical promotion caused by retry;
- any source assertion mutation;
- any stale approval accepted for promotion;
- any issue manifest/hash mismatch;
- any missing original PDF or inability to retrieve exact stored bytes;
- any security finding allowing unauthenticated worker or production data access.

## 6. Coverage and exit criteria

Coverage percentage alone is insufficient. All critical business invariants must have positive and negative tests. Every defect fix adds a regression test. Production release requires a successful backup/restore rehearsal and end-to-end acceptance by the user.
