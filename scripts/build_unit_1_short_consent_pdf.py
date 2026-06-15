from __future__ import annotations

import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path("/Users/arwinfarajpoory/Desktop/Rugby")
SRC = ROOT / "templates" / "unit_1_slim_consent_short_2026-06-16.md"
OUT = (
    ROOT
    / "print_pdfs"
    / "1_DIESE_WOCHE_drucken"
    / "5_OPTIONAL_einwilligung_gekuerzt_2026-06-16.pdf"
)


def esc(text: str) -> str:
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    text = re.sub(r"`([^`]+)`", r"<font name='Courier'>\1</font>", text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"\*([^*]+)\*", r"<i>\1</i>", text)
    return text


def is_table_sep(line: str) -> bool:
    s = line.strip()
    return bool(s.startswith("|") and s.endswith("|") and re.fullmatch(r"[\|\-\:\s]+", s))


def is_table_line(line: str) -> bool:
    s = line.strip()
    return s.startswith("|") and s.endswith("|") and "|" in s[1:-1]


def split_table_line(line: str) -> list[str]:
    return [cell.strip() for cell in line.strip().strip("|").split("|")]


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(colors.HexColor("#666666"))
    canvas.drawRightString(doc.pagesize[0] - doc.rightMargin, 8 * mm, f"Seite {doc.page}")
    canvas.restoreState()


def build_pdf() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    doc = BaseDocTemplate(
        str(OUT),
        pagesize=A4,
        leftMargin=13 * mm,
        rightMargin=13 * mm,
        topMargin=10 * mm,
        bottomMargin=12 * mm,
        title="Kurze Einwilligung S&C Trainingsdaten",
        author="Arwin Farajpoory / Codex",
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
    doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=footer)])

    base = getSampleStyleSheet()
    styles = {
        "h1": ParagraphStyle(
            "h1",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=15,
            leading=18,
            textColor=colors.HexColor("#1F4E5F"),
            spaceBefore=2,
            spaceAfter=6,
        ),
        "h2": ParagraphStyle(
            "h2",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=10.7,
            leading=12.5,
            textColor=colors.HexColor("#1F4E5F"),
            spaceBefore=5,
            spaceAfter=3,
        ),
        "body": ParagraphStyle(
            "body",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=7.7,
            leading=9.1,
            textColor=colors.HexColor("#1F2328"),
            spaceAfter=2.0,
            alignment=TA_LEFT,
        ),
        "small": ParagraphStyle(
            "small",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=7.0,
            leading=8.1,
            textColor=colors.HexColor("#1F2328"),
        ),
        "small_bold": ParagraphStyle(
            "small_bold",
            parent=base["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=7.0,
            leading=8.1,
            textColor=colors.HexColor("#1F2328"),
        ),
        "bullet": ParagraphStyle(
            "bullet",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=7.55,
            leading=8.8,
            leftIndent=9,
            bulletIndent=3,
            spaceAfter=1.4,
            textColor=colors.HexColor("#1F2328"),
        ),
    }

    story = []
    lines = SRC.read_text(encoding="utf-8").splitlines()
    i = 0
    while i < len(lines):
        line = lines[i].rstrip()
        stripped = line.strip()

        if not stripped:
            story.append(Spacer(1, 1.5))
            i += 1
            continue

        if is_table_line(line):
            rows: list[list[str]] = []
            while i < len(lines) and (is_table_line(lines[i]) or is_table_sep(lines[i])):
                if not is_table_sep(lines[i]):
                    rows.append(split_table_line(lines[i]))
                i += 1
            if rows:
                col_count = max(len(r) for r in rows)
                normalized = [r + [""] * (col_count - len(r)) for r in rows]
                para_rows = [
                    [
                        Paragraph(esc(c), styles["small_bold" if ridx == 0 else "small"])
                        for c in row
                    ]
                    for ridx, row in enumerate(normalized)
                ]
                table = Table(
                    para_rows,
                    colWidths=[52 * mm, doc.width - 52 * mm],
                    repeatRows=1,
                )
                table.setStyle(
                    TableStyle(
                        [
                            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EAF1F3")),
                            ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#1F4E5F")),
                            ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#8B989F")),
                            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                            ("LEFTPADDING", (0, 0), (-1, -1), 4),
                            ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                            ("TOPPADDING", (0, 0), (-1, -1), 2),
                            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                        ]
                    )
                )
                story.append(table)
                story.append(Spacer(1, 3))
            continue

        if stripped.startswith("# "):
            story.append(Paragraph(esc(stripped[2:]), styles["h1"]))
        elif stripped.startswith("## "):
            if stripped == "## Einwilligung":
                story.append(PageBreak())
            story.append(Paragraph(esc(stripped[3:]), styles["h2"]))
        elif stripped.startswith("- "):
            story.append(Paragraph(esc(stripped[2:]), styles["bullet"], bulletText="-"))
        else:
            story.append(Paragraph(esc(stripped), styles["body"]))
        i += 1

    doc.build(story)


if __name__ == "__main__":
    build_pdf()
    print(OUT)
