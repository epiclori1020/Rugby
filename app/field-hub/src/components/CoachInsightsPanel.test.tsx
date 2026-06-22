// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { CoachInsight } from '../domain/coachInsights'
import { CoachInsightsPanel } from './CoachInsightsPanel'

const insight: CoachInsight = {
  id: 'coach-insight:missing_srpe_completed_session:entry-1',
  rule: 'missing_srpe_completed_session',
  severity: 'medium',
  title: 'sRPE fehlt',
  reason: 'Max war anwesend, aber sRPE ist noch offen.',
  targetTab: 'nachbereitung',
  correctionHint: 'In Nachbereitung sRPE nachtragen.',
  sources: [
    {
      playerId: 'player-1',
      playerName: 'Max',
      sessionLogId: 'log-1',
      sessionDefinitionId: 'session-1',
      sessionDate: '2026-06-16',
      table: 'player_session_entries',
      recordId: 'entry-1',
      correctionTarget: 'nachbereitung',
    },
  ],
}

describe('CoachInsightsPanel', () => {
  it('renders a quiet empty state', () => {
    const markup = renderToStaticMarkup(
      <CoachInsightsPanel
        emptyText="Keine offenen Coach Insights."
        insights={[]}
      />,
    )

    expect(markup).toContain('Keine offenen Coach Insights.')
    expect(markup).not.toContain('Warnung')
  })

  it('dismisses insights only in local panel state', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(<CoachInsightsPanel emptyText="Leer" insights={[insight]} />)
    })

    expect(container.textContent).toContain('sRPE fehlt')
    const dismissButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Ausblenden'),
    )
    await act(async () => {
      dismissButton?.click()
    })

    expect(container.textContent).not.toContain('sRPE fehlt')
    expect(container.textContent).toContain('Leer')

    root.unmount()
  })

  it('resets local dismissals when the view scope changes', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(<CoachInsightsPanel dismissKey="today:log-1" emptyText="Leer" insights={[insight]} />)
    })

    const dismissButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Ausblenden'),
    )
    await act(async () => {
      dismissButton?.click()
    })
    expect(container.textContent).not.toContain('sRPE fehlt')

    await act(async () => {
      root.render(<CoachInsightsPanel dismissKey="today:log-2" emptyText="Leer" insights={[insight]} />)
    })

    expect(container.textContent).toContain('sRPE fehlt')

    root.unmount()
  })

  it('opens a source when a source action is available', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)
    const onOpenSource = vi.fn()

    await act(async () => {
      root.render(<CoachInsightsPanel emptyText="Leer" insights={[insight]} onOpenSource={onOpenSource} />)
    })

    const sourceButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Quelle oeffnen'),
    )
    await act(async () => {
      sourceButton?.click()
    })

    expect(onOpenSource).toHaveBeenCalledWith(insight.sources[0])

    root.unmount()
  })
})
