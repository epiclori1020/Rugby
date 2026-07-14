import type { AnalysisWeeklyExposureSummary, AnalysisWeeklySummary } from '../domain/analysis'
import { EmptyState } from './ui'

type AnalysisTrendChartsProps = {
  weekly: AnalysisWeeklySummary[]
  exposures: AnalysisWeeklyExposureSummary[]
}

const chartWidth = 320
const chartHeight = 156
const plotTop = 16
const plotBottom = 118
const plotLeft = 28
const plotRight = 308

function formatNumber(value: number) {
  return Math.round(value).toLocaleString('de-AT').replace(/[\u00a0\u202f]/g, '.')
}

function xFor(index: number, length: number) {
  if (length <= 1) return (plotLeft + plotRight) / 2
  return plotLeft + (index / (length - 1)) * (plotRight - plotLeft)
}

function barCenterFor(index: number, length: number, width: number) {
  return Math.min(plotRight - width / 2, Math.max(plotLeft + width / 2, xFor(index, length)))
}

function yFor(value: number, max: number) {
  if (max <= 0) return plotBottom
  return plotBottom - (value / max) * (plotBottom - plotTop)
}

function compactLabelClass(index: number, length: number) {
  const midpoint = Math.floor((length - 1) / 2)
  return index === 0 || index === midpoint || index === length - 1
    ? 'analysis-chart-axis-label analysis-chart-axis-label-compact'
    : 'analysis-chart-axis-label'
}

function LoadTrend({ weeks }: { weeks: AnalysisWeeklySummary[] }) {
  const max = Math.max(0, ...weeks.map((week) => week.weeklyLoad))
  const points = weeks.map((week, index) => `${xFor(index, weeks.length)},${yFor(week.weeklyLoad, max)}`).join(' ')

  return (
    <figure className="analysis-chart-figure">
      <figcaption>
        <strong>Wöchentliche Belastung</strong>
        <span>sRPE-Summe, Achse beginnt bei null</span>
      </figcaption>
      <svg
        className="analysis-chart-svg"
        role="img"
        aria-label={`Wöchentliche sRPE-Belastung von null bis ${formatNumber(max)}`}
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
      >
        <line className="analysis-chart-gridline" x1={plotLeft} x2={plotRight} y1={plotBottom} y2={plotBottom} />
        <text className="analysis-chart-y-label" x={plotLeft} y={plotTop}>max {formatNumber(max)}</text>
        <text className="analysis-chart-y-label" x={plotLeft} y={plotBottom - 4}>0</text>
        {weeks.length > 1 ? <polyline className="analysis-trend-line" points={points} /> : null}
        {weeks.map((week, index) => (
          <g key={week.weekStart}>
            <circle className="analysis-trend-point" cx={xFor(index, weeks.length)} cy={yFor(week.weeklyLoad, max)} r="4" />
            <text className={compactLabelClass(index, weeks.length)} x={xFor(index, weeks.length)} y="142">
              {week.weekLabel}
            </text>
          </g>
        ))}
      </svg>
      <ul className="analysis-chart-values">
        {weeks.map((week) => <li key={week.weekStart}>{week.weekLabel}: Belastung {formatNumber(week.weeklyLoad)}</li>)}
      </ul>
    </figure>
  )
}

function ExposureBars({ weeks }: { weeks: AnalysisWeeklyExposureSummary[] }) {
  const totals = weeks.map((week) => week.completed + week.reduced + week.skipped)
  const max = Math.max(0, ...totals)
  const barWidth = weeks.length > 0 ? Math.min(38, 224 / weeks.length) : 0

  return (
    <figure className="analysis-chart-figure">
      <figcaption>
        <strong>Belastungsarten pro Woche</strong>
        <span>Erledigt, reduziert und ausgelassen</span>
      </figcaption>
      <div className="analysis-chart-legend" aria-label="Legende">
        <span><i className="analysis-chart-key completed" aria-hidden />Erledigt</span>
        <span><i className="analysis-chart-key reduced" aria-hidden />Reduziert</span>
        <span><i className="analysis-chart-key skipped" aria-hidden />Ausgelassen</span>
      </div>
      <svg
        className="analysis-chart-svg"
        role="img"
        aria-label={`Wöchentliche Belastungsarten, höchste Wochensumme ${formatNumber(max)}`}
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
      >
        <line className="analysis-chart-gridline" x1={plotLeft} x2={plotRight} y1={plotBottom} y2={plotBottom} />
        {weeks.map((week, index) => {
          const total = totals[index]
          const center = barCenterFor(index, weeks.length, barWidth)
          const x = center - barWidth / 2
          let cursor = plotBottom
          const segments = [
            { key: 'completed', value: week.completed },
            { key: 'reduced', value: week.reduced },
            { key: 'skipped', value: week.skipped },
          ] as const
          return (
            <g key={week.weekStart}>
              {total === 0 ? <title>Keine Belastungsarten erfasst</title> : null}
              {segments.map((segment) => {
                if (segment.value === 0 || max === 0) return null
                const height = (segment.value / max) * (plotBottom - plotTop)
                cursor -= height
                return <rect className={`analysis-exposure-segment-${segment.key}`} key={segment.key} x={x} y={cursor} width={barWidth} height={height} />
              })}
              <text className={compactLabelClass(index, weeks.length)} x={center} y="142">{week.weekLabel}</text>
            </g>
          )
        })}
      </svg>
      <ul className="analysis-chart-values">
        {weeks.map((week) => (
          <li key={week.weekStart}>
            {week.weekLabel}: Erledigt {week.completed}, reduziert {week.reduced}, ausgelassen {week.skipped}
          </li>
        ))}
      </ul>
    </figure>
  )
}

export function AnalysisTrendCharts({ exposures, weekly }: AnalysisTrendChartsProps) {
  if (weekly.length === 0 && exposures.length === 0) {
    return (
      <EmptyState
        appearance="inline"
        title="Noch kein Belastungsverlauf"
        body="Nach Check-in und Nachbereitung erscheinen hier Wochenbelastung und Belastungsarten."
      />
    )
  }

  return (
    <div className="analysis-trend-charts">
      <LoadTrend weeks={weekly} />
      <ExposureBars weeks={exposures} />
    </div>
  )
}
