# Detailed Schema — Source & Product Domains

**Status:** Detailed proposal for review; not implementation authorization.
**Storage target:** Google Sheets. Types below are logical application types, not native database enforcement.
**Conventions:** See `DATABASE_SCHEMA.md` for shared type, ID, nullability, and validation rules.

## 1. Source catalog registry

### `Catalogs`
One row per supplier source catalog file/revision registered by the company.

| Column | Type | Required | Key / rule |
|---|---|---:|---|
| Catalog_ID | ID | Yes | PK; immutable |
| Supplier_Name | TEXT(200) | Yes | Supplier as identified on source |
| Catalog_Title | TEXT(300) | No | Source title |
| Catalog_Reference | TEXT(120) | No | Supplier's catalog number |
| Catalog_Revision | TEXT(80) | No | Supplier revision label |
| Language_Code | TEXT(10) | No | BCP-47 where known |
| Source_File_ID | DRIVE_FILE_ID | Yes | Original file in Drive; never replace silently |
| Source_File_Name | TEXT(255) | Yes | Original filename |
| MIME_Type | TEXT(100) | Yes | Validated MIME type |
| File_Size_Bytes | INTEGER | Yes | >= 0 |
| SHA256 | HEX64 | Yes | Exact file fingerprint |
| Published_Date | DATE | No | Supplier publication date, not upload date |
| Received_At | DATETIME_UTC | Yes | Registration timestamp |
| Source_URL | URL | No | Original public URL, if any |
| Notes | TEXT(2000) | No | Company note; not source content |
| Lifecycle_Status | ENUM | Yes | ACTIVE, SUPERSEDED, ARCHIVED |
| Created_At | DATETIME_UTC | Yes | System generated |
| Created_By | ACTOR_ID | Yes | System/user actor |

Unique rule: SHA256 identifies exact file bytes. A repeated checksum prompts the operator to reuse the existing registered source file or explicitly register a separate source context referencing the same immutable binary; it must never silently overwrite a Catalog. Different revisions remain separate records.

## 2. Extraction runs and page provenance

### `Run_Log`
One row per worker job/run. Detailed workflow fields are in `schema/04-workflow-and-audit.md`; Catalog_ID is an FK to Catalogs.

### `Catalog_Pages`
One row per page in a registered catalog, created during processing.

| Column | Type | Required | Key / rule |
|---|---|---:|---|
| Catalog_Page_ID | ID | Yes | PK |
| Catalog_ID | ID | Yes | FK → Catalogs |
| Page_Number | INTEGER | Yes | 1-based; unique with Catalog_ID |
| Page_Label | TEXT(80) | No | Printed page label, if different from PDF page index |
| Created_At | DATETIME_UTC | Yes | System generated |

Unique: (Catalog_ID, Page_Number). Catalog_Pages is immutable page identity only. Rendered page images, extracted text, OCR, and processing state are per-run artifacts tracked in Run_Units; a retry must not overwrite evidence from a prior run.

## 3. Canonical product and model identities

The canonical entities are internal identities and are deliberately independent of any supplier catalog.

### `Products`
One row per canonical internal product.

| Column | Type | Required | Rule |
|---|---|---:|---|
| Product_ID | ID | Yes | PK; immutable |
| Lifecycle_Status | ENUM | Yes | ACTIVE, ARCHIVED |
| Canonical_Notes | TEXT(2000) | No | Internal notes only |
| Created_At | DATETIME_UTC | Yes | System generated |
| Created_By | ACTOR_ID | Yes | Actor |

Company names/translations remain in Product_Company. Supplier names, references, pages, quotes, and extraction provenance must never be stored as canonical identity fields.

### `Variants`
One row per canonical model/configuration, with exactly one parent Product.

| Column | Type | Required | Rule |
|---|---|---:|---|
| Variant_ID | ID | Yes | PK |
| Product_ID | ID | Yes | FK → Products; immutable ownership |
| Lifecycle_Status | ENUM | Yes | ACTIVE, ARCHIVED, MERGED |
| Canonical_Notes | TEXT(2000) | No | Internal notes |
| Created_At | DATETIME_UTC | Yes | System generated |
| Created_By | ACTOR_ID | Yes | Actor |

A supplier model number is not globally unique and is not a canonical key. Matching across source catalogs requires an explicit human decision. Canonical merge/reparent operations are out of v1 scope; duplicate canonical records may be archived but are never silently merged.

## 4. Supplier source assertions and immutable specifications

### `Product_Source_Records`
One row per product appearance in one registered Catalog revision. Multiple source records may point to one canonical Product_ID.

| Column | Type | Required | Rule |
|---|---|---:|---|
| Product_Source_Record_ID | ID | Yes | PK |
| Product_ID | ID | Yes | FK → Products; set only after approved identity resolution; no silent reparenting |
| Catalog_ID | ID | Yes | FK → Catalogs |
| Source_Record_Key | TEXT(160) | Yes | Deterministic source occurrence key within Catalog_ID; unique with Catalog_ID |
| Source_Product_Name | TEXT(300) | Yes | Exact supplier wording; immutable |
| Source_Product_Reference | TEXT(160) | No | Exact source reference |
| Catalog_Page_ID | ID | Yes | FK → Catalog_Pages; must belong to Catalog_ID |
| Printed_Page_Label | TEXT(80) | No | Supplier-printed page label, not PDF index |
| Source_Section | TEXT(200) | No | Source location |
| Source_Quote | TEXT(2000) | No | Evidence |
| Extraction_Run_ID | ID | No | FK → Run_Log |
| Extraction_Record_ID | ID | No | FK → Staging_Products |
| Identity_Resolution | ENUM | Yes | MATCH_EXISTING, CREATE_NEW |
| Match_Decision_ID | ID | Yes | FK → Identity_Match_Decisions; approved decision only |
| Created_At | DATETIME_UTC | Yes | Immutable |
| Created_By | ACTOR_ID | Yes | Actor |

Unique: (Catalog_ID, Source_Record_Key). The same canonical Product may have many source records, including multiple occurrences in one Catalog when the Source_Record_Key differs.

### `Variant_Source_Records`
One row per model appearance within a Product_Source_Record.

| Column | Type | Required | Rule |
|---|---|---:|---|
| Variant_Source_Record_ID | ID | Yes | PK |
| Variant_ID | ID | Yes | FK → Variants; set only after approved identity resolution; no silent reparenting |
| Product_Source_Record_ID | ID | Yes | FK → Product_Source_Records |
| Source_Record_Key | TEXT(160) | Yes | Deterministic model occurrence key within parent source record |
| Source_Model_Number | TEXT(160) | Yes | Exact supplier wording; immutable |
| Source_Model_Name | TEXT(250) | No | Exact supplier wording; immutable |
| Catalog_Page_ID | ID | Yes | FK → Catalog_Pages; must belong to parent Product_Source_Record.Catalog_ID |
| Printed_Page_Label | TEXT(80) | No | Supplier-printed page label |
| Source_Section | TEXT(200) | No | Source location |
| Source_Quote | TEXT(2000) | No | Evidence |
| Extraction_Run_ID | ID | No | FK → Run_Log |
| Extraction_Record_ID | ID | No | FK → Staging_Variants |
| Identity_Resolution | ENUM | Yes | MATCH_EXISTING, CREATE_NEW |
| Match_Decision_ID | ID | Yes | FK → Identity_Match_Decisions; approved decision only |
| Created_At | DATETIME_UTC | Yes | Immutable |
| Created_By | ACTOR_ID | Yes | Actor |

Unique: (Product_Source_Record_ID, Source_Record_Key). Variant.Product_ID must equal the Product_ID reached through Product_Source_Record_ID. Model-number collisions remain valid source evidence but cannot auto-merge identities.

### `Identity_Match_Decisions`
Append-only human decision ledger. Rejected/deferred source candidates remain in staging and do not create production source records.

| Column | Type | Required | Rule |
|---|---|---:|---|
| Match_Decision_ID | ID | Yes | PK |
| Entity_Type | ENUM | Yes | PRODUCT, VARIANT |
| Source_Staging_Type | ENUM | Yes | STAGING_PRODUCT, STAGING_VARIANT |
| Source_Staging_ID | ID | Yes | Globally unique staging ID |
| Source_Staging_Hash | HEX64 | Yes | Exact reviewed staging hash |
| Parent_Product_Match_Decision_ID | ID | Conditional | Required for VARIANT; FK → Identity_Match_Decisions of PRODUCT type |
| Candidate_Canonical_ID | ID | No | Suggested existing Product_ID or Variant_ID |
| Decision | ENUM | Yes | MATCH_EXISTING, CREATE_NEW, REJECT_SOURCE, DEFER |
| Result_Canonical_ID | ID | Conditional | Required for approved MATCH_EXISTING/CREATE_NEW |
| Evidence_JSON_File_ID | DRIVE_FILE_ID | No | Immutable evidence/decision context |
| Evidence_SHA256 | HEX64 | No | Required when evidence file exists |
| Rationale | TEXT(1000) | Yes | Human explanation |
| Decided_At | DATETIME_UTC | Yes | |
| Decided_By | ACTOR_ID | Yes | |
| Supersedes_Decision_ID | ID | No | FK → Identity_Match_Decisions; append-only correction |

A VARIANT decision must reference an approved parent PRODUCT decision; the candidate/result Variant must belong to that resolved Product_ID. MATCH_EXISTING must resolve to an active canonical entity. CREATE_NEW creates one new canonical entity and then the source record. REJECT_SOURCE and DEFER create no production entity/source record. A superseding decision does not silently rewrite historical decisions or issued snapshots; post-promotion correction requires a separate audited reconciliation. The decision is bound to the exact reviewed staging hash. Correct a decision by appending a superseding decision, never editing history.

### `Specifications`
One row per extracted supplier specification assertion. Source values and source wording are immutable.

| Column | Type | Required | Rule |
|---|---|---:|---|
| Specification_ID | ID | Yes | PK |
| Source_Assertion_Key | TEXT(160) | Yes | Stable deterministic assertion locator within its source record |
| Scope | ENUM | Yes | PRODUCT, VARIANT |
| Product_Source_Record_ID | ID | Conditional | Required for PRODUCT scope; FK → Product_Source_Records |
| Variant_Source_Record_ID | ID | Conditional | Required for VARIANT scope; FK → Variant_Source_Records |
| Product_ID | ID | Yes | Canonical FK; must match source record |
| Variant_ID | ID | Conditional | Required iff VARIANT scope; must match source record |
| Attribute_Key_Source | TEXT(160) | Yes | Exact source label |
| Attribute_Value_Source | TEXT(2000) | Yes | Exact source value |
| Unit_Source | TEXT(80) | No | Exact source unit |
| Normalized_Key | TEXT(160) | No | Search/mapping only |
| Normalized_Value_JSON | JSON_TEXT(1000) | No | Typed parsed value; raw value always retained |
| Normalized_Unit | TEXT(80) | No | Optional normalized unit |
| Catalog_Page_ID | ID | Yes | FK → Catalog_Pages; must match the linked source record's catalog |
| Printed_Page_Label | TEXT(80) | No | Supplier-printed page label |
| Source_Section | TEXT(200) | No | |
| Source_Quote | TEXT(2000) | No | Evidence |
| Extraction_Run_ID | ID | No | FK → Run_Log |
| Extraction_Confidence | DECIMAL(5,4) | No | 0..1; not approval |
| Created_At | DATETIME_UTC | Yes | Immutable |

Exactly one source-record FK is populated according to Scope. Unique (Product_Source_Record_ID, Source_Assertion_Key) for PRODUCT scope and (Variant_Source_Record_ID, Source_Assertion_Key) for VARIANT scope. Unique (Product_Source_Record_ID, Source_Assertion_Key) for PRODUCT scope and (Variant_Source_Record_ID, Source_Assertion_Key) for VARIANT scope; Source_Assertion_Key is a deterministic within-source-record assertion locator. The Catalog_Page_ID must match the page/catalog of the selected source record. If identity matching is unresolved, the row stays in staging and is not promoted. Do not infer product-wide scope from a model-specific assertion.

Catalogs remain one immutable registered source file/revision per Catalog_ID. A changed PDF/revision creates a new Catalog_ID and new Catalog_Pages; old source records and page evidence remain intact. A Catalog has many Product_Source_Records; each product source record may have many Variant_Source_Records.

## 5. Company-managed product layer

### `Product_Company`
One row per Product_ID; company-owned fields only.

| Column | Type | Required | Key / rule |
|---|---|---:|---|
| Product_ID | ID | Yes | PK and FK → Products |
| Product_Name_EN | TEXT(300) | No | Company-approved canonical display name; not source evidence |
| Product_Name_AR | TEXT(300) | No | Company translation; editable |
| Company_Description | TEXT(4000) | No | Company-authored |
| Manufacturer_or_Product_Brand_Label | TEXT(160) | No | Product/manufacturer brand label; unrelated to document-design Brands |
| Product_Family_ID | ID | No | FK → Product_Families |
| Company_Notes | TEXT(4000) | No | Internal note |
| Updated_At | DATETIME_UTC | Yes | System generated |
| Updated_By | ACTOR_ID | Yes | Actor |

### `Variant_Company`
One row per Variant_ID.

| Column | Type | Required | Key / rule |
|---|---|---:|---|
| Variant_ID | ID | Yes | PK and FK → Variants |
| Model_Name_EN | TEXT(250) | No | Company-approved canonical model display name; not source evidence |
| Model_Name_AR | TEXT(250) | No | Company translation |
| Company_Model_Notes | TEXT(2000) | No | Company-authored |
| Updated_At | DATETIME_UTC | Yes | System generated |
| Updated_By | ACTOR_ID | Yes | Actor |

## 6. Product family hierarchy

### `Product_Families`

| Column | Type | Required | Key / rule |
|---|---|---:|---|
| Product_Family_ID | ID | Yes | PK |
| Family_Name_EN | TEXT(180) | Yes | Company taxonomy label |
| Family_Name_AR | TEXT(180) | No | Arabic label |
| Parent_Family_ID | ID | No | Self-FK; cannot equal own ID |
| Description | TEXT(1000) | No | Company-authored |
| Sort_Order | INTEGER | Yes | Default 0 |
| Status | ENUM | Yes | ACTIVE, ARCHIVED |
| Created_At | DATETIME_UTC | Yes | System generated |
| Updated_At | DATETIME_UTC | Yes | System generated |

Prevent cycles in Parent_Family_ID. Family names need not be globally unique; enforce uniqueness among active siblings if desired.

## 7. Typed attributes and inheritance

### `Attribute_Definitions`

| Column | Type | Required | Key / rule |
|---|---|---:|---|
| Attribute_ID | ID | Yes | PK |
| Attribute_Key | TEXT(100) | Yes | Stable machine key; unique |
| Label_EN | TEXT(160) | Yes | Display label |
| Label_AR | TEXT(160) | No | Display label |
| Data_Type | ENUM | Yes | TEXT, INTEGER, DECIMAL, BOOLEAN, DATE, URL, MEASUREMENT |
| Unit_Code | TEXT(40) | No | Canonical unit for MEASUREMENT/DECIMAL where relevant |
| Allowed_Values_JSON_File_ID | DRIVE_FILE_ID | No | Optional large controlled list; otherwise use Allowed_Values_JSON below |
| Allowed_Values_JSON | JSON_TEXT(4000) | No | Valid JSON array/object; avoid oversized payloads |
| Applicable_Scope | ENUM | Yes | PRODUCT, VARIANT, BOTH |
| Is_Required | BOOLEAN | Yes | Default false |
| Validation_Rule_JSON | JSON_TEXT(2000) | No | Declarative validation only; never executable code |
| Display_Order | INTEGER | Yes | Default 0 |
| Status | ENUM | Yes | ACTIVE, ARCHIVED |
| Created_At | DATETIME_UTC | Yes | System generated |
| Updated_At | DATETIME_UTC | Yes | System generated |

### `Product_Attributes`
One row per Product_ID + Attribute_ID.

| Column | Type | Required | Key / rule |
|---|---|---:|---|
| Product_Attribute_ID | ID | Yes | PK |
| Product_ID | ID | Yes | FK → Products |
| Attribute_ID | ID | Yes | FK → Attribute_Definitions |
| Value_JSON | JSON_TEXT(2000) | Yes | Typed value encoded as valid JSON |
| Updated_At | DATETIME_UTC | Yes | System generated |
| Updated_By | ACTOR_ID | Yes | Actor |

Unique: (Product_ID, Attribute_ID). Definition must permit PRODUCT scope. Value must validate against Data_Type, Unit_Code, allowed values, and validation rules.

### `Variant_Attribute_Overrides`
One row per Variant_ID + Attribute_ID.

| Column | Type | Required | Key / rule |
|---|---|---:|---|
| Variant_Override_ID | ID | Yes | PK |
| Variant_ID | ID | Yes | FK → Variants |
| Attribute_ID | ID | Yes | FK → Attribute_Definitions |
| Override_Mode | ENUM | Yes | VALUE, INTENTIONALLY_EMPTY |
| Value_JSON | JSON_TEXT(2000) | Conditional | Required for VALUE; must be blank for INTENTIONALLY_EMPTY |
| Updated_At | DATETIME_UTC | Yes | System generated |
| Updated_By | ACTOR_ID | Yes | Actor |

Unique: (Variant_ID, Attribute_ID). Definition must permit VARIANT scope. No override row means inherit product value. INTENTIONALLY_EMPTY means suppress inherited value. Inherited/Customized/Empty is computed at read time. Removing an override row restores inheritance; it is not equivalent to INTENTIONALLY_EMPTY.

## 8. Central specification change ledger

### `Specification_Changes`
Append-only event ledger. Effective specifications are derived by the reducer; source Specifications are never edited.

| Column | Type | Required | Rule |
|---|---|---:|---|
| Specification_Change_ID | ID | Yes | PK; immutable |
| Logical_Specification_Key | TEXT(180) | Yes | `SRC:<Specification_ID>` or `ADD:<first Specification_Change_ID>` |
| Sequence_No | INTEGER | Conditional | Assigned only on approval under lock; strictly increasing per logical key |
| Operation | ENUM | Yes | ADD, UPDATE, DELETE |
| Target_Specification_ID | ID | Conditional | FK → Specifications for source-backed keys; blank for company-created ADD keys |
| Product_ID | ID | Yes | FK → Products |
| Variant_ID | ID | No | FK → Variants; must belong to Product_ID |
| Attribute_Key | TEXT(160) | Yes | Stable company attribute key |
| Value_JSON | JSON_TEXT(2000) | Conditional | Complete typed value for ADD/UPDATE; absent for DELETE |
| Unit_Code | TEXT(40) | No | Canonical unit |
| Change_Status | ENUM | Yes | DRAFT, APPROVED, REJECTED |
| Reason | TEXT(1000) | Yes | Business rationale |
| Created_At | DATETIME_UTC | Yes | |
| Created_By | ACTOR_ID | Yes | |
| Approved_At | DATETIME_UTC | Conditional | Required for APPROVED |
| Approved_By | ACTOR_ID | Conditional | Required for APPROVED |
| Approval_Payload_SHA256 | HEX64 | Conditional | Hash of exact reviewed event payload |

Logical key and reducer rules:
- A source assertion starts ACTIVE at sequence 0 under `SRC:<Specification_ID>`.
- A company-created assertion starts ABSENT. Its first ADD event establishes `ADD:<Specification_Change_ID>`; later UPDATE/DELETE events reuse that key.
- Only APPROVED events participate. Sequence_No is assigned during approval under a script lock after re-reading the latest effective state.
- Sequence_No must be unique and strictly increasing per Logical_Specification_Key. Gaps are allowed; duplicate or missing approved sequence values quarantine the key.
- ADD is valid only from ABSENT and requires a complete typed value.
- UPDATE is valid only from ACTIVE and replaces the complete effective value.
- DELETE is valid only from ACTIVE and suppresses output without deleting source evidence.
- UPDATE or ADD after DELETE is invalid. Reinstatement requires a new ADD logical key and explicit rationale.
- Blank/null is not a clearing operation. Use DELETE or a typed explicit-empty value only where the attribute definition permits it.
- The reducer sorts by Sequence_No only; never use sheet row order, timestamps, or last-edit time.
- Any invalid transition quarantines the entire logical key from output; never skip the bad event and continue.
- A failed lock or Sheets write fails closed. No sequence is allocated from cached state.

Examples:
- Source 10 bar → UPDATE 12 bar → UPDATE 14 bar = effective 14 bar.
- Source 10 bar → DELETE = suppressed.
- ADD noise 72 dB → UPDATE 70 dB → DELETE = suppressed.
- Raw supplier text remains unchanged in every case.

## 10. Domain integrity checks
1. Every Variant.Product_ID exists.
2. Every source assertion references the exact Product_Source_Record_ID or Variant_Source_Record_ID and retains Catalog/Page/Section/Quote provenance when available.
3. Every Variant_Company row references an existing Variant.
4. Product_Company.Product_Family_ID, when set, references an active family or an explicitly allowed archived family.
5. Product/variant attributes conform to Attribute_Definitions scope and type.
6. A Variant_Attribute_Overrides row may only target an attribute applicable to VARIANT.
7. No company update may mutate source identity or source specification columns.
8. Promotion from staging creates production IDs once and records the source staging record IDs.
