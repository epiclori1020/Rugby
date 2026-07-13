import { Camera, CircleDashed, RefreshCw, Search, Settings, Trash2, UserMinus, UserPlus, Users, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode, type RefObject } from 'react'
import { activeSportConfig, positionGroupOptions } from '../config/labels'
import { sprint30mOptionalLabel } from '../domain/baseline'
import { metricDefinitions, type MetricDefinition } from '../content/metricDefinitions'
import { formatExerciseResult, getExerciseDefinition, type ExerciseResult } from '../domain/exercises'
import { exposureTypes, type PlayerExposureSummary } from '../domain/exposures'
import { getMetricDefinition, type MetricResult } from '../domain/metrics'
import {
  consentStatusOptions,
  emptyPlayerFormValues,
  getPlayerInitials,
  photoConsentOptions,
  playerToFormValues,
  type Player,
  type PlayerFormValues,
} from '../domain/players'
import type { AuthSessionState } from '../lib/auth'
import { triggerHapticFeedback } from '../lib/interactionFeedback'
import { refreshRemoteExposureSummaries } from '../lib/exposureRepository'
import { refreshRemoteExerciseResults } from '../lib/exerciseRepository'
import { refreshRemoteMetricResults } from '../lib/metricRepository'
import { downloadPlayerPhotoUrl } from '../lib/playerRepository'
import { pendingCountLabel, shouldShowSyncAttention, syncStatusLabel } from '../lib/syncLabels'
import type { useMetrics } from '../hooks/useMetrics'
import type { usePlayers } from '../hooks/usePlayers'
import { usePlayerProfiles } from '../hooks/usePlayerProfiles'
import type { PlayerProfileSummary } from '../domain/playerProfile'
import type { PlayerAnalysisSource } from '../domain/playerAnalysis'
import {
  IssuesAnalysis,
  LoadAnalysis,
  MetricAnalysis,
  ReturnerAnalysis,
  TrainingAnalysis,
} from './PlayerAnalysisCharts'
import { PlayerEditorForm } from './PlayerEditorForm'
import { AthleteRow } from './onfield'
import { EmptyState, PrimaryButton, SecondaryButton, Skeleton, StatusChip } from './ui'

type PlayerActions = ReturnType<typeof usePlayers>
type MetricActions = ReturnType<typeof useMetrics>

type PlayersViewProps = {
  authState: AuthSessionState
  canOpenSourceSession?: (source: PlayerAnalysisSource) => boolean
  initialDetailTab?: PlayerDetailTab
  initialSelectedPlayerId?: string | null
  onOpenSourceSession?: (source: PlayerAnalysisSource) => void
  onOpenReturner?: (playerId: string) => void
  metricActions?: MetricActions
  metricSessionLabel?: string
  playerActions: PlayerActions
  todayKey?: string
}

type PlayerDetailTab = 'overview' | 'training' | 'tests' | 'load' | 'issues' | 'returner'

const playerDetailTabs: Array<{ id: PlayerDetailTab; label: string }> = [
  { id: 'overview', label: 'Übersicht' },
  { id: 'training', label: 'Training' },
  { id: 'tests', label: 'Tests' },
  { id: 'load', label: 'Load' },
  { id: 'issues', label: 'Issues' },
  { id: 'returner', label: 'Returner' },
]

const attendanceLabels = {
  open: 'offen',
  present: 'anwesend',
  absent: 'nicht da',
} as const

const currentLimitSourceLabels = {
  returner_caps: 'Returner-Caps',
  session_limits: 'Session',
} as const

const trafficLabels = {
  green: 'Grün',
  yellow: 'Gelb',
  red: 'Rot',
} as const

function optionLabel<T extends string>(options: ReadonlyArray<{ value: T; label: string }>, value: T) {
  return options.find((option) => option.value === value)?.label ?? value
}

function displayValue(value: string | number | null | undefined, fallback = '-') {
  return value === null || value === undefined || value === '' ? fallback : String(value)
}

function exposureSummaryText(summary: PlayerExposureSummary) {
  const labels = exposureTypes.flatMap((type) => {
    const status = summary.statuses[type]
    return status === 'none' ? [] : [`${type}: ${status}`]
  })

  return labels.length > 0 ? labels.join(' · ') : 'Keine Exposure'
}

function metricResultText(result: MetricResult) {
  const definition = getMetricDefinition(result.metricKey)
  return `${definition.name}: ${result.value} ${definition.unit}${result.contextNote ? ` (${result.contextNote})` : ''}`
}

function exerciseResultText(result: ExerciseResult) {
  const definition = getExerciseDefinition(result.exerciseKey)
  const details = formatExerciseResult(result)
  const tags = [
    result.variant !== 'custom' ? `Variante ${result.variant === 'A_plus' ? 'A+' : result.variant}` : null,
    result.techniqueQuality !== 'not_recorded' ? `Technik ${result.techniqueQuality}` : null,
    result.painResponse !== 'unclear' ? `Beschwerden ${result.painResponse}` : null,
  ].filter(Boolean)

  return `${details} · ${definition.pattern}${tags.length > 0 ? ` · ${tags.join(' · ')}` : ''}`
}

function profileTrafficClass(profile: PlayerProfileSummary | undefined) {
  return profile?.latestSession?.trafficLight ? `traffic-${profile.latestSession.trafficLight}` : 'traffic-open'
}

function playerRowAriaLabel(player: Player, profile: PlayerProfileSummary | undefined) {
  const labels = [
    `Profil öffnen: ${player.name}`,
    player.position,
    optionLabel(positionGroupOptions, player.cluster),
    player.active ? 'aktiv' : 'inaktiv',
  ]

  if (profile?.latestSession?.trafficLight) {
    labels.push(`Ampel ${trafficLabels[profile.latestSession.trafficLight]}`)
  } else {
    labels.push('Check-in offen')
  }

  if (profile?.openIssues.items.length) {
    labels.push(`${profile.openIssues.items.length} offene Themen`)
  } else if (player.returnerStatus === 'ja') {
    labels.push('Returner')
  } else if (player.returnerStatus === 'offen') {
    labels.push('Returner klären')
  } else if (player.consentStatus !== 'vorhanden') {
    labels.push('Einwilligung offen')
  }

  return labels.join(', ')
}

function PlayerAvatar({
  onPhotoLoadError,
  player,
  previewUrl,
}: {
  onPhotoLoadError?: () => void
  player: Player
  previewUrl?: string | null
}) {
  const [photoState, setPhotoState] = useState<{ path: string; url: string } | null>(null)
  const [visiblePhotoKey, setVisiblePhotoKey] = useState<string | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const photoKey =
    player.photoConsentStatus === 'allowed' && player.photoPath
      ? `${player.photoPath}::${player.photoUpdatedAt ?? ''}`
      : null

  const observePlaceholder = useCallback(
    (placeholder: HTMLSpanElement | null) => {
      observerRef.current?.disconnect()
      observerRef.current = null
      if (!placeholder || !photoKey) {
        return
      }

      if (typeof IntersectionObserver === 'undefined') {
        setVisiblePhotoKey(photoKey)
        return
      }

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            setVisiblePhotoKey(photoKey)
            observer.disconnect()
          }
        },
        { rootMargin: '160px' },
      )
      observerRef.current = observer
      observer.observe(placeholder)
    },
    [photoKey],
  )

  useEffect(
    () => () => {
      observerRef.current?.disconnect()
    },
    [],
  )

  useEffect(() => {
    if (!photoKey || visiblePhotoKey !== photoKey || !player.photoPath) {
      return undefined
    }

    const photoPath = player.photoPath
    let isMounted = true
    downloadPlayerPhotoUrl(photoPath, player.photoUpdatedAt)
      .then((url) => {
        if (!isMounted) {
          return
        }

        if (!url) {
          onPhotoLoadError?.()
          return
        }

        setPhotoState({ path: photoPath, url })
      })
      .catch(() => {
        if (isMounted) {
          onPhotoLoadError?.()
        }
      })

    return () => {
      isMounted = false
    }
  }, [onPhotoLoadError, photoKey, player.photoPath, player.photoUpdatedAt, visiblePhotoKey])

  if (previewUrl) {
    return <img className="player-avatar" src={previewUrl} alt="" loading="lazy" />
  }

  if (player.photoConsentStatus !== 'allowed' || !player.photoPath) {
    return <span className="player-avatar placeholder-avatar">{getPlayerInitials(player.name) || '?'}</span>
  }

  if (photoState?.path === player.photoPath) {
    return <img className="player-avatar" src={photoState.url} alt="" loading="lazy" />
  }

  return (
    <span className="player-avatar placeholder-avatar" ref={observePlaceholder}>
      {getPlayerInitials(player.name) || '?'}
    </span>
  )
}

function usePhotoLoadError() {
  const [photoLoadError, setPhotoLoadError] = useState(false)

  const clearPhotoLoadError = useCallback(() => {
    setPhotoLoadError(false)
  }, [])

  const markPhotoLoadError = useCallback(() => {
    setPhotoLoadError(true)
  }, [])

  return { clearPhotoLoadError, markPhotoLoadError, photoLoadError }
}

function playerReadinessTone(player: Player, profile: PlayerProfileSummary | undefined) {
  return profile?.latestSession?.trafficLight ?? (player.returnerStatus === 'ja' ? 'returner' : 'open')
}

function playerRowNote(profile: PlayerProfileSummary | undefined) {
  if (profile?.openIssues.items[0]) {
    return profile.openIssues.items[0]
  }

  if (profile?.currentLimits[0]) {
    return `${profile.currentLimits[0].label}: ${profile.currentLimits[0].detail}`
  }

  if (profile?.lastParticipation) {
    return `${profile.lastParticipation.sessionDate} · ${attendanceLabels[profile.lastParticipation.attendanceStatus]}`
  }

  return 'Noch keine Trainingshistorie'
}

function PlayerStatusRow({ player, profile }: { player: Player; profile: PlayerProfileSummary | undefined }) {
  const trafficLight = profile?.latestSession?.trafficLight
  const trafficTone = trafficLight === 'green' ? 'success' : trafficLight === 'yellow' ? 'warning' : trafficLight === 'red' ? 'danger' : 'neutral'
  let secondaryStatus: ReactNode = null

  if (profile?.openIssues.severity === 'red') {
    secondaryStatus = <StatusChip label={`${profile.openIssues.items.length} offene Themen`} tone="danger" />
  } else if (profile?.openIssues.severity === 'yellow') {
    secondaryStatus = <StatusChip label={`${profile.openIssues.items.length} offene Themen`} tone="warning" />
  } else if (!player.active) {
    secondaryStatus = <StatusChip icon={<UserMinus />} label="Inaktiv" />
  } else if (player.returnerStatus === 'ja') {
    secondaryStatus = <StatusChip label="Returner" tone="info" />
  } else if (player.returnerStatus === 'offen') {
    secondaryStatus = <StatusChip label="Returner klären" tone="warning" />
  } else if (player.consentStatus !== 'vorhanden') {
    secondaryStatus = <StatusChip label="Einwilligung offen" tone="warning" />
  }

  return (
    <span className="player-status-row" aria-label={`Status ${player.name}`}>
      <StatusChip
        icon={trafficLight ? undefined : <CircleDashed />}
        label={trafficLight ? trafficLabels[trafficLight] : 'Check-in offen'}
        tone={trafficTone}
      />
      {secondaryStatus}
    </span>
  )
}

function MetricCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

const editableProfileMetricDefinitions = metricDefinitions.filter(
  (definition) =>
    definition.active &&
    (definition.key === 'broad_jump' || definition.key === 'med_ball_chest_pass' || definition.key === 'sprint_10m'),
)

function baselineFallbackForMetric(profile: PlayerProfileSummary | undefined, metricKey: string) {
  if (!profile?.latestBaseline) {
    return null
  }

  if (metricKey === 'broad_jump') {
    return profile.latestBaseline.broadJumpCm
  }

  if (metricKey === 'med_ball_chest_pass') {
    return profile.latestBaseline.medBallChestPassM
  }

  return null
}

function latestMetricForKey(profile: PlayerProfileSummary | undefined, metricKey: string) {
  return profile?.recentMetrics.find((result) => result.metricKey === metricKey) ?? null
}

function displayProfileMetricValue(
  profile: PlayerProfileSummary | undefined,
  definition: MetricDefinition,
): { label: string; source: 'metric' | 'baseline' | 'missing' } {
  const metric = latestMetricForKey(profile, definition.key)
  if (metric) {
    return { label: `${metric.value} ${definition.unit}`, source: 'metric' }
  }

  const fallback = baselineFallbackForMetric(profile, definition.key)
  if (fallback !== null) {
    return { label: `${fallback} ${definition.unit}`, source: 'baseline' }
  }

  return { label: '-', source: 'missing' }
}

function ProfileSection({
  children,
  emptyText,
  title,
}: {
  children: ReactNode
  emptyText?: string
  title: string
}) {
  return (
    <section className="player-profile-section" aria-label={title}>
      <h4>{title}</h4>
      {children || (emptyText ? <p>{emptyText}</p> : null)}
    </section>
  )
}

function PlayerDetailView({
  activeTab,
  canOpenSourceSession,
  detailRef,
  metricActions,
  metricDrafts,
  metricError,
  metricNotice,
  metricSessionLabel,
  isModal,
  onClose,
  onEdit,
  onMetricDraftChange,
  onMetricSave,
  onPhotoLoadError,
  onOpenSourceSession,
  onOpenReturner,
  onTabChange,
  photoPreviewUrl,
  player,
  profile,
}: {
  activeTab: PlayerDetailTab
  canOpenSourceSession?: (source: PlayerAnalysisSource) => boolean
  detailRef: RefObject<HTMLElement | null>
  metricActions?: MetricActions
  metricDrafts: Record<string, string>
  metricError: string | null
  metricNotice: string | null
  metricSessionLabel?: string
  isModal: boolean
  onClose: () => void
  onEdit: () => void
  onMetricDraftChange: (metricKey: string, value: string) => void
  onMetricSave: (definition: MetricDefinition) => Promise<void> | void
  onPhotoLoadError: () => void
  onOpenSourceSession?: (source: PlayerAnalysisSource) => void
  onOpenReturner?: (playerId: string) => void
  onTabChange: (tab: PlayerDetailTab) => void
  photoPreviewUrl?: string
  player: Player
  profile: PlayerProfileSummary | undefined
}) {
  return (
    <article
      ref={detailRef}
      className={`panel player-detail ${profileTrafficClass(profile)}`}
      role={isModal ? 'dialog' : undefined}
      aria-modal={isModal ? 'true' : undefined}
      aria-labelledby="player-detail-heading"
    >
      <div className="player-detail-heading">
        <div className="player-detail-title">
          <PlayerAvatar onPhotoLoadError={onPhotoLoadError} player={player} previewUrl={photoPreviewUrl} />
          <div>
            <p className="eyebrow">Spielerprofil</p>
            <h3 id="player-detail-heading">{player.name}</h3>
            <p>{player.position} · {optionLabel(positionGroupOptions, player.cluster)}</p>
            <PlayerStatusRow player={player} profile={profile} />
          </div>
        </div>
        <div className="player-detail-actions">
          <button className="icon-button" type="button" aria-label="Spieler bearbeiten" onClick={onEdit}>
            <Settings className="nav-icon" aria-hidden />
          </button>
          <button className="icon-button" type="button" aria-label="Spielerprofil schließen" onClick={onClose}>
            <X className="nav-icon" aria-hidden />
          </button>
        </div>
      </div>

      <dl className="player-profile-summary" aria-label="Operative Profilzusammenfassung">
        <div>
          <dt>Letzte Teilnahme</dt>
          <dd>
            <span className="of-num">{profile?.lastParticipation?.sessionDate ?? '–'}</span>
            <small>
              {profile?.lastParticipation
                ? attendanceLabels[profile.lastParticipation.attendanceStatus]
                : 'Noch nicht erfasst'}
            </small>
          </dd>
        </div>
        <div>
          <dt>Readiness</dt>
          <dd>
            <span className="of-num">{displayValue(profile?.lastParticipation?.readiness, '–')}</span>
            <small>letzter Check-in</small>
          </dd>
        </div>
        <div>
          <dt>Beschwerden</dt>
          <dd>
            <span className="of-num">
              {profile?.lastParticipation?.painScore !== null && profile?.lastParticipation?.painScore !== undefined
                ? `${profile.lastParticipation.painScore}/10`
                : '–'}
            </span>
            <small>Selbstauskunft</small>
          </dd>
        </div>
        <div>
          <dt>Offene Themen</dt>
          <dd>
            <span className="of-num">{profile?.openIssues.items.length ?? 0}</span>
            <small>{profile?.openIssues.severity === 'red' ? 'Priorität hoch' : 'im Profil'}</small>
          </dd>
        </div>
      </dl>

      <div className="button-row player-detail-tabs" role="tablist" aria-label="Spielerprofil Tabs">
        {playerDetailTabs.map((tab) => (
          <button
            className={activeTab === tab.id ? 'segmented active' : 'segmented'}
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' ? (
        <div className="player-profile-content">
          <ProfileSection title="Aktuelle Limits" emptyText="Keine aktuellen Limits aus lokalen Daten.">
            {profile?.currentLimits.length ? (
              <div className="profile-fact-list">
                {profile.currentLimits.map((limit, index) => (
                  <p key={`${limit.source}-${limit.label}-${limit.sessionDate}-${index}`}>
                    <strong>{limit.label}</strong> · {limit.detail} · {limit.sessionDate} ·{' '}
                    {currentLimitSourceLabels[limit.source]}
                  </p>
                ))}
              </div>
            ) : null}
          </ProfileSection>
          <ProfileSection title="Offene Themen" emptyText="Keine offenen Themen aus lokalen Daten.">
            {profile?.openIssues.items.length ? (
              <ul className="compact-list warning-list">
                {profile.openIssues.items.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            ) : null}
          </ProfileSection>
          <ProfileSection title="Kurzer Verlauf" emptyText="Noch kein Verlauf erfasst.">
            {profile?.recentSessions.length ? (
              <div className="profile-fact-list">
                {profile.recentSessions.map((session, index) => (
                  <p key={`${session.sessionDate}-${session.source ?? 'source'}-${index}`}>
                    <strong>{session.sessionDate}</strong> · {attendanceLabels[session.attendanceStatus]} · Readiness{' '}
                    {displayValue(session.readiness)} · Schmerz {session.painScore !== null ? `${session.painScore}/10` : '-'} ·{' '}
                    {session.trafficLight ? `Ampel ${trafficLabels[session.trafficLight]}` : 'Ampel -'}
                  </p>
                ))}
              </div>
            ) : null}
          </ProfileSection>
          <ProfileSection title="Stammdaten & Consent">
            <div className="metric-grid mini">
              <MetricCard label={activeSportConfig.athleteLabels.positionLabel} value={player.position} />
              <MetricCard
                label={activeSportConfig.athleteLabels.positionGroupLabel}
                value={optionLabel(positionGroupOptions, player.cluster)}
              />
              <MetricCard label="Consent" value={optionLabel(consentStatusOptions, player.consentStatus)} />
              <MetricCard label="Foto" value={optionLabel(photoConsentOptions, player.photoConsentStatus)} />
              <MetricCard label="Preset" value={activeSportConfig.productLabel} />
              <MetricCard label="Status" value={player.active ? 'aktiv' : 'inaktiv'} />
            </div>
          </ProfileSection>
          {player.notes ? (
            <ProfileSection title="Langnotiz">
              <p>{player.notes}</p>
            </ProfileSection>
          ) : null}
        </div>
      ) : null}

      {activeTab === 'training' ? (
        <div className="player-profile-content">
          <ProfileSection title="Training" emptyText="Noch keine Trainingshistorie erfasst.">
            {profile?.latestSession ? (
              <div className="metric-grid mini">
                <MetricCard label="Datum" value={profile.latestSession.sessionDate} />
                <MetricCard label="Anwesenheit" value={attendanceLabels[profile.latestSession.attendanceStatus]} />
                <MetricCard label="Readiness" value={displayValue(profile.latestSession.readiness)} />
                <MetricCard label="Beschwerden" value={profile.latestSession.painScore !== null ? `${profile.latestSession.painScore}/10` : '-'} />
              </div>
            ) : null}
          </ProfileSection>
          <ProfileSection title="Progression" emptyText="Noch kein Progressionseintrag.">
            {profile?.latestProgression ? (
              <div className="profile-fact-list">
                <p><strong>{profile.latestProgression.sessionDate}</strong></p>
                <p>{displayValue(profile.latestProgression.mainExercise)} · {displayValue(profile.latestProgression.load)} · {displayValue(profile.latestProgression.reps)} · RPE {displayValue(profile.latestProgression.rpe)}</p>
                {profile.latestProgression.powerOrSprint ? <p>Power/Sprint: {profile.latestProgression.powerOrSprint}</p> : null}
                {profile.latestProgression.conditioning ? <p>Conditioning: {profile.latestProgression.conditioning}</p> : null}
                {profile.latestProgression.note ? <p>{profile.latestProgression.note}</p> : null}
              </div>
            ) : null}
          </ProfileSection>
          <ProfileSection title="Exercise-Progression" emptyText="Noch keine strukturierte Exercise-Historie.">
            {profile?.recentExerciseResults.length ? (
              <div className="profile-fact-list">
                {profile.recentExerciseResults.slice(0, 8).map((result) => (
                  <p key={result.id}>
                    <strong>{result.sessionDate}</strong> · {exerciseResultText(result)}
                  </p>
                ))}
              </div>
            ) : null}
          </ProfileSection>
          <ProfileSection title="Jüngste Exposures" emptyText="Noch keine Exposure-Historie.">
            {profile?.recentExposures.length ? (
              <div className="profile-fact-list">
                {profile.recentExposures.slice(0, 6).map((summary) => (
                  <p key={summary.id}>
                    <strong>{summary.sessionDate}</strong> · {exposureSummaryText(summary)}
                  </p>
                ))}
              </div>
            ) : null}
          </ProfileSection>
          {profile ? (
            <TrainingAnalysis
              analysis={profile.analysis}
              canOpenSourceSession={canOpenSourceSession}
              onOpenSourceSession={onOpenSourceSession}
            />
          ) : null}
        </div>
      ) : null}

      {activeTab === 'tests' ? (
        <div className="player-profile-content">
          <ProfileSection title="Direkt erfassen">
            {metricSessionLabel ? (
              <p className="privacy-note">Wird in Einheit {metricSessionLabel} als Versuch 1 erfasst.</p>
            ) : null}
            <div className="profile-test-grid" aria-label="Testwerte direkt bearbeiten">
              {editableProfileMetricDefinitions.map((definition) => {
                const displayedValue = displayProfileMetricValue(profile, definition)
                return (
                  <div className="profile-test-card" key={definition.key}>
                    <div>
                      <strong>{definition.name}</strong>
                      <span>
                        {displayedValue.label}
                        {displayedValue.source === 'baseline' ? ' · Baseline-Fallback' : ''}
                      </span>
                    </div>
                    <label>
                      <span className="sr-only">{definition.name} Wert</span>
                      <input
                        aria-label={`${definition.name} Wert`}
                        inputMode="decimal"
                        placeholder={definition.unit}
                        value={metricDrafts[definition.key] ?? ''}
                        onChange={(event) => onMetricDraftChange(definition.key, event.target.value)}
                      />
                    </label>
                    <SecondaryButton
                      compact
                      disabled={!metricActions || !(metricDrafts[definition.key] ?? '').trim()}
                      disabledReason={!metricActions ? 'Metrik-Speicher ist nicht verfuegbar.' : !(metricDrafts[definition.key] ?? '').trim() ? 'Trage zuerst einen Wert ein.' : undefined}
                      onClick={() => onMetricSave(definition)}
                    >
                      {definition.name} speichern
                    </SecondaryButton>
                  </div>
                )
              })}
            </div>
            {metricNotice ? <p className="form-notice">{metricNotice}</p> : null}
            {metricError ? <p className="form-error">{metricError}</p> : null}
          </ProfileSection>
          <ProfileSection title="Mini-Baseline" emptyText="Noch keine Mini-Baseline erfasst.">
            {profile?.latestBaseline ? (
              <div className="metric-grid mini">
                <MetricCard label="Datum" value={profile.latestBaseline.sessionDate} />
                <MetricCard label="Broad Jump" value={profile.latestBaseline.broadJumpCm !== null ? `${profile.latestBaseline.broadJumpCm} cm` : '-'} />
                <MetricCard label="MB Chest Pass" value={profile.latestBaseline.medBallChestPassM !== null ? `${profile.latestBaseline.medBallChestPassM} m` : '-'} />
                <MetricCard label="MB Gewicht" value={profile.latestBaseline.medBallWeightKg !== null ? `${profile.latestBaseline.medBallWeightKg} kg` : '-'} />
                <MetricCard label={sprint30mOptionalLabel} value={profile.latestBaseline.sprint30m !== null ? `${profile.latestBaseline.sprint30m} s` : 'spaeter'} />
              </div>
            ) : null}
          </ProfileSection>
          <ProfileSection title="Flexible Metrics" emptyText="Noch keine Metric-Historie.">
            {profile?.recentMetrics.length ? (
              <div className="profile-fact-list">
                {profile.recentMetrics.slice(0, 12).map((result) => (
                  <p key={result.id}>
                    <strong>{result.sessionDate}</strong> · {metricResultText(result)}
                  </p>
                ))}
              </div>
            ) : null}
          </ProfileSection>
          {profile ? (
            <MetricAnalysis
              analysis={profile.analysis}
              canOpenSourceSession={canOpenSourceSession}
              onOpenSourceSession={onOpenSourceSession}
            />
          ) : null}
        </div>
      ) : null}

      {activeTab === 'load' ? (
        <div className="player-profile-content">
          <ProfileSection title="Load" emptyText="Noch keine sRPE-/Load-Daten.">
            {profile?.latestLoad ? (
              <div className="metric-grid mini">
                <MetricCard label="Datum" value={profile.latestLoad.sessionDate} />
                <MetricCard label="sRPE" value={displayValue(profile.latestLoad.sessionRpe)} />
                <MetricCard label="Dauer" value={profile.latestLoad.durationMinutes !== null ? `${profile.latestLoad.durationMinutes} min` : '-'} />
                <MetricCard label="Session Load" value={displayValue(profile.latestLoad.sessionLoad)} />
              </div>
            ) : null}
          </ProfileSection>
          {profile ? (
            <LoadAnalysis
              analysis={profile.analysis}
              canOpenSourceSession={canOpenSourceSession}
              onOpenSourceSession={onOpenSourceSession}
            />
          ) : null}
        </div>
      ) : null}

      {activeTab === 'issues' ? (
        <div className="player-profile-content">
          <ProfileSection title="Issues" emptyText="Keine offenen Warnungen aus lokalen Daten.">
            {profile?.openIssues.items.length ? (
              <ul className="compact-list warning-list">
                {profile.openIssues.items.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            ) : null}
          </ProfileSection>
          {profile ? (
            <IssuesAnalysis
              analysis={profile.analysis}
              canOpenSourceSession={canOpenSourceSession}
              onOpenSourceSession={onOpenSourceSession}
            />
          ) : null}
        </div>
      ) : null}

      {activeTab === 'returner' ? (
        <div className="player-profile-content">
          {onOpenReturner ? (
            <SecondaryButton onClick={() => onOpenReturner(player.id)}>
              In Einheit öffnen
            </SecondaryButton>
          ) : null}
          <ProfileSection title="Returner" emptyText="Kein Returner-Eintrag vorhanden.">
            {profile?.latestReturner ? (
              <div className="profile-fact-list">
                <p><strong>{profile.latestReturner.sessionDate}</strong> · Entscheidung: {displayValue(profile.latestReturner.decision)}</p>
                <p>Speed: {displayValue(profile.latestReturner.speedCap)} · COD/Decel: {displayValue(profile.latestReturner.codDecelCap)}</p>
                <p>Conditioning: {displayValue(profile.latestReturner.conditioningCap)} · Kontakt: {displayValue(profile.latestReturner.contactCap)}</p>
                <p>Symptome: {displayValue(profile.latestReturner.symptomsDuring)} · Next Morning: {displayValue(profile.latestReturner.nextMorning)}</p>
              </div>
            ) : null}
          </ProfileSection>
          {profile ? (
            <ReturnerAnalysis
              analysis={profile.analysis}
              canOpenSourceSession={canOpenSourceSession}
              onOpenSourceSession={onOpenSourceSession}
            />
          ) : null}
        </div>
      ) : null}

    </article>
  )
}

export function PlayersView({
  authState,
  canOpenSourceSession,
  initialDetailTab = 'overview',
  initialSelectedPlayerId = null,
  metricActions,
  metricSessionLabel,
  onOpenSourceSession,
  onOpenReturner,
  playerActions,
  todayKey,
}: PlayersViewProps) {
  const { players, syncOverview, isLoading, runSync, savePlayer, deactivatePlayer, deletePlayer, uploadPlayerPhoto } =
    playerActions
  const { removePlayerPhoto } = playerActions
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(initialSelectedPlayerId)
  const [activeDetailTab, setActiveDetailTab] = useState<PlayerDetailTab>(initialDetailTab)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'active' | 'all' | 'returner' | 'issues'>('active')
  const [formValues, setFormValues] = useState<PlayerFormValues>(emptyPlayerFormValues)
  const [formError, setFormError] = useState<string | null>(null)
  const [formNotice, setFormNotice] = useState<string | null>(null)
  const [viewNotice, setViewNotice] = useState<string | null>(null)
  const [metricDrafts, setMetricDrafts] = useState<Record<string, string>>({})
  const [metricError, setMetricError] = useState<string | null>(null)
  const [metricNotice, setMetricNotice] = useState<string | null>(null)
  const [isMobileDetailOverlay, setIsMobileDetailOverlay] = useState(() =>
    typeof window === 'undefined' || typeof window.matchMedia !== 'function'
      ? true
      : window.matchMedia('(max-width: 839px)').matches,
  )
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<Record<string, string>>({})
  const photoPreviewUrlsRef = useRef<Record<string, string>>({})
  const playerDetailRef = useRef<HTMLElement | null>(null)
  const playerListRef = useRef<HTMLElement | null>(null)
  const profileOpenerRef = useRef<HTMLButtonElement | null>(null)
  const { clearPhotoLoadError, markPhotoLoadError, photoLoadError } = usePhotoLoadError()
  const showSyncAttention = shouldShowSyncAttention(syncOverview)
  const profileActions = usePlayerProfiles(authState.status === 'signed-in' ? authState.user.id : null, players, todayKey)

  const selectedPlayer = useMemo(
    () => players.find((player) => player.id === selectedPlayerId) ?? null,
    [players, selectedPlayerId],
  )
  const selectedPlayerProfile = selectedPlayer ? profileActions.profilesByPlayerId[selectedPlayer.id] : undefined

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined
    }

    const mediaQuery = window.matchMedia('(max-width: 839px)')
    const updateMobileDetailOverlay = () => setIsMobileDetailOverlay(mediaQuery.matches)
    updateMobileDetailOverlay()
    mediaQuery.addEventListener('change', updateMobileDetailOverlay)
    return () => mediaQuery.removeEventListener('change', updateMobileDetailOverlay)
  }, [])

  useEffect(() => {
    if (authState.status !== 'signed-in' || !selectedPlayerId || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return
    }

    Promise.resolve()
      .then(async () => {
        await refreshRemoteExposureSummaries(authState.user.id, { playerId: selectedPlayerId, limit: 6 })
        await refreshRemoteExerciseResults(authState.user.id, { playerId: selectedPlayerId, limit: 12 })
        await refreshRemoteMetricResults(authState.user.id, { playerId: selectedPlayerId, limit: 12 })
      })
      .then(profileActions.refreshPlayerProfiles)
      .catch(() => undefined)
  }, [authState, profileActions.refreshPlayerProfiles, selectedPlayerId])
  const filteredPlayers = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('de-AT')

    return players.filter((player) => {
      const profile = profileActions.profilesByPlayerId[player.id]
      const matchesQuery =
        !query ||
        [player.name, player.position, player.cluster, player.consentStatus, player.returnerStatus]
          .join(' ')
          .toLocaleLowerCase('de-AT')
          .includes(query)
      const matchesFilter =
        statusFilter === 'all' ||
        (statusFilter === 'active' && player.active) ||
        (statusFilter === 'returner' && player.returnerStatus !== 'nein') ||
        (statusFilter === 'issues' && Boolean(profile?.openIssues.items.length))

      return matchesQuery && matchesFilter
    })
  }, [players, profileActions.profilesByPlayerId, searchQuery, statusFilter])

  function openNewPlayerSheet() {
    profileOpenerRef.current = null
    setSelectedPlayerId(null)
    setActiveDetailTab('overview')
    setFormValues(emptyPlayerFormValues)
    setFormError(null)
    setFormNotice(null)
    setViewNotice(null)
    setMetricError(null)
    setMetricNotice(null)
    clearPhotoLoadError()
    setIsEditorOpen(true)
  }

  function openPlayerDetail(player: Player, opener?: HTMLButtonElement) {
    profileOpenerRef.current = opener ?? null
    setSelectedPlayerId(player.id)
    setActiveDetailTab('overview')
    setFormValues(playerToFormValues(player))
    setFormError(null)
    setFormNotice(null)
    setViewNotice(null)
    setMetricError(null)
    setMetricNotice(null)
    clearPhotoLoadError()
    setIsEditorOpen(false)
  }

  const closePlayerProfile = useCallback(() => {
    const opener = profileOpenerRef.current
    const selectedRow = Array.from(playerListRef.current?.querySelectorAll<HTMLElement>('[data-player-id]') ?? []).find(
      (row) => row.dataset.playerId === selectedPlayerId,
    )
    const returnTarget = opener ?? selectedRow?.querySelector<HTMLButtonElement>('.of-athlete-row-content') ?? playerListRef.current
    setSelectedPlayerId(null)
    setActiveDetailTab('overview')
    setMetricDrafts({})
    setMetricError(null)
    setMetricNotice(null)
    queueMicrotask(() => {
      returnTarget?.focus()
      profileOpenerRef.current = null
    })
  }, [selectedPlayerId])

  function openSelectedPlayerEditor() {
    if (!selectedPlayer) {
      return
    }

    setFormValues(playerToFormValues(selectedPlayer))
    setFormError(null)
    setFormNotice(null)
    setIsEditorOpen(true)
    clearPhotoLoadError()
  }

  const closePlayerSheet = useCallback(() => {
    setIsEditorOpen(false)
    setFormError(null)
    setFormNotice(null)
    clearPhotoLoadError()
  }, [clearPhotoLoadError])

  useEffect(() => {
    if (!isEditorOpen) {
      return undefined
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closePlayerSheet()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [closePlayerSheet, isEditorOpen])

  useEffect(() => {
    if (!selectedPlayer || isEditorOpen) {
      return undefined
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closePlayerProfile()
        return
      }

      if (event.key !== 'Tab' || !isMobileDetailOverlay || !playerDetailRef.current) {
        return
      }

      const focusableElements = Array.from(
        playerDetailRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      )
      if (focusableElements.length === 0) {
        event.preventDefault()
        playerDetailRef.current.focus()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [closePlayerProfile, isEditorOpen, isMobileDetailOverlay, selectedPlayer])

  useEffect(() => {
    if (!selectedPlayer || isEditorOpen || !isMobileDetailOverlay) {
      return
    }

    const firstFocusable = playerDetailRef.current?.querySelector<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )
    ;(firstFocusable ?? playerDetailRef.current)?.focus()
  }, [isEditorOpen, isMobileDetailOverlay, selectedPlayer])

  useEffect(() => {
    if (!selectedPlayer || isEditorOpen || !isMobileDetailOverlay) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isEditorOpen, isMobileDetailOverlay, selectedPlayer])

  function handleDetailTabChange(tab: PlayerDetailTab) {
    setActiveDetailTab(tab)
  }

  function updateMetricDraft(metricKey: string, value: string) {
    setMetricDrafts((currentDrafts) => ({ ...currentDrafts, [metricKey]: value }))
    setMetricError(null)
    setMetricNotice(null)
    metricActions?.clearError()
  }

  async function saveProfileMetric(definition: MetricDefinition) {
    if (!selectedPlayer || !metricActions) {
      return
    }

    const value = metricDrafts[definition.key]?.trim() ?? ''
    if (!value) {
      setMetricError('Bitte zuerst einen Wert eintragen.')
      return
    }

    setMetricError(null)
    setMetricNotice(null)
    metricActions.clearError()
    triggerHapticFeedback('selection')

    try {
      const result = await metricActions.savePlayerMetric(selectedPlayer, {
        attempt: 1,
        bodySide: 'none',
        metricKey: definition.key,
        value,
      })
      if (!result.ok) {
        setMetricError(result.errorMessage)
        triggerHapticFeedback('warning')
        return
      }
      await Promise.all([metricActions.refreshMetrics(), profileActions.refreshPlayerProfiles()])
      setMetricDrafts((currentDrafts) => {
        const nextDrafts = { ...currentDrafts }
        delete nextDrafts[definition.key]
        return nextDrafts
      })
      setMetricNotice(`${definition.name} gespeichert.`)
      triggerHapticFeedback('success')
    } catch (caughtError) {
      triggerHapticFeedback('warning')
      setMetricError(caughtError instanceof Error ? caughtError.message : 'Testwert konnte nicht gespeichert werden.')
    }
  }

  useEffect(
    () => () => {
      Object.values(photoPreviewUrlsRef.current).forEach((url) => URL.revokeObjectURL(url))
      photoPreviewUrlsRef.current = {}
    },
    [],
  )

  if (authState.status !== 'signed-in') {
    return (
      <div className="content-stack">
        <section className="placeholder" aria-labelledby="players-locked-heading">
          <Users className="placeholder-icon" aria-hidden />
          <h2 id="players-locked-heading">Spieler-Stammdaten</h2>
          <p>Dynamische Spieler-Daten werden erst nach Coach-Login in Einstellungen geladen.</p>
        </section>
      </div>
    )
  }

  function updateField<K extends keyof PlayerFormValues>(field: K, value: PlayerFormValues[K]) {
    setFormValues((currentValues) => ({ ...currentValues, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setFormNotice(null)
    clearPhotoLoadError()
    setIsSubmitting(true)
    triggerHapticFeedback('selection')

    try {
      await savePlayer(formValues, selectedPlayer ?? undefined)
      const notice = selectedPlayer ? 'Spieler aktualisiert.' : 'Spieler angelegt.'
      setFormNotice(notice)
      setViewNotice(notice)
      await profileActions.refreshPlayerProfiles()
      triggerHapticFeedback('success')
      if (!selectedPlayer) {
        setFormValues(emptyPlayerFormValues)
        setIsEditorOpen(false)
      }
    } catch (caughtError) {
      triggerHapticFeedback('warning')
      setFormError(caughtError instanceof Error ? caughtError.message : 'Spieler konnte nicht gespeichert werden.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeactivate() {
    if (!selectedPlayer) {
      return
    }

    setFormError(null)
    setFormNotice(null)
    clearPhotoLoadError()
    triggerHapticFeedback('selection')

    try {
      await deactivatePlayer(selectedPlayer)
      await profileActions.refreshPlayerProfiles()
      setFormNotice('Spieler deaktiviert.')
      triggerHapticFeedback('success')
    } catch (caughtError) {
      triggerHapticFeedback('warning')
      setFormError(caughtError instanceof Error ? caughtError.message : 'Spieler konnte nicht deaktiviert werden.')
    }
  }

  async function handleDelete() {
    if (!selectedPlayer) {
      return
    }

    const confirmed = window.confirm(
      `${selectedPlayer.name} wirklich loeschen? Der Spieler wird lokal entfernt und aus der Datenbank geloescht. Historische Eintraege bleiben anonymisiert fuer Backups und Verlauf erhalten.`,
    )
    if (!confirmed) {
      return
    }

    setFormError(null)
    setFormNotice(null)
    clearPhotoLoadError()
    triggerHapticFeedback('selection')

    try {
      await deletePlayer(selectedPlayer)
      setSelectedPlayerId(null)
      setFormValues(emptyPlayerFormValues)
      await profileActions.refreshPlayerProfiles()
      setFormNotice('Spieler geloescht.')
      setIsEditorOpen(false)
      triggerHapticFeedback('success')
    } catch (caughtError) {
      triggerHapticFeedback('warning')
      setFormError(caughtError instanceof Error ? caughtError.message : 'Spieler konnte nicht geloescht werden.')
    }
  }

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!selectedPlayer || !file) {
      return
    }

    setFormError(null)
    setFormNotice(null)
    clearPhotoLoadError()
    triggerHapticFeedback('selection')

    try {
      const previewUrl = URL.createObjectURL(file)
      setPhotoPreviewUrls((currentUrls) => {
        const previousUrl = currentUrls[selectedPlayer.id]
        if (previousUrl) {
          URL.revokeObjectURL(previousUrl)
        }
        const nextUrls = { ...currentUrls, [selectedPlayer.id]: previewUrl }
        photoPreviewUrlsRef.current = nextUrls
        return nextUrls
      })
      await uploadPlayerPhoto(selectedPlayer, file)
      await profileActions.refreshPlayerProfiles()
      setFormNotice('Profilfoto gespeichert.')
      triggerHapticFeedback('success')
    } catch (caughtError) {
      setPhotoPreviewUrls((currentUrls) => {
        const previousUrl = currentUrls[selectedPlayer.id]
        if (previousUrl) {
          URL.revokeObjectURL(previousUrl)
        }
        const remainingUrls = { ...currentUrls }
        delete remainingUrls[selectedPlayer.id]
        photoPreviewUrlsRef.current = remainingUrls
        return remainingUrls
      })
      triggerHapticFeedback('warning')
      setFormError(caughtError instanceof Error ? caughtError.message : 'Profilfoto konnte nicht gespeichert werden.')
    }
  }

  async function handlePhotoRemove() {
    if (!selectedPlayer) {
      return
    }

    setFormError(null)
    setFormNotice(null)
    clearPhotoLoadError()
    triggerHapticFeedback('selection')

    try {
      await removePlayerPhoto(selectedPlayer)
      await profileActions.refreshPlayerProfiles()
      setPhotoPreviewUrls((currentUrls) => {
        const previousUrl = currentUrls[selectedPlayer.id]
        if (previousUrl) {
          URL.revokeObjectURL(previousUrl)
        }
        const remainingUrls = { ...currentUrls }
        delete remainingUrls[selectedPlayer.id]
        photoPreviewUrlsRef.current = remainingUrls
        return remainingUrls
      })
      setFormNotice('Profilfoto entfernt.')
      triggerHapticFeedback('success')
    } catch (caughtError) {
      triggerHapticFeedback('warning')
      setFormError(caughtError instanceof Error ? caughtError.message : 'Profilfoto konnte nicht entfernt werden.')
    }
  }

  const playerForm = (
    <PlayerEditorForm
      actionChildren={
        selectedPlayer ? (
          <>
            <button className="secondary-action danger" type="button" onClick={handleDeactivate}>
              <UserMinus className="nav-icon" aria-hidden />
              <span>Deaktivieren</span>
            </button>
            <button className="secondary-action danger" type="button" onClick={handleDelete}>
              <Trash2 className="nav-icon" aria-hidden />
              <span>Loeschen</span>
            </button>
          </>
        ) : null
      }
      formError={formError}
      formNotice={formNotice}
      isSubmitting={isSubmitting}
      onFieldChange={updateField}
      onSubmit={handleSubmit}
      photoLoadError={photoLoadError}
      values={formValues}
    >
      {selectedPlayer && selectedPlayer.photoConsentStatus === 'allowed' ? (
        <div className="photo-actions">
          <label className="secondary-action file-action">
            <Camera className="nav-icon" aria-hidden />
            <span>Foto aufnehmen/waehlen</span>
            <input type="file" accept="image/jpeg,image/webp,image/png" onChange={handlePhotoChange} />
          </label>
          {selectedPlayer.photoPath ? (
            <button className="secondary-action danger" type="button" onClick={handlePhotoRemove}>
              <Trash2 className="nav-icon" aria-hidden />
              <span>Foto entfernen</span>
            </button>
          ) : null}
        </div>
      ) : null}
    </PlayerEditorForm>
  )
  const visibleMetricError = metricError ?? metricActions?.errorMessage ?? null

  return (
    <section className={selectedPlayer ? 'players-layout has-detail' : 'players-layout'} aria-labelledby="players-heading">
      <aside className="panel players-sidebar">
        <div className="library-heading">
          <p className="eyebrow">Kader</p>
          <h3 id="players-heading">Spieler</h3>
          <p>{players.length} Spieler lokal erfasst. Liste bleibt kompakt; Details erscheinen nach Auswahl.</p>
        </div>

        <div className="player-toolbar">
          <PrimaryButton icon={<UserPlus className="nav-icon" aria-hidden />} onClick={openNewPlayerSheet}>
            Spieler anlegen
          </PrimaryButton>
          {syncOverview.status === 'error' ? (
            <SecondaryButton icon={<RefreshCw className="nav-icon" aria-hidden />} isLoading={isLoading} loadingLabel="Sync laeuft" onClick={runSync}>
              Erneut synchronisieren
            </SecondaryButton>
          ) : null}
        </div>

        <label className="search-box">
          <Search className="nav-icon" aria-hidden />
          <span className="sr-only">Spieler suchen</span>
          <input
            value={searchQuery}
            placeholder="Suche nach Name, Position, Cluster"
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </label>

        <div className="filter-row" aria-label="Spielerfilter">
          {[
            { id: 'active' as const, label: 'Aktiv' },
            { id: 'all' as const, label: 'Alle' },
            { id: 'returner' as const, label: 'Returner' },
            { id: 'issues' as const, label: 'Offene Themen' },
          ].map((filter) => (
            <button
              className={statusFilter === filter.id ? 'filter-chip active' : 'filter-chip'}
              aria-pressed={statusFilter === filter.id}
              key={filter.id}
              type="button"
              onClick={() => setStatusFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {showSyncAttention ? (
          <div className="sync-mini">
            <span className={`status-dot ${syncOverview.status === 'synced' ? 'online' : ''}`} aria-hidden />
            <strong>{syncStatusLabel(syncOverview.status)}</strong>
            <span>{pendingCountLabel(syncOverview.pendingCount)}</span>
          </div>
        ) : null}
        {profileActions.isLoading ? <Skeleton label="Profilverlauf wird lokal gelesen" /> : null}
        {viewNotice ? (
          <p className="form-success player-view-notice" aria-live="polite">
            {viewNotice}
          </p>
        ) : null}

        <section className="player-list" aria-label="Spielerliste" ref={playerListRef} tabIndex={-1}>
          {isLoading && players.length === 0 ? (
            <div className="player-list-skeletons" aria-label="Spielerliste wird geladen">
              <Skeleton variant="row" />
              <Skeleton variant="row" />
              <Skeleton variant="row" />
            </div>
          ) : null}
          {filteredPlayers.map((player) => {
            const profile = profileActions.profilesByPlayerId[player.id]
            return (
              <AthleteRow
                key={player.id}
                media={<PlayerAvatar player={player} previewUrl={photoPreviewUrls[player.id]} />}
                meta={[player.position, optionLabel(positionGroupOptions, player.cluster)]}
                name={player.name}
                note={playerRowNote(profile)}
                onSelect={(event) => openPlayerDetail(player, event.currentTarget)}
                playerId={player.id}
                readinessLabel={
                  profile?.latestSession?.trafficLight
                    ? `Status ${trafficLabels[profile.latestSession.trafficLight]}`
                    : player.returnerStatus === 'ja'
                      ? 'Returner'
                      : 'Check-in offen'
                }
                readinessTone={playerReadinessTone(player, profile)}
                selected={selectedPlayer?.id === player.id}
                selectDescription={playerRowNote(profile)}
                selectLabel={playerRowAriaLabel(player, profile)}
                status={<PlayerStatusRow player={player} profile={profile} />}
              />
            )
          })}
          {!isLoading && players.length === 0 ? (
            <EmptyState body="Lege den ersten Spieler über die Primärhandlung oben an." title="Noch keine Spieler angelegt" />
          ) : null}
          {players.length > 0 && filteredPlayers.length === 0 ? (
            <EmptyState body="Passe Suche oder Filter an, um andere Spieler anzuzeigen." title="Keine Treffer" />
          ) : null}
        </section>
      </aside>

      {selectedPlayer && !isEditorOpen && isMobileDetailOverlay ? (
        <button
          className="player-detail-backdrop"
          type="button"
          aria-label="Spielerprofil-Hintergrund schließen"
          onClick={closePlayerProfile}
        />
      ) : null}

      {selectedPlayer ? (
        <PlayerDetailView
          activeTab={activeDetailTab}
          canOpenSourceSession={canOpenSourceSession}
          detailRef={playerDetailRef}
          metricActions={metricActions}
          metricDrafts={metricDrafts}
          metricError={visibleMetricError}
          metricNotice={metricNotice}
          metricSessionLabel={metricSessionLabel}
          isModal={isMobileDetailOverlay}
          onClose={closePlayerProfile}
          onEdit={openSelectedPlayerEditor}
          onMetricDraftChange={updateMetricDraft}
          onMetricSave={saveProfileMetric}
          onPhotoLoadError={markPhotoLoadError}
          onOpenSourceSession={onOpenSourceSession}
          onOpenReturner={onOpenReturner}
          onTabChange={handleDetailTabChange}
          photoPreviewUrl={photoPreviewUrls[selectedPlayer.id]}
          player={selectedPlayer}
          profile={selectedPlayerProfile}
        />
      ) : null}

      {isEditorOpen ? (
        <div
          className="player-editor-backdrop"
          role="presentation"
          onClick={(event) => {
            if (event.currentTarget === event.target) {
              closePlayerSheet()
            }
          }}
        >
          <article
            className="panel player-detail player-editor-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="player-editor-heading"
          >
            <div className="library-heading player-editor-heading">
              <div>
                <p className="eyebrow">Neu anlegen</p>
                <h3 id="player-editor-heading">Spieler-Stammdaten</h3>
                <p>
                  {activeSportConfig.athleteLabels.positionLabel}, {activeSportConfig.athleteLabels.positionGroupLabel},
                  Consent, {activeSportConfig.reconditioningLabels.statusLabel} und Foto-Erlaubnis.
                </p>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label="Spielerformular schliessen"
                onClick={closePlayerSheet}
              >
                <X className="nav-icon" aria-hidden />
              </button>
            </div>
            {playerForm}
          </article>
        </div>
      ) : null}
    </section>
  )
}
