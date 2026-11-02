# Delivery Roadmap

**Current phase:** 0 — Architecture and schema validation.
**Delivery style:** Small increments with acceptance checks; no big-bang implementation.

## Phase 0 — Architecture approval
Deliverables:
- Review and approve ARCHITECTURE.md.
- Review exact table/column inventory in DATABASE_SCHEMA.md.
- Resolve open decisions and record them in DECISIONS_LOG.md.
- Define representative supplier catalogs for testing.

Exit criteria:
- User explicitly approves architecture and schema.
- No unresolved contradictions in source immutability, inheritance, document versioning, image approvals, or issued-PDF immutability.

## Phase 1 — Repository and engineering foundation
Deliverables:
- README and repository conventions.
- Frontend, Apps Script, and Python worker folder skeletons.
- Environment-variable and secret-management documentation.
- Automated formatting/static checks where practical.
- Development and deployment instructions.

Exit criteria:
- Clean project structure.
- No secrets in repository.
- A documented local development workflow.

## Phase 2 — Data foundation
Deliverables:
- Approved Google Sheets schema specification.
- ID generation and validation conventions.
- Apps Script data-access layer.
- Backup/export and restore procedure.
- Audit logging foundation.

Exit criteria:
- Create/read/update flows pass tests on a disposable test spreadsheet.
- Referential integrity checks detect invalid relationships.
- No production data modified.

## Phase 3 — Product management
Deliverables:
- Product and variant CRUD.
- Product family hierarchy.
- Company identity fields and Arabic labels.
- Typed attributes and inheritance/override behavior.
- Immutable source specifications and company specification changes.
- Effective specification resolver.

Exit criteria:
- Product/variant inheritance scenarios pass.
- VALUE and INTENTIONALLY_EMPTY behave distinctly.
- Source specification values remain unchanged after company edits.

## Phase 4 — Documents and images
Deliverables:
- Shared document library and versioning.
- Product/variant INCLUDE and EXCLUDE behavior.
- Central image asset library and multi-target links.
- Manual multi-image upload.
- Independent catalog/datasheet approvals.
- Exact duplicate detection and human similarity review.
- Crop and effective-DPI preflight.

Exit criteria:
- Shared documents render once per target.
- Exclusions do not suppress direct variant documents.
- Original images and document versions remain preserved.
- Low-resolution images warn correctly.

## Phase 5 — Catalog extraction worker
Deliverables:
- Catalog registration and page-by-page processing.
- OCR/table/image extraction strategy.
- Staging records with provenance and confidence.
- Resumable/idempotent runs.
- Review queue and approval/promotion flow.
- Representative benchmark and cost report.

Exit criteria:
- Re-running a completed/failed job does not duplicate promoted records.
- Ambiguous extraction is not auto-promoted.
- Benchmark reports accuracy by field and catalog type.

## Phase 6 — Design Studio and PDF generation
Deliverables:
- Brand identity and versioning.
- Template and versioning.
- Paper/background and watermark controls.
- Product catalog and technical datasheet templates.
- HTML preview and actual PDF preview.
- Preflight, image DPI checks, overflow checks, font checks.
- PDF snapshot and runtime fingerprint.

Exit criteria:
- Published design versions cannot be edited in place.
- Issued PDF remains unchanged after later source/design changes.
- Output checks are recorded and reproducible to the documented level.
- Print-ready label is withheld unless external print requirements are met.

## Phase 7 — Integration, hardening, and release
Deliverables:
- End-to-end workflows.
- Mobile and desktop testing.
- Security and access review.
- Backup/restore rehearsal.
- Failure/retry testing.
- Deployment and operations guide.

Exit criteria:
- Representative workflows pass end-to-end.
- Known limitations and operational costs are documented.
- User accepts release candidate.

## Testing policy
Each phase has:
- Defined test cases before implementation.
- Test data isolated from real production assets.
- Expected results and actual results recorded.
- Regression tests for previously approved behavior.
- Explicit user acceptance before moving to the next major phase.

## Immediate next action
Complete the architecture review and schema approval. Do not begin production implementation or create live Sheets tables before that approval.
