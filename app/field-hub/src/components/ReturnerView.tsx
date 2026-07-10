import { ArrowLeft, ArrowRight, HeartPulse, History, RefreshCw, ShieldAlert, UserCheck, X } from 'lucide-react'
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import { routes, type AppRoute } from '../navigation'
import type { SessionDefinition } from '../content/types'
import {
  canConsiderReturnerProgression,
  returnerDecisionOptions,
  returnerRedFlags,
  returnerStageOptions,
  suggestReturnerDecision,
  type ReturnerEntry,
  type ReturnerEntryPatch,
} from '../domain/returners'
import type { ReturnerTaskState } from '../domain/returnerTasks'
import type { Player } from '../domain/players'
import { useActionFeedback } from '../hooks/useActionFeedback'
import type { useReturners } from '../hooks/useReturners'
import type { AuthSessionState } from '../lib/auth'
import { applyOptimisticReturnerPatch } from '../lib/optimisticUpdates'
import { measureInteraction } from '../lib/performanceTrace'
import { returnerEntryKeyBase } from '../lib/returnerEntryKey'
import { pendingCountLabel, shouldShowSyncAttention, syncStatusLabel } from '../lib/syncLabels'
import { SessionPicker } from './SessionPicker'
import { TaskQueueRow } from './onfield'
import { ActionFeedback } from './ui/ActionFeedback'
import { EmptyState, PrimaryButton, SecondaryButton, StatusChip } from './ui'

type ReturnerActions = ReturnType<typeof useReturners>

type ReturnerViewProps = {
  authState: AuthSessionState
  onNavigate: (route: AppRoute) => void
  onSessionChange: (sessionId: string) => void
  returnerActions: ReturnerActions
  selectedSession: SessionDefinition
  selectedSessionId: string
  sessions: SessionDefinition[]
  focusedPlayer?: Player | null
  focusedTaskState?: ReturnerTaskState | null
  onReturn?: () => void
  showBackupAccess?: boolean
  showSessionPicker?: boolean
}

function ReturnerHistory({ entries }: { entries: ReturnerEntry[] }) {
  if (entries.length === 0) {
    return <p>Kein lokaler Returner-Verlauf fuer diesen Spieler.</p>
  }

  return (
    <div className="returner-history">
      {entries.slice(0, 3).map((entry) => (
        <div className="returner-history-item" key={entry.id}>
          <strong>{entry.createdAt.slice(0, 10)}</strong>
          <span>{entry.currentStage || 'Stufe offen'} · {entry.decision ?? 'Entscheidung offen'}</span>
          <small>
            Speed: {entry.speedCap || '-'} · COD: {entry.codDecelCap || '-'} · Cond: {entry.conditioningCap || '-'} · Kontakt:{' '}
            {entry.contactCap || '-'}
          </small>
          <small>
            Symptome: {entry.symptomsDuring || '-'} · Morgen: {entry.nextMorning || '-'}
          </small>
        </div>
      ))}
    </div>
  )
}

function returnerEntryRenderKey(entry: ReturnerEntry) {
  return `${entry.id}:${entry.clientUpdatedAt}:${entry.syncStatus}`
}

function ReturnerPlayerDetail({
  entry,
  history,
  isSavingDisabled,
  onSave,
  player,
  selectedSessionId,
  taskState,
}: {
  entry: ReturnerEntry
  history: ReturnerEntry[]
  isSavingDisabled: boolean
  onSave: (player: Player, patch: ReturnerEntryPatch) => Promise<{ ok: true; entry: ReturnerEntry } | { ok: false; error: string }>
  player: Player
  selectedSessionId: string
  taskState: ReturnerTaskState
}) {
  const keyBase = returnerEntryKeyBase(player.id, selectedSessionId)
  const [localEntryOverride, setLocalEntryOverride] = useState<{ baseKey: string; entry: ReturnerEntry } | null>(null)
  const [savingActionKey, setSavingActionKey] = useState<string | null>(null)
  const actionFeedback = useActionFeedback()
  const savingActionRef = useRef<string | null>(null)
  const sourceEntryKey = returnerEntryRenderKey(entry)
  const displayEntry = localEntryOverride?.baseKey === sourceEntryKey ? localEntryOverride.entry : entry
  const suggestedDecision = suggestReturnerDecision(displayEntry)
  const canProgress = canConsiderReturnerProgression(displayEntry)
  const isConservative = suggestedDecision === 'rueckmelden' || displayEntry.decision === 'rueckmelden'
  const savingReasonId = `${keyBase}-saving-reason`

  async function savePatch(patch: ReturnerEntryPatch, actionKey = 'field') {
    if (isSavingDisabled || savingActionRef.current === actionKey) {
      return
    }

    const previousEntry = displayEntry
    const optimisticEntry = applyOptimisticReturnerPatch(displayEntry, patch)
    savingActionRef.current = actionKey
    setSavingActionKey(actionKey)
    setLocalEntryOverride({ baseKey: sourceEntryKey, entry: optimisticEntry })

    try {
      const result = await measureInteraction(`returner:${actionKey}`, () => onSave(player, patch))
      if (result.ok) {
        setLocalEntryOverride({ baseKey: sourceEntryKey, entry: result.entry })
        actionFeedback.showSaved(result.entry.syncStatus)
      } else {
        setLocalEntryOverride({ baseKey: sourceEntryKey, entry: previousEntry })
        actionFeedback.showError(result.error)
      }
    } catch (caughtError) {
      setLocalEntryOverride({ baseKey: sourceEntryKey, entry: previousEntry })
      actionFeedback.showError(caughtError instanceof Error ? caughtError.message : undefined)
    } finally {
      savingActionRef.current = null
      setSavingActionKey(null)
    }
  }

  return (
    <article className="returner-detail-form">
      <div className="checkin-player-head">
        <div>
          <div className="player-name-line">
            <strong>{player.name}</strong>
            <span className="tag compact">{player.returnerStatus === 'ja' ? 'Returner' : 'Returner/offen'}</span>
            {displayEntry.decision ? <span className="tag compact">{displayEntry.decision}</span> : null}
          </div>
          <p>{player.position} · {player.cluster}</p>
        </div>
        <span className={`sync-pill ${displayEntry.syncStatus}`}>{syncStatusLabel(displayEntry.syncStatus)}</span>
      </div>

      <div className={taskState.tone === 'danger' ? 'warning-note danger' : 'warning-note'}>
        <ShieldAlert className="nav-icon" aria-hidden />
        <span>
          Hinweis für Coaching-Entscheidung: {suggestedDecision}. Die App dokumentiert Caps und Reaktionen; die Entscheidung bleibt beim Coach im abgestimmten Prozess.
        </span>
      </div>

      {isSavingDisabled ? (
        <p className="disabled-action-reason" id={savingReasonId}>
          Speichern laeuft gerade.
        </p>
      ) : null}

      <ActionFeedback feedback={actionFeedback.feedback} />

      <div
        aria-busy={isSavingDisabled || undefined}
        aria-describedby={isSavingDisabled ? savingReasonId : undefined}
        className="checkin-controls post-session-controls"
      >
        <label className="inline-field">
          <span>Aktuelle Stufe</span>
          <select
            defaultValue={displayEntry.currentStage}
            disabled={isSavingDisabled}
            key={`${keyBase}::stage`}
            onBlur={(event) => void savePatch({ currentStage: event.currentTarget.value })}
          >
            {returnerStageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="inline-field">
          <span>Medical/Physio Kontakt</span>
          <input
            defaultValue={displayEntry.medicalContactNote}
            disabled={isSavingDisabled}
            key={`${keyBase}::medical`}
            placeholder="z. B. Physio: kein Kontakt"
            onBlur={(event) => void savePatch({ medicalContactNote: event.currentTarget.value })}
          />
        </label>

        <label className="inline-field">
          <span>Speed-Cap</span>
          <input
            defaultValue={displayEntry.speedCap}
            disabled={isSavingDisabled}
            key={`${keyBase}::speed`}
            placeholder="z. B. 4x10 m smooth"
            onBlur={(event) => void savePatch({ speedCap: event.currentTarget.value })}
          />
        </label>

        <label className="inline-field">
          <span>COD/Decel-Cap</span>
          <input
            defaultValue={displayEntry.codDecelCap}
            disabled={isSavingDisabled}
            key={`${keyBase}::cod`}
            placeholder="geplant, keine offenen Cuts"
            onBlur={(event) => void savePatch({ codDecelCap: event.currentTarget.value })}
          />
        </label>

        <label className="inline-field">
          <span>Conditioning-Cap</span>
          <input
            defaultValue={displayEntry.conditioningCap}
            disabled={isSavingDisabled}
            key={`${keyBase}::conditioning`}
            placeholder="kurz / extensiv / gestrichen"
            onBlur={(event) => void savePatch({ conditioningCap: event.currentTarget.value })}
          />
        </label>

        <label className="inline-field">
          <span>Kontakt-Cap</span>
          <input
            defaultValue={displayEntry.contactCap}
            disabled={isSavingDisabled}
            key={`${keyBase}::contact`}
            placeholder="kein Kontakt / Bags / kontrolliert"
            onBlur={(event) => void savePatch({ contactCap: event.currentTarget.value })}
          />
        </label>

        <label className="inline-field wide">
          <span>Heute erlaubt</span>
          <textarea
            defaultValue={displayEntry.allowedToday}
            disabled={isSavingDisabled}
            key={`${keyBase}::allowed`}
            rows={2}
            placeholder="z. B. Team-Warm-up plus individuelle Speed-Caps"
            onBlur={(event) => void savePatch({ allowedToday: event.currentTarget.value })}
          />
        </label>

        <label className="inline-field wide">
          <span>Geplante Caps</span>
          <textarea
            defaultValue={displayEntry.plannedCaps}
            disabled={isSavingDisabled}
            key={`${keyBase}::planned`}
            rows={2}
            placeholder="z. B. Speed submax, keine Kontaktvorbereitung"
            onBlur={(event) => void savePatch({ plannedCaps: event.currentTarget.value })}
          />
        </label>

        <label className="inline-field wide">
          <span>Tatsaechlich absolviert</span>
          <textarea
            defaultValue={displayEntry.completed}
            disabled={isSavingDisabled}
            key={`${keyBase}::completed`}
            rows={2}
            placeholder="kurz und sachlich, keine Diagnose"
            onBlur={(event) => void savePatch({ completed: event.currentTarget.value })}
          />
        </label>

        <label className="inline-field">
          <span>Symptome Training</span>
          <input
            defaultValue={displayEntry.symptomsDuring}
            disabled={isSavingDisabled}
            key={`${keyBase}::symptoms`}
            placeholder="ok / keine / Schmerzprovokation"
            onBlur={(event) => void savePatch({ symptomsDuring: event.currentTarget.value })}
          />
        </label>

        <label className="inline-field">
          <span>Naechster Morgen</span>
          <input
            defaultValue={displayEntry.nextMorning}
            disabled={isSavingDisabled}
            key={`${keyBase}::morning`}
            placeholder="stabil / schlechter / offen"
            onBlur={(event) => void savePatch({ nextMorning: event.currentTarget.value })}
          />
        </label>

        <div className="control-group wide">
          <span>Entscheidung</span>
          <div className="button-row">
            {returnerDecisionOptions.map((option) => (
              <button
                className={displayEntry.decision === option.value ? 'segmented active' : 'segmented'}
                disabled={isSavingDisabled || savingActionKey === `decision:${option.value}`}
                key={option.value}
                type="button"
                onClick={() => void savePatch({ decision: option.value }, `decision:${option.value}`)}
              >
                {option.label}
              </button>
            ))}
            <button
              className={isConservative ? 'segmented danger' : 'segmented'}
              aria-busy={savingActionKey === `decision:${suggestedDecision}` || undefined}
              disabled={isSavingDisabled || savingActionKey === `decision:${suggestedDecision}`}
              type="button"
              onClick={() => void savePatch({ decision: suggestedDecision }, `decision:${suggestedDecision}`)}
            >
              Vorschlag: {suggestedDecision}
            </button>
          </div>
        </div>
      </div>

      {!canProgress ? <p className="sync-help">Vor einer Steigerung Reaktion und vereinbarte Caps dokumentieren.</p> : null}

      <div className="returner-history-panel">
        <div className="status-line">
          <History className="nav-icon" aria-hidden />
          <h3>Verlauf</h3>
        </div>
        <ReturnerHistory entries={history} />
      </div>
    </article>
  )
}

export function ReturnerView({
  authState,
  focusedPlayer = null,
  focusedTaskState = null,
  onNavigate,
  onReturn,
  onSessionChange,
  returnerActions,
  selectedSession,
  selectedSessionId,
  sessions,
  showBackupAccess = false,
  showSessionPicker = true,
}: ReturnerViewProps) {
  const {
    activeReturnerPlayers,
    clearError,
    errorMessage,
    getEntryForPlayer,
    getHistoryForPlayer,
    isLoading,
    returnerTaskStates,
    runSync,
    savePlayerReturner,
    syncOverview,
  } = returnerActions
  const showSyncAttention = shouldShowSyncAttention(syncOverview)
  const detailPaneRef = useRef<HTMLElement | null>(null)
  const detailReturnFocusRef = useRef<HTMLElement | null>(null)
  const shouldRestoreDetailFocusRef = useRef(false)
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(focusedPlayer?.id ?? null)
  const [isMobileDetailSheet, setIsMobileDetailSheet] = useState(() =>
    typeof window === 'undefined' || typeof window.matchMedia !== 'function'
      ? true
      : window.matchMedia('(max-width: 599px)').matches,
  )
  const contextualPlayerIsAdditional = Boolean(
    focusedPlayer && !activeReturnerPlayers.some((player) => player.id === focusedPlayer.id),
  )
  const visiblePlayers = contextualPlayerIsAdditional && focusedPlayer
    ? [focusedPlayer, ...activeReturnerPlayers]
    : activeReturnerPlayers
  const visibleTasks = focusedTaskState && !returnerTaskStates.some((task) => task.playerId === focusedTaskState.playerId)
    ? [focusedTaskState, ...returnerTaskStates]
    : returnerTaskStates
  const taskByPlayerId = new Map(visibleTasks.map((task) => [task.playerId, task]))
  const playerById = new Map(visiblePlayers.map((player) => [player.id, player]))
  const selectedPlayer = selectedPlayerId ? playerById.get(selectedPlayerId) ?? null : null
  const selectedTask = selectedPlayer ? taskByPlayerId.get(selectedPlayer.id) ?? null : null
  const openTasks = visibleTasks.filter((task) => task.isOpen)
  const nextOpenTask = openTasks[0] ?? null

  useEffect(() => {
    if (selectedPlayer) {
      detailPaneRef.current?.focus()
    } else if (shouldRestoreDetailFocusRef.current) {
      shouldRestoreDetailFocusRef.current = false
      detailReturnFocusRef.current?.focus()
    }
  }, [selectedPlayer])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined
    }

    const mediaQuery = window.matchMedia('(max-width: 599px)')
    const updateDetailMode = () => setIsMobileDetailSheet(mediaQuery.matches)
    updateDetailMode()
    mediaQuery.addEventListener('change', updateDetailMode)
    return () => mediaQuery.removeEventListener('change', updateDetailMode)
  }, [])

  function handleDetailKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
    if (!isMobileDetailSheet || !selectedPlayer) {
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      closeReturnerDetail()
      return
    }

    if (event.key !== 'Tab') {
      return
    }

    const focusableElements = Array.from(
      detailPaneRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    )
    const firstFocusable = focusableElements[0]
    const lastFocusable = focusableElements.at(-1)
    if (!firstFocusable || !lastFocusable) {
      event.preventDefault()
      return
    }

    if (event.shiftKey && (document.activeElement === firstFocusable || document.activeElement === detailPaneRef.current)) {
      event.preventDefault()
      lastFocusable.focus()
    } else if (!event.shiftKey && document.activeElement === detailPaneRef.current) {
      event.preventDefault()
      firstFocusable.focus()
    } else if (!event.shiftKey && document.activeElement === lastFocusable) {
      event.preventDefault()
      firstFocusable.focus()
    }
  }

  function openReturnerDetail(playerId: string, trigger?: HTMLElement | null) {
    detailReturnFocusRef.current = trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null)
    shouldRestoreDetailFocusRef.current = false
    setSelectedPlayerId(playerId)
  }

  function closeReturnerDetail() {
    shouldRestoreDetailFocusRef.current = true
    setSelectedPlayerId(null)
  }

  function handlePrimaryAction(event: ReactMouseEvent<HTMLButtonElement>) {
    if (nextOpenTask) {
      openReturnerDetail(nextOpenTask.playerId, event.currentTarget)
      return
    }

    onNavigate(routes.unitPostSession)
  }

  if (authState.status !== 'signed-in') {
    return (
      <div className="content-stack">
        <section className="placeholder" aria-labelledby="returner-locked-heading">
          <HeartPulse className="placeholder-icon" aria-hidden />
          <h2 id="returner-locked-heading">Returner</h2>
          <p>Returner-Caps und Verlauf werden erst nach Coach-Login in Einstellungen lokal gespeichert und synchronisiert.</p>
        </section>
      </div>
    )
  }

  return (
    <section className="checkin-layout returner-layout" aria-labelledby="returner-heading">
      <div className="panel checkin-header">
        <div className="library-heading">
          <p className="eyebrow">Im Trainingstag</p>
          <h3 id="returner-heading">Returner-Aufgaben</h3>
          <p>{selectedSession.title}: Caps, Reaktionen und nächste Coaching-Schritte in einem ruhigen Arbeitslauf.</p>
          {showBackupAccess ? <p className="sync-help">Primärer Arbeitsort: Einheit. Dieser Zugang bleibt als Backup erhalten.</p> : null}
        </div>
        <div className="player-toolbar">
          {showSessionPicker ? (
            <SessionPicker
              onSessionChange={onSessionChange}
              selectedSessionId={selectedSessionId}
              sessions={sessions}
            />
          ) : null}
          <PrimaryButton icon={<ArrowRight aria-hidden />} onClick={handlePrimaryAction}>
            {nextOpenTask ? 'Nächste Returner-Aufgabe' : 'Nachbereitung öffnen'}
          </PrimaryButton>
          {syncOverview.status === 'error' ? (
            <SecondaryButton icon={<RefreshCw className="nav-icon" aria-hidden />} isLoading={isLoading} loadingLabel="Sync laeuft" onClick={runSync}>
              Erneut synchronisieren
            </SecondaryButton>
          ) : null}
          <button className="secondary-action" type="button" onClick={() => onNavigate(routes.unitTraining)}>
            <UserCheck className="nav-icon" aria-hidden />
            <span>Training</span>
          </button>
        </div>
      </div>

      <div className="returner-status-strip" aria-label="Returner Status">
        <StatusChip
          label={openTasks.length === 0 ? 'Returner aktuell geklärt' : `${openTasks.length} Aufgabe(n) offen`}
          tone={openTasks.length === 0 ? 'success' : openTasks.some((task) => task.tone === 'danger') ? 'danger' : 'warning'}
        />
        <span className="of-num">{visibleTasks.length} im heutigen Kontext</span>
      </div>

      {errorMessage ? (
        <div className="panel error-panel" role="alert">
          <strong>Returner nicht vollstaendig synchronisiert</strong>
          <span>{errorMessage}</span>
          <button className="secondary-action" type="button" onClick={clearError}>
            Schliessen
          </button>
        </div>
      ) : null}

      {showSyncAttention ? (
        <div className="panel checkin-sync-strip">
          <span className={`status-dot ${syncOverview.status === 'synced' ? 'online' : ''}`} aria-hidden />
          <strong>{syncStatusLabel(syncOverview.status)}</strong>
          <span>{pendingCountLabel(syncOverview.pendingCount, 'Returner-Aenderungen')}</span>
          {syncOverview.errorMessage ? <span>{syncOverview.errorMessage}</span> : null}
        </div>
      ) : null}

      <div className="returner-workspace-grid">
        <section className="panel returner-task-list" aria-label="Returner Aufgabenliste">
          {visibleTasks.length > 0 ? visibleTasks.map((task) => {
            const player = playerById.get(task.playerId)
            if (!player) {
              return null
            }

            const isActive = selectedPlayerId === player.id
            return (
              <TaskQueueRow
                action={
                  <SecondaryButton compact onClick={(event) => openReturnerDetail(player.id, event.currentTarget)}>
                    {isActive ? 'Aktiv' : 'Öffnen'}
                  </SecondaryButton>
                }
                ariaCurrent={isActive ? 'step' : undefined}
                detail={task.label}
                key={player.id}
                meta={[player.position || 'Position offen', task.isOpen ? 'Offen' : 'Geklärt']}
                title={player.name}
                tone={task.tone}
              />
            )
          }) : (
            <EmptyState
              body="Aktuell gibt es für diese Einheit keine Returner-Aufgabe. Offene Statusklärungen bleiben im Check-in."
              title="Returner aktuell geklärt"
            />
          )}
        </section>

        {selectedPlayer && selectedTask && isMobileDetailSheet ? (
          <div className="returner-sheet-backdrop" aria-hidden="true" />
        ) : null}

        {selectedPlayer && selectedTask ? (
          <aside
            aria-label={`Returner ${selectedPlayer.name}`}
            aria-labelledby={`returner-detail-heading-${selectedPlayer.id}`}
            aria-modal={isMobileDetailSheet ? 'true' : undefined}
            className="returner-detail-pane"
            onKeyDown={handleDetailKeyDown}
            ref={detailPaneRef}
            role={isMobileDetailSheet ? 'dialog' : undefined}
            tabIndex={-1}
          >
            <header className="returner-detail-heading">
              <div>
                <p className="eyebrow">Returner-Fokus</p>
                <h3 id={`returner-detail-heading-${selectedPlayer.id}`}>{selectedPlayer.name}</h3>
                <StatusChip label={selectedTask.label} tone={selectedTask.tone} />
              </div>
              <button className="icon-button" type="button" aria-label="Returner-Fokus schliessen" onClick={closeReturnerDetail}>
                <X aria-hidden />
              </button>
            </header>
            {onReturn ? (
              <SecondaryButton compact icon={<ArrowLeft aria-hidden />} onClick={onReturn}>
                Zurück zum Ursprung
              </SecondaryButton>
            ) : null}
            <ReturnerPlayerDetail
              entry={getEntryForPlayer(selectedPlayer)}
              history={getHistoryForPlayer(selectedPlayer)}
              isSavingDisabled={isLoading}
              onSave={savePlayerReturner}
              player={selectedPlayer}
              selectedSessionId={selectedSessionId}
              taskState={selectedTask}
            />
          </aside>
        ) : null}
      </div>

      <details className="panel returner-safety-disclosure">
        <summary>
          <ShieldAlert className="nav-icon" aria-hidden />
          <span>Safety-Hinweise</span>
        </summary>
        <ul className="compact-list">
          {returnerRedFlags.map((flag) => <li key={flag}>{flag}</li>)}
        </ul>
        <p>Bei offenen Hinweisen Belastung anpassen und den abgestimmten medizinischen oder physiotherapeutischen Prozess nutzen.</p>
      </details>
    </section>
  )
}
