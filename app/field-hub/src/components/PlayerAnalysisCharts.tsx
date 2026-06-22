import type { ReactNode } from 'react'
import { getExerciseDefinition } from '../domain/exercises'
import { exposureTypes } from '../domain/exposures'
import { getMetricDefinition } from '../domain/metrics'
import type { PlayerAnalysisPoint, PlayerAnalysisSource, PlayerAnalysisSummary } from '../domain/playerAnalysis'

type PlayerAnalysisChartsProps = {
  analysis: PlayerAnalysisSummary
  canOpenSourceSession?: (source: PlayerAnalysisSource) => boolean
  onOpenSourceSession?: (source: PlayerAnalysisSource) => void
}

type SourceAware = PlayerAnalysisSource & {
  label: string
}

type SourcePoint<TValue> = PlayerAnalysisPoint<TValue>

const sourceTableLabels: Record<PlayerAnalysisSource['table'], string> = {
  player_session_entries: 'Check-in/Nachbereitung',
  progress_entries: 'Progression',
  returner_entries: 'Returner',
  player_exposure_summaries: 'Exposure Summary',
  metric_results: 'Metric Result',
  exercise_results: 'Exercise Result',
}

const attendanceLabels = {
  present: 'anwesend',
  absent: 'nicht da',
  open: 'offen',
} as const

const exposureLabels: Record<string, string> = {
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

function maxValue(values: number[]) {
  return Math.max(1, ...values)
}

function formatValue(value: string | number | null | undefined, fallback = '-') {
  return value === null || value === undefined || value === '' ? fallback : String(value)
}

function SourceRow({
  canOpenSourceSession,
  onOpenSourceSession,
  source,
}: {
  canOpenSourceSession?: (source: PlayerAnalysisSource) => boolean
  onOpenSourceSession?: (source: PlayerAnalysisSource) => void
  source: SourceAware
}) {
  const canOpen = Boolean(
    onOpenSourceSession && source.sessionDefinitionId && (!canOpenSourceSession || canOpenSourceSession(source)),
  )

  return (
    <div className="player-analysis-source">
      <span>
        Quelle: {source.sessionDate} · {sourceTableLabels[source.table]} · {source.recordId}
      </span>
      {canOpen ? (
        <button className="text-action" type="button" onClick={() => onOpenSourceSession?.(source)}>
          Session öffnen/korrigieren
        </button>
      ) : (
        <span>Session lokal nicht direkt verknuepft.</span>
      )}
    </div>
  )
}

function EmptyState({ children }: { children: string }) {
  return <p className="empty-state compact-empty">{children}</p>
}

function CompactSection({
  children,
  emptyText,
  isEmpty,
  title,
}: {
  children: ReactNode
  emptyText: string
  isEmpty: boolean
  title: string
}) {
  return (
    <section className="player-analysis-card" aria-label={title}>
      <h5>{title}</h5>
      {isEmpty ? <EmptyState>{emptyText}</EmptyState> : children}
    </section>
  )
}

function NumericBars({
  canOpenSourceSession,
  onOpenSourceSession,
  points,
  showSources = false,
  suffix = '',
}: {
  canOpenSourceSession?: (source: PlayerAnalysisSource) => boolean
  onOpenSourceSession?: (source: PlayerAnalysisSource) => void
  points: Array<SourcePoint<number>>
  showSources?: boolean
  suffix?: string
}) {
  const max = maxValue(points.map((point) => point.value))

  return (
    <div className="player-analysis-bars">
      {points.map((point) => (
        <div className="player-analysis-bar-item" key={`${point.table}-${point.recordId}-${point.label}`}>
          <div className="player-analysis-bar-row">
            <span>{point.sessionDate}</span>
            <span className="analysis-bar-track" aria-hidden>
              <span className="analysis-bar-fill" style={{ width: `${Math.round((point.value / max) * 100)}%` }} />
            </span>
            <strong>{point.value}{suffix}</strong>
          </div>
          {showSources ? (
            <SourceRow
              canOpenSourceSession={canOpenSourceSession}
              onOpenSourceSession={onOpenSourceSession}
              source={point}
            />
          ) : null}
        </div>
      ))}
    </div>
  )
}

function SourceList<TValue>({
  children,
  canOpenSourceSession,
  onOpenSourceSession,
  points,
}: {
  children: (point: SourcePoint<TValue>, index: number) => ReactNode
  canOpenSourceSession?: (source: PlayerAnalysisSource) => boolean
  onOpenSourceSession?: (source: PlayerAnalysisSource) => void
  points: Array<SourcePoint<TValue>>
}) {
  return (
    <div className="player-analysis-list">
      {points.map((point, index) => (
        <div className="player-analysis-list-row" key={`${point.table}-${point.recordId}-${point.label}-${index}`}>
          <div>{children(point, index)}</div>
          <SourceRow canOpenSourceSession={canOpenSourceSession} onOpenSourceSession={onOpenSourceSession} source={point} />
        </div>
      ))}
    </div>
  )
}

export function LoadAnalysis({ analysis, canOpenSourceSession, onOpenSourceSession }: PlayerAnalysisChartsProps) {
  return (
    <div className="player-analysis-grid">
      <CompactSection
        title="Rolling Load"
        isEmpty={analysis.load.length === 0}
        emptyText="Keine lokalen sRPE-/Load-Werte fuer diesen Spieler. Load entsteht in der Nachbereitung."
      >
        <div className="metric-grid mini player-analysis-metrics">
          {analysis.rollingLoad.map((load) => (
            <div className="metric" key={load.label}>
              <small>{load.label} Load</small>
              <strong>{load.total === null ? '-' : Math.round(load.total).toLocaleString('de-AT')}</strong>
              <small>{load.entryCount} lokale Eintraege</small>
            </div>
          ))}
        </div>
      </CompactSection>
      <CompactSection
        title="sRPE / Load History"
        isEmpty={analysis.load.length === 0}
        emptyText="Noch keine sRPE, Dauer oder Session Load lokal erfasst."
      >
        <SourceList canOpenSourceSession={canOpenSourceSession} onOpenSourceSession={onOpenSourceSession} points={analysis.load}>
          {(point) => (
            <p>
              <strong>{point.sessionDate}</strong> · sRPE {formatValue(point.value.sessionRpe)} · Dauer{' '}
              {point.value.durationMinutes === null ? '-' : `${point.value.durationMinutes} min`} · Load{' '}
              {formatValue(point.value.sessionLoad)}
            </p>
          )}
        </SourceList>
      </CompactSection>
    </div>
  )
}

export function IssuesAnalysis({ analysis, canOpenSourceSession, onOpenSourceSession }: PlayerAnalysisChartsProps) {
  return (
    <div className="player-analysis-grid">
      <CompactSection
        title="Readiness History"
        isEmpty={analysis.readiness.length === 0}
        emptyText="Keine Readiness-Werte lokal sichtbar. Werte entstehen im Check-in."
      >
        <NumericBars
          canOpenSourceSession={canOpenSourceSession}
          onOpenSourceSession={onOpenSourceSession}
          points={analysis.readiness}
          showSources
        />
      </CompactSection>
      <CompactSection
        title="Pain Score History"
        isEmpty={analysis.painScores.length === 0}
        emptyText="Keine Pain Scores lokal sichtbar. Werte entstehen im Check-in."
      >
        <NumericBars
          canOpenSourceSession={canOpenSourceSession}
          onOpenSourceSession={onOpenSourceSession}
          points={analysis.painScores}
          showSources
          suffix="/10"
        />
      </CompactSection>
      <CompactSection
        title="Pain Location Text History"
        isEmpty={analysis.painLocations.length === 0}
        emptyText="Keine Pain-Location-Texte lokal sichtbar. Body-Region-Charts sind bewusst noch nicht Teil dieses Sprints."
      >
        <SourceList
          canOpenSourceSession={canOpenSourceSession}
          onOpenSourceSession={onOpenSourceSession}
          points={analysis.painLocations}
        >
          {(point) => (
            <p>
              <strong>{point.sessionDate}</strong> · {point.value}
            </p>
          )}
        </SourceList>
      </CompactSection>
    </div>
  )
}

export function TrainingAnalysis({ analysis, canOpenSourceSession, onOpenSourceSession }: PlayerAnalysisChartsProps) {
  const attendancePoints = analysis.attendance.map((point) => ({
    ...point,
    value: point.value,
    label: attendanceLabels[point.value],
  }))
  const exposurePoints = analysis.exposures.map((point) => ({
    ...point,
    label: exposureTypes
      .flatMap((type) => {
        const status = point.value[type]
        return status === 'none' ? [] : [`${exposureLabels[type]}: ${status}`]
      })
      .join(' · '),
  }))

  return (
    <div className="player-analysis-grid">
      <CompactSection
        title="Attendance History"
        isEmpty={attendancePoints.length === 0}
        emptyText="Noch keine lokalen Check-ins fuer diesen Spieler."
      >
        <SourceList
          canOpenSourceSession={canOpenSourceSession}
          onOpenSourceSession={onOpenSourceSession}
          points={attendancePoints}
        >
          {(point) => (
            <p>
              <strong>{point.sessionDate}</strong> · {point.label}
            </p>
          )}
        </SourceList>
      </CompactSection>
      <CompactSection
        title="Exercise Progression"
        isEmpty={analysis.exercisesByKey.length === 0}
        emptyText="Noch keine strukturierte Exercise-Historie lokal sichtbar."
      >
        <div className="player-analysis-list">
          {analysis.exercisesByKey.map((group) => {
            const definition = getExerciseDefinition(group.exerciseKey)
            return (
              <div className="player-analysis-list-row" key={group.exerciseKey}>
                <strong>{definition.name}</strong>
                {group.points.map((point) => (
                  <div key={point.recordId}>
                    <p>
                      {point.sessionDate} · Last {formatValue(point.value.loadValue)} · Reps {formatValue(point.value.reps)} · RPE{' '}
                      {formatValue(point.value.rpe)}
                    </p>
                    <SourceRow
                      canOpenSourceSession={canOpenSourceSession}
                      onOpenSourceSession={onOpenSourceSession}
                      source={point}
                    />
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </CompactSection>
      <CompactSection
        title="Exposure History / Gaps"
        isEmpty={analysis.exposures.length === 0}
        emptyText="Keine Exposure-Summaries lokal sichtbar. Exposures entstehen aus Training/Nachbereitung."
      >
        <SourceList
          canOpenSourceSession={canOpenSourceSession}
          onOpenSourceSession={onOpenSourceSession}
          points={exposurePoints}
        >
          {(point) => (
            <p>
              <strong>{point.sessionDate}</strong> · {point.label || 'Keine Exposure'}
            </p>
          )}
        </SourceList>
        <div className="player-analysis-gap-list">
          {analysis.exposureGaps.slice(0, 6).map((gap) => (
            <span className={gap.sessionsSinceSeen === null ? 'tag compact warning-tag' : 'tag compact'} key={gap.exposureType}>
              {exposureLabels[gap.exposureType]}: {gap.sessionsSinceSeen === null ? 'keine lokale Exposure' : `${gap.sessionsSinceSeen} Sessions`}
            </span>
          ))}
        </div>
      </CompactSection>
    </div>
  )
}

export function MetricAnalysis({ analysis, canOpenSourceSession, onOpenSourceSession }: PlayerAnalysisChartsProps) {
  return (
    <CompactSection
      title="Metric History"
      isEmpty={analysis.metricsByKey.length === 0}
      emptyText="Noch keine Metric-Historie lokal sichtbar. Flexible Metrics entstehen in der Nachbereitung."
    >
      <div className="player-analysis-list">
        {analysis.metricsByKey.map((group) => {
          const definition = getMetricDefinition(group.metricKey)
          return (
            <div className="player-analysis-list-row" key={group.metricKey}>
              <strong>{definition.name}</strong>
              <NumericBars
                canOpenSourceSession={canOpenSourceSession}
                onOpenSourceSession={onOpenSourceSession}
                points={group.points.map((point) => ({
                  ...point,
                  label: definition.name,
                }))}
                showSources
                suffix={` ${definition.unit}`}
              />
            </div>
          )
        })}
      </div>
    </CompactSection>
  )
}

export function ReturnerAnalysis({ analysis, canOpenSourceSession, onOpenSourceSession }: PlayerAnalysisChartsProps) {
  return (
    <CompactSection
      title="Returner Progression"
      isEmpty={analysis.returner.length === 0}
      emptyText="Keine Returner-Historie lokal sichtbar. Returner-Entscheidungen bleiben Coach-/Medical-Handoff, keine medizinische Entscheidung."
    >
      <SourceList
        canOpenSourceSession={canOpenSourceSession}
        onOpenSourceSession={onOpenSourceSession}
        points={analysis.returner}
      >
        {(point) => (
          <p>
            <strong>{point.sessionDate}</strong> · Stage {formatValue(point.value.stage)} · Entscheidung{' '}
            {formatValue(point.value.decision)} · Speed {formatValue(point.value.speedCap)} · COD{' '}
            {formatValue(point.value.codDecelCap)} · Cond {formatValue(point.value.conditioningCap)} · Kontakt{' '}
            {formatValue(point.value.contactCap)}
          </p>
        )}
      </SourceList>
    </CompactSection>
  )
}
