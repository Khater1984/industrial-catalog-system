# Phase 6 Acceptance Tests

## Automated (worker)
| Test | Expected | Status |
|------|----------|--------|
| Technical datasheet PDF | Valid %PDF-, page_count >= 1 | Pass (existing + new) |
| Product catalog multi-item | page_count >= 2 | Pass |
| Master catalog | page_count >= 2 | Pass |
| Arabic text | No crash, PDF created | Pass |
| PRINT_READY blocked | PDFRenderError | Pass |
| Empty scope | PDFRenderError | Pass |
| Snapshot file round-trip | Matching SHA256 | Pass |

## Not Yet Automated
- Font embedding verification (requires licensed font files in CI)
- Image DPI block with real image
- Conflict (ADR-040) exclusion from final document
- Live Drive upload of PDF
- UI selection flow

## Manual Verification Steps
1. `cd worker && pytest tests/test_pdf_renderer.py tests/test_pdf_phase6.py -q`
2. Inspect generated PDF in tmp path for Arabic shaping and page breaks.
