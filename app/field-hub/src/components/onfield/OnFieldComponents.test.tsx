import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PrimaryButton, StatusChip, TrafficLightChip } from '../ui'
import { AthleteRow, OnFieldTopbar, ScoreboardStrip, SessionHeader, TaskQueueRow } from './index'

describe('Sprint 5 OnField component compositions', () => {
  it('renders a topbar with one action area and optional sync slot', () => {
    const markup = renderToStaticMarkup(
      <OnFieldTopbar
        eyebrow="Heute"
        title="Trainingstag"
        description="Check-in, Einheit und offene Aufgaben."
        actions={<PrimaryButton>Check-in starten</PrimaryButton>}
        syncStatus={<StatusChip tone="warning" label="2 offen" />}
      />,
    )

    expect(markup).toContain('Trainingstag')
    expect(markup).toContain('Check-in starten')
    expect(markup).toContain('2 offen')
    expect(markup).toContain('of-topbar-actions')
  })

  it('renders session context as summary, not analysis chart content', () => {
    const markup = renderToStaticMarkup(
      <SessionHeader
        title="KW28 Dienstag"
        subtitle="Feld · 19:00"
        meta={['U22', 'Rugby Preset']}
        metrics={[
          { label: 'Anwesend', value: '18' },
          { label: 'Offen', value: '3' },
        ]}
      />,
    )

    expect(markup).toContain('KW28 Dienstag')
    expect(markup).toContain('Anwesend')
    expect(markup).toContain('class="of-num"')
    expect(markup).not.toContain('chart')
  })

  it('keeps athletes as rows with status text and quick action', () => {
    const markup = renderToStaticMarkup(
      <AthleteRow
        name="Alex Beispiel"
        meta={['Back row', 'Returner']}
        readinessLabel="Status Gelb"
        readinessTone="yellow"
        trendLabel="Letzte Einheit"
        traffic={<TrafficLightChip tone="yellow" label="Gelb" reason="modifizieren" />}
        status={<StatusChip tone="info" label="Notiz offen" />}
        action={<PrimaryButton compact>Oeffnen</PrimaryButton>}
      />,
    )

    expect(markup).toContain('Alex Beispiel')
    expect(markup).toContain('Back row')
    expect(markup).toContain('Gelb')
    expect(markup).toContain('modifizieren')
    expect(markup).toContain('Status Gelb')
    expect(markup).toContain('Letzte Einheit')
    expect(markup).toContain('Oeffnen')
    expect(markup).toContain('of-athlete-row')
    expect(markup).toContain('of-readiness-dot-yellow')
  })

  it('renders a scoreboard strip with tabular primary metric semantics', () => {
    const markup = renderToStaticMarkup(
      <ScoreboardStrip
        primaryMetricId="present"
        metrics={[
          { id: 'squad', label: 'Kader', value: 20, tone: 'open' },
          { id: 'present', label: 'Anwesend', value: 14, tone: 'green' },
          { id: 'yellow', label: 'Gelb', value: 3, tone: 'yellow' },
          { id: 'red', label: 'Rot', value: 1, tone: 'red' },
          { id: 'returner', label: 'Returner', value: 2, tone: 'returner' },
        ]}
      />,
    )

    expect(markup).toContain('of-scoreboard-strip')
    expect(markup).toContain('of-scoreboard-cell-primary')
    expect(markup).toContain('of-num')
    expect(markup).toContain('Anwesend')
    expect(markup).toContain('Returner')
  })

  it('renders queue rows with visible tone and recovery action', () => {
    const markup = renderToStaticMarkup(
      <TaskQueueRow
        title="3 sRPE fehlen"
        detail="Vor Abschluss nachtragen."
        meta={['Nachbereitung', 'Pflichtwert']}
        tone="warning"
        action={<PrimaryButton compact>Nachtragen</PrimaryButton>}
      />,
    )

    expect(markup).toContain('3 sRPE fehlen')
    expect(markup).toContain('of-task-queue-row-warning')
    expect(markup).toContain('Nachtragen')
  })
})
