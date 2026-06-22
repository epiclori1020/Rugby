import type { SessionDefinition } from '../content/types'
import type { SyncStatus } from './sync'

export type SessionBlockStatus = 'planned' | 'done' | 'reduced' | 'changed' | 'skipped'
export type SessionBlockReason =
  | 'none'
  | 'time'
  | 'weather'
  | 'group'
  | 'safety'
  | 'equipment'
  | 'coach_decision'

export const sessionBlockStatuses: SessionBlockStatus[] = ['planned', 'done', 'reduced', 'changed', 'skipped']
export const sessionBlockReasons: SessionBlockReason[] = [
  'none',
  'time',
  'weather',
  'group',
  'safety',
  'equipment',
  'coach_decision',
]

export type SessionBlockLog = {
  id: string
  userId: string
  sessionLogId: string
  sessionDefinitionId: string
  blockKey: string
  blockTitle: string
  blockOrder: number
  plannedTime: string
  plannedWork: string
  status: SessionBlockStatus
  reason: SessionBlockReason
  coachNote: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  clientUpdatedAt: string
  syncStatus: SyncStatus
  syncError: string | null
}

export type SessionBlockSnapshot = Pick<
  SessionBlockLog,
  'sessionDefinitionId' | 'blockKey' | 'blockTitle' | 'blockOrder' | 'plannedTime' | 'plannedWork'
>

export type SessionBlockLogPatch = Partial<Pick<SessionBlockLog, 'status' | 'reason' | 'coachNote'>>

export const sessionBlockStatusLabels: Record<SessionBlockStatus, string> = {
  planned: 'Geplant',
  done: 'Erledigt',
  reduced: 'Reduziert',
  changed: 'Geaendert',
  skipped: 'Gestrichen',
}

export const sessionBlockReasonLabels: Record<SessionBlockReason, string> = {
  none: 'Kein Grund',
  time: 'Zeit',
  weather: 'Wetter',
  group: 'Gruppe',
  safety: 'Safety',
  equipment: 'Material',
  coach_decision: 'Coach-Entscheid',
}

export function isReasonRequiredForStatus(status: SessionBlockStatus) {
  return status === 'reduced' || status === 'changed' || status === 'skipped'
}

export function validateSessionBlockStatusReason(status: SessionBlockStatus, reason: SessionBlockReason) {
  if (isReasonRequiredForStatus(status) && reason === 'none') {
    return {
      valid: false,
      error: 'Grund ist fuer reduziert, geaendert oder gestrichen verpflichtend.',
    }
  }

  if (!isReasonRequiredForStatus(status) && reason !== 'none') {
    return {
      valid: false,
      error: 'Grund ist nur bei reduziert, geaendert oder gestrichen erlaubt.',
    }
  }

  return { valid: true, error: null }
}

export function buildSessionBlockSnapshot(
  sessionDefinition: SessionDefinition,
  blockKey: string,
): SessionBlockSnapshot {
  const block = sessionDefinition.timeline.find((candidate) => candidate.key === blockKey)

  if (!block) {
    throw new Error('Session-Block nicht gefunden.')
  }

  return {
    sessionDefinitionId: sessionDefinition.id,
    blockKey: block.key,
    blockTitle: block.title,
    blockOrder: block.order,
    plannedTime: block.time,
    plannedWork: block.work,
  }
}
