import { AlertTriangle, ClipboardCheck, FileText, Link2, Plus, RefreshCw, ShieldAlert, UserCheck, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { HubTab } from '../App'
import type { SessionDefinition } from '../content/types'
import type {
  CheckInEntryPatch,
  PlayerSessionEntry,
  PlayerWarning,
  RedFlag,
  ReturnerFlag,
  TrafficLight,
} from '../domain/checkIn'
import type { Player } from '../domain/players'
import type { ReturnerCapSummary } from '../domain/returners'
import type { useCheckIns } from '../hooks/useCheckIns'
import type { usePlayers } from '../hooks/usePlayers'
import type { AuthSessionState } from '../lib/auth'
import { triggerHapticFeedback } from '../lib/interactionFeedback'
import { applyOptimisticCheckInPatch } from '../lib/optimisticUpdates'
import { measureInteraction } from '../lib/performanceTrace'
import { hasPlayerId } from '../lib/playerId'
import {
  buildPublicCheckInSharePayload,
  copyPublicCheckInLink,
  createPublicCheckInQrCodeDataUrl,
  type PublicCheckInSharePayload,
} from '../lib/publicCheckInShare'
import { pendingCountLabel, shouldShowSyncAttention, syncStatusLabel } from '../lib/syncLabels'
import { PublicCheckInSharePanel } from './PublicCheckInSharePanel'
import { SessionPicker } from './SessionPicker'

type CheckInActions = ReturnType<typeof useCheckIns>
type PlayerActions = ReturnType<typeof usePlayers>

type CheckInViewProps = {
  authState: AuthSessionState
  checkInActions: CheckInActions
  playerActions: PlayerActions
  returnerCaps: ReturnerCapSummary[]
  onNavigate: (tab: HubTab) => void
  onSessionChange: (sessionId: string) => void
  selectedSession: SessionDefinition
  selectedSessionId: string
  sessions: SessionDefinition[]
}

const trafficLabels: Record<TrafficLight, string> = {
  green: 'Gruen',
  yellow: 'Gelb',
  red: 'Rot',
}

const redFlagOptions: Array<{ value: RedFlag; label: string }> = [
  { value: 'none', label: 'Keine Red Flag' },
  { value: 'head_neck_neuro', label: 'Kopf/Nacken/Neuro' },
  { value: 'acute_instability', label: 'Akut instabil/stark' },
]

const returnerOptions: Array<{ value: ReturnerFlag; label: string }> = [
  { value: 'nein', label: 'Nein' },
  { value: 'ja', label: 'Ja' },
  { value: 'offen', label: 'Offen' },
]

type NativeShareStatus = 'idle' | 'sharing' | 'shared' | 'aborted' | 'error'
type CopyStatus = 'idle' | 'copied' | 'error'
type QrCodeStatus = 'idle' | 'loading' | 'ready' | 'error'

function entryRenderKey(entry: PlayerSessionEntry) {
  return `${entry.id}:${entry.clientUpdatedAt}:${entry.syncStatus}`
}

function formatTrafficLight(trafficLight: TrafficLight | null) {
  return trafficLight ? trafficLabels[trafficLight] : 'Offen'
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
        {warning.limits.length > 0 ? ` · Limits ${warning.limits.join(', ')}` : ''}
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
    cap.currentStage ? `Stufe ${cap.currentStage}` : null,
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

function CheckInPlayerRow({
  entry,
  isExpected,
  isSavingDisabled,
  onSave,
  player,
  returnerCap,
  warning,
}: {
  entry: PlayerSessionEntry
  isExpected: boolean
  isSavingDisabled: boolean
  onSave: (
    player: Player,
    patch: CheckInEntryPatch,
    manualTrafficLight?: TrafficLight | 'auto',
  ) => Promise<{ ok: true; entry: PlayerSessionEntry } | { ok: false; error: string }>
  player: Player
  returnerCap: ReturnerCapSummary | undefined
  warning: PlayerWarning | undefined
}) {
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null)
  const [savingActionKey, setSavingActionKey] = useState<string | null>(null)
  const [localEntryOverride, setLocalEntryOverride] = useState<{ baseKey: string; entry: PlayerSessionEntry } | null>(
    null,
  )
  const savingActionRef = useRef<string | null>(null)
  const saveFeedbackTimeoutRef = useRef<number | null>(null)
  const controlsDisabled = isSavingDisabled
  const sourceEntryKey = entryRenderKey(entry)
  const displayEntry = localEntryOverride?.baseKey === sourceEntryKey ? localEntryOverride.entry : entry

  useEffect(() => {
    return () => {
      savingActionRef.current = null
      if (saveFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(saveFeedbackTimeoutRef.current)
      }
    }
  }, [])

  async function saveWithFeedback(
    label: string,
    actionKey: string,
    patch: CheckInEntryPatch,
    manualTrafficLight?: TrafficLight | 'auto',
  ) {
    if (isSavingDisabled || savingActionRef.current === actionKey) {
      return
    }

    const previousEntry = displayEntry
    const optimisticEntry = applyOptimisticCheckInPatch(displayEntry, patch, manualTrafficLight)
    savingActionRef.current = actionKey
    triggerHapticFeedback('selection')
    setLocalEntryOverride({ baseKey: sourceEntryKey, entry: optimisticEntry })
    setSaveFeedback('Speichert...')
    setSavingActionKey(actionKey)

    try {
      const result = await measureInteraction(`check-in:${actionKey}`, () => onSave(player, patch, manualTrafficLight))

      if (result.ok) {
        triggerHapticFeedback('success')
        setLocalEntryOverride({ baseKey: sourceEntryKey, entry: result.entry })
        setSaveFeedback(`${label} gespeichert`)
      } else {
        triggerHapticFeedback('warning')
        setLocalEntryOverride({ baseKey: sourceEntryKey, entry: previousEntry })
        setSaveFeedback(`${label} nicht gespeichert`)
      }
    } catch {
      triggerHapticFeedback('warning')
      setLocalEntryOverride({ baseKey: sourceEntryKey, entry: previousEntry })
      setSaveFeedback(`${label} nicht gespeichert`)
    } finally {
      savingActionRef.current = null
      setSavingActionKey(null)
    }

    if (typeof window !== 'undefined') {
      if (saveFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(saveFeedbackTimeoutRef.current)
      }
      saveFeedbackTimeoutRef.current = window.setTimeout(() => {
        setSaveFeedback(null)
        saveFeedbackTimeoutRef.current = null
      }, 1400)
    }
  }

  return (
    <article className={`checkin-row traffic-${displayEntry.trafficLight ?? displayEntry.trafficLightSuggestion ?? 'open'}`}>
      <div className="checkin-player-head">
        <div>
          <div className="player-name-line">
            <strong>{player.name}</strong>
            {isExpected ? <span className="tag compact">Zuletzt dabei</span> : null}
          </div>
          <p>{player.position} · {player.cluster}</p>
        </div>
        <span className={`sync-pill ${displayEntry.syncStatus}`}>{syncStatusLabel(displayEntry.syncStatus)}</span>
      </div>

      <WarningNote warning={warning} />
      <ReturnerCapNote cap={returnerCap} />

      <div className="checkin-controls">
        <button
          className={displayEntry.present ? 'segmented active' : 'segmented'}
          type="button"
          disabled={controlsDisabled || savingActionKey === 'present'}
          onClick={() =>
            void saveWithFeedback('Anwesenheit', 'present', {
              present: !displayEntry.present,
              previousWarning: Boolean(warning),
            })
          }
        >
          <UserCheck className="nav-icon" aria-hidden />
          <span>{displayEntry.present ? 'Anwesend' : 'Abwesend'}</span>
        </button>

        <div className="control-group" aria-label={`Readiness ${player.name}`}>
          <span>Readiness</span>
          <div className="button-row compact">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                className={displayEntry.readiness === value ? 'number-chip active' : 'number-chip'}
                key={value}
                type="button"
                disabled={controlsDisabled || savingActionKey === `readiness:${value}`}
                onClick={() =>
                  void saveWithFeedback('Readiness', `readiness:${value}`, { readiness: value, previousWarning: Boolean(warning) })
                }
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <label className="inline-field">
          <span>Life</span>
          <input
            defaultValue={displayEntry.lifeFlag}
            disabled={controlsDisabled}
            placeholder="Schlaf, Stress, Muskelkater"
            onBlur={(event) =>
              void saveWithFeedback('Eingabe', 'lifeFlag', {
                lifeFlag: event.currentTarget.value,
                previousWarning: Boolean(warning),
              })
            }
          />
        </label>

        <div className="control-group" aria-label={`Schmerz ${player.name}`}>
          <span>Schmerz</span>
          <div className="button-row compact pain-scale">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
              <button
                className={displayEntry.painScore === value ? 'number-chip active' : 'number-chip'}
                key={value}
                type="button"
                disabled={controlsDisabled || savingActionKey === `pain:${value}`}
                onClick={() =>
                  void saveWithFeedback('Schmerz', `pain:${value}`, { painScore: value, previousWarning: Boolean(warning) })
                }
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <label className="inline-field">
          <span>Ort</span>
          <input
            defaultValue={displayEntry.painLocation}
            disabled={controlsDisabled}
            placeholder="z. B. Wade rechts"
            onBlur={(event) =>
              void saveWithFeedback('Eingabe', 'painLocation', {
                painLocation: event.currentTarget.value,
                previousWarning: Boolean(warning),
              })
            }
          />
        </label>

        <div className="control-group">
          <span>Returner</span>
          <div className="button-row">
            {returnerOptions.map((option) => (
              <button
                className={displayEntry.returnerFlag === option.value ? 'segmented active' : 'segmented'}
                key={option.value}
                type="button"
                disabled={controlsDisabled || savingActionKey === `returner:${option.value}`}
                onClick={() =>
                  void saveWithFeedback('Returner', `returner:${option.value}`, {
                    returnerFlag: option.value,
                    previousWarning: Boolean(warning),
                  })
                }
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="control-group">
          <span>Safety</span>
          <div className="button-row">
            {redFlagOptions.map((option) => {
              const isActiveDanger = option.value !== 'none' && displayEntry.redFlag === option.value

              return (
                <button
                  className={isActiveDanger ? 'segmented active danger' : 'segmented'}
                  key={option.value}
                  type="button"
                  disabled={controlsDisabled || savingActionKey === `safety:${option.value}`}
                  onClick={() =>
                    void saveWithFeedback('Safety', `safety:${option.value}`, {
                      redFlag: option.value,
                      previousWarning: Boolean(warning),
                    })
                  }
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>

        <label className="toggle-row checkin-toggle">
          <input
            type="checkbox"
            checked={displayEntry.movementConcern}
            disabled={controlsDisabled}
            onChange={(event) =>
              void saveWithFeedback('Bewegung', 'movementConcern', {
                movementConcern: event.currentTarget.checked,
                previousWarning: Boolean(warning),
              })
            }
          />
          <span>Auffaelliges Laufbild / Bewegung</span>
        </label>

        <div className="traffic-control">
          <span>
            Vorschlag: <strong>{formatTrafficLight(displayEntry.trafficLightSuggestion)}</strong>
            {displayEntry.trafficLightWasManual ? ' · Coach korrigiert' : ''}
          </span>
          <div className="button-row">
            {(['green', 'yellow', 'red'] as TrafficLight[]).map((trafficLight) => {
              const isManualSelection = displayEntry.trafficLightWasManual && displayEntry.trafficLight === trafficLight

              return (
                <button
                  className={isManualSelection ? `traffic-chip ${trafficLight} active` : `traffic-chip ${trafficLight}`}
                  key={trafficLight}
                  type="button"
                  disabled={controlsDisabled || savingActionKey === `traffic:${trafficLight}`}
                  onClick={() =>
                    void saveWithFeedback('Ampel', `traffic:${trafficLight}`, { previousWarning: Boolean(warning) }, trafficLight)
                  }
                >
                  {trafficLabels[trafficLight]}
                </button>
              )
            })}
            {displayEntry.trafficLightWasManual ? (
              <button
                className="secondary-action compact-action traffic-auto-reset"
                type="button"
                disabled={controlsDisabled || savingActionKey === 'traffic:auto'}
                title="Coach-Korrektur verwerfen und automatischen Vorschlag wieder aktivieren"
                onClick={() => void saveWithFeedback('Ampel', 'traffic:auto', { previousWarning: Boolean(warning) }, 'auto')}
              >
                Automatisch
              </button>
            ) : null}
          </div>
        </div>

        <label className="inline-field wide">
          <span>Notiz, keine Diagnose</span>
          <textarea
            defaultValue={displayEntry.observation}
            disabled={controlsDisabled}
            rows={2}
            placeholder="z. B. Hinken, Leiste 3/10, Technik auffaellig"
            onBlur={(event) =>
              void saveWithFeedback('Notiz', 'observation', {
                observation: event.currentTarget.value,
                previousWarning: Boolean(warning),
              })
            }
          />
        </label>
      </div>
      <p className={saveFeedback ? 'action-feedback visible' : 'action-feedback'} aria-live="polite">
        {saveFeedback ?? ''}
      </p>
    </article>
  )
}

export function CheckInView({
  authState,
  checkInActions,
  onNavigate,
  onSessionChange,
  playerActions,
  returnerCaps,
  selectedSession,
  selectedSessionId,
  sessions,
}: CheckInViewProps) {
  const {
    activePlayers,
    entries,
    errorMessage,
    expectedPlayerIds,
    observations,
    warnings,
    syncOverview,
    isLoading,
    runSync,
    saveEntry,
    getEntryForPlayer,
    clearError,
  } = checkInActions
  const showSyncAttention = shouldShowSyncAttention(syncOverview)
  const [createdSharePayload, setCreatedSharePayload] = useState<PublicCheckInSharePayload | null>(null)
  const [createdShareSessionId, setCreatedShareSessionId] = useState<string | null>(null)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null)
  const [qrCodeStatus, setQrCodeStatus] = useState<QrCodeStatus>('idle')
  const [nativeShareStatus, setNativeShareStatus] = useState<NativeShareStatus>('idle')
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle')
  const returnerCapByPlayerId = new Map(returnerCaps.filter(hasPlayerId).map((cap) => [cap.playerId, cap]))
  const expectedPlayerSet = new Set(expectedPlayerIds)
  const activePlayerIdSet = new Set(activePlayers.map((player) => player.id))
  const activeEntries = entries.filter((entry) => hasPlayerId(entry) && activePlayerIdSet.has(entry.playerId))
  const activeWarnings = warnings.filter((warning) => hasPlayerId(warning) && activePlayerIdSet.has(warning.playerId))
  const activeObservations = observations.filter(
    (observation) => hasPlayerId(observation) && activePlayerIdSet.has(observation.playerId),
  )
  const warningByPlayerId = new Map(activeWarnings.map((warning) => [warning.playerId, warning]))
  const orderedPlayers = [...activePlayers].sort((a, b) => {
    const aExpected = expectedPlayerSet.has(a.id)
    const bExpected = expectedPlayerSet.has(b.id)

    if (aExpected === bExpected) {
      return a.name.localeCompare(b.name, 'de-AT')
    }

    return aExpected ? -1 : 1
  })
  const checkedInCount = activeEntries.filter((entry) => entry.present).length
  const yellowCount = activeEntries.filter((entry) => entry.trafficLight === 'yellow').length
  const redCount = activeEntries.filter((entry) => entry.trafficLight === 'red').length
  const returnerCount = activeEntries.filter((entry) => entry.returnerFlag !== 'nein').length
  const activePublicLink = checkInActions.publicCheckInLinks.find((link) => !link.closedAt)
  const selectedSessionSharePayload = createdShareSessionId === selectedSessionId ? createdSharePayload : null
  const selectedSessionQrCodeDataUrl = createdShareSessionId === selectedSessionId ? qrCodeDataUrl : null
  const selectedSessionQrCodeStatus = createdShareSessionId === selectedSessionId ? qrCodeStatus : 'idle'
  const publicSubmissionCounts = checkInActions.publicCheckInSubmissions.reduce(
    (counts, submission) => {
      counts[submission.status] += 1
      return counts
    },
    { pending: 0, imported: 0, conflict: 0, superseded: 0 },
  )
  const canNativeShare =
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    (!selectedSessionSharePayload ||
      typeof navigator.canShare !== 'function' ||
      navigator.canShare(selectedSessionSharePayload))

  function clearTransientShareState() {
    setCreatedSharePayload(null)
    setCreatedShareSessionId(null)
    setQrCodeDataUrl(null)
    setQrCodeStatus('idle')
    setNativeShareStatus('idle')
    setCopyStatus('idle')
  }

  function handleSessionChange(sessionId: string) {
    clearTransientShareState()
    onSessionChange(sessionId)
  }

  async function handleCreatePublicLink() {
    const createdLink = await checkInActions.createPublicLink()
    if (!createdLink) {
      return
    }

    const sharePayload = buildPublicCheckInSharePayload({
      sessionDate: selectedSession.date,
      sessionTitle: selectedSession.title,
      url: createdLink.url,
    })
    setCreatedSharePayload(sharePayload)
    setCreatedShareSessionId(selectedSessionId)
    setQrCodeDataUrl(null)
    setQrCodeStatus('loading')
    setNativeShareStatus('idle')
    setCopyStatus('idle')

    try {
      setQrCodeDataUrl(await createPublicCheckInQrCodeDataUrl(createdLink.url))
      setQrCodeStatus('ready')
    } catch {
      setQrCodeDataUrl(null)
      setQrCodeStatus('error')
    }
  }

  async function handleNativeShare() {
    if (!selectedSessionSharePayload || !canNativeShare) {
      return
    }

    setNativeShareStatus('sharing')
    setCopyStatus('idle')

    try {
      await navigator.share(selectedSessionSharePayload)
      setNativeShareStatus('shared')
    } catch (caughtError) {
      if (caughtError && typeof caughtError === 'object' && 'name' in caughtError && caughtError.name === 'AbortError') {
        setNativeShareStatus('aborted')
        return
      }

      setNativeShareStatus('error')
    }
  }

  async function handleCopyShareLink() {
    if (!selectedSessionSharePayload) {
      return
    }

    setCopyStatus('idle')

    try {
      await copyPublicCheckInLink(selectedSessionSharePayload.url)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('error')
    }
  }

  async function handleClosePublicLink() {
    if (!activePublicLink) {
      return
    }

    clearTransientShareState()
    await checkInActions.closePublicLink(activePublicLink.id)
  }

  if (authState.status !== 'signed-in') {
    return (
      <div className="content-stack">
        <section className="placeholder" aria-labelledby="checkin-locked-heading">
          <ClipboardCheck className="placeholder-icon" aria-hidden />
          <h2 id="checkin-locked-heading">Pre-Session Check-in</h2>
          <p>Check-in-Daten werden erst nach Coach-Login in Einstellungen lokal gespeichert und synchronisiert.</p>
        </section>
      </div>
    )
  }

  return (
    <section className="checkin-layout" aria-labelledby="checkin-heading">
      <div className="panel checkin-header">
        <div className="library-heading">
          <p className="eyebrow">Vor dem Training</p>
          <h3 id="checkin-heading">Pre-Session Check-in</h3>
          <p>
            {selectedSession.title}: Anwesenheit, Readiness, Life-Flag, Schmerz, Returner und Ampel vor dem
            Training.
          </p>
        </div>
        <div className="player-toolbar">
          <SessionPicker
            onSessionChange={handleSessionChange}
            selectedSessionId={selectedSessionId}
            sessions={sessions}
          />
          {syncOverview.status === 'error' ? (
            <button className="secondary-action" type="button" onClick={runSync} disabled={isLoading}>
              <RefreshCw className="nav-icon" aria-hidden />
              <span>{isLoading ? 'Sync laeuft...' : 'Retry'}</span>
            </button>
          ) : null}
          <button className="secondary-action" type="button" onClick={() => onNavigate('spieler')}>
            <UserCheck className="nav-icon" aria-hidden />
            <span>Spieler verwalten</span>
          </button>
        </div>
      </div>

      <div className="metric-grid checkin-metrics">
        <div className="metric">
          <span>Aktive Spieler</span>
          <strong>{activePlayers.length}</strong>
        </div>
        <div className="metric">
          <span>Anwesend</span>
          <strong>{checkedInCount}</strong>
        </div>
        <div className="metric">
          <span>Gelb / Rot</span>
          <strong>{yellowCount} / {redCount}</strong>
        </div>
        <div className="metric">
          <span>Returner/offen</span>
          <strong>{returnerCount}</strong>
        </div>
      </div>

      {errorMessage ? (
        <div className="panel error-panel" role="alert">
          <strong>Check-in nicht vollstaendig synchronisiert</strong>
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
          <span>{pendingCountLabel(syncOverview.pendingCount, 'Check-in-Änderungen')}</span>
          {syncOverview.errorMessage ? <span>{syncOverview.errorMessage}</span> : null}
        </div>
      ) : null}

      <section className="panel public-checkin-coach-panel" aria-label="Check-in-Link teilen">
        <div className="status-line">
          <Link2 className="nav-icon" aria-hidden />
          <div>
            <h3>Check-in-Link teilen</h3>
            <p>
              Erstellt einen privaten Link fuer diese Einheit. Spieler sehen Namensauswahl und eigenes Formular.
            </p>
          </div>
        </div>
        <div className="button-row">
          <button
            className="primary-action"
            data-testid="public-checkin-create-link"
            type="button"
            onClick={() => void handleCreatePublicLink()}
            disabled={isLoading}
          >
            <Plus className="nav-icon" aria-hidden />
            <span>{activePublicLink ? 'Neuen Link erstellen' : 'Link erstellen'}</span>
          </button>
          {activePublicLink ? (
            <button
              className="secondary-action"
              data-testid="public-checkin-close-link"
              type="button"
              onClick={() => void handleClosePublicLink()}
            >
              <X className="nav-icon" aria-hidden />
              <span>Link schliessen</span>
            </button>
          ) : null}
        </div>
        {selectedSessionSharePayload ? (
          <PublicCheckInSharePanel
            canNativeShare={canNativeShare}
            copyStatus={copyStatus}
            nativeShareStatus={nativeShareStatus}
            onClose={clearTransientShareState}
            onCopy={() => void handleCopyShareLink()}
            onNativeShare={() => void handleNativeShare()}
            payload={selectedSessionSharePayload}
            qrCodeDataUrl={selectedSessionQrCodeDataUrl}
            qrCodeStatus={selectedSessionQrCodeStatus}
          />
        ) : null}
        <p className="sync-help">
          {activePublicLink
            ? `Link aktiv bis ${new Date(activePublicLink.expiresAt).toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' })}. Aus Sicherheitsgründen kann ein bestehender Link nachträglich nicht erneut angezeigt werden.`
            : 'Noch kein aktiver Link fuer diese Einheit lokal sichtbar.'}
          {checkInActions.publicCheckInSubmissions.length > 0
            ? ` Eingaenge: ${publicSubmissionCounts.pending} offen, ${publicSubmissionCounts.imported} uebernommen, ${publicSubmissionCounts.conflict} Konflikte.`
            : ''}
          {checkInActions.publicCheckInNotice ? ` ${checkInActions.publicCheckInNotice}` : ''}
          {selectedSessionSharePayload ? ' Link erstellt. Teile ihn oben oder lasse den QR-Code scannen.' : ''}
        </p>
      </section>

      {activeWarnings.length > 0 ? (
        <aside className="panel warning-panel" aria-label="Offene Warnungen">
          <div className="status-line">
            <ShieldAlert className="nav-icon" aria-hidden />
            <h3>Offene Warnungen</h3>
          </div>
          <div className="warning-list">
            {activeWarnings.map((warning) => {
              const player = playerActions.players.find((item) => item.id === warning.playerId)
              return (
                <div className="warning-note" key={`${warning.playerId}-${warning.sessionDate}`}>
                  <AlertTriangle className="nav-icon" aria-hidden />
                  <span>
                    <strong>{player?.name ?? 'Spieler'}</strong>: {formatTrafficLight(warning.trafficLight)}
                    {warning.returnerFlag !== 'nein' ? ` · Returner ${warning.returnerFlag}` : ''}
                    {warning.e2Decision && warning.e2Decision !== 'normal' ? ` · E2 ${warning.e2Decision}` : ''}
                    {warning.nextStep ? ` · Next ${warning.nextStep}` : ''}
                    {warning.postPainScore !== null ? ` · Post-Pain ${warning.postPainScore}/10` : ''}
                    {warning.observation ? ` · ${warning.observation}` : ''}
                  </span>
                </div>
              )
            })}
          </div>
        </aside>
      ) : null}

      {activeObservations.length > 0 ? (
        <aside className="panel" aria-label="Notizen aus letzter Einheit">
          <div className="status-line">
            <FileText className="nav-icon" aria-hidden />
            <h3>Notizen aus letzter Einheit</h3>
          </div>
          <div className="warning-list">
            {activeObservations.map((observation) => {
              const player = playerActions.players.find((item) => item.id === observation.playerId)
              return (
                <div className="warning-note" key={`${observation.playerId}-${observation.sessionDate}`}>
                  <FileText className="nav-icon" aria-hidden />
                  <span>
                    <strong>{player?.name ?? 'Spieler'}</strong>: {observation.observation}
                  </span>
                </div>
              )
            })}
          </div>
        </aside>
      ) : null}

      <div className="checkin-list">
        {orderedPlayers.map((player) => (
          <CheckInPlayerRow
            entry={getEntryForPlayer(player)}
            isExpected={expectedPlayerSet.has(player.id)}
            isSavingDisabled={isLoading}
            key={player.id}
            onSave={(selectedPlayer, patch, manualTrafficLight) => {
              return saveEntry(selectedPlayer, patch, manualTrafficLight)
            }}
            player={player}
            returnerCap={returnerCapByPlayerId.get(player.id)}
            warning={warningByPlayerId.get(player.id)}
          />
        ))}
      </div>

      {activePlayers.length === 0 ? (
        <section className="placeholder">
          <UserCheck className="placeholder-icon" aria-hidden />
          <h2>Noch keine aktiven Spieler</h2>
          <p>Lege zuerst Spieler im Spieler-Tab an. Danach erscheinen sie hier automatisch im Check-in.</p>
        </section>
      ) : null}
    </section>
  )
}
