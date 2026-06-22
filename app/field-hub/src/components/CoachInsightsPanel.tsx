import { Lightbulb, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { CoachInsight, CoachInsightSource } from '../domain/coachInsights'

type CoachInsightsPanelProps = {
  emptyText: string
  dismissKey?: string
  insights: CoachInsight[]
  limit?: number
  onOpenSource?: (source: CoachInsightSource) => void
}

const severityLabels: Record<CoachInsight['severity'], string> = {
  high: 'hoch',
  medium: 'mittel',
  low: 'niedrig',
}

const targetLabels: Record<CoachInsight['targetTab'], string> = {
  spieler: 'Spieler',
  'check-in': 'Check-in',
  training: 'Training',
  nachbereitung: 'Nachbereitung',
  returner: 'Returner',
  analysis: 'Analyse',
}

function sourceLabel(source: CoachInsightSource) {
  const parts = [
    source.playerName ?? null,
    source.sessionDate,
    targetLabels[source.correctionTarget],
  ].filter(Boolean)

  return parts.join(' · ')
}

export function CoachInsightsPanel({ dismissKey, emptyText, insights, limit, onOpenSource }: CoachInsightsPanelProps) {
  const [dismissState, setDismissState] = useState<{ key?: string; ids: Set<string> }>(() => ({
    key: dismissKey,
    ids: new Set(),
  }))

  const visibleInsights = useMemo(() => {
    const dismissedIds = dismissState.key === dismissKey ? dismissState.ids : new Set<string>()
    const nextInsights = insights.filter((insight) => !dismissedIds.has(insight.id))
    return limit ? nextInsights.slice(0, limit) : nextInsights
  }, [dismissKey, dismissState.ids, dismissState.key, insights, limit])

  function dismissInsight(insightId: string) {
    setDismissState((currentState) => {
      const currentIds = currentState.key === dismissKey ? currentState.ids : new Set<string>()
      return {
        key: dismissKey,
        ids: new Set([...currentIds, insightId]),
      }
    })
  }

  return (
    <article className="panel coach-insights-panel" aria-label="Coach Insights">
      <div className="status-line">
        <Lightbulb className="nav-icon" aria-hidden />
        <h3>Coach Insights</h3>
      </div>
      {visibleInsights.length === 0 ? (
        <p className="empty-state compact-empty">{emptyText}</p>
      ) : (
        <div className="coach-insight-list">
          {visibleInsights.map((insight) => {
            return (
              <section className={`coach-insight coach-insight-${insight.severity}`} key={insight.id}>
                <div className="coach-insight-heading">
                  <div>
                    <span className="tag compact">{severityLabels[insight.severity]}</span>
                    <h4>{insight.title}</h4>
                  </div>
                  <button
                    className="secondary-action compact-action coach-insight-dismiss"
                    type="button"
                    aria-label={`${insight.title} ausblenden`}
                    onClick={() => dismissInsight(insight.id)}
                  >
                    <X className="nav-icon" aria-hidden />
                    <span>Ausblenden</span>
                  </button>
                </div>
                <p>{insight.reason}</p>
                {insight.correctionHint ? <p className="privacy-note">{insight.correctionHint}</p> : null}
                {insight.sources.length > 0 ? (
                  <div className="coach-insight-sources">
                    {insight.sources.map((source) => (
                      <div className="player-analysis-source" key={`${insight.id}:${source.table}:${source.recordId}`}>
                        <span>Quelle: {sourceLabel(source)}</span>
                        {onOpenSource && source.sessionDefinitionId ? (
                          <button className="text-action" type="button" onClick={() => onOpenSource(source)}>
                            Quelle oeffnen
                          </button>
                        ) : (
                          <span>{source.sessionDefinitionId ? 'Quelle lokal sichtbar.' : 'Kein Session-Link.'}</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>
            )
          })}
        </div>
      )}
    </article>
  )
}
