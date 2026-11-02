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
- ADR-019: Final acceptance of the consolidated V2.1 schema and 40-scenario acceptance suite (detailed candidate is documented; explicit approval remains pending).
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

## Additional V2.1 proposals — 2026-11-03

| ID | Proposed decision | Status | Rationale |
|---|---|---|---|
| ADR-028 | Keep Catalog_Pages immutable and track processing in Run_Units | Proposed | Prevent retries/new extraction versions from overwriting page artifacts or status. |
| ADR-029 | Separate Image_Assets originals from immutable Image_Renditions | Proposed | Preserve originals and pin exact preview/high-quality renditions. |
| ADR-030 | Introduce shared immutable Design_Assets registry | Proposed | Give brand, font, paper texture, and watermark assets stable IDs and checksums. |
| ADR-031 | Add Promotion_Operations and Promotion_Mappings | Proposed | Recover partial multi-sheet promotion without blind replay or duplicate records. |
| ADR-032 | Add Issue_Operations and Issued_Document_Items | Proposed | Recover issue transactions and query membership of multi-product PDFs. |
| ADR-033 | Bind review decisions to ordered staging-set manifests and hashes | Proposed | Support multiple staging records per review and stale approval invalidation. |
| ADR-034 | Add canonical Product_Name_EN and Model_Name_EN company labels | Proposed | Separate internal display labels from exact supplier wording. |

These proposals are documented in the domain schema and technical design files. They remain Proposed until the consolidated schema, API/security contracts, acceptance suite, and operational gates are explicitly approved.


| ADR-035 | Exclude canonical Product/Variant merge and reparent workflows from the initial release | Proposed | Avoid exposing MERGED states without a fully tested child-mapping, rollback, and historical-reference protocol. |
| ADR-036 | Separate immutable Catalog_Pages from per-run Run_Units checkpoints and worker leases | Proposed | Preserve page identity and extraction artifacts across retries and parser versions. |
| ADR-037 | Separate issue-request idempotency key from content input fingerprint | Proposed | Allow an intentional new issue of identical content while making retries of one request idempotent. |

| ADR-038 | Maintain one centralized enum registry alongside domain schemas | Proposed | Keep stored tokens consistent across Apps Script, frontend, worker, and acceptance tests. |

| ADR-039 | Treat PRINT_READY_PDF as a printer-validated output class, not a DPI preset | Proposed | Require pinned printer specs, ICC profile asset, trim/bleed rules, and conformance verification before using the label. |
