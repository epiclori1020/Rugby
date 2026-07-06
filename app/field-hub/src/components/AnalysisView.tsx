import { BarChart3, CalendarDays, Database, Eye, MessageSquareText, SlidersHorizontal, TrendingUp, Wrench } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { positionGroupOptions } from '../config/labels'
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
import type { Player } from '../domain/players'
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

function clusterLabel(cluster: AnalysisClusterFilter) {
  if (cluster === 'all') {
    return 'Alle Cluster'
  }

  return positionGroupOptions.find((option) => option.value === cluster)?.label ?? cluster
}

function rangeLabel(rangeWeeks: AnalysisRangeWeeks) {
  return rangeOptions.find((option) => option.value === rangeWeeks)?.label ?? `${rangeWeeks} Wochen`
}

function readinessTrendLabel(trend: number | null | undefined) {
  if (trend === null || trend === undefined) {
    return 'kein lokaler Trend'
  }

  return trend > 0 ? `+${trend}` : String(trend)
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
  const latestWeek = summary?.weeklySummaries.at(-1) ?? null
  const openPlannedBlocks = plannedVsActual?.open ?? 0
  const changedPlannedBlocks =
    (plannedVsActual?.changed ?? 0) + (plannedVsActual?.reduced ?? 0) + (plannedVsActual?.skipped ?? 0)
  const completedExposureTotal =
    summary?.weeklyExposureSummaries.reduce((total, week) => total + week.completed, 0) ?? 0
  const reducedExposureTotal = summary?.weeklyExposureSummaries.reduce((total, week) => total + week.reduced, 0) ?? 0
  const skippedExposureTotal = summary?.weeklyExposureSummaries.reduce((total, week) => total + week.skipped, 0) ?? 0
  const activeFilterChips = [
    `Zeitraum: ${rangeLabel(rangeWeeks)}`,
    `Cluster: ${clusterLabel(cluster)}`,
    `Position: ${position === 'all' ? 'Alle Positionen' : position}`,
    `Exposure: ${exposureLabels[exposureType]}`,
  ]
  const analysisQuestions = [
    {
      icon: <Eye className="nav-icon" aria-hidden />,
      label: 'Beobachten',
      question: 'Was faellt im Verlauf auf?',
      value: latestWeek ? `${formatNumber(latestWeek.attendanceRate, '%')} Attendance` : '-',
      detail: latestWeek
        ? `Letzte lokale Woche: Readiness ${formatNumber(latestWeek.readinessAverage)}, Trend ${readinessTrendLabel(latestWeek.readinessTrend)}.`
        : 'Noch keine lokale Wochenhistorie im gewaehlten Zeitraum.',
    },
    {
      icon: <Wrench className="nav-icon" aria-hidden />,
      label: 'Modifizieren',
      question: 'Was muss fuer die naechste Einheit angepasst werden?',
      value: loadSpikeAdvisory ? `${loadSpikeAdvisory.ratio}x Load` : summary ? `${changedPlannedBlocks} Anpassungen` : '-',
      detail:
        !summary
          ? 'Nach Login werden lokale Load- und Blockdaten fuer diese Frage genutzt.'
          : (loadSpikeAdvisory?.message ??
            (changedPlannedBlocks > 0
              ? `${changedPlannedBlocks} reduzierte, geaenderte oder gestrichene Bloecke im Zeitraum pruefen.`
              : 'Keine lokale Load-Spike- oder Blockanpassungsauffaelligkeit sichtbar.')),
    },
    {
      icon: <TrendingUp className="nav-icon" aria-hidden />,
      label: 'Steigern',
      question: 'Wo ist Progression plausibel?',
      value: summary ? `${completedExposureTotal} completed` : '-',
      detail:
        completedExposureTotal > 0
          ? `${reducedExposureTotal} reduced und ${skippedExposureTotal} skipped Exposures als Dosierungscheck danebenlegen.`
          : 'Progression erst bewerten, wenn genug lokale Exposure-Summaries vorhanden sind.',
    },
    {
      icon: <MessageSquareText className="nav-icon" aria-hidden />,
      label: 'Rueckmelden',
      question: 'Welche Quelle oder offene Aufgabe muss geprueft werden?',
      value: `${coachInsights.length} Insights`,
      detail:
        coachInsights.length > 0
          ? 'Coach Insights unten als Quellenliste pruefen und bei Bedarf in den passenden Arbeitsbereich springen.'
          : openPlannedBlocks > 0
            ? `${openPlannedBlocks} geplante Bloecke sind lokal noch offen.`
            : 'Keine offenen Coach Insights im Analyse-Kontext.',
    },
  ]

  return (
    <section className="analysis-layout" aria-labelledby="analysis-heading">
      <article className="panel analysis-intro-panel">
        <div className="analysis-intro-copy">
          <div className="status-line">
            <BarChart3 className="nav-icon" aria-hidden />
            <span>Auswertung zwischen Einheiten</span>
          </div>
          <div>
            <h3 id="analysis-heading">Analyse</h3>
            <p>
              Ruhiger Rueckblick fuer Planung, Dosierung und Quellenpruefung. Beim Oeffnen wird kein Remote-Pull
              gestartet und es entstehen keine Check-in- oder Trainingseintraege.
            </p>
          </div>
          <div className="analysis-filter-chips" aria-label="Aktive Analysefilter">
            {activeFilterChips.map((chip) => (
              <span className="analysis-filter-chip" key={chip}>
                {chip}
              </span>
            ))}
          </div>
        </div>
      </article>

      <article className="panel analysis-filter-panel">
        <div className="status-line">
          <SlidersHorizontal className="nav-icon" aria-hidden />
          <h3>Filter einstellen</h3>
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
              {positionGroupOptions.map((option) => (
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
            <span>Exposure-Art</span>
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
          historische Kaderstaende werden in dieser Ansicht nicht rekonstruiert.
        </p>
      </article>

      <section className="analysis-question-grid" aria-label="Coach-Fragen fuer die Auswertung">
        {analysisQuestions.map((card) => (
          <article className="panel analysis-question-card" key={card.label}>
            <div className="analysis-question-label">
              {card.icon}
              <span>{card.label}</span>
            </div>
            <h3>{card.question}</h3>
            <strong>{card.value}</strong>
            <p>{card.detail}</p>
          </article>
        ))}
      </section>

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
        <article className="panel analysis-kpi-panel">
          <div className="status-line">
            <BarChart3 className="nav-icon" aria-hidden />
            <h3>Kernwerte mit Kontext</h3>
          </div>
          <EmptyState>Nach Login werden lokale Analyse-Daten aus diesem Geraet angezeigt.</EmptyState>
        </article>
      ) : isLoading && !summary ? (
        <article className="panel analysis-kpi-panel">
          <div className="status-line">
            <BarChart3 className="nav-icon" aria-hidden />
            <h3>Kernwerte mit Kontext</h3>
          </div>
          <EmptyState>Lokale Analyse wird geladen.</EmptyState>
        </article>
      ) : summary ? (
        <>
          <article className="panel analysis-kpi-panel">
            <div className="status-line">
              <BarChart3 className="nav-icon" aria-hidden />
              <h3>Kernwerte mit Kontext</h3>
            </div>
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

          <article className="panel analysis-detail-panel">
            <div className="status-line">
              <CalendarDays className="nav-icon" aria-hidden />
              <h3>Wochenverlauf: Attendance, Readiness und Load</h3>
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
            <article className="panel analysis-detail-panel">
              <h3>Ampel-Verteilung als Beobachtung</h3>
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

            <article className="panel analysis-detail-panel">
              <h3>Planned vs Actual als Modifikationshinweis</h3>
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

          <article className="panel analysis-detail-panel">
            <h3>Exposures pro Woche als Progressionscheck</h3>
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

          <article className="panel analysis-detail-panel">
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
              Metrics und Exercise Results werden hier nur als Team-Datenabdeckung gezaehlt. Spieler-spezifische Charts bleiben im Spielerprofil.
            </p>
          </article>
        </>
      ) : null}
    </section>
  )
}
