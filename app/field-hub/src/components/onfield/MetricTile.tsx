export type MetricTileTone = 'neutral' | 'success' | 'warning' | 'danger'

type MetricTileProps = {
  label: string
  value: string | number
  detail?: string
  tone?: MetricTileTone
}

export function MetricTile({ detail, label, tone = 'neutral', value }: MetricTileProps) {
  return (
    <dl className={`of-metric-tile of-metric-tile-${tone}`}>
      <dt className="of-metric-tile-label">{label}</dt>
      <dd className="of-metric-tile-value of-num">{value}</dd>
      {detail ? <dd className="of-metric-tile-detail">{detail}</dd> : null}
    </dl>
  )
}
