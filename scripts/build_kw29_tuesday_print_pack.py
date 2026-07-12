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
OUT_DIR = ROOT / "print_pdfs" / "DIENSTAG_2026-07-14_DRUCKEN"
OUT_TRAINING = OUT_DIR / "01_training_kompakt_pflicht.pdf"
OUT_COMBINED = OUT_DIR / "02_checkin_beobachtung_pflicht_2seiten.pdf"
OUT_CHECKIN = OUT_DIR / "02a_checkin_pflicht.pdf"
OUT_OBSERVATION = OUT_DIR / "02b_beobachtung_nachbereitung_pflicht.pdf"
OUT_DEEP = OUT_DIR / "03_deep_playbook_optional_ipad.pdf"

TRAINING_SRC = ROOT / "plans" / "offseason_coach_sheets" / "KW29_tuesday_training_compact_2026-07-14.md"
DEEP_SRC = ROOT / "docs" / "24_kw29_tuesday_deep_playbook_2026-07-14.styled.pdf"

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
        "meta": ParagraphStyle("meta", fontName="Helvetica", fontSize=7.25, leading=8.4, textColor=TEXT, spaceAfter=2),
        "red": ParagraphStyle("red", fontName="Helvetica-Bold", fontSize=7.05, leading=8.15, textColor=RED, spaceAfter=3),
        "cell": ParagraphStyle("cell", fontName="Helvetica", fontSize=5.8, leading=6.35, textColor=TEXT),
        "cell_bold": ParagraphStyle("cell_bold", fontName="Helvetica-Bold", fontSize=5.8, leading=6.35, textColor=TEXT),
        "section": ParagraphStyle("section", fontName="Helvetica-Bold", fontSize=9.5, leading=10.5, textColor=ACCENT, spaceBefore=2, spaceAfter=2),
    }


def checkin_story(styles: dict[str, ParagraphStyle]) -> list:
    story = [para("Check-in | Dienstag 14.07.2026", styles["title"])]
    story.append(
        para(
            "R = Readiness 1-5. MK = Muskelkater 0-10. A = Ampel G/Y/R. "
            "Cluster: CF / HY / SB. Einziger deutlicher Hauptregler heute: Kraftintensitaet. Vorab rollierend ab ca. 18:50 beginnen.",
            styles["meta"],
        )
    )
    story.append(
        para(
            "Kopf/Nacken/Schwindel/neurologisch/Concussion-Verdacht = sofort raus, medizinisch abklaeren, keine Rueckkehr am selben Tag. "
            "Gelb: Speed/Volumen 30-50 % runter, Kraft 2 Saetze @ RPE 5-6, kein HY-Reaccel, kein Conditioning.",
            styles["red"],
        )
    )

    header = ["Nr", "Name", "Pos/Cl.", "R", "MK", "Schmerz + Ort", "09.07-Reaktion / Life Load", "Ret/Limit", "A", "Entscheidung heute"]
    rows = [[str(i), "", "", "", "", "", "", "", "", ""] for i in range(1, 21)]
    story.append(
        make_table(
            [[para(c, styles["cell_bold"]) for c in header]]
            + [[para(c, styles["cell"]) for c in row] for row in rows],
            [8 * mm, 31 * mm, 16 * mm, 8 * mm, 9 * mm, 39 * mm, 49 * mm, 27 * mm, 9 * mm, 81 * mm],
            [6.4 * mm] + [7.25 * mm] * 20,
        )
    )
    story.append(Spacer(1, 3))
    story.append(
        para(
            "Gruene ohne Aenderung nicht einzeln interviewen. Code: normal | Speed red. | kein Reaccel | Kraft 2x4 | kein Cond. | Returner-Cap | klaeren.",
            styles["meta"],
        )
    )
    return story


def observation_story(styles: dict[str, ParagraphStyle]) -> list:
    story = [para("Beobachtung + Nachbereitung | Dienstag 14.07.2026", styles["title"])]
    story.append(
        para(
            "Hauptlift immer dokumentieren. Sonst nur Auffaelligkeiten, Regressionen und reale Dosis eintragen. "
            "Direkt pro Spieler nur sRPE und Pain/Issue. Dauer einmal; KI, Conditioning und reale Dosis danach aus Coach-Entscheidungen ergaenzen.",
            styles["meta"],
        )
    )
    story.append(
        para(
            "Kuerzen: optionales Conditioning, Cluster verkuerzen, Power reduzieren; Kraft lieber zwei saubere Saetze. "
            "Ab 15 Spielern Pod B/C je 2 Saetze; Pod A 3x4 nur bei sauberem Lane-Durchlauf.",
            styles["red"],
        )
    )

    story.append(para("Beobachtung pro Spieler", styles["section"]))
    header = ["Nr", "Name", "Speed gemacht", "Jump/MB", "Hauptlift Last", "Saetze/Reps/RPE", "Cluster", "Cond.", "sRPE direkt", "Pain/Do-Schritt"]
    rows = [[str(i), "", "", "", "", "", "", "", "", ""] for i in range(1, 21)]
    story.append(
        make_table(
            [[para(c, styles["cell_bold"]) for c in header]]
            + [[para(c, styles["cell"]) for c in row] for row in rows],
            [8 * mm, 28 * mm, 31 * mm, 25 * mm, 32 * mm, 35 * mm, 31 * mm, 14 * mm, 35 * mm, 40 * mm],
            [5.8 * mm] + [6.75 * mm] * 20,
        )
    )
    story.append(Spacer(1, 3))
    story.append(
        para(
            "Coach-Review: Anwesend __ | G/Y/R __/__/__ | CF/HY/SB __/__/__ | 3x4 @ RPE7 __ | "
            "Kraft reduziert __ | Cluster reduziert __ | KI 0/1 __/__ | Cond. 0/1 __ | sRPE Bereich __ | "
            "neue Pain/Issue __ | Donnerstag reduzieren/Ruecksprache: ____________________",
            styles["meta"],
        )
    )
    return story


def build_checkin_pdfs() -> None:
    styles = make_styles()
    make_doc(OUT_COMBINED, "KW29 Dienstag Check-in Beobachtung 2 Seiten 2026-07-14").build(
        checkin_story(styles) + [PageBreak()] + observation_story(styles)
    )
    make_doc(OUT_CHECKIN, "KW29 Dienstag Check-in 2026-07-14").build(checkin_story(styles))
    make_doc(OUT_OBSERVATION, "KW29 Dienstag Beobachtung Nachbereitung 2026-07-14").build(observation_story(styles))


def build_pack() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    build_markdown_pdf(TRAINING_SRC, OUT_TRAINING, "landscape")
    build_checkin_pdfs()
    if not DEEP_SRC.exists():
        raise FileNotFoundError(DEEP_SRC)
    shutil.copyfile(DEEP_SRC, OUT_DEEP)


if __name__ == "__main__":
    build_pack()
