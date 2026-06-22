export type FutureFactDataPullStrategy =
  | 'session_scoped_pull'
  | 'compact_summary_model'
  | 'server_delta_watermark'

export const futureFactDataSyncRule =
  'Neue dichte Fact-Daten duerfen keinen periodischen globalen Full Pull erzwingen.'

export const allowedFutureFactDataPullStrategies: FutureFactDataPullStrategy[] = [
  'session_scoped_pull',
  'compact_summary_model',
  'server_delta_watermark',
]

export const requiredDynamicTableIntegrationChecklist = [
  'Dexie Store',
  'Pending Queue',
  'Push/Pull',
  'Backup/Import',
  'CSV falls sinnvoll',
  'RLS mit user_id',
  'fokussierte Domain-/Repository-Tests',
] as const

export const denseFactTableExamples = [
  'session_block_logs',
  'player_exposures',
  'metric_results',
  'exercise_results',
] as const

