import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { AnalysisWeeklyExposureSummary, AnalysisWeeklySummary } from '../domain/analysis'
import { AnalysisTrendCharts } from './AnalysisTrendCharts'

const weekly: AnalysisWeeklySummary[] = [
  { weekStart: '2026-06-01', weekLabel: 'ab 01.06.', sessionCount: 1, rosterSlotCount: 10, presentCount: 8, absentCount: 2, openCount: 0, attendanceRate: 80, readinessAverage: 3.8, readinessTrend: null, weeklyLoad: 0 },
  { weekStart: '2026-06-08', weekLabel: 'ab 08.06.', sessionCount: 2, rosterSlotCount: 20, presentCount: 18, absentCount: 2, openCount: 0, attendanceRate: 90, readinessAverage: 4.1, readinessTrend: 0.3, weeklyLoad: 1240 },
  { weekStart: '2026-06-15', weekLabel: 'ab 15.06.', sessionCount: 1, rosterSlotCount: 10, presentCount: 9, absentCount: 1, openCount: 0, attendanceRate: 90, readinessAverage: 4, readinessTrend: -0.1, weeklyLoad: 820 },
]

const exposures: AnalysisWeeklyExposureSummary[] = [
  { weekStart: '2026-06-01', weekLabel: 'ab 01.06.', completed: 0, reduced: 0, skipped: 0 },
  { weekStart: '2026-06-08', weekLabel: 'ab 08.06.', completed: 6, reduced: 2, skipped: 1 },
]

describe('AnalysisTrendCharts', () => {
  it('renders native accessible SVG charts and keeps exact values available as text', () => {
    const markup = renderToStaticMarkup(<AnalysisTrendCharts weekly={weekly} exposures={exposures} />)

    expect(markup).toContain('role="img"')
    expect(markup).toContain('Wöchentliche sRPE-Belastung von null bis 1.240')
    expect(markup).toContain('Belastung 1.240')
    expect(markup).toContain('Erledigt 6, reduziert 2, ausgelassen 1')
    expect(markup).toContain('analysis-trend-line')
    expect(markup).toContain('analysis-exposure-segment-completed')
    expect(markup).toContain('analysis-exposure-segment-reduced')
    expect(markup).toContain('analysis-exposure-segment-skipped')
    expect(markup).not.toContain('chart.js')
  })

  it('does not invent positive geometry for an all-zero exposure week', () => {
    const markup = renderToStaticMarkup(<AnalysisTrendCharts weekly={weekly.slice(0, 1)} exposures={exposures.slice(0, 1)} />)

    expect(markup).toContain('Keine Belastungsarten erfasst')
    expect(markup).not.toContain('analysis-exposure-segment-completed')
  })

  it('keeps every exposure bar inside the SVG viewport', () => {
    const markup = renderToStaticMarkup(<AnalysisTrendCharts weekly={weekly} exposures={exposures} />)
    const rects = [...markup.matchAll(/<rect[^>]+>/g)].map(([rect]) => ({
      width: Number(rect.match(/width="([^"]+)"/)?.[1]),
      x: Number(rect.match(/x="([^"]+)"/)?.[1]),
    }))

    expect(rects.length).toBeGreaterThan(0)
    expect(rects.every(({ width, x }) => x >= 0 && x + width <= 320)).toBe(true)
  })

  it('uses one calm empty state instead of two empty chart frames', () => {
    const markup = renderToStaticMarkup(<AnalysisTrendCharts weekly={[]} exposures={[]} />)

    expect(markup).toContain('Noch kein Belastungsverlauf')
    expect(markup).not.toContain('<svg')
    expect(markup).not.toContain('analysis-chart-figure')
  })
})
