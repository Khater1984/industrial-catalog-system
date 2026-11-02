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


## Proposed schema corrections — 2026-11-03

The user approved continuing the design correction work. The following are **proposed schema decisions**, not yet approved for production implementation. See [SCHEMA_V2_PROPOSAL.md](SCHEMA_V2_PROPOSAL.md).

| ID | Proposed decision | Status | Rationale |
|---|---|---|---|
| ADR-022 | Separate canonical Products/Variants from Product_Source_Records/Variant_Source_Records | Proposed | Preserve multiple catalog/revision appearances without overwriting provenance or auto-merging identities. |
| ADR-023 | Use a per-logical-key append-only specification event stream with monotonic Sequence_No and deterministic reducer | Proposed | Remove ambiguity from ADD/UPDATE/DELETE ordering; source assertions remain immutable. |
| ADR-024 | Freeze binary asset records and add explicit immutable Paper_Versions | Proposed | Make published designs and historical PDFs reproducible. |
| ADR-025 | Add Logical_Job_ID, Parent_Run_ID, Attempt_Number, many-to-many review links, and hash-bound approvals | Proposed | Make retries and review/promotion safe and auditable. |
| ADR-026 | Require polymorphic target validation, hash manifests, integrity scans, and report-first recovery | Proposed | Compensate for Google Sheets' lack of native FK/transactions/immutable append-only guarantees. |
| ADR-027 | Add non-secret System_Config registry and define a Sheets volume/backup gate | Proposed | Keep configuration controlled and prevent unmeasured scale assumptions. |

No live resources or application code were created by these proposals. The ADRs become Approved only after the consolidated schema and acceptance suite are reviewed and the user explicitly approves implementation.