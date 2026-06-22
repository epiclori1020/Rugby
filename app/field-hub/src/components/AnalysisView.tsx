import { BarChart3, CalendarDays, Database, SlidersHorizontal } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { SessionDefinition } from '../content/types'
import {
  analysisStartDateForRange,
  buildTeamAnalysisSummary,
  type AnalysisClusterFilter,
  type AnalysisExposureFilter,
  type AnalysisFilters,
  type AnalysisRangeWeeks,
  type TeamAnalysisSummary,
} from '../domain/analysis'
import type { PlayerSessionEntry, SessionLog } from '../domain/checkIn'
import type { CoachInsight, CoachInsightSource } from '../domain/coachInsights'
import { exposureTypes } from '../domain/exposures'
import type { PlayerExposureSummary } from '../domain/exposures'
import type { ExerciseResult } from '../domain/exercises'
import type { MetricResult } from '../domain/metrics'
import { clusterOptions, type Player } from '../domain/players'
import type { SessionBlockLog } from '../domain/sessionBlocks'
import { localDb } from '../lib/localDb'
import { CoachInsightsPanel } from './CoachInsightsPanel'

type AnalysisViewProps = {
  coachInsights: CoachInsight[]
  onOpenCoachInsightSource?: (source: CoachInsightSource) => void
  players: Player[]
  sessions: SessionDefinition[]
  todayKey: string
  userId: string | null
}

type AnalysisLocalData = {
  sessionLogs: SessionLog[]
  entries: PlayerSessionEntry[]
  sessionBlockLogs: SessionBlockLog[]
  exposureSummaries: PlayerExposureSummary[]
  metricResults: MetricResult[]
  exerciseResults: ExerciseResult[]
}

const rangeOptions: Array<{ value: AnalysisRangeWeeks; label: string }> = [
  { value: 8, label: 'Letzte 8 Wochen' },
  { value: 4, label: 'Letzte 4 Wochen' },
]

const trafficLabels = {
  green: 'Gruen',
  yellow: 'Gelb',
  red: 'Rot',
} as const

const exposureLabels: Record<AnalysisExposureFilter, string> = {
  all: 'Alle Exposures',
  speed: 'Speed',
  acceleration: 'Acceleration',
  cod_decel: 'COD/Decel',
  lower_strength: 'Lower Strength',
  upper_strength: 'Upper Strength',
  power: 'Power',
  conditioning: 'Conditioning',
  contact_prep: 'Contact Prep',
  neck_trunk: 'Neck/Trunk',
  mobility: 'Mobility',
  reconditioning: 'Reconditioning',
}

function formatNumber(value: number | null, suffix = '') {
  return value === null ? '-' : `${value}${suffix}`
}

function formatLoad(value: number) {
  return Math.round(value).toLocaleString('de-AT')
}

function rollingLoadLabel(rollingLoad: TeamAnalysisSummary['rolling7dLoad']) {
  if (!rollingLoad) {
    return { value: '-', detail: 'keine Load-Eintraege' }
  }

  return {
    value: formatLoad(rollingLoad.total),
    detail: `${rollingLoad.entryCount} Load-Eintraege`,
  }
}

function maxValue(values: number[]) {
  return Math.max(1, ...values)
}

function BarValue({ value, max }: { value: number; max: number }) {
  const width = `${Math.round((value / max) * 100)}%`

  return (
    <span className="analysis-bar-track" aria-hidden>
      <span className="analysis-bar-fill" style={{ width }} />
    </span>
  )
}

function EmptyState({ children }: { children: string }) {
  return <p className="empty-state">{children}</p>
}

async function readAnalysisLocalData(userId: string, filters: AnalysisFilters): Promise<AnalysisLocalData> {
  const sessionLogs = await localDb.sessionLogs
    .where('userId')
    .equals(userId)
    .and((sessionLog) => sessionLog.date >= filters.startDate && sessionLog.date <= filters.endDate)
    .toArray()
  const sessionLogIds = sessionLogs.map((sessionLog) => sessionLog.id)
  const [entryGroups, blockLogGroups, metricGroups, exerciseGroups, exposureSummaries] = await Promise.all([
    Promise.all(
      sessionLogIds.map((sessionLogId) =>
        localDb.playerSessionEntries.where('[userId+sessionLogId]').equals([userId, sessionLogId]).toArray(),
      ),
    ),
    Promise.all(
      sessionLogIds.map((sessionLogId) =>
        localDb.sessionBlockLogs.where('[userId+sessionLogId]').equals([userId, sessionLogId]).toArray(),
      ),
    ),
    Promise.all(
      sessionLogIds.map((sessionLogId) =>
        localDb.metricResults.where('[userId+sessionLogId]').equals([userId, sessionLogId]).toArray(),
      ),
    ),
    Promise.all(
      sessionLogIds.map((sessionLogId) =>
        localDb.exerciseResults.where('[userId+sessionLogId]').equals([userId, sessionLogId]).toArray(),
      ),
    ),
    localDb.playerExposureSummaries
      .where('userId')
      .equals(userId)
      .and((summary) => summary.sessionDate >= filters.startDate && summary.sessionDate <= filters.endDate)
      .toArray(),
  ])

  return {
    sessionLogs,
    entries: entryGroups.flat(),
    sessionBlockLogs: blockLogGroups.flat(),
    exposureSummaries,
    metricResults: metricGroups.flat(),
    exerciseResults: exerciseGroups.flat(),
  }
}

export function AnalysisView({ coachInsights, onOpenCoachInsightSource, players, sessions, todayKey, userId }: AnalysisViewProps) {
  const [rangeWeeks, setRangeWeeks] = useState<AnalysisRangeWeeks>(8)
  const [cluster, setCluster] = useState<AnalysisClusterFilter>('all')
  const [position, setPosition] = useState('all')
  const [exposureType, setExposureType] = useState<AnalysisExposureFilter>('all')
  const [summary, setSummary] = useState<TeamAnalysisSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const filters = useMemo<AnalysisFilters>(
    () => ({
      startDate: analysisStartDateForRange(todayKey, rangeWeeks),
      endDate: todayKey,
      cluster,
      position,
      exposureType,
    }),
    [cluster, exposureType, position, rangeWeeks, todayKey],
  )
  const positionOptions = useMemo(() => {
    const positions = players
      .filter((player) => player.active && !player.deletedAt && player.position.trim().length > 0)
      .map((player) => player.position)
      .filter((value, index, values) => values.indexOf(value) === index)
      .sort((a, b) => a.localeCompare(b, 'de-AT'))

    return positions
  }, [players])

  const refreshAnalysis = useCallback(async () => {
    if (!userId) {
      setSummary(null)
      setErrorMessage(null)
      return
    }

    setIsLoading(true)
    try {
      setErrorMessage(null)
      const localData = await readAnalysisLocalData(userId, filters)
      setSummary(
        buildTeamAnalysisSummary({
          players,
          sessionDefinitions: sessions,
          filters,
          ...localData,
        }),
      )
    } catch (caughtError) {
      setErrorMessage(caughtError instanceof Error ? caughtError.message : 'Analyse konnte nicht geladen werden.')
    } finally {
      setIsLoading(false)
    }
  }, [filters, players, sessions, userId])

  useEffect(() => {
    Promise.resolve()
      .then(refreshAnalysis)
      .catch(() => undefined)
  }, [refreshAnalysis])

  const rolling7d = rollingLoadLabel(summary?.rolling7dLoad ?? null)
  const rolling28d = rollingLoadLabel(summary?.rolling28dLoad ?? null)
  const loadSpikeAdvisory = summary?.loadSpikeAdvisory ?? null
  const weeklyLoadMax = maxValue(summary?.weeklySummaries.map((week) => week.weeklyLoad) ?? [])
  const exposureMax = maxValue(
    summary?.weeklyExposureSummaries.map((week) => week.completed + week.reduced + week.skipped) ?? [],
  )
  const totalTraffic =
    (summary?.trafficDistribution.green ?? 0) +
    (summary?.trafficDistribution.yellow ?? 0) +
    (summary?.trafficDistribution.red ?? 0)
  const plannedVsActual = summary?.plannedVsActual

  return (
    <section className="analysis-layout" aria-labelledby="analysis-heading">
      <article className="panel analysis-intro-panel">
        <div className="status-line">
          <BarChart3 className="nav-icon" aria-hidden />
          <div>
            <h3 id="analysis-heading">Team-Analyse</h3>
            <p>Lokale Auswertung fuer Planung zwischen Einheiten. Beim Oeffnen wird kein Remote-Pull gestartet.</p>
          </div>
        </div>
      </article>

      <article className="panel analysis-filter-panel">
        <div className="status-line">
          <SlidersHorizontal className="nav-icon" aria-hidden />
          <h3>Filter</h3>
        </div>
        <div className="analysis-filter-grid">
          <label className="inline-field">
            <span>Zeitraum</span>
            <select value={rangeWeeks} onChange={(event) => setRangeWeeks(Number(event.target.value) as AnalysisRangeWeeks)}>
              {rangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="inline-field">
            <span>Cluster</span>
            <select value={cluster} onChange={(event) => setCluster(event.target.value as AnalysisClusterFilter)}>
              <option value="all">Alle Cluster</option>
              {clusterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="inline-field">
            <span>Position</span>
            <select value={position} onChange={(event) => setPosition(event.target.value)}>
              <option value="all">Alle Positionen</option>
              {positionOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="inline-field">
            <span>Exposure Type</span>
            <select
              value={exposureType}
              onChange={(event) => setExposureType(event.target.value as AnalysisExposureFilter)}
            >
              <option value="all">Alle Exposures</option>
              {exposureTypes.map((type) => (
                <option key={type} value={type}>
                  {exposureLabels[type]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="privacy-note">
          Zeitraum: {filters.startDate} bis {filters.endDate}. Attendance nutzt den aktuell aktiven gefilterten Kader;
          historische Kaderstaende werden in Sprint 21 nicht rekonstruiert.
        </p>
      </article>

      <CoachInsightsPanel
        dismissKey={`analysis:${todayKey}`}
        emptyText="Keine offenen Coach Insights."
        insights={coachInsights}
        onOpenSource={onOpenCoachInsightSource}
      />

      {errorMessage ? (
        <article className="panel error-panel">
          <strong>Analyse nicht geladen</strong>
          <span>{errorMessage}</span>
        </article>
      ) : null}

      {!userId ? (
        <EmptyState>Nach Login werden lokale Analyse-Daten aus diesem Geraet angezeigt.</EmptyState>
      ) : isLoading && !summary ? (
        <EmptyState>Lokale Analyse wird geladen.</EmptyState>
      ) : summary ? (
        <>
          <article className="panel">
            <div className="metric-grid analysis-metrics">
              <div className="metric">
                <small>Gefilterter Kader</small>
                <strong>{summary.rosterSize}</strong>
                <small>aktive Spieler</small>
              </div>
              <div className="metric">
                <small>Sessions lokal</small>
                <strong>{summary.sessionCount}</strong>
                <small>im Zeitraum</small>
              </div>
              <div className="metric">
                <small>Rolling 7d Load</small>
                <strong>{rolling7d.value}</strong>
                <small>{rolling7d.detail}</small>
              </div>
              <div className="metric">
                <small>Rolling 28d Load</small>
                <strong>{rolling28d.value}</strong>
                <small>{rolling28d.detail}</small>
              </div>
              <div className={`metric analysis-advisory-${loadSpikeAdvisory?.level ?? 'none'}`}>
                <small>Load Spike</small>
                <strong>{loadSpikeAdvisory ? `${loadSpikeAdvisory.ratio}x` : '-'}</strong>
                <small>{loadSpikeAdvisory?.message ?? 'zu wenige lokale Load-Eintraege'}</small>
              </div>
            </div>
          </article>

          <article className="panel">
            <div className="status-line">
              <CalendarDays className="nav-icon" aria-hidden />
              <h3>Attendance, Readiness & Load pro Woche</h3>
            </div>
            {summary.weeklySummaries.length === 0 ? (
              <EmptyState>Keine lokalen Sessions im gewaehlten Zeitraum. Erst nach Check-in oder Nachbereitung entstehen Analysewerte.</EmptyState>
            ) : (
              <div className="analysis-table-wrap">
                <table className="analysis-table">
                  <thead>
                    <tr>
                      <th>Woche</th>
                      <th>Sessions</th>
                      <th>Anwesend</th>
                      <th>Abwesend</th>
                      <th>Offen</th>
                      <th>Attendance</th>
                      <th>Readiness</th>
                      <th>Trend</th>
                      <th>sRPE Load</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.weeklySummaries.map((week) => (
                      <tr key={week.weekStart}>
                        <td>{week.weekLabel}</td>
                        <td>{week.sessionCount}</td>
                        <td>{week.presentCount}</td>
                        <td>{week.absentCount}</td>
                        <td>{week.openCount}</td>
                        <td>{formatNumber(week.attendanceRate, '%')}</td>
                        <td>{formatNumber(week.readinessAverage)}</td>
                        <td>{week.readinessTrend === null ? '-' : week.readinessTrend > 0 ? `+${week.readinessTrend}` : week.readinessTrend}</td>
                        <td>
                          <BarValue value={week.weeklyLoad} max={weeklyLoadMax} />
                          <span>{formatLoad(week.weeklyLoad)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>

          <section className="analysis-two-column">
            <article className="panel">
              <h3>Ampel-Verteilung</h3>
              {totalTraffic === 0 ? (
                <EmptyState>Noch keine Ampelwerte im gefilterten Zeitraum.</EmptyState>
              ) : (
                <div className="analysis-distribution">
                  {(['green', 'yellow', 'red'] as const).map((trafficLight) => (
                    <div className={`analysis-distribution-row traffic-${trafficLight}`} key={trafficLight}>
                      <strong>{trafficLabels[trafficLight]}</strong>
                      <BarValue value={summary.trafficDistribution[trafficLight]} max={totalTraffic} />
                      <span>{summary.trafficDistribution[trafficLight]}</span>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article className="panel">
              <h3>Planned vs Actual Blocks</h3>
              <p className="privacy-note">
                Session-Level: Cluster- und Positionsfilter betreffen Spielerwerte, nicht geplante Session-Bloecke.
              </p>
              {!plannedVsActual || plannedVsActual.planned === 0 ? (
                <EmptyState>Keine geplanten Session-Bloecke fuer lokale Sessions im Zeitraum gefunden.</EmptyState>
              ) : (
                <div className="analysis-distribution">
                  {[
                    ['Erledigt', plannedVsActual.done],
                    ['Reduziert', plannedVsActual.reduced],
                    ['Geaendert', plannedVsActual.changed],
                    ['Gestrichen', plannedVsActual.skipped],
                    ['Offen', plannedVsActual.open],
                  ].map(([label, value]) => (
                    <div className="analysis-distribution-row" key={label}>
                      <strong>{label}</strong>
                      <BarValue value={Number(value)} max={plannedVsActual.planned} />
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </section>

          <article className="panel">
            <h3>Exposures pro Woche</h3>
            {summary.weeklyExposureSummaries.length === 0 ? (
              <EmptyState>
                Keine Exposure-Summaries im Zeitraum. Exposures entstehen in der Nachbereitung aus Blockstatus und Anwesenheit.
              </EmptyState>
            ) : (
              <div className="analysis-table-wrap">
                <table className="analysis-table">
                  <thead>
                    <tr>
                      <th>Woche</th>
                      <th>Completed</th>
                      <th>Reduced</th>
                      <th>Skipped</th>
                      <th>Gesamt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.weeklyExposureSummaries.map((week) => {
                      const total = week.completed + week.reduced + week.skipped

                      return (
                        <tr key={week.weekStart}>
                          <td>{week.weekLabel}</td>
                          <td>{week.completed}</td>
                          <td>{week.reduced}</td>
                          <td>{week.skipped}</td>
                          <td>
                            <BarValue value={total} max={exposureMax} />
                            <span>{total}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </article>

          <article className="panel">
            <div className="status-line">
              <Database className="nav-icon" aria-hidden />
              <h3>Datenabdeckung</h3>
            </div>
            <div className="metric-grid mini">
              <div className="metric">
                <small>Check-ins</small>
                <strong>{summary.dataCoverage.checkIns}</strong>
              </div>
              <div className="metric">
                <small>Blocklogs</small>
                <strong>{summary.dataCoverage.blockLogs}</strong>
              </div>
              <div className="metric">
                <small>Exposures</small>
                <strong>{summary.dataCoverage.exposureSummaries}</strong>
              </div>
              <div className="metric">
                <small>Metrics</small>
                <strong>{summary.dataCoverage.metricResults}</strong>
              </div>
              <div className="metric">
                <small>Exercises</small>
                <strong>{summary.dataCoverage.exerciseResults}</strong>
              </div>
            </div>
            <p className="privacy-note">
              Metrics und Exercise Results werden hier nur als Team-Datenabdeckung gezaehlt. Spieler-spezifische Charts bleiben Sprint 22.
            </p>
          </article>
        </>
      ) : null}
    </section>
  )
}
