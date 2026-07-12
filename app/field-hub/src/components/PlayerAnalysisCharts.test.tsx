import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { PlayerAnalysisSummary } from '../domain/playerAnalysis'
import { LoadAnalysis } from './PlayerAnalysisCharts'

const analysis: PlayerAnalysisSummary = {
  attendance: [],
  readiness: [],
  painScores: [],
  painLocations: [],
  load: [
    {
      sessionLogId: 'log-1',
      sessionDefinitionId: 'session-1',
      sessionDate: '2026-06-16',
      table: 'player_session_entries',
      recordId: 'entry-1',
      correctionTarget: 'nachbereitung',
      label: 'sRPE Load',
      value: { sessionRpe: 6, durationMinutes: 77, sessionLoad: 462 },
    },
  ],
  rollingLoad: [
    { label: '7d', total: 462, entryCount: 3 },
    { label: '28d', total: 1480, entryCount: 8 },
  ],
  metricsByKey: [],
  exercisesByKey: [],
  exposures: [],
  exposureGaps: [],
  returner: [],
}

describe('PlayerAnalysisCharts', () => {
  it('uses the shared metric tile and tabular numeral treatment for rolling load', () => {
    const markup = renderToStaticMarkup(<LoadAnalysis analysis={analysis} />)

    expect((markup.match(/of-metric-tile/g) ?? []).length).toBeGreaterThanOrEqual(2)
    expect(markup).toContain('7d Belastung')
    expect(markup).toContain('28d Belastung')
    expect(markup).toContain('of-num')
    expect(markup).not.toContain('class="metric"')
  })
})
