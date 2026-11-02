# Data Model Overview — V2.1

**Status:** Conceptual map of the proposed schema. Exact columns and constraints remain in the four domain schema files.

## 1. Supplier source to canonical identity

```mermaid
flowchart LR
  C[Catalog revision] --> CP[Catalog pages]
  C --> PSR[Product source records]
  CP --> PSR
  P[Canonical Product] --> PSR
  PSR --> VSR[Variant source records]
  V[Canonical Variant] --> VSR
  P --> V
  PSR --> S[Immutable source specifications]
  VSR --> S
  SP[Staging products] --> IMD[Human identity decision]
  SV[Staging variants] --> IMD
  SS[Staging specifications] --> RV[Review and approval]
  IMD --> PSR
  IMD --> VSR
  RV --> S
```

**Interpretation**
- Catalog and page records identify source evidence.
- Product and Variant rows are canonical internal identities.
- Source records capture each appearance of those identities in a particular supplier catalog revision.
- Specifications point to the exact source occurrence; raw supplier strings are never replaced by normalized values.
- A match decision is required before creating production source records.
- Canonical merge/reparent is excluded from the initial release.

## 2. Workflow and controlled promotion

```mermaid
flowchart TD
  A[Register original catalog] --> B[Create logical job and run attempt]
  B --> C[Create page Run_Units]
  C --> D[Extract and fingerprint evidence]
  D --> E[Typed staging records]
  E --> F[Review_Queue and staging links]
  F --> G{Review decision valid and hashes match?}
  G -- No --> H[STALE / DEFER / REJECT]
  H --> F
  G -- Yes --> I[Prepare Promotion_Operation]
  I --> J[Write canonical entities and source assertions]
  J --> K[Write Promotion_Mappings and Audit_Log]
  K --> L{Reconciliation complete?}
  L -- No --> M[IN_DOUBT / quarantine]
  M --> K
  L -- Yes --> N[Promotion completed]
```

The worker returns manifests and artifacts; the Apps Script boundary validates them and owns production Sheets writes. Multi-sheet writes are recoverable operations, not assumed transactions.

## 3. Document and image evidence

```mermaid
flowchart LR
  D[Logical Document] --> DV[Document Versions]
  DV --> DL[Document links]
  P[Product] --> DL
  V[Variant] --> DL
  IA[Image original] --> IR[Image renditions]
  IR --> IL[Image links]
  P --> IL
  V --> IL
  C[Catalog page] --> IA
  PSR[Product source record] --> IA
  VSR[Variant source record] --> IA
  DV --> IA
```

Document versions retain their own file hash and source provenance. Image originals and renditions have separate immutable IDs and hashes. Product/variant target links are polymorphic and must be validated by a shared resolver.

## 4. Design and issue dependency graph

```mermaid
flowchart TD
  DA[Design assets] --> BA[Brand assets]
  DA --> PV[Paper versions]
  DA --> WM[Watermark presets]
  B[Brand] --> BV[Brand versions]
  BA --> BV
  T[Template] --> TV[Template versions]
  B --> TL[Template identity links]
  T --> TL
  P[Paper] --> PV
  EP[Export profile] --> IO[Issue operation]
  BV --> IO
  TV --> IO
  PV --> IO
  WM --> IO
  S[Resolved product/variant snapshot] --> IO
  IR[Approved image renditions] --> IO
  IO --> ID[Final issued document]
  ID --> ITEMS[Issued document items]
```

A final issue is created only after the Issue_Operation completes, the dependency manifest validates, and all Issued_Document_Items reconcile. The exact Paper_Version_ID, design assets, image renditions, data snapshot, renderer fingerprints, preflight report, and final PDF hash are pinned.

## 5. Relationship patterns that require application validation

| Pattern | Validation |
|---|---|
| Canonical Product → Variant | Variant.Product_ID must resolve to one Product. |
| Product_Source_Record → Catalog/Page | Page must belong to the same Catalog revision. |
| Variant_Source_Record → Product_Source_Record | Variant must belong to the canonical Product resolved by the parent source record. |
| Specification → source record | Exactly one source-record FK is populated according to Scope; Product/Variant ownership must match. |
| Review_Staging_Links | Staging_ID must resolve to exactly one typed staging row. |
| Identity_Match_Decisions | Source_Staging_Type/ID and candidate/result canonical ID must resolve to the declared types. |
| Promotion_Mappings | Staging and production polymorphic references must resolve to the declared types. |
| Document_Links / Image_Links | Target type, target ID, ownership, lifecycle, and version/rendition pin must validate. |
| Issued_Document_Items | Variant, if present, must belong to the row's Product_ID. |
| Issue_Operations | Source_Issued_Document_ID, when used for reproduction, must reference a prior completed issue. |

Google Sheets does not enforce these relationships natively. The application validators and integrity scanner are mandatory parts of the design.
