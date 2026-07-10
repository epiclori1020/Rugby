import type { PlayerSessionEntry } from './checkIn'
import type { Player } from './players'
import { hasReturnerConcern, type ReturnerEntry } from './returners'

export type ReturnerTaskPhase = 'planning' | 'in_progress' | 'decision' | 'follow_up' | 'done'

export type ReturnerTaskState = {
  playerId: string
  phase: ReturnerTaskPhase
  tone: 'neutral' | 'warning' | 'danger' | 'success'
  isOpen: boolean
  label: string
}

export type DeriveReturnerTaskStateInput = {
  player: Player
  checkInEntry?: PlayerSessionEntry | null
  currentEntry?: ReturnerEntry | null
  contextual?: boolean
  hasPreviousCap?: boolean
}

function hasText(value: string) {
  return value.trim().length > 0
}

function task(
  playerId: string,
  phase: ReturnerTaskPhase,
  tone: ReturnerTaskState['tone'],
  isOpen: boolean,
  label: string,
): ReturnerTaskState {
  return { playerId, phase, tone, isOpen, label }
}

export function deriveReturnerTaskState({
  checkInEntry,
  contextual = false,
  currentEntry,
  hasPreviousCap = false,
  player,
}: DeriveReturnerTaskStateInput): ReturnerTaskState | null {
  const isCandidate =
    contextual ||
    hasPreviousCap ||
    player.returnerStatus === 'ja' ||
    checkInEntry?.returnerFlag === 'ja' ||
    Boolean(currentEntry && !currentEntry.deletedAt)

  if (!isCandidate) {
    return null
  }

  if (!currentEntry || currentEntry.deletedAt) {
    return task(player.id, 'planning', 'warning', true, 'Plan für heute festlegen')
  }

  const hasConcern =
    hasReturnerConcern(currentEntry.symptomsDuring) || hasReturnerConcern(currentEntry.nextMorning)
  const concernHandled = currentEntry.decision === 'reduzieren' || currentEntry.decision === 'rueckmelden'

  if (hasConcern && !concernHandled) {
    return task(player.id, 'follow_up', 'danger', true, 'Hinweis für Coaching-Entscheidung')
  }

  if (currentEntry.decision) {
    return task(player.id, 'done', 'success', false, 'Für heute dokumentiert')
  }

  const hasReaction = [currentEntry.completed, currentEntry.symptomsDuring, currentEntry.nextMorning].some(hasText)
  if (hasReaction) {
    return task(player.id, 'decision', 'warning', true, 'Coaching-Entscheidung dokumentieren')
  }

  const hasPlan = [
    currentEntry.currentStage,
    currentEntry.speedCap,
    currentEntry.codDecelCap,
    currentEntry.conditioningCap,
    currentEntry.contactCap,
    currentEntry.allowedToday,
    currentEntry.plannedCaps,
  ].some(hasText)

  if (hasPlan) {
    return task(player.id, 'in_progress', 'neutral', false, 'Im Training beobachten')
  }

  return task(player.id, 'planning', 'warning', true, 'Plan für heute festlegen')
}
