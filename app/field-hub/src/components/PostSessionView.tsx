import { AlertTriangle, ClipboardCheck, RefreshCw, ShieldAlert, UserCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import type { HubTab } from '../App'
import type { SessionDefinition } from '../content/types'
import {
  formatOptionalBaselineNumber,
  hasBaselineContent,
  parseOptionalBaselineNumber,
  sprint30mOptionalLabel,
  type BaselineEntry,
  type BaselineEntryPatch,
} from '../domain/baseline'
import type { E2Decision, NextStep, ProgressEntry } from '../domain/postSession'
import { derivePostSessionFollowUps, suggestNextStep } from '../domain/postSession'
import type { PlayerSessionEntry, PlayerWarning } from '../domain/checkIn'
import type { Player } from '../domain/players'
import type { useBaselines } from '../hooks/useBaselines'
import type { usePostSession } from '../hooks/usePostSession'
import type { AuthSessionState } from '../lib/auth'
import { hasPlayerId } from '../lib/playerId'
import { pendingCountLabel, shouldShowSyncAttention, syncStatusLabel } from '../lib/syncLabels'
import { SessionPicker } from './SessionPicker'

type PostSessionActions = ReturnType<typeof usePostSession>
type BaselineActions = ReturnType<typeof useBaselines>

type PostSessionViewProps = {
  authState: AuthSessionState
  baselineActions: BaselineActions
  onNavigate: (tab: HubTab) => void
  onSessionChange: (sessionId: string) => void
  postSessionActions: PostSessionActions
  selectedSession: SessionDefinition
  selectedSessionId: string
  sessions: SessionDefinition[]
}

const e2Options: Array<{ value: E2Decision; label: string }> = [
  { value: 'normal', label: 'Normal' },
  { value: 'C', label: 'C' },
  { value: 'D', label: 'D' },
  { value: 'kein_sprint', label: 'kein Sprint' },
  { value: 'kein_cond', label: 'kein Cond' },
  { value: 'physio', label: 'Physio' },
]

const nextStepOptions: Array<{ value: NextStep; label: string }> = [
  { value: 'steigern', label: 'Steigern' },
  { value: 'halten', label: 'Halten' },
  { value: 'reduzieren', label: 'Reduzieren' },
  { value: 'klaeren', label: 'Klaeren' },
]

function progressPreview(player: Player, entry: ProgressEntry | null): ProgressEntry {
  return (
    entry ?? {
      id: 'progress-preview',
      userId: player.userId,
      playerId: player.id,
      sessionLogId: 'session-preview',
      mainExercise: '',
      load: '',
      reps: '',
      rpe: '',
      powerOrSprint: '',
      conditioning: '',
      note: '',
      createdAt: '',
      updatedAt: '',
      deletedAt: null,
      clientUpdatedAt: '',
      syncStatus: 'synced',
      syncError: null,
    }
  )
}

function baselinePreview(player: Player, entry: BaselineEntry | null): BaselineEntry {
  return (
    entry ?? {
      id: 'baseline-preview',
      userId: player.userId,
      playerId: player.id,
      sessionLogId: 'session-preview',
      broadJumpCm: null,
      medBallChestPassM: null,
      medBallWeightKg: null,
      sprint30m: null,
      note: '',
      createdAt: '',
      updatedAt: '',
      deletedAt: null,
      clientUpdatedAt: '',
      syncStatus: 'synced',
      syncError: null,
    }
  )
}

function WarningSummary({ warning }: { warning: PlayerWarning | undefined }) {
  if (!warning) {
    return null
  }

  const parts = [
    warning.trafficLight ? `Ampel ${warning.trafficLight}` : null,
    warning.e2Decision && warning.e2Decision !== 'normal' ? `E2 ${warning.e2Decision}` : null,
    warning.nextStep ? `Next ${warning.nextStep}` : null,
    warning.postPainScore !== null ? `Post-Pain ${warning.postPainScore}/10` : null,
  ].filter(Boolean)

  if (parts.length === 0) {
    return null
  }

  return (
    <div className="warning-note">
      <AlertTriangle className="nav-icon" aria-hidden />
      <span>Vorwarnung {warning.sessionDate}: {parts.join(' · ')}</span>
    </div>
  )
}

function PostSessionPlayerRow({
  entry,
  isSavingDisabled,
  onPostSave,
  onProgressSave,
  player,
  progressEntry,
  sessionDuration,
  warning,
}: {
  entry: PlayerSessionEntry
  isSavingDisabled: boolean
  onPostSave: PostSessionActions['savePlayerPostSession']
  onProgressSave: PostSessionActions['savePlayerProgress']
  player: Player
  progressEntry: ProgressEntry | null
  sessionDuration: number | null
  warning: PlayerWarning | undefined
}) {
  const progress = progressPreview(player, progressEntry)
  const followUps = derivePostSessionFollowUps(entry, progressEntry)
  const suggestedNextStep = suggestNextStep(entry, progress)
  const isStop = entry.e2Decision === 'D' || entry.e2Decision === 'physio' || entry.nextStep === 'klaeren'

  function handleProgressBlur(field: keyof Pick<ProgressEntry, 'mainExercise' | 'load' | 'reps' | 'rpe' | 'powerOrSprint' | 'conditioning' | 'note'>) {
    return (event: FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      void onProgressSave(player, { [field]: event.currentTarget.value })
    }
  }

  return (
    <article className={`checkin-row traffic-${entry.trafficLight ?? entry.trafficLightSuggestion ?? 'open'}`}>
      <div className="checkin-player-head">
        <div>
          <div className="player-name-line">
            <strong>{player.name}</strong>
            {entry.sessionLoad !== null ? <span className="tag compact">Load {entry.sessionLoad}</span> : null}
            {isStop ? <span className="tag danger compact">Follow-up</span> : null}
          </div>
          <p>{player.position} · {player.cluster}</p>
        </div>
        <span className={`sync-pill ${entry.syncStatus}`}>{syncStatusLabel(entry.syncStatus)}</span>
      </div>

      <WarningSummary warning={warning} />

      <div className="checkin-controls post-session-controls">
        <div className="control-group" aria-label={`sRPE ${player.name}`}>
          <span>sRPE</span>
          <div className="button-row compact pain-scale">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
              <button
                className={entry.sessionRpe === value ? 'number-chip active' : 'number-chip'}
                disabled={isSavingDisabled}
                key={value}
                type="button"
                onClick={() =>
                  void onPostSave(player, {
                    sessionRpe: value,
                    durationMinutes: entry.durationMinutes ?? sessionDuration,
                  })
                }
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <div className="control-group" aria-label={`Pain nach Training ${player.name}`}>
          <span>Post-Pain</span>
          <div className="button-row compact pain-scale">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
              <button
                className={entry.postPainScore === value ? 'number-chip active' : 'number-chip'}
                disabled={isSavingDisabled}
                key={value}
                type="button"
                onClick={() => void onPostSave(player, { postPainScore: value })}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <label className="inline-field">
          <span>Post-Pain Ort/Issue</span>
          <input
            defaultValue={entry.postPainLocation}
            disabled={isSavingDisabled}
            key={`${entry.id}-post-pain-location`}
            placeholder="z. B. Wade rechts"
            onBlur={(event) => void onPostSave(player, { postPainLocation: event.currentTarget.value })}
          />
        </label>

        <div className="control-group">
          <span>E2 naechste Einheit</span>
          <div className="button-row">
            {e2Options.map((option) => (
              <button
                className={entry.e2Decision === option.value ? 'segmented active' : 'segmented'}
                disabled={isSavingDisabled}
                key={option.value}
                type="button"
                onClick={() => void onPostSave(player, { e2Decision: option.value })}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <label className="inline-field">
          <span>Hauptuebung</span>
          <input
            defaultValue={progress.mainExercise}
            disabled={isSavingDisabled}
            key={`${progress.id}-main`}
            placeholder="z. B. Trap Bar Deadlift"
            onBlur={handleProgressBlur('mainExercise')}
          />
        </label>

        <label className="inline-field">
          <span>Last</span>
          <input
            defaultValue={progress.load}
            disabled={isSavingDisabled}
            key={`${progress.id}-load`}
            placeholder="z. B. 90 kg"
            onBlur={handleProgressBlur('load')}
          />
        </label>

        <label className="inline-field">
          <span>Reps</span>
          <input
            defaultValue={progress.reps}
            disabled={isSavingDisabled}
            key={`${progress.id}-reps`}
            placeholder="z. B. 3x5"
            onBlur={handleProgressBlur('reps')}
          />
        </label>

        <label className="inline-field">
          <span>RPE</span>
          <input
            defaultValue={progress.rpe}
            disabled={isSavingDisabled}
            key={`${progress.id}-rpe`}
            placeholder="z. B. 7"
            onBlur={handleProgressBlur('rpe')}
          />
        </label>

        <label className="inline-field">
          <span>Power/Sprint</span>
          <input
            defaultValue={progress.powerOrSprint}
            disabled={isSavingDisabled}
            key={`${progress.id}-power`}
            placeholder="z. B. 4x10 m smooth"
            onBlur={handleProgressBlur('powerOrSprint')}
          />
        </label>

        <label className="inline-field">
          <span>Conditioning</span>
          <input
            defaultValue={progress.conditioning}
            disabled={isSavingDisabled}
            key={`${progress.id}-conditioning`}
            placeholder="erledigt / gekuerzt / gestrichen"
            onBlur={handleProgressBlur('conditioning')}
          />
        </label>

        <div className="control-group">
          <span>Naechster Schritt</span>
          <div className="button-row">
            {nextStepOptions.map((option) => (
              <button
                className={entry.nextStep === option.value ? 'segmented active' : 'segmented'}
                disabled={isSavingDisabled}
                key={option.value}
                type="button"
                onClick={() => void onProgressSave(player, { nextStep: option.value })}
              >
                {option.label}
              </button>
            ))}
            <button
              className="segmented"
              disabled={isSavingDisabled}
              type="button"
              onClick={() => void onProgressSave(player, { nextStep: suggestedNextStep })}
            >
              Vorschlag: {suggestedNextStep}
            </button>
          </div>
        </div>

        <label className="inline-field wide">
          <span>Progressionsnotiz, keine Diagnose</span>
          <textarea
            defaultValue={progress.note}
            disabled={isSavingDisabled}
            key={`${progress.id}-note`}
            rows={2}
            placeholder="z. B. Technik sauber, gleiche Last besser bewegen"
            onBlur={handleProgressBlur('note')}
          />
        </label>
      </div>

      {followUps.length > 0 ? (
        <div className="post-followups">
          {followUps.map((followUp) => (
            <span className="tag compact" key={followUp}>{followUp}</span>
          ))}
        </div>
      ) : null}

      {isStop ? (
        <div className="warning-note danger">
          <ShieldAlert className="nav-icon" aria-hidden />
          <span>Follow-up bedeutet Klaerung/Anpassung, keine medizinische Freigabe durch die App.</span>
        </div>
      ) : null}
    </article>
  )
}

function BaselinePlayerRow({
  baselineEntry,
  isSavingDisabled,
  onParseError,
  onSave,
  player,
}: {
  baselineEntry: BaselineEntry | null
  isSavingDisabled: boolean
  onParseError: (message: string | null) => void
  onSave: BaselineActions['savePlayerBaseline']
  player: Player
}) {
  const baseline = baselinePreview(player, baselineEntry)

  function handleNumberBlur(
    field: keyof Pick<BaselineEntryPatch, 'broadJumpCm' | 'medBallChestPassM' | 'medBallWeightKg' | 'sprint30m'>,
    label: string,
    currentValue: number | null,
  ) {
    return (event: FormEvent<HTMLInputElement>) => {
      try {
        const parsedValue = parseOptionalBaselineNumber(event.currentTarget.value, label)

        if (parsedValue === currentValue) {
          return
        }

        onParseError(null)
        void onSave(player, { [field]: parsedValue })
      } catch (caughtError) {
        onParseError(caughtError instanceof Error ? caughtError.message : 'Baseline-Wert ist ungueltig.')
      }
    }
  }

  function handleNoteBlur(event: FormEvent<HTMLTextAreaElement>) {
    const value = event.currentTarget.value.trim()

    if (value === baseline.note) {
      return
    }

    onParseError(null)
    void onSave(player, { note: value })
  }

  return (
    <article className="baseline-row">
      <div className="checkin-player-head">
        <div>
          <div className="player-name-line">
            <strong>{player.name}</strong>
            {hasBaselineContent(baseline) ? <span className="tag compact">Testwerte</span> : null}
          </div>
          <p>{player.position} · {player.cluster}</p>
        </div>
        <span className={`sync-pill ${baseline.syncStatus}`}>{syncStatusLabel(baseline.syncStatus)}</span>
      </div>

      <div className="baseline-fields">
        <label className="inline-field">
          <span>Broad Jump cm</span>
          <input
            defaultValue={formatOptionalBaselineNumber(baseline.broadJumpCm)}
            disabled={isSavingDisabled}
            inputMode="decimal"
            key={`${baseline.id}-bj`}
            placeholder="z. B. 245"
            onBlur={handleNumberBlur('broadJumpCm', 'Broad Jump', baseline.broadJumpCm)}
          />
        </label>

        <label className="inline-field">
          <span>MB Chest Pass m</span>
          <input
            defaultValue={formatOptionalBaselineNumber(baseline.medBallChestPassM)}
            disabled={isSavingDisabled}
            inputMode="decimal"
            key={`${baseline.id}-mb`}
            placeholder="z. B. 6,25"
            onBlur={handleNumberBlur('medBallChestPassM', 'Med-Ball Chest Pass', baseline.medBallChestPassM)}
          />
        </label>

        <label className="inline-field">
          <span>MB kg</span>
          <input
            defaultValue={formatOptionalBaselineNumber(baseline.medBallWeightKg)}
            disabled={isSavingDisabled}
            inputMode="decimal"
            key={`${baseline.id}-mb-weight`}
            placeholder="z. B. 5"
            onBlur={handleNumberBlur('medBallWeightKg', 'Med-Ball-Gewicht', baseline.medBallWeightKg)}
          />
        </label>

        <label className="inline-field">
          <span>{sprint30mOptionalLabel}</span>
          <input
            defaultValue={formatOptionalBaselineNumber(baseline.sprint30m)}
            disabled={isSavingDisabled}
            inputMode="decimal"
            key={`${baseline.id}-sprint`}
            placeholder="leer lassen"
            onBlur={handleNumberBlur('sprint30m', '30 m', baseline.sprint30m)}
          />
        </label>

        <label className="inline-field wide">
          <span>Notiz, kein Ranking und keine Diagnose</span>
          <textarea
            defaultValue={baseline.note}
            disabled={isSavingDisabled}
            key={`${baseline.id}-note`}
            rows={2}
            placeholder="z. B. ruhig gemessen, 2 gueltige Versuche"
            onBlur={handleNoteBlur}
          />
        </label>
      </div>
    </article>
  )
}

export function PostSessionView({
  authState,
  baselineActions,
  onNavigate,
  onSessionChange,
  postSessionActions,
  selectedSession,
  selectedSessionId,
  sessions,
}: PostSessionViewProps) {
  const [baselineFormError, setBaselineFormError] = useState<string | null>(null)
  const {
    activePlayers,
    entries,
    errorMessage,
    warnings,
    syncOverview,
    isLoading,
    sessionLog,
    runSync,
    savePlayerPostSession,
    savePlayerProgress,
    saveSessionPatch,
    getEntryForPlayer,
    getProgressForPlayer,
    clearError,
  } = postSessionActions
  const showSyncAttention = shouldShowSyncAttention(syncOverview)
  const showBaselineSyncAttention = shouldShowSyncAttention(baselineActions.syncOverview)
  const baselineCompletedCount = baselineActions.entries.filter(
    (entry) => hasPlayerId(entry) && hasBaselineContent(entry),
  ).length
  const warningByPlayerId = new Map(warnings.filter(hasPlayerId).map((warning) => [warning.playerId, warning]))
  const presentPlayerIds = new Set(entries.filter((entry) => hasPlayerId(entry) && entry.present).map((entry) => entry.playerId))
  const orderedPlayers = [...activePlayers].sort((a, b) => {
    const aPresent = presentPlayerIds.has(a.id)
    const bPresent = presentPlayerIds.has(b.id)

    if (aPresent === bPresent) {
      return a.name.localeCompare(b.name, 'de-AT')
    }

    return aPresent ? -1 : 1
  })
  const completedCount = entries.filter(
    (entry) => hasPlayerId(entry) && (entry.sessionRpe !== null || entry.e2Decision !== null || entry.nextStep !== null),
  ).length
  const followUpCount = entries.filter(
    (entry) =>
      hasPlayerId(entry) &&
      ((entry.e2Decision !== null && entry.e2Decision !== 'normal') ||
        entry.nextStep === 'reduzieren' ||
        entry.nextStep === 'klaeren' ||
        (entry.postPainScore !== null && entry.postPainScore >= 3)),
  ).length

  function handleSessionNumberBlur(field: 'durationMinutes' | 'groupSize') {
    return (event: FormEvent<HTMLInputElement>) => {
      const value = event.currentTarget.value.trim()
      const parsed = value ? Number(value) : null

      if (parsed !== null && (!Number.isFinite(parsed) || parsed < 0)) {
        return
      }

      void saveSessionPatch({ [field]: parsed })
    }
  }

  async function handleRunSync() {
    await runSync()
    await baselineActions.refreshBaselines()
  }

  if (authState.status !== 'signed-in') {
    return (
      <div className="content-stack">
        <section className="placeholder" aria-labelledby="post-session-locked-heading">
          <ClipboardCheck className="placeholder-icon" aria-hidden />
          <h2 id="post-session-locked-heading">Nachbereitung</h2>
          <p>Nachbereitungsdaten werden erst nach Coach-Login in Einstellungen lokal gespeichert und synchronisiert.</p>
        </section>
      </div>
    )
  }

  return (
    <section className="checkin-layout post-session-layout" aria-labelledby="post-session-heading">
      <div className="panel checkin-header">
        <div className="library-heading">
          <p className="eyebrow">Nach dem Training</p>
          <h3 id="post-session-heading">Nachbereitung</h3>
          <p>{selectedSession.title}: sRPE, Pain/Issue, E2, Progression und Follow-ups sichern.</p>
        </div>
        <div className="player-toolbar">
          <SessionPicker
            onSessionChange={onSessionChange}
            selectedSessionId={selectedSessionId}
            sessions={sessions}
          />
          {syncOverview.status === 'error' || baselineActions.syncOverview.status === 'error' ? (
            <button
              className="secondary-action"
              type="button"
              onClick={() => void handleRunSync()}
              disabled={isLoading || baselineActions.isLoading}
            >
              <RefreshCw className="nav-icon" aria-hidden />
              <span>{isLoading || baselineActions.isLoading ? 'Sync laeuft...' : 'Retry'}</span>
            </button>
          ) : null}
          <button className="secondary-action" type="button" onClick={() => onNavigate('training')}>
            <UserCheck className="nav-icon" aria-hidden />
            <span>Training</span>
          </button>
        </div>
      </div>

      <div className="metric-grid checkin-metrics">
        <div className="metric">
          <span>Spieler</span>
          <strong>{activePlayers.length}</strong>
        </div>
        <div className="metric">
          <span>Nachbereitet</span>
          <strong>{completedCount}</strong>
        </div>
        <div className="metric">
          <span>Follow-ups</span>
          <strong>{followUpCount}</strong>
        </div>
        <div className="metric">
          <span>Status</span>
          <strong>{sessionLog?.status ?? 'offen'}</strong>
        </div>
      </div>

      {errorMessage ? (
        <div className="panel error-panel" role="alert">
          <strong>Nachbereitung nicht vollstaendig synchronisiert</strong>
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
          <span>{pendingCountLabel(syncOverview.pendingCount, 'Nachbereitung/Check-in-Aenderungen')}</span>
          {syncOverview.errorMessage ? <span>{syncOverview.errorMessage}</span> : null}
        </div>
      ) : null}

      <section className="panel post-session-coach-panel" aria-label="Coach Review">
        <div className="training-coach-fields">
          <label className="inline-field">
            <span>Dauer Minuten</span>
            <input
              defaultValue={sessionLog?.durationMinutes ?? ''}
              disabled={isLoading}
              key={`${selectedSessionId}-${sessionLog?.id ?? 'new'}-duration`}
              inputMode="numeric"
              placeholder="z. B. 75"
              onBlur={handleSessionNumberBlur('durationMinutes')}
            />
          </label>
          <label className="inline-field">
            <span>Gruppengroesse</span>
            <input
              defaultValue={sessionLog?.groupSize ?? ''}
              disabled={isLoading}
              key={`${selectedSessionId}-${sessionLog?.id ?? 'new'}-group`}
              inputMode="numeric"
              placeholder="z. B. 14"
              onBlur={handleSessionNumberBlur('groupSize')}
            />
          </label>
          <label className="inline-field wide">
            <span>Coach Review</span>
            <textarea
              defaultValue={sessionLog?.coachReview ?? ''}
              disabled={isLoading}
              key={`${selectedSessionId}-${sessionLog?.id ?? 'new'}-review`}
              rows={3}
              placeholder="Follow-ups, gekuerzte Inhalte, organisatorische Probleme"
              onBlur={(event) => void saveSessionPatch({ coachReview: event.currentTarget.value.trim() })}
            />
          </label>
          <button
            className="primary-action"
            disabled={isLoading}
            type="button"
            onClick={() => void saveSessionPatch({ status: 'completed' })}
          >
            Einheit abschliessen
          </button>
        </div>
      </section>

      <section className="panel baseline-panel" aria-labelledby="baseline-heading">
        <div className="library-heading">
          <p className="eyebrow">Optionaler Re-Check</p>
          <h3 id="baseline-heading">Mini-Baseline / Re-Check</h3>
          <p>Optional erfassen, wenn Gruppe und Ablauf ruhig sind. 30 m bleibt spaeter/optional und wird nicht erzwungen.</p>
        </div>

        {showBaselineSyncAttention ? (
          <div className="panel checkin-sync-strip">
            <span className={`status-dot ${baselineActions.syncOverview.status === 'synced' ? 'online' : ''}`} aria-hidden />
            <strong>{syncStatusLabel(baselineActions.syncOverview.status)}</strong>
            <span>{pendingCountLabel(baselineActions.syncOverview.pendingCount, 'Baseline-Aenderungen')}</span>
            <span>{baselineCompletedCount} Spieler mit Testwerten in dieser Einheit</span>
            {baselineActions.syncOverview.errorMessage ? <span>{baselineActions.syncOverview.errorMessage}</span> : null}
          </div>
        ) : null}

        {baselineFormError || baselineActions.errorMessage ? (
          <div className="error-panel" role="alert">
            <strong>Baseline nicht vollstaendig gespeichert</strong>
            <span>{baselineFormError ?? baselineActions.errorMessage}</span>
            <button
              className="secondary-action"
              type="button"
              onClick={() => {
                setBaselineFormError(null)
                baselineActions.clearError()
              }}
            >
              Schliessen
            </button>
          </div>
        ) : null}

        <div className="baseline-list">
          {orderedPlayers.map((player) => (
            <BaselinePlayerRow
              baselineEntry={baselineActions.getBaselineForPlayer(player)}
              isSavingDisabled={baselineActions.isLoading}
              key={player.id}
              onParseError={setBaselineFormError}
              onSave={baselineActions.savePlayerBaseline}
              player={player}
            />
          ))}
        </div>
      </section>

      <div className="checkin-list">
        {orderedPlayers.map((player) => (
          <PostSessionPlayerRow
            entry={getEntryForPlayer(player)}
            isSavingDisabled={isLoading}
            key={player.id}
            onPostSave={savePlayerPostSession}
            onProgressSave={savePlayerProgress}
            player={player}
            progressEntry={getProgressForPlayer(player)}
            sessionDuration={sessionLog?.durationMinutes ?? null}
            warning={warningByPlayerId.get(player.id)}
          />
        ))}
      </div>

      {activePlayers.length === 0 ? (
        <section className="placeholder">
          <UserCheck className="placeholder-icon" aria-hidden />
          <h2>Noch keine aktiven Spieler</h2>
          <p>Lege zuerst Spieler im Spieler-Tab an. Danach erscheinen sie hier automatisch in der Nachbereitung.</p>
        </section>
      ) : null}
    </section>
  )
}
