# System Architecture — Industrial Catalog System

**Document status:** Draft for review — not yet an implementation authorization.
**Version:** 1.0 candidate baseline

## 1. Purpose and scope
A private/internal catalog-management application for industrial equipment. It receives supplier catalogs and related files, extracts structured product information, supports human review and company enrichment, and produces controlled technical datasheets and catalogs.

Initial scope:
- Supplier catalog registry and source provenance.
- Product and variant management.
- Immutable source specifications plus company overrides.
- Product families and typed attributes with inheritance.
- Shared documents and version management.
- Central image library, approvals, crop settings, and quality checks.
- Brand identities, papers, templates, watermarks, and export profiles.
- Extraction staging, review queue, run logs, audit trail.
- Issued PDF archive and reproducibility metadata.

Out of initial scope unless separately approved:
- Multi-tenant SaaS.
- Complex user/role administration.
- Automatic acceptance of uncertain AI extraction.
- Direct migration of unreviewed legacy records.
- Guaranteed print-ready CMYK/PDF-X output from a browser renderer alone.

## 2. Logical architecture

```text
Browser UI (HTML / CSS / JavaScript)
              |
              v
Google Apps Script application API
       |          |            |
       v          v            v
 Google Sheets  Google Drive  Python Worker
 structured     source and    extraction and
 records        generated     PDF rendering
                files
       ^                         |
       |                         v
       +---- job status / staging / results
```

GitHub stores source code, documentation, tests, and deployment instructions. It is not the runtime database or file store.

## 3. Responsibilities

### Frontend
- Responsive desktop and mobile interface.
- Product workspace with tabs: Identity, Additional Information, Specifications, Images, Documents, Variants.
- Search, filtering, review, approval, and export flows.
- HTML preview for rapid iteration and actual PDF preview for final rendering validation.

### Google Apps Script
- Application-facing API and orchestration.
- Validates requests and user actions.
- Reads and writes structured Sheets records.
- Creates processing jobs and communicates with the worker through authenticated endpoints.
- Enforces business rules that must not be bypassed by the UI.

### Google Sheets
- Structured records with stable IDs and explicit relationships.
- Separate source, company-managed, workflow, design, and issued-output domains.
- No use of row position as a primary key.
- No large binary files or oversized JSON snapshots in cells.

### Google Drive
- Supplier catalog originals.
- Image originals, high-quality renditions, and UI previews.
- Product documents and version files.
- Brand assets, fonts, paper textures, generated PDFs, and JSON snapshots.

### Python Worker
One worker service with two capabilities:
1. Catalog processing: page-by-page extraction, image extraction, structured staging, confidence/provenance capture, and resumable jobs.
2. PDF generation: resolve approved effective data, apply the published identity/template/export profile, render PDF, and run output checks.

The worker must be stateless between jobs except for explicit durable job state stored in the approved data/storage layer. It must support retries without duplicate records or duplicate issued outputs.

### Optional AI services
AI may assist with OCR interpretation, classification, matching, and extraction. AI output is a proposal with source evidence and confidence; ambiguous records enter human review. API costs and accuracy must be measured on representative sample catalogs before selecting a provider or promising unit costs.

## 4. Data layers

### A. Supplier/source layer
Contains source catalogs, extracted product/variant identities, and raw specifications. Source values are immutable after capture; corrections are represented in the company layer.

### B. Company-managed layer
Contains translations, product family classification, company attributes, specification changes, document/image associations, approvals, and presentation settings.

### C. Output/issued layer
Contains generated files, immutable issue metadata, and snapshots of the exact data/design versions used.

## 5. Key domain rules

### Product model
- Product is the parent canonical internal commercial identity, independent of any supplier catalog.
- Variant is a canonical model/configuration and belongs to exactly one Product.
- Product_Source_Records and Variant_Source_Records preserve each supplier/catalog/revision appearance; raw supplier wording and page provenance remain immutable.
- Cross-catalog matching is a human-reviewed identity decision. Model numbers, names, and AI confidence never auto-merge entities.
- Product Family is a classification grouping; it is not a substitute for Product.
- Product Family may be hierarchical through Parent_Family_ID.

### Specifications
- Source specifications are immutable assertions tied to the exact Product_Source_Record or Variant_Source_Record.
- A central append-only event ledger records UPDATE, ADD, and DELETE operations with per-logical-key monotonic Sequence_No.
- Effective specifications are computed deterministically from source plus approved changes.
- Conflicts, missing references, and invalid operations are rejected or routed for review.

### Attribute inheritance
- Product attributes are defaults.
- Variant overrides can carry a concrete value or intentionally empty the inherited value.
- Override_Mode values: VALUE and INTENTIONALLY_EMPTY.
- Attribute_Definitions governs type, unit, allowed values, and validation.
- Inherited, Customized, and Empty are calculated states.

### Shared documents
- Documents and Document_Versions represent logical documents and their file revisions.
- Document_Links associate documents with PRODUCT or VARIANT targets using INCLUDE or EXCLUDE.
- Product INCLUDE links are inherited by variants unless excluded at that variant.
- A direct variant INCLUDE remains visible even if a different inherited product document is excluded.
- Prevent duplicate display by Doc_ID.
- Documents.Current_Version_ID is the only current-version authority.
- Version pinning, if used, must resolve deterministically; a direct variant link takes precedence over a product-level link for that variant.

### Image assets
- Image_Assets stores the preserved original; Image_Renditions stores immutable preview/high-quality renditions, each with its own checksum and pipeline version.
- Image_Links associates an image with a product or variant and records independent catalog/datasheet approvals, order, primary status, and crop settings.
- Exact duplicate detection may reuse an existing asset; perceptual similarity only creates a review candidate.
- Original image files and historical issued PDFs are never silently removed.

### Design system
Keep these concepts separate:
- Application UI identity.
- Document brand identity and its versions.
- Document templates and their versions.
- Paper identity plus immutable Paper_Versions.
- Watermark presets.
- Document status.
- Export profiles.

A brand identity can be reused by multiple document templates. A published version is immutable.

## 6. Processing lifecycle

### Catalog extraction
1. Register the supplier catalog and preserve the original file.
2. Create a processing run with a stable Run_ID.
3. Process pages in resumable units.
4. Capture extracted text, tables, images, page references, and confidence/provenance.
5. Write proposed entities to staging tables, not production entities.
6. Route ambiguous or conflicting records to Review_Queue.
7. Promote only approved records, with audit entries.
8. Mark the run complete only after validation and reconciliation.

### PDF issue
1. Select product/variant scope, document type, template, identity, and export profile.
2. Resolve effective specifications, inherited attributes, approved images, and applicable documents.
3. Run Preflight: missing data, image approval, effective DPI, crop, fonts, page overflow, and required assets.
4. Show warnings and require user decisions for exceptions.
5. Generate PDF using the worker.
6. Validate the generated PDF and extract/check embedded image dimensions where applicable.
7. Store the PDF and an immutable issue snapshot.
8. Record all version identifiers and rendering environment details.

## 7. Issued document immutability
An issued record must capture at minimum:
- Product and variant identifiers and the resolved data snapshot.
- Brand_ID and Brand_Version.
- Template_ID and Template_Version.
- Paper_ID and exact Paper_Version_ID.
- Issued_Document_Items membership for every product/variant in multi-item issues.
- Immutable dependency manifest and SHA256 for all files/configs used.
- Watermark and document status configuration.
- Export profile and relevant settings.
- Worker, Chromium, Playwright, PDF renderer, font fingerprints, and image-processing versions.
- Generated PDF file ID, checksum, issue timestamp, and issue metadata.

Retrieving the original PDF means returning the exact archived file. Re-generating from a snapshot is a separate operation and may vary if the runtime environment differs.

## 8. Storage layout proposal

```text
Supplier_Catalogs/
Product_Images/
  Originals/
    Extracted_From_Catalogs/
    Manual_Uploads/
  High_Quality/
  Previews/
  Archived/
Product_Documents/
Brand_Assets/
Issued_PDFs/
Issued_Snapshots/
```

Drive folder IDs should be stored in configuration, not hard-coded throughout the application.

## 9. Reliability and security
- Keep credentials in secure runtime configuration, never in Git.
- Authenticate worker requests and verify request integrity.
- Validate file types, sizes, and content before processing.
- Use idempotency keys for job submission and promotion.
- Record failures and retry state in Run_Log.
- Back up Sheets and Drive assets before destructive or bulk operations.
- Apply least-privilege access to Apps Script, Drive, worker, and GitHub.
- The repository is currently public by user choice; never commit secrets, real supplier confidential catalogs, customer data, or private files.

## 10. Decisions still requiring approval
This document captures the current direction, not a frozen implementation contract. Before creating live tables or coding, confirm:
1. Final table inventory and exact columns/keys (now enumerated in DATABASE_SCHEMA.md).
2. Apps Script ↔ Worker authentication and job protocol.
3. Worker hosting provider, runtime limits, and cost.
4. Extraction method and AI/OCR provider after benchmark.
5. File size, catalog size, concurrency, and retention limits.
6. Version pinning precedence for shared documents.
7. Exact PDF renderer and print-house requirements.
8. Backup, restore, and disaster-recovery procedures.

No production implementation is authorized by this draft alone.
