import {
  AlertTriangle,
  Dumbbell,
  FileText,
  Gauge,
  Play,
  RefreshCw,
  Route,
  ShieldAlert,
  UserCheck,
} from 'lucide-react'
import { useState, type FormEvent } from 'react'
import type { HubTab } from '../App'
import { libraryItems } from '../content/library'
import { exerciseMappings, variantCards } from '../content/trainingReference'
import type { SessionBlock, SessionBlockExercise, SessionDefinition } from '../content/types'
import type { CheckInEntryPatch, CheckInLimit, PlayerSessionEntry, PlayerWarning, TrafficLight } from '../domain/checkIn'
import { clusterOptions, type Player } from '../domain/players'
import type { ReturnerCapSummary } from '../domain/returners'
import { sessionBlockStatusLabels } from '../domain/sessionBlocks'
import {
  appendLiveObservation,
  applyTrainingQuickAction,
  type LiveObservationCategory,
  type TrainingQuickAction,
} from '../domain/training'
import type { useCheckIns } from '../hooks/useCheckIns'
import type { useExercises } from '../hooks/useExercises'
import type { useExposures } from '../hooks/useExposures'
import type { useMetrics } from '../hooks/useMetrics'
import type { useSessionBlocks } from '../hooks/useSessionBlocks'
import type { AuthSessionState } from '../lib/auth'
import { hasPlayerId } from '../lib/playerId'
import { pendingCountLabel, shouldShowSyncAttention, syncStatusLabel } from '../lib/syncLabels'
import { LiveSessionStepper } from './LiveSessionStepper'
import { ExposureReviewPanel } from './ExposureReviewPanel'
import { SessionPicker } from './SessionPicker'

type TrainingActions = ReturnType<typeof useCheckIns>
type SessionBlockActions = ReturnType<typeof useSessionBlocks>
type ExposureActions = ReturnType<typeof useExposures>
type MetricActions = ReturnType<typeof useMetrics>
type ExerciseActions = ReturnType<typeof useExercises>

type TrainingViewProps = {
  authState: AuthSessionState
  checkInActions: TrainingActions
  exerciseActions?: ExerciseActions
  exposureActions: ExposureActions
  metricActions?: MetricActions
  onOpenLibraryItem: (itemId: string) => void
  onNavigate: (tab: HubTab) => void
  onSessionChange: (sessionId: string) => void
  returnerCaps: ReturnerCapSummary[]
  selectedSession: SessionDefinition
  selectedSessionId: string
  sessionBlockActions: SessionBlockActions
  sessions: SessionDefinition[]
}

type TrainingPlayerFilter = 'open' | 'present' | 'warning' | 'returner' | 'cluster' | 'all'

const trafficLabels: Record<TrafficLight, string> = {
  green: 'Gruen',
  yellow: 'Gelb',
  red: 'Rot',
}

const limitLabels: Record<CheckInLimit, string> = {
  kein_sprint: 'kein Sprint',
  kein_cond: 'kein Conditioning',
  kein_schweres_heben: 'kein schweres Heben',
  physio: 'Physio/Medical',
  klaeren: 'klaeren',
}

const quickActions: Array<{ action: TrainingQuickAction; label: string; tone?: 'danger' }> = [
  { action: 'variant_c', label: 'C-Variante' },
  { action: 'variant_d', label: 'D / stop / klaeren', tone: 'danger' },
  { action: 'kein_sprint', label: 'kein Sprint' },
  { action: 'kein_conditioning', label: 'kein Conditioning' },
  { action: 'kein_schweres_heben', label: 'kein schweres Heben' },
  { action: 'physio_medical', label: 'Physio/Medical' },
]

const liveObservationCategories: LiveObservationCategory[] = [
  'Warm-up',
  'Movement',
  'Speed',
  'Technik',
  'Kraft',
  'Conditioning',
  'Kontakt',
  'Orga',
]

const playerFilterOptions: Array<{ value: TrainingPlayerFilter; label: string }> = [
  { value: 'open', label: 'Offene Aufgaben' },
  { value: 'present', label: 'Anwesend' },
  { value: 'warning', label: 'Gelb/Rot' },
  { value: 'returner', label: 'Returner' },
  { value: 'cluster', label: 'Cluster' },
  { value: 'all', label: 'Alle' },
]

function trainingCollapsedStorageKey(userId: string, sessionId: string) {
  return `fieldHub:trainingLiveCollapsed:${userId}:${sessionId}`
}

function readTrainingCollapsed(userId: string | null, sessionId: string) {
  if (!userId || typeof window === 'undefined') {
    return false
  }

  try {
    return window.localStorage.getItem(trainingCollapsedStorageKey(userId, sessionId)) === 'true'
  } catch {
    return false
  }
}

function writeTrainingCollapsed(userId: string | null, sessionId: string, collapsed: boolean) {
  if (!userId || typeof window === 'undefined') {
    return
  }

  try {
    const key = trainingCollapsedStorageKey(userId, sessionId)
    if (collapsed) {
      window.localStorage.setItem(key, 'true')
    } else {
      window.localStorage.removeItem(key)
    }
  } catch {
    // Live state remains available in memory when storage is blocked.
  }
}

function normalizeTargetName(value: string) {
  return value
    .toLocaleLowerCase('de-AT')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

function normalizeTargetTokens(value: string) {
  return value
    .toLocaleLowerCase('de-AT')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
}

function playerMatchesTargetName(playerName: string, targetName: string) {
  const normalizedTarget = normalizeTargetName(targetName)
  if (!normalizedTarget) {
    return false
  }

  const playerFullName = normalizeTargetName(playerName)
  const targetTokens = normalizeTargetTokens(targetName)

  return (
    playerFullName === normalizedTarget ||
    normalizeTargetTokens(playerName).includes(normalizedTarget) ||
    (targetTokens.length > 1 && playerFullName.endsWith(normalizedTarget))
  )
}

function firstBlockKey(session: SessionDefinition) {
  return session.timeline[0]?.key ?? null
}

function exerciseTargetsPlayer(exercise: SessionBlockExercise, player: Player) {
  if (exercise.targeting === 'named') {
    return exercise.playerNames?.some((name) => playerMatchesTargetName(player.name, name)) ?? false
  }

  if (exercise.targeting === 'cluster') {
    return exercise.clusters?.includes(player.cluster) ?? false
  }

  if (exercise.targeting === 'returner') {
    return player.returnerStatus === 'ja'
  }

  return true
}

function blockHasOpenCaptureTask(
  block: SessionBlock | undefined,
  player: Player,
  metricActions: MetricActions | undefined,
  exerciseActions: ExerciseActions | undefined,
) {
  if (!block?.exercises) {
    return false
  }

  return block.exercises.some((exercise) => {
    if (!exerciseTargetsPlayer(exercise, player)) {
      return false
    }

    if (exercise.recording === 'metric' && exercise.metricKey) {
      return metricActions ? !metricActions.getMetricForPlayer(player, exercise.metricKey) : true
    }

    if (exercise.recording === 'exercise' && exercise.exerciseKey) {
      return exerciseActions ? !exerciseActions.getExerciseResultForPlayer(player, exercise.exerciseKey) : true
    }

    return false
  })
}

function formatTrafficLight(trafficLight: TrafficLight | null) {
  return trafficLight ? trafficLabels[trafficLight] : 'Offen'
}

function libraryButtonLabel(itemId: string) {
  const item = libraryItems.find((candidate) => candidate.id === itemId)

  if (!item) {
    return 'Quelle'
  }

  if (item.category === 'Varianten' || item.category === 'Exercise Mapping') {
    return item.category
  }

  return item.title
}

function WarningNote({ warning }: { warning: PlayerWarning | undefined }) {
  if (!warning) {
    return null
  }

  const followUps = [
    warning.e2Decision && warning.e2Decision !== 'normal' ? `E2 ${warning.e2Decision}` : null,
    warning.nextStep ? `Next ${warning.nextStep}` : null,
    warning.postPainScore !== null ? `Post-Pain ${warning.postPainScore}/10` : null,
  ].filter(Boolean)

  return (
    <div className="warning-note">
      <AlertTriangle className="nav-icon" aria-hidden />
      <span>
        Vorwarnung {warning.sessionDate}: {formatTrafficLight(warning.trafficLight)}
        {warning.returnerFlag !== 'nein' ? ` · Returner ${warning.returnerFlag}` : ''}
        {warning.limits.length > 0 ? ` · Limits ${warning.limits.map((limit) => limitLabels[limit]).join(', ')}` : ''}
        {followUps.length > 0 ? ` · ${followUps.join(' · ')}` : ''}
      </span>
    </div>
  )
}

function ReturnerCapNote({ cap }: { cap: ReturnerCapSummary | undefined }) {
  if (!cap) {
    return null
  }

  const parts = [
    cap.allowedToday ? `Erlaubt: ${cap.allowedToday}` : null,
    cap.speedCap ? `Speed: ${cap.speedCap}` : null,
    cap.codDecelCap ? `COD: ${cap.codDecelCap}` : null,
    cap.conditioningCap ? `Cond: ${cap.conditioningCap}` : null,
    cap.contactCap ? `Kontakt: ${cap.contactCap}` : null,
  ].filter(Boolean)

  if (parts.length === 0) {
    return null
  }

  return (
    <div className="warning-note returner-cap-note">
      <ShieldAlert className="nav-icon" aria-hidden />
      <span>Returner-Caps {cap.sessionDate}: {parts.join(' · ')}. Keine medizinische Freigabe.</span>
    </div>
  )
}

function TrainingPlayerRow({
  entry,
  isSavingDisabled,
  onSave,
  player,
  returnerCap,
  warning,
}: {
  entry: PlayerSessionEntry
  isSavingDisabled: boolean
  onSave: (player: Player, patch: CheckInEntryPatch) => void
  player: Player
  returnerCap: ReturnerCapSummary | undefined
  warning: PlayerWarning | undefined
}) {
  function handleObservationBlur(event: FormEvent<HTMLTextAreaElement>) {
    onSave(player, { observation: event.currentTarget.value, previousWarning: Boolean(warning) })
  }

  function handleQuickAction(action: TrainingQuickAction) {
    onSave(player, {
      ...applyTrainingQuickAction(entry, action),
      previousWarning: Boolean(warning),
    })
  }

  const trafficLight = entry.trafficLight ?? entry.trafficLightSuggestion
  const isStop = trafficLight === 'red' || entry.trainingVariant === 'D' || entry.limits.includes('klaeren')

  return (
    <article className={`training-player-row traffic-${trafficLight ?? 'open'}`}>
      <div className="checkin-player-head">
        <div>
          <div className="player-name-line">
            <strong>{player.name}</strong>
            {entry.trainingVariant ? <span className="tag compact">Variante {entry.trainingVariant}</span> : null}
            {isStop ? <span className="tag danger compact">Stop/klaeren</span> : null}
          </div>
          <p>
            {player.position} · {player.cluster} · Ampel {formatTrafficLight(trafficLight)}
          </p>
        </div>
        <span className={`sync-pill ${entry.syncStatus}`}>{syncStatusLabel(entry.syncStatus)}</span>
      </div>

      <WarningNote warning={warning} />
      <ReturnerCapNote cap={returnerCap} />

      <div className="training-limits">
        {entry.limits.length > 0 ? (
          entry.limits.map((limit) => (
            <span className={limit === 'klaeren' || limit === 'physio' ? 'tag danger compact' : 'tag compact'} key={limit}>
              {limitLabels[limit]}
            </span>
          ))
        ) : (
          <span className="tag compact">keine Limits gesetzt</span>
        )}
      </div>

      <div className="button-row training-actions">
        {quickActions.map((item) => (
          <button
            className={item.tone === 'danger' ? 'segmented danger' : 'segmented'}
            disabled={isSavingDisabled}
            key={item.action}
            type="button"
            onClick={() => handleQuickAction(item.action)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {isStop ? (
        <div className="warning-note danger">
          <ShieldAlert className="nav-icon" aria-hidden />
          <span>D/Rot wirkt nicht als normaler Trainingsblock. Keine automatische medizinische Freigabe.</span>
        </div>
      ) : null}

      <label className="inline-field wide">
        <span>Beobachtung, keine Diagnose</span>
        <textarea
          defaultValue={entry.observation}
          disabled={isSavingDisabled}
          rows={2}
          placeholder="z. B. C-Variante im Hinge, kein Sprint, Schulter beobachten"
          onBlur={handleObservationBlur}
        />
      </label>
    </article>
  )
}

export function TrainingView({
  authState,
  checkInActions,
  exerciseActions,
  exposureActions,
  metricActions,
  onOpenLibraryItem,
  onNavigate,
  onSessionChange,
  returnerCaps,
  selectedSession,
  selectedSessionId,
  sessionBlockActions,
  sessions,
}: TrainingViewProps) {
  const {
    activePlayers,
    errorMessage,
    expectedPlayerIds,
    warnings,
    syncOverview,
    isLoading,
    runSync,
    saveEntry,
    saveSessionPatch,
    getEntryForPlayer,
    sessionLog,
    clearError,
  } = checkInActions
  const signedInUserId = authState.status === 'signed-in' ? authState.user.id : null
  const blockSyncAttention = shouldShowSyncAttention(sessionBlockActions.syncOverview)
  const exposureSyncAttention = shouldShowSyncAttention(exposureActions.syncOverview)
  const showSyncAttention = shouldShowSyncAttention(syncOverview)
  const expectedPlayerSet = new Set(expectedPlayerIds)
  const warningByPlayerId = new Map(warnings.filter(hasPlayerId).map((warning) => [warning.playerId, warning]))
  const returnerCapByPlayerId = new Map(returnerCaps.filter(hasPlayerId).map((cap) => [cap.playerId, cap]))
  const orderedPlayers = [...activePlayers].sort((a, b) => {
    const aExpected = expectedPlayerSet.has(a.id)
    const bExpected = expectedPlayerSet.has(b.id)

    if (aExpected === bExpected) {
      return a.name.localeCompare(b.name, 'de-AT')
    }

    return aExpected ? -1 : 1
  })
  const variantCount = orderedPlayers.filter((player) => getEntryForPlayer(player).trainingVariant).length
  const limitedCount = orderedPlayers.filter((player) => getEntryForPlayer(player).limits.length > 0).length
  const [liveObservationTarget, setLiveObservationTarget] = useState('group')
  const [liveObservationCategory, setLiveObservationCategory] = useState<LiveObservationCategory>('Movement')
  const [liveObservationText, setLiveObservationText] = useState('')
  const [liveObservationFeedback, setLiveObservationFeedback] = useState<string | null>(null)
  const [liveModeState, setLiveModeState] = useState({
    collapsed: readTrainingCollapsed(signedInUserId, selectedSession.id),
    currentBlockKey: null as string | null,
    sessionId: selectedSession.id,
    started: false,
  })
  const [restartConfirmSessionId, setRestartConfirmSessionId] = useState<string | null>(null)
  const [trainingPlayerFilter, setTrainingPlayerFilter] = useState<TrainingPlayerFilter>('open')
  const [trainingPlayerSearch, setTrainingPlayerSearch] = useState('')
  const [trainingClusterFilter, setTrainingClusterFilter] = useState('offen')
  const hasTrainingProgress = sessionBlockActions.blockLogs.length > 0
  const isLiveModeForSession = liveModeState.sessionId === selectedSession.id
  const isLiveModeStarted = isLiveModeForSession && liveModeState.started
  const isLiveCollapsed = isLiveModeForSession
    ? liveModeState.collapsed
    : readTrainingCollapsed(signedInUserId, selectedSession.id)
  const showLiveStepper = isLiveModeStarted && !isLiveCollapsed
  const currentLiveBlockKey = isLiveModeForSession ? liveModeState.currentBlockKey : null
  const currentLiveBlock =
    selectedSession.timeline.find((block) => block.key === currentLiveBlockKey) ?? selectedSession.timeline[0]
  const canResumeTraining = hasTrainingProgress || isLiveCollapsed
  const trainingActionLabel = showLiveStepper ? 'Training laeuft' : canResumeTraining ? 'Training fortsetzen' : 'Training starten'
  const activeExposureSummaryCount = sessionLog
    ? exposureActions.summaries.filter((summary) => summary.sessionLogId === sessionLog.id && !summary.deletedAt).length
    : 0
  const showRestartConfirm = restartConfirmSessionId === selectedSession.id

  function handleSessionTextBlur(field: 'contactIndex' | 'speedExposureNote') {
    return (event: FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.currentTarget.value.trim()
      const currentValue = sessionLog?.[field] ?? ''

      if (value === currentValue) {
        return
      }

      void saveSessionPatch({
        [field]: value,
        planChanged: true,
        status: 'in_progress',
      })
    }
  }

  function handleStartOrResumeTraining() {
    writeTrainingCollapsed(signedInUserId, selectedSession.id, false)
    setLiveModeState({
      collapsed: false,
      currentBlockKey: currentLiveBlockKey,
      sessionId: selectedSession.id,
      started: true,
    })
  }

  function handleAbortTraining() {
    writeTrainingCollapsed(signedInUserId, selectedSession.id, true)
    setLiveModeState({
      collapsed: true,
      currentBlockKey: currentLiveBlockKey,
      sessionId: selectedSession.id,
      started: false,
    })
  }

  function handleResetToStart() {
    setLiveModeState({
      collapsed: false,
      currentBlockKey: firstBlockKey(selectedSession),
      sessionId: selectedSession.id,
      started: true,
    })
  }

  async function handleRestartTraining() {
    await sessionBlockActions.resetSessionBlockLogs()
    await exposureActions.resetExposureSummaries(sessionLog?.id)
    writeTrainingCollapsed(signedInUserId, selectedSession.id, false)
    setRestartConfirmSessionId(null)
    setLiveModeState({
      collapsed: false,
      currentBlockKey: firstBlockKey(selectedSession),
      sessionId: selectedSession.id,
      started: true,
    })
  }

  function handleCurrentBlockChange(blockKey: string | null) {
    setLiveModeState({
      collapsed: false,
      currentBlockKey: blockKey,
      sessionId: selectedSession.id,
      started: true,
    })
  }

  function handleLiveObservationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const note = liveObservationText.trim()

    if (!note) {
      return
    }

    if (liveObservationTarget === 'group') {
      void saveSessionPatch({
        coachReview: appendLiveObservation(sessionLog?.coachReview ?? '', liveObservationCategory, note),
        planChanged: true,
        status: 'in_progress',
      })
      setLiveObservationFeedback('Gruppen-Notiz gespeichert.')
    } else {
      const player = orderedPlayers.find((item) => item.id === liveObservationTarget)
      if (!player) {
        return
      }

      const entry = getEntryForPlayer(player)
      void saveEntry(player, {
        observation: appendLiveObservation(entry.observation, liveObservationCategory, note),
      })
      setLiveObservationFeedback(`Notiz fuer ${player.name} gespeichert.`)
    }

    setLiveObservationText('')
  }

  function playerHasOpenTask(player: Player) {
    const entry = getEntryForPlayer(player)
    const trafficLight = entry.trafficLight ?? entry.trafficLightSuggestion

    return (
      trafficLight === 'yellow' ||
      trafficLight === 'red' ||
      entry.limits.length > 0 ||
      entry.returnerFlag === 'ja' ||
      player.returnerStatus === 'ja' ||
      Boolean(returnerCapByPlayerId.get(player.id)) ||
      blockHasOpenCaptureTask(currentLiveBlock, player, metricActions, exerciseActions)
    )
  }

  const filteredTrainingPlayers = orderedPlayers.filter((player) => {
    const entry = getEntryForPlayer(player)
    const trafficLight = entry.trafficLight ?? entry.trafficLightSuggestion
    const searchMatches = player.name.toLocaleLowerCase('de-AT').includes(trainingPlayerSearch.toLocaleLowerCase('de-AT'))

    if (!searchMatches) {
      return false
    }

    if (trainingPlayerFilter === 'present') {
      return entry.present
    }

    if (trainingPlayerFilter === 'warning') {
      return trafficLight === 'yellow' || trafficLight === 'red'
    }

    if (trainingPlayerFilter === 'returner') {
      return entry.returnerFlag === 'ja' || player.returnerStatus === 'ja' || Boolean(returnerCapByPlayerId.get(player.id))
    }

    if (trainingPlayerFilter === 'cluster') {
      return player.cluster === trainingClusterFilter
    }

    if (trainingPlayerFilter === 'open') {
      return playerHasOpenTask(player)
    }

    return true
  })

  if (authState.status !== 'signed-in') {
    return (
      <div className="content-stack">
        <section className="placeholder" aria-labelledby="training-locked-heading">
          <Dumbbell className="placeholder-icon" aria-hidden />
          <h2 id="training-locked-heading">Training</h2>
          <p>Training-Anpassungen werden erst nach Coach-Login in Einstellungen lokal gespeichert und synchronisiert.</p>
        </section>
      </div>
    )
  }

  return (
    <section className="training-layout" aria-labelledby="training-heading">
      <div className="panel checkin-header">
        <div className="library-heading">
          <p className="eyebrow">Am Feld</p>
          <h3 id="training-heading">Training-Ansicht</h3>
          <p>{selectedSession.title}: Plan, Varianten, Quick Actions, Kontaktindex und Speed-Exposure.</p>
        </div>
        <div className="player-toolbar">
          <SessionPicker
            onSessionChange={onSessionChange}
            selectedSessionId={selectedSessionId}
            sessions={sessions}
          />
          <button
            className="primary-action"
            type="button"
            onClick={handleStartOrResumeTraining}
            disabled={showLiveStepper}
          >
            <Play className="nav-icon" aria-hidden />
            <span>{trainingActionLabel}</span>
          </button>
          {showLiveStepper ? (
            <>
              <button className="secondary-action" type="button" onClick={handleAbortTraining}>
                Training abbrechen
              </button>
              <button className="secondary-action" type="button" onClick={handleResetToStart}>
                Zurueck zum Start
              </button>
            </>
          ) : null}
          {hasTrainingProgress || activeExposureSummaryCount > 0 ? (
            <button className="secondary-action" type="button" onClick={() => setRestartConfirmSessionId(selectedSession.id)}>
              Training neu starten
            </button>
          ) : null}
          {syncOverview.status === 'error' ? (
            <button className="secondary-action" type="button" onClick={runSync} disabled={isLoading}>
              <RefreshCw className="nav-icon" aria-hidden />
              <span>{isLoading ? 'Sync laeuft...' : 'Retry'}</span>
            </button>
          ) : null}
          <button className="secondary-action" type="button" onClick={() => onNavigate('check-in')}>
            <UserCheck className="nav-icon" aria-hidden />
            <span>Check-in</span>
          </button>
        </div>
      </div>

      <div className="metric-grid checkin-metrics">
        <div className="metric">
          <span>Bloecke</span>
          <strong>{selectedSession.timeline.length}</strong>
        </div>
        <div className="metric">
          <span>Spieler</span>
          <strong>{activePlayers.length}</strong>
        </div>
        <div className="metric">
          <span>Varianten</span>
          <strong>{variantCount}</strong>
        </div>
        <div className="metric">
          <span>Limits</span>
          <strong>{limitedCount}</strong>
        </div>
      </div>

      {errorMessage ? (
        <div className="panel error-panel" role="alert">
          <strong>Training nicht vollstaendig synchronisiert</strong>
          <span>{errorMessage}</span>
          <button className="secondary-action" type="button" onClick={clearError}>
            Schliessen
          </button>
        </div>
      ) : null}

      {sessionBlockActions.errorMessage ? (
        <div className="panel error-panel" role="alert">
          <strong>Blockstatus nicht vollstaendig synchronisiert</strong>
          <span>{sessionBlockActions.errorMessage}</span>
          <button
            className="secondary-action"
            type="button"
            onClick={() => {
              void sessionBlockActions.runSync()
            }}
            disabled={sessionBlockActions.isLoading}
          >
            <RefreshCw className="nav-icon" aria-hidden />
            <span>{sessionBlockActions.isLoading ? 'Sync laeuft...' : 'Retry'}</span>
          </button>
          <button className="secondary-action" type="button" onClick={sessionBlockActions.clearError}>
            Schliessen
          </button>
        </div>
      ) : null}

      {showSyncAttention ? (
        <div className="panel checkin-sync-strip">
          <span className={`status-dot ${syncOverview.status === 'synced' ? 'online' : ''}`} aria-hidden />
          <strong>{syncStatusLabel(syncOverview.status)}</strong>
          <span>{pendingCountLabel(syncOverview.pendingCount, 'Training/Check-in-Änderungen')}</span>
          {syncOverview.errorMessage ? <span>{syncOverview.errorMessage}</span> : null}
        </div>
      ) : null}

      {blockSyncAttention ? (
        <div className="panel checkin-sync-strip">
          <span className={`status-dot ${sessionBlockActions.syncOverview.status === 'synced' ? 'online' : ''}`} aria-hidden />
          <strong>{syncStatusLabel(sessionBlockActions.syncOverview.status)}</strong>
          <span>{pendingCountLabel(sessionBlockActions.syncOverview.pendingCount, 'Blockstatus-Aenderungen')}</span>
          {sessionBlockActions.syncOverview.errorMessage ? <span>{sessionBlockActions.syncOverview.errorMessage}</span> : null}
          {sessionBlockActions.syncOverview.status === 'error' ? (
            <button
              className="secondary-action compact-action"
              type="button"
              onClick={() => {
                void sessionBlockActions.runSync()
              }}
              disabled={sessionBlockActions.isLoading}
            >
              <RefreshCw className="nav-icon" aria-hidden />
              <span>{sessionBlockActions.isLoading ? 'Sync laeuft...' : 'Retry'}</span>
            </button>
          ) : null}
        </div>
      ) : null}

      {exposureActions.errorMessage ? (
        <div className="panel error-panel" role="alert">
          <strong>Exposures nicht vollstaendig gespeichert</strong>
          <span>{exposureActions.errorMessage}</span>
          <button className="secondary-action" type="button" onClick={exposureActions.clearError}>
            Schliessen
          </button>
        </div>
      ) : null}

      {exposureSyncAttention ? (
        <div className="panel checkin-sync-strip">
          <span className={`status-dot ${exposureActions.syncOverview.status === 'synced' ? 'online' : ''}`} aria-hidden />
          <strong>{syncStatusLabel(exposureActions.syncOverview.status)}</strong>
          <span>{pendingCountLabel(exposureActions.syncOverview.pendingCount, 'Exposure-Aenderungen')}</span>
          {exposureActions.syncOverview.errorMessage ? <span>{exposureActions.syncOverview.errorMessage}</span> : null}
        </div>
      ) : null}

      {showRestartConfirm ? (
        <section className="panel error-panel" role="alert" aria-labelledby="restart-training-heading">
          <strong id="restart-training-heading">Training neu starten?</strong>
          <span>
            Es werden {sessionBlockActions.blockLogs.length} Blockstatus und {activeExposureSummaryCount} Exposure-Summary
            {activeExposureSummaryCount === 1 ? '' : 's'} fuer diese Session zurueckgesetzt.
          </span>
          <span>Check-ins bleiben erhalten. sRPE/Pain/E2, Metrics, Exercise-Results, Progression und Baselines bleiben erhalten.</span>
          <div className="button-row training-actions">
            <button
              className="segmented danger"
              type="button"
              onClick={() => {
                void handleRestartTraining()
              }}
              disabled={sessionBlockActions.isLoading || exposureActions.isLoading}
            >
              Neu starten
            </button>
            <button className="segmented" type="button" onClick={() => setRestartConfirmSessionId(null)}>
              Abbrechen
            </button>
          </div>
        </section>
      ) : null}

      {showLiveStepper ? (
        <LiveSessionStepper
          blockLogs={sessionBlockActions.blockLogs}
          currentBlockKey={currentLiveBlockKey}
          exerciseActions={exerciseActions}
          isSavingDisabled={isLoading || sessionBlockActions.isLoading}
          metricActions={metricActions}
          onCurrentBlockKeyChange={handleCurrentBlockChange}
          onSaveBlockLog={(blockKey, patch) => {
            void sessionBlockActions.saveBlockLog(blockKey, patch)
          }}
          players={orderedPlayers}
          session={selectedSession}
        />
      ) : null}

      <ExposureReviewPanel
        entries={checkInActions.entries}
        isSavingDisabled={isLoading || exposureActions.isLoading}
        onGenerate={() => {
          void exposureActions.generateExposureSummaries({
            sessionLog,
            blockLogs: sessionBlockActions.blockLogs,
            entries: checkInActions.entries,
            returnerCaps,
          })
        }}
        onManualOverride={(summary, type, override) => {
          void exposureActions.saveManualOverride(summary, type, override)
        }}
        players={activePlayers}
        sessionLog={sessionLog}
        summaries={exposureActions.summaries}
      />

      <section className="panel live-observation-panel" aria-labelledby="live-observation-heading">
        <div className="status-line">
          <Gauge className="nav-icon" aria-hidden />
          <h3 id="live-observation-heading">Live-Beobachtung</h3>
        </div>
        <form className="live-observation-form" onSubmit={handleLiveObservationSubmit}>
          <label className="inline-field">
            <span>Ziel</span>
            <select value={liveObservationTarget} onChange={(event) => setLiveObservationTarget(event.target.value)}>
              <option value="group">Ganze Gruppe</option>
              {orderedPlayers.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </label>
          <div className="control-group">
            <span>Kategorie</span>
            <div className="button-row">
              {liveObservationCategories.map((category) => (
                <button
                  className={liveObservationCategory === category ? 'segmented active' : 'segmented'}
                  key={category}
                  type="button"
                  onClick={() => setLiveObservationCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          <label className="inline-field wide">
            <span>Notiz oder iPad-Diktat</span>
            <textarea
              value={liveObservationText}
              disabled={isLoading}
              rows={2}
              placeholder="Reinsprechen oder kurz tippen"
              onChange={(event) => setLiveObservationText(event.target.value)}
            />
          </label>
          <button className="primary-action" type="submit" disabled={isLoading || liveObservationText.trim().length === 0}>
            Speichern
          </button>
        </form>
        <p className={liveObservationFeedback ? 'action-feedback visible' : 'action-feedback'} aria-live="polite">
          {liveObservationFeedback ?? ''}
        </p>
      </section>

      <div className="training-grid">
        <div className="content-stack">
          <article className="panel">
            <div className="status-line">
              <Route className="nav-icon" aria-hidden />
              <h3>Timeline und Blockstatus</h3>
            </div>
            <div className="session-timeline training-timeline">
              {selectedSession.timeline.map((block) => (
                <div className="timeline-row" key={block.key}>
                  <span>{block.time}</span>
                  <div>
                    <strong>{block.title}</strong>
                    <p>{block.work}</p>
                    <div className="tag-row">
                      {block.dose ? <span className="tag compact">{block.dose}</span> : null}
                      {block.note ? <span className="tag compact">{block.note}</span> : null}
                      <span className="tag compact">
                        {sessionBlockStatusLabels[sessionBlockActions.getLogForBlock(block.key)?.status ?? 'planned']}
                      </span>
                      {sessionBlockActions.getLogForBlock(block.key) ? (
                        <span className={`sync-pill ${sessionBlockActions.getLogForBlock(block.key)?.syncStatus ?? 'synced'}`}>
                          {syncStatusLabel(sessionBlockActions.getLogForBlock(block.key)?.syncStatus ?? 'synced')}
                        </span>
                      ) : null}
                    </div>
                    {block.libraryRefs && block.libraryRefs.length > 0 ? (
                      <div className="block-library-links" aria-label={`Quellen fuer ${block.title}`}>
                        {block.libraryRefs.map((libraryRef) => (
                          <button
                            className="text-action block-library-link"
                            key={libraryRef}
                            type="button"
                            onClick={() => onOpenLibraryItem(libraryRef)}
                          >
                            <FileText className="nav-icon" aria-hidden />
                            <span>{libraryButtonLabel(libraryRef)}</span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="panel">
            <div className="status-line">
              <Gauge className="nav-icon" aria-hidden />
              <h3>Kontaktindex und Speed-Exposure</h3>
            </div>
            <div className="training-coach-fields">
              <label className="inline-field wide">
                <span>Kontaktindex</span>
                <input
                  defaultValue={sessionLog?.contactIndex ?? ''}
                  disabled={isLoading}
                  key={`${selectedSessionId}-${sessionLog?.id ?? 'new'}-contact-index`}
                  placeholder="z. B. 0 kein Kontakt, 1 kontrollierte Prep"
                  onBlur={handleSessionTextBlur('contactIndex')}
                />
              </label>
              <label className="inline-field wide">
                <span>Speed-Exposure</span>
                <textarea
                  defaultValue={sessionLog?.speedExposureNote ?? ''}
                  disabled={isLoading}
                  key={`${selectedSessionId}-${sessionLog?.id ?? 'new'}-speed-exposure`}
                  rows={2}
                  placeholder="z. B. 4x10 m, keine Max-Speed-Reps, SB smooth fast"
                  onBlur={handleSessionTextBlur('speedExposureNote')}
                />
              </label>
            </div>
          </article>
        </div>

        <aside className="content-stack" aria-label="Varianten und Mapping">
          <article className="panel">
            <h3>Varianten A+/A/B/C/D</h3>
            <div className="variant-grid">
              {variantCards.map((card) => (
                <div className={card.variant === 'D' ? 'variant-card danger' : 'variant-card'} key={card.variant}>
                  <strong>{card.label}</strong>
                  <span>{card.summary}</span>
                  <p>{card.decision}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="panel">
            <h3>Exercise Mapping</h3>
            <div className="exercise-mapping-list">
              {exerciseMappings.map((mapping) => (
                <details className="mapping-detail" key={mapping.pattern}>
                  <summary>{mapping.pattern}</summary>
                  <p><strong>Default:</strong> {mapping.defaultOption}</p>
                  <p><strong>Alternative:</strong> {mapping.alternative}</p>
                  <p><strong>Gelb/Returner:</strong> {mapping.yellowReturner}</p>
                  <p><strong>Fokus:</strong> {mapping.coachFocus}</p>
                </details>
              ))}
            </div>
          </article>
        </aside>
      </div>

      <section className="panel training-player-panel" aria-label="Spieler-Anpassungen">
        <div className="status-line">
          <UserCheck className="nav-icon" aria-hidden />
          <h3>Spieler Quick Actions</h3>
        </div>
        <div className="training-coach-fields">
          <label className="inline-field">
            <span>Suche</span>
            <input
              value={trainingPlayerSearch}
              placeholder="Spieler suchen"
              onChange={(event) => setTrainingPlayerSearch(event.target.value)}
            />
          </label>
          <div className="control-group">
            <span>Filter</span>
            <div className="button-row">
              {playerFilterOptions.map((option) => (
                <button
                  className={trainingPlayerFilter === option.value ? 'segmented active' : 'segmented'}
                  key={option.value}
                  type="button"
                  onClick={() => setTrainingPlayerFilter(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          {trainingPlayerFilter === 'cluster' ? (
            <label className="inline-field">
              <span>Cluster</span>
              <select value={trainingClusterFilter} onChange={(event) => setTrainingClusterFilter(event.target.value)}>
                {clusterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
        <div className="training-player-list">
          {filteredTrainingPlayers.map((player) => (
            <TrainingPlayerRow
              entry={getEntryForPlayer(player)}
              isSavingDisabled={isLoading}
              key={player.id}
              onSave={(selectedPlayer, patch) => {
                void saveEntry(selectedPlayer, patch)
              }}
              player={player}
              returnerCap={returnerCapByPlayerId.get(player.id)}
              warning={warningByPlayerId.get(player.id)}
            />
          ))}
        </div>
        {activePlayers.length > 0 && filteredTrainingPlayers.length === 0 ? (
          <p className="action-feedback visible">Keine Spieler fuer diesen Filter.</p>
        ) : null}
        {activePlayers.length === 0 ? (
          <section className="placeholder">
            <UserCheck className="placeholder-icon" aria-hidden />
            <h2>Noch keine aktiven Spieler</h2>
            <p>Lege zuerst Spieler im Spieler-Tab an. Danach erscheinen sie hier automatisch im Training.</p>
          </section>
        ) : null}
      </section>
    </section>
  )
}
