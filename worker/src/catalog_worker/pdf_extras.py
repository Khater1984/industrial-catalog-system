"""Optional layout helpers for the PDF renderer."""
from __future__ import annotations
from typing import Any
from reportlab.platypus import Spacer, Paragraph, PageBreak
from reportlab.lib.units import mm

def build_section_divider(title: str, styles: dict, arabic_fn) -> list[Any]:
    flow = [PageBreak(), Spacer(1, 30 * mm)]
    flow.append(Paragraph(arabic_fn(title), styles.get("Family") or styles["Section"]))
    flow.append(Spacer(1, 10 * mm))
    return flow

def contact_line_with_symbols(contact: dict[str, Any]) -> str:
    parts = []
    if contact.get("phone"):
        parts.append(f"☎ {contact['phone']}")
    if contact.get("email"):
        parts.append(f"✉ {contact['email']}")
    if contact.get("website"):
        parts.append(f"🌐 {contact['website']}")
    return "  ·  ".join(parts)
