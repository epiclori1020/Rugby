import { AlertTriangle, HeartPulse, History, RefreshCw, ShieldAlert, UserCheck } from 'lucide-react'
import { useRef, useState } from 'react'
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
import { applyOptimisticReturnerPatch } from '../lib/optimisticUpdates'
import { measureInteraction } from '../lib/performanceTrace'
import { returnerEntryKeyBase } from '../lib/returnerEntryKey'
import { pendingCountLabel, syncStatusLabel } from '../lib/syncLabels'
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
  onSave: (player: Player, patch: ReturnerEntryPatch) => Promise<{ ok: true; entry: ReturnerEntry } | { ok: false; error: string }>
  player: Player
  selectedSessionId: string
}) {
  const keyBase = returnerEntryKeyBase(player.id, selectedSessionId)
  const [localEntryOverride, setLocalEntryOverride] = useState<{ baseKey: string; entry: ReturnerEntry } | null>(null)
  const [savingActionKey, setSavingActionKey] = useState<string | null>(null)
  const savingActionRef = useRef<string | null>(null)
  const sourceEntryKey = returnerEntryRenderKey(entry)
  const displayEntry = localEntryOverride?.baseKey === sourceEntryKey ? localEntryOverride.entry : entry
  const suggestedDecision = suggestReturnerDecision(displayEntry)
  const canProgress = canConsiderReturnerProgression(displayEntry)
  const isConservative = suggestedDecision === 'rueckmelden' || displayEntry.decision === 'rueckmelden'

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
      } else {
        setLocalEntryOverride({ baseKey: sourceEntryKey, entry: previousEntry })
      }
    } catch {
      setLocalEntryOverride({ baseKey: sourceEntryKey, entry: previousEntry })
    } finally {
      savingActionRef.current = null
      setSavingActionKey(null)
    }
  }

  return (
    <article className={isConservative ? 'checkin-row traffic-red' : 'checkin-row traffic-yellow'}>
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
            placeholder="z. B. Physio: non-contact"
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
            placeholder="kein Kontakt / Bags / controlled"
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
            placeholder="z. B. Speed submax, kein Contact Prep"
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
              disabled={isSavingDisabled || savingActionKey === `decision:${suggestedDecision}`}
              type="button"
              onClick={() => void savePatch({ decision: suggestedDecision }, `decision:${suggestedDecision}`)}
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
          {syncOverview.status === 'error' ? (
            <button className="secondary-action" type="button" onClick={runSync} disabled={isLoading}>
              <RefreshCw className="nav-icon" aria-hidden />
              <span>{isLoading ? 'Sync laeuft...' : 'Retry'}</span>
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
        <strong>{syncStatusLabel(syncOverview.status)}</strong>
        <span>{pendingCountLabel(syncOverview.pendingCount, 'Returner-Aenderungen')}</span>
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
