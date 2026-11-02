# Schema V2.1 Change Proposal — Identity, Determinism & Integrity

**Status:** Proposed revision following approval to continue design corrections; not yet final schema approval or implementation authorization.
**Date:** 2026-11-03
**Scope:** Resolve SR-001 through SR-014 where the current domain documents need a single normative rule. This proposal supersedes conflicting first-pass wording when the schema is next consolidated.

## 1. Canonical identity and supplier source assertions (SR-001, SR-003)

### 1.1 Separation of responsibilities

- `Products` is the internal canonical product identity. It contains no supplier catalog ID, supplier wording, page number, or extraction-run provenance.
- `Variants` is the internal canonical model/configuration identity and has exactly one `Product_ID`.
- A supplier catalog/revision appearance is represented by a source-record row. Source records are assertions, not canonical entities.
- The same canonical product or variant may have multiple source records, including multiple revisions from one supplier and records from different suppliers.
- No name/model-number similarity, normalized text, or AI confidence may merge canonical identities automatically. A human-approved match is required.

### 1.2 `Products` — canonical identity

| Column | Type | Required | Rule |
|---|---|---:|---|
| Product_ID | ID | Yes | PK; stable internal identity |
| Lifecycle_Status | ENUM | Yes | ACTIVE, ARCHIVED |
| Canonical_Notes | TEXT(2000) | No | Internal identity notes; not supplier evidence |
| Created_At | DATETIME_UTC | Yes | Immutable creation time |
| Created_By | ACTOR_ID | Yes | Actor |

Canonical product names/translations and descriptions remain in `Product_Company`. Canonical merge/reparent is excluded from the initial release; suspected duplicates may be reviewed and archived, but records and historical references are never silently moved.

### 1.3 `Variants` — canonical model identity

| Column | Type | Required | Rule |
|---|---|---:|---|
| Variant_ID | ID | Yes | PK; stable internal identity |
| Product_ID | ID | Yes | FK → Products; immutable ownership |
| Lifecycle_Status | ENUM | Yes | ACTIVE, ARCHIVED |
| Canonical_Notes | TEXT(2000) | No | Internal notes |
| Created_At | DATETIME_UTC | Yes | Immutable |
| Created_By | ACTOR_ID | Yes | Actor |

A model number is not a canonical key. A changed supplier model number can remain the same Variant only after an explicit match decision. A genuinely different configuration receives a new Variant_ID. Canonical merge/reparent is out of initial release.

### 1.4 `Product_Source_Records`

One row per product appearance in one registered Catalog revision. It is created only after an approved identity decision.

| Column | Type | Required | Rule |
|---|---|---:|---|
| Product_Source_Record_ID | ID | Yes | PK |
| Product_ID | ID | Yes | FK → Products; approved identity only |
| Catalog_ID | ID | Yes | FK → Catalogs |
| Source_Record_Key | TEXT(160) | Yes | Deterministic occurrence key; unique with Catalog_ID |
| Source_Product_Name | TEXT(300) | Yes | Exact supplier wording; immutable |
| Source_Product_Reference | TEXT(160) | No | Exact source reference |
| Catalog_Page_ID | ID | Yes | FK → Catalog_Pages; same Catalog_ID |
| Printed_Page_Label | TEXT(80) | No | Supplier-printed page label |
| Source_Section | TEXT(200) | No | Source location |
| Source_Quote | TEXT(2000) | No | Evidence excerpt |
| Extraction_Run_ID | ID | Yes | FK → Run_Log |
| Extraction_Record_ID | ID | Yes | FK → Staging_Products |
| Identity_Resolution | ENUM | Yes | MATCH_EXISTING, CREATE_NEW |
| Match_Decision_ID | ID | Yes | FK → Identity_Match_Decisions; approved decision |
| Created_At | DATETIME_UTC | Yes | Immutable |
| Created_By | ACTOR_ID | Yes | Actor |

Unique (Catalog_ID, Source_Record_Key). REJECT_SOURCE and DEFER remain in staging and do not create source records. Raw source fields remain immutable; identity reassignment is not a routine edit.

### 1.5 `Variant_Source_Records`

One row per model/configuration appearance within a Product_Source_Record.

| Column | Type | Required | Rule |
|---|---|---:|---|
| Variant_Source_Record_ID | ID | Yes | PK |
| Variant_ID | ID | Yes | FK → Variants; approved identity only |
| Product_Source_Record_ID | ID | Yes | FK → Product_Source_Records |
| Source_Record_Key | TEXT(160) | Yes | Unique within parent source record |
| Source_Model_Number | TEXT(160) | Yes | Exact source string; immutable |
| Source_Model_Name | TEXT(250) | No | Exact source string; immutable |
| Catalog_Page_ID | ID | Yes | FK → Catalog_Pages; same catalog as parent Product_Source_Record |
| Printed_Page_Label | TEXT(80) | No | Supplier-printed page label |
| Source_Section | TEXT(200) | No | Source location |
| Source_Quote | TEXT(2000) | No | Evidence excerpt |
| Extraction_Run_ID | ID | Yes | FK → Run_Log |
| Extraction_Record_ID | ID | Yes | FK → Staging_Variants |
| Identity_Resolution | ENUM | Yes | MATCH_EXISTING, CREATE_NEW |
| Match_Decision_ID | ID | Yes | FK → Identity_Match_Decisions; approved decision |
| Created_At | DATETIME_UTC | Yes | Immutable |
| Created_By | ACTOR_ID | Yes | Actor |

Unique (Product_Source_Record_ID, Source_Record_Key). The Variant.Product_ID must equal the Product_ID of the parent Product_Source_Record. A model number collision is evidence for review, never an automatic match.

### 1.6 `Identity_Match_Decisions`

Append-only human decision ledger.

| Column | Type | Required | Rule |
|---|---|---:|---|
| Match_Decision_ID | ID | Yes | PK |
| Entity_Type | ENUM | Yes | PRODUCT, VARIANT |
| Source_Staging_Type | ENUM | Yes | STAGING_PRODUCT, STAGING_VARIANT |
| Source_Staging_ID | ID | Yes | Globally unique staging ID |
| Source_Staging_Hash | HEX64 | Yes | Exact reviewed staging hash |
| Parent_Product_Match_Decision_ID | ID | Conditional | Required for VARIANT; FK to approved PRODUCT decision |
| Candidate_Canonical_ID | ID | No | Suggested existing candidate |
| Decision | ENUM | Yes | MATCH_EXISTING, CREATE_NEW, REJECT_SOURCE, DEFER |
| Result_Canonical_ID | ID | Conditional | Required for approved MATCH_EXISTING/CREATE_NEW |
| Evidence_JSON_File_ID | DRIVE_FILE_ID | No | Immutable evidence |
| Evidence_SHA256 | HEX64 | No | Required when evidence file exists |
| Rationale | TEXT(1000) | Yes | Human rationale |
| Decided_At | DATETIME_UTC | Yes | |
| Decided_By | ACTOR_ID | Yes | |
| Supersedes_Decision_ID | ID | No | FK → Identity_Match_Decisions |

REJECT_SOURCE and DEFER remain in staging. VARIANT decisions require an approved parent PRODUCT decision and a candidate/result Variant belonging to the resolved Product_ID. A correction appends a superseding decision; it never rewrites history.

### 1.7 `Specifications` — immutable source assertions

One row per extracted supplier assertion, tied to exactly one source occurrence.

| Column | Type | Required | Rule |
|---|---|---:|---|
| Specification_ID | ID | Yes | PK |
| Source_Assertion_Key | TEXT(160) | Yes | Deterministic assertion locator within source record |
| Scope | ENUM | Yes | PRODUCT, VARIANT |
| Product_Source_Record_ID | ID | Conditional | Required for PRODUCT scope |
| Variant_Source_Record_ID | ID | Conditional | Required for VARIANT scope |
| Product_ID | ID | Yes | Canonical FK; must match source record |
| Variant_ID | ID | Conditional | Required iff VARIANT scope; must match source record |
| Attribute_Key_Source | TEXT(160) | Yes | Exact source label |
| Attribute_Value_Source | TEXT(2000) | Yes | Exact source value |
| Unit_Source | TEXT(80) | No | Exact source unit |
| Normalized_Key | TEXT(160) | No | Search/mapping only |
| Normalized_Value_JSON | JSON_TEXT(1000) | No | Typed parsed value; raw retained |
| Normalized_Unit | TEXT(80) | No | Optional normalized unit |
| Catalog_Page_ID | ID | Yes | FK → Catalog_Pages; must match source record |
| Printed_Page_Label | TEXT(80) | No | Supplier-printed page label |
| Source_Section | TEXT(200) | No | |
| Source_Quote | TEXT(2000) | No | Exact evidence excerpt |
| Extraction_Run_ID | ID | Yes | FK → Run_Log |
| Extraction_Confidence | DECIMAL(5,4) | No | 0..1; not approval |
| Created_At | DATETIME_UTC | Yes | Immutable |
| Created_By | ACTOR_ID | Yes | Actor/system |

Exactly one source-record FK is populated according to Scope. Unique (Product_Source_Record_ID, Source_Assertion_Key) for PRODUCT scope and (Variant_Source_Record_ID, Source_Assertion_Key) for VARIANT scope. Page/catalog ownership must match the selected source record.

### 1.8 Catalog revisions and pages

Keep `Catalogs` as one immutable registered file/revision per exact source PDF. Distinct revisions are distinct Catalog_ID values even when title and supplier match. `Catalog_Pages` remains a stable page index unique on (Catalog_ID, Page_Number); it stores page identity/labels only. Rendered page images, extracted text, OCR outputs, and processing status are immutable per-run artifacts tracked in Run_Units. A corrected/replaced PDF creates a new Catalog record and new pages; it never mutates the old file or page evidence. A catalog may have many Product_Source_Records; each product source record may have many Variant_Source_Records.

## 2. Deterministic specification operation ledger (SR-002)

### 2.1 Logical target key

Add these fields to `Specification_Changes`:

- `Logical_Specification_Key` (TEXT(180), required): source-backed key is `SRC:<Specification_ID>`; company-added key is `ADD:<Specification_Change_ID of the first ADD>`.
- `Sequence_No` (INTEGER, required): server-assigned strictly increasing integer within one Logical_Specification_Key, allocated under a script lock.
- `Specification_Change_ID` remains immutable and unique.
- `Operation`: ADD, UPDATE, DELETE.
- `Target_Specification_ID`: required for source-backed UPDATE/DELETE; blank for ADD and for updates/deletes of company-added logical targets.
- `Value_JSON` and `Unit_Code`: typed payload; ADD/UPDATE require a complete effective value. Blank/NULL is never a clearing operation; use DELETE to suppress an assertion or a typed explicit-empty value only when the attribute definition explicitly permits it.
- `Change_Status`: DRAFT, APPROVED, REJECTED. Do not mutate an approved event to SUPERSEDED; supersession is a new event.
- `Approved_At`, `Approved_By`, `Approval_Payload_SHA256`, `Reason`, `Created_At`, and `Created_By` required as appropriate.

Sequence numbers are allocated at approval under a lock, not at draft creation. Gaps are allowed; duplicates are not. Rejected/draft events do not enter the effective stream. The effective stream is sorted by Sequence_No ascending; a duplicate sequence for one logical key is a hard integrity error. Timestamp and ID are audit metadata, never alternative ordering authorities.

### 2.2 Deterministic reducer

For each logical key:
1. Determine its immutable base: the source Specification row for SRC keys; no base row for ADD keys.
2. Select only APPROVED events for that key.
3. Validate contiguous semantic transitions in Sequence_No order (numeric gaps are allowed).
4. Initial state is ACTIVE with the source value for SRC; ABSENT for ADD.
5. ADD is valid only when state is ABSENT and initializes ACTIVE with the full company value.
6. UPDATE is valid only when state is ACTIVE and replaces the full effective value/key/unit.
7. DELETE is valid only when state is ACTIVE and changes state to DELETED (not output).
8. UPDATE or ADD after DELETED is invalid. Reinstatement requires a new logical key and a new ADD with an explicit relation/reason; it does not resurrect deleted history.
9. A second ADD for an existing logical key is invalid.
10. The final state is the result after the last valid event. A stream with any invalid transition is quarantined from output and reported; never silently skip the invalid event.

A single source assertion may be corrected repeatedly: base → UPDATE → UPDATE. Or suppressed: base → DELETE. Company-only data: ADD → UPDATE → DELETE. The source Specification row is never changed.

### 2.3 Worked examples

| Logical key | Sequence | Operation | Payload | Effective result |
|---|---:|---|---|---|
| SRC:S-10 | base | SOURCE | 10 bar | 10 bar |
| SRC:S-10 | 1 | UPDATE | 12 bar | 12 bar |
| SRC:S-10 | 2 | UPDATE | 14 bar | 14 bar |
| SRC:S-10 | 3 | DELETE | — | Suppressed |
| ADD:C-20 | 1 | ADD | Noise = 72 dB | 72 dB |
| ADD:C-20 | 2 | UPDATE | Noise = 70 dB | 70 dB |
| ADD:C-20 | 3 | DELETE | — | Suppressed |

The examples are separate streams. After DELETE, a later UPDATE is rejected. Reversals are represented by a new ADD/logical key, never by editing old events.

### 2.4 Conflict and concurrency policy

- Allocate Sequence_No and append approval event under one Apps Script lock.
- Before approval, recompute latest sequence for that logical key and validate the proposed transition.
- If lock acquisition times out or the sheet is unavailable, approval fails closed; do not issue a sequence from cached state.
- If duplicate sequence or malformed event is found by integrity scan, quarantine that key's effective output until repaired by an audited correction event/procedure.
- Do not rely on row position, Created_At alone, or last modified row.

## 3. Immutable design dependencies and paper snapshots (SR-004, SR-014)

### 3.1 Asset immutability

Every binary asset record (brand logo, font, graphic, watermark image, paper texture, template resource) is immutable after creation: Drive_File_ID, SHA256, MIME type, byte size, and semantic role cannot be edited in place. Replacing a file creates a new asset record with a new ID and checksum. A published Brand_Version or Template_Version pins exact asset IDs and SHA256 values in its immutable config/manifest. A Drive file ID alone is not an integrity guarantee.

Published configs may not reference a mutable alias such as "current logo". They must reference exact immutable asset records. Before rendering, the worker verifies the file checksum against the pinned manifest. A mismatch blocks issuance/reproduction and creates a diagnostic event.

### 3.2 `Paper_Versions`

Adopt explicit paper versioning (rather than snapshot-only mutable Papers).

- `Papers` is the logical paper identity: Paper_ID, Paper_Name, Lifecycle_Status, Created_At, Created_By.
- `Paper_Versions` is immutable configuration:

| Column | Type | Required | Rule |
|---|---|---:|---|
| Paper_Version_ID | ID | Yes | PK |
| Paper_ID | ID | Yes | FK → Papers |
| Version_Number | INTEGER | Yes | Monotonic per Paper_ID |
| Version_Status | ENUM | Yes | DRAFT, PUBLISHED, RETIRED |
| Paper_Config_File_ID | DRIVE_FILE_ID | Yes | Immutable JSON config |
| Config_SHA256 | HEX64 | Yes | Hash of exact config |
| Texture_Asset_ID | ID | Conditional | Immutable asset; required for texture |
| Texture_SHA256 | HEX64 | Conditional | Must match asset |
| Published_At | DATETIME_UTC | No | Required when published |
| Published_By | ACTOR_ID | No | Required when published |
| Created_At | DATETIME_UTC | Yes | |
| Created_By | ACTOR_ID | Yes | |

Unique (Paper_ID, Version_Number). Published Paper_Versions and their referenced assets are immutable. Editing paper dimensions, orientation, color, texture, scaling, or positioning creates a new version. No mutable paper setting is consulted for historical reproduction.

### 3.3 Issue snapshot contract

Each Issued_Document snapshot pins IDs and SHA256 for: canonical scope/data snapshot; selected source and company specification resolution manifest; Brand_Version config; Template_Version config; Paper_Version config; every logo/font/graphic/watermark/texture/image asset used; Contact_Profile snapshot; Status/Watermark configuration; Export_Profile snapshot; renderer/worker/runtime versions; font manifest; preflight report; and final PDF. Store large manifests in Drive and their file IDs plus SHA256 in the issue record. The original issued PDF is immutable and never overwritten.

## 4. Retry lineage, staging review, and promotion integrity (SR-005–SR-007)

### 4.1 Run lineage

Add to `Run_Log`:
- `Logical_Job_ID` (ID, required): same across all attempts of one logical job.
- `Parent_Run_ID` (ID, nullable): self-FK to immediately preceding attempt; blank for first attempt.
- `Retry_Reason` (TEXT(1000), nullable).
- `Attempt_Number` (INTEGER, required): starts at 1 and increments by one within Logical_Job_ID.
- `Idempotency_Key` remains unique per attempt, not per logical job.

A retry creates a new Run_ID, increments Attempt_Number, points Parent_Run_ID to the previous attempt, and reuses only completed work units whose input fingerprint and output manifest hash match. Never reset a terminal run. A retry may not change Catalog_ID or the logical input manifest without becoming a new Logical_Job_ID.

### 4.2 Review links

Remove `Review_Queue_ID` from the common staging envelope. Add `Review_Staging_Links`:

| Column | Type | Required | Rule |
|---|---|---:|---|
| Review_Staging_Link_ID | ID | Yes | PK |
| Review_Queue_ID | ID | Yes | FK → Review_Queue |
| Staging_ID | ID | Yes | FK → typed staging row |
| Review_Role | ENUM | Yes | PRIMARY, RELATED, EVIDENCE |
| Created_At | DATETIME_UTC | Yes | Immutable |
| Created_By | ACTOR_ID | Yes | Actor |

Unique (Review_Queue_ID, Staging_ID, Review_Role). One staging row may participate in multiple independent reviews; links are never overwritten.

### 4.3 Review payload hashes

Every staging row receives a canonical serialization and SHA256 hash over all decision-relevant fields, source IDs, source page/region, raw source strings, normalized proposals, and candidate canonical IDs. The review decision stores:
- Staging_ID and Staging_Record_Hash;
- Reviewed_Payload_Hash (hash of the exact accepted decision payload);
- accepted/rejected candidate IDs and field-level corrections;
- reviewer, timestamp, rationale, and superseded decision ID if applicable.

Promotion is allowed only if the current staging hash exactly equals the approved Staging_Record_Hash and the decision payload hash verifies. Any edit to a decision-relevant field invalidates prior approval and creates a new review task. Do not rewrite the prior decision. Hash serialization must be canonical (UTF-8, stable field order, normalized null representation, no locale-dependent formatting).

### 4.4 Staging identity and promotion

Staging product/model rows retain exact raw source strings and are linked to candidate canonical IDs only as suggestions. A human decision records MATCH_EXISTING or CREATE_NEW. Promotion creates/links canonical entities and source records in a single logical operation with a deterministic promotion key. If the multi-sheet write partially fails, the operation is marked IN_DOUBT and is reconciled before retry; it must not create another canonical ID. Store the mapping Staging_ID → promoted source-record ID and canonical ID permanently.

## 5. Integrity contracts and recovery (SR-008–SR-014)

### 5.1 Polymorphic target contract

For Document_Links and Image_Links, all writes must call a shared `resolveTarget(Target_Type, Target_ID)` validator. It must:
1. Accept only the exact supported type enum.
2. Resolve the target table and confirm target exists.
3. Confirm target lifecycle permits linking.
4. For Variant targets, confirm the Variant and parent Product exist and are ACTIVE or explicitly allowed by lifecycle policy. Canonical merge/reparent operations are out of initial release; archived canonical records cannot receive new links.
5. Confirm referenced document versions belong to the same Doc_ID; image links resolve to an available canonical asset.
6. Reject type/ID mismatches, orphan targets, and ownership mismatches.
7. Run during create, update, import, promotion, and before issue.
8. Be mirrored by a periodic orphan/ownership integrity scan.

Sheets cannot enforce this as a native FK; this is a mandatory application contract.

### 5.2 Document first-version protocol

Under a script lock: create Documents row with Current_Version_ID blank and lifecycle DRAFT; create immutable first Document_Versions row; validate same Doc_ID and file hash; update Current_Version_ID; then mark document ACTIVE and append audit event. A failed sequence leaves a non-issuable incomplete document for reconciliation. Rollback changes the pointer to an existing valid version and is audited; versions are never edited/deleted.

### 5.3 Image duplicate canonicalization

Reject Duplicate_Of_Image_ID equal to self. Resolve every proposed chain to one terminal canonical asset and reject cycles. The terminal asset must be AVAILABLE and not QUARANTINED; archived targets require explicit audited override. Link redirection is a separate audited operation. Preserve all original asset records/files and historical link evidence.

### 5.4 System configuration

Add `System_Config` (non-secret key/value registry) with Config_Key, Value_Type, Value_Text, Environment_ID, Schema_Version, Updated_At, Updated_By, and Description. Store spreadsheet IDs, Drive folder IDs, schema version, non-secret feature flags, and initialization state only. Credentials, OAuth tokens, API keys, signing secrets, and worker credentials belong in Script Properties or a managed secret store; never GitHub or Sheets.

### 5.5 Hash manifest registry

Every immutable artifact that can affect output or approval must have a SHA256: source catalog PDF, extracted raw payload, source assertion manifest, staging review payload, decision JSON, brand/template/paper configs, fonts, image assets, watermark assets, preflight report, issue snapshot, and issued PDF. A Drive ID is a locator, not a content-integrity proof.

### 5.6 Backup, integrity scan, and recovery sequence

- Before schema initialization, migration, bulk promotion, and release: create a timestamped backup of every Sheet and a Drive manifest of referenced immutable files; verify backup file existence and checksums.
- Schedule an integrity scan that checks PK uniqueness, required fields, enum validity, FK existence/ownership, unique keys, sequence collisions, review-hash drift, orphan links, redirect cycles, version-pointer ownership, and missing/hash-mismatched Drive files.
- Classify findings as BLOCKING (quarantine affected output/write path), REPAIRABLE (audited repair procedure), or WARNING (non-blocking with explicit rationale).
- Never auto-delete or auto-merge during repair. Produce a report first, then apply an idempotent audited repair.
- For partial multi-sheet writes, record operation ID and intended row IDs before writes; reconcile actual rows by IDs and hashes; complete missing writes or quarantine conflicts. Do not rerun blindly.
- Restore drills use a disposable copy. Restore both Sheets and Drive artifacts from a consistent backup point, verify hashes and FK integrity, then switch configuration pointers under lock. Retain pre-restore backup.
- Exact backup cadence, RPO/RTO, quotas, and scale thresholds remain operational decisions before production.

### 5.7 Google Sheets volume gate

Before production, benchmark representative small/median/large catalogs and worst-case product/model/spec/image relationships. Record row counts, file sizes, extraction duration, batch sizes, Apps Script quotas, lock contention, API latency, and UI polling. Define explicit maximums and a migration trigger to a relational store if limits are exceeded. Do not assume Sheets remains suitable at any scale without measurement.

### 5.8 Product brand naming

Rename `Product_Company.Brand_Label` to `Manufacturer_or_Product_Brand_Label` (or a controlled Product_Brands relation if later required). It is unrelated to document-design `Brands`.

## 6. Required follow-up edits to domain schema

The domain documents should be consolidated to reflect these rules:
- Source & Products: canonical Products/Variants, source-record tables, immutable source specifications, and operation ledger.
- Workflow & Audit: run lineage, typed staging source assertions, review links, hash-bound decisions, promotion reconciliation, System_Config.
- Documents & Images: immutable binary asset records, canonical target resolver, duplicate-cycle prevention.
- Design & Issued Output: Brand/Template asset manifests, Paper_Versions, full issue dependency hashes.
- Index: include new tables and this proposal; do not list legacy single-source identity as current truth.

## 7. Implementation gate

This is a design proposal only. It does not create Sheets, Drive folders, app code, worker code, or migrate legacy records. Implementation begins only after the user approves the consolidated schema, acceptance suite, operational limits, and security/recovery plan.


## 8. V2.1 consolidation amendments — source occurrence, asset and transaction integrity

The following refinements are normative additions to the correction set and must be reflected in the final consolidated table inventory.

### 8.1 Stable source occurrence keys

- Each Product_Source_Record has a Source_Record_Key unique within Catalog_ID. It identifies one product occurrence, not the canonical product.
- Each Variant_Source_Record has a Source_Record_Key unique within its parent Product_Source_Record_ID.
- Each Specification has a Source_Assertion_Key unique within its exact source record.
- Reprocessing the same source revision must resolve to the same occurrence keys and must not create duplicate assertions. If extraction segmentation changes, the new proposal is reviewed as a new source occurrence; the prior evidence is retained.
- Product/variant source records are created only after an approved MATCH_EXISTING or CREATE_NEW decision. REJECT_SOURCE and DEFER remain in staging.

### 8.2 Immutable page identity and per-run checkpoints

Catalog_Pages is a stable index of physical PDF pages and contains no mutable processing status or generated page artifacts. Run_Units stores per-run page checkpoints, input fingerprints, output manifests, and reuse lineage. This prevents a retry or a newer extraction engine from overwriting prior page evidence.

### 8.3 Image original vs rendition

Image_Assets stores the immutable original-file identity and source provenance. Image_Renditions stores every immutable derived preview/high-quality/catalog-ready rendition with its own file checksum, dimensions, source hash, and pipeline version. Image_Links may pin only a rendition belonging to the same Image_ID and an allowed rendition type. Issued manifests pin exact rendition IDs and hashes.

### 8.4 Shared design asset registry

Design_Assets is the immutable binary registry for logos, fonts, graphics, icons, backgrounds, textures, and watermark assets. Brand_Assets is a role association between Brands and Design_Assets. Paper_Versions and Watermark_Presets reference Design_Assets rather than untyped Drive IDs. Product photography remains in the separate Image_Assets domain.

### 8.5 Review-set integrity and promotion ledgers

- Review_Staging_Links is the only authoritative relation between a review task and typed staging rows. The old singular staging-to-review field and redundant Target_Staging_ID/Related_Staging_IDs fields are removed.
- A review task snapshots the ordered linked Staging_ID + Staging_Record_Hash set in an immutable manifest. Approval stores the manifest SHA256 and Reviewed_Payload_Hash.
- Promotion_Operations stores a deterministic promotion key and intended-output manifest. Promotion_Mappings is the authoritative staging-to-production map.
- A partial multi-sheet write enters IN_DOUBT and is reconciled by deterministic IDs and payload hashes; blind replay is forbidden.

### 8.6 Issue transaction and multi-product membership

- Issue_Operations is the recoverable transaction envelope for a PDF issue request.
- Issued_Documents contains only final, validated issue records.
- Issued_Document_Items provides queryable product/variant membership for datasheets, product catalogs, and master catalogs.
- Every final issue pins Paper_Version_ID, brand/template versions, exact design/image renditions, source/effective data snapshot, font and renderer fingerprints, preflight report, and final PDF SHA256 in an immutable dependency manifest.

### 8.7 Canonical naming

Product_Company.Product_Name_EN and Variant_Company.Model_Name_EN are company-approved canonical display labels. They are not supplier source strings; those remain in Product_Source_Records and Variant_Source_Records. Arabic translations are separate company-managed fields.

### 8.8 Updated table inventory delta

Add to the initial inventory: Run_Units, Image_Renditions, Design_Assets, Issued_Document_Items, Issue_Operations, Review_Staging_Links, Promotion_Operations, Promotion_Mappings, and System_Config. The complete inventory in DATABASE_SCHEMA.md is the current authoritative list pending final approval.


### 8.9 Canonical merge scope

Canonical Product/Variant merge and reparent workflows are deliberately excluded from the initial release. The schema therefore uses only ACTIVE and ARCHIVED lifecycle states and does not expose MERGED pointers without a complete merge ledger. Suspected duplicates are review candidates; they may be archived after review, but the system must not silently move source records, variants, attributes, documents, images, or historical issue membership between canonical IDs. A future merge capability requires a separate ADR, impact manifest, child-variant mapping rules, rollback plan, and migration tests.


### 8.10 Document-version provenance

Each Document_Versions row preserves the provenance of that exact binary revision. CATALOG_EMBEDDED versions require catalog, page, extraction run, and staging-document references. MANUAL_UPLOAD versions record the authenticated uploader and do not invent catalog provenance. EXTERNAL_LINK versions retain the source URL and retrieval/verification notes while storing and hashing the downloaded bytes. Product/variant source-record links, when present, must resolve to the same catalog/page context. A later document version never overwrites the provenance of an earlier version.
