# Schema Consistency Audit — V2.1

**Audit date:** 2026-11-03  
**Scope:** Static repository-document audit of the four domain schemas, schema inventory, cross-document links, and selected V2 integrity contracts.  
**Status:** Passed for the checks listed below; not a production or runtime certification.

## 1. Static audit results

| Check | Result | Evidence / interpretation |
|---|---:|---|
| Unique table definitions with explicit column grids | 52 / 52 | All unique domain tables have a structured column definition. Run_Log is referenced in Source & Products and defined in Workflow & Audit; it is one logical table. |
| Schema inventory matches domain definitions | 52 / 52 | No defined table is missing from DATABASE_SCHEMA.md; no inventory-only table remains. |
| Explicit FK declarations resolve to defined table names | 96 / 96 | Static FK target-name check only; it does not prove row-level ownership or data validity. |
| Duplicate field names within a table | 0 | No duplicate parsed column names found. |
| Local Markdown links | 33 / 33 | All checked relative links resolve to files in the repository. |
| Malformed literal line-break escapes in reviewed docs | 0 | Previously malformed table line breaks were repaired. |
| Acceptance scenarios | 48 | SAT-001 through SAT-048 are documented design-level tests, not executed software tests. |
| Enum registry | 79 fields | ENUM_REGISTRY.md indexes all 79 typed enum fields.

## 2. Confirmed structural coverage

The 52 unique tables cover:
- Catalog registry, page identity, canonical Products/Variants, source occurrence records, identity decisions, and immutable Specifications.
- Company-managed labels, product families, typed attributes, variant overrides, and the ordered specification change ledger.
- Shared documents, immutable document versions, target links, image originals, image renditions, image links, and duplicate review.
- Immutable design assets, brands and versions, papers and versions, templates and versions, watermark/status/contact/export settings, issue transactions, final issued documents, and multi-item issue membership.
- Run attempts, page/unit checkpoints, events, typed staging, review queue and links, promotion transactions/mappings, non-secret configuration, and audit history.

## 3. Critical invariants represented

1. Canonical Product/Variant identity is separate from supplier catalog appearances.
2. Source names, model numbers, specifications, page references, and quotes remain unchanged.
3. Cross-source identity matching requires a human decision bound to the exact staging hash.
4. Specification operations are append-only, sequenced per logical key, and reduced deterministically.
5. Catalog page identity is separate from per-run page processing/checkpoints.
6. Image originals, derived renditions, and design assets have separate immutable identities and checksums.
7. Review decisions are bound to an ordered staging-set manifest; stale approvals cannot authorize promotion.
8. Partial promotion and issue writes have deterministic operation envelopes and recovery mappings.
9. Final issues pin exact Paper_Version_ID, design versions, data scope, assets/renditions, renderer fingerprints, and file hashes.
10. Polymorphic document/image target links are validated by a shared resolver and periodic integrity scan.
11. Each document version retains its own supplier/manual/external provenance; versions never inherit or overwrite another version's source evidence.
12. PRINT_READY_PDF requires pinned printer specifications, ICC color profile, trim/bleed rules, and an approved conformance validator; DPI alone is insufficient.
13. Canonical Product/Variant merge and reparenting are excluded from the initial release.

## 4. Remaining limitations and open gates

This audit does not test:
- Google Sheets write locks, quotas, concurrency, or partial-write recovery.
- Actual FK ownership on records, state transitions, sequence allocation, or reducer outputs.
- Worker job protocol, authentication, file access, runtime limits, or costs.
- OCR/table extraction accuracy, AI cost, or PDF rendering quality.
- Font licensing/embedding, CMYK/PDF-X, printer-specific output, or byte-identical PDF regeneration.
- Backup completeness, restore objectives, or disaster recovery.

These require synthetic fixtures, a disposable test environment, representative private supplier catalogs, and executable tests.

## 5. Required next gate

1. Review the consolidated schema and 48 acceptance scenarios.
2. Resolve remaining design choices in API_CONTRACTS.md, WORKER_SPEC.md, and SECURITY_OPERATIONS.md.
3. Run private extraction and PDF-generation benchmarks.
4. Set measured capacity thresholds, backup cadence, RPO/RTO, and worker service objectives.
5. Obtain explicit approval before creating even a persistent DEV Sheets workbook or deploying a worker.

**Conclusion:** The documentation had a coherent V2.1 structural baseline with no detected table-inventory, duplicate-column, FK-name, or local-link defects in the static checks performed. This is a historical, documentation-only audit dated 2026-11-03; it does not inspect or certify application code, live Sheets/Drive resources, or runtime integration. Subsequent DEV code must be reviewed and tested separately.
