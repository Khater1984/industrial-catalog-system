"""Deterministic offline PDF renderer for immutable issue snapshots.

Additional features (pre-schema):
- Image watermark support
- Texture opacity control
- Dedicated cover page
- Optional hard block on FINAL + conflicts
- Improved header with company name
"""
from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from PIL import Image as PILImage
from pypdf import PdfReader
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4, A3, LETTER, landscape, portrait
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Frame, Image, PageTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether,
)

SUPPORTED_TYPES = {"TECHNICAL_DATASHEET", "PRODUCT_CATALOG", "MASTER_CATALOG", "COMPANY_PROFILE"}
PAGE_SIZES = {"A4": A4, "A3": A3, "LETTER": LETTER}


class PDFRenderError(ValueError):
    """Raised when an issue snapshot cannot be rendered safely."""


def _sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _hex_color(value: Any, fallback: str) -> colors.Color:
    text = str(value or fallback).strip()
    if not text.startswith("#") or len(text) not in (4, 7):
        text = fallback
    try:
        return colors.HexColor(text)
    except Exception:
        return colors.HexColor(fallback)


def _safe_asset(path_value: Any, asset_root: Path | None) -> Path | None:
    if not path_value:
        return None
    candidate = Path(str(path_value)).expanduser().resolve()
    if asset_root is not None:
        root = asset_root.resolve()
        if candidate != root and root not in candidate.parents:
            raise PDFRenderError("ASSET_PATH_OUTSIDE_ROOT")
    if not candidate.is_file():
        raise PDFRenderError("ASSET_FILE_NOT_FOUND")
    return candidate


def _arabic(text: Any) -> str:
    value = str(text if text is not None else "")
    if not any("\u0600" <= ch <= "\u06ff" for ch in value):
        return value
    try:
        import arabic_reshaper
        from bidi.algorithm import get_display
        return get_display(arabic_reshaper.reshape(value))
    except ImportError as exc:
        raise PDFRenderError("ARABIC_SHAPING_DEPENDENCIES_MISSING") from exc


def _register_fonts(fonts: dict[str, Any], asset_root: Path | None) -> tuple[str, str, list[str]]:
    warnings: list[str] = []
    regular = "Helvetica"
    bold = "Helvetica-Bold"
    regular_path = _safe_asset(fonts.get("regular"), asset_root)
    bold_path = _safe_asset(fonts.get("bold"), asset_root)

    # Prefer a locally installed Unicode font with Arabic glyph coverage.
    if regular_path is None:
        for candidate in (
            Path("/usr/share/fonts/truetype/noto/NotoSansArabic-Regular.ttf"),
            Path("/usr/share/fonts/truetype/noto/NotoNaskhArabic-Regular.ttf"),
            Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
        ):
            if candidate.is_file():
                regular_path = candidate
                break
    if bold_path is None:
        for candidate in (
            Path("/usr/share/fonts/truetype/noto/NotoSansArabic-Bold.ttf"),
            Path("/usr/share/fonts/truetype/noto/NotoNaskhArabic-Bold.ttf"),
            Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
        ):
            if candidate.is_file():
                bold_path = candidate
                break
        if bold_path is None:
            bold_path = regular_path

    if regular_path:
        try:
            pdfmetrics.registerFont(TTFont("CatalogArabic", str(regular_path), subfontIndex=0))
            regular = "CatalogArabic"
        except Exception as exc:
            raise PDFRenderError("FONT_REGISTRATION_FAILED") from exc
    else:
        warnings.append("No Unicode font with Arabic glyph coverage found; install Noto Sans Arabic or DejaVu Sans.")

    if bold_path:
        try:
            pdfmetrics.registerFont(TTFont("CatalogArabic-Bold", str(bold_path), subfontIndex=0))
            bold = "CatalogArabic-Bold"
        except Exception as exc:
            raise PDFRenderError("FONT_REGISTRATION_FAILED") from exc
    elif regular_path:
        bold = regular
    else:
        warnings.append("Built-in Helvetica fallback used; Arabic glyph coverage is not guaranteed.")
    return regular, bold, warnings


def _contains_arabic(value: Any) -> bool:
    if isinstance(value, str):
        return any("؀" <= ch <= "ۿ" for ch in value)
    if isinstance(value, dict):
        return any(_contains_arabic(v) for v in value.values())
    if isinstance(value, (list, tuple)):
        return any(_contains_arabic(v) for v in value)
    return False


def _image_flowable(item: dict[str, Any], asset_root: Path | None, max_width: float, warnings: list[str],
                    min_dpi: int, block_dpi: int) -> Image | None:
    path = _safe_asset(item.get("path"), asset_root)
    if not path:
        return None
    try:
        with PILImage.open(path) as img:
            width_px, height_px = img.size
    except Exception as exc:
        raise PDFRenderError("IMAGE_DECODE_FAILED") from exc
    display_mm = float(item.get("display_width_mm") or 70)
    display_width = min(max_width, max(20 * mm, display_mm * mm))
    effective_dpi = width_px / max(display_width / 25.4, 0.01)
    if effective_dpi < block_dpi:
        raise PDFRenderError("IMAGE_DPI_BELOW_BLOCK_THRESHOLD")
    if effective_dpi < min_dpi:
        warnings.append(f"Low effective image DPI ({effective_dpi:.0f}) for {path.name}.")
    ratio = height_px / max(width_px, 1)
    return Image(str(path), width=display_width, height=display_width * ratio, kind="proportional")


def _spec_table(specs: list[dict[str, Any]], styles: dict[str, ParagraphStyle],
                accent: colors.Color, width: float, show_provenance: bool) -> Table | None:
    if not specs:
        return None
    headers = ["المواصفة / Spec", "القيمة / Value", "الوحدة / Unit"]
    if show_provenance:
        headers.append("المصدر / Source")
    data = [[Paragraph(_arabic(h), styles["table_head"]) for h in headers]]
    for row in specs:
        key = row.get("label_ar") or row.get("label") or row.get("key") or ""
        value = row.get("value_ar") if row.get("value_ar") is not None else row.get("value", "")
        if value is None or value == "":
            value = "—"
        unit = row.get("unit") or ""
        cells = [Paragraph(_arabic(key), styles["table_cell"]),
                 Paragraph(_arabic(str(value)), styles["table_cell"]),
                 Paragraph(_arabic(unit), styles["table_cell"])]
        if show_provenance:
            prov = row.get("provenance") or row.get("source") or ""
            cells.append(Paragraph(_arabic(str(prov)), styles["table_cell"]))
        data.append(cells)
    col_count = len(headers)
    widths = [width * 0.38, width * 0.32, width * 0.15, width * 0.15] if col_count == 4 else [width * 0.42, width * 0.40, width * 0.18]
    table = Table(data, colWidths=widths[:col_count], repeatRows=1, hAlign="RIGHT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), accent),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#D9E0E7")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (-1, -1), "RIGHT"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F6F8FA")]),
    ]))
    return table


def _build_index(items: list[dict[str, Any]], styles: dict[str, ParagraphStyle]) -> list[Any]:
    if len(items) < 2:
        return []
    flow: list[Any] = [Paragraph(_arabic("الفهرس / Index"), styles["Section"])]
    for i, item in enumerate(items, 1):
        name = item.get("name_ar") or item.get("name") or item.get("model_name") or f"Item {i}"
        family = item.get("family") or item.get("section") or ""
        line = f"{i}. {_arabic(name)}"
        if family:
            line += f"  —  {_arabic(family)}"
        flow.append(Paragraph(line, styles["BodyRTL"]))
    flow.append(Spacer(1, 6 * mm))
    flow.append(PageBreak())
    return flow


def _group_by_family(items: list[dict[str, Any]]) -> list[tuple[str, list[dict[str, Any]]]]:
    groups: dict[str, list[dict[str, Any]]] = {}
    order: list[str] = []
    for item in items:
        fam = item.get("family") or item.get("section") or "General"
        if fam not in groups:
            groups[fam] = []
            order.append(fam)
        groups[fam].append(item)
    return [(fam, groups[fam]) for fam in order]


def render_pdf(snapshot: dict[str, Any], output_path: str | Path, *, asset_root: str | Path | None = None) -> dict[str, Any]:
    if not isinstance(snapshot, dict) or snapshot.get("snapshot_version") != "1":
        raise PDFRenderError("ISSUE_SNAPSHOT_INVALID")
    doc_type = snapshot.get("document_type")
    if doc_type not in SUPPORTED_TYPES:
        raise PDFRenderError("DOCUMENT_TYPE_UNSUPPORTED")
    export = snapshot.get("export_profile") or {}
    output_class = export.get("output_class", "DIGITAL_PDF")
    if output_class == "PRINT_READY_PDF" or export.get("color_mode") in {"CMYK_REQUIRED", "PRINTER_DEFINED"}:
        raise PDFRenderError("PRINT_READY_REQUIRES_VALIDATED_CMYK_WORKFLOW")
    if output_class not in {"DIGITAL_PDF", "PRINT_ORIENTED_PDF"}:
        raise PDFRenderError("OUTPUT_CLASS_INVALID")

    # Optional hard block
    conflicts = snapshot.get("conflicts") or []
    document_status = str(snapshot.get("document_status") or "ORIGINAL").upper()
    # FINAL is always blocked when ADR-040 conflicts exist; the legacy flag
    # cannot disable this invariant.
    if conflicts and document_status == "FINAL":
        raise PDFRenderError("CONFLICTS_BLOCK_FINAL_ISSUE")

    root = Path(asset_root).resolve() if asset_root else None
    paper = snapshot.get("paper") or {}
    page_config = paper.get("page") or {}
    size_name = str(page_config.get("size", "A4")).upper()
    if size_name not in PAGE_SIZES:
        raise PDFRenderError("PAGE_SIZE_UNSUPPORTED")
    page_size = PAGE_SIZES[size_name]
    orientation = str(page_config.get("orientation", "portrait")).lower()
    if orientation == "landscape":
        page_size = landscape(page_size)
    elif orientation != "portrait":
        raise PDFRenderError("PAGE_ORIENTATION_INVALID")
    margins = page_config.get("margins_mm") or {}
    left = float(margins.get("left", 12)) * mm
    right = float(margins.get("right", 12)) * mm
    top = float(margins.get("top", 18)) * mm
    bottom = float(margins.get("bottom", 16)) * mm
    if min(left, right, top, bottom) < 3 * mm or left + right >= page_size[0] * 0.5 or top + bottom >= page_size[1] * 0.5:
        raise PDFRenderError("PAGE_MARGINS_INVALID")

    brand = snapshot.get("brand") or {}
    palette = brand.get("palette") or {}
    accent = _hex_color(palette.get("primary"), "#173F5F")
    ink = _hex_color(palette.get("text"), "#17212B")
    paper_color = _hex_color((paper.get("background") or {}).get("color"), "#FFFFFF")
    texture_opacity = float((paper.get("background") or {}).get("texture_opacity", 0.35))
    fonts = brand.get("fonts") or {}
    regular_font, bold_font, warnings = _register_fonts(fonts, root)
    if _contains_arabic(snapshot) and regular_font == "Helvetica":
        warnings.append("ARABIC_FONT_NOT_EMBEDDED: Arabic text may not render correctly.")
    min_dpi = int(export.get("minimum_dpi_warning", 150))
    block_dpi = int(export.get("minimum_dpi_block", 72))

    if conflicts:
        warnings.append(f"ADR-040 conflicts present ({len(conflicts)}); both scopes preserved.")

    show_provenance = bool(snapshot.get("show_provenance", False))
    revision = snapshot.get("revision") or ""
    issue_date = snapshot.get("issue_date") or datetime.now(timezone.utc).strftime("%Y-%m-%d")

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="DocTitle", parent=styles["Title"], fontName=bold_font,
                              fontSize=22, leading=28, textColor=accent, alignment=TA_RIGHT, spaceAfter=8))
    styles.add(ParagraphStyle(name="SubTitle", parent=styles["Normal"], fontName=regular_font,
                              fontSize=11, leading=16, textColor=ink, alignment=TA_RIGHT, spaceAfter=10))
    styles.add(ParagraphStyle(name="Section", parent=styles["Heading2"], fontName=bold_font,
                              fontSize=14, leading=19, textColor=accent, alignment=TA_RIGHT, spaceBefore=12, spaceAfter=7))
    styles.add(ParagraphStyle(name="Family", parent=styles["Heading1"], fontName=bold_font,
                              fontSize=16, leading=20, textColor=accent, alignment=TA_RIGHT, spaceBefore=10, spaceAfter=6))
    styles.add(ParagraphStyle(name="BodyRTL", parent=styles["BodyText"], fontName=regular_font,
                              fontSize=9.5, leading=14, textColor=ink, alignment=TA_RIGHT))
    styles.add(ParagraphStyle(name="table_head", parent=styles["Normal"], fontName=bold_font,
                              fontSize=8.5, leading=11, textColor=colors.white, alignment=TA_RIGHT))
    styles.add(ParagraphStyle(name="table_cell", parent=styles["Normal"], fontName=regular_font,
                              fontSize=8.2, leading=11, textColor=ink, alignment=TA_RIGHT))
    styles.add(ParagraphStyle(name="CoverTitle", parent=styles["Title"], fontName=bold_font,
                              fontSize=28, leading=34, textColor=accent, alignment=TA_CENTER, spaceAfter=12))

    target = Path(output_path)
    target.parent.mkdir(parents=True, exist_ok=True)
    header = snapshot.get("header") or {}
    footer = snapshot.get("footer") or {}
    watermark = snapshot.get("watermark") or {}
    texture = _safe_asset((paper.get("background") or {}).get("texture_path"), root)
    watermark_image = _safe_asset(watermark.get("image_path"), root) if watermark.get("image_path") else None

    def draw_page(canvas: Any, document: Any) -> None:
        canvas.saveState()
        canvas.setFillColor(paper_color)
        canvas.rect(0, 0, page_size[0], page_size[1], stroke=0, fill=1)
        if texture:
            canvas.saveState()
            canvas.setFillAlpha(max(0.05, min(1.0, texture_opacity)))
            canvas.drawImage(str(texture), 0, 0, width=page_size[0], height=page_size[1], preserveAspectRatio=False, mask="auto")
            canvas.restoreState()
        logo = _safe_asset(header.get("logo_path"), root) if header.get("logo_path") else None
        if logo:
            canvas.drawImage(str(logo), right, page_size[1] - 17 * mm, width=28 * mm, height=12 * mm, preserveAspectRatio=True, anchor="e", mask="auto")
        company = (snapshot.get("contact") or {}).get("company_name") or ""
        if company and not logo:
            canvas.setFont(bold_font, 10)
            canvas.setFillColor(accent)
            canvas.drawRightString(page_size[0] - right, page_size[1] - 12 * mm, _arabic(company))
        # Watermark
        if watermark_image:
            canvas.saveState()
            canvas.setFillAlpha(max(0.03, min(0.4, float(watermark.get("opacity", 0.12)))))
            w = page_size[0] * 0.45
            h = w * 0.6
            canvas.drawImage(str(watermark_image), (page_size[0] - w) / 2, (page_size[1] - h) / 2, width=w, height=h, preserveAspectRatio=True, mask="auto")
            canvas.restoreState()
        elif watermark.get("text"):
            canvas.saveState()
            canvas.setFillAlpha(max(0.03, min(0.35, float(watermark.get("opacity", 0.10)))))
            canvas.setFillColor(_hex_color(watermark.get("color"), "#777777"))
            canvas.setFont(bold_font, 38)
            canvas.translate(page_size[0] / 2, page_size[1] / 2)
            canvas.rotate(float(watermark.get("rotation_degrees", -35)))
            canvas.drawCentredString(0, 0, _arabic(watermark["text"]))
            canvas.restoreState()
        canvas.setStrokeColor(colors.HexColor("#D9E0E7"))
        canvas.setLineWidth(0.5)
        canvas.line(left, bottom - 4 * mm, page_size[0] - right, bottom - 4 * mm)
        canvas.setFont(regular_font, 7.5)
        canvas.setFillColor(colors.HexColor("#687684"))
        footer_text = footer.get("text") or f"{document_status}  |  Rev {revision or '-'}  |  {issue_date}"
        canvas.drawRightString(page_size[0] - right, 8 * mm, _arabic(footer_text))
        canvas.drawString(left, 8 * mm, str(document.page))
        canvas.restoreState()

    frame = Frame(left, bottom, page_size[0] - left - right, page_size[1] - top - bottom,
                  leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0, id="normal")
    doc = BaseDocTemplate(str(target), pagesize=page_size, leftMargin=left, rightMargin=right,
                          topMargin=top, bottomMargin=bottom, title=str(snapshot.get("title") or "Industrial Catalog"),
                          author=str((snapshot.get("contact") or {}).get("company_name") or ""))
    doc.addPageTemplates([PageTemplate(id="catalog", frames=[frame], onPage=draw_page)])

    story: list[Any] = []
    title = snapshot.get("title") or "Industrial Equipment"
    include_dedicated_cover = bool(snapshot.get("dedicated_cover", False))
    if include_dedicated_cover:
        story.append(Spacer(1, 40 * mm))
        story.append(Paragraph(_arabic(title), styles["CoverTitle"]))
        if snapshot.get("subtitle"):
            story.append(Paragraph(_arabic(snapshot["subtitle"]), styles["SubTitle"]))
        story.append(Spacer(1, 20 * mm))
        story.append(Paragraph(_arabic(issue_date), styles["BodyRTL"]))
        story.append(PageBreak())

    story.append(Paragraph(_arabic(title), styles["DocTitle"]))
    subtitle = snapshot.get("subtitle") or ""
    if subtitle:
        story.append(Paragraph(_arabic(subtitle), styles["SubTitle"]))
    contact = snapshot.get("contact") or {}
    contact_line = " · ".join(str(contact.get(k)) for k in ("phone", "email", "website") if contact.get(k))
    if contact_line:
        story.append(Paragraph(_arabic(contact_line), styles["SubTitle"]))

    items = snapshot.get("items")
    if not isinstance(items, list):
        items = [snapshot.get("product") or {}]
    if snapshot.get("exclude_unpublished", False):
        items = [it for it in items if it.get("publishable", True)]
    if not items:
        raise PDFRenderError("ISSUE_SCOPE_EMPTY")

    include_cover = snapshot.get("include_cover", doc_type in {"PRODUCT_CATALOG", "MASTER_CATALOG"})
    include_index = snapshot.get("include_index", doc_type in {"PRODUCT_CATALOG", "MASTER_CATALOG"} and len(items) > 1)
    if include_cover and include_index and not include_dedicated_cover:
        story.extend(_build_index(items, styles))

    content_width = page_size[0] - left - right
    group_by_family = snapshot.get("group_by_family", doc_type == "MASTER_CATALOG")

    def render_item(item: dict[str, Any], force_break: bool) -> None:
        if force_break:
            story.append(PageBreak())
        name = item.get("name_ar") or item.get("name") or item.get("model_name") or ""
        reference = item.get("reference") or item.get("model_number") or ""
        if name:
            story.append(Paragraph(_arabic(name), styles["Section"]))
        if reference:
            story.append(Paragraph(_arabic("Model / Reference: " + str(reference)), styles["BodyRTL"]))
            story.append(Spacer(1, 3 * mm))
        description = item.get("description_ar") or item.get("description") or ""
        if description:
            story.append(Paragraph(_arabic(description), styles["BodyRTL"]))
            story.append(Spacer(1, 3 * mm))
        for image_item in (item.get("images") or []):
            if isinstance(image_item, dict):
                flow = _image_flowable(image_item, root, content_width * 0.70, warnings, min_dpi, block_dpi)
                if flow:
                    story.append(flow)
                    story.append(Spacer(1, 2 * mm))
        specs = item.get("specifications") or []
        table = _spec_table(specs, styles, accent, content_width, show_provenance)
        if table:
            story.append(table)
        if not specs and not description and not item.get("images"):
            raise PDFRenderError("ISSUE_ITEM_HAS_NO_RENDERABLE_CONTENT")
        story.append(Spacer(1, 5 * mm))

    if group_by_family:
        groups = _group_by_family(items)
        first = True
        for fam, group_items in groups:
            if not first:
                story.append(PageBreak())
            story.append(Paragraph(_arabic(fam), styles["Family"]))
            for idx, item in enumerate(group_items):
                render_item(item, force_break=False if idx == 0 else True)
            first = False
    else:
        for index, item in enumerate(items):
            render_item(item, force_break=index > 0 and doc_type in {"PRODUCT_CATALOG", "MASTER_CATALOG"})

    doc.build(story)
    data = target.read_bytes()
    if not data.startswith(b"%PDF-"):
        raise PDFRenderError("PDF_OUTPUT_INVALID")
    page_count = len(PdfReader(str(target)).pages)
    report = {
        "preflight_version": "1",
        "status": "WARNING" if warnings else "PASS",
        "document_type": doc_type,
        "output_class": output_class,
        "document_status": document_status,
        "revision": revision,
        "issue_date": issue_date,
        "page_count": page_count,
        "pdf_size_bytes": len(data),
        "pdf_sha256": _sha256(data),
        "warnings": warnings,
        "blocked_conditions": [],
        "conflicts_noted": len(conflicts),
        "items_rendered": len(items),
        "renderer": "ReportLab",
        "renderer_version": __import__("reportlab").Version,
        "print_ready_claimed": False,
    }
    return report


def render_snapshot_file(snapshot_path: str | Path, output_path: str | Path,
                         *, asset_root: str | Path | None = None,
                         report_path: str | Path | None = None) -> dict[str, Any]:
    try:
        snapshot = json.loads(Path(snapshot_path).read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        raise PDFRenderError("ISSUE_SNAPSHOT_READ_FAILED") from exc
    report = render_pdf(snapshot, output_path, asset_root=asset_root)
    if report_path:
        Path(report_path).write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    return report
