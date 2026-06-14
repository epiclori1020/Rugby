import { AlertTriangle, HeartPulse, History, RefreshCw, ShieldAlert, UserCheck } from 'lucide-react'
import type { FormEvent } from 'react'
import type { HubTab } from '../App'
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
import type { Player } from '../domain/players'
import type { useReturners } from '../hooks/useReturners'
import type { AuthSessionState } from '../lib/auth'
import { returnerEntryKeyBase } from '../lib/returnerEntryKey'
import { AuthPanel } from './AuthPanel'
import { SessionPicker } from './SessionPicker'

type ReturnerActions = ReturnType<typeof useReturners>

type ReturnerViewProps = {
  authState: AuthSessionState
  onNavigate: (tab: HubTab) => void
  onSessionChange: (sessionId: string) => void
  returnerActions: ReturnerActions
  selectedSession: SessionDefinition
  selectedSessionId: string
  sessions: SessionDefinition[]
}

function textBlurHandler(field: keyof Omit<ReturnerEntryPatch, 'decision'>, onSave: (patch: ReturnerEntryPatch) => void) {
  return (event: FormEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    onSave({ [field]: event.currentTarget.value })
  }
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

function ReturnerPlayerCard({
  entry,
  history,
  isSavingDisabled,
  onSave,
  player,
  selectedSessionId,
}: {
  entry: ReturnerEntry
  history: ReturnerEntry[]
  isSavingDisabled: boolean
  onSave: (player: Player, patch: ReturnerEntryPatch) => void
  player: Player
  selectedSessionId: string
}) {
  const keyBase = returnerEntryKeyBase(player.id, selectedSessionId)
  const suggestedDecision = suggestReturnerDecision(entry)
  const canProgress = canConsiderReturnerProgression(entry)
  const isConservative = suggestedDecision === 'rueckmelden' || entry.decision === 'rueckmelden'

  function savePatch(patch: ReturnerEntryPatch) {
    onSave(player, patch)
  }

  return (
    <article className={isConservative ? 'checkin-row traffic-red' : 'checkin-row traffic-yellow'}>
      <div className="checkin-player-head">
        <div>
          <div className="player-name-line">
            <strong>{player.name}</strong>
            <span className="tag compact">{player.returnerStatus === 'ja' ? 'Returner' : 'Returner/offen'}</span>
            {entry.decision ? <span className="tag compact">{entry.decision}</span> : null}
          </div>
          <p>{player.position} · {player.cluster}</p>
        </div>
        <span className={`sync-pill ${entry.syncStatus}`}>{entry.syncStatus}</span>
      </div>

      <div className={isConservative ? 'warning-note danger' : 'warning-note'}>
        <ShieldAlert className="nav-icon" aria-hidden />
        <span>
          Vorschlag: {suggestedDecision}. App dokumentiert Caps und Hinweise, gibt aber keine medizinische Freigabe.
        </span>
      </div>

      <div className="checkin-controls post-session-controls">
        <label className="inline-field">
          <span>Aktuelle Stufe</span>
          <select
            defaultValue={entry.currentStage}
            disabled={isSavingDisabled}
            key={`${keyBase}::stage`}
            onBlur={textBlurHandler('currentStage', savePatch)}
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
            defaultValue={entry.medicalContactNote}
            disabled={isSavingDisabled}
            key={`${keyBase}::medical`}
            placeholder="z. B. Physio: non-contact"
            onBlur={textBlurHandler('medicalContactNote', savePatch)}
          />
        </label>

        <label className="inline-field">
          <span>Speed-Cap</span>
          <input
            defaultValue={entry.speedCap}
            disabled={isSavingDisabled}
            key={`${keyBase}::speed`}
            placeholder="z. B. 4x10 m smooth"
            onBlur={textBlurHandler('speedCap', savePatch)}
          />
        </label>

        <label className="inline-field">
          <span>COD/Decel-Cap</span>
          <input
            defaultValue={entry.codDecelCap}
            disabled={isSavingDisabled}
            key={`${keyBase}::cod`}
            placeholder="geplant, keine offenen Cuts"
            onBlur={textBlurHandler('codDecelCap', savePatch)}
          />
        </label>

        <label className="inline-field">
          <span>Conditioning-Cap</span>
          <input
            defaultValue={entry.conditioningCap}
            disabled={isSavingDisabled}
            key={`${keyBase}::conditioning`}
            placeholder="kurz / extensiv / gestrichen"
            onBlur={textBlurHandler('conditioningCap', savePatch)}
          />
        </label>

        <label className="inline-field">
          <span>Kontakt-Cap</span>
          <input
            defaultValue={entry.contactCap}
            disabled={isSavingDisabled}
            key={`${keyBase}::contact`}
            placeholder="kein Kontakt / Bags / controlled"
            onBlur={textBlurHandler('contactCap', savePatch)}
          />
        </label>

        <label className="inline-field wide">
          <span>Heute erlaubt</span>
          <textarea
            defaultValue={entry.allowedToday}
            disabled={isSavingDisabled}
            key={`${keyBase}::allowed`}
            rows={2}
            placeholder="z. B. Team-Warm-up plus individuelle Speed-Caps"
            onBlur={textBlurHandler('allowedToday', savePatch)}
          />
        </label>

        <label className="inline-field wide">
          <span>Geplante Caps</span>
          <textarea
            defaultValue={entry.plannedCaps}
            disabled={isSavingDisabled}
            key={`${keyBase}::planned`}
            rows={2}
            placeholder="z. B. Speed submax, kein Contact Prep"
            onBlur={textBlurHandler('plannedCaps', savePatch)}
          />
        </label>

        <label className="inline-field wide">
          <span>Tatsaechlich absolviert</span>
          <textarea
            defaultValue={entry.completed}
            disabled={isSavingDisabled}
            key={`${keyBase}::completed`}
            rows={2}
            placeholder="kurz und sachlich, keine Diagnose"
            onBlur={textBlurHandler('completed', savePatch)}
          />
        </label>

        <label className="inline-field">
          <span>Symptome Training</span>
          <input
            defaultValue={entry.symptomsDuring}
            disabled={isSavingDisabled}
            key={`${keyBase}::symptoms`}
            placeholder="ok / keine / Schmerzprovokation"
            onBlur={textBlurHandler('symptomsDuring', savePatch)}
          />
        </label>

        <label className="inline-field">
          <span>Naechster Morgen</span>
          <input
            defaultValue={entry.nextMorning}
            disabled={isSavingDisabled}
            key={`${keyBase}::morning`}
            placeholder="stabil / schlechter / offen"
            onBlur={textBlurHandler('nextMorning', savePatch)}
          />
        </label>

        <div className="control-group wide">
          <span>Entscheidung</span>
          <div className="button-row">
            {returnerDecisionOptions.map((option) => (
              <button
                className={entry.decision === option.value ? 'segmented active' : 'segmented'}
                disabled={isSavingDisabled}
                key={option.value}
                type="button"
                onClick={() => savePatch({ decision: option.value })}
              >
                {option.label}
              </button>
            ))}
            <button
              className={isConservative ? 'segmented danger' : 'segmented'}
              disabled={isSavingDisabled}
              type="button"
              onClick={() => savePatch({ decision: suggestedDecision })}
            >
              Vorschlag: {suggestedDecision}
            </button>
          </div>
        </div>
      </div>

      {!canProgress ? (
        <div className="warning-note danger">
          <AlertTriangle className="nav-icon" aria-hidden />
          <span>Keine Progression ohne stabile Reaktion und Medical-/Coach-Klaerung.</span>
        </div>
      ) : null}

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
  onNavigate,
  onSessionChange,
  returnerActions,
  selectedSession,
  selectedSessionId,
  sessions,
}: ReturnerViewProps) {
  const {
    activeReturnerPlayers,
    clearError,
    errorMessage,
    getEntryForPlayer,
    getHistoryForPlayer,
    isLoading,
    runSync,
    savePlayerReturner,
    syncOverview,
  } = returnerActions

  if (authState.status !== 'signed-in') {
    return (
      <div className="content-stack">
        <AuthPanel authState={authState} />
        <section className="placeholder" aria-labelledby="returner-locked-heading">
          <HeartPulse className="placeholder-icon" aria-hidden />
          <h2 id="returner-locked-heading">Returner</h2>
          <p>Returner-Caps und Verlauf werden erst nach Coach-Login lokal gespeichert und synchronisiert.</p>
        </section>
      </div>
    )
  }

  return (
    <section className="checkin-layout returner-layout" aria-labelledby="returner-heading">
      <div className="panel checkin-header">
        <div className="library-heading">
          <p className="eyebrow">Returner-Steuerung</p>
          <h3 id="returner-heading">Returner-Modul</h3>
          <p>{selectedSession.title}: Speed, COD/Decel, Conditioning und Kontakt getrennt dokumentieren.</p>
        </div>
        <div className="player-toolbar">
          <SessionPicker
            onSessionChange={onSessionChange}
            selectedSessionId={selectedSessionId}
            sessions={sessions}
          />
          <button className="secondary-action" type="button" onClick={runSync} disabled={isLoading}>
            <RefreshCw className="nav-icon" aria-hidden />
            <span>{isLoading ? 'Sync laeuft...' : 'Sync'}</span>
          </button>
          <button className="secondary-action" type="button" onClick={() => onNavigate('training')}>
            <UserCheck className="nav-icon" aria-hidden />
            <span>Training</span>
          </button>
        </div>
      </div>

      <div className="metric-grid checkin-metrics">
        <div className="metric">
          <span>Returner</span>
          <strong>{activeReturnerPlayers.length}</strong>
        </div>
        <div className="metric">
          <span>Sync</span>
          <strong>{syncOverview.pendingCount}</strong>
        </div>
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

      <div className="panel checkin-sync-strip">
        <span className={`status-dot ${syncOverview.status === 'synced' ? 'online' : ''}`} aria-hidden />
        <strong>{syncOverview.status}</strong>
        <span>{syncOverview.pendingCount} Returner pending</span>
        {syncOverview.errorMessage ? <span>{syncOverview.errorMessage}</span> : null}
      </div>

      <section className="panel returner-red-flags" aria-label="Returner Red Flags">
        <div className="status-line">
          <ShieldAlert className="nav-icon" aria-hidden />
          <h3>Red Flags</h3>
        </div>
        <ul className="compact-list">
          {returnerRedFlags.map((flag) => (
            <li key={flag}>{flag}</li>
          ))}
        </ul>
        <p>S&C dokumentiert und steuert Belastung. Medizinische Freigabe, Concussion und RTP bleiben medizinisch.</p>
      </section>

      <div className="checkin-list">
        {activeReturnerPlayers.map((player) => (
          <ReturnerPlayerCard
            entry={getEntryForPlayer(player)}
            history={getHistoryForPlayer(player)}
            isSavingDisabled={isLoading}
            key={player.id}
            onSave={savePlayerReturner}
            player={player}
            selectedSessionId={selectedSessionId}
          />
        ))}
      </div>

      {activeReturnerPlayers.length === 0 ? (
        <section className="placeholder">
          <HeartPulse className="placeholder-icon" aria-hidden />
          <h2>Keine aktiven Returner markiert</h2>
          <p>Setze im Spieler-Tab oder Check-in den Returner-Status. Danach erscheint der Spieler hier.</p>
        </section>
      ) : null}
    </section>
  )
}
