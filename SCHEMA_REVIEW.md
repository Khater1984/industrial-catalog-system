# Schema Engineering Review — Findings & Required Resolutions

**Review status:** First-pass engineering audit completed against the schema package, project rules, architecture, roadmap, and ADR log.
**Date:** 2026-11-03
**Implementation status:** Not authorized. This report proposes corrections; it does not approve architecture changes or create live data resources.

## Executive result

The detailed schema is a useful baseline, but it is **not ready for approval or implementation**. The review found design gaps that could create duplicate identities, ambiguous effective data, or incomplete audit/recovery behavior.

- **Critical:** product/model identity is coupled to one supplier catalog even though the system must retain multiple source appearances over time and across suppliers.
- **High:** deterministic specification change resolution, immutable design dependencies, explicit version/retry lineage, and review of staging records with multiple decisions.
- **Operational:** Google Sheets cannot enforce relational constraints or atomic multi-sheet transactions. The schema must be paired with an explicit integrity and recovery protocol.

No live Google Sheets, Drive folders, application code, or legacy migration were created.

## Findings

> The following SR-001–SR-014 descriptions record the initial baseline defects as found during the first-pass review. Their current dispositions are summarized in the V2 and V2.1 sections below; do not read the historical 'Current design' descriptions as the latest schema state.

### SR-001 — Canonical product identity is coupled to a single catalog
**Severity: BLOCKER**

**Current design:** Products contains Source_Catalog_ID, source name, source page, and source extraction provenance. The document says the same product may be sourced from multiple catalogs, but no table records those additional source assertions. Variants has the same issue.

**Failure scenario:** A supplier republishes the same machine in a revised catalog, or a second supplier/distributor catalog describes the same product/model. The system must either create a duplicate Product, overwrite the first source provenance, or attach new source evidence to the wrong source record.

**Recommended resolution — separate canonical entities from source assertions:**
- Keep Products as the canonical internal product identity (stable Product_ID, lifecycle/status, and company-owned identity linkage only).
- Keep Variants as canonical model/configuration identities with one Product_ID.
- Add Product_Source_Records: one row per appearance/assertion of a product in a specific source catalog/revision, with Product_Source_Record_ID, Product_ID, Catalog_ID, source name/reference, page/section/quote, extraction run/record IDs, and review status.
- Add Variant_Source_Records: one row per appearance/assertion of a variant in a specific source catalog/revision, with Variant_Source_Record_ID, Variant_ID, Product_Source_Record_ID, source model number/name, source location, extraction provenance, and review status.
- Make source specifications reference the exact source assertion IDs as well as canonical product/variant IDs used for resolution.
- Require human-approved matching before two source assertions can be associated with one canonical product or variant.

**Disposition:** the user approved proceeding with this correction. The canonical-entity/source-assertion model is documented in SCHEMA_V2_PROPOSAL.md and schema/01-source-and-products.md; final schema acceptance remains open.

### SR-002 — Specification change ordering is not fully deterministic
**Severity: BLOCKER**

**Current design:** Specification_Changes has Effective_Order, Change_Status, and Supersedes_Change_ID, but the rule says “latest approved applicable operation” while also rejecting ambiguous active operations. It does not fully define the target identity for an ADD operation or how multiple sequential UPDATE/DELETE/ADD operations are folded.

**Risk:** Different application code paths could produce different Effective Specifications from the same ledger.

**Required resolution:**
1. Define a stable logical target key for source-backed specifications (the source Specification_ID) and company-added specifications (the ADD operation's own stable ID).
2. Define whether each new approved operation supersedes the immediately previous approved operation for that logical target, or whether operations form an ordered event stream.
3. Define deterministic ordering by server-assigned sequence plus timestamp/ID tie-breaker; never rely on sheet row order.
4. Define allowed transitions: source value → UPDATE → UPDATE; source value → DELETE; ADD → UPDATE → DELETE; and whether DELETE can be reversed.
5. Enforce one unambiguous effective state per logical target.
6. Add acceptance examples with expected output for each sequence.

**Recommendation:** use an append-only operation/event ledger with explicit Logical_Specification_Key, monotonic per-key sequence, and a deterministic reducer. Keep source Specifications immutable.

### SR-003 — Source specification provenance needs a stable source-assertion reference
**Severity: HIGH; dependent on SR-001**

Specifications.Catalog_ID plus Product_ID/Variant_ID does not fully express which catalog occurrence supplied a row when the same canonical product appears multiple times.

**Resolution:** after SR-001, add the exact source assertion IDs to each specification row. Keep page, section, quote, and extraction provenance. A catalog ID alone is not a sufficient provenance key.

### SR-004 — Published design versions do not fully freeze every referenced dependency
**Severity: HIGH**

**Current design:** Brand and template versions are immutable config files, but Brand_Assets and Papers are mutable-looking logical rows. Issued_Documents stores Paper_ID and a full snapshot, but no explicit paper version ID. Asset references inside a design config may resolve to an asset record whose file pointer later changes unless that record is immutable.

**Risk:** A published design may render differently later even when its version ID is unchanged.

**Required resolution:**
- Treat every binary asset record as immutable once referenced by a published brand/template version; replacement creates a new asset record with a new checksum.
- Ensure published config pins exact asset IDs and file checksums, not only logical names.
- Either add Paper_Versions with immutable config/checksum, or make the complete paper configuration and texture checksum part of the immutable issue snapshot and formally state that the snapshot—not a mutable Paper row—is the historical authority.
- At issue time, snapshot resolved font files/checksums, logo/graphic files/checksums, paper settings/texture checksum, watermark settings/assets, template config, and export settings.

**Disposition:** the correction pass selects explicit Paper_Versions. The full paper configuration and referenced asset checksums are also pinned in each issue snapshot.

### SR-005 — Run retry lineage is incomplete
**Severity: HIGH**

Run_Log.Idempotency_Key is unique and retries are described as new runs, but there is no Parent_Run_ID or Retry_Of_Run_ID.

**Risk:** The UI and audit trail cannot reliably show which failed run a retry continues, or distinguish a new logical job from a retry attempt.

**Resolution:** add nullable Parent_Run_ID (self-FK) and Retry_Reason; retain a new unique idempotency key per attempt while preserving a stable Logical_Job_ID across attempts. Define which outputs are reused and how committed page units are detected.

### SR-006 — A staging record can require more than one review, but the relationship is singular
**Severity: HIGH**

Each staging row has one Review_Queue_ID, while review queues can group multiple staging records.

**Risk:** One extracted record may require separate identity, specification, and image-quality decisions. A single FK cannot represent that cleanly, and overwriting it loses prior review linkage.

**Resolution:** remove the singular Review_Queue_ID from the staging envelope and add Review_Staging_Links (Review_Staging_Link_ID, Review_Queue_ID, Staging_ID, Role, Created_At). Keep review decisions immutable and tied to the exact staging record/version reviewed.

### SR-007 — Review decisions are not sufficiently structured for safe promotion
**Severity: HIGH**

Decision_JSON_File_ID and free-text notes hold the decision, but there is no required decision schema or checksum/version of the staged payload reviewed.

**Risk:** A staging row could be edited after approval, while promotion uses different values from those the reviewer saw.

**Resolution:**
- Store a Staging_Record_Hash or immutable staging payload version/checksum at review time.
- Store Reviewed_Payload_Hash in the decision.
- Promotion compares the current staging hash with the approved hash; mismatch invalidates approval and reopens review.
- Structured decisions identify exact accepted/rejected IDs, selected candidate IDs, field-level corrections, actor, timestamp, and reason.

### SR-008 — Polymorphic target references need an explicit FK validation contract
**Severity: HIGH**

Document_Links and Image_Links use Target_Type + Target_ID rather than a conventional FK.

**Risk:** A link can point to a nonexistent Product or Variant, or a target type can be changed without validating ownership.

**Resolution:** define a central resolveTarget(Target_Type, Target_ID) validation contract and require it on every create/update/import. Validate target existence, lifecycle, and ownership. Add an integrity scan for orphan links. This is application-enforced, not a native Sheets FK.

### SR-009 — Document current-version pointer creates a circular write dependency
**Severity: MEDIUM**

Documents.Current_Version_ID points to Document_Versions, while every Document_Versions row points back to Documents.

**Risk:** Initial creation cannot satisfy both references in one ordinary sequential insert.

**Resolution:** define a two-step creation protocol under a lock: create Documents with a blank current pointer; create the first immutable Document_Versions row; validate same Doc_ID; then set Current_Version_ID and audit the pointer change. Do not expose the document as active/issuable until complete. Use the same protocol for rollback.

### SR-010 — Duplicate and asset redirect rules need cycle prevention
**Severity: MEDIUM**

Image_Assets.Duplicate_Of_Image_ID allows a self-reference but does not explicitly prevent cycles or chains ending at archived/quarantined assets.

**Resolution:** canonicalization resolves to one terminal canonical asset; reject self-reference and cycles; preserve historical asset records; redirect active links only through audited operations; do not redirect to an invalid/quarantined terminal asset without explicit override.

### SR-011 — Sheets schema lacks an explicit system/configuration registry
**Severity: MEDIUM**

The package defines data sheets but not a controlled registry for schema version, spreadsheet ID, Drive folder IDs, environment, feature flags, and initialization/migration state.

**Resolution:** add a small System_Config / Schema_Metadata sheet with key, value/type, schema version, environment identifier, timestamps, and secret policy. Store only non-secret IDs/configuration. Credentials and tokens remain in Script Properties or an approved secret store, never in Sheets or GitHub.

### SR-012 — Data volume and Sheets operational limits have no acceptance thresholds
**Severity: MEDIUM**

The package acknowledges Sheets limitations but does not define expected catalog sizes, row counts, concurrent operations, batch sizes, quotas, or response-time targets.

**Resolution:** create a volume profile from representative supplier catalogs. Test row counts and worst-case relationships, Drive file sizes, extraction duration, Sheets quotas, lock contention, and PDF job polling. Define a threshold at which Sheets is no longer acceptable and an ADR is required.

### SR-013 — Company product brand and document brand are conflated by a free-text field
**Severity: LOW / CLARIFICATION**

Product_Company.Brand_Label is a free-text display label while Brands represent document identity. These are different concepts.

**Resolution:** rename the product field to Manufacturer_or_Product_Brand_Label, or create a controlled Product_Brands registry if filtering/reporting requires it. State explicitly that it is not a FK to document Brands.

### SR-014 — Audit and issue snapshots need explicit hashes for all referenced manifests
**Severity: MEDIUM**

Some Drive artifacts have hashes while others are represented only by file IDs. A Drive file ID identifies a file but does not prove its content remained unchanged.

**Resolution:** store SHA-256 alongside immutable JSON manifests, review decision payloads, font manifests, preflight reports, and every external configuration artifact whose exact bytes affect an issued output. Verify hashes before use.

## Cross-domain acceptance scenarios required

1. Same product appears in two revisions of one supplier catalog.
2. Same canonical product appears in two different supplier catalogs with different source wording.
3. A model number changes in a new supplier catalog while the company considers it the same Variant.
4. One catalog lists product-wide specs while another lists model-specific specs.
5. Two sequential UPDATE operations target one source specification.
6. ADD then UPDATE then DELETE targets a company-created specification.
7. A variant inherits a product attribute, overrides it, intentionally empties it, then removes the override.
8. A product document is inherited, excluded for one variant, and separately included directly on that variant.
9. A direct variant document pin conflicts with the inherited product pin.
10. A staging record receives two independent reviews; it changes after approval but before promotion.
11. A worker fails after writing some pages and is retried; no duplicate source or production records result.
12. A published brand version references an image/font/paper asset that is later replaced.
13. An image duplicate chain is proposed that would create a cycle.
14. A PDF is issued, then source data, company overrides, brand, template, and paper are changed; original PDF remains byte-identical.
15. A Print-ready profile is attempted without printer-specific PDF/X/color/bleed requirements; issuance must be blocked or relabeled.

## Required order of resolution

| Order | Item | Gate |
|---:|---|---|
| 1 | SR-001 canonical identity vs source assertions | Decide before product schema is frozen |
| 2 | SR-002 specification operation reducer | Define before implementation |
| 3 | SR-004 immutable design dependencies and paper versioning | Define before design schema approval |
| 4 | SR-005 retry lineage and SR-006/007 review linkage/hash | Define before worker implementation |
| 5 | SR-008/009/010/014 integrity protocols | Specify before data-access implementation |
| 6 | SR-011/012 system config and volume benchmark | Complete before production setup |
| 7 | SR-013 naming clarification | Can be resolved during schema cleanup |

## Current recommendation

Do not approve or implement the schema yet. Resolve the four primary design decisions and update the domain documents, then run the 15 acceptance scenarios against the revised model. After that, issue a schema candidate version and request explicit approval.

This is an engineering review of repository documents, not a claim that the application or data layer has been implemented or tested.


## V2 correction pass — disposition (2026-11-03)

The user approved continuing the correction work. The proposed resolutions have now been written to [SCHEMA_V2_PROPOSAL.md](SCHEMA_V2_PROPOSAL.md) and propagated into the relevant domain documents. This changes the status of the findings from "unresolved recommendation" to "documented proposal", not to production-approved design.

| Finding | V2 treatment | Current status |
|---|---|---|
| SR-001 / SR-003 | Canonical Products/Variants separated from Product_Source_Records/Variant_Source_Records; Specifications point to exact source assertions; human matching ledger added. | Addressed in proposal; acceptance pending |
| SR-002 | Logical_Specification_Key, approval-time monotonic Sequence_No, append-only events, deterministic reducer and invalid-transition quarantine. | Addressed in proposal; acceptance pending |
| SR-004 | Immutable asset records/manifests and explicit Paper_Versions; issue snapshots pin IDs and hashes. | Addressed in proposal/domain docs; acceptance pending |
| SR-005 | Logical_Job_ID, Parent_Run_ID, Attempt_Number and per-attempt idempotency key. | Addressed in workflow doc; acceptance pending |
| SR-006 / SR-007 | Review_Staging_Links many-to-many relation and hash-bound review decisions. | Addressed in workflow doc; acceptance pending |
| SR-008 / SR-009 / SR-010 | Shared polymorphic target resolver, two-step document version creation, image redirect cycle prevention. | Addressed in proposal/domain docs; acceptance pending |
| SR-011 / SR-014 | System_Config non-secret registry and SHA256 manifests for immutable artifacts. | Addressed in proposal/workflow; acceptance pending |
| SR-012 | Sheets volume benchmark and migration trigger required before production. | Defined as a gate; benchmark not yet run |
| SR-013 | Rename Brand_Label to Manufacturer_or_Product_Brand_Label. | Proposed; final consolidation pending |

### Remaining work before schema approval
1. Consolidate the proposed changes into one internally consistent version of all four domain schemas; remove any superseded wording and update the table inventory.
2. Run a cross-document consistency audit (table names, fields, FKs, enum values, and acceptance tests).
3. Define measured catalog-volume limits, backup cadence, RPO/RTO, worker hosting, and authentication protocol.
4. Obtain explicit approval of the consolidated schema and acceptance suite.

No Sheets, Drive folders, application code, worker code, or legacy migration were created. The 48 acceptance scenarios are design-level tests, not yet executable tests.

## V2.1 engineering pass — 2026-11-03

A second pass extended the corrections beyond the original SR findings. The following controls are now represented in the domain documents:

| Area | Correction | Disposition |
|---|---|---|
| Source occurrence identity | Stable Product_Source_Record, Variant_Source_Record, and Source_Assertion keys; deterministic reprocessing. | Documented; acceptance pending |
| Page/run separation | Catalog_Pages is immutable page identity; Run_Units stores per-run checkpoint and artifacts. | Documented; acceptance pending |
| Canonical company labels | Product_Name_EN and Model_Name_EN separated from supplier source strings. | Documented |
| Image pipeline | Immutable Image_Assets original + immutable Image_Renditions with pipeline and content hashes. | Documented; acceptance pending |
| Design assets | Shared immutable Design_Assets registry; Brand_Assets are role associations. | Documented; acceptance pending |
| Review set integrity | Review_Staging_Links is authoritative; ordered staging-set manifest and hash bind approval. | Documented; acceptance pending |
| Promotion recovery | Promotion_Operations and Promotion_Mappings define multi-sheet reconciliation. | Documented; acceptance pending |
| Issue recovery | Issue_Operations, Issued_Document_Items, Paper_Version_ID, and dependency manifest are required. | Documented; acceptance pending |
| Document lifecycle | DRAFT → ACTIVE two-step first-version protocol now matches the schema enum. | Documented; acceptance pending |
| Staging state | Approval lives in Review_Queue; staging no longer duplicates an APPROVED state; stale reviews are explicit. | Documented; acceptance pending |

### Remaining release blockers

See [SCHEMA_CONSISTENCY_AUDIT.md](SCHEMA_CONSISTENCY_AUDIT.md) for the completed static documentation audit (52 unique tables, 96 explicit FK declarations, no duplicate fields, and 31 local links).

1. **Cross-document schema audit:** static structure is complete (52/52 tables, 87/96 explicit FK declarations resolve, no duplicate fields, inventory parity, 31/31 local links). Remaining work is semantic validation of ownership constraints, enum/state transitions, and approval/recovery behavior against executable tests.
2. **Operational sizing:** no representative private catalog benchmark has been run. Sheets row limits, quotas, latency, concurrency, and migration thresholds remain unmeasured.
3. **Worker integration:** hosting, job queue/lease behavior, Drive access, and signed callback protocol remain open.
4. **PDF toolchain:** renderer, OCR stack, font licensing/embedding, and printer-specific requirements remain open.
5. **Backup/recovery:** RPO/RTO, backup cadence, retention, and restore rehearsal remain open.
6. **Acceptance execution:** SAT-001–SAT-040 are design-level scenarios only; no automated or live integration tests have run.

### Current assessment

The major schema design gaps identified in SR-001–SR-014 have documented resolutions. This does **not** mean the schema is approved or operationally proven. The next gate is final semantic review of the schema plus API, worker, security, and operations contracts, followed by private benchmark design and explicit schema approval. No production Sheets, Drive changes, application code, worker deployment, or legacy migration has been performed.
