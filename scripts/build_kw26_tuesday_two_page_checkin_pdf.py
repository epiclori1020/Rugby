from __future__ import annotations

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle
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


ROOT = Path(__file__).resolve().parents[1]
OUT = (
    ROOT
    / "print_pdfs"
    / "DIENSTAG_2026-06-23_DRUCKEN"
    / "02_checkin_beobachtung_pflicht_2seiten.pdf"
)

PAGE_SIZE = landscape(A4)
MARGIN_X = 8 * mm
MARGIN_TOP = 7 * mm
MARGIN_BOTTOM = 8 * mm
ACCENT = colors.HexColor("#1F4E5F")
LIGHT = colors.HexColor("#EAF1F3")
GRID = colors.HexColor("#7C8A91")
TEXT = colors.HexColor("#1F2328")
RED = colors.HexColor("#B3261E")


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


def make_table(rows, col_widths, row_heights=None, repeat_rows=1):
    table = Table(rows, colWidths=col_widths, rowHeights=row_heights, repeatRows=repeat_rows)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), LIGHT),
                ("TEXTCOLOR", (0, 0), (-1, 0), ACCENT),
                ("GRID", (0, 0), (-1, -1), 0.35, GRID),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 2.5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 2.5),
                ("TOPPADDING", (0, 0), (-1, -1), 1.5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 1.5),
                ("ALIGN", (0, 0), (0, -1), "CENTER"),
                ("ALIGN", (3, 0), (4, -1), "CENTER"),
                ("ALIGN", (6, 0), (7, -1), "CENTER"),
            ]
        )
    )
    return table


def build_pdf() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    doc = BaseDocTemplate(
        str(OUT),
        pagesize=PAGE_SIZE,
        leftMargin=MARGIN_X,
        rightMargin=MARGIN_X,
        topMargin=MARGIN_TOP,
        bottomMargin=MARGIN_BOTTOM,
        title="KW26 Dienstag Check-in Beobachtung 2 Seiten 2026-06-23",
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
            fontSize=7.7,
            leading=9,
            textColor=TEXT,
            spaceAfter=2,
        ),
        "red": ParagraphStyle(
            "red",
            fontName="Helvetica-Bold",
            fontSize=7.4,
            leading=8.5,
            textColor=RED,
            spaceAfter=3,
        ),
        "cell": ParagraphStyle(
            "cell",
            fontName="Helvetica",
            fontSize=6.4,
            leading=7.1,
            textColor=TEXT,
        ),
        "cell_bold": ParagraphStyle(
            "cell_bold",
            fontName="Helvetica-Bold",
            fontSize=6.4,
            leading=7.1,
            textColor=TEXT,
        ),
        "section": ParagraphStyle(
            "section",
            fontName="Helvetica-Bold",
            fontSize=10,
            leading=11,
            textColor=ACCENT,
            spaceBefore=3,
            spaceAfter=2,
        ),
    }

    story = []

    # Seite 1: Check-in
    story.append(para("Check-in | Dienstag 23.06.2026", styles["title"]))
    story.append(
        para(
            "Kurzlegende: R = Readiness 1-5. MK = Muskelkater. Ret = Returner N/J/offen. "
            "A = Ampel G/Y/R. Nur notieren, was das heutige Training beeinflusst.",
            styles["meta"],
        )
    )
    story.append(
        para(
            "Red Flag: Kopfweh, Schwindel, Nackenschmerz, Kribbeln, Taubheit oder Concussion-Verdacht = Rot, kein normales Training, medizinisch klaeren.",
            styles["red"],
        )
    )
    check_header = ["Nr", "Name", "Pos", "R", "Schlaf/Stress/MK", "Schmerz + Ort", "Ret", "A", "Limit heute"]
    check_rows = [[str(i), "", "", "", "", "", "", "", ""] for i in range(1, 21)]
    check_table = make_table(
        [[para(c, styles["cell_bold"]) for c in check_header]]
        + [[para(c, styles["cell"]) for c in row] for row in check_rows],
        [9 * mm, 38 * mm, 17 * mm, 9 * mm, 34 * mm, 54 * mm, 15 * mm, 10 * mm, 76 * mm],
        [6.6 * mm] + [7.35 * mm] * 20,
    )
    story.append(check_table)
    story.append(Spacer(1, 3))
    story.append(
        para(
            "Startentscheidung: Gruen = normal. Gelb = reduzieren/technisch. Rot = raus aus normalem Training oder medizinisch klaeren.",
            styles["meta"],
        )
    )

    story.append(PageBreak())

    # Seite 2: Beobachtung und Nachbereitung
    story.append(para("Beobachtung + Nachbereitung | Dienstag 23.06.2026", styles["title"]))
    story.append(
        para(
            "Nur Auffaelligkeiten eintragen. Wenn alles sauber ist, leer lassen. Ziel: nach der Einheit wissen, wer reduziert, beobachtet oder geklaert werden muss.",
            styles["meta"],
        )
    )

    story.append(
        para(
            "Nachholer: Artur MB + Ballgewicht | Christopher/David BJ nur wenn Landung sauber | "
            "D'Amore 9.5 m korrigieren | ACL-Returner kein Jump/Sprint/COD.",
            styles["red"],
        )
    )

    story.append(para("Beobachtung pro Spieler", styles["section"]))
    obs_header = ["Nr", "Name", "Track / Accel", "Kraft / Carry", "Nachholer / Limit", "sRPE", "Pain/Issue / KW27"]
    obs_rows = [[str(i), "", "", "", "", "", ""] for i in range(1, 21)]
    obs_table = make_table(
        [[para(c, styles["cell_bold"]) for c in obs_header]]
        + [[para(c, styles["cell"]) for c in row] for row in obs_rows],
        [9 * mm, 34 * mm, 50 * mm, 50 * mm, 43 * mm, 16 * mm, 60 * mm],
        [6.0 * mm] + [7.0 * mm] * 20,
    )
    story.append(obs_table)

    story.append(Spacer(1, 3))
    story.append(
        para(
            "Coach-Nachbereitung: Anwesend __ | G/Y/R __/__/__ | Returner/offen __ | Nachholtests gemacht? __ | KW27 anpassen: ____________________",
            styles["meta"],
        )
    )

    doc.build(story)


if __name__ == "__main__":
    build_pdf()
