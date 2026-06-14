import type { SyncStatus } from './sync'

export const sprint30mOptionalLabel = '30 m spaeter/optional'

export type BaselineEntry = {
  id: string
  userId: string
  playerId: string
  sessionLogId: string
  broadJumpCm: number | null
  medBallChestPassM: number | null
  medBallWeightKg: number | null
  sprint30m: number | null
  note: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  clientUpdatedAt: string
  syncStatus: SyncStatus
  syncError: string | null
}

export type BaselineEntryPatch = Partial<
  Pick<BaselineEntry, 'broadJumpCm' | 'medBallChestPassM' | 'medBallWeightKg' | 'sprint30m' | 'note'>
>

export function parseOptionalBaselineNumber(value: string, fieldLabel = 'Wert') {
  const normalizedValue = value.trim().replace(',', '.')

  if (!normalizedValue) {
    return null
  }

  const parsedValue = Number(normalizedValue)

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    throw new Error(`${fieldLabel} muss eine nicht-negative Zahl sein.`)
  }

  return parsedValue
}

export function formatOptionalBaselineNumber(value: number | null) {
  if (value === null) {
    return ''
  }

  return Number.isInteger(value) ? String(value) : String(value).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')
}

export function hasBaselineContent(entry: Pick<BaselineEntry, 'broadJumpCm' | 'medBallChestPassM' | 'medBallWeightKg' | 'sprint30m' | 'note'>) {
  return (
    entry.broadJumpCm !== null ||
    entry.medBallChestPassM !== null ||
    entry.medBallWeightKg !== null ||
    entry.sprint30m !== null ||
    entry.note.trim().length > 0
  )
}
