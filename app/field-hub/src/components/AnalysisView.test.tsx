// @vitest-environment jsdom
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { SessionDefinition } from '../content/types'
import type { CoachInsight } from '../domain/coachInsights'
import type { Player } from '../domain/players'
import { AnalysisView } from './AnalysisView'

const player: Player = {
  id: 'player-1',
  userId: 'user-1',
  name: 'Max',
  position: 'Back Row',
  cluster: 'back_row',
  active: true,
  consentStatus: 'vorhanden',
  photoConsentStatus: 'not_asked',
  photoPath: null,
  photoUpdatedAt: null,
  returnerStatus: 'nein',
  notes: '',
  createdAt: '2026-06-16T18:00:00.000Z',
  updatedAt: '2026-06-16T18:00:00.000Z',
  deletedAt: null,
  clientUpdatedAt: '2026-06-16T20:00:00.000Z',
  syncStatus: 'synced',
  syncError: null,
}

const session: SessionDefinition = {
  id: 'session-1',
  date: '2026-06-16',
  kw: 'KW25',
  title: 'Dienstag',
  type: 'training',
  summary: '',
  primarySource: '',
  pdfRefs: [],
  goals: [],
  timeline: [],
  materials: [],
  safetyNotes: [],
  coachNotes: [],
  libraryRefs: [],
}

const insight: CoachInsight = {
  id: 'coach-insight:post_pain_missing_next_step:entry-1',
  rule: 'post_pain_missing_next_step',
  severity: 'high',
  title: 'Post-Pain ohne naechsten Schritt',
  reason: 'Max hat Post-Pain 4/10, aber E2 oder Next Step fehlt.',
  targetTab: 'nachbereitung',
  correctionHint: 'In Nachbereitung E2 oder Next Step setzen.',
  sources: [
    {
      playerId: player.id,
      playerName: player.name,
      sessionLogId: 'log-1',
      sessionDefinitionId: session.id,
      sessionDate: session.date,
      table: 'player_session_entries',
      recordId: 'entry-1',
      correctionTarget: 'nachbereitung',
    },
  ],
}

describe('AnalysisView coach insights', () => {
  it('renders the full coach insight list alongside analysis metadata', () => {
    const markup = renderToStaticMarkup(
      <AnalysisView
        coachInsights={[insight]}
        players={[player]}
        sessions={[session]}
        todayKey="2026-06-22"
        userId={null}
      />,
    )

    expect(markup).toContain('Team-Analyse')
    expect(markup).toContain('Coach Insights')
    expect(markup).toContain('Post-Pain ohne naechsten Schritt')
    expect(markup).toContain('Max')
  })
})
