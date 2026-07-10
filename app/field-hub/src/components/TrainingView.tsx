import {
  AlertTriangle,
  Dumbbell,
  FileText,
  Gauge,
  Play,
  RefreshCw,
  ShieldAlert,
  UserCheck,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { positionGroupOptions } from '../config/labels'
import { routes, type AppRoute } from '../navigation'
import { libraryItems } from '../content/library'
import { exerciseMappings, variantCards } from '../content/trainingReference'
import type { SessionBlock, SessionBlockExercise, SessionDefinition } from '../content/types'
import {
  deriveAttendanceStatus,
  hasMeaningfulCheckIn,
  type CheckInEntryPatch,
  type CheckInLimit,
  type PlayerSessionEntry,
  type PlayerWarning,
  type TrafficLight,
} from '../domain/checkIn'
import type { Player } from '../domain/players'
import type { ReturnerCapSummary } from '../domain/returners'
import { sessionBlockStatusLabels, type SessionBlockReason, type SessionBlockStatus } from '../domain/sessionBlocks'
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
import { useActionFeedback } from '../hooks/useActionFeedback'
import type { AuthSessionState } from '../lib/auth'
import { hasPlayerId } from '../lib/playerId'
import { pendingCountLabel, shouldShowSyncAttention, syncStatusLabel } from '../lib/syncLabels'
import { LiveSessionStepper } from './LiveSessionStepper'
import { ExposureReviewPanel } from './ExposureReviewPanel'
import { SessionPicker } from './SessionPicker'
import { AthleteRow } from './onfield/Rows'
import { ActionFeedback } from './ui/ActionFeedback'
import { EmptyState, PrimaryButton, SecondaryButton, Skeleton, StatusChip, TrafficLightChip } from './ui'

type TrainingActions = ReturnType<typeof useCheckIns>
type SessionBlockActions = ReturnType<typeof useSessionBlocks>
type ExposureActions = ReturnType<typeof useExposures>
type MetricActions = ReturnType<typeof useMetrics>
type ExerciseActions = ReturnType<typeof useExercises>
type SaveSyncStatus = 'synced' | 'pending' | 'error'

type TrainingViewProps = {
  authState: AuthSessionState
  checkInActions: TrainingActions
  initialSelectedPlayerId?: string | null
  exerciseActions?: ExerciseActions
  exposureActions: ExposureActions
  metricActions?: MetricActions
  onOpenLibraryItem: (itemId: string) => void
  onNavigate: (route: AppRoute) => void
  onOpenReturner?: (playerId: string) => void
  onSessionChange: (sessionId: string) => void
  returnerCaps: ReturnerCapSummary[]
  selectedSession: SessionDefinition
  selectedSessionId: string
  sessionBlockActions: SessionBlockActions
  sessions: SessionDefinition[]
  showSessionPicker?: boolean
}

type TrainingPlayerFilter = 'open' | 'present' | 'warning' | 'returner' | 'cluster' | 'all'

const trafficLabels: Record<TrafficLight, string> = {
  green: 'Grün',
  yellow: 'Gelb',
  red: 'Rot',
}

const limitLabels: Record<CheckInLimit, string> = {
  kein_sprint: 'kein Sprint',
  kein_cond: 'kein Conditioning',
  kein_schweres_heben: 'kein schweres Heben',
  physio: 'Physio/Medical',
  klaeren: 'klären',
}

const quickActions: Array<{ action: TrainingQuickAction; label: string; tone?: 'danger' }> = [
  { action: 'variant_c', label: 'C-Variante' },
  { action: 'variant_d', label: 'D / stoppen / klären', tone: 'danger' },
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

function syncStatusFromSaveResult(result: unknown): SaveSyncStatus | undefined {
  if (!result || typeof result !== 'object') {
    return undefined
  }

  if ('syncStatus' in result && typeof result.syncStatus === 'string') {
    return result.syncStatus as SaveSyncStatus
  }

  if ('entry' in result && result.entry && typeof result.entry === 'object' && 'syncStatus' in result.entry) {
    const syncStatus = result.entry.syncStatus
    return typeof syncStatus === 'string' ? (syncStatus as SaveSyncStatus) : undefined
  }

  if ('value' in result && result.value && typeof result.value === 'object' && 'syncStatus' in result.value) {
    const syncStatus = result.value.syncStatus
    return typeof syncStatus === 'string' ? (syncStatus as SaveSyncStatus) : undefined
  }

  return undefined
}

function errorMessageFromSaveResult(result: unknown) {
  if (!result || typeof result !== 'object') {
    return undefined
  }

  if ('errorMessage' in result && typeof result.errorMessage === 'string') {
    return result.errorMessage
  }

  if ('error' in result && typeof result.error === 'string') {
    return result.error
  }

  return undefined
}

function saveResultFailed(result: unknown) {
  return Boolean(result && typeof result === 'object' && 'ok' in result && result.ok === false)
}

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

function hasMeaningfulTrainingCheckIn(entry: PlayerSessionEntry) {
  return !entry.id.startsWith('preview:') && hasMeaningfulCheckIn(entry)
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
    warning.postPainScore !== null ? `Beschwerden nach Training ${warning.postPainScore}/10` : null,
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
      <span>Returner-Caps {cap.sessionDate}: {parts.join(' · ')}. Medizinische Entscheidungen bleiben extern.</span>
    </div>
  )
}

function TrainingPlayerRow({
  entry,
  onSelect,
  player,
  returnerCap,
  warning,
}: {
  entry: PlayerSessionEntry
  onSelect: (player: Player) => void
  player: Player
  returnerCap: ReturnerCapSummary | undefined
  warning: PlayerWarning | undefined
}) {
  const hasCheckIn = hasMeaningfulTrainingCheckIn(entry)
  const trafficLight = hasCheckIn ? (entry.trafficLight ?? entry.trafficLightSuggestion ?? 'open') : 'open'
  const attendance = deriveAttendanceStatus(entry)
  const isStop = trafficLight === 'red' || entry.trainingVariant === 'D' || entry.limits.includes('klaeren')
  const trafficLabel = formatTrafficLight(trafficLight === 'open' ? null : trafficLight)
  const attendanceLabel = attendance === 'present' ? 'Da' : attendance === 'absent' ? 'Nicht da' : 'Offen'
  const note = !hasCheckIn
    ? 'Noch nicht erfasst'
    : isStop
      ? 'Heute prüfen'
      : entry.limits.length > 0
        ? `Limits: ${entry.limits.map((limit) => limitLabels[limit]).join(', ')}`
        : trafficLight === 'yellow'
          ? 'Belastung anpassen'
          : returnerCap
            ? 'Returner-Cap prüfen'
            : warning
              ? 'Vorwarnung prüfen'
              : 'Keine Warnsignale dokumentiert'
  const statusChips = [
    <StatusChip
      key="attendance"
      label={attendanceLabel}
      tone={attendance === 'present' ? 'success' : attendance === 'absent' ? 'danger' : 'neutral'}
    />,
    entry.trainingVariant ? <StatusChip key="variant" label={`Variante ${entry.trainingVariant}`} tone={isStop ? 'danger' : 'info'} /> : null,
    returnerCap ? <StatusChip key="cap" label="Cap" tone="info" /> : null,
    warning ? <StatusChip key="warning" label="Vorwarnung" tone="warning" /> : null,
    entry.syncStatus !== 'synced' ? (
      <StatusChip key="sync" label={syncStatusLabel(entry.syncStatus)} tone={entry.syncStatus === 'error' ? 'danger' : 'warning'} />
    ) : null,
  ].filter(Boolean)

  return (
    <AthleteRow
      meta={[`${player.position} · ${player.cluster}`]}
      name={player.name}
      note={note}
      onSelect={() => onSelect(player)}
      playerId={player.id}
      readinessLabel={`${trafficLabel}: ${note}`}
      readinessTone={trafficLight}
      selectDescription={`Ampel ${trafficLabel}. ${note}. Anwesenheit ${attendanceLabel}. Details und Quick Actions öffnen.`}
      selectLabel={`${player.name} im Training öffnen`}
      status={statusChips}
      traffic={<TrafficLightChip label={trafficLabel} tone={trafficLight} />}
    />
  )
}

function TrainingPlayerDetail({
  entry,
  isSavingDisabled,
  onOpenReturner,
  onSave,
  player,
  returnerCap,
  warning,
}: {
  entry: PlayerSessionEntry
  isSavingDisabled: boolean
  onOpenReturner?: (playerId: string) => void
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
  const shouldOfferReturner =
    entry.returnerFlag === 'ja' ||
    entry.redFlag !== 'none' ||
    entry.movementConcern ||
    trafficLight === 'yellow' ||
    trafficLight === 'red'

  return (
    <article className={`training-player-detail traffic-${trafficLight ?? 'open'}`}>
      <div className="status-line">
        <span className={`tag compact traffic-${trafficLight ?? 'open'}`}>Ampel {formatTrafficLight(trafficLight)}</span>
        {entry.trainingVariant ? <span className="tag compact">Variante {entry.trainingVariant}</span> : null}
        <span className={`sync-pill ${entry.syncStatus}`}>{syncStatusLabel(entry.syncStatus)}</span>
      </div>

      <WarningNote warning={warning} />
      <ReturnerCapNote cap={returnerCap} />

      {shouldOfferReturner && onOpenReturner ? (
        <SecondaryButton compact onClick={() => onOpenReturner(player.id)}>
          Im Returner prüfen
        </SecondaryButton>
      ) : null}

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

      <div className="button-row training-actions" aria-label={`Training Quick Actions ${player.name}`}>
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
          <span>D/Rot wirkt nicht als normaler Trainingsblock. Medizinische Entscheidungen bleiben extern.</span>
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
  initialSelectedPlayerId = null,
  exerciseActions,
  exposureActions,
  metricActions,
  onOpenLibraryItem,
  onNavigate,
  onOpenReturner,
  onSessionChange,
  returnerCaps,
  selectedSession,
  selectedSessionId,
  sessionBlockActions,
  sessions,
  showSessionPicker = true,
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
  const [isSavingBlockLog, setIsSavingBlockLog] = useState(false)
  const [trainingPlayerFilter, setTrainingPlayerFilter] = useState<TrainingPlayerFilter>('open')
  const [trainingPlayerSearch, setTrainingPlayerSearch] = useState('')
  const [trainingClusterFilter, setTrainingClusterFilter] = useState('offen')
  const [selectedTrainingPlayerId, setSelectedTrainingPlayerId] = useState<string | null>(initialSelectedPlayerId)
  const selectedTrainingPlayerSheetRef = useRef<HTMLDivElement | null>(null)
  const lastSelectedTrainingPlayerIdRef = useRef<string | null>(initialSelectedPlayerId)
  const trainingLayoutRef = useRef<HTMLElement | null>(null)
  const liveStepperRef = useRef<HTMLDivElement | null>(null)
  const toolbarOverflowRef = useRef<HTMLDetailsElement | null>(null)
  const blockSaveInFlightRef = useRef(false)
  const actionFeedback = useActionFeedback()
  const hasTrainingProgress = sessionBlockActions.blockLogs.length > 0
  const isLiveModeForSession = liveModeState.sessionId === selectedSession.id
  const isLiveModeStarted = isLiveModeForSession && liveModeState.started
  const isLiveCollapsed = isLiveModeForSession
    ? liveModeState.collapsed
    : readTrainingCollapsed(signedInUserId, selectedSession.id)
  const showLiveControls = isLiveModeStarted && !isLiveCollapsed
  const currentLiveBlockKey = isLiveModeForSession ? liveModeState.currentBlockKey : null
  const currentLiveBlock =
    selectedSession.timeline.find((block) => block.key === currentLiveBlockKey) ?? selectedSession.timeline[0]
  const canResumeTraining = hasTrainingProgress || isLiveCollapsed
  const trainingActionLabel = showLiveControls
    ? 'Aktuellen Block fokussieren'
    : canResumeTraining
      ? 'Training fortsetzen'
      : 'Training starten'
  const activeExposureSummaryCount = sessionLog
    ? exposureActions.summaries.filter((summary) => summary.sessionLogId === sessionLog.id && !summary.deletedAt).length
    : 0
  const showRestartConfirm = restartConfirmSessionId === selectedSession.id
  const selectedTrainingPlayer = orderedPlayers.find((player) => player.id === selectedTrainingPlayerId) ?? null
  const selectedTrainingPlayerHeadingId = selectedTrainingPlayer
    ? `training-player-sheet-heading-${selectedTrainingPlayer.id}`
    : undefined

  useEffect(() => {
    if (selectedTrainingPlayer) {
      selectedTrainingPlayerSheetRef.current?.focus()
    }
  }, [selectedTrainingPlayer])

  useEffect(() => {
    const playerId = lastSelectedTrainingPlayerIdRef.current
    if (selectedTrainingPlayerId !== null || !playerId) {
      return
    }

    const playerRow = Array.from(trainingLayoutRef.current?.querySelectorAll<HTMLElement>('.of-athlete-row') ?? []).find(
      (row) => row.dataset.playerId === playerId,
    )
    playerRow?.querySelector<HTMLButtonElement>('.of-athlete-row-content')?.focus()
    lastSelectedTrainingPlayerIdRef.current = null
  }, [selectedTrainingPlayerId])

  function handleSessionTextBlur(field: 'contactIndex' | 'speedExposureNote') {
    return (event: FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.currentTarget.value.trim()
      const currentValue = sessionLog?.[field] ?? ''

      if (value === currentValue) {
        return
      }

      void saveWithFeedback(() =>
        saveSessionPatch({
          [field]: value,
          planChanged: true,
          status: 'in_progress',
        }),
      )
    }
  }

  function applySaveFeedback(result: unknown) {
    if (saveResultFailed(result)) {
      actionFeedback.showError(errorMessageFromSaveResult(result))
      return
    }

    actionFeedback.showSaved(syncStatusFromSaveResult(result))
  }

  async function saveWithFeedback<T>(saveOperation: () => Promise<T>) {
    try {
      const result = await saveOperation()
      applySaveFeedback(result)
      return result
    } catch (caughtError) {
      actionFeedback.showError(caughtError instanceof Error ? caughtError.message : undefined)
      throw caughtError
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

  function handlePrimaryTrainingAction() {
    if (showLiveControls) {
      liveStepperRef.current?.focus()
      liveStepperRef.current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' })
      return
    }

    handleStartOrResumeTraining()
  }

  function closeToolbarOverflow() {
    if (!toolbarOverflowRef.current) {
      return
    }

    toolbarOverflowRef.current.open = false
    toolbarOverflowRef.current.querySelector<HTMLElement>('summary')?.focus()
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

  async function handleSaveBlockLog(
    blockKey: string,
    patch: { status: SessionBlockStatus; reason: SessionBlockReason; coachNote: string },
  ) {
    if (blockSaveInFlightRef.current) {
      return
    }

    blockSaveInFlightRef.current = true
    setIsSavingBlockLog(true)
    try {
      await saveWithFeedback(() => sessionBlockActions.saveBlockLog(blockKey, patch))
    } finally {
      blockSaveInFlightRef.current = false
      setIsSavingBlockLog(false)
    }
  }

  async function handleLiveObservationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const note = liveObservationText.trim()

    if (!note) {
      return
    }

    try {
      if (liveObservationTarget === 'group') {
        const result = await saveWithFeedback(() =>
          saveSessionPatch({
            coachReview: appendLiveObservation(sessionLog?.coachReview ?? '', liveObservationCategory, note),
            planChanged: true,
            status: 'in_progress',
          }),
        )
        if (saveResultFailed(result)) {
          return
        }
        setLiveObservationFeedback('Gruppen-Notiz gespeichert.')
      } else {
        const player = orderedPlayers.find((item) => item.id === liveObservationTarget)
        if (!player) {
          return
        }

        const entry = getEntryForPlayer(player)
        const result = await saveWithFeedback(() =>
          saveEntry(player, {
            observation: appendLiveObservation(entry.observation, liveObservationCategory, note),
          }),
        )
        if (saveResultFailed(result)) {
          return
        }
        setLiveObservationFeedback(`Notiz für ${player.name} gespeichert.`)
      }

      setLiveObservationText('')
    } catch {
      // saveWithFeedback already exposes the failure and keeps the draft intact.
      return
    }
  }

  function playerHasOpenTask(player: Player) {
    const entry = getEntryForPlayer(player)
    const trafficLight = entry.trafficLight ?? entry.trafficLightSuggestion

    return (
      !hasMeaningfulTrainingCheckIn(entry) ||
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
      return hasMeaningfulTrainingCheckIn(entry) && (trafficLight === 'yellow' || trafficLight === 'red')
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
    <section className="training-layout" aria-labelledby="training-heading" ref={trainingLayoutRef}>
      <div className="panel checkin-header">
        <div className="library-heading">
          <p className="eyebrow">Am Feld</p>
          <h3 id="training-heading">Training-Ansicht</h3>
          <p>{selectedSession.title}: Plan, Varianten, Quick Actions, Kontaktindex und Speed-Exposure.</p>
        </div>
        <div className="player-toolbar">
          {showSessionPicker ? (
            <SessionPicker
              onSessionChange={onSessionChange}
              selectedSessionId={selectedSessionId}
              sessions={sessions}
            />
          ) : null}
          <PrimaryButton
            onClick={handlePrimaryTrainingAction}
            icon={<Play className="nav-icon" aria-hidden />}
          >
            {trainingActionLabel}
          </PrimaryButton>
          <details className="training-toolbar-overflow" ref={toolbarOverflowRef}>
            <summary>Weitere Aktionen</summary>
            <div className="training-toolbar-overflow-menu">
              {showLiveControls ? (
                <>
                  <SecondaryButton onClick={() => { handleAbortTraining(); closeToolbarOverflow() }}>
                    Training abbrechen
                  </SecondaryButton>
                  <SecondaryButton onClick={() => { handleResetToStart(); closeToolbarOverflow() }}>
                    Zurück zum Start
                  </SecondaryButton>
                </>
              ) : null}
              {hasTrainingProgress || activeExposureSummaryCount > 0 ? (
                <SecondaryButton tone="danger" onClick={() => { setRestartConfirmSessionId(selectedSession.id); closeToolbarOverflow() }}>
                  Training neu starten
                </SecondaryButton>
              ) : null}
              {syncOverview.status === 'error' ? (
                <SecondaryButton icon={<RefreshCw className="nav-icon" aria-hidden />} isLoading={isLoading} loadingLabel="Sync läuft" onClick={() => { void runSync(); closeToolbarOverflow() }}>
                  Erneut synchronisieren
                </SecondaryButton>
              ) : null}
              <SecondaryButton icon={<UserCheck className="nav-icon" aria-hidden />} onClick={() => { onNavigate(routes.unitCheckIn); closeToolbarOverflow() }}>
                Check-in
              </SecondaryButton>
              <SecondaryButton onClick={() => { onNavigate(routes.unitReturners); closeToolbarOverflow() }}>
                Returner-Aufgaben
              </SecondaryButton>
            </div>
          </details>
        </div>
      </div>

      {errorMessage ? (
        <div className="panel error-panel" role="alert">
          <strong>Training nicht vollständig synchronisiert</strong>
          <span>{errorMessage}</span>
          <button className="secondary-action" type="button" onClick={clearError}>
            Schließen
          </button>
        </div>
      ) : null}

      <ActionFeedback feedback={actionFeedback.feedback} />

      {sessionBlockActions.errorMessage ? (
        <div className="panel error-panel" role="alert">
          <strong>Blockstatus nicht vollständig synchronisiert</strong>
          <span>{sessionBlockActions.errorMessage}</span>
          <SecondaryButton
            onClick={() => {
              void sessionBlockActions.runSync()
            }}
            icon={<RefreshCw className="nav-icon" aria-hidden />}
            isLoading={sessionBlockActions.isLoading}
            loadingLabel="Sync läuft"
          >
            Erneut synchronisieren
          </SecondaryButton>
          <button className="secondary-action" type="button" onClick={sessionBlockActions.clearError}>
            Schließen
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
          <span>{pendingCountLabel(sessionBlockActions.syncOverview.pendingCount, 'Blockstatus-Änderungen')}</span>
          {sessionBlockActions.syncOverview.errorMessage ? <span>{sessionBlockActions.syncOverview.errorMessage}</span> : null}
          {sessionBlockActions.syncOverview.status === 'error' ? (
            <SecondaryButton
              compact
              onClick={() => {
                void sessionBlockActions.runSync()
              }}
              icon={<RefreshCw className="nav-icon" aria-hidden />}
              isLoading={sessionBlockActions.isLoading}
              loadingLabel="Sync läuft"
            >
              Erneut synchronisieren
            </SecondaryButton>
          ) : null}
        </div>
      ) : null}

      {exposureActions.errorMessage ? (
        <div className="panel error-panel" role="alert">
          <strong>Exposures nicht vollständig gespeichert</strong>
          <span>{exposureActions.errorMessage}</span>
          <button className="secondary-action" type="button" onClick={exposureActions.clearError}>
            Schließen
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
            {activeExposureSummaryCount === 1 ? '' : 's'} für diese Session zurückgesetzt.
          </span>
          <span>Check-ins bleiben erhalten. sRPE/Beschwerden/E2, Metrics, Exercise-Results, Progression und Baselines bleiben erhalten.</span>
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

      <div ref={liveStepperRef} tabIndex={-1}>
        <LiveSessionStepper
          blockLogs={sessionBlockActions.blockLogs}
          currentBlockKey={currentLiveBlockKey}
          exerciseActions={exerciseActions}
          isLiveActive={showLiveControls}
          isSavingDisabled={isLoading || sessionBlockActions.isLoading || isSavingBlockLog}
          metricActions={metricActions}
          onCurrentBlockKeyChange={handleCurrentBlockChange}
          onSaveBlockLog={(blockKey, patch) => {
            void handleSaveBlockLog(blockKey, patch)
          }}
          players={orderedPlayers}
          session={selectedSession}
        />
      </div>

      <section className="panel training-player-panel" aria-label="Athleten im Training">
        <div className="status-line">
          <UserCheck className="nav-icon" aria-hidden />
          <div>
            <h3>Athletenliste</h3>
            <p>Spieler antippen für Status, Limits, Caps, Quick Actions und Live-Notiz.</p>
          </div>
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
            <div className="filter-row">
              {playerFilterOptions.map((option) => (
                <button
                  aria-pressed={trainingPlayerFilter === option.value}
                  className={trainingPlayerFilter === option.value ? 'filter-chip active' : 'filter-chip'}
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
                {positionGroupOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
        <div className="training-player-list">
          {isLoading && activePlayers.length === 0
            ? [0, 1, 2].map((index) => <Skeleton key={index} label="Athletenliste wird geladen" variant="row" />)
            : filteredTrainingPlayers.map((player) => (
                <TrainingPlayerRow
                  entry={getEntryForPlayer(player)}
                  key={player.id}
                  onSelect={(selectedPlayer) => {
                    lastSelectedTrainingPlayerIdRef.current = selectedPlayer.id
                    setSelectedTrainingPlayerId(selectedPlayer.id)
                  }}
                  player={player}
                  returnerCap={returnerCapByPlayerId.get(player.id)}
                  warning={warningByPlayerId.get(player.id)}
                />
              ))}
        </div>
        {activePlayers.length > 0 && filteredTrainingPlayers.length === 0 ? (
          <EmptyState
            action={<SecondaryButton compact onClick={() => { setTrainingPlayerFilter('all'); setTrainingPlayerSearch('') }}>Filter zurücksetzen</SecondaryButton>}
            body="Passe Suche oder Filter an, um Athleten wieder einzublenden."
            title="Keine Athleten in diesem Filter"
          />
        ) : null}
        {!isLoading && activePlayers.length === 0 ? (
          <EmptyState
            action={<SecondaryButton compact onClick={() => onNavigate(routes.players)}>Spieler öffnen</SecondaryButton>}
            body="Lege zuerst Spieler im Spieler-Tab an. Danach erscheinen sie hier automatisch im Training."
            title="Noch keine aktiven Spieler"
          />
        ) : null}
      </section>

      <div className="training-secondary-tools" aria-label="Sekundaere Training-Werkzeuge">
        <details className="panel checkin-secondary-panel">
          <summary>
            <span>
              Live-Beobachtung
              <small>Gruppen-Notiz oder iPad-Diktat für den Trainingstag.</small>
            </span>
          </summary>
          <div className="checkin-secondary-body">
            <section className="live-observation-panel" aria-labelledby="live-observation-heading">
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
          <SecondaryButton
            type="submit"
            aria-describedby={liveObservationText.trim().length === 0 ? 'live-observation-disabled-reason' : undefined}
            disabled={isLoading || liveObservationText.trim().length === 0}
            isLoading={isLoading}
            loadingLabel="Speichert"
          >
            Speichern
          </SecondaryButton>
          {liveObservationText.trim().length === 0 ? (
            <p className="disabled-action-reason" id="live-observation-disabled-reason">
              Schreibe zuerst eine kurze Beobachtung.
            </p>
          ) : null}
        </form>
              <p className={liveObservationFeedback ? 'action-feedback visible' : 'action-feedback'} aria-live="polite">
                {liveObservationFeedback ?? ''}
              </p>
            </section>
          </div>
        </details>

        <details className="panel checkin-secondary-panel">
          <summary>
            <span>
              Exposures
              <small>Generieren und manuell pruefen, wenn im Live-Flow Zeit ist.</small>
            </span>
          </summary>
          <div className="checkin-secondary-body">
            <ExposureReviewPanel
              embedded
              entries={checkInActions.entries}
              isSavingDisabled={isLoading || exposureActions.isLoading}
              onGenerate={() => {
                void saveWithFeedback(() =>
                  exposureActions.generateExposureSummaries({
                    sessionLog,
                    blockLogs: sessionBlockActions.blockLogs,
                    entries: checkInActions.entries,
                    returnerCaps,
                  }),
                )
              }}
              onManualOverride={(summary, type, override) => {
                void saveWithFeedback(() => exposureActions.saveManualOverride(summary, type, override))
              }}
              players={activePlayers}
              sessionLog={sessionLog}
              summaries={exposureActions.summaries}
            />
          </div>
        </details>

        <details className="panel checkin-secondary-panel">
          <summary>
            <span>
              Timeline, Kontakt und Speed
              <small>Blockübersicht, Quellenlinks und Einheitsebene.</small>
            </span>
          </summary>
          <div className="checkin-secondary-body">
            <div className="metric-grid checkin-metrics">
              <div className="metric">
                <span>Blöcke</span>
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
                      <div className="block-library-links" aria-label={`Quellen für ${block.title}`}>
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
          </div>
        </details>

        <details className="panel checkin-secondary-panel">
          <summary>
            <span>
              Varianten und Mapping
              <small>A+/A/B/C/D und Exercise Mapping als Nachschlagewerk.</small>
            </span>
          </summary>
          <div className="checkin-secondary-body training-grid">
            <article>
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

            <article>
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
          </div>
        </details>
      </div>

      {selectedTrainingPlayer ? (
        <section className="checkin-sheet-backdrop" aria-label={`Training ${selectedTrainingPlayer.name}`}>
          <div
            className="checkin-sheet training-player-sheet"
            ref={selectedTrainingPlayerSheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={selectedTrainingPlayerHeadingId}
            tabIndex={-1}
          >
            <div className="sheet-heading">
              <div>
                <p className="eyebrow">Training-Fokus</p>
                <h3 id={selectedTrainingPlayerHeadingId}>{selectedTrainingPlayer.name}</h3>
              </div>
              <button className="icon-button" type="button" aria-label="Training-Fokus schliessen" onClick={() => setSelectedTrainingPlayerId(null)}>
                <X className="nav-icon" aria-hidden />
              </button>
            </div>
            <TrainingPlayerDetail
              entry={getEntryForPlayer(selectedTrainingPlayer)}
              isSavingDisabled={isLoading}
              onOpenReturner={onOpenReturner}
              onSave={(selectedPlayer, patch) => {
                void saveWithFeedback(() => saveEntry(selectedPlayer, patch))
              }}
              player={selectedTrainingPlayer}
              returnerCap={returnerCapByPlayerId.get(selectedTrainingPlayer.id)}
              warning={warningByPlayerId.get(selectedTrainingPlayer.id)}
            />
          </div>
        </section>
      ) : null}
    </section>
  )
}
