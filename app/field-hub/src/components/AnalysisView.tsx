import { BarChart3, CalendarDays, Database, Eye, MessageSquareText, SlidersHorizontal, TrendingUp, Wrench } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { useDelayedLoadingIndicator } from '../hooks/useDelayedLoadingIndicator'
import { AnalysisResultList } from './AnalysisResultList'
import { AnalysisTrendCharts } from './AnalysisTrendCharts'
import { CoachInsightsPanel } from './CoachInsightsPanel'
import { MetricTile } from './onfield'
import { EmptyState, ErrorState, PrimaryButton, SecondaryButton, Sheet, Skeleton } from './ui'

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

type AnalysisFilterSelection = {
  rangeWeeks: AnalysisRangeWeeks
  cluster: AnalysisClusterFilter
  position: string
  exposureType: AnalysisExposureFilter
}

const defaultFilterSelection: AnalysisFilterSelection = {
  rangeWeeks: 8,
  cluster: 'all',
  position: 'all',
  exposureType: 'all',
}

const rangeOptions: Array<{ value: AnalysisRangeWeeks; label: string }> = [
  { value: 8, label: 'Letzte 8 Wochen' },
  { value: 4, label: 'Letzte 4 Wochen' },
]

const trafficLabels = {
  green: 'Grün',
  yellow: 'Gelb',
  red: 'Rot',
} as const

const exposureLabels: Record<AnalysisExposureFilter, string> = {
  all: 'Alle Belastungsarten',
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
    return { value: '-', detail: 'keine Belastungseintraege' }
  }

  return {
    value: formatLoad(rollingLoad.total),
    detail: `${rollingLoad.entryCount} Belastungseintraege`,
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

type AnalysisFilterControlsProps = {
  filters: AnalysisFilterSelection
  onChange: (filters: AnalysisFilterSelection) => void
  positionOptions: string[]
  testIdSuffix?: string
}

function AnalysisFilterControls({ filters, onChange, positionOptions, testIdSuffix = '' }: AnalysisFilterControlsProps) {
  const testId = (name: string) => `analysis-${name}-filter${testIdSuffix}`

  return (
    <div className="analysis-filter-grid">
      <label className="inline-field">
        <span>Zeitraum</span>
        <select
          data-testid={testId('range')}
          value={filters.rangeWeeks}
          onChange={(event) => onChange({ ...filters, rangeWeeks: Number(event.target.value) as AnalysisRangeWeeks })}
        >
          {rangeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="inline-field">
        <span>Cluster</span>
        <select
          data-testid={testId('cluster')}
          value={filters.cluster}
          onChange={(event) => onChange({ ...filters, cluster: event.target.value as AnalysisClusterFilter })}
        >
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
        <select
          data-testid={testId('position')}
          value={filters.position}
          onChange={(event) => onChange({ ...filters, position: event.target.value })}
        >
          <option value="all">Alle Positionen</option>
          {positionOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <label className="inline-field">
        <span>Belastungsart</span>
        <select
          data-testid={testId('exposure')}
          value={filters.exposureType}
          onChange={(event) => onChange({ ...filters, exposureType: event.target.value as AnalysisExposureFilter })}
        >
          <option value="all">Alle Belastungsarten</option>
          {exposureTypes.map((type) => (
            <option key={type} value={type}>
              {exposureLabels[type]}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
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
  const [draftFilters, setDraftFilters] = useState<AnalysisFilterSelection>(defaultFilterSelection)
  const [appliedFilters, setAppliedFilters] = useState<AnalysisFilterSelection>(defaultFilterSelection)
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const [summary, setSummary] = useState<TeamAnalysisSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const requestIdRef = useRef(0)
  const showLoading = useDelayedLoadingIndicator(isLoading && !summary)
  const { cluster, exposureType, position, rangeWeeks } = appliedFilters
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

  function applyDraftFilters() {
    setAppliedFilters(draftFilters)
    setIsFilterSheetOpen(false)
  }

  function resetDraftFilters() {
    setDraftFilters(defaultFilterSelection)
  }

  const refreshAnalysis = useCallback(async () => {
    const requestId = ++requestIdRef.current
    if (!userId) {
      setSummary(null)
      setErrorMessage(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      setErrorMessage(null)
      const localData = await readAnalysisLocalData(userId, filters)
      if (requestId !== requestIdRef.current) return
      setSummary(
        buildTeamAnalysisSummary({
          players,
          sessionDefinitions: sessions,
          filters,
          ...localData,
        }),
      )
    } catch {
      if (requestId !== requestIdRef.current) return
      setErrorMessage('Lokale Analyse konnte nicht gelesen werden.')
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false)
    }
  }, [filters, players, sessions, userId])

  useEffect(() => {
    Promise.resolve()
      .then(refreshAnalysis)
      .catch(() => undefined)
    return () => { requestIdRef.current += 1 }
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
    `Belastungsart: ${exposureLabels[exposureType]}`,
  ]
  const analysisQuestions = [
    {
      icon: <Eye className="nav-icon" aria-hidden />,
      label: 'Beobachten',
      question: 'Was faellt im Verlauf auf?',
      value: latestWeek ? `${formatNumber(latestWeek.attendanceRate, '%')} Anwesenheit` : '-',
      detail: latestWeek
        ? `Letzte lokale Woche: Belastbarkeit ${formatNumber(latestWeek.readinessAverage)}, Trend ${readinessTrendLabel(latestWeek.readinessTrend)}.`
        : 'Noch keine lokale Wochenhistorie im gewählten Zeitraum.',
    },
    {
      icon: <Wrench className="nav-icon" aria-hidden />,
      label: 'Modifizieren',
      question: 'Was muss für die nächste Einheit angepasst werden?',
      value: loadSpikeAdvisory ? `${loadSpikeAdvisory.ratio}x Belastung` : summary ? `${changedPlannedBlocks} Anpassungen` : '-',
      detail:
        !summary
          ? 'Nach Login werden lokale Belastungs- und Blockdaten für diese Frage genutzt.'
          : (loadSpikeAdvisory?.message ??
            (changedPlannedBlocks > 0
              ? `${changedPlannedBlocks} reduzierte, geänderte oder gestrichene Blöcke im Zeitraum prüfen.`
              : 'Keine lokale Belastungsspitze oder auffällige Blockanpassung sichtbar.')),
    },
    {
      icon: <TrendingUp className="nav-icon" aria-hidden />,
      label: 'Steigern',
      question: 'Wo ist Progression plausibel?',
      value: summary ? `${completedExposureTotal} erledigt` : '-',
      detail:
        completedExposureTotal > 0
          ? `${reducedExposureTotal} reduziert und ${skippedExposureTotal} ausgelassen als Dosierungscheck danebenlegen.`
          : 'Progression erst bewerten, wenn genug lokale Belastungsübersichten vorhanden sind.',
    },
    {
      icon: <MessageSquareText className="nav-icon" aria-hidden />,
      label: 'Rückmelden',
      question: 'Welche Quelle oder offene Aufgabe muss geprüft werden?',
      value: `${coachInsights.length} Hinweise`,
      detail:
        coachInsights.length > 0
          ? 'Coach-Hinweise unten als Quellenliste prüfen und bei Bedarf in den passenden Arbeitsbereich springen.'
          : openPlannedBlocks > 0
            ? `${openPlannedBlocks} geplante Blöcke sind lokal noch offen.`
            : 'Keine offenen Coach-Hinweise im Analyse-Kontext.',
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
              Ruhiger Rückblick für Planung, Dosierung und Quellenprüfung. Beim Öffnen wird kein Remote-Pull
              gestartet und es entstehen keine Check-in- oder Trainingseinträge.
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

      <div className="analysis-compact-filter-trigger">
        <SecondaryButton onClick={() => setIsFilterSheetOpen(true)} icon={<SlidersHorizontal aria-hidden />}>
          Filter anpassen
        </SecondaryButton>
      </div>

      <article className="panel analysis-filter-panel analysis-filter-panel-expanded">
        <div className="status-line">
          <SlidersHorizontal className="nav-icon" aria-hidden />
          <h3>Filter einstellen</h3>
        </div>
        <AnalysisFilterControls filters={draftFilters} onChange={setDraftFilters} positionOptions={positionOptions} />
        <div className="analysis-filter-actions">
          <SecondaryButton onClick={resetDraftFilters}>Zurücksetzen</SecondaryButton>
          <PrimaryButton onClick={applyDraftFilters}>Filter anwenden</PrimaryButton>
        </div>
        <p className="privacy-note">
          Zeitraum: {filters.startDate} bis {filters.endDate}. Anwesenheit nutzt den aktuell aktiven gefilterten Kader;
          historische Kaderstände werden in dieser Ansicht nicht rekonstruiert.
        </p>
      </article>

      {isFilterSheetOpen ? (
        <Sheet
          title="Analysefilter anpassen"
          description="Filter werden erst nach dem Anwenden übernommen."
          onClose={() => setIsFilterSheetOpen(false)}
        >
          <div className="analysis-filter-sheet-content">
            <AnalysisFilterControls
              filters={draftFilters}
              onChange={setDraftFilters}
              positionOptions={positionOptions}
              testIdSuffix="-sheet"
            />
            <div className="analysis-filter-actions">
              <SecondaryButton onClick={resetDraftFilters}>Zurücksetzen</SecondaryButton>
              <PrimaryButton onClick={applyDraftFilters}>Filter anwenden</PrimaryButton>
            </div>
          </div>
        </Sheet>
      ) : null}

      <section className="analysis-question-grid" aria-label="Coach-Fragen für die Auswertung">
        {analysisQuestions.map((card) => (
          <article className="panel analysis-question-card" key={card.label}>
            <div className="analysis-question-label">
              {card.icon}
              <span>{card.label}</span>
            </div>
            <h3>{card.question}</h3>
            <strong className="of-num">{card.value}</strong>
            <p>{card.detail}</p>
          </article>
        ))}
      </section>

      <CoachInsightsPanel
        dismissKey={`analysis:${todayKey}`}
        emptyText="Keine offenen Coach-Hinweise."
        insights={coachInsights}
        onOpenSource={onOpenCoachInsightSource}
      />

      {errorMessage ? (
        <ErrorState
          appearance="inline"
          title="Analyse nicht geladen"
          body="Die vorhandene Auswertung bleibt sichtbar. Versuche das lokale Laden erneut."
          action={<SecondaryButton onClick={() => void refreshAnalysis()}>Erneut versuchen</SecondaryButton>}
        />
      ) : null}

      {!userId ? (
        <article className="panel analysis-kpi-panel">
          <div className="status-line">
            <BarChart3 className="nav-icon" aria-hidden />
            <h3>Kernwerte mit Kontext</h3>
          </div>
          <EmptyState appearance="inline" title="Coach-Login nötig" body="Nach dem Login werden lokale Analysedaten dieses Geräts angezeigt." />
        </article>
      ) : showLoading ? (
        <article className="panel analysis-kpi-panel">
          <div className="status-line">
            <BarChart3 className="nav-icon" aria-hidden />
            <h3>Kernwerte mit Kontext</h3>
          </div>
          <div className="analysis-loading-skeletons" aria-label="Lokale Analyse wird geladen" role="status">
            <Skeleton announce={false} variant="panel" />
            <Skeleton announce={false} variant="row" />
          </div>
        </article>
      ) : summary ? (
        <>
          <article className="panel analysis-kpi-panel">
            <div className="status-line">
              <BarChart3 className="nav-icon" aria-hidden />
              <h3>Kernwerte mit Kontext</h3>
            </div>
            <div className="metric-grid analysis-metrics">
              <MetricTile label="Gefilterter Kader" value={summary.rosterSize} detail="aktive Spieler" />
              <MetricTile label="Sessions lokal" value={summary.sessionCount} detail="im Zeitraum" />
              <MetricTile label="Belastung 7 Tage" value={rolling7d.value} detail={rolling7d.detail} />
              <MetricTile label="Belastung 28 Tage" value={rolling28d.value} detail={rolling28d.detail} />
              <MetricTile
                label="Belastungsspitze"
                value={loadSpikeAdvisory ? `${loadSpikeAdvisory.ratio}x` : '-'}
                detail={loadSpikeAdvisory?.message ?? 'zu wenige lokale Belastungseintraege'}
                tone={loadSpikeAdvisory?.level === 'high' ? 'danger' : loadSpikeAdvisory?.level === 'watch' ? 'warning' : 'neutral'}
              />
            </div>
          </article>

          <article className="panel analysis-detail-panel">
            <div className="status-line">
              <TrendingUp className="nav-icon" aria-hidden />
              <h3>Belastung und Dosierung im Verlauf</h3>
            </div>
            <AnalysisTrendCharts weekly={summary.weeklySummaries} exposures={summary.weeklyExposureSummaries} />
          </article>

          <article className="panel analysis-detail-panel">
            <div className="status-line">
              <CalendarDays className="nav-icon" aria-hidden />
              <h3>Wochenverlauf: Anwesenheit, Belastbarkeit und Belastung</h3>
            </div>
            {summary.weeklySummaries.length === 0 ? (
              <EmptyState appearance="inline" title="Noch kein Wochenverlauf" body="Erst nach Check-in oder Nachbereitung entstehen Analysewerte." />
            ) : (
              <AnalysisResultList
                ariaLabel="Wochenverlauf: Anwesenheit, Belastbarkeit und Belastung"
                columns={[
                  { key: 'week', label: 'Woche' },
                  { key: 'sessions', label: 'Sessions', numeric: true },
                  { key: 'present', label: 'Anwesend', numeric: true },
                  { key: 'absent', label: 'Abwesend', numeric: true },
                  { key: 'open', label: 'Offen', numeric: true },
                  { key: 'attendance', label: 'Anwesenheit', numeric: true },
                  { key: 'readiness', label: 'Belastbarkeit', numeric: true },
                  { key: 'trend', label: 'Trend', numeric: true },
                  { key: 'load', label: 'sRPE-Belastung', numeric: true },
                ]}
                rows={summary.weeklySummaries.map((week) => ({
                  id: week.weekStart,
                  cells: {
                    week: week.weekLabel,
                    sessions: week.sessionCount,
                    present: week.presentCount,
                    absent: week.absentCount,
                    open: week.openCount,
                    attendance: formatNumber(week.attendanceRate, '%'),
                    readiness: formatNumber(week.readinessAverage),
                    trend:
                      week.readinessTrend === null
                        ? '-'
                        : week.readinessTrend > 0
                          ? `+${week.readinessTrend}`
                          : week.readinessTrend,
                    load: (
                      <span className="analysis-result-load">
                        <BarValue value={week.weeklyLoad} max={weeklyLoadMax} />
                        <span>{formatLoad(week.weeklyLoad)}</span>
                      </span>
                    ),
                  },
                }))}
              />
            )}
          </article>

          <section className="analysis-two-column">
            <article className="panel analysis-detail-panel">
              <h3>Ampel-Verteilung als Beobachtung</h3>
              {totalTraffic === 0 ? (
                <EmptyState appearance="inline" title="Noch keine Ampelwerte" body="Im gefilterten Zeitraum liegen keine Ampelwerte vor." />
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
                Session-Level: Cluster- und Positionsfilter betreffen Spielerwerte, nicht geplante Session-Blöcke.
              </p>
              {!plannedVsActual || plannedVsActual.planned === 0 ? (
                <EmptyState appearance="inline" title="Keine geplanten Blöcke" body="Für lokale Einheiten im Zeitraum wurden keine geplanten Blöcke gefunden." />
              ) : (
                <div className="analysis-distribution">
                  {[
                    ['Erledigt', plannedVsActual.done],
                    ['Reduziert', plannedVsActual.reduced],
                    ['Geändert', plannedVsActual.changed],
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
            <h3>Belastungsarten pro Woche als Progressionscheck</h3>
            {summary.weeklyExposureSummaries.length === 0 ? (
              <EmptyState appearance="inline" title="Keine Belastungsübersichten" body="Sie entstehen in der Nachbereitung aus Blockstatus und Anwesenheit." />
            ) : (
              <AnalysisResultList
                ariaLabel="Belastungsarten pro Woche"
                columns={[
                  { key: 'week', label: 'Woche' },
                  { key: 'completed', label: 'Erledigt', numeric: true },
                  { key: 'reduced', label: 'Reduziert', numeric: true },
                  { key: 'skipped', label: 'Ausgelassen', numeric: true },
                  { key: 'total', label: 'Gesamt', numeric: true },
                ]}
                rows={summary.weeklyExposureSummaries.map((week) => {
                  const total = week.completed + week.reduced + week.skipped

                  return {
                    id: week.weekStart,
                    cells: {
                      week: week.weekLabel,
                      completed: week.completed,
                      reduced: week.reduced,
                      skipped: week.skipped,
                      total: (
                        <span className="analysis-result-load">
                          <BarValue value={total} max={exposureMax} />
                          <span>{total}</span>
                        </span>
                      ),
                    },
                  }
                })}
              />
            )}
          </article>

          <article className="panel analysis-detail-panel">
            <div className="status-line">
              <Database className="nav-icon" aria-hidden />
              <h3>Datenabdeckung</h3>
            </div>
            <div className="metric-grid mini">
              <MetricTile label="Check-ins" value={summary.dataCoverage.checkIns} />
              <MetricTile label="Blocklogs" value={summary.dataCoverage.blockLogs} />
              <MetricTile label="Belastungsübersichten" value={summary.dataCoverage.exposureSummaries} />
              <MetricTile label="Messwerte" value={summary.dataCoverage.metricResults} />
              <MetricTile label="Übungsergebnisse" value={summary.dataCoverage.exerciseResults} />
            </div>
            <p className="privacy-note">
              Messwerte und Übungsergebnisse werden hier nur als Team-Datenabdeckung gezählt. Spielerspezifische Verläufe bleiben im Spielerprofil.
            </p>
          </article>
        </>
      ) : null}
    </section>
  )
}
