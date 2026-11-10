# Detailed Schema — Workflow, Staging & Audit

**Status:** Detailed proposal for review; not implementation authorization.
**Purpose:** Support resumable extraction, human review, safe promotion, traceability, and operational recovery.

## 1. Shared conventions
- Every job and staged entity has a stable ID.
- Staging rows are proposals, never production truth.
- A staging record may be promoted once only; retries must be idempotent.
- Keep original source evidence and extraction output available for review.
- UTC ISO-8601 timestamps.
- Actor_ID identifies a system or human actor; the initial single-primary-user scope does not require a user/role administration subsystem.

## 2. Run log

### `Run_Log`
One row per worker operation, including catalog extraction, image processing, PDF rendering, and reproduction checks.

| Column | Type | Required | Key / rule |
|---|---|---:|---|
| Run_ID | ID | Yes | PK |
| Run_Type | ENUM | Yes | CATALOG_EXTRACTION, IMAGE_PROCESSING, PDF_GENERATION, PDF_REPRODUCTION, VALIDATION, MANUAL_IMPORT |
| Catalog_ID | ID | No | FK → Catalogs for catalog runs |
| Logical_Job_ID | ID | Yes | Stable across attempts of one logical job |
| Parent_Run_ID | ID | No | Self-FK to immediately preceding attempt |
| Attempt_Number | INTEGER | Yes | Starts at 1; increments per Logical_Job_ID |
| Retry_Reason | TEXT(1000) | Conditional | Required when Attempt_Number > 1 |
| Idempotency_Key | TEXT(160) | Yes | Unique per attempt, not per logical job |
| Run_Status | ENUM | Yes | QUEUED, RUNNING, WAITING_REVIEW, RETRY_PENDING, COMPLETED, FAILED, CANCELLED |
| Current_Step | TEXT(120) | No | Human-readable step |
| Total_Units | INTEGER | No | Pages/items expected |
| Completed_Units | INTEGER | Yes | >= 0 and <= Total_Units when known |
| Failed_Units | INTEGER | Yes | >= 0 |
| Worker_Version | TEXT(80) | No | Build identifier |
| Started_At | DATETIME_UTC | No | |
| Heartbeat_At | DATETIME_UTC | No | Detect stalled workers |
| Worker_Lease_ID | TEXT(160) | No | Current worker claim token/identifier; never a secret |
| Lease_Expires_At | DATETIME_UTC | No | Lease expiry; reclaim only after expiry and reconciliation |
| Finished_At | DATETIME_UTC | No | |
| Error_Code | TEXT(80) | No | Machine-readable |
| Error_Summary | TEXT(1500) | No | No secrets or sensitive payloads |
| Input_Manifest_File_ID | DRIVE_FILE_ID | No | Immutable job input manifest |
| Output_Manifest_File_ID | DRIVE_FILE_ID | No | Result manifest |
| Created_At | DATETIME_UTC | Yes | System generated |
| Created_By | ACTOR_ID | Yes | Actor |

Unique: Idempotency_Key and (Logical_Job_ID, Attempt_Number). Attempt 1 has no Parent_Run_ID; each later attempt points to the immediately preceding Run_ID, uses the same Run_Type and exact logical input manifest, and increments Attempt_Number by one. Retry_Reason is required for attempts >1. Terminal runs are never reset. Reuse completed work units only when input fingerprint and output manifest hash match. A changed catalog file SHA256 or logical input manifest requires a new Logical_Job_ID.

### `Run_Units`
One row per logical work unit within a run (normally one catalog page for extraction). This is the durable checkpoint ledger used for resume and retry decisions.

| Column | Type | Required | Rule |
|---|---|---:|---|
| Run_Unit_ID | ID | Yes | PK |
| Run_ID | ID | Yes | FK → Run_Log |
| Unit_Type | ENUM | Yes | CATALOG_PAGE, IMAGE, PRODUCT_BATCH, PDF_STAGE, OTHER |
| Unit_Key | TEXT(180) | Yes | Stable logical key within this run, e.g. Catalog_Page_ID |
| Catalog_Page_ID | ID | No | FK → Catalog_Pages when unit is a page |
| Unit_Status | ENUM | Yes | PENDING, RUNNING, COMPLETED, FAILED, SKIPPED, REUSED |
| Input_SHA256 | HEX64 | Yes | Exact input fingerprint for this unit |
| Output_Manifest_File_ID | DRIVE_FILE_ID | No | Immutable outputs for this unit |
| Output_SHA256 | HEX64 | No | Exact output manifest fingerprint |
| Reused_From_Run_Unit_ID | ID | No | FK → Run_Units; allowed only when input/output fingerprints verify |
| Attempt_Started_At | DATETIME_UTC | No | |
| Attempt_Finished_At | DATETIME_UTC | No | |
| Error_Code | TEXT(80) | No | |
| Created_At | DATETIME_UTC | Yes | |

Unique (Run_ID, Unit_Type, Unit_Key). A completed unit is reusable only if its input fingerprint and output manifest hash verify and it belongs to the same Logical_Job_ID; cross-job reuse requires an explicit approved artifact-reuse policy. The page identity itself is in Catalog_Pages; processing artifacts/status belong here, not on Catalog_Pages.

### `Run_Events`
Append-only event history for progress, retries, and diagnostics.

| Column | Type | Required | Key / rule |
|---|---|---:|---|
| Run_Event_ID | ID | Yes | PK |
| Event_Idempotency_Key | TEXT(180) | Yes | Unique; duplicate callback/event is ignored |
| Run_ID | ID | Yes | FK → Run_Log |
| Event_Type | ENUM | Yes | CREATED, STARTED, PROGRESS, WARNING, ERROR, RETRY, WAITING_REVIEW, RESUMED, LEASE_ACQUIRED, LEASE_EXPIRED, UNIT_REUSED, RESULT_ACCEPTED, COMPLETED, CANCELLED |
| Unit_Type | TEXT(80) | No | PAGE, IMAGE, PRODUCT, VARIANT, PDF |
| Unit_Reference_ID | ID | No | Related unit |
| Progress_Count | INTEGER | No | |
| Message | TEXT(1500) | No | Human-readable |
| Details_File_ID | DRIVE_FILE_ID | No | Large structured diagnostic details |
| Occurred_At | DATETIME_UTC | Yes | System generated |
| Actor_ID | ACTOR_ID | Yes | Worker/user |

## 3. Staging entities

Use typed staging sheets rather than a single catch-all table. Every row has a common envelope plus type-specific fields.

### Common staging envelope
The following columns appear in each staging sheet:

| Column | Type | Required | Rule |
|---|---|---:|---|
| Staging_ID | ID | Yes | PK |
| Run_ID | ID | Yes | FK → Run_Log |
| Catalog_ID | ID | No | FK → Catalogs; required for catalog-derived rows, null for manual uploads |
| Catalog_Page_ID | ID | No | FK → Catalog_Pages; required when page-level source evidence exists |
| Source_Region | TEXT(120) | No | Coordinates/region label |
| Raw_Extract_File_ID | DRIVE_FILE_ID | No | Evidence payload |
| Extracted_Text | TEXT(4000) | No | Relevant text snippet |
| Extraction_Method | ENUM | Yes | EMBEDDED_TEXT, TABLE_PARSER, OCR, IMAGE_EXTRACTION, MANUAL |
| Extraction_Tool_Version | TEXT(120) | No | Exact parser/OCR build or service version |
| Source_Key_Algorithm_Version | TEXT(80) | Conditional | Required for product, variant, and specification staging; blank for image/document staging unless a source-key algorithm is explicitly used |
| Confidence | DECIMAL(5,4) | No | 0..1; not an approval |
| Proposed_Status | ENUM | Yes | NEW, NEEDS_REVIEW, REJECTED, PROMOTED |
| Staging_Record_Hash | HEX64 | Yes | Canonical hash of all decision-relevant staging fields |
| Created_At | DATETIME_UTC | Yes | System generated |
| Updated_At | DATETIME_UTC | Yes | System generated |

### `Staging_Products`
| Column | Type | Required | Rule |
|---|---|---:|---|
| Proposed_Product_Name_EN | TEXT(300) | Yes | Exact extracted supplier name |
| Proposed_Product_Reference | TEXT(120) | No | Exact supplier reference |
| Candidate_Product_ID | ID | No | Suggested canonical candidate only |
| Identity_Match_Method | TEXT(80) | No | Method/version used to suggest candidate |
| Match_Confidence | DECIMAL(5,4) | No | 0..1; not approval |
| Source_Record_Key | TEXT(160) | Yes | Catalog_ID is required for product staging; deterministic occurrence key within Catalog_ID |

### `Staging_Variants`
| Column | Type | Required | Rule |
|---|---|---:|---|
| Parent_Staging_Product_ID | ID | No | Blank at intake; reviewer assigns the product parent explicitly before promotion |
| Proposed_Model_Number | TEXT(160) | Yes | Exact supplier model number |
| Proposed_Model_Name | TEXT(250) | No | Exact supplier model name |
| Candidate_Variant_ID | ID | No | Suggested canonical candidate only |
| Identity_Match_Method | TEXT(80) | No | Method/version used to suggest candidate |
| Match_Confidence | DECIMAL(5,4) | No | 0..1; not approval |
| Source_Record_Key | TEXT(160) | Yes | Deterministic model occurrence key within parent source record |
| Source_Key_Algorithm_Version | TEXT(80) | Yes | Must match common staging envelope |

### `Staging_Specifications`
| Column | Type | Required | Rule |
|---|---|---:|---|
| Parent_Staging_Product_ID | ID | No | Blank at intake; reviewer assigns the product parent explicitly before promotion |
| Parent_Staging_Variant_ID | ID | No | FK → Staging_Variants; required iff Scope=VARIANT |
| Source_Assertion_Key | TEXT(160) | Yes | Deterministic assertion locator |
| Source_Key_Algorithm_Version | TEXT(80) | Yes | Must match common staging envelope |
| Scope | ENUM | No | PRODUCT, VARIANT; reviewer assigns scope explicitly before promotion |
| Attribute_Key_Raw | TEXT(160) | Yes | Exact source label |
| Value_Raw | TEXT(2000) | Yes | Exact source value |
| Unit_Raw | TEXT(80) | No | Exact source unit |
| Normalized_Key | TEXT(160) | No | Search/mapping only |
| Normalized_Value_JSON | JSON_TEXT(1000) | No | Parsed typed value; raw value retained |
| Normalized_Unit | TEXT(80) | No | Normalized unit |
| Parse_Status | ENUM | Yes | UNPARSED, PARSED, AMBIGUOUS, INVALID |

Scope=VARIANT requires Parent_Staging_Variant_ID and the variant must belong to Parent_Staging_Product_ID. Scope=PRODUCT forbids Parent_Staging_Variant_ID.

### `Staging_Images`
| Column | Type | Required | Rule |
|---|---|---:|---|
| Proposed_Image_File_ID | DRIVE_FILE_ID | Yes | Staged original upload/extracted image |
| Original_File_Name | TEXT(255) | Yes | Source filename |
| MIME_Type | TEXT(100) | Yes | Validated |
| Width_PX | INTEGER | No | > 0 when decoded |
| Height_PX | INTEGER | No | > 0 when decoded |
| File_Size_Bytes | INTEGER | Yes | >= 0 |
| SHA256 | HEX64 | Yes | Exact file hash |
| PHash | TEXT(64) | No | Candidate similarity only |
| Candidate_Product_ID | ID | No | Suggestion only |
| Candidate_Variant_ID | ID | No | Suggestion only |
| Image_Role | TEXT(80) | No | Proposed role |
| Quality_Status | ENUM | Yes | UNASSESSED, ACCEPTABLE, LOW_RESOLUTION, NEEDS_REVIEW |
| Page_Number | INTEGER | No | 1-based source PDF page number |
| Has_Alpha | BOOLEAN | No | True/false transparency metadata |

### `Staging_Documents`
| Column | Type | Required | Rule |
|---|---|---:|---|
| Proposed_Document_File_ID | DRIVE_FILE_ID | Yes | Immutable staged source file |
| Title | TEXT(250) | Yes | Proposed display title |
| Document_Type | ENUM | Yes | USER_MANUAL, BROCHURE, CERTIFICATE, WARRANTY, OTHER |
| Language_Code | TEXT(10) | No | BCP-47 |
| File_Size_Bytes | INTEGER | Yes | >= 0 |
| SHA256 | HEX64 | Yes | Exact file hash |
| Candidate_Product_ID | ID | No | Suggestion only |
| Candidate_Variant_ID | ID | No | Suggestion only |

Do not create a separate staging sheet for every catalog or product. Staging sheets are shared across runs.

## 4. Review queue

### `Review_Queue`
One row per human-review task. It may cover linked staging rows from one or more runs. Membership is represented only by Review_Staging_Links; the immutable review manifest captures the exact linked staging IDs and hashes. Run lineage is derived from the linked staging records.

| Column | Type | Required | Key / rule |
|---|---|---:|---|
| Review_Queue_ID | ID | Yes | PK |
| Review_Type | ENUM | Yes | PRODUCT_MATCH, VARIANT_MATCH, SPECIFICATION, IMAGE_DUPLICATE, IMAGE_QUALITY, DOCUMENT_MATCH, EXTRACTION_AMBIGUITY, OTHER |
| Priority | ENUM | Yes | LOW, NORMAL, HIGH |
| Review_Status | ENUM | Yes | OPEN, IN_REVIEW, APPROVED, REJECTED, DEFERRED, STALE, SUPERSEDED |
| Proposed_Action | TEXT(500) | No | Suggested action, not executed automatically |
| Decision_JSON_File_ID | DRIVE_FILE_ID | No | Immutable structured decision payload; required for final decision |
| Decision_SHA256 | HEX64 | No | Required when Decision_JSON_File_ID is set |
| Staging_Set_Manifest_File_ID | DRIVE_FILE_ID | No | Immutable ordered list of linked staging IDs and their hashes |
| Staging_Set_SHA256 | HEX64 | No | Hash of the exact staging set manifest |
| Reviewed_Payload_Hash | HEX64 | No | Hash of exact decision + staging set manifest |
| Decision_Notes | TEXT(1500) | No | Human rationale |
| Assigned_Actor_ID | ACTOR_ID | No | Optional |
| Created_At | DATETIME_UTC | Yes | System generated |
| Created_By | ACTOR_ID | Yes | Actor |
| Reviewed_At | DATETIME_UTC | No | |
| Reviewed_By | ACTOR_ID | No | Required for final decision |

Approval must identify exactly which staging record(s) and proposed values were accepted. Rejected/deferred items remain traceable. A review decision does not silently modify source evidence. Final decisions require immutable decision JSON, Decision_SHA256, Staging_Set_Manifest_File_ID, Staging_Set_SHA256, and Reviewed_Payload_Hash. A staging payload change moves every linked APPROVED review to STALE through an audited event. Promotion re-computes each current staging row hash and the ordered set manifest; any mismatch invalidates the approval.

## 5. Audit log

### `Audit_Log`
Append-only record of material user/system changes to company-managed data, approvals, promotion, version publication, and issued outputs.

| Column | Type | Required | Key / rule |
|---|---|---:|---|
| Audit_ID | ID | Yes | PK |
| Event_Idempotency_Key | TEXT(180) | Yes | Unique; prevents duplicate audit writes during retry |
| Payload_SHA256 | HEX64 | Yes | Canonical event payload hash |
| Event_At | DATETIME_UTC | Yes | System timestamp |
| Actor_ID | ACTOR_ID | Yes | Human or service actor |
| Action | ENUM | Yes | CREATE, UPDATE, APPROVE, REJECT, PROMOTE, ARCHIVE, PUBLISH, ISSUE, RESTORE_POINTER, LINK, UNLINK, OVERRIDE_WARNING |
| Entity_Type | TEXT(100) | Yes | Logical table/entity |
| Entity_ID | ID | Yes | Stable target ID |
| Field_Name | TEXT(120) | No | Field changed, if one-field event |
| Before_Value_JSON | JSON_TEXT(3000) | No | Redact secrets; large values stored externally |
| After_Value_JSON | JSON_TEXT(3000) | No | Redact secrets; large values stored externally |
| Change_Manifest_File_ID | DRIVE_FILE_ID | No | Full multi-field before/after payload |
| Reason | TEXT(1000) | No | Rationale |
| Related_Run_ID | ID | No | FK → Run_Log |
| Related_Review_ID | ID | No | FK → Review_Queue |

Audit rows are append-only. For large changes, store an immutable JSON manifest in Drive and retain its checksum in an extended field or manifest. Do not log credentials, access tokens, or secrets.

## 6. Promotion and idempotency rules
1. Staging is never queried as approved production data by the PDF renderer.
2. Promotion requires Review_Status=APPROVED or a documented high-confidence policy explicitly approved later; current baseline requires human approval for ambiguous/conflicting items.
3. Each staging row can be promoted once. Promoted_Entity_ID is written atomically as far as the chosen Sheets/API workflow permits.
4. A retry checks existing Staging_ID → Promoted_Entity_ID before creating a production record.
5. If promotion partially fails, recovery reconciles IDs and audit events before retrying.
6. Source catalog and page provenance is copied into production source records.
7. Legacy imports use the same isolated staging/review/promotion path; never write directly to production.
8. A failed or cancelled run preserves completed page results and can resume from the last committed unit without duplicating rows.

## 7. Google Sheets implementation constraints
Google Sheets does not provide relational foreign keys, unique indexes, transactions, or append-only guarantees equivalent to a database engine. The application/Apps Script layer must implement:
- Central ID generation.
- FK existence and ownership validation.
- Uniqueness checks under a lock to reduce concurrent write races.
- Controlled state transitions.
- Append-only audit/staging/version behavior.
- Batch writes with reconciliation and idempotency keys.
- Periodic integrity scans and backup/restore tests.

The exact locking, batching, and recovery implementation belongs to the later technical design and must be tested on a disposable spreadsheet before production use.


## 8. V2 integrity amendments (normative proposal)

### 8.1 `Review_Staging_Links`

The singular Review_Queue_ID has been removed from the common staging envelope. One staging row may require several independent reviews, and one review may cover multiple staging rows. Use this join sheet:

| Column | Type | Required | Rule |
|---|---|---:|---|
| Review_Staging_Link_ID | ID | Yes | PK |
| Review_Queue_ID | ID | Yes | FK → Review_Queue |
| Staging_ID | ID | Yes | FK to exactly one typed staging sheet |
| Review_Role | ENUM | Yes | PRIMARY, RELATED, EVIDENCE |
| Created_At | DATETIME_UTC | Yes | Immutable |
| Created_By | ACTOR_ID | Yes | Actor |

Unique (Review_Queue_ID, Staging_ID, Review_Role). Never overwrite prior review links. Staging_ID is globally unique across all typed staging sheets; the application verifies exactly one typed target exists.

### 8.2 Hash-bound review decisions

For every staging record, compute a canonical SHA256 over all decision-relevant values: raw source strings, source Catalog/Page/Region, normalized proposals, candidate canonical IDs, parent staging IDs, and relevant file checksums. The review decision stores Staging_Record_Hash and Reviewed_Payload_Hash. Promotion is allowed only if both hashes verify and the current staging hash equals the hash approved by the reviewer. Any changed value transitions the prior review to STALE and requires a new review decision. A superseded review is retained as SUPERSEDED; neither status can authorize promotion. Decision corrections append a new decision; they do not rewrite old review history.

Canonical serialization must use UTF-8, stable field ordering, explicit null representation, and locale-independent numeric formatting. Staging_Record_Hash excludes its own hash field and volatile system timestamps; it includes all source evidence, proposals, candidate IDs, parent IDs, and relevant file checksums. Any edit to a decision-relevant field recomputes the hash and invalidates prior review approvals.

### 8.3 Source matching and promotion staging

Staging product/model rows are source assertion candidates, not canonical entities. Candidate_Product_ID/Candidate_Variant_ID are suggestions only. Human decision values are MATCH_EXISTING, CREATE_NEW, REJECT_SOURCE, or DEFER. Promotion creates/links the canonical entity and the corresponding Product_Source_Record/Variant_Source_Record. Promotion_Mappings is the authoritative Staging_ID → production/canonical ID map. The application validates Staging_Type + Staging_ID and Production_Entity_Type + Production_Entity_ID against the exact typed tables; Canonical_Entity_Type + Canonical_Entity_ID must agree with the identity decision and ownership chain. A deterministic promotion key prevents duplicate canonical records after retries.

### 8.4 Partial-write reconciliation

Before a multi-sheet promotion, persist an operation ID, deterministic promotion key, intended entity IDs, and payload hashes. If any write fails, mark the operation IN_DOUBT. Reconcile actual rows by IDs and hashes before retrying. Complete missing rows or quarantine conflicting rows; never blindly rerun the entire promotion. Audit every repair.

### 8.5 `System_Config`
Non-secret configuration registry only.

| Column | Type | Required | Rule |
|---|---|---:|---|
| Config_ID | ID | Yes | PK |
| Config_Key | TEXT(160) | Yes | Unique within Environment_ID |
| Value_Type | ENUM | Yes | TEXT, INTEGER, BOOLEAN, JSON, DRIVE_FILE_ID, SPREADSHEET_ID |
| Value_Text | TEXT(4000) | Yes | Validated according to Value_Type; large config uses Drive JSON file + checksum |
| Environment_ID | ENUM | Yes | DEV, TEST, PROD |
| Schema_Version | TEXT(40) | Yes | Compatible schema version |
| Is_Secret | BOOLEAN | Yes | Must always be false in this table |
| Updated_At | DATETIME_UTC | Yes | System generated |
| Updated_By | ACTOR_ID | Yes | Actor |
| Description | TEXT(500) | No | Purpose |

Unique (Environment_ID, Config_Key). Credentials, API keys, OAuth tokens, signing secrets, and worker credentials belong in Script Properties or a managed secret store, never GitHub or Sheets.

### 8.6 Run retry semantics

A retry is a new attempt under the same Logical_Job_ID, with a new Run_ID and Idempotency_Key, Parent_Run_ID set to the preceding attempt, and Attempt_Number incremented. A retry may reuse committed page outputs only when the page input fingerprint and output hash match. A changed source PDF or logical input manifest requires a new Logical_Job_ID.

### 8.7 Operational integrity scan

A scheduled/manual integrity scan checks primary-key uniqueness, required values, enum validity, foreign keys and ownership, duplicate sequence numbers, review hash drift, orphan polymorphic links (Document_Links, Image_Links, Review_Staging_Links, Identity_Match_Decisions, Promotion_Mappings, Audit_Log, and Run_Events), image redirect cycles, document-version pointer ownership, missing Drive files, and SHA256 mismatches. Every polymorphic reference must be validated by a shared typed resolver on write and during scans. Findings are classified BLOCKING, REPAIRABLE, or WARNING. Repairs are report-first, idempotent, audited, and never auto-merge/delete data.


## 9. Promotion transaction ledgers

### `Promotion_Operations`

One row per logical promotion attempt spanning one or more sheets. It provides a recoverable transaction envelope because Sheets cannot provide atomic multi-sheet transactions.

| Column | Type | Required | Rule |
|---|---|---:|---|
| Promotion_Operation_ID | ID | Yes | PK |
| Promotion_Key | TEXT(180) | Yes | Unique deterministic key for the approved staging set and decision version |
| Run_ID | ID | Yes | FK → Run_Log |
| Operation_Status | ENUM | Yes | PREPARED, APPLYING, IN_DOUBT, COMPLETED, QUARANTINED, CANCELLED |
| Staging_Set_Manifest_File_ID | DRIVE_FILE_ID | Yes | Immutable ordered staging ID/hash manifest |
| Staging_Set_SHA256 | HEX64 | Yes | Manifest hash |
| Intended_Output_Manifest_File_ID | DRIVE_FILE_ID | Yes | Intended IDs and row payload hashes |
| Intended_Output_SHA256 | HEX64 | Yes | Manifest hash |
| Created_At | DATETIME_UTC | Yes | System generated |
| Created_By | ACTOR_ID | Yes | Actor |
| Started_At | DATETIME_UTC | No | Set when APPLYING begins |
| Finished_At | DATETIME_UTC | No | |
| Recovery_Notes | TEXT(1500) | No | Audited recovery rationale |

### `Promotion_Mappings`

One row per promoted staging-to-production relationship. This is the authoritative mapping. Staging rows do not store production entity pointers; all promoted relationships are resolved through this ledger.

| Column | Type | Required | Rule |
|---|---|---:|---|
| Promotion_Mapping_ID | ID | Yes | PK |
| Promotion_Operation_ID | ID | Yes | FK → Promotion_Operations |
| Staging_Type | ENUM | Yes | PRODUCT, VARIANT, SPECIFICATION, IMAGE, DOCUMENT |
| Staging_ID | ID | Yes | Globally unique staging ID |
| Production_Entity_Type | ENUM | Yes | PRODUCT, VARIANT, PRODUCT_SOURCE_RECORD, VARIANT_SOURCE_RECORD, SPECIFICATION, IMAGE_ASSET, DOCUMENT |
| Production_Entity_ID | ID | Yes | Stable production ID |
| Canonical_Entity_Type | ENUM | No | PRODUCT or VARIANT when the mapping also establishes canonical identity |
| Canonical_Entity_ID | ID | No | Product_ID or Variant_ID where relevant |
| Identity_Match_Decision_ID | ID | No | FK → Identity_Match_Decisions for PRODUCT/VARIANT identity mapping |
| Payload_SHA256 | HEX64 | Yes | Exact promoted row payload |
| Created_At | DATETIME_UTC | Yes | Immutable |

Unique (Staging_Type, Staging_ID, Production_Entity_Type). Recovery must compare both IDs and hashes before completing an operation; conflicts are quarantined, never overwritten.

## 10. Hashing and canonical payload contract

All application-generated hashes use SHA-256 over UTF-8 canonical JSON. Canonicalization rules: lexicographically sorted object keys; stable array ordering by explicit key; explicit null; no NaN/Infinity; decimal values serialized as canonical decimal strings; timestamps normalized to UTC ISO-8601; Unicode normalized to NFC; no locale-dependent formatting. File hashes are computed over exact bytes. Hashing a Drive file ID or URL is not a content hash.

