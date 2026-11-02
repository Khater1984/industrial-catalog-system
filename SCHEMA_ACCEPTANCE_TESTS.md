# Schema Acceptance Tests — Design-Level Scenarios

**Status:** Proposed acceptance suite; not executable tests and not implementation authorization.
**Purpose:** Convert the first-pass schema review into concrete expected behavior before the schema is frozen.
**Dependency:** The V2 canonical/source separation is now documented in the domain schema; these scenarios remain design-level until the consolidated schema is approved and executable tests are implemented.

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


## H. V2 identity, event ordering, and integrity tests

### SAT-016 — Source appearance matched to an existing canonical product
**Given:** Product P already exists from Catalog A; Catalog B contains a similar product with different wording and a new page reference.
**When:** The staging candidate is reviewed and MATCH_EXISTING is approved against the exact staging hash.
**Expected:** A new Product_Source_Record is created for Catalog B and points to P; P is not duplicated; source wording/page/quote remain distinct; the decision and payload hash are auditable. Without approval, no production source record is created.

### SAT-017 — Unresolved source identity cannot promote specifications
**Given:** A staged product/model and its specifications have no approved canonical identity decision.
**When:** promotion is attempted.
**Expected:** Promotion is blocked; specifications remain in staging; no canonical Product, Variant, source record, or production Specification is created.

### SAT-018 — Specification event sequence contains an invalid transition
**Given:** A source specification is deleted at Sequence_No 2.
**When:** an UPDATE is appended at Sequence_No 3 for the same logical key.
**Expected:** The event is rejected or the key is quarantined if discovered after insertion; effective output remains suppressed; no silent resurrection occurs; correction is audited.

### SAT-019 — Duplicate sequence number for one logical key
**Given:** Two approved events share the same Logical_Specification_Key and Sequence_No.
**When:** effective specifications are resolved.
**Expected:** The key is quarantined and excluded from output; integrity scan reports a blocking conflict; no timestamp or row-order tie-breaker is applied.

### SAT-020 — Published asset checksum mismatch
**Given:** A published template manifest pins asset A with SHA256 H1.
**When:** the worker reads the referenced Drive file and calculates H2.
**Expected:** Issuance/reproduction is blocked; no substitute "current" asset is selected; a diagnostic event records expected and actual hashes.

### SAT-021 — Paper setting changes after an issue
**Given:** Issued PDF I pins Paper_Version P1 and its config hash.
**When:** a new paper version P2 is published with changed dimensions/texture.
**Expected:** I still resolves P1 and the original texture; a new issue may use P2; P1 is never edited.

### SAT-022 — Polymorphic link points to a missing or mismatched target
**Given:** Image_Links contains Target_Type=VARIANT with a nonexistent Variant_ID, or a document version belonging to another Doc_ID.
**When:** create/update/import or pre-issue validation runs.
**Expected:** The write/issue is rejected; no orphan link is silently accepted; integrity scan reports the exact row and ownership failure.

### SAT-023 — Multi-sheet promotion partially fails
**Given:** A promotion writes a canonical Product and Product_Source_Record but fails before writing the staging mapping/audit completion.
**When:** recovery runs.
**Expected:** The operation is marked IN_DOUBT; reconciliation finds existing rows by deterministic IDs/promotion key and hashes; it completes missing writes or quarantines conflict; it does not create a second Product.

### SAT-024 — Retry lineage and safe work reuse
**Given:** Run R1 fails after pages 1–20 are committed; R2 is created as its retry.
**When:** R2 resumes.
**Expected:** R2 has the same Logical_Job_ID, Parent_Run_ID=R1, Attempt_Number=2, and a new Idempotency_Key. Pages are reused only if input fingerprints and output hashes match; changed catalog input requires a new logical job.

### SAT-025 — Multiple independent reviews and changed payload
**Given:** One Staging_ID is linked to PRODUCT_MATCH and SPECIFICATION reviews. It is edited after both reviews.
**When:** promotion is attempted.
**Expected:** Both review links and decisions remain; the staging hash mismatch blocks promotion; new reviews are required for the changed payload.

### SAT-026 — First document version creation interrupted
**Given:** Documents is created but first Document_Versions row or current pointer update fails.
**When:** recovery runs.
**Expected:** The document remains incomplete/non-issuable; recovery validates the first version's Doc_ID and hash, then sets Current_Version_ID under lock; no invalid active document is exposed.

### SAT-027 — Image duplicate redirect cycle
**Given:** A→B already exists and an operator proposes B→A.
**When:** redirect validation runs.
**Expected:** The cycle is rejected before changing links; all original image records/files remain unchanged.

### SAT-028 — Integrity scan finds Drive hash mismatch
**Given:** A manifest references an immutable artifact whose bytes no longer match its recorded SHA256.
**When:** the integrity scan runs.
**Expected:** Finding is BLOCKING for affected issue/reproduction paths; no auto-replacement or deletion occurs; a report and audited repair decision are required.


## I. V2.1 checkpoint, rendition, and issue transaction tests

### SAT-029 — Catalog page identity is independent of run processing
**Given:** Catalog revision C has 40 physical PDF pages and extraction Run R1 processes them.
**When:** R1 fails after page 18 and R2 retries using the same source file SHA256.
**Expected:** Catalog_Pages retains exactly 40 stable page identities; Run_Units record R1/R2 progress independently; completed units are reused only when input and output hashes match; no page status or artifact is overwritten.

### SAT-030 — Reprocessing with a new extraction engine
**Given:** Catalog C was processed by worker build W1 and later W2 is introduced.
**When:** the catalog is reprocessed.
**Expected:** a new logical job or explicitly versioned processing run is created; W1 artifacts remain immutable; W2 results are separate and can be compared/reviewed; source occurrence keys prevent accidental duplicate promotion.

### SAT-031 — Stable product occurrence key prevents duplicate source record
**Given:** the same source catalog page and product block are submitted twice with identical source occurrence key and hash.
**When:** promotion is attempted twice after a timeout.
**Expected:** one Product_Source_Record exists for Catalog_ID + Source_Record_Key; second attempt resolves to the existing mapping; conflicting payload hash is quarantined rather than overwritten.

### SAT-032 — Image rendition is immutable and correctly pinned
**Given:** Image I has PREVIEW rendition P1 and HIGH_QUALITY rendition H1; a later pipeline creates H2.
**When:** a new PDF issue is generated.
**Expected:** the issue pins H2 only after approval/validation; prior issues still pin H1; a PREVIEW rendition cannot be used as a datasheet rendition; the original Image_Assets file is unchanged.

### SAT-033 — Cross-image rendition link is rejected
**Given:** Image_Link for Image I1 references a DataSheet_Rendition_ID belonging to Image I2.
**When:** the link is created or preflight runs.
**Expected:** write/issue is rejected with ownership mismatch; no fallback to another rendition occurs silently.

### SAT-034 — Multi-product issue membership is complete
**Given:** a Master Catalog includes 25 products and 41 variants.
**When:** the issue completes.
**Expected:** Issued_Document_Items contains exactly the ordered item membership represented by the immutable scope snapshot; item order and snapshot keys are unique; issue retrieval returns the exact PDF bytes.

### SAT-035 — Issue transaction fails after PDF upload
**Given:** worker uploads a candidate PDF and API writes part of the issue metadata, then the Apps Script request times out.
**When:** recovery runs.
**Expected:** Issue_Operations is IN_DOUBT; hashes and deterministic IDs are reconciled; final Issued_Documents is created only when all dependencies and item rows match; duplicate issue/PDF rows are not created.

### SAT-036 — Paper version is mandatory for every final issue
**Given:** an issue request references Paper_ID but omits Paper_Version_ID, or supplies a version belonging to a different Paper_ID.
**When:** preflight or issue creation runs.
**Expected:** issue is blocked; the worker never resolves a mutable "current paper" implicitly.

### SAT-037 — Review set becomes stale when one linked staging row changes
**Given:** one Review_Queue task covers three staging rows in Review_Staging_Links and is approved.
**When:** one row's raw source quote or candidate Product_ID changes.
**Expected:** the review becomes STALE; the set manifest hash no longer matches; promotion is blocked until the complete linked set is reviewed again.

### SAT-038 — Document first-version creation is recoverable
**Given:** a new Documents row is created with DRAFT status and blank Current_Version_ID, then the first version upload succeeds but pointer update fails.
**When:** recovery runs.
**Expected:** the document remains non-issuable; the first Document_Versions row is verified against Doc_ID and SHA256; pointer is restored under lock and audited before status becomes ACTIVE.

### SAT-039 — Issue manifest asset checksum mismatch
**Given:** the issue manifest pins Design_Asset D1 at SHA256 A but Drive returns bytes with SHA256 B.
**When:** preflight or render begins.
**Expected:** issuance is blocked before rendering; the system does not select a newer asset or mutable alias; a blocking integrity finding is recorded.

### SAT-040 — Concurrent approval of specification changes
**Given:** two users/processes attempt to approve competing changes for the same Logical_Specification_Key at the same time.
**When:** both approval requests execute.
**Expected:** the lock and latest-state re-read serialize approval; one valid transition is accepted first, and the other is revalidated against the new effective state or rejected; duplicate Sequence_No values cannot occur.


## J. V2.1 identity scope and typed transaction tests

### SAT-041 — Canonical merge is not supported in the initial release
**Given:** Two canonical Products appear to be duplicates after separate promotions.
**When:** an operator attempts to merge/reparent one Product and its Variants, source records, attributes, images, and documents.
**Expected:** the initial-release API rejects the merge operation; the operator may archive a duplicate only after review; no source record, link, variant, or historical issue is silently reassigned. A future merge feature requires a separate approved ADR and migration test suite.

### SAT-042 — Promotion mapping rejects a typed-reference mismatch
**Given:** Promotion_Mappings declares Staging_Type=VARIANT but Staging_ID resolves only to Staging_Products, or Production_Entity_Type=VARIANT but Production_Entity_ID resolves to a Product.
**When:** promotion validation or integrity scan runs.
**Expected:** the mapping is rejected/quarantined; no canonical/source record is promoted; the exact type mismatch is recorded as a blocking finding.

### SAT-043 — PDF reproduction preserves the original issued document
**Given:** Issued Document I1 is archived with PDF hash H1.
**When:** a reproduction operation is requested against I1 using a newer worker or renderer.
**Expected:** Issue_Operations records Source_Issued_Document_ID=I1; the original I1/PDF hash H1 remains unchanged; any regenerated output is stored as a separate issue/reproduction artifact with its own hash and runtime fingerprint.

### SAT-044 — Duplicate worker event callback is idempotent
**Given:** a worker submits the same Run_Event twice with the same Event_Idempotency_Key after an API timeout.
**When:** the API receives the duplicate callback.
**Expected:** exactly one Run_Events row is retained; the second request returns the prior accepted result and does not increment progress twice or duplicate state transitions.


### SAT-045 — Document version retains supplier source provenance
**Given:** a brochure is extracted from page 12 of Catalog C and promoted as Document D, Version V1.
**When:** the source catalog is superseded by a later revision or the document is manually linked to another product.
**Expected:** V1 retains its original Catalog_ID, Catalog_Page_ID, source record IDs, extraction run/staging IDs, exact source quote, and SHA256. New document versions have separate provenance; no version silently inherits or overwrites another version's source evidence.
