"""Baut aus den Deep-Playbook-Markdowns (docs/16, docs/17) eine schoen
gestaltete, farbcodierte und gut lesbare PDF.

Im Stil der bestehenden reportlab-Pipeline (scripts/export_print_pdfs.py),
aber mit besserer Typografie, semantischer Farbcodierung und korrektem
Umbruch langer URLs (behebt die Overflow-Fehler der Einmal-Exporte).

Aufruf:
    .venv/bin/python scripts/build_deep_playbook_pdf.py            # default: docs/16
    .venv/bin/python scripts/build_deep_playbook_pdf.py docs/17_unit_1_v3_deep_playbook_2026-06-16.md

Inhalt wird NICHT veraendert - nur Darstellung. Ausgabe: <quelle>.styled.pdf
"""
from __future__ import annotations

import io
import re
import sys
from contextlib import redirect_stderr
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4, portrait
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    HRFlowable,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SRC = ROOT / "docs" / "16_unit_1_v2_deep_playbook_2026-06-16.md"

# --- Farbpalette: ruhig, druckfreundlich, semantisch -----------------------
INK = colors.HexColor("#1f2933")        # Fliesstext
BRAND = colors.HexColor("#14406b")      # Abschnittsbaender, Labels (dunkelblau)
BRAND_SOFT = colors.HexColor("#eaf0f7")  # Titel-Unterleger
ACCENT = colors.HexColor("#2f6fb0")     # Akzentbalken Sprechblase
QUOTE_BG = colors.HexColor("#eef4fb")   # "Was ich sage" Hintergrund
ZIEL_BG = colors.HexColor("#eef3ee")    # "Ziel" Hintergrund
ZIEL_BAR = colors.HexColor("#5a8f6b")
GREEN = colors.HexColor("#2e7d32")      # Ampel gruen
AMBER = colors.HexColor("#cf8400")      # Ampel gelb
RED = colors.HexColor("#c62828")        # Ampel rot / Safety
RULE = colors.HexColor("#c9d3dd")       # feine Linien
SUBTLE = colors.HexColor("#5b6b7b")     # Untertitel / Caption

AMPEL = {"Gruen": GREEN, "Grün": GREEN, "Gelb": AMBER, "Rot": RED}


def hx(color) -> str:
    """reportlab-Color -> '#rrggbb' fuer <font color=...> Markup."""
    return "#" + color.hexval()[2:]


def color_ampel(text: str) -> str:
    def f(m: re.Match) -> str:
        w = m.group(0)
        return f"<font color='{hx(AMPEL[w])}'><b>{w}</b></font>"

    return re.sub(r"\b(Gruen|Grün|Gelb|Rot)\b", f, text)


def esc(text: str) -> str:
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    text = re.sub(r"`([^`]+)`", r"<font name='Courier'>\1</font>", text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"\*([^*]+)\*", r"<i>\1</i>", text)
    text = color_ampel(text)
    return text


def make_styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "title", parent=base["Heading1"], fontName="Helvetica-Bold",
            fontSize=19, leading=23, textColor=BRAND, spaceAfter=2,
        ),
        "subtitle": ParagraphStyle(
            "subtitle", parent=base["BodyText"], fontName="Helvetica-Oblique",
            fontSize=9.5, leading=12.5, textColor=SUBTLE, spaceAfter=4,
        ),
        "section": ParagraphStyle(
            "section", parent=base["Heading2"], fontName="Helvetica-Bold",
            fontSize=12.5, leading=15, textColor=colors.white, backColor=BRAND,
            borderPadding=(5, 7, 5, 7), spaceBefore=14, spaceAfter=8, leftIndent=0,
        ),
        "h3": ParagraphStyle(
            "h3", parent=base["Heading3"], fontName="Helvetica-Bold",
            fontSize=11, leading=14, textColor=BRAND, spaceBefore=9, spaceAfter=2,
        ),
        "ziel": ParagraphStyle(
            "ziel", parent=base["BodyText"], fontName="Helvetica", fontSize=9.5,
            leading=13, textColor=INK, backColor=ZIEL_BG,
            borderPadding=(5, 7, 5, 7), spaceBefore=2, spaceAfter=6,
        ),
        "body": ParagraphStyle(
            "body", parent=base["BodyText"], fontName="Helvetica", fontSize=9.5,
            leading=13.5, textColor=INK, spaceAfter=4, alignment=TA_LEFT,
        ),
        "bullet": ParagraphStyle(
            "bullet", parent=base["BodyText"], fontName="Helvetica", fontSize=9.5,
            leading=13, textColor=INK, leftIndent=14, bulletIndent=3, spaceAfter=3,
        ),
        "caption": ParagraphStyle(
            "caption", parent=base["BodyText"], fontName="Helvetica-Bold",
            fontSize=7.5, leading=9, textColor=ACCENT, spaceBefore=3, spaceAfter=2,
        ),
        "quote": ParagraphStyle(
            "quote", parent=base["BodyText"], fontName="Helvetica", fontSize=9.8,
            leading=13.8, textColor=colors.HexColor("#16324a"),
        ),
    }


def page_decoration(canvas, doc):
    canvas.saveState()
    # Fusszeile: Quelle links, Seite rechts
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(SUBTLE)
    canvas.drawString(doc.leftMargin, 8 * mm, "Einheit 1 - Deep Playbook - Di 16.06.2026")
    canvas.drawRightString(
        doc.pagesize[0] - doc.rightMargin, 8 * mm, f"Seite {doc.page}"
    )
    canvas.setStrokeColor(RULE)
    canvas.setLineWidth(0.4)
    canvas.line(doc.leftMargin, 11 * mm, doc.pagesize[0] - doc.rightMargin, 11 * mm)
    canvas.restoreState()


def quote_callout(quotes: list[str], styles, width: float):
    """Mehrzeilige Tabelle = teilbar ueber Seiten, durchgehender Akzentbalken."""
    rows = [[Paragraph(esc(q), styles["quote"])] for q in quotes]
    table = Table(rows, colWidths=[width])
    table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), QUOTE_BG),
            ("LINEBEFORE", (0, 0), (0, -1), 3, ACCENT),
            ("LEFTPADDING", (0, 0), (-1, -1), 9),
            ("RIGHTPADDING", (0, 0), (-1, -1), 9),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ])
    )
    return table


def render_bullet(text: str, styles) -> Paragraph:
    """- **Label:** rest  ->  farbiges Label. Ampel-Labels in Ampelfarbe."""
    m = re.match(r"\*\*(.+?):\*\*\s*(.*)$", text)
    if m:
        label, rest = m.group(1), m.group(2)
        color = AMPEL.get(label, BRAND)
        head = f"<font color='{hx(color)}'><b>{label}:</b></font>"
        body = (" " + esc(rest)) if rest else ""
        return Paragraph(f"{head}{body}", styles["bullet"], bulletText="•")
    return Paragraph(esc(text), styles["bullet"], bulletText="•")


def build_pdf(src: Path, dst: Path):
    doc = BaseDocTemplate(
        str(dst), pagesize=portrait(A4),
        leftMargin=16 * mm, rightMargin=16 * mm,
        topMargin=14 * mm, bottomMargin=14 * mm,
        title=src.stem, author="Rugby S&C export",
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="n")
    doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=page_decoration)])

    styles = make_styles()
    lines = src.read_text(encoding="utf-8").splitlines()
    story: list = []
    expect_subtitle = False
    i = 0

    while i < len(lines):
        s = lines[i].strip()

        if not s:
            i += 1
            continue

        if s == "---":
            story.append(Spacer(1, 2))
            story.append(HRFlowable(width="100%", thickness=0.5, color=RULE,
                                    spaceBefore=2, spaceAfter=4))
            i += 1
            continue

        if s.startswith("# "):
            story.append(Paragraph(esc(s[2:]), styles["title"]))
            story.append(HRFlowable(width="100%", thickness=2, color=BRAND,
                                    spaceBefore=1, spaceAfter=4))
            expect_subtitle = True
            i += 1
            continue

        if s.startswith("## "):
            story.append(Paragraph(esc(s[3:]), styles["section"]))
            expect_subtitle = False
            i += 1
            continue

        if s.startswith("### "):
            # Kein Sonderzeichen-Akzent: Helvetica/WinAnsi hat keine Box-Glyphen
            # (▮/■ wuerden als Tofu rendern). Blau-fett + Haarlinie reicht.
            story.append(Paragraph(esc(s[4:]), styles["h3"]))
            story.append(HRFlowable(width="100%", thickness=0.4, color=RULE,
                                    spaceBefore=1, spaceAfter=3))
            expect_subtitle = False
            i += 1
            continue

        if s.startswith("**Ziel:**"):
            rest = s[len("**Ziel:**"):].strip()
            story.append(Paragraph(
                f"<b><font color='{hx(BRAND)}'>Ziel</font></b>&nbsp;&nbsp;{esc(rest)}",
                styles["ziel"]))
            expect_subtitle = False
            i += 1
            continue

        if s.startswith("**Was ich sage"):
            i += 1
            quotes: list[str] = []
            while i < len(lines) and lines[i].strip().startswith(">"):
                quotes.append(lines[i].strip().lstrip(">").strip())
                i += 1
            if quotes:
                story.append(Paragraph("WAS ICH SAGE", styles["caption"]))
                story.append(quote_callout(quotes, styles, doc.width))
                story.append(Spacer(1, 4))
            expect_subtitle = False
            continue

        if s.startswith("> "):  # vereinzelte Quote ohne Header
            story.append(quote_callout([s.lstrip(">").strip()], styles, doc.width))
            i += 1
            continue

        if s.startswith("- "):
            story.append(render_bullet(s[2:].strip(), styles))
            expect_subtitle = False
            i += 1
            continue

        # Fliesstext (inkl. Untertitel direkt nach dem H1)
        style = styles["subtitle"] if expect_subtitle else styles["body"]
        story.append(Paragraph(esc(s), style))
        expect_subtitle = False
        i += 1

    buf = io.StringIO()
    with redirect_stderr(buf):
        doc.build(story)
    warnings = buf.getvalue().strip()
    return warnings


def main():
    srcs = [Path(a) for a in sys.argv[1:]] or [DEFAULT_SRC]
    for src in srcs:
        src = src if src.is_absolute() else (ROOT / src)
        if not src.exists():
            raise FileNotFoundError(src)
        dst = src.with_suffix(".styled.pdf")
        warnings = build_pdf(src, dst)
        flag = " [WARN: " + warnings.replace("\n", " | ") + "]" if warnings else " [ok, keine Overflow-Warnung]"
        print(f"{src.name} -> {dst.name}{flag}")


if __name__ == "__main__":
    main()
