from __future__ import annotations

import re
import shutil
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4, landscape, portrait
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageTemplate,
    Paragraph,
    PageBreak,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "print_pdfs"

# Eine einzige, zeitachsen-basierte Struktur.
# (Zielpfad innerhalb print_pdfs, Quell-Markdown, Orientierung)
TARGETS = [
    # 1 = diese Woche drucken (Di 16.06 + Do 18.06)
    ("1_DIESE_WOCHE_drucken/1_DIENSTAG_trainingsplan.pdf", "plans/offseason_coach_sheets/KW25_tuesday_training_plan_clear_2026-06-16.md", "landscape"),
    ("1_DIESE_WOCHE_drucken/2_COACH_SCRIPT_di_do.pdf", "templates/kw25_coach_script_2026-06-16_18.md", "portrait"),
    ("1_DIESE_WOCHE_drucken/3_DIENSTAG_checkin_3x.pdf", "templates/unit_1_simplified_player_checkin_values_2026-06-16.md", "landscape"),
    ("1_DIESE_WOCHE_drucken/4_DONNERSTAG_trainingsplan.pdf", "plans/offseason_coach_sheets/KW25_thursday_training_plan_clear_2026-06-18.md", "landscape"),
    ("1_DIESE_WOCHE_drucken/5_OPTIONAL_einwilligung_20x.pdf", "templates/unit_1_slim_consent_2026-06-16.md", "portrait"),
    ("1_DIESE_WOCHE_drucken/6_NOTFALL_admin_vor_dienstag.pdf", "templates/unit_1_admin_field_packet.md", "landscape"),

    # 2 = nachschlagen am iPad (nicht drucken)
    ("2_NACHSCHLAGEN_ipad_nicht_drucken/coach_card_dienstag.pdf", "templates/unit_1_simplified_coach_card_2026-06-16.md", "landscape"),
    ("2_NACHSCHLAGEN_ipad_nicht_drucken/detail_briefing.pdf", "templates/unit_1_coach_briefing_detailed_2026-06-16.md", "portrait"),
    ("2_NACHSCHLAGEN_ipad_nicht_drucken/spieler_briefing_handout.pdf", "templates/unit_1_player_briefing_2026-06-16.md", "portrait"),
    ("2_NACHSCHLAGEN_ipad_nicht_drucken/donnerstag_kompaktkarte.pdf", "plans/offseason_coach_sheets/KW25_unit_2_thursday_intro_simplified.md", "landscape"),
    ("2_NACHSCHLAGEN_ipad_nicht_drucken/variantenkarte_ABCD.pdf", "templates/session_variants_abcd_quick_card.md", "landscape"),
    ("2_NACHSCHLAGEN_ipad_nicht_drucken/exercise_pool_mapping.pdf", "templates/exercise_pool_offseason_mapping.md", "landscape"),

    # 3 = ab KW26 bis Urlaub (laufende Trainingstage)
    ("3_AB_KW26_BIS_URLAUB/kw25_27_field_cards.pdf", "plans/offseason_coach_sheets/kw25_27_one_page_field_cards.md", "landscape"),
    ("3_AB_KW26_BIS_URLAUB/kw28_31_field_cards.pdf", "plans/offseason_coach_sheets/kw28_31_one_page_field_cards.md", "landscape"),
    ("3_AB_KW26_BIS_URLAUB/progression_tracker_3x.pdf", "templates/progression_tracker_field_compact.md", "landscape"),
    ("3_AB_KW26_BIS_URLAUB/variantenkarte_ABCD.pdf", "templates/session_variants_abcd_quick_card.md", "landscape"),
    ("3_AB_KW26_BIS_URLAUB/exercise_pool_mapping.pdf", "templates/exercise_pool_offseason_mapping.md", "landscape"),
    ("3_AB_KW26_BIS_URLAUB/pre_august_gesamtueberblick.pdf", "plans/07_offseason_pre_august_quick_sheet.md", "landscape"),
    ("3_AB_KW26_BIS_URLAUB/detail_coach_cards_kw25_27_optional.pdf", "plans/offseason_coach_sheets/kw25_27_active_detailed_coach_cards.md", "landscape"),
    ("3_AB_KW26_BIS_URLAUB/detail_coach_cards_kw28_31_optional.pdf", "plans/offseason_coach_sheets/kw28_31_active_detailed_coach_cards.md", "landscape"),

    # 4 = Urlaub August (3.-24. August, Arwin weg)
    ("4_URLAUB_AUGUST/august_ablauf.pdf", "plans/08_august_transition_quick_sheet.md", "landscape"),
    ("4_URLAUB_AUGUST/august_remote_feedback.pdf", "templates/august_remote_feedback_sheet.md", "landscape"),

    # Archiv = alte Testtag-/Langfassungen, nicht drucken
    ("_ARCHIV_nicht_drucken/alt_unit_1_one_pager.pdf", "templates/unit_1_one_pager.md", "landscape"),
    ("_ARCHIV_nicht_drucken/alt_baseline_test_data_sheet.pdf", "templates/baseline_test_data_sheet.md", "landscape"),
    ("_ARCHIV_nicht_drucken/alt_lange_datenschutzvorlage.pdf", "templates/data_protection_consent_template.md", "portrait"),
    ("_ARCHIV_nicht_drucken/alt_kw25_31_field_cards_compact.pdf", "plans/offseason_coach_sheets/kw25_31_field_cards_compact.md", "landscape"),
    ("_ARCHIV_nicht_drucken/alt_kw25_27_workbook.pdf", "plans/offseason_coach_sheets/kw25_27_print_workbook.md", "landscape"),
    ("_ARCHIV_nicht_drucken/alt_kw28_31_workbook.pdf", "plans/offseason_coach_sheets/kw28_31_print_workbook.md", "landscape"),
    ("_ARCHIV_nicht_drucken/alt_baseline_protokoll_field.pdf", "templates/baseline_test_protocol_unit_1_field_sheet.md", "landscape"),
    ("_ARCHIV_nicht_drucken/alt_baseline_protokoll_detail.pdf", "templates/baseline_test_protocol_unit_1.md", "landscape"),
]


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


def page_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(colors.HexColor("#666666"))
    canvas.drawRightString(doc.pagesize[0] - doc.rightMargin, 8 * mm, f"Seite {doc.page}")
    canvas.restoreState()


def build_pdf(src: Path, dst: Path, orientation: str):
    page_size = landscape(A4) if orientation == "landscape" else portrait(A4)
    margin = 10 * mm if orientation == "landscape" else 13 * mm

    doc = BaseDocTemplate(
        str(dst),
        pagesize=page_size,
        leftMargin=margin,
        rightMargin=margin,
        topMargin=10 * mm,
        bottomMargin=12 * mm,
        title=src.stem,
        author="Codex export",
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
    doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=page_footer)])

    base = getSampleStyleSheet()
    styles = {
        "h1": ParagraphStyle("h1", parent=base["Heading1"], fontName="Helvetica-Bold", fontSize=15, leading=18, spaceBefore=3, spaceAfter=7),
        "h2": ParagraphStyle("h2", parent=base["Heading2"], fontName="Helvetica-Bold", fontSize=12, leading=14, spaceBefore=8, spaceAfter=5),
        "h3": ParagraphStyle("h3", parent=base["Heading3"], fontName="Helvetica-Bold", fontSize=10.5, leading=13, spaceBefore=6, spaceAfter=4),
        "body": ParagraphStyle("body", parent=base["BodyText"], fontName="Helvetica", fontSize=8.2, leading=10.2, spaceAfter=3, alignment=TA_LEFT),
        "small": ParagraphStyle("small", parent=base["BodyText"], fontName="Helvetica", fontSize=7.2, leading=8.8, spaceAfter=2),
        "bullet": ParagraphStyle("bullet", parent=base["BodyText"], fontName="Helvetica", fontSize=8.0, leading=10.0, leftIndent=10, bulletIndent=3, spaceAfter=2),
        "code": ParagraphStyle("code", parent=base["Code"], fontName="Courier", fontSize=7.0, leading=8.4, leftIndent=6, backColor=colors.HexColor("#f4f4f4"), borderPadding=3),
    }

    lines = src.read_text(encoding="utf-8").splitlines()
    story = []
    i = 0
    in_code = False
    code_lines: list[str] = []

    while i < len(lines):
        line = lines[i].rstrip()
        stripped = line.strip()

        if stripped.startswith("```"):
            if in_code:
                if code_lines:
                    story.append(Paragraph(esc("<br/>".join(code_lines)), styles["code"]))
                    story.append(Spacer(1, 3))
                code_lines = []
                in_code = False
            else:
                in_code = True
            i += 1
            continue

        if in_code:
            code_lines.append(line)
            i += 1
            continue

        if not stripped:
            story.append(Spacer(1, 3))
            i += 1
            continue

        if stripped == "---":
            story.append(Spacer(1, 4))
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
                para_rows = [[Paragraph(esc(c), styles["small"]) for c in r] for r in normalized]
                col_width = doc.width / col_count
                table = Table(para_rows, colWidths=[col_width] * col_count, repeatRows=1)
                table.setStyle(
                    TableStyle(
                        [
                            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e9ecef")),
                            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                            ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#999999")),
                            ("VALIGN", (0, 0), (-1, -1), "TOP"),
                            ("LEFTPADDING", (0, 0), (-1, -1), 3),
                            ("RIGHTPADDING", (0, 0), (-1, -1), 3),
                            ("TOPPADDING", (0, 0), (-1, -1), 2),
                            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                        ]
                    )
                )
                story.append(table)
                story.append(Spacer(1, 5))
            continue

        if stripped.startswith("# "):
            if story:
                story.append(PageBreak())
            story.append(Paragraph(esc(stripped[2:]), styles["h1"]))
        elif stripped.startswith("## "):
            story.append(Paragraph(esc(stripped[3:]), styles["h2"]))
        elif stripped.startswith("### "):
            story.append(Paragraph(esc(stripped[4:]), styles["h3"]))
        elif stripped.startswith("- [ ]"):
            story.append(Paragraph(esc(stripped[5:].strip()), styles["bullet"], bulletText="☐"))
        elif stripped.startswith("- "):
            story.append(Paragraph(esc(stripped[2:].strip()), styles["bullet"], bulletText="•"))
        elif re.match(r"^\d+\.\s+", stripped):
            story.append(Paragraph(esc(stripped), styles["body"]))
        else:
            story.append(Paragraph(esc(stripped), styles["body"]))
        i += 1

    doc.build(story)


def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)

    for rel_out, src_rel, orientation in TARGETS:
        src = ROOT / src_rel
        if not src.exists():
            raise FileNotFoundError(src)
        dst = OUT / rel_out
        dst.parent.mkdir(parents=True, exist_ok=True)
        build_pdf(src, dst, orientation)

    # Platzhalter fuer den noch nicht ausgearbeiteten Wiedereinstiegsblock
    nach = OUT / "5_NACH_URLAUB_ab_kw35"
    nach.mkdir(parents=True, exist_ok=True)
    (nach / "LIESMICH.txt").write_text(
        "Wiedereinstiegsblock KW35-37 (nach dem Urlaub) wird noch erstellt.\n"
        "Sobald fertig, erscheinen hier die zugehoerigen PDFs.\n",
        encoding="utf-8",
    )

    # Manifest: Ordner-Logik + Quellenzuordnung
    lines = [
        "# print_pdfs - Uebersicht",
        "",
        "Diese Mappe wird von scripts/export_print_pdfs.py erzeugt.",
        "ACHTUNG: Jeder Export-Lauf loescht print_pdfs/ komplett und baut es neu auf.",
        "Lege hier KEINE eigenen Dateien von Hand ab - sie waeren beim naechsten Export weg.",
        "Inhalt aendern = die Markdown-Quelle bearbeiten, dann das Skript neu laufen lassen.",
        "",
        "Ordner-Logik (nach Zeitachse):",
        "- 1_DIESE_WOCHE_drucken/        = Di 16.06 + Do 18.06 ausdrucken",
        "- 2_NACHSCHLAGEN_ipad_nicht_drucken/ = Rueckhand am iPad, nicht drucken",
        "- 3_AB_KW26_BIS_URLAUB/         = laufende Trainingstage bis zum Urlaub",
        "- 4_URLAUB_AUGUST/              = 3.-24. August (Arwin weg)",
        "- 5_NACH_URLAUB_ab_kw35/        = Platzhalter, Block wird noch erstellt",
        "- _ARCHIV_nicht_drucken/        = alte Testtag-/Langfassungen, ignorieren",
        "",
        "PDF -> Quelle:",
        "",
    ]
    for rel_out, src_rel, _ in TARGETS:
        lines.append(f"{rel_out} <- {src_rel}")
    (OUT / "00_manifest.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(f"Exported {len(TARGETS)} PDFs to {OUT}")


if __name__ == "__main__":
    main()
