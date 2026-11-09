# Architecture Decisions Log

This file records decisions and their status. A proposal is not an approved decision until explicitly marked **Approved**. "Approved for DEV implementation" is limited to the isolated V2.1 development baseline and is not production authorization.

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
| ADR-014 | Finalize exact schema and worker integration before production implementation | Approved | Production implementation remains gated by infrastructure/security approvals. |
| ADR-019 | Final acceptance of the consolidated V2.1 schema and acceptance baseline | Approved for isolated DEV implementation (2026-11-03) | Explicit user approval of Schema V2.1 and table inventory is recorded in SCHEMA_APPROVAL_CHECKLIST.md and DATABASE_SCHEMA.md. The baseline has 48 design-level scenarios (not 40). No production deployment or live data migration is authorized. |
| ADR-022 | Separate canonical Products/Variants from Product_Source_Records/Variant_Source_Records | Approved for DEV schema implementation (2026-11-03) | Preserve multiple catalog/revision appearances without overwriting provenance or auto-merging identities. |
| ADR-023 | Use a per-logical-key append-only specification event stream with monotonic Sequence_No and deterministic reducer | Approved for DEV schema implementation (2026-11-03) | Remove ambiguity from ADD/UPDATE/DELETE ordering; source assertions remain immutable. |
| ADR-024 | Freeze binary asset records and add explicit immutable Paper_Versions | Approved for DEV schema implementation (2026-11-03) | Make published designs and historical PDFs reproducible. |
| ADR-025 | Add Logical_Job_ID, Parent_Run_ID, Attempt_Number, many-to-many review links, and hash-bound approvals | Approved for DEV schema implementation (2026-11-03) | Make retries and review/promotion safe and auditable. |
| ADR-026 | Require polymorphic target validation, hash manifests, integrity scans, and report-first recovery | Approved for DEV schema implementation (2026-11-03) | Compensate for Google Sheets' lack of native FK/transactions/immutable append-only guarantees. |
| ADR-027 | Add non-secret System_Config registry and define a Sheets volume/backup gate | Approved for DEV schema implementation (2026-11-03) | Keep configuration controlled and prevent unmeasured scale assumptions. |
| ADR-028 | Keep Catalog_Pages immutable and track processing in Run_Units | Approved for DEV schema implementation (2026-11-03) | Prevent retries/new extraction versions from overwriting page artifacts or status. |
| ADR-029 | Separate Image_Assets originals from immutable Image_Renditions | Approved for DEV schema implementation (2026-11-03) | Preserve originals and pin exact preview/high-quality renditions. |
| ADR-030 | Introduce shared immutable Design_Assets registry | Approved for DEV schema implementation (2026-11-03) | Give brand, font, paper texture, and watermark assets stable IDs and checksums. |
| ADR-031 | Add Promotion_Operations and Promotion_Mappings | Approved for DEV schema implementation (2026-11-03) | Recover partial multi-sheet promotion without blind replay or duplicate records. |
| ADR-032 | Add Issue_Operations and Issued_Document_Items | Approved for DEV schema implementation (2026-11-03) | Recover issue transactions and query membership of multi-product PDFs. |
| ADR-033 | Bind review decisions to ordered staging-set manifests and hashes | Approved for DEV schema implementation (2026-11-03) | Support multiple staging records per review and stale approval invalidation. |
| ADR-034 | Add canonical Product_Name_EN and Model_Name_EN company labels | Approved for DEV schema implementation (2026-11-03) | Separate internal display labels from exact supplier wording. |
| ADR-035 | Exclude canonical Product/Variant merge and reparent workflows from the initial release | Approved for DEV schema implementation (2026-11-03) | Avoid exposing MERGED states without a fully tested child-mapping, rollback, and historical-reference protocol. |
| ADR-036 | Separate immutable Catalog_Pages from per-run Run_Units checkpoints and worker leases | Approved for DEV schema implementation (2026-11-03) | Preserve page identity and extraction artifacts across retries and parser versions. |
| ADR-037 | Separate issue-request idempotency key from content input fingerprint | Approved for DEV schema implementation (2026-11-03) | Allow an intentional new issue of identical content while making retries of one request idempotent. |
| ADR-038 | Maintain one centralized enum registry alongside domain schemas | Approved for DEV schema implementation (2026-11-03) | Keep stored tokens consistent across Apps Script, frontend, worker, and acceptance tests. |
| ADR-039 | Treat PRINT_READY_PDF as a printer-validated output class, not a DPI preset | Approved for DEV schema implementation (2026-11-03) | Require pinned printer specs, ICC profile asset, trim/bleed rules, and conformance verification before using the label. |
| ADR-040 | Do not apply implicit precedence between product-scope and variant-scope source specifications; preserve both and surface normalized-key conflicts | Approved for isolated DEV implementation (2026-11-09) | Avoid silent data loss or guessed precedence. Any future precedence rule requires a separate explicit decision. |

## Open decisions

- ADR-015: Python worker hosting provider and runtime.
- ADR-016: Apps Script-to-worker authentication and job protocol.
- ADR-017: OCR/extraction stack and optional AI provider after benchmark.
- ADR-018: Document version pinning precedence in all edge cases.
- ADR-020: PDF renderer, font embedding strategy, and external print workflow.
- ADR-021: Backup, restore, retention, and disaster recovery.

These open decisions do not block isolated DEV implementation of the Product/Variant domain engine because that slice uses the approved Sheets schema and Apps Script boundary only. They remain gates for the affected worker, document, PDF, and production operations.

## Approval scope

The 2026-11-03 approval covers the V2.1 schema/table inventory as the basis for isolated DEV implementation. It does not authorize production resources, production data migration, worker hosting or credentials, or production deployment. The static schema audit and 48 acceptance scenarios are design evidence; each implementation must still pass automated tests, and live Sheets integration must be verified separately.

## Change procedure

Add a new ADR or update an existing one only with:
- Context and problem.
- Options considered.
- Decision and rationale.
- Consequences and migration/rollback impact.
- Approval status and date.
