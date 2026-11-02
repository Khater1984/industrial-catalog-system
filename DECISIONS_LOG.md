# Architecture Decisions Log

This file records decisions and their status. A proposal is not an approved decision until explicitly marked **Approved**.

| ID | Decision | Status | Notes |
|---|---|---|---|
| ADR-001 | Build a new system rather than extend the legacy application | Approved | Legacy data remains reference material until reviewed. |
| ADR-002 | Use HTML/CSS/JavaScript frontend, Google Apps Script backend, Google Sheets structured data, Google Drive file storage, and a Python worker | Approved direction | Hosting details and integration protocol remain open. |
| ADR-003 | Keep the initial product single-primary-user and avoid complex multi-tenant roles | Approved | Access/security still required; no public user registration scope. |
| ADR-004 | Preserve supplier source data and store company changes separately | Approved | Applies to names, specifications, and source provenance. |
| ADR-005 | Store specification changes centrally as UPDATE / ADD / DELETE operations | Approved | Effective specifications are computed from source plus approved changes. |
| ADR-006 | Support product-level attributes with variant overrides | Approved | Override_Mode must distinguish VALUE from INTENTIONALLY_EMPTY. |
| ADR-007 | Use shared logical documents, immutable document versions, and target links | Approved | Documents.Current_Version_ID is the sole current-version authority. |
| ADR-008 | Use a central image asset library with multiple product/variant links | Approved | Separate catalog and datasheet approvals; no automatic deletion of similar images. |
| ADR-009 | Keep document identity separate from templates and product data | Approved | Published versions are immutable. |
| ADR-010 | Preserve issued PDFs and store issue snapshots | Approved | Original retrieval differs from re-generation from snapshot. |
| ADR-011 | Use GitHub as the source-control and documentation center | Approved | Repository currently public by user choice; never commit secrets or confidential source files. |
| ADR-012 | Do not directly import unreviewed legacy records | Approved | Legacy data must pass staging, validation, and explicit approval. |
| ADR-013 | Use output labels Digital PDF / Print-oriented PDF / Print-ready PDF accurately | Approved | Print-ready requires actual printer specifications and validation. |
| ADR-014 | Finalize exact schema and worker integration before production implementation | Approved | Current stage remains architecture and schema review. |

## Open decisions
- ADR-015: Python worker hosting provider and runtime.
- ADR-016: Apps Script-to-worker authentication and job protocol.
- ADR-017: OCR/extraction stack and optional AI provider after benchmark.
- ADR-018: Document version pinning precedence in all edge cases.
- ADR-019: Exact table columns, constraints, and validation rules.
- ADR-020: PDF renderer, font embedding strategy, and external print workflow.
- ADR-021: Backup, restore, retention, and disaster recovery.

## Change procedure
Add a new ADR or update an existing entry only with:
- Context and problem.
- Options considered.
- Decision and rationale.
- Consequences and migration/rollback impact.
- Approval status and date.
