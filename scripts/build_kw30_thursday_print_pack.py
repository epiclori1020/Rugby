from __future__ import annotations

import shutil
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import BaseDocTemplate, Frame, PageBreak, PageTemplate, Paragraph, Spacer, Table, TableStyle

from export_print_pdfs import build_pdf as build_markdown_pdf


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "print_pdfs" / "DONNERSTAG_2026-07-23_DRUCKEN"
OUT_COMBINED = OUT_DIR / "02_checkin_beobachtung_pflicht_2seiten.pdf"
OUT_CHECKIN = OUT_DIR / "02a_checkin_pflicht.pdf"
OUT_OBSERVATION = OUT_DIR / "02b_beobachtung_nachbereitung_pflicht.pdf"
OUT_TRAINING = OUT_DIR / "01_training_kompakt_pflicht.pdf"
OUT_DEEP = OUT_DIR / "03_deep_playbook_optional_ipad.pdf"

TRAINING_SRC = ROOT / "plans" / "offseason_coach_sheets" / "KW30_thursday_training_compact_2026-07-23.md"
DEEP_SRC = ROOT / "docs" / "26_kw30_thursday_deep_playbook_2026-07-23.styled.pdf"

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
        "meta": ParagraphStyle("meta", fontName="Helvetica", fontSize=7.45, leading=8.7, textColor=TEXT, spaceAfter=2),
        "red": ParagraphStyle("red", fontName="Helvetica-Bold", fontSize=7.2, leading=8.3, textColor=RED, spaceAfter=3),
        "cell": ParagraphStyle("cell", fontName="Helvetica", fontSize=5.9, leading=6.55, textColor=TEXT),
        "cell_bold": ParagraphStyle("cell_bold", fontName="Helvetica-Bold", fontSize=5.9, leading=6.55, textColor=TEXT),
        "section": ParagraphStyle("section", fontName="Helvetica-Bold", fontSize=10, leading=11, textColor=ACCENT, spaceBefore=3, spaceAfter=2),
    }


def checkin_story(styles: dict[str, ParagraphStyle]) -> list:
    story = []
    story.append(para("Check-in | Donnerstag 23.07.2026", styles["title"]))
    story.append(
        para(
            "R = Readiness 1-5. MK = Muskelkater 0-10. Ret = Returner/Cap. A = Ampel G/Y/R. Cluster: CF / HY / SB. "
            "Rollierend ab ca. 18:50 beginnen; 0-5 Minuten nur Flags und Limits klaeren.",
            styles["meta"],
        )
    )
    story.append(
        para(
            "KW30-Entwicklungsreiz: Fly, COD, Kraft und BiP separat steuern; Dosen sind Obergrenzen, kein Nachholen. "
            "Kopf/Nacken/Schwindel/neurologisch = sofort raus; medizinisch abklaeren; kein Same-Day-Return.",
            styles["red"],
        )
    )
    header = ["Nr", "Name", "Cluster", "R", "MK", "Reaktion / Life Load", "Schmerz + Ort", "Ret / Cap", "A", "Entscheidung heute"]
    rows = [[str(i), "", "", "", "", "", "", "", "", ""] for i in range(1, 21)]
    story.append(
        make_table(
            [[para(c, styles["cell_bold"]) for c in header]]
            + [[para(c, styles["cell"]) for c in row] for row in rows],
            [8 * mm, 31 * mm, 18 * mm, 8 * mm, 8 * mm, 45 * mm, 39 * mm, 20 * mm, 8 * mm, 96 * mm],
            [6.6 * mm] + [7.35 * mm] * 20,
        )
    )
    story.append(Spacer(1, 3))
    story.append(
        para(
            "Gruene ohne Aenderung nicht einzeln interviewen. Code: normal | kein Fly | kein Reaccel | Speed red. | Kraft 2x4 | kein BiP | Ret-Cap | klaeren.",
            styles["meta"],
        )
    )
    return story


def observation_story(styles: dict[str, ParagraphStyle]) -> list:
    story = []
    story.append(para("Beobachtung + Nachbereitung | Donnerstag 23.07.2026", styles["title"]))
    story.append(
        para(
            "Reale Dosis und Auffaelligkeiten eintragen. Direkt pro Spieler nur sRPE und Pain/Issue; Dauer einmal, weitere Dosis danach ergaenzen.",
            styles["meta"],
        )
    )
    story.append(
        para(
            "Kuerzen: zuerst zweite BiP-Serie, dann Cluster, dann MB, dann Pod B/C. Speed-/Power-Qualitaet nicht durch hektische Wechsel opfern.",
            styles["red"],
        )
    )

    story.append(para("Beobachtung pro Spieler", styles["section"]))
    header = ["Nr", "Name", "Dribble / Speed", "Fly / HY-COD", "BJ / MB kg", "Hinge Last", "Saetze / RPE", "Cluster / BiP / KI", "sRPE / Pain / KW31"]
    rows = [[str(i), "", "", "", "", "", "", "", ""] for i in range(1, 21)]
    story.append(
        make_table(
            [[para(c, styles["cell_bold"]) for c in header]]
            + [[para(c, styles["cell"]) for c in row] for row in rows],
            [8 * mm, 27 * mm, 31 * mm, 29 * mm, 29 * mm, 31 * mm, 31 * mm, 45 * mm, 50 * mm],
            [6.0 * mm] + [7.0 * mm] * 20,
        )
    )
    story.append(Spacer(1, 3))
    story.append(
        para(
            "Coach-Review: Anwesend __ | G/Y/R __/__/__ | CF/HY/SB __/__/__ | Speed normal/red./0 __/__/__ | Fly 2 gute Reps __ | "
            "HY COD normal/Walk-in/0 __/__/__ | Hinge 3x4 @7 __ | A+ Satz __ | BiP 0/1/2 __/__/__ | KI 0/1 __/__ | sRPE __ | "
            "Pain-/Follow-up: ____________________ | KW31 normal/reduzieren/Ruecksprache: ____________________",
            styles["meta"],
        )
    )
    return story


def build_checkin_pdfs() -> None:
    styles = make_styles()
    make_doc(OUT_COMBINED, "KW30 Donnerstag Check-in Beobachtung 2 Seiten 2026-07-23").build(
        checkin_story(styles) + [PageBreak()] + observation_story(styles)
    )
    make_doc(OUT_CHECKIN, "KW30 Donnerstag Check-in 2026-07-23").build(checkin_story(styles))
    make_doc(OUT_OBSERVATION, "KW30 Donnerstag Beobachtung Nachbereitung 2026-07-23").build(observation_story(styles))


def build_pack() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    build_markdown_pdf(TRAINING_SRC, OUT_TRAINING, "landscape")
    build_checkin_pdfs()
    if not DEEP_SRC.exists():
        raise FileNotFoundError(DEEP_SRC)
    shutil.copyfile(DEEP_SRC, OUT_DEEP)


if __name__ == "__main__":
    build_pack()
