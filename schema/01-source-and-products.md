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

Unique rule: SHA256 identifies exact file duplicates. A repeated checksum should prompt reuse/linking to the existing catalog record, not silently create another source identity. Different revisions remain separate records.

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
| Page_Label | TEXT(80) | No | Printed page label, if different |
| Page_Image_File_ID | DRIVE_FILE_ID | No | Rendered page image used for review |
| Page_Text_File_ID | DRIVE_FILE_ID | No | Optional extracted text artifact |
| Processing_Status | ENUM | Yes | PENDING, PROCESSED, FAILED, SKIPPED |
| Created_At | DATETIME_UTC | Yes | System generated |

Unique: (Catalog_ID, Page_Number). Page records and artifacts are evidence; retries update run/page processing state without duplicating the page identity.

## 3. Supplier-derived product identity

### `Products`
One row per supplier-derived commercial product identity. Company-owned names and annotations do not belong here.

| Column | Type | Required | Key / rule |
|---|---|---:|---|
| Product_ID | ID | Yes | PK; immutable |
| Source_Catalog_ID | ID | Yes | FK → Catalogs |
| Source_Product_Name_EN | TEXT(300) | Yes | Immutable extracted/source wording |
| Source_Product_Reference | TEXT(120) | No | Supplier item/reference |
| Source_Page_Number | INTEGER | No | 1-based source page |
| Source_Section | TEXT(200) | No | Source heading/region |
| Source_Quote | TEXT(2000) | No | Supporting excerpt where practical |
| Extraction_Run_ID | ID | No | FK → Run_Log |
| Extraction_Record_ID | ID | No | FK → staging record, retained provenance |
| Identity_Status | ENUM | Yes | PROPOSED, APPROVED, REJECTED, SUPERSEDED |
| Created_At | DATETIME_UTC | Yes | System generated |
| Approved_At | DATETIME_UTC | No | Required when APPROVED |
| Approved_By | ACTOR_ID | No | Required when APPROVED |

Do not use product display names as keys. Matching across catalogs is a review workflow, not an implicit merge. If a product is sourced from multiple catalogs, retain each source assertion/provenance explicitly; do not overwrite the first source record.

### `Variants`
One row per supplier-derived model/configuration, with exactly one parent Product.

| Column | Type | Required | Key / rule |
|---|---|---:|---|
| Variant_ID | ID | Yes | PK |
| Product_ID | ID | Yes | FK → Products |
| Source_Model_Number | TEXT(160) | Yes | Immutable supplier model number |
| Source_Model_Name | TEXT(250) | No | Immutable source model name |
| Source_Catalog_ID | ID | Yes | FK → Catalogs |
| Source_Page_Number | INTEGER | No | 1-based |
| Source_Section | TEXT(200) | No | Source location |
| Source_Quote | TEXT(2000) | No | Supporting excerpt |
| Extraction_Run_ID | ID | No | FK → Run_Log |
| Identity_Status | ENUM | Yes | PROPOSED, APPROVED, REJECTED, SUPERSEDED |
| Created_At | DATETIME_UTC | Yes | System generated |
| Approved_At | DATETIME_UTC | No | Required when APPROVED |
| Approved_By | ACTOR_ID | No | Required when APPROVED |

A supplier model number is not assumed globally unique. Candidate uniqueness is (Product_ID, normalized Source_Model_Number, Source_Catalog_ID); collisions require review.

## 4. Immutable supplier specifications

### `Specifications`
One row per extracted source specification assertion. Source values are append-only and never edited to reflect company corrections.

| Column | Type | Required | Key / rule |
|---|---|---:|---|
| Specification_ID | ID | Yes | PK |
| Catalog_ID | ID | Yes | FK → Catalogs |
| Product_ID | ID | Yes | FK → Products |
| Variant_ID | ID | No | FK → Variants; if present must belong to Product_ID |
| Attribute_Key_Source | TEXT(160) | Yes | Source label/key as captured |
| Attribute_Value_Source | TEXT(2000) | Yes | Source value as captured |
| Unit_Source | TEXT(80) | No | Source unit as captured |
| Normalized_Key | TEXT(160) | No | Normalized matching key; does not replace source label |
| Normalized_Value | DECIMAL_OR_TEXT | No | Optional parsed value; retain raw value regardless |
| Normalized_Unit | TEXT(80) | No | Optional normalized unit |
| Source_Page_Number | INTEGER | No | 1-based |
| Source_Section | TEXT(200) | No | Source location |
| Source_Quote | TEXT(2000) | No | Evidence |
| Extraction_Run_ID | ID | No | FK → Run_Log |
| Extraction_Confidence | DECIMAL(5,4) | No | 0..1; model estimate, not truth |
| Created_At | DATETIME_UTC | Yes | Immutable capture timestamp |

At least one of Product_ID / Variant_ID is conceptually targeted; Product_ID remains required to enforce ownership. If Variant_ID is present, it must belong to Product_ID. A specification may be product-wide (Variant_ID blank) or variant-specific.

## 5. Company-managed product layer

### `Product_Company`
One row per Product_ID; company-owned fields only.

| Column | Type | Required | Key / rule |
|---|---|---:|---|
| Product_ID | ID | Yes | PK and FK → Products |
| Product_Name_AR | TEXT(300) | No | Company translation; editable |
| Company_Description | TEXT(4000) | No | Company-authored |
| Brand_Label | TEXT(160) | No | Display label; use controlled entity only if brand registry is later approved |
| Product_Family_ID | ID | No | FK → Product_Families |
| Company_Notes | TEXT(4000) | No | Internal note |
| Updated_At | DATETIME_UTC | Yes | System generated |
| Updated_By | ACTOR_ID | Yes | Actor |

### `Variant_Company`
One row per Variant_ID.

| Column | Type | Required | Key / rule |
|---|---|---:|---|
| Variant_ID | ID | Yes | PK and FK → Variants |
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
Append-only operation ledger; latest approved applicable operation is resolved deterministically. Never edit source Specifications.

| Column | Type | Required | Key / rule |
|---|---|---:|---|
| Specification_Change_ID | ID | Yes | PK |
| Operation | ENUM | Yes | UPDATE, ADD, DELETE |
| Target_Specification_ID | ID | Conditional | FK → Specifications for UPDATE/DELETE; blank for ADD |
| Product_ID | ID | Yes | FK → Products |
| Variant_ID | ID | No | FK → Variants; must belong to Product_ID |
| Attribute_Key | TEXT(160) | Conditional | Required for ADD; for UPDATE may override display key if allowed |
| Value | TEXT(2000) | Conditional | Required for ADD; for UPDATE may be blank only if explicit clear semantics are later approved |
| Unit | TEXT(80) | No | Company display unit |
| Change_Status | ENUM | Yes | DRAFT, APPROVED, REJECTED, SUPERSEDED |
| Effective_Order | INTEGER | Yes | Monotonic per target; server assigned |
| Reason | TEXT(1000) | No | Change rationale |
| Created_At | DATETIME_UTC | Yes | System generated |
| Created_By | ACTOR_ID | Yes | Actor |
| Approved_At | DATETIME_UTC | No | Required when APPROVED |
| Approved_By | ACTOR_ID | No | Required when APPROVED |
| Supersedes_Change_ID | ID | No | Self-FK; prior operation being replaced |

Validation:
- UPDATE/DELETE must target an existing source Specification_ID with matching Product_ID/Variant_ID ownership.
- ADD must not reference Target_Specification_ID and must carry company-owned Attribute_Key and Value.
- Only APPROVED operations affect effective specifications.
- Do not permit two simultaneously active approved operations for the same target and operation slot without an explicit supersession chain.
- DELETE suppresses source output; it never deletes the source row.
- Effective specifications are computed, not manually edited or stored as a competing source of truth.
- Define and test ordering for multiple operations before implementation; this schema uses Effective_Order plus Supersedes_Change_ID and rejects ambiguous ties.

## 9. Domain integrity checks
1. Every Variant.Product_ID exists.
2. Every source-derived record references a Catalog_ID and retains page/section provenance when available.
3. Every Variant_Company row references an existing Variant.
4. Product_Company.Product_Family_ID, when set, references an active family or an explicitly allowed archived family.
5. Product/variant attributes conform to Attribute_Definitions scope and type.
6. A Variant_Attribute_Overrides row may only target an attribute applicable to VARIANT.
7. No company update may mutate source identity or source specification columns.
8. Promotion from staging creates production IDs once and records the source staging record IDs.
