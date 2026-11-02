# Detailed Schema — Design System & Issued Outputs

**Status:** Detailed proposal for review; not implementation authorization.
**Storage:** Sheets for structured metadata; Drive for binary brand assets, templates/snapshots, and PDFs.

## 1. Shared versioning rules
- Logical entity rows have stable IDs.
- Version rows have stable version IDs and immutable published content.
- Draft may be edited; publishing freezes that version. Further edits create a new draft/version.
- A document issued in the past must not change when a brand, template, product, paper, or export profile changes.
- Avoid a mutable `Is_Current` flag where a single pointer can be authoritative.

## 2. Brand identity

### `Brands`
| Column | Type | Required | Key / rule |
|---|---|---:|---|
| Brand_ID | ID | Yes | PK |
| Brand_Name | TEXT(160) | Yes | Unique logical identity name |
| Description | TEXT(1000) | No | Purpose |
| Identity_Type | ENUM | Yes | BUILT_IN, COMPANY |
| Lifecycle_Status | ENUM | Yes | ACTIVE, ARCHIVED |
| Created_At | DATETIME_UTC | Yes | System generated |
| Created_By | ACTOR_ID | Yes | Actor |

### `Brand_Versions`
| Column | Type | Required | Key / rule |
|---|---|---:|---|
| Brand_Version_ID | ID | Yes | PK |
| Brand_ID | ID | Yes | FK → Brands |
| Version_Number | INTEGER | Yes | Monotonic within Brand_ID |
| Version_Status | ENUM | Yes | DRAFT, PUBLISHED, RETIRED |
| Design_Config_File_ID | DRIVE_FILE_ID | Yes | JSON configuration in Drive |
| Config_SHA256 | HEX64 | Yes | Hash of exact config file |
| Published_At | DATETIME_UTC | No | Required for PUBLISHED/RETIRED |
| Published_By | ACTOR_ID | No | Required for PUBLISHED/RETIRED |
| Change_Notes | TEXT(1500) | No | Version rationale |
| Created_At | DATETIME_UTC | Yes | System generated |
| Created_By | ACTOR_ID | Yes | Actor |

Unique: (Brand_ID, Version_Number). A published config file is immutable. Brand_Versions is the authoritative design definition; do not duplicate the same full config in Sheets cells.

### `Brand_Assets`
| Column | Type | Required | Key / rule |
|---|---|---:|---|
| Brand_Asset_ID | ID | Yes | PK |
| Brand_ID | ID | Yes | FK → Brands |
| Asset_Type | ENUM | Yes | LOGO, FONT, GRAPHIC, ICON, BACKGROUND, OTHER |
| Asset_Name | TEXT(180) | Yes | Company label |
| Drive_File_ID | DRIVE_FILE_ID | Yes | Binary asset |
| MIME_Type | TEXT(100) | Yes | Validated |
| SHA256 | HEX64 | Yes | Exact file fingerprint |
| License_Notes | TEXT(1000) | No | Font/asset licensing notes |
| Lifecycle_Status | ENUM | Yes | ACTIVE, ARCHIVED |
| Created_At | DATETIME_UTC | Yes | System generated |

Brand assets may be referenced by one or more brand versions. The version's immutable config records the exact Brand_Asset_ID and file checksum used.

## 3. Paper and backgrounds

### `Papers` — logical paper identity only

| Column | Type | Required | Rule |
|---|---|---:|---|
| Paper_ID | ID | Yes | PK |
| Paper_Name | TEXT(120) | Yes | Logical label |
| Lifecycle_Status | ENUM | Yes | ACTIVE, ARCHIVED |
| Created_At | DATETIME_UTC | Yes | System generated |
| Created_By | ACTOR_ID | Yes | Actor |

All render-affecting paper settings belong to immutable `Paper_Versions`, not this logical row.

### `Paper_Versions`

| Column | Type | Required | Rule |
|---|---|---:|---|
| Paper_Version_ID | ID | Yes | PK |
| Paper_ID | ID | Yes | FK → Papers; logical identity for navigation |\n| Paper_Version_ID | ID | Yes | FK → Paper_Versions; exact immutable settings used |
| Version_Number | INTEGER | Yes | Monotonic per Paper_ID |
| Version_Status | ENUM | Yes | DRAFT, PUBLISHED, RETIRED |
| Paper_Config_File_ID | DRIVE_FILE_ID | Yes | Immutable JSON configuration |
| Config_SHA256 | HEX64 | Yes | Hash of exact config |
| Texture_Asset_ID | ID | Conditional | Immutable asset; required for texture |
| Texture_SHA256 | HEX64 | Conditional | Must match asset checksum |
| Published_At | DATETIME_UTC | No | Required when published/retired |
| Published_By | ACTOR_ID | No | Required when published/retired |
| Created_At | DATETIME_UTC | Yes | |
| Created_By | ACTOR_ID | Yes | |

Unique: (Paper_ID, Version_Number). Page size, orientation, dimensions, color, texture, scale, opacity, and positioning changes require a new version. Published versions and referenced assets are immutable.

## 4. Templates

### `Templates`
| Column | Type | Required | Key / rule |
|---|---|---:|---|
| Template_ID | ID | Yes | PK |
| Template_Name | TEXT(160) | Yes | Logical template name |
| Document_Type | ENUM | Yes | TECHNICAL_DATASHEET, PRODUCT_CATALOG, MASTER_CATALOG, COMPANY_PROFILE |
| Description | TEXT(1000) | No | Purpose |
| Lifecycle_Status | ENUM | Yes | ACTIVE, ARCHIVED |
| Created_At | DATETIME_UTC | Yes | System generated |
| Created_By | ACTOR_ID | Yes | Actor |

### `Template_Versions`
| Column | Type | Required | Key / rule |
|---|---|---:|---|
| Template_Version_ID | ID | Yes | PK |
| Template_ID | ID | Yes | FK → Templates |
| Version_Number | INTEGER | Yes | Monotonic per template |
| Version_Status | ENUM | Yes | DRAFT, PUBLISHED, RETIRED |
| Template_Config_File_ID | DRIVE_FILE_ID | Yes | Immutable JSON/config artifact on publish |
| Config_SHA256 | HEX64 | Yes | Exact config fingerprint |
| Preview_File_ID | DRIVE_FILE_ID | No | Generated preview artifact |
| Published_At | DATETIME_UTC | No | Required when published |
| Published_By | ACTOR_ID | No | Required when published |
| Change_Notes | TEXT(1500) | No | Version notes |
| Created_At | DATETIME_UTC | Yes | System generated |
| Created_By | ACTOR_ID | Yes | Actor |

Unique: (Template_ID, Version_Number). Published versions are immutable.

### `Template_Identity_Links`
| Column | Type | Required | Key / rule |
|---|---|---:|---|
| Template_Identity_Link_ID | ID | Yes | PK |
| Template_ID | ID | Yes | FK → Templates |
| Brand_ID | ID | Yes | FK → Brands |
| Is_Default | BOOLEAN | Yes | Default false |
| Status | ENUM | Yes | ACTIVE, DISABLED |
| Created_At | DATETIME_UTC | Yes | System generated |

Unique: (Template_ID, Brand_ID). At most one active default identity per template. Actual issue must pin both Template_Version_ID and Brand_Version_ID; this link only expresses compatibility/default selection.

## 5. Watermarks and status defaults

### `Watermark_Presets`
| Column | Type | Required | Key / rule |
|---|---|---:|---|
| Watermark_ID | ID | Yes | PK |
| Watermark_Name | TEXT(120) | Yes | Preset label |
| Watermark_Type | ENUM | Yes | TEXT, LOGO, IMAGE |
| Text_Content | TEXT(250) | Conditional | Required for TEXT |
| Asset_File_ID | DRIVE_FILE_ID | Conditional | Required for LOGO/IMAGE |
| Position | ENUM | Yes | CENTER, TOP, BOTTOM, CUSTOM |
| Opacity | DECIMAL(4,3) | Yes | 0..1 |
| Rotation_Degrees | DECIMAL(6,2) | Yes | Default 0 |
| Width_Percent | DECIMAL(5,2) | No | 0..100 |
| Color_HEX | TEXT(9) | No | Text watermark color |
| Layer | ENUM | Yes | BEHIND_CONTENT, ABOVE_CONTENT |
| Page_Application_JSON | JSON_TEXT(1000) | Yes | Cover/all/selected page rules |
| Lifecycle_Status | ENUM | Yes | ACTIVE, ARCHIVED |
| Created_At | DATETIME_UTC | Yes | System generated |
| Updated_At | DATETIME_UTC | Yes | System generated |

### `Status_Defaults`
| Column | Type | Required | Key / rule |
|---|---|---:|---|
| Status_Default_ID | ID | Yes | PK |
| Document_Status | ENUM | Yes | ORIGINAL, PRELIMINARY, CONFIDENTIAL, REVISED, FINAL |
| Suggested_Watermark_ID | ID | No | FK → Watermark_Presets |
| Is_Active | BOOLEAN | Yes | Default true |
| Updated_At | DATETIME_UTC | Yes | System generated |

Unique: Document_Status. This is a suggestion only. Document status and actual watermark selection remain independent and both are snapshotted at issue time.

## 6. Contact profiles

### `Contact_Profiles`
| Column | Type | Required | Key / rule |
|---|---|---:|---|
| Contact_Profile_ID | ID | Yes | PK |
| Profile_Name | TEXT(120) | Yes | e.g. Main Office |
| Phone | TEXT(60) | No | Preserve international prefix |
| Email | EMAIL | No | Validated |
| Website_URL | URL | No | Validated |
| LinkedIn_URL | URL | No | Validated |
| Facebook_URL | URL | No | Validated |
| Instagram_URL | URL | No | Validated |
| YouTube_URL | URL | No | Validated |
| Display_Config_JSON | JSON_TEXT(1500) | Yes | Visibility, vector icon, size, color, spacing |
| Lifecycle_Status | ENUM | Yes | ACTIVE, ARCHIVED |
| Created_At | DATETIME_UTC | Yes | System generated |
| Updated_At | DATETIME_UTC | Yes | System generated |

Use vector icons, not emoji. Contact profile is selected and snapshotted per issued document.

## 7. Export profiles

### `Export_Profiles`
| Column | Type | Required | Key / rule |
|---|---|---:|---|
| Export_Profile_ID | ID | Yes | PK |
| Profile_Name | TEXT(120) | Yes | Human label |
| Output_Class | ENUM | Yes | DIGITAL_PDF, PRINT_ORIENTED_PDF, PRINT_READY_PDF |
| Target_DPI | INTEGER | Yes | > 0; default 150 digital, 300 print-oriented |
| Minimum_DPI_Warning | INTEGER | Yes | > 0 |
| Minimum_DPI_Block | INTEGER | No | > 0; must be <= warning threshold if both used |
| Color_Mode | ENUM | Yes | RGB, CMYK_REQUIRED, PRINTER_DEFINED |
| PDF_Standard | ENUM | Yes | NONE, PDF_X_1A, PDF_X_4, OTHER_REQUIRED |
| Bleed_MM | DECIMAL(5,2) | Yes | Default 0 |
| Safe_Margin_MM | DECIMAL(5,2) | Yes | >= 0 |
| Embed_Fonts | BOOLEAN | Yes | Default true where license permits |
| Compression_Config_JSON | JSON_TEXT(1500) | Yes | Images and output compression |
| Printer_Specification_Notes | TEXT(1500) | No | Required for PRINT_READY_PDF |
| Lifecycle_Status | ENUM | Yes | ACTIVE, ARCHIVED |
| Created_At | DATETIME_UTC | Yes | System generated |
| Updated_At | DATETIME_UTC | Yes | System generated |

A PRINT_READY_PDF profile is not valid for use until printer-specific requirements are documented and validated. Chromium alone must not be claimed to generate CMYK or PDF/X.

## 8. Issued documents

### `Issued_Documents`
One immutable issue record per generated PDF output.

| Column | Type | Required | Key / rule |
|---|---|---:|---|
| Issued_Document_ID | ID | Yes | PK |
| Issue_Number | TEXT(80) | Yes | Unique human-readable issue number |
| Document_Type | ENUM | Yes | TECHNICAL_DATASHEET, PRODUCT_CATALOG, MASTER_CATALOG |
| Product_ID | ID | No | FK → Products; null for multi-product outputs |
| Variant_ID | ID | No | FK → Variants; if set must belong to Product_ID |
| Scope_Snapshot_JSON_File_ID | DRIVE_FILE_ID | Yes | Immutable snapshot of selected product/variant scope |
| Brand_ID | ID | Yes | FK → Brands |
| Brand_Version_ID | ID | Yes | FK → Brand_Versions; must belong to Brand_ID |
| Template_ID | ID | Yes | FK → Templates |
| Template_Version_ID | ID | Yes | FK → Template_Versions; must belong to Template_ID |
| Paper_ID | ID | Yes | FK → Papers |
| Watermark_ID | ID | No | FK → Watermark_Presets |
| Document_Status | ENUM | Yes | ORIGINAL, PRELIMINARY, CONFIDENTIAL, REVISED, FINAL |
| Contact_Profile_ID | ID | No | FK → Contact_Profiles |
| Export_Profile_ID | ID | Yes | FK → Export_Profiles |
| Snapshot_File_ID | DRIVE_FILE_ID | Yes | Complete immutable JSON snapshot in Drive |
| Snapshot_SHA256 | HEX64 | Yes | Snapshot fingerprint |
| PDF_File_ID | DRIVE_FILE_ID | Yes | Exact issued PDF file |
| PDF_SHA256 | HEX64 | Yes | Exact PDF fingerprint |
| Output_Class | ENUM | Yes | DIGITAL_PDF, PRINT_ORIENTED_PDF, PRINT_READY_PDF |
| Issued_At | DATETIME_UTC | Yes | Issue timestamp |
| Issued_By | ACTOR_ID | Yes | Actor |
| Worker_Version | TEXT(80) | Yes | Exact worker build |
| Chromium_Version | TEXT(80) | Yes | Exact browser build |
| Playwright_Version | TEXT(80) | Yes | Exact automation library build |
| PDF_Renderer_Version | TEXT(120) | Yes | Renderer/version |
| Font_Fingerprints_JSON_File_ID | DRIVE_FILE_ID | Yes | Font names/checksums/versions |
| Image_Processing_Version | TEXT(100) | Yes | Image pipeline build |
| Preflight_Report_File_ID | DRIVE_FILE_ID | Yes | Detailed checks/warnings |
| Issue_Notes | TEXT(1500) | No | Notes |

Immutability: no in-place edits to the issue snapshot, PDF file, checksums, or version references. Corrections create a new issue record. Retrieving the original returns PDF_File_ID exactly. Re-generation from Snapshot_File_ID is a separate operation and creates a new run/issue or a clearly separated reproduction artifact; it never overwrites the original.

## 9. Preflight and output requirements
Preflight must record at least:
- Missing required product/variant fields and specification conflicts.
- Approved image selection, effective DPI after crop and rendered size, image dimensions, and any override of a warning.
- Font availability, license/embedding status, and fallback substitutions.
- Page overflow, clipping, table splitting, missing assets, and invalid links.
- Paper dimensions, margins, bleed/safe areas where applicable.
- PDF metadata and embedded image checks where supported.
- Printer profile compliance before labeling output PRINT_READY_PDF.

Output terminology:
- Digital PDF: screen-oriented output.
- Print-oriented PDF: higher-resolution layout prepared for print review, but not certified for a specific print workflow.
- Print-ready PDF: only after the actual printer's specifications (color space, PDF/X, bleed, trim, fonts, resolution, etc.) have been met and validated.


## 9. V2 immutable dependency and paper versioning contract

### 9.1 Immutable assets

Brand_Assets and every font/logo/graphic/watermark/background asset are immutable binary records. Drive_File_ID, SHA256, MIME type, byte size, and role cannot be changed after creation or once referenced by a published version. Replacement creates a new asset record. Published Brand_Versions and Template_Versions must pin exact asset IDs and SHA256 values in their immutable configuration/manifest; mutable aliases such as "current logo" are forbidden. Verify every pinned checksum before rendering.

### 9.2 Explicit Paper_Versions

Use Papers as a logical identity only (Paper_ID, Paper_Name, Lifecycle_Status, Created_At, Created_By). Move all render-affecting settings into immutable Paper_Versions records:

| Column | Type | Required | Rule |
|---|---|---:|---|
| Paper_Version_ID | ID | Yes | PK |
| Paper_ID | ID | Yes | FK → Papers |
| Version_Number | INTEGER | Yes | Monotonic per Paper_ID |
| Version_Status | ENUM | Yes | DRAFT, PUBLISHED, RETIRED |
| Paper_Config_File_ID | DRIVE_FILE_ID | Yes | Immutable JSON config |
| Config_SHA256 | HEX64 | Yes | Hash of exact config |
| Texture_Asset_ID | ID | Conditional | Immutable asset; required for texture |
| Texture_SHA256 | HEX64 | Conditional | Must match texture asset |
| Published_At | DATETIME_UTC | No | Required when published |
| Published_By | ACTOR_ID | No | Required when published |
| Created_At | DATETIME_UTC | Yes | |
| Created_By | ACTOR_ID | Yes | |

Unique (Paper_ID, Version_Number). Dimensions, orientation, background, texture, scaling, opacity, and positioning changes require a new Paper_Version_ID. Published versions cannot be edited.

### 9.3 Issued output dependency manifest

Issued_Documents must pin Paper_Version_ID (not only Paper_ID) and retain SHA256 values for the paper config, brand/template configs, all referenced fonts/images/logos/watermarks, issue data snapshot, preflight report, renderer/worker version manifest, and final PDF. A Drive file ID is a locator, not proof of content integrity. Historical reproduction reads the exact pinned artifacts only; it must not resolve mutable "current" settings.