import { Camera, RefreshCw, Save, Search, Trash2, UserMinus, UserPlus, Users, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { sprint30mOptionalLabel } from '../domain/baseline'
import { formatExerciseResult, getExerciseDefinition, type ExerciseResult } from '../domain/exercises'
import { exposureTypes, type PlayerExposureSummary } from '../domain/exposures'
import { getMetricDefinition, type MetricResult } from '../domain/metrics'
import {
  clusterOptions,
  consentStatusOptions,
  emptyPlayerFormValues,
  getPlayerInitials,
  photoConsentOptions,
  playerToFormValues,
  returnerStatusOptions,
  type ConsentStatus,
  type PhotoConsentStatus,
  type Player,
  type PlayerCluster,
  type PlayerFormValues,
  type ReturnerStatus,
} from '../domain/players'
import type { AuthSessionState } from '../lib/auth'
import { triggerHapticFeedback } from '../lib/interactionFeedback'
import { refreshRemoteExposureSummaries } from '../lib/exposureRepository'
import { refreshRemoteExerciseResults } from '../lib/exerciseRepository'
import { refreshRemoteMetricResults } from '../lib/metricRepository'
import { downloadPlayerPhotoUrl } from '../lib/playerRepository'
import { pendingCountLabel, shouldShowSyncAttention, syncStatusLabel } from '../lib/syncLabels'
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

type PlayerActions = ReturnType<typeof usePlayers>

type PlayersViewProps = {
  authState: AuthSessionState
  canOpenSourceSession?: (source: PlayerAnalysisSource) => boolean
  onOpenSourceSession?: (source: PlayerAnalysisSource) => void
  playerActions: PlayerActions
  todayKey?: string
}

type PlayerDetailTab = 'overview' | 'training' | 'tests' | 'load' | 'issues' | 'returner' | 'edit'

const playerDetailTabs: Array<{ id: PlayerDetailTab; label: string }> = [
  { id: 'overview', label: 'Übersicht' },
  { id: 'training', label: 'Training' },
  { id: 'tests', label: 'Tests' },
  { id: 'load', label: 'Load' },
  { id: 'issues', label: 'Issues' },
  { id: 'returner', label: 'Returner' },
  { id: 'edit', label: 'Bearbeiten' },
]

const attendanceLabels = {
  open: 'offen',
  present: 'anwesend',
  absent: 'nicht da',
} as const

const sourceLabels = {
  coach: 'Coach',
  player_link: 'Link',
  player_kiosk: 'Kiosk',
  mixed: 'Mixed',
} as const

function optionLabel<T extends string>(options: Array<{ value: T; label: string }>, value: T) {
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
    result.painResponse !== 'unclear' ? `Pain ${result.painResponse}` : null,
  ].filter(Boolean)

  return `${details} · ${definition.pattern}${tags.length > 0 ? ` · ${tags.join(' · ')}` : ''}`
}

function profileTrafficClass(profile: PlayerProfileSummary | undefined) {
  return profile?.latestSession?.trafficLight ? `traffic-${profile.latestSession.trafficLight}` : 'traffic-open'
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

function PlayerBadgeRow({ player, profile }: { player: Player; profile: PlayerProfileSummary | undefined }) {
  const trafficLight = profile?.latestSession?.trafficLight

  return (
    <span className="player-badges" aria-label={`Status ${player.name}`}>
      <span className="tag compact">{player.active ? 'aktiv' : 'inaktiv'}</span>
      {player.consentStatus !== 'vorhanden' ? <span className="tag compact warning-tag">Consent {player.consentStatus}</span> : null}
      {player.returnerStatus !== 'nein' ? <span className="tag compact warning-tag">Returner {player.returnerStatus}</span> : null}
      {trafficLight ? <span className={`tag compact ${trafficLight === 'red' ? 'danger' : ''}`}>Ampel {trafficLight}</span> : null}
      {profile?.openIssues.items.length ? <span className="tag compact warning-tag">Issues {profile.openIssues.items.length}</span> : null}
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
  editContent,
  onPhotoLoadError,
  onOpenSourceSession,
  onTabChange,
  photoPreviewUrl,
  player,
  profile,
}: {
  activeTab: PlayerDetailTab
  canOpenSourceSession?: (source: PlayerAnalysisSource) => boolean
  editContent: ReactNode
  onPhotoLoadError: () => void
  onOpenSourceSession?: (source: PlayerAnalysisSource) => void
  onTabChange: (tab: PlayerDetailTab) => void
  photoPreviewUrl?: string
  player: Player
  profile: PlayerProfileSummary | undefined
}) {
  return (
    <article className={`panel player-detail ${profileTrafficClass(profile)}`} aria-labelledby="player-detail-heading">
      <div className="player-detail-heading">
        <PlayerAvatar onPhotoLoadError={onPhotoLoadError} player={player} previewUrl={photoPreviewUrl} />
        <div>
          <p className="eyebrow">Spielerprofil</p>
          <h3 id="player-detail-heading">{player.name}</h3>
          <p>{player.position} · {optionLabel(clusterOptions, player.cluster)}</p>
          <PlayerBadgeRow player={player} profile={profile} />
        </div>
      </div>

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
          <div className="metric-grid mini">
            <MetricCard label="Position" value={player.position} />
            <MetricCard label="Cluster" value={optionLabel(clusterOptions, player.cluster)} />
            <MetricCard label="Consent" value={optionLabel(consentStatusOptions, player.consentStatus)} />
            <MetricCard label="Foto" value={optionLabel(photoConsentOptions, player.photoConsentStatus)} />
            <MetricCard label="Returner" value={optionLabel(returnerStatusOptions, player.returnerStatus)} />
            <MetricCard label="Status" value={player.active ? 'aktiv' : 'inaktiv'} />
          </div>
          <ProfileSection title="Letzte Einheit" emptyText="Noch keine Einheit erfasst.">
            {profile?.latestSession ? (
              <div className="metric-grid mini">
                <MetricCard label="Datum" value={profile.latestSession.sessionDate} />
                <MetricCard label="Anwesenheit" value={attendanceLabels[profile.latestSession.attendanceStatus]} />
                <MetricCard label="Readiness" value={displayValue(profile.latestSession.readiness)} />
                <MetricCard label="Pain" value={profile.latestSession.painScore !== null ? `${profile.latestSession.painScore}/10` : '-'} />
                <MetricCard label="Ampel" value={displayValue(profile.latestSession.trafficLight)} />
                <MetricCard
                  label="Quelle"
                  value={profile.latestSession.source ? sourceLabels[profile.latestSession.source] : '-'}
                />
              </div>
            ) : null}
          </ProfileSection>
          {player.notes ? (
            <ProfileSection title="Coach-Notiz">
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
                <MetricCard label="Pain" value={profile.latestSession.painScore !== null ? `${profile.latestSession.painScore}/10` : '-'} />
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

      {activeTab === 'edit' ? editContent : null}
    </article>
  )
}

export function PlayersView({ authState, canOpenSourceSession, onOpenSourceSession, playerActions, todayKey }: PlayersViewProps) {
  const { players, syncOverview, isLoading, runSync, savePlayer, deactivatePlayer, deletePlayer, uploadPlayerPhoto } =
    playerActions
  const { removePlayerPhoto } = playerActions
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  const [activeDetailTab, setActiveDetailTab] = useState<PlayerDetailTab>('overview')
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'active' | 'all' | 'returner' | 'issues'>('active')
  const [formValues, setFormValues] = useState<PlayerFormValues>(emptyPlayerFormValues)
  const [formError, setFormError] = useState<string | null>(null)
  const [formNotice, setFormNotice] = useState<string | null>(null)
  const [viewNotice, setViewNotice] = useState<string | null>(null)
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<Record<string, string>>({})
  const photoPreviewUrlsRef = useRef<Record<string, string>>({})
  const { clearPhotoLoadError, markPhotoLoadError, photoLoadError } = usePhotoLoadError()
  const showSyncAttention = shouldShowSyncAttention(syncOverview)
  const profileActions = usePlayerProfiles(authState.status === 'signed-in' ? authState.user.id : null, players, todayKey)

  const selectedPlayer = useMemo(
    () => players.find((player) => player.id === selectedPlayerId) ?? null,
    [players, selectedPlayerId],
  )
  const selectedPlayerProfile = selectedPlayer ? profileActions.profilesByPlayerId[selectedPlayer.id] : undefined

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
    setSelectedPlayerId(null)
    setActiveDetailTab('overview')
    setFormValues(emptyPlayerFormValues)
    setFormError(null)
    setFormNotice(null)
    setViewNotice(null)
    clearPhotoLoadError()
    setIsEditorOpen(true)
  }

  function openPlayerDetail(player: Player) {
    setSelectedPlayerId(player.id)
    setActiveDetailTab('overview')
    setFormValues(playerToFormValues(player))
    setFormError(null)
    setFormNotice(null)
    setViewNotice(null)
    clearPhotoLoadError()
    setIsEditorOpen(false)
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

  function handleDetailTabChange(tab: PlayerDetailTab) {
    if (tab === 'edit' && selectedPlayer) {
      setFormValues(playerToFormValues(selectedPlayer))
      setFormError(null)
      setFormNotice(null)
      clearPhotoLoadError()
    }

    setActiveDetailTab(tab)
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
    <form className="field-form player-form" onSubmit={handleSubmit}>
          <label>
            <span>Name</span>
            <input
              value={formValues.name}
              onChange={(event) => updateField('name', event.target.value)}
              required
            />
          </label>

          <label>
            <span>Position</span>
            <input
              value={formValues.position}
              placeholder="z. B. Prop, Lock, 9, Centre"
              onChange={(event) => updateField('position', event.target.value)}
            />
          </label>

          <div className="form-grid">
            <label>
              <span>Cluster</span>
              <select
                value={formValues.cluster}
                onChange={(event) => updateField('cluster', event.target.value as PlayerCluster)}
              >
                {clusterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Consent</span>
              <select
                value={formValues.consentStatus}
                onChange={(event) => updateField('consentStatus', event.target.value as ConsentStatus)}
              >
                {consentStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Returner</span>
              <select
                value={formValues.returnerStatus}
                onChange={(event) => updateField('returnerStatus', event.target.value as ReturnerStatus)}
              >
                {returnerStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Foto-Erlaubnis</span>
              <select
                value={formValues.photoConsentStatus}
                onChange={(event) => updateField('photoConsentStatus', event.target.value as PhotoConsentStatus)}
              >
                {photoConsentOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="toggle-row">
            <input
              type="checkbox"
              checked={formValues.active}
              onChange={(event) => updateField('active', event.target.checked)}
            />
            <span>Aktiv</span>
          </label>

          <label>
            <span>Coach-Notizen, keine Diagnosen</span>
            <textarea
              value={formValues.notes}
              rows={4}
              onChange={(event) => updateField('notes', event.target.value)}
            />
          </label>

          <div className="form-actions">
            <button className="primary-action" type="submit" disabled={isSubmitting}>
              <Save className="nav-icon" aria-hidden />
              <span>{isSubmitting ? 'Speichert...' : 'Speichern'}</span>
            </button>
            {selectedPlayer ? (
              <button className="secondary-action danger" type="button" onClick={handleDeactivate}>
                <UserMinus className="nav-icon" aria-hidden />
                <span>Deaktivieren</span>
              </button>
            ) : null}
            {selectedPlayer ? (
              <button className="secondary-action danger" type="button" onClick={handleDelete}>
                <Trash2 className="nav-icon" aria-hidden />
                <span>Loeschen</span>
              </button>
            ) : null}
          </div>

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

          {formNotice ? <p className="form-notice">{formNotice}</p> : null}
          {photoLoadError ? <p className="form-error">Profilfoto konnte nicht geladen werden.</p> : null}
          {formError ? <p className="form-error">{formError}</p> : null}
    </form>
  )

  return (
    <section className={selectedPlayer ? 'players-layout has-detail' : 'players-layout'} aria-labelledby="players-heading">
      <aside className="panel players-sidebar">
        <div className="library-heading">
          <p className="eyebrow">Kader</p>
          <h3 id="players-heading">Spieler</h3>
          <p>{players.length} Spieler lokal erfasst. Liste bleibt kompakt; Details erscheinen nach Auswahl.</p>
        </div>

        <div className="player-toolbar">
          <button className="secondary-action" type="button" onClick={openNewPlayerSheet}>
            <UserPlus className="nav-icon" aria-hidden />
            <span>Neu</span>
          </button>
          {syncOverview.status === 'error' ? (
            <button className="secondary-action" type="button" onClick={runSync} disabled={isLoading}>
              <RefreshCw className="nav-icon" aria-hidden />
              <span>Retry</span>
            </button>
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
            { id: 'issues' as const, label: 'Issues' },
          ].map((filter) => (
            <button
              className={statusFilter === filter.id ? 'filter-chip active' : 'filter-chip'}
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
        {profileActions.isLoading ? <p className="sync-mini">Profilverlauf wird lokal gelesen...</p> : null}
        {viewNotice ? (
          <p className="form-success player-view-notice" aria-live="polite">
            {viewNotice}
          </p>
        ) : null}

        <div className="player-list" aria-label="Spielerliste">
          {filteredPlayers.map((player) => {
            const profile = profileActions.profilesByPlayerId[player.id]
            return (
              <button
                className={selectedPlayer?.id === player.id ? 'player-list-item active' : 'player-list-item'}
                key={player.id}
                type="button"
                onClick={() => openPlayerDetail(player)}
              >
                <PlayerAvatar player={player} previewUrl={photoPreviewUrls[player.id]} />
                <span>
                  <strong>{player.name}</strong>
                  <small>
                    {player.position} · {optionLabel(clusterOptions, player.cluster)}
                  </small>
                  <PlayerBadgeRow player={player} profile={profile} />
                </span>
              </button>
            )
          })}
          {players.length === 0 ? <p className="empty-state">Noch keine Spieler angelegt.</p> : null}
          {players.length > 0 && filteredPlayers.length === 0 ? <p className="empty-state">Kein Spieler passt zum Filter.</p> : null}
        </div>
      </aside>

      {selectedPlayer ? (
        <PlayerDetailView
          activeTab={activeDetailTab}
          canOpenSourceSession={canOpenSourceSession}
          editContent={playerForm}
          onPhotoLoadError={markPhotoLoadError}
          onOpenSourceSession={onOpenSourceSession}
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
                <p>Position, Cluster, Consent, Returner-Status und Foto-Erlaubnis.</p>
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
