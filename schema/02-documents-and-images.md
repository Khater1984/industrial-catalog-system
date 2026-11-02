# Detailed Schema — Documents & Images

**Status:** Detailed proposal for review; not implementation authorization.
**Storage:** Google Sheets metadata; Google Drive stores binary files.

## Shared conventions
- IDs are stable opaque strings; never use row numbers.
- Drive_File_ID is a Drive file identifier, not a public URL.
- SHA256 is lowercase 64-character hexadecimal.
- All timestamps are UTC ISO-8601.
- Binary originals and historical versions are retained; lifecycle status is not a delete command.

## 1. Documents

### `Documents`
One row per logical document, independent of its physical file versions and target associations.

| Column | Type | Required | Key / rule |
|---|---|---:|---|
| Doc_ID | ID | Yes | PK |
| Document_Type | ENUM | Yes | USER_MANUAL, BROCHURE, CERTIFICATE, WARRANTY, OTHER |
| Title | TEXT(250) | Yes | Company display title |
| Language_Code | TEXT(10) | No | BCP-47 |
| Description | TEXT(1500) | No | Company description |
| Current_Version_ID | ID | No | FK → Document_Versions; must belong to same Doc_ID |
| Lifecycle_Status | ENUM | Yes | DRAFT, ACTIVE, ARCHIVED |
| Created_At | DATETIME_UTC | Yes | System generated |
| Created_By | ACTOR_ID | Yes | Actor |
| Updated_At | DATETIME_UTC | Yes | System generated |
| Updated_By | ACTOR_ID | Yes | Actor |

Current_Version_ID is the only current-version authority. Blank is allowed while a document is first registered, but an ACTIVE document offered for output must have a valid current version.

### `Document_Versions`
Immutable file revisions. A new upload creates a new row; never replace the file of an existing version.

| Column | Type | Required | Key / rule |
|---|---|---:|---|
| Version_ID | ID | Yes | PK |
| Doc_ID | ID | Yes | FK → Documents |
| Version_Label | TEXT(80) | Yes | Human label, e.g. Rev B |
| Drive_File_ID | DRIVE_FILE_ID | Yes | Immutable stored file |
| Original_File_Name | TEXT(255) | Yes | Uploaded filename |
| MIME_Type | TEXT(100) | Yes | Validated |
| File_Size_Bytes | INTEGER | Yes | >= 0 |
| SHA256 | HEX64 | Yes | Exact file fingerprint |
| Uploaded_At | DATETIME_UTC | Yes | System generated |
| Uploaded_By | ACTOR_ID | Yes | Actor |
| Version_Notes | TEXT(1000) | No | Notes |
| Supersedes_Version_ID | ID | No | Self-FK; same Doc_ID |
| Lifecycle_Status | ENUM | Yes | AVAILABLE, QUARANTINED, ARCHIVED |

Unique: (Doc_ID, SHA256) to prevent duplicate binary versions for the same logical document unless an explicit exception is recorded. A version must belong to the same Doc_ID referenced by Documents.Current_Version_ID or Document_Links.Pinned_Version_ID. Rollback changes the current pointer; it does not delete versions.

### `Document_Links`
One row per document-target-mode association. This table intentionally allows both an EXCLUDE and an INCLUDE row for the same document and variant: the former cancels inherited product association; the latter represents a direct variant association.

| Column | Type | Required | Key / rule |
|---|---|---:|---|
| Link_ID | ID | Yes | PK |
| Doc_ID | ID | Yes | FK → Documents |
| Target_Type | ENUM | Yes | PRODUCT, VARIANT |
| Target_ID | ID | Yes | FK resolved by Target_Type |
| Link_Mode | ENUM | Yes | INCLUDE, EXCLUDE |
| Pinned_Version_ID | ID | No | FK → Document_Versions; same Doc_ID |
| Display_Order | INTEGER | Yes | Default 0 |
| Created_At | DATETIME_UTC | Yes | System generated |
| Created_By | ACTOR_ID | Yes | Actor |
| Link_Notes | TEXT(500) | No | Optional |

Unique: (Doc_ID, Target_Type, Target_ID, Link_Mode). Application validation permits:
- PRODUCT: INCLUDE only.
- VARIANT: INCLUDE and/or EXCLUDE, at most one row of each mode for a given Doc_ID and target.
- EXCLUDE is valid only when the document is inherited from a product-level INCLUDE association.
- An EXCLUDE on a variant cancels only the inherited product association. A direct VARIANT INCLUDE remains effective independently.
- A direct variant INCLUDE and inherited EXCLUDE may coexist as two rows; this is not a conflict.
- Product-level EXCLUDE is invalid.
- Effective display is de-duplicated by Doc_ID.
- If a direct variant INCLUDE exists, its Display_Order and Pinned_Version_ID control the variant display; otherwise inherit product-link settings.
- If no pinned version is resolved, use Documents.Current_Version_ID.
- Every pinned version must belong to the same Doc_ID.

Resolution:
1. Start with all PRODUCT INCLUDE links for the product.
2. For the target variant, remove inherited Doc_IDs that have a VARIANT EXCLUDE link.
3. Add all direct VARIANT INCLUDE links.
4. De-duplicate by Doc_ID, resolving direct variant link settings over inherited settings.
5. Resolve version: direct variant pin, else product pin, else Documents.Current_Version_ID.

## 2. Image asset library

### `Image_Assets`
One row per logical image asset. Original file is preserved; derived renditions are separately referenced.

| Column | Type | Required | Key / rule |
|---|---|---:|---|
| Image_ID | ID | Yes | PK |
| Original_File_ID | DRIVE_FILE_ID | Yes | Preserved original |
| Original_File_Name | TEXT(255) | Yes | Original filename |
| MIME_Type | TEXT(100) | Yes | Validated MIME |
| Width_PX | INTEGER | Yes | > 0 |
| Height_PX | INTEGER | Yes | > 0 |
| File_Size_Bytes | INTEGER | Yes | >= 0 |
| Has_Alpha | BOOLEAN | Yes | True/false |
| Color_Space | ENUM | No | SRGB, DISPLAY_P3, CMYK, GRAYSCALE, UNKNOWN |
| Orientation | ENUM | Yes | NORMALIZED, EXIF_ROTATED, UNKNOWN |
| SHA256 | HEX64 | Yes | Exact original-file hash |
| PHash | TEXT(64) | No | Perceptual hash algorithm/version documented |
| Source_Type | ENUM | Yes | CATALOG_EMBEDDED, PAGE_RENDER, MANUAL_UPLOAD, OTHER |
| Source_Catalog_ID | ID | No | FK → Catalogs |
| Source_Catalog_Page_ID | ID | No | FK → Catalog_Pages; must belong to Source_Catalog_ID |
| Source_Product_Source_Record_ID | ID | No | FK → Product_Source_Records |
| Source_Variant_Source_Record_ID | ID | No | FK → Variant_Source_Records |
| Source_Document_Version_ID | ID | No | FK → Document_Versions |
| Source_Page_Label | TEXT(80) | No | Printed page label if known |
| Quality_Status | ENUM | Yes | UNASSESSED, ACCEPTABLE, LOW_RESOLUTION, CORRUPT, NEEDS_REVIEW |
| Lifecycle_Status | ENUM | Yes | ACTIVE, ARCHIVED, QUARANTINED |
| Duplicate_Of_Image_ID | ID | No | Self-FK to canonical asset; no deletion |
| Created_At | DATETIME_UTC | Yes | System generated |
| Created_By | ACTOR_ID | Yes | Actor |

Source provenance rules: CATALOG_EMBEDDED and PAGE_RENDER require Source_Catalog_ID and Source_Catalog_Page_ID; the page must belong to that catalog. If a Product_Source_Record_ID or Variant_Source_Record_ID is supplied, its catalog/page ownership must match the source catalog/page. Source_Document_Version_ID, when supplied, must resolve to an available version. MANUAL_UPLOAD records require an authenticated Created_By and must not invent catalog provenance. OTHER requires a documented source note/manifest in the audit trail.

Unique SHA256 for active original assets should be enforced by application-level duplicate checks. Exact match can reuse an existing asset. PHash is only a candidate signal and must never automatically merge/delete.

### `Image_Renditions`
Immutable derived files generated from an Image_Assets original. A new processing recipe or output creates a new rendition row; never overwrite an existing rendition.

| Column | Type | Required | Rule |
|---|---|---:|---|
| Image_Rendition_ID | ID | Yes | PK |
| Image_ID | ID | Yes | FK → Image_Assets |
| Rendition_Type | ENUM | Yes | PREVIEW, HIGH_QUALITY, CATALOG_READY, THUMBNAIL, NORMALIZED_ORIGINAL |
| Drive_File_ID | DRIVE_FILE_ID | Yes | Immutable binary file |
| SHA256 | HEX64 | Yes | Exact rendition checksum |
| MIME_Type | TEXT(100) | Yes | Validated |
| Width_PX | INTEGER | Yes | > 0 |
| Height_PX | INTEGER | Yes | > 0 |
| File_Size_Bytes | INTEGER | Yes | >= 0 |
| Pipeline_Version | TEXT(80) | Yes | Exact generation build |
| Source_SHA256 | HEX64 | Yes | Original asset hash used as input |
| Created_At | DATETIME_UTC | Yes | Immutable |

Unique (Image_ID, Rendition_Type, SHA256). A PDF issue pins the exact Image_Rendition_ID and SHA256 in its issue manifest.

### `Image_Links`
Associates one image asset with a product or variant. The same Image_ID may have multiple links.

| Column | Type | Required | Key / rule |
|---|---|---:|---|
| Image_Link_ID | ID | Yes | PK |
| Image_ID | ID | Yes | FK → Image_Assets |
| Catalog_Rendition_ID | ID | No | FK → Image_Renditions; same Image_ID, type PREVIEW or CATALOG_READY |
| DataSheet_Rendition_ID | ID | No | FK → Image_Renditions; same Image_ID, type HIGH_QUALITY |
| Target_Type | ENUM | Yes | PRODUCT, VARIANT |
| Target_ID | ID | Yes | FK resolved by Target_Type |
| Is_Primary | BOOLEAN | Yes | UI/list primary only; not an approval |
| Catalog_Approved | BOOLEAN | Yes | Independent approval |
| DataSheet_Approved | BOOLEAN | Yes | Independent approval |
| Catalog_Order | INTEGER | Yes | Default 0 |
| DataSheet_Order | INTEGER | Yes | Default 0 |
| Catalog_Crop_JSON | JSON_TEXT(1000) | No | Normalized crop coordinates/settings |
| DataSheet_Crop_JSON | JSON_TEXT(1000) | No | Independent crop |
| Link_Status | ENUM | Yes | CANDIDATE, ACTIVE, REJECTED, ARCHIVED |
| Created_At | DATETIME_UTC | Yes | System generated |
| Created_By | ACTOR_ID | Yes | Actor |
| Updated_At | DATETIME_UTC | Yes | System generated |
| Updated_By | ACTOR_ID | Yes | Actor |

Unique: (Image_ID, Target_Type, Target_ID). At most one active primary image per target is enforced by application validation. Any Catalog_Rendition_ID or DataSheet_Rendition_ID must point to a rendition of the same Image_ID and the allowed Rendition_Type; a link cannot pin a rendition from a different image. Primary does not imply Catalog_Approved or DataSheet_Approved. Crop settings must not alter the preserved original.

### `Image_Review_Pairs`
One row per reviewed candidate pair (canonical order Image_A_ID < Image_B_ID).

| Column | Type | Required | Key / rule |
|---|---|---:|---|
| Review_Pair_ID | ID | Yes | PK |
| Image_A_ID | ID | Yes | FK → Image_Assets |
| Image_B_ID | ID | Yes | FK → Image_Assets; different from A |
| Algorithm | TEXT(80) | Yes | Algorithm identifier/version |
| Distance | DECIMAL(12,6) | Yes | Algorithm-specific distance |
| Decision | ENUM | Yes | PENDING, SAME_ASSET, DISTINCT, RELATED |
| Reviewed_At | DATETIME_UTC | No | Set after human decision |
| Reviewed_By | ACTOR_ID | No | Actor |
| Notes | TEXT(1000) | No | Review note |

Unique: (Image_A_ID, Image_B_ID, Algorithm). Distance thresholds only create review candidates; they do not make decisions.

## 3. Image resolution and PDF quality rules
- Effective image selection for a target: approved variant images first, then approved product images; no unapproved fallback by default.
- Catalog and datasheet selections are resolved independently.
- If no approved image exists, Preflight warns and offers export-without-image or explicit approval.
- UI reads PREVIEW renditions only. PDF worker reads the exact approved HIGH_QUALITY rendition selected/pinned for the issue; it must never use a PREVIEW rendition.
- Compute effective DPI after crop and at actual rendered dimensions in the template. Calculate horizontal and vertical DPI; use the lower value for threshold decisions.
- Digital target default: 150 DPI. Print-oriented target default: 300 DPI. These are configurable targets, not guarantees.
- Never upscale and claim a higher native resolution.
- After PDF generation, inspect embedded image dimensions where technically possible and compare to expected output.
- Duplicate resolution sets Duplicate_Of and redirects active links to the canonical asset through audited operations; retain original asset record and file.


## 4. V2 integrity and immutability contract

### 4.1 Immutable binary assets

Every Image_Assets row and every binary brand/font/graphic/watermark/paper asset record is immutable after creation. Original_File_ID, rendition file IDs, MIME type, dimensions, byte size, SHA256, and semantic role must not be edited in place once referenced by a published design or issued output. A replacement creates a new asset ID and checksum; old records and files remain available for historical outputs. Published manifests pin exact asset IDs and SHA256 values. Verify the checksum before rendering; mismatch blocks issuance/reproduction.

### 4.2 Canonical target resolver

Document_Links and Image_Links use Target_Type + Target_ID, so every create/update/import/promotion and pre-issue validation must call a shared resolveTarget(Target_Type, Target_ID) contract. It validates supported type, target existence, lifecycle, Variant→Product ownership, and any pinned document-version or canonical image-asset ownership. Orphan/type mismatch/ownership mismatch is rejected. Run periodic integrity scans because Sheets cannot enforce polymorphic foreign keys.

### 4.3 Image duplicate redirect integrity

Duplicate_Of_Image_ID must not equal Image_ID. Before accepting a redirect, resolve the full chain and reject cycles. The terminal canonical asset must be available and not quarantined; archived targets require an explicit audited override. Redirect active links as a separate audited operation. Preserve original assets and historical links; never delete an image because it is similar.