# Schema Acceptance Tests — Design-Level Scenarios

**Status:** Proposed acceptance suite; not executable tests and not implementation authorization.
**Purpose:** Convert the first-pass schema review into concrete expected behavior before the schema is frozen.
**Dependency:** Tests involving multiple source catalogs depend on resolving SR-001 in SCHEMA_REVIEW.md.

## Test conventions
- Each scenario uses synthetic data only.
- IDs are illustrative, never production IDs.
- “Reject” means no partial production write; the attempted operation must return a clear validation error and an audit/diagnostic event where appropriate.
- All ordering is by explicit sequence/ID rules, never spreadsheet row position.
- All promotion and issue actions must be idempotent.

## A. Source identity and provenance

### SAT-001 — Same product in two revisions of one supplier catalog
**Given:** Catalog A revision 1 and revision 2 both describe the same canonical machine, with different page numbers and a changed source description.
**When:** Both catalogs are processed and reviewed.
**Expected:**
- One canonical Product is retained if a reviewer confirms identity.
- Two distinct Product_Source_Records preserve each catalog/revision appearance.
- Each source assertion retains its own source name, page, quote, and extraction provenance.
- No source record is overwritten and no duplicate canonical Product is created automatically.

### SAT-002 — Same canonical product appears in different supplier catalogs
**Given:** Catalog A and Catalog B describe the same machine with different wording or references.
**When:** A reviewer matches the second source assertion to the existing Product.
**Expected:**
- One canonical Product has two source assertions.
- Both source names/references remain independently retrievable.
- Matching decision and actor are audited.
- If evidence is insufficient, the system retains separate proposed identities rather than auto-merging.

### SAT-003 — Model number changes between catalog revisions
**Given:** A source assertion in revision 1 lists model M-100 and revision 2 lists M-100A.
**When:** The reviewer decides whether this is the same Variant or a new Variant.
**Expected:**
- The decision is explicit and audited.
- Both model-number assertions remain in source history.
- A confirmed same-variant match adds a new Variant_Source_Record; it does not overwrite the old source model number.
- A confirmed new configuration creates a separate Variant.

### SAT-004 — Product-wide and variant-specific source specifications
**Given:** Catalog A states a product-wide operating temperature; Catalog B states different temperatures for two models.
**When:** Source specifications are promoted.
**Expected:**
- Every assertion retains its exact source record and scope.
- Product-wide and variant-specific assertions are not silently collapsed.
- Any conflict is surfaced for review.
- Effective output follows an explicitly approved precedence policy; absent that policy, the system flags conflict rather than guessing.

## B. Specification change ledger

### SAT-005 — Sequential updates to one source specification
**Given:** Source Specification S has value 10 bar.
**When:** Approved UPDATE operations set it to 12 bar, then 14 bar.
**Expected:**
- Source value remains 10 bar.
- Effective value is 14 bar under the approved operation sequence.
- Both operations remain in the ledger with actor, reason, and sequence.
- Reordering sheet rows does not change the result.

### SAT-006 — ADD, UPDATE, DELETE for a company-created specification
**Given:** No source specification exists for a company-only attribute.
**When:** An approved ADD creates “Noise Level = 72 dB”, a later UPDATE sets 70 dB, and a later DELETE suppresses it.
**Expected:**
- The ADD operation's stable ID becomes the logical target for subsequent operations.
- Effective output shows 72 dB after ADD, 70 dB after UPDATE, and no row after DELETE.
- All operations remain auditable; no source row is fabricated or deleted.
- Reversal of DELETE is governed by an explicit new operation, never editing history.

## C. Attribute inheritance

### SAT-007 — Inherit, customize, intentionally empty, restore inheritance
**Given:** Product attribute Warranty = 24 months and a Variant with no override.
**When:** The Variant receives VALUE = 36 months, then INTENTIONALLY_EMPTY, then its override row is removed.
**Expected:**
- No override: effective value 24 months; state Inherited.
- VALUE: effective value 36 months; state Customized.
- INTENTIONALLY_EMPTY: no effective value; state Empty; product value remains unchanged.
- Removing override: effective value returns to 24 months; state Inherited.
- Empty string is not accepted as a substitute for INTENTIONALLY_EMPTY.

## D. Documents and versions

### SAT-008 — Inherited exclusion and direct variant inclusion
**Given:** Document D is included on Product P; Variant V belongs to P.
**When:** D is excluded from inherited association for V and also directly included on V.
**Expected:**
- D remains visible on V exactly once through the direct Variant INCLUDE.
- D remains visible on sibling variants through Product INCLUDE.
- Revoking the exclusion does not create a duplicate display row.
- The resolution trace explains which association supplied the effective link.

### SAT-009 — Direct and inherited version pins conflict
**Given:** Product link pins version V1; direct Variant link pins V2; Documents.Current_Version_ID points to V3.
**When:** The effective document list is resolved for that Variant.
**Expected:**
- V2 is selected for that Variant because direct Variant pin takes precedence.
- A sibling without direct link uses V1.
- A target with no pin uses current version V3.
- Every selected version is validated to belong to the same Doc_ID.

## E. Staging, review, and retries

### SAT-010 — Multiple reviews and changed staging payload
**Given:** One staging record requires identity review and specification review.
**When:** Both reviews approve a particular staging payload hash, then the staged payload is edited before promotion.
**Expected:**
- Both review relationships remain traceable.
- Hash mismatch invalidates approval for promotion.
- The record returns to review; no production promotion occurs.
- A new approval records the new payload hash and exact accepted fields.

### SAT-011 — Worker fails after partial page processing and is retried
**Given:** A catalog run has 100 pages; pages 1–40 are committed; the worker fails during page 41.
**When:** A retry is launched.
**Expected:**
- Retry is linked to the failed run and the same logical job.
- Completed page outputs are reused or reconciled by stable page/unit IDs.
- Pages 1–40 are not duplicated.
- Page 41 resumes safely; subsequent pages continue.
- Run history preserves failure and retry events.

## F. Assets and design immutability

### SAT-012 — Published design references assets later replaced
**Given:** Published Brand Version B1 references logo asset A1 and font asset F1 with checksums.
**When:** The company uploads a replacement logo and font.
**Expected:**
- New asset records/files are created; A1 and F1 remain unchanged.
- B1 continues to resolve the original exact assets.
- A new draft/published brand version is required to use replacements.
- An issued document records exact asset checksums in its snapshot.

### SAT-013 — Image duplicate chain would create a cycle
**Given:** Image A is canonical, B is marked duplicate of A, and an operator attempts to mark A duplicate of B.
**When:** The second operation is validated.
**Expected:**
- The operation is rejected as a cycle.
- Existing links and canonical resolution remain unchanged.
- Rejection is logged.
- No original asset or file is deleted.

## G. Issued PDF and export compliance

### SAT-014 — Historical PDF remains byte-identical after source/design changes
**Given:** An issued PDF references a snapshot, brand/template versions, paper settings, images, fonts, and export settings.
**When:** The underlying product data, company overrides, brand, template, paper, and assets are later changed.
**Expected:**
- Original PDF file ID and SHA-256 remain unchanged.
- Retrieval returns the exact original file.
- Reproduction is a separate run and never overwrites the issued PDF.
- Snapshot and environment fingerprints remain available for audit.

### SAT-015 — Print-ready output requested without printer specifications
**Given:** A profile is labeled PRINT_READY_PDF but no printer-specific color, PDF/X, bleed, trim, or font requirements have been documented and validated.
**When:** The user attempts issuance.
**Expected:**
- Preflight blocks the Print-ready label or requires changing the output class to Print-oriented PDF.
- The system does not imply Chromium alone guarantees CMYK/PDF-X compliance.
- The missing printer requirements are listed clearly.
- Any approved override is audited and cannot silently certify print readiness.

## Acceptance rule

A schema candidate passes this suite only when:
1. Each scenario has a defined expected result and deterministic resolver behavior.
2. The schema can represent every required relationship without overwriting source evidence.
3. Rejection paths are safe and do not leave partial production records.
4. Tests can be automated against a disposable spreadsheet after implementation.
5. All blocker/high findings in SCHEMA_REVIEW.md are resolved or explicitly accepted as documented limitations.
