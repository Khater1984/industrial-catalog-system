# Project Rules — Industrial Catalog System

**Status:** Active engineering baseline; implementation remains gated by final schema and operational approval.
**Project:** Industrial Equipment Catalog System
**Repository:** `Khater1984/industrial-catalog-system`

## 1. Product purpose
Build an internal, single-primary-user system for managing industrial equipment catalogs from suppliers. It must manage products, variants, specifications, images, documents, brand identities, templates, and controlled PDF outputs. It is not a generic PDF-to-Excel converter and is not initially a multi-tenant SaaS.

## 2. Core principles
1. Preserve supplier source data as immutable evidence.
2. Keep canonical Product/Variant identities separate from supplier catalog occurrences; human approval is required for cross-source matching.
3. Separate supplier/source data, company-managed data, and issued outputs.
4. Use stable IDs for records and relationships; do not rely on row numbers or display names as identifiers.
5. Never silently delete source files, source values, image originals, document versions, or issued PDFs.
6. Avoid duplicate physical files when one asset can be safely referenced by multiple records.
7. Derived states must be calculated from authoritative data, not maintained as competing sources of truth.
8. Keep human review for ambiguous extraction; AI suggestions are not automatically approved facts.
9. Every material company-side change must be auditable.
10. An issued PDF must remain unchanged when products, templates, identities, or assets are later edited.
11. Do not claim extraction accuracy, print readiness, or reproducibility without tests that support the claim.

## 3. Approved initial technology direction
- Frontend: HTML, CSS, and JavaScript.
- Application backend: Google Apps Script.
- Structured data: Google Sheets.
- File storage: Google Drive.
- Processing service: Python worker for catalog extraction and PDF generation.
- Source control and project documentation: GitHub.

Technology choices may be revisited only through a documented decision.

## 4. Data migration policy
The legacy database is reference material only. Do not import its records directly into production tables. If legacy data is later supplied, copy it into an isolated staging/import area, profile and validate it, resolve duplicates and conflicts, and obtain explicit approval before promoting any records.

## 5. Source integrity
- Supplier-extracted English product names and supplier specifications retain their source values.
- Company translations, overrides, annotations, and corrections belong in separate company-managed records.
- Never overwrite source specifications to make a company correction.
- Retain source catalog identity and page/region provenance wherever available.

## 6. Specifications
- Keep source specifications immutable.
- Store company changes centrally as operations (UPDATE, ADD, DELETE) associated with stable product/variant/specification IDs.
- Effective specifications are computed from source specifications plus approved company changes.
- DELETE hides a source specification from company outputs; it does not erase the source record.
- PDF generation reads effective specifications, not raw source rows alone.

## 7. Attribute inheritance
- Product-level attributes provide defaults.
- Variant-level overrides may replace inherited values or intentionally clear them.
- An override must distinguish VALUE from INTENTIONALLY_EMPTY.
- Inherited / Customized / Empty are derived display states, not independently editable truth fields.
- Attribute definitions must specify data type and validation rules.

## 8. Documents and versions
- A document may be linked to a product, a variant, or multiple targets.
- One physical stored file may be shared by multiple links.
- `Documents.Current_Version_ID` is the sole authority for the current version.
- Do not add a second current-version flag as a competing authority.
- Variant exclusions suppress inherited product-level links only; they must not suppress a separate direct variant link.
- Preserve historical versions and issued outputs.

## 9. Images
- Keep a central image asset library with original files preserved.
- Preview images are for the application UI only; PDF generation uses the approved high-quality asset.
- Approval for catalog use and datasheet use is independent.
- Primary image status does not imply document approval.
- Detect exact duplicates using file hashes. Similarity detection must lead to human review, not automatic deletion.
- Never upscale a low-resolution image and represent it as genuinely higher quality.
- Evaluate effective DPI after crop and at the actual rendered size.

## 10. Design and PDF
- Separate application UI styling from document identity.
- Separate brand identity, document template, product data, paper/background, watermark, and document status.
- Published design versions are immutable; edits create a new version.
- Issued documents retain a snapshot of the data and design versions used.
- Preserve the original issued PDF. Re-generation from a snapshot is a separate reproducibility operation.
- Use accurate output labels: Digital PDF, Print-oriented PDF, and Print-ready PDF only when the printer's requirements are met.

## 11. Engineering workflow
- Work in small, reviewable increments.
- Define acceptance criteria before implementing a module.
- Test each module before integration.
- Do not create production Sheets or modify Drive contents until the schema and implementation plan are approved.
- Do not add secrets, API keys, credentials, or private customer data to Git.
- Use placeholders and documented environment configuration.
- Document assumptions, limitations, migrations, and operational steps.

## 12. Change control
Any change to an approved architectural decision must:
1. Explain the reason and impact.
2. Identify affected tables, APIs, UI, worker, and existing records.
3. Include a migration/rollback plan where applicable.
4. Be recorded in `DECISIONS_LOG.md`.
5. Receive explicit user approval before implementation.

## 13. Current stage
Documentation and architecture validation only. No application code, live database creation, production Drive changes, or legacy-data migration is authorized until the architecture and schema are approved.
