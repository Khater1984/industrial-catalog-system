# Enum Registry — Authoritative Stored Values

**Status:** Schema V2.1 candidate registry. Values are case-sensitive storage tokens; this file is a cross-domain validation index, not a substitute for the domain table definitions.

## Rules

1. Store only the exact enum token listed below; never store translated display labels.
2. Optional enum fields may be NULL; NULL is not an additional enum value.
3. UI labels may be localized independently. The persisted token remains unchanged.
4. Adding, removing, or renaming a token requires updating the domain schema, this registry, API/worker contracts, and acceptance tests in one reviewed change.
5. State-machine enums must obey the transition rules in TECHNICAL_DESIGN.md and the relevant domain schema. A value's presence in this registry does not authorize every transition.
6. Unknown values are rejected; do not silently coerce or map to a default.

## Registry

### `Catalogs`

| Field | Required | Allowed stored values |
|---|---|---|
| `Lifecycle_Status` | Yes | ACTIVE, SUPERSEDED, ARCHIVED |

### `Products`

| Field | Required | Allowed stored values |
|---|---|---|
| `Lifecycle_Status` | Yes | ACTIVE, ARCHIVED |

### `Variants`

| Field | Required | Allowed stored values |
|---|---|---|
| `Lifecycle_Status` | Yes | ACTIVE, ARCHIVED |

### `Product_Source_Records`

| Field | Required | Allowed stored values |
|---|---|---|
| `Identity_Resolution` | Yes | MATCH_EXISTING, CREATE_NEW |

### `Variant_Source_Records`

| Field | Required | Allowed stored values |
|---|---|---|
| `Identity_Resolution` | Yes | MATCH_EXISTING, CREATE_NEW |

### `Identity_Match_Decisions`

| Field | Required | Allowed stored values |
|---|---|---|
| `Entity_Type` | Yes | PRODUCT, VARIANT |
| `Source_Staging_Type` | Yes | STAGING_PRODUCT, STAGING_VARIANT |
| `Decision` | Yes | MATCH_EXISTING, CREATE_NEW, REJECT_SOURCE, DEFER |

### `Specifications`

| Field | Required | Allowed stored values |
|---|---|---|
| `Scope` | No | PRODUCT, VARIANT |

### `Product_Families`

| Field | Required | Allowed stored values |
|---|---|---|
| `Status` | Yes | ACTIVE, ARCHIVED |

### `Attribute_Definitions`

| Field | Required | Allowed stored values |
|---|---|---|
| `Data_Type` | Yes | TEXT, INTEGER, DECIMAL, BOOLEAN, DATE, URL, MEASUREMENT |
| `Applicable_Scope` | Yes | PRODUCT, VARIANT, BOTH |
| `Status` | Yes | ACTIVE, ARCHIVED |

### `Variant_Attribute_Overrides`

| Field | Required | Allowed stored values |
|---|---|---|
| `Override_Mode` | Yes | VALUE, INTENTIONALLY_EMPTY |

### `Specification_Changes`

| Field | Required | Allowed stored values |
|---|---|---|
| `Operation` | Yes | ADD, UPDATE, DELETE |
| `Change_Status` | Yes | DRAFT, APPROVED, REJECTED |

### `Documents`

| Field | Required | Allowed stored values |
|---|---|---|
| `Document_Type` | Yes | USER_MANUAL, BROCHURE, CERTIFICATE, WARRANTY, OTHER |
| `Lifecycle_Status` | Yes | DRAFT, ACTIVE, ARCHIVED |

### `Document_Versions`

| Field | Required | Allowed stored values |
|---|---|---|
| `Lifecycle_Status` | Yes | AVAILABLE, QUARANTINED, ARCHIVED |
| `Source_Type` | Yes | CATALOG_EMBEDDED, MANUAL_UPLOAD, EXTERNAL_LINK, OTHER |

### `Document_Links`

| Field | Required | Allowed stored values |
|---|---|---|
| `Target_Type` | Yes | PRODUCT, VARIANT |
| `Link_Mode` | Yes | INCLUDE, EXCLUDE |

### `Image_Assets`

| Field | Required | Allowed stored values |
|---|---|---|
| `Color_Space` | No | SRGB, DISPLAY_P3, CMYK, GRAYSCALE, UNKNOWN |
| `Orientation` | Yes | NORMALIZED, EXIF_ROTATED, UNKNOWN |
| `Source_Type` | Yes | CATALOG_EMBEDDED, PAGE_RENDER, MANUAL_UPLOAD, OTHER |
| `Quality_Status` | Yes | UNASSESSED, ACCEPTABLE, LOW_RESOLUTION, CORRUPT, NEEDS_REVIEW |
| `Lifecycle_Status` | Yes | ACTIVE, ARCHIVED, QUARANTINED |

### `Image_Renditions`

| Field | Required | Allowed stored values |
|---|---|---|
| `Rendition_Type` | Yes | PREVIEW, HIGH_QUALITY, CATALOG_READY, THUMBNAIL, NORMALIZED_ORIGINAL |

### `Image_Links`

| Field | Required | Allowed stored values |
|---|---|---|
| `Target_Type` | Yes | PRODUCT, VARIANT |
| `Link_Status` | Yes | CANDIDATE, ACTIVE, REJECTED, ARCHIVED |

### `Image_Review_Pairs`

| Field | Required | Allowed stored values |
|---|---|---|
| `Decision` | Yes | PENDING, SAME_ASSET, DISTINCT, RELATED |

### `Design_Assets`

| Field | Required | Allowed stored values |
|---|---|---|
| `Asset_Type` | Yes | LOGO, FONT, GRAPHIC, ICON, BACKGROUND, TEXTURE, WATERMARK, ICC_PROFILE, OTHER |

### `Brands`

| Field | Required | Allowed stored values |
|---|---|---|
| `Identity_Type` | Yes | BUILT_IN, COMPANY |
| `Lifecycle_Status` | Yes | ACTIVE, ARCHIVED |

### `Brand_Versions`

| Field | Required | Allowed stored values |
|---|---|---|
| `Version_Status` | Yes | DRAFT, PUBLISHED, RETIRED |

### `Brand_Assets`

| Field | Required | Allowed stored values |
|---|---|---|
| `Usage_Role` | Yes | PRIMARY_LOGO, SECONDARY_LOGO, FONT, GRAPHIC, ICON, BACKGROUND, OTHER |
| `Lifecycle_Status` | Yes | ACTIVE, ARCHIVED |

### `Papers`

| Field | Required | Allowed stored values |
|---|---|---|
| `Lifecycle_Status` | Yes | ACTIVE, ARCHIVED |

### `Paper_Versions`

| Field | Required | Allowed stored values |
|---|---|---|
| `Version_Status` | Yes | DRAFT, PUBLISHED, RETIRED |

### `Templates`

| Field | Required | Allowed stored values |
|---|---|---|
| `Document_Type` | Yes | TECHNICAL_DATASHEET, PRODUCT_CATALOG, MASTER_CATALOG, COMPANY_PROFILE |
| `Lifecycle_Status` | Yes | ACTIVE, ARCHIVED |

### `Template_Versions`

| Field | Required | Allowed stored values |
|---|---|---|
| `Version_Status` | Yes | DRAFT, PUBLISHED, RETIRED |

### `Template_Identity_Links`

| Field | Required | Allowed stored values |
|---|---|---|
| `Status` | Yes | ACTIVE, DISABLED |

### `Watermark_Presets`

| Field | Required | Allowed stored values |
|---|---|---|
| `Watermark_Type` | Yes | TEXT, LOGO, IMAGE |
| `Position` | Yes | CENTER, TOP, BOTTOM, CUSTOM |
| `Layer` | Yes | BEHIND_CONTENT, ABOVE_CONTENT |
| `Lifecycle_Status` | Yes | ACTIVE, ARCHIVED |

### `Status_Defaults`

| Field | Required | Allowed stored values |
|---|---|---|
| `Document_Status` | Yes | ORIGINAL, PRELIMINARY, CONFIDENTIAL, REVISED, FINAL |

### `Contact_Profiles`

| Field | Required | Allowed stored values |
|---|---|---|
| `Lifecycle_Status` | Yes | ACTIVE, ARCHIVED |

### `Export_Profiles`

| Field | Required | Allowed stored values |
|---|---|---|
| `Output_Class` | Yes | DIGITAL_PDF, PRINT_ORIENTED_PDF, PRINT_READY_PDF |
| `Color_Mode` | Yes | RGB, CMYK_REQUIRED, PRINTER_DEFINED |
| `PDF_Standard` | Yes | NONE, PDF_X_1A, PDF_X_4, OTHER_REQUIRED |
| `Lifecycle_Status` | Yes | ACTIVE, ARCHIVED |

### `Issued_Documents`

| Field | Required | Allowed stored values |
|---|---|---|
| `Document_Type` | Yes | TECHNICAL_DATASHEET, PRODUCT_CATALOG, MASTER_CATALOG |
| `Document_Status` | Yes | ORIGINAL, PRELIMINARY, CONFIDENTIAL, REVISED, FINAL |
| `Output_Class` | Yes | DIGITAL_PDF, PRINT_ORIENTED_PDF, PRINT_READY_PDF |

### `Issue_Operations`

| Field | Required | Allowed stored values |
|---|---|---|
| `Operation_Status` | Yes | PREPARED, PREFLIGHT, RENDERING, VALIDATING, IN_DOUBT, COMPLETED, FAILED, CANCELLED |

### `Run_Log`

| Field | Required | Allowed stored values |
|---|---|---|
| `Run_Type` | Yes | CATALOG_EXTRACTION, IMAGE_PROCESSING, PDF_GENERATION, PDF_REPRODUCTION, VALIDATION, MANUAL_IMPORT |
| `Run_Status` | Yes | QUEUED, RUNNING, WAITING_REVIEW, RETRY_PENDING, COMPLETED, FAILED, CANCELLED |

### `Run_Units`

| Field | Required | Allowed stored values |
|---|---|---|
| `Unit_Type` | Yes | CATALOG_PAGE, IMAGE, PRODUCT_BATCH, PDF_STAGE, OTHER |
| `Unit_Status` | Yes | PENDING, RUNNING, COMPLETED, FAILED, SKIPPED, REUSED |

### `Run_Events`

| Field | Required | Allowed stored values |
|---|---|---|
| `Event_Type` | Yes | CREATED, STARTED, PROGRESS, WARNING, ERROR, RETRY, WAITING_REVIEW, RESUMED, LEASE_ACQUIRED, LEASE_EXPIRED, UNIT_REUSED, RESULT_ACCEPTED, COMPLETED, CANCELLED |

### `Common staging envelope (all Staging_* sheets)`

| Field | Required | Allowed stored values |
|---|---|---|
| `Extraction_Method` | Yes | EMBEDDED_TEXT, TABLE_PARSER, OCR, IMAGE_EXTRACTION, MANUAL |
| `Proposed_Status` | Yes | NEW, NEEDS_REVIEW, REJECTED, PROMOTED |

### `Staging_Specifications`

| Field | Required | Allowed stored values |
|---|---|---|
| `Scope` | No | PRODUCT, VARIANT |
| `Parse_Status` | Yes | UNPARSED, PARSED, AMBIGUOUS, INVALID |

### `Staging_Images`

| Field | Required | Allowed stored values |
|---|---|---|
| `Quality_Status` | Yes | UNASSESSED, ACCEPTABLE, LOW_RESOLUTION, NEEDS_REVIEW |

### `Staging_Documents`

| Field | Required | Allowed stored values |
|---|---|---|
| `Document_Type` | Yes | USER_MANUAL, BROCHURE, CERTIFICATE, WARRANTY, OTHER |

### `Review_Queue`

| Field | Required | Allowed stored values |
|---|---|---|
| `Review_Type` | Yes | PRODUCT_MATCH, VARIANT_MATCH, SPECIFICATION, IMAGE_DUPLICATE, IMAGE_QUALITY, DOCUMENT_MATCH, EXTRACTION_AMBIGUITY, OTHER |
| `Priority` | Yes | LOW, NORMAL, HIGH |
| `Review_Status` | Yes | OPEN, IN_REVIEW, APPROVED, REJECTED, DEFERRED, STALE, SUPERSEDED |

### `Audit_Log`

| Field | Required | Allowed stored values |
|---|---|---|
| `Action` | Yes | CREATE, UPDATE, APPROVE, REJECT, PROMOTE, ARCHIVE, PUBLISH, ISSUE, RESTORE_POINTER, LINK, UNLINK, OVERRIDE_WARNING |

### `Review_Staging_Links`

| Field | Required | Allowed stored values |
|---|---|---|
| `Review_Role` | Yes | PRIMARY, RELATED, EVIDENCE |

### `System_Config`

| Field | Required | Allowed stored values |
|---|---|---|
| `Value_Type` | Yes | TEXT, INTEGER, BOOLEAN, JSON, DRIVE_FILE_ID, SPREADSHEET_ID |
| `Environment_ID` | Yes | DEV, TEST, PROD |

### `Promotion_Operations`

| Field | Required | Allowed stored values |
|---|---|---|
| `Operation_Status` | Yes | PREPARED, APPLYING, IN_DOUBT, COMPLETED, QUARANTINED, CANCELLED |

### `Promotion_Mappings`

| Field | Required | Allowed stored values |
|---|---|---|
| `Staging_Type` | Yes | PRODUCT, VARIANT, SPECIFICATION, IMAGE, DOCUMENT |
| `Production_Entity_Type` | Yes | PRODUCT, VARIANT, PRODUCT_SOURCE_RECORD, VARIANT_SOURCE_RECORD, SPECIFICATION, IMAGE_ASSET, DOCUMENT |
| `Canonical_Entity_Type` | No | PRODUCT or VARIANT when the mapping also establishes canonical identity |

## State-machine notes

- **Run_Log.Run_Status:** terminal states are COMPLETED, FAILED, and CANCELLED. Retry creates a new Run_ID; it does not reopen a terminal attempt.
- **Run_Units.Unit_Status:** REUSED is valid only when the source unit input/output fingerprints verify.
- **Review_Queue.Review_Status:** STALE and SUPERSEDED cannot authorize promotion.
- **Specification_Changes.Change_Status:** only APPROVED events with valid Sequence_No participate in the reducer.
- **Promotion_Operations.Operation_Status:** IN_DOUBT requires reconciliation; never blindly replay.
- **Issue_Operations.Operation_Status:** only COMPLETED operations may produce final Issued_Documents.
- **Document_Versions.Lifecycle_Status:** QUARANTINED versions cannot be selected for output.
- **Image_Assets.Lifecycle_Status:** QUARANTINED assets cannot be used by new issues.

**Registry entries:** 79 enum fields across 46 table/common-envelope groups.
