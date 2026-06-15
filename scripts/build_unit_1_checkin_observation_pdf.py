from __future__ import annotations

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase.pdfmetrics import stringWidth
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


ROOT = Path(__file__).resolve().parents[1]
OUT = (
    ROOT
    / "print_pdfs"
    / "1_DIESE_WOCHE_drucken"
    / "3_DIENSTAG_checkin_beobachtung_nur_2026-06-16.pdf"
)

PAGE_SIZE = landscape(A4)
MARGIN_X = 9 * mm
MARGIN_TOP = 8 * mm
MARGIN_BOTTOM = 9 * mm
ACCENT = colors.HexColor("#1F4E5F")
LIGHT = colors.HexColor("#EAF1F3")
GRID = colors.HexColor("#7C8A91")
TEXT = colors.HexColor("#1F2328")


def para(text: str, style: ParagraphStyle) -> Paragraph:
    return Paragraph(text, style)


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(colors.HexColor("#666666"))
    canvas.setFont("Helvetica", 7)
    canvas.drawRightString(
        doc.pagesize[0] - doc.rightMargin,
        5 * mm,
        f"Seite {doc.page}",
    )
    canvas.restoreState()


def fit_font(text: str, font_name: str, max_size: float, max_width: float) -> float:
    size = max_size
    while size > 5.4 and stringWidth(text, font_name, size) > max_width:
        size -= 0.1
    return size


def build_pdf() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    doc = BaseDocTemplate(
        str(OUT),
        pagesize=PAGE_SIZE,
        leftMargin=MARGIN_X,
        rightMargin=MARGIN_X,
        topMargin=MARGIN_TOP,
        bottomMargin=MARGIN_BOTTOM,
        title="Player Check-in plus Beobachtung 2026-06-16",
        author="Arwin Farajpoory / Codex",
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="main")
    doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=footer)])

    styles = {
        "title": ParagraphStyle(
            "title",
            fontName="Helvetica-Bold",
            fontSize=14,
            leading=16,
            textColor=ACCENT,
            spaceAfter=3,
        ),
        "meta": ParagraphStyle(
            "meta",
            fontName="Helvetica",
            fontSize=8,
            leading=9.5,
            textColor=TEXT,
            spaceAfter=2,
        ),
        "small": ParagraphStyle(
            "small",
            fontName="Helvetica",
            fontSize=6.8,
            leading=8.0,
            textColor=TEXT,
        ),
        "small_bold": ParagraphStyle(
            "small_bold",
            fontName="Helvetica-Bold",
            fontSize=6.8,
            leading=8.0,
            textColor=TEXT,
        ),
        "cell": ParagraphStyle(
            "cell",
            fontName="Helvetica",
            fontSize=6.7,
            leading=7.8,
            textColor=TEXT,
        ),
        "cell_bold": ParagraphStyle(
            "cell_bold",
            fontName="Helvetica-Bold",
            fontSize=6.8,
            leading=7.8,
            textColor=TEXT,
        ),
    }

    story = []
    story.append(para("Player Check-in + Beobachtung | Einheit 1", styles["title"]))
    story.append(
        para(
            "<b>Datum:</b> Dienstag, 16. Juni 2026 &nbsp;&nbsp; "
            "<b>Zweck:</b> kurzer Sicherheits- und Steuerungscheck fuer die heutige Einheit.",
            styles["meta"],
        )
    )
    story.append(
        para(
            "<b>Kurzlegende:</b> kg = Koerpergewicht nur falls Waage da. "
            "R = Readiness 1-5. Life = Schlaf/Stress/Muskelkater auffaellig: N/Y/kurz. "
            "Ret = Returner: J/N/offen. A = Ampel G/Y/R.",
            styles["meta"],
        )
    )
    story.append(Spacer(1, 2))

    check_header = ["Nr", "Name", "Pos", "kg opt.", "R", "Life", "Schmerz + Ort", "Ret", "A"]
    check_rows = [[str(i), "", "", "", "", "", "", "", ""] for i in range(1, 21)]
    check_table = Table(
        [[para(c, styles["cell_bold"]) for c in check_header]]
        + [[para(c, styles["cell"]) for c in row] for row in check_rows],
        colWidths=[10 * mm, 45 * mm, 21 * mm, 18 * mm, 10 * mm, 27 * mm, 79 * mm, 20 * mm, 12 * mm],
        rowHeights=[7.2 * mm] + [7.35 * mm] * 20,
        repeatRows=1,
    )
    check_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), LIGHT),
                ("TEXTCOLOR", (0, 0), (-1, 0), ACCENT),
                ("GRID", (0, 0), (-1, -1), 0.35, GRID),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("ALIGN", (0, 0), (0, -1), "CENTER"),
                ("ALIGN", (3, 0), (5, -1), "CENTER"),
                ("ALIGN", (7, 0), (8, -1), "CENTER"),
                ("LEFTPADDING", (0, 0), (-1, -1), 3),
                ("RIGHTPADDING", (0, 0), (-1, -1), 3),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ]
        )
    )
    story.append(check_table)

    story.append(PageBreak())
    story.append(para("Beobachtung + Abschlussliste", styles["title"]))
    story.append(
        para(
            "Nur Auffaelligkeiten notieren. Wenn alles normal ist: leer lassen oder kurz \"ok\". "
            "sRPE = Gesamtbelastung 0-10 nach der Einheit.",
            styles["meta"],
        )
    )
    story.append(Spacer(1, 2))

    obs_header = ["Nr", "Bewegung / Schmerz / Technik", "sRPE", "Abschluss / Notiz"]
    obs_rows = [[str(i), "", "", ""] for i in range(1, 21)]
    obs_table = Table(
        [[para(c, styles["cell_bold"]) for c in obs_header]]
        + [[para(c, styles["cell"]) for c in row] for row in obs_rows],
        colWidths=[10 * mm, 129 * mm, 18 * mm, 85 * mm],
        rowHeights=[7.0 * mm] + [6.15 * mm] * 20,
        repeatRows=1,
    )
    obs_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), LIGHT),
                ("TEXTCOLOR", (0, 0), (-1, 0), ACCENT),
                ("GRID", (0, 0), (-1, -1), 0.35, GRID),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("ALIGN", (0, 0), (0, -1), "CENTER"),
                ("ALIGN", (2, 0), (2, -1), "CENTER"),
                ("LEFTPADDING", (0, 0), (-1, -1), 3),
                ("RIGHTPADDING", (0, 0), (-1, -1), 3),
                ("TOPPADDING", (0, 0), (-1, -1), 1.8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 1.8),
            ]
        )
    )
    story.append(obs_table)
    story.append(Spacer(1, 5))

    checklist = [
        ["Abschluss-Check", "Notiz"],
        ["Anwesend gesamt", ""],
        ["Ampel: Gruen / Gelb / Rot", ""],
        ["Returner / offene medizinische Themen", ""],
        ["Reduzierte Variante oder Klaerung noetig", ""],
        ["Ruecksprache Physio/Arzt/Verein", ""],
        ["Organisation: Was war zu viel / was aendern?", ""],
    ]
    checklist_table = Table(
        [[para(c, styles["cell_bold"] if r == 0 else styles["cell"]) for c in row] for r, row in enumerate(checklist)],
        colWidths=[77 * mm, 165 * mm],
        rowHeights=[6.4 * mm] + [6.0 * mm] * 6,
    )
    checklist_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), LIGHT),
                ("TEXTCOLOR", (0, 0), (-1, 0), ACCENT),
                ("GRID", (0, 0), (-1, -1), 0.35, GRID),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 3),
                ("RIGHTPADDING", (0, 0), (-1, -1), 3),
                ("TOPPADDING", (0, 0), (-1, -1), 1.5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 1.5),
            ]
        )
    )
    story.append(checklist_table)

    doc.build(story)


if __name__ == "__main__":
    build_pdf()
    print(OUT)
