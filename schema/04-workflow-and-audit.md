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
| Run_Type | ENUM | Yes | CATALOG_EXTRACTION, IMAGE_PROCESSING, PDF_GENERATION, PDF_REPRODUCTION, VALIDATION |
| Catalog_ID | ID | No | FK → Catalogs for catalog runs |
| Issued_Document_ID | ID | No | FK → Issued_Documents where applicable |
| Logical_Job_ID | ID | Yes | Stable across attempts of one logical job |\n| Parent_Run_ID | ID | No | Self-FK to immediately preceding attempt |\n| Attempt_Number | INTEGER | Yes | Starts at 1; increments per Logical_Job_ID |\n| Retry_Reason | TEXT(1000) | No | Required for retry attempts |\n| Idempotency_Key | TEXT(160) | Yes | Unique per attempt, not per logical job |
| Run_Status | ENUM | Yes | QUEUED, RUNNING, WAITING_REVIEW, RETRY_PENDING, COMPLETED, FAILED, CANCELLED |
| Current_Step | TEXT(120) | No | Human-readable step |
| Total_Units | INTEGER | No | Pages/items expected |
| Completed_Units | INTEGER | Yes | >= 0 and <= Total_Units when known |
| Failed_Units | INTEGER | Yes | >= 0 |
| Retry_Count | INTEGER | Yes | >= 0 |
| Worker_Version | TEXT(80) | No | Build identifier |
| Started_At | DATETIME_UTC | No | |
| Heartbeat_At | DATETIME_UTC | No | Detect stalled workers |
| Finished_At | DATETIME_UTC | No | |
| Error_Code | TEXT(80) | No | Machine-readable |
| Error_Summary | TEXT(1500) | No | No secrets or sensitive payloads |
| Input_Manifest_File_ID | DRIVE_FILE_ID | No | Immutable job input manifest |
| Output_Manifest_File_ID | DRIVE_FILE_ID | No | Result manifest |
| Created_At | DATETIME_UTC | Yes | System generated |
| Created_By | ACTOR_ID | Yes | Actor |

Unique: Idempotency_Key and (Logical_Job_ID, Attempt_Number). A retry creates a new Run_ID, points Parent_Run_ID to the immediately preceding attempt, and increments Attempt_Number. Terminal runs are never reset. Reuse completed work units only when input fingerprint and output manifest hash match.

### `Run_Events`
Append-only event history for progress, retries, and diagnostics.

| Column | Type | Required | Key / rule |
|---|---|---:|---|
| Run_Event_ID | ID | Yes | PK |
| Run_ID | ID | Yes | FK → Run_Log |
| Event_Type | ENUM | Yes | CREATED, STARTED, PROGRESS, WARNING, ERROR, RETRY, WAITING_REVIEW, RESUMED, COMPLETED, CANCELLED |
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
| Catalog_ID | ID | Yes | FK → Catalogs |
| Catalog_Page_ID | ID | No | FK → Catalog_Pages |
| Source_Page_Number | INTEGER | No | 1-based |
| Source_Region | TEXT(120) | No | Coordinates/region label |
| Raw_Extract_File_ID | DRIVE_FILE_ID | No | Evidence payload |
| Extracted_Text | TEXT(4000) | No | Relevant text snippet |
| Confidence | DECIMAL(5,4) | No | 0..1; not an approval |
| Proposed_Status | ENUM | Yes | NEW, NEEDS_REVIEW, APPROVED, REJECTED, PROMOTED |
| Promoted_Entity_ID | ID | No | Production ID after promotion |
| Created_At | DATETIME_UTC | Yes | System generated |
| Updated_At | DATETIME_UTC | Yes | System generated |

### `Staging_Products`
Additional fields: Proposed_Product_Name_EN TEXT(300), Proposed_Product_Reference TEXT(120), Candidate_Product_ID ID nullable (candidate only, not an FK commitment until confirmed), Identity_Match_Method TEXT(80), Match_Confidence DECIMAL(5,4).

### `Staging_Variants`
Additional fields: Parent_Staging_Product_ID ID required (FK → Staging_Products), Proposed_Model_Number TEXT(160), Proposed_Model_Name TEXT(250), Candidate_Variant_ID ID nullable, Identity_Match_Method TEXT(80), Match_Confidence DECIMAL(5,4).

### `Staging_Specifications`
Additional fields: Parent_Staging_Product_ID ID required, Parent_Staging_Variant_ID ID nullable, Attribute_Key_Raw TEXT(160), Value_Raw TEXT(2000), Unit_Raw TEXT(80), Normalized_Key TEXT(160), Normalized_Value TEXT(500), Normalized_Unit TEXT(80), Parse_Status ENUM (UNPARSED, PARSED, AMBIGUOUS, INVALID).

### `Staging_Images`
Additional fields: Proposed_Image_File_ID DRIVE_FILE_ID required, Original_File_Name TEXT(255), MIME_Type TEXT(100), Width_PX INTEGER, Height_PX INTEGER, SHA256 HEX64, PHash TEXT(64), Candidate_Product_ID ID nullable, Candidate_Variant_ID ID nullable, Image_Role TEXT(80), Quality_Status ENUM (UNASSESSED, ACCEPTABLE, LOW_RESOLUTION, NEEDS_REVIEW).

### `Staging_Documents`
Additional fields: Proposed_Document_File_ID DRIVE_FILE_ID required, Title TEXT(250), Document_Type ENUM, Language_Code TEXT(10), SHA256 HEX64, Candidate_Product_ID ID nullable, Candidate_Variant_ID ID nullable.

Do not create a separate staging sheet for every catalog or product. Staging sheets are shared across runs.

## 4. Review queue

### `Review_Queue`
One row per human-review task. Multiple staging records may be grouped under one review item using the payload manifest.

| Column | Type | Required | Key / rule |
|---|---|---:|---|
| Review_Queue_ID | ID | Yes | PK |
| Run_ID | ID | Yes | FK → Run_Log |
| Review_Type | ENUM | Yes | PRODUCT_MATCH, VARIANT_MATCH, SPECIFICATION, IMAGE_DUPLICATE, IMAGE_QUALITY, DOCUMENT_MATCH, EXTRACTION_AMBIGUITY, OTHER |
| Target_Staging_ID | ID | No | Related staging record |
| Related_Staging_IDs_File_ID | DRIVE_FILE_ID | No | Manifest for multiple related records |
| Priority | ENUM | Yes | LOW, NORMAL, HIGH |
| Review_Status | ENUM | Yes | OPEN, IN_REVIEW, APPROVED, REJECTED, DEFERRED |
| Proposed_Action | TEXT(500) | No | Suggested action, not executed automatically |
| Decision_JSON_File_ID | DRIVE_FILE_ID | No | Structured decision payload |
| Decision_Notes | TEXT(1500) | No | Human rationale |
| Assigned_Actor_ID | ACTOR_ID | No | Optional |
| Created_At | DATETIME_UTC | Yes | System generated |
| Reviewed_At | DATETIME_UTC | No | |
| Reviewed_By | ACTOR_ID | No | Required for final decision |

Approval must identify exactly which staging record(s) and proposed values were accepted. Rejected/deferred items remain traceable. A review decision does not silently modify source evidence. Store immutable decision JSON and hashes of the exact staging payload and reviewed decision payload.

## 5. Audit log

### `Audit_Log`
Append-only record of material user/system changes to company-managed data, approvals, promotion, version publication, and issued outputs.

| Column | Type | Required | Key / rule |
|---|---|---:|---|
| Audit_ID | ID | Yes | PK |
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

The singular Review_Queue_ID has been removed from the common staging envelope. One staging row may require several independent reviews. Use this join sheet:

| Column | Type | Required | Rule |
|---|---|---:|---|
| Review_Staging_Link_ID | ID | Yes | PK |
| Review_Queue_ID | ID | Yes | FK → Review_Queue |
| Staging_ID | ID | Yes | FK to exactly one typed staging sheet |
| Review_Role | ENUM | Yes | PRIMARY, RELATED, EVIDENCE |
| Created_At | DATETIME_UTC | Yes | Immutable |
| Created_By | ACTOR_ID | Yes | Actor |

Unique (Review_Queue_ID, Staging_ID, Review_Role). Never overwrite prior review links.

### 8.2 Hash-bound review decisions

For every staging record, compute a canonical SHA256 over all decision-relevant values: raw source strings, source Catalog/Page/Region, normalized proposals, candidate canonical IDs, parent staging IDs, and relevant file checksums. The review decision stores Staging_Record_Hash and Reviewed_Payload_Hash. Promotion is allowed only if both hashes verify and the current staging hash equals the hash approved by the reviewer. Any changed value invalidates approval and requires a new review decision. Decision corrections append a new decision; they do not rewrite old review history.

Canonical serialization must use UTF-8, stable field ordering, explicit null representation, and locale-independent numeric formatting.

### 8.3 Source matching and promotion staging

Staging product/model rows are source assertion candidates, not canonical entities. Candidate_Product_ID/Candidate_Variant_ID are suggestions only. Human decision values are MATCH_EXISTING, CREATE_NEW, REJECT_SOURCE, or DEFER. Promotion creates/links the canonical entity and the corresponding Product_Source_Record/Variant_Source_Record. Persist Staging_ID → source-record ID and canonical ID mappings. A deterministic promotion key prevents duplicate canonical records after retries.

### 8.4 Partial-write reconciliation

Before a multi-sheet promotion, persist an operation ID, deterministic promotion key, intended entity IDs, and payload hashes. If any write fails, mark the operation IN_DOUBT. Reconcile actual rows by IDs and hashes before retrying. Complete missing rows or quarantine conflicting rows; never blindly rerun the entire promotion. Audit every repair.

### 8.5 System configuration

Add `System_Config` for non-secret configuration only: Config_Key, Value_Type, Value_Text, Environment_ID, Schema_Version, Updated_At, Updated_By, Description. It may contain spreadsheet IDs, Drive folder IDs, non-secret feature flags, and initialization state. Credentials, API keys, OAuth tokens, signing secrets, and worker credentials belong in Script Properties or a managed secret store, never GitHub or Sheets.

### 8.6 Run retry semantics

A retry is a new attempt under the same Logical_Job_ID, with a new Run_ID and Idempotency_Key, Parent_Run_ID set to the preceding attempt, and Attempt_Number incremented. A retry may reuse committed page outputs only when the page input fingerprint and output hash match. A changed source PDF or logical input manifest requires a new Logical_Job_ID.

### 8.7 Operational integrity scan

A scheduled/manual integrity scan checks primary-key uniqueness, required values, enum validity, foreign keys and ownership, duplicate sequence numbers, review hash drift, orphan polymorphic links, image redirect cycles, document-version pointer ownership, missing Drive files, and SHA256 mismatches. Findings are classified BLOCKING, REPAIRABLE, or WARNING. Repairs are report-first, idempotent, audited, and never auto-merge/delete data.
