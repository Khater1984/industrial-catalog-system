# Database Schema — Proposed Inventory

**Status:** Proposed logical inventory; exact columns and constraints require review.
**Storage:** Google Sheets, with Drive file IDs for binary assets.
**Primary-key rule:** Every entity uses a stable generated ID. Sheet row numbers are never identifiers.

## 1. Naming and relationship conventions
- IDs are opaque stable strings (for example, Product_ID, Variant_ID, Image_ID).
- Foreign keys use the exact referenced ID.
- Timestamps use a consistent UTC ISO-8601 representation unless a field explicitly represents a local business date.
- Enumerated values are documented and validated centrally.
- Do not duplicate a derived state as a second editable source of truth.

## 2. Supplier/source domain

| Table | Purpose | Key relationships |
|---|---|---|
| Catalogs | Supplier catalog registry and source-file provenance | One catalog can yield many extracted products and runs |
| Products | Supplier-derived product identity and source name | Parent of Variants |
| Variants | Supplier-derived model/configuration | Each Variant belongs to one Product |
| Specifications | Immutable supplier specification records | Linked to Product and/or Variant according to approved source model |

Source records should retain Catalog_ID, source page/section, extraction run, and provenance where available. Source values are not overwritten by company corrections.

## 3. Company product domain

| Table | Purpose |
|---|---|
| Product_Company | Company-owned product fields such as Arabic name and company annotations |
| Variant_Company | Company-owned model fields, including Arabic model name where required |
| Product_Families | Hierarchical product classification; Parent_Family_ID is optional |
| Attribute_Definitions | Attribute name, data type, unit, allowed values, validation, and applicable scope |
| Product_Attributes | Product-level default attribute values |
| Variant_Attribute_Overrides | Variant-specific overrides, including Override_Mode = VALUE or INTENTIONALLY_EMPTY |
| Specification_Changes | Central UPDATE / ADD / DELETE operations over source specifications |

### Specification_Changes rules
- UPDATE references an existing source Specification_ID.
- DELETE references an existing source Specification_ID and suppresses it only in effective company output.
- ADD creates a company-owned specification with its own stable change/specification identity.
- Validate target Product_ID / Variant_ID consistency.
- Define deterministic ordering and conflict handling before implementation.
- Effective Specifications are computed; they are not manually maintained as a second table unless a cache is later justified and safely invalidated.

## 4. Document domain

| Table | Purpose |
|---|---|
| Documents | Logical document record, type/title/language, and Current_Version_ID |
| Document_Versions | Immutable file versions, Drive_File_ID, checksum, version label, upload timestamp, notes |
| Document_Links | Associations to PRODUCT or VARIANT targets; INCLUDE/EXCLUDE mode, optional pinned version, display order |

Constraints and rules:
- Documents.Current_Version_ID is the sole authority for the current version.
- A version must belong to the same Doc_ID as its parent Documents row.
- Do not maintain an independent Is_Current flag.
- No duplicate Doc_ID + Target_Type + Target_ID links.
- Do not allow conflicting INCLUDE and EXCLUDE rows for the same document and target.
- Product-level INCLUDE is inherited by variants; variant EXCLUDE removes that inherited association only.
- Direct variant INCLUDE remains effective independently.
- Display de-duplicates by Doc_ID.
- Version resolution and pinning precedence must be finalized before implementation.

## 5. Image domain

| Table | Purpose |
|---|---|
| Image_Assets | Central asset metadata and original/high-quality/preview Drive file IDs |
| Image_Links | PRODUCT/VARIANT associations, primary status, independent catalog/datasheet approval, order and crop settings |
| Image_Review_Pairs | Human review of perceptually similar image pairs and decisions |

Image_Assets proposed fields include dimensions, MIME type, byte size, alpha presence, color space, orientation, SHA-256, perceptual hash, source type, source catalog/page, quality status, lifecycle status, and Duplicate_Of.

Rules:
- SHA-256 identifies exact binary duplicates.
- Perceptual hash identifies candidates for human review only.
- Duplicate_Of must not trigger automatic deletion; approved resolution redirects active associations to a canonical asset while retaining the original record and audit history.
- UI previews must never be used for final PDF output.
- Catalog and datasheet approval are independent.
- Primary image status does not imply either approval.

## 6. Design and export domain

| Table | Purpose |
|---|---|
| Brands | Logical document identities |
| Brand_Versions | Immutable draft/published identity versions |
| Brand_Assets | Logos, fonts, graphics, and other brand files |
| Papers | Page size, background, texture, and paper rendering settings |
| Templates | Logical document templates |
| Template_Versions | Immutable template versions |
| Template_Identity_Links | Compatibility/association between templates and brand identities |
| Watermark_Presets | Reusable text/logo/image watermark settings |
| Status_Defaults | Optional suggested watermark by document status; suggestion is not forced coupling |
| Contact_Profiles | Contact/social details and display settings |
| Export_Profiles | Digital/print-oriented output settings, DPI thresholds, and validation rules |

Keep application UI identity separate from document identity. Brand identity, template, product data, paper, watermark, status, and export profile are separate concepts.

## 7. Workflow, audit, and output domain

| Table | Purpose |
|---|---|
| Staging_* | Temporary extracted proposals before approval |
| Review_Queue | Ambiguous, low-confidence, or conflicting items requiring human review |
| Run_Log | Processing run state, page progress, retries, errors, and completion |
| Audit_Log | Who/what changed, when, target, before/after or change reference |
| Issued_Documents | Immutable issued PDF metadata, checksums, and references to snapshots |

The exact Staging_* table split depends on extraction output design and will be finalized after a representative-catalog benchmark.

## 8. Snapshot storage
Large snapshots are JSON files in Drive, not oversized Sheets cells. Issued_Documents stores the snapshot Drive file ID and checksum, along with the exact design/data/runtime version references.

## 9. Proposed Drive folders
- Supplier_Catalogs/
- Product_Images/Originals/Extracted_From_Catalogs/
- Product_Images/Originals/Manual_Uploads/
- Product_Images/High_Quality/
- Product_Images/Previews/
- Product_Images/Archived/
- Product_Documents/
- Brand_Assets/
- Issued_PDFs/
- Issued_Snapshots/

## 10. Excluded or superseded structures
- No separate sheet per product or per specification change.
- No separate product-image file duplication for every product/variant association.
- No Product_Documents / Document_Product_Links parallel model; use Documents, Document_Versions, Document_Links.
- No Is_Current flag competing with Documents.Current_Version_ID.
- No legacy-table direct import as production data.
- No complex user/role tables in the initial single-primary-user scope.
- No Display_Settings catch-all if settings belong to a specific domain table.

## 11. Required schema review before build
For every table, approve:
1. Exact column names and types.
2. Primary key and foreign keys.
3. Unique constraints and allowed nulls.
4. Enumerations and validation.
5. Delete/archive behavior.
6. Index/search strategy within Sheets constraints.
7. Audit requirements.
8. Migration and rollback approach.

This inventory is not yet a script for creating live Google Sheets.
