import { Camera, RefreshCw, Save, Trash2, UserMinus, UserPlus, Users, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { sprint30mOptionalLabel } from '../domain/baseline'
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
import type { useBaselines } from '../hooks/useBaselines'
import type { AuthSessionState } from '../lib/auth'
import { triggerHapticFeedback } from '../lib/interactionFeedback'
import { downloadPlayerPhotoUrl } from '../lib/playerRepository'
import { pendingCountLabel, shouldShowSyncAttention, syncStatusLabel } from '../lib/syncLabels'
import type { usePlayers } from '../hooks/usePlayers'

type PlayerActions = ReturnType<typeof usePlayers>
type BaselineActions = ReturnType<typeof useBaselines>

type PlayersViewProps = {
  authState: AuthSessionState
  baselineActions: BaselineActions
  playerActions: PlayerActions
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

export function PlayersView({ authState, baselineActions, playerActions }: PlayersViewProps) {
  const { players, syncOverview, isLoading, runSync, savePlayer, deactivatePlayer, deletePlayer, uploadPlayerPhoto } =
    playerActions
  const { removePlayerPhoto } = playerActions
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formValues, setFormValues] = useState<PlayerFormValues>(emptyPlayerFormValues)
  const [formError, setFormError] = useState<string | null>(null)
  const [formNotice, setFormNotice] = useState<string | null>(null)
  const [viewNotice, setViewNotice] = useState<string | null>(null)
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<Record<string, string>>({})
  const photoPreviewUrlsRef = useRef<Record<string, string>>({})
  const { clearPhotoLoadError, markPhotoLoadError, photoLoadError } = usePhotoLoadError()
  const showSyncAttention = shouldShowSyncAttention(syncOverview)

  const selectedPlayer = useMemo(
    () => players.find((player) => player.id === selectedPlayerId) ?? null,
    [players, selectedPlayerId],
  )
  const latestBaseline = selectedPlayer ? baselineActions.getLatestBaselineForPlayer(selectedPlayer) : null

  function openNewPlayerSheet() {
    setSelectedPlayerId(null)
    setFormValues(emptyPlayerFormValues)
    setFormError(null)
    setFormNotice(null)
    setViewNotice(null)
    clearPhotoLoadError()
    setIsEditorOpen(true)
  }

  function openPlayerSheet(player: Player) {
    setSelectedPlayerId(player.id)
    setFormValues(playerToFormValues(player))
    setFormError(null)
    setFormNotice(null)
    setViewNotice(null)
    clearPhotoLoadError()
    setIsEditorOpen(true)
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
      triggerHapticFeedback('success')
      if (!selectedPlayer) {
        setFormValues(emptyPlayerFormValues)
      }
      setIsEditorOpen(false)
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

  return (
    <section className="players-layout" aria-labelledby="players-heading">
      <aside className="panel players-sidebar">
        <div className="library-heading">
          <p className="eyebrow">Kader</p>
          <h3 id="players-heading">Spieler</h3>
          <p>{players.length} Spieler lokal erfasst.</p>
        </div>

        <div className="player-toolbar">
          <button
            className="secondary-action"
            type="button"
            onClick={openNewPlayerSheet}
          >
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

        {showSyncAttention ? (
          <div className="sync-mini">
            <span className={`status-dot ${syncOverview.status === 'synced' ? 'online' : ''}`} aria-hidden />
            <strong>{syncStatusLabel(syncOverview.status)}</strong>
            <span>{pendingCountLabel(syncOverview.pendingCount)}</span>
          </div>
        ) : null}
        {viewNotice ? (
          <p className="form-success player-view-notice" aria-live="polite">
            {viewNotice}
          </p>
        ) : null}

        <div className="player-list" aria-label="Spielerliste">
          {players.map((player) => (
            <button
              className={selectedPlayer?.id === player.id ? 'player-list-item active' : 'player-list-item'}
              key={player.id}
              type="button"
              onClick={() => openPlayerSheet(player)}
            >
              <PlayerAvatar player={player} previewUrl={photoPreviewUrls[player.id]} />
              <span>
                <strong>{player.name}</strong>
                <small>
                  {player.position} · {player.cluster} · {player.active ? 'aktiv' : 'inaktiv'}
                </small>
              </span>
            </button>
          ))}
          {players.length === 0 ? <p className="empty-state">Noch keine Spieler angelegt.</p> : null}
        </div>
      </aside>

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
                <p className="eyebrow">{selectedPlayer ? 'Bearbeiten' : 'Neu anlegen'}</p>
                <h3 id="player-editor-heading">{selectedPlayer?.name ?? 'Spieler-Stammdaten'}</h3>
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

        {selectedPlayer ? (
          <div className="player-profile-strip">
            <PlayerAvatar
              onPhotoLoadError={markPhotoLoadError}
              player={selectedPlayer}
              previewUrl={photoPreviewUrls[selectedPlayer.id]}
            />
            <div>
              <strong>{selectedPlayer.name}</strong>
              <p>{selectedPlayer.syncStatus === 'error' ? selectedPlayer.syncError : syncStatusLabel(selectedPlayer.syncStatus)}</p>
            </div>
          </div>
        ) : null}

        {selectedPlayer ? (
          <div className="baseline-summary">
            <div className="status-line">
              <Users className="nav-icon" aria-hidden />
              <h3>Testwerte</h3>
            </div>
            {latestBaseline ? (
              <>
                <p>Letzter Eintrag: {latestBaseline.sessionDate}</p>
                <div className="metric-grid mini">
                  <div className="metric">
                    <span>Broad Jump</span>
                    <strong>{latestBaseline.broadJumpCm !== null ? `${latestBaseline.broadJumpCm} cm` : '-'}</strong>
                  </div>
                  <div className="metric">
                    <span>MB Chest Pass</span>
                    <strong>
                      {latestBaseline.medBallChestPassM !== null ? `${latestBaseline.medBallChestPassM} m` : '-'}
                    </strong>
                  </div>
                  <div className="metric">
                    <span>MB Gewicht</span>
                    <strong>{latestBaseline.medBallWeightKg !== null ? `${latestBaseline.medBallWeightKg} kg` : '-'}</strong>
                  </div>
                  <div className="metric">
                    <span>{sprint30mOptionalLabel}</span>
                    <strong>{latestBaseline.sprint30m !== null ? `${latestBaseline.sprint30m} s` : 'spaeter'}</strong>
                  </div>
                </div>
                {latestBaseline.note ? <p>{latestBaseline.note}</p> : null}
              </>
            ) : (
              <p>Noch keine Mini-Baseline erfasst.</p>
            )}
          </div>
        ) : null}

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
          </article>
        </div>
      ) : null}
    </section>
  )
}
