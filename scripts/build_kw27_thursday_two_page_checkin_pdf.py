from __future__ import annotations

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import BaseDocTemplate, Frame, PageBreak, PageTemplate, Paragraph, Spacer, Table, TableStyle


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "print_pdfs" / "DONNERSTAG_2026-07-02_DRUCKEN"
OUT = OUT_DIR / "02_checkin_beobachtung_pflicht_2seiten.pdf"
OUT_CHECKIN = OUT_DIR / "02a_checkin_pflicht.pdf"
OUT_OBSERVATION = OUT_DIR / "02b_beobachtung_nachbereitung_pflicht.pdf"

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
    canvas.drawRightString(doc.pagesize[0] - doc.rightMargin, 5 * mm, f"Seite {doc.page}")
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
                ("ALIGN", (7, 0), (8, -1), "CENTER"),
            ]
        )
    )
    return table


def make_doc(path: Path, title: str) -> BaseDocTemplate:
    path.parent.mkdir(parents=True, exist_ok=True)
    doc = BaseDocTemplate(
        str(path),
        pagesize=PAGE_SIZE,
        leftMargin=MARGIN_X,
        rightMargin=MARGIN_X,
        topMargin=MARGIN_TOP,
        bottomMargin=MARGIN_BOTTOM,
        title=title,
        author="Arwin Farajpoory / Codex",
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="main")
    doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=footer)])
    return doc


def make_styles() -> dict[str, ParagraphStyle]:
    return {
        "title": ParagraphStyle("title", fontName="Helvetica-Bold", fontSize=14, leading=16, textColor=ACCENT, spaceAfter=3),
        "meta": ParagraphStyle("meta", fontName="Helvetica", fontSize=7.6, leading=8.8, textColor=TEXT, spaceAfter=2),
        "red": ParagraphStyle("red", fontName="Helvetica-Bold", fontSize=7.35, leading=8.4, textColor=RED, spaceAfter=3),
        "cell": ParagraphStyle("cell", fontName="Helvetica", fontSize=6.15, leading=6.8, textColor=TEXT),
        "cell_bold": ParagraphStyle("cell_bold", fontName="Helvetica-Bold", fontSize=6.15, leading=6.8, textColor=TEXT),
        "section": ParagraphStyle("section", fontName="Helvetica-Bold", fontSize=10, leading=11, textColor=ACCENT, spaceBefore=3, spaceAfter=2),
    }


def checkin_story(styles: dict[str, ParagraphStyle]) -> list:
    story = []
    story.append(para("Check-in | Donnerstag 02.07.2026", styles["title"]))
    story.append(
        para(
            "Kurzlegende: R = Readiness 1-5. MK = Muskelkater. Ret = Returner N/J/offen. "
            "A = Ampel G/Y/R. Cluster: Collision Forwards / Hybrid / Speed/Space Backs / offen.",
            styles["meta"],
        )
    )
    story.append(
        para(
            "Donnerstag-Regel: Primer, nicht leer machen. Kein Fly bei Gelb/Returner. Kopf/Nacken/Schwindel/neurologisch = Rot.",
            styles["red"],
        )
    )
    header = ["Nr", "Name", "Pos", "Cluster", "R", "MK / Di-Reaktion", "Schmerz + Ort", "Ret", "A", "Limit heute"]
    rows = [[str(i), "", "", "", "", "", "", "", "", ""] for i in range(1, 21)]
    story.append(
        make_table(
            [[para(c, styles["cell_bold"]) for c in header]]
            + [[para(c, styles["cell"]) for c in row] for row in rows],
            [8 * mm, 34 * mm, 15 * mm, 15 * mm, 8 * mm, 32 * mm, 43 * mm, 13 * mm, 9 * mm, 80 * mm],
            [6.6 * mm] + [7.35 * mm] * 20,
        )
    )
    story.append(Spacer(1, 3))
    story.append(
        para(
            "Startentscheidung: Gruen = normal. Gelb = kein Fly, Kraft 1-2 Saetze, Tempo streichen. Rot = kein normales Training.",
            styles["meta"],
        )
    )
    return story


def observation_story(styles: dict[str, ParagraphStyle]) -> list:
    story = []
    story.append(para("Beobachtung + Nachbereitung | Donnerstag 02.07.2026", styles["title"]))
    story.append(
        para(
            "Nur Auffaelligkeiten eintragen. Ziel: KW28 sauber starten und keine zweite Wochen-Lastspitze erzeugen.",
            styles["meta"],
        )
    )
    story.append(
        para(
            "Kuerzen: zuerst Tempo, dann Kraft-Zusatzsaetze, dann Power-Reps. Speed nur als kurze Qualitaet behalten.",
            styles["red"],
        )
    )

    story.append(para("Beobachtung pro Spieler", styles["section"]))
    header = ["Nr", "Name", "A-Skip / Track", "Speed Primer", "Kraftsignal", "Robustheit / Tempo", "sRPE", "Pain/Issue / KW28"]
    rows = [[str(i), "", "", "", "", "", "", ""] for i in range(1, 21)]
    story.append(
        make_table(
            [[para(c, styles["cell_bold"]) for c in header]]
            + [[para(c, styles["cell"]) for c in row] for row in rows],
            [8 * mm, 33 * mm, 43 * mm, 38 * mm, 40 * mm, 39 * mm, 14 * mm, 52 * mm],
            [6.0 * mm] + [7.0 * mm] * 20,
        )
    )
    story.append(Spacer(1, 3))
    story.append(
        para(
            "Coach-Nachbereitung: Anwesend __ | G/Y/R __/__/__ | Fly ja/nein __/__ | Tempo 0/6/8/Bike __ | "
            "A-Skip ok? __ | KW28 anpassen: ____________________",
            styles["meta"],
        )
    )
    return story


def build_pdf() -> None:
    styles = make_styles()
    make_doc(OUT, "KW27 Donnerstag Check-in Beobachtung 2 Seiten 2026-07-02").build(
        checkin_story(styles) + [PageBreak()] + observation_story(styles)
    )
    make_doc(OUT_CHECKIN, "KW27 Donnerstag Check-in 2026-07-02").build(checkin_story(styles))
    make_doc(OUT_OBSERVATION, "KW27 Donnerstag Beobachtung Nachbereitung 2026-07-02").build(observation_story(styles))


if __name__ == "__main__":
    build_pdf()
