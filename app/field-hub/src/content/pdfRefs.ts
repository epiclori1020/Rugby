import type { PdfRef } from './types'

export const pdfRefs = {
  kw25TuesdayPlan: {
    label: 'Dienstag Trainingsplan',
    href: '/library/1_DIENSTAG_trainingsplan.pdf',
    sourcePath: 'plans/offseason_coach_sheets/KW25_tuesday_training_plan_clear_2026-06-16.md',
  },
  kw25CoachScript: {
    label: 'Coach-Skript Di/Do',
    href: '/library/2_COACH_SCRIPT_di_do.pdf',
    sourcePath: 'templates/kw25_coach_script_2026-06-16_18.md',
  },
  kw25ThursdayPlan: {
    label: 'Donnerstag Trainingsplan',
    href: '/library/4_DONNERSTAG_trainingsplan.pdf',
    sourcePath: 'plans/offseason_coach_sheets/KW25_thursday_training_plan_clear_2026-06-18.md',
  },
  consent: {
    label: 'Einwilligung 20x',
    href: '/library/5_OPTIONAL_einwilligung_20x.pdf',
    sourcePath: 'templates/unit_1_slim_consent_2026-06-16.md',
  },
  coachCardTuesday: {
    label: 'Coach Card Dienstag',
    href: '/library/coach_card_dienstag.pdf',
    sourcePath: 'templates/unit_1_simplified_coach_card_2026-06-16.md',
  },
  detailedBriefing: {
    label: 'Detail-Briefing',
    href: '/library/detail_briefing.pdf',
    sourcePath: 'templates/unit_1_coach_briefing_detailed_2026-06-16.md',
  },
  playerBriefing: {
    label: 'Spieler-Briefing',
    href: '/library/spieler_briefing_handout.pdf',
    sourcePath: 'templates/unit_1_player_briefing_2026-06-16.md',
  },
  thursdayCompact: {
    label: 'Donnerstag Kompaktkarte',
    href: '/library/donnerstag_kompaktkarte.pdf',
    sourcePath: 'plans/offseason_coach_sheets/KW25_unit_2_thursday_intro_simplified.md',
  },
  variants: {
    label: 'Variantenkarte A/B/C/D',
    href: '/library/variantenkarte_ABCD.pdf',
    sourcePath: 'templates/session_variants_abcd_quick_card.md',
  },
  exerciseMapping: {
    label: 'Exercise Pool Mapping',
    href: '/library/exercise_pool_mapping.pdf',
    sourcePath: 'templates/exercise_pool_offseason_mapping.md',
  },
  kw25To27Cards: {
    label: 'KW25-27 Field Cards',
    href: '/library/kw25_27_field_cards.pdf',
    sourcePath: 'plans/offseason_coach_sheets/kw25_27_one_page_field_cards.md',
  },
  kw28To31Cards: {
    label: 'KW28-31 Field Cards',
    href: '/library/kw28_31_field_cards.pdf',
    sourcePath: 'plans/offseason_coach_sheets/kw28_31_one_page_field_cards.md',
  },
  progressionTracker: {
    label: 'Progression Tracker',
    href: '/library/progression_tracker_3x.pdf',
    sourcePath: 'templates/progression_tracker_field_compact.md',
  },
  preAugustOverview: {
    label: 'Pre-August Gesamtueberblick',
    href: '/library/pre_august_gesamtueberblick.pdf',
    sourcePath: 'plans/07_offseason_pre_august_quick_sheet.md',
  },
} satisfies Record<string, PdfRef>

export const activePdfRefs = Object.values(pdfRefs)
