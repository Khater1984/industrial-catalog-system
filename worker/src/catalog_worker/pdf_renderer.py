"""Deterministic offline PDF renderer for immutable issue snapshots.

Only local, explicitly supplied asset paths are opened. No URLs or extracted text are executed.
"""
from __future__ import annotations

import hashlib
import json
import os
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
    for key, internal_name in (("regular", "CatalogArabic"), ("bold", "CatalogArabic-Bold")):
        font_path = _safe_asset(fonts.get(key), asset_root)
        if font_path:
            try:
                pdfmetrics.registerFont(TTFont(internal_name, str(font_path), subfontIndex=0))
                if key == "regular":
                    regular = internal_name
                else:
                    bold = internal_name
            except Exception as exc:
                raise PDFRenderError("FONT_REGISTRATION_FAILED") from exc
    if regular == "Helvetica" and bold == "Helvetica-Bold":
        warnings.append("No embedded brand font supplied; built-in Helvetica fallback used.")
    elif bold == "Helvetica-Bold":
        bold = regular
    return regular, bold, warnings


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
                accent: colors.Color, width: float) -> Table | None:
    if not specs:
        return None
    data = [[Paragraph(_arabic("المواصفة / Specification"), styles["table_head"]),
             Paragraph(_arabic("القيمة / Value"), styles["table_head"]),
             Paragraph(_arabic("الوحدة / Unit"), styles["table_head"])]]
    for row in specs:
        key = row.get("label_ar") or row.get("label") or row.get("key") or ""
        value = row.get("value_ar") if row.get("value_ar") is not None else row.get("value", "")
        unit = row.get("unit") or ""
        data.append([Paragraph(_arabic(key), styles["table_cell"]),
                     Paragraph(_arabic(value), styles["table_cell"]),
                     Paragraph(_arabic(unit), styles["table_cell"])])
    table = Table(data, colWidths=[width * 0.42, width * 0.40, width * 0.18], repeatRows=1, hAlign="RIGHT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), accent),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#D9E0E7")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (-1, -1), "RIGHT"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F6F8FA")]),
    ]))
    return table


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
    fonts = brand.get("fonts") or {}
    regular_font, bold_font, warnings = _register_fonts(fonts, root)
    min_dpi = int(export.get("minimum_dpi_warning", 150))
    block_dpi = int(export.get("minimum_dpi_block", 72))

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="DocTitle", parent=styles["Title"], fontName=bold_font,
                              fontSize=22, leading=28, textColor=accent, alignment=TA_RIGHT, spaceAfter=8))
    styles.add(ParagraphStyle(name="SubTitle", parent=styles["Normal"], fontName=regular_font,
                              fontSize=11, leading=16, textColor=ink, alignment=TA_RIGHT, spaceAfter=10))
    styles.add(ParagraphStyle(name="Section", parent=styles["Heading2"], fontName=bold_font,
                              fontSize=14, leading=19, textColor=accent, alignment=TA_RIGHT, spaceBefore=12, spaceAfter=7))
    styles.add(ParagraphStyle(name="BodyRTL", parent=styles["BodyText"], fontName=regular_font,
                              fontSize=9.5, leading=14, textColor=ink, alignment=TA_RIGHT))
    styles.add(ParagraphStyle(name="table_head", parent=styles["Normal"], fontName=bold_font,
                              fontSize=8.5, leading=11, textColor=colors.white, alignment=TA_RIGHT))
    styles.add(ParagraphStyle(name="table_cell", parent=styles["Normal"], fontName=regular_font,
                              fontSize=8.2, leading=11, textColor=ink, alignment=TA_RIGHT))

    target = Path(output_path)
    target.parent.mkdir(parents=True, exist_ok=True)
    header = snapshot.get("header") or {}
    footer = snapshot.get("footer") or {}
    watermark = snapshot.get("watermark") or {}
    texture = _safe_asset((paper.get("background") or {}).get("texture_path"), root)
    watermark_path = _safe_asset(watermark.get("image_path"), root) if watermark.get("image_path") else None

    def draw_page(canvas: Any, document: Any) -> None:
        canvas.saveState()
        canvas.setFillColor(paper_color)
        canvas.rect(0, 0, page_size[0], page_size[1], stroke=0, fill=1)
        if texture:
            canvas.drawImage(str(texture), 0, 0, width=page_size[0], height=page_size[1], preserveAspectRatio=False, mask="auto")
        logo = _safe_asset(header.get("logo_path"), root) if header.get("logo_path") else None
        if logo:
            canvas.drawImage(str(logo), right, page_size[1] - 17 * mm, width=28 * mm, height=12 * mm, preserveAspectRatio=True, anchor="e", mask="auto")
        if watermark.get("text"):
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
        canvas.drawRightString(page_size[0] - right, 8 * mm, _arabic(footer.get("text", "")))
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
    if not items:
        raise PDFRenderError("ISSUE_SCOPE_EMPTY")
    content_width = page_size[0] - left - right
    for index, item in enumerate(items):
        if index and doc_type in {"PRODUCT_CATALOG", "MASTER_CATALOG"}:
            story.append(PageBreak())
        name = item.get("name_ar") or item.get("name") or item.get("model_name") or ""
        reference = item.get("reference") or item.get("model_number") or ""
        if name:
            story.append(Paragraph(_arabic(name), styles["Section"]))
        if reference:
            story.append(Paragraph(_arabic("Model / Reference: " + str(reference)), styles["BodyRTL"]))
            story.append(Spacer(1, 4 * mm))
        description = item.get("description_ar") or item.get("description") or ""
        if description:
            story.append(Paragraph(_arabic(description), styles["BodyRTL"]))
            story.append(Spacer(1, 4 * mm))
        image_items = item.get("images") or []
        for image_item in image_items:
            if isinstance(image_item, dict):
                flow = _image_flowable(image_item, root, content_width * 0.72, warnings, min_dpi, block_dpi)
                if flow:
                    story.append(flow)
                    story.append(Spacer(1, 3 * mm))
        specs = item.get("specifications") or []
        table = _spec_table(specs, styles, accent, content_width)
        if table:
            story.append(table)
        if not specs and not description and not image_items:
            raise PDFRenderError("ISSUE_ITEM_HAS_NO_RENDERABLE_CONTENT")
        story.append(Spacer(1, 6 * mm))

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
        "page_count": page_count,
        "pdf_size_bytes": len(data),
        "pdf_sha256": _sha256(data),
        "warnings": warnings,
        "blocked_conditions": [],
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
