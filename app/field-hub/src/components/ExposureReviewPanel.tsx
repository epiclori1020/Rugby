import { Activity, RefreshCw } from 'lucide-react'
import type { PlayerSessionEntry, SessionLog } from '../domain/checkIn'
import {
  exposureTypes,
  type ExposureStatus,
  type ExposureType,
  type PlayerExposureSummary,
} from '../domain/exposures'
import type { Player } from '../domain/players'
import { hasPlayerId } from '../lib/playerId'

type ExposureReviewPanelProps = {
  entries: PlayerSessionEntry[]
  isSavingDisabled: boolean
  onGenerate: () => void
  onManualOverride: (
    summary: PlayerExposureSummary,
    type: ExposureType,
    override: { status: Exclude<ExposureStatus, 'none'>; note: string },
  ) => void
  players: Player[]
  sessionLog: SessionLog | null
  summaries: PlayerExposureSummary[]
}

const overrideStatuses: Array<Exclude<ExposureStatus, 'none'>> = ['completed', 'reduced', 'skipped']

function presentPlayerIds(entries: PlayerSessionEntry[]) {
  return new Set(entries.filter((entry) => entry.present && hasPlayerId(entry)).map((entry) => entry.playerId))
}

function activeExposureLabels(summary: PlayerExposureSummary | undefined) {
  if (!summary) {
    return []
  }

  return exposureTypes.flatMap((type) => {
    const status = summary.statuses[type]
    return status === 'none' ? [] : [`${type} ${status}`]
  })
}

export function ExposureReviewPanel({
  entries,
  isSavingDisabled,
  onGenerate,
  onManualOverride,
  players,
  sessionLog,
  summaries,
}: ExposureReviewPanelProps) {
  const presentIds = presentPlayerIds(entries)
  const presentPlayers = players.filter((player) => presentIds.has(player.id))
  const summaryByPlayerId = new Map(summaries.flatMap((summary) => (summary.playerId ? [[summary.playerId, summary]] : [])))

  return (
    <section className="panel exposure-review-panel" aria-labelledby="exposure-review-heading">
      <div className="status-line">
        <Activity className="nav-icon" aria-hidden />
        <div>
          <h3 id="exposure-review-heading">Exposures</h3>
          <p>Dokumentation aus Blockstatus, Anwesenheit und Limits; keine medizinische Freigabe.</p>
        </div>
      </div>

      <div className="button-row">
        <button
          className="secondary-action"
          disabled={isSavingDisabled || !sessionLog}
          type="button"
          onClick={onGenerate}
        >
          <RefreshCw className="nav-icon" aria-hidden />
          <span>Exposures aus Blockstatus aktualisieren</span>
        </button>
      </div>

      <div className="exposure-summary-list">
        {presentPlayers.map((player) => {
          const summary = summaryByPlayerId.get(player.id)
          const labels = activeExposureLabels(summary)

          return (
            <article className="exposure-summary-row" key={player.id}>
              <div>
                <strong>{player.name}</strong>
                <p>{labels.length > 0 ? labels.join(' · ') : 'Noch keine Exposure-Summary fuer diese Einheit.'}</p>
              </div>
              {summary ? (
                <div className="button-row training-actions" aria-label={`Exposure Override ${player.name}`}>
                  {exposureTypes.map((type) => (
                    <label className="inline-field compact-field" key={type}>
                      <span>{type}</span>
                      <select
                        disabled={isSavingDisabled}
                        value={summary.statuses[type] === 'none' ? '' : summary.statuses[type]}
                        onChange={(event) => {
                          if (!event.target.value) {
                            return
                          }

                          onManualOverride(summary, type, {
                            status: event.target.value as Exclude<ExposureStatus, 'none'>,
                            note: 'Coach Override',
                          })
                        }}
                      >
                        <option value="">none</option>
                        {overrideStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              ) : null}
            </article>
          )
        })}
      </div>

      {presentPlayers.length === 0 ? <p>Keine anwesenden Spieler fuer Exposure-Erzeugung.</p> : null}
    </section>
  )
}
