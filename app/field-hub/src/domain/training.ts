import type { CheckInEntryPatch, CheckInLimit, PlayerSessionEntry, TrainingVariant } from './checkIn'

export type TrainingQuickAction =
  | 'variant_c'
  | 'variant_d'
  | 'kein_sprint'
  | 'kein_conditioning'
  | 'kein_schweres_heben'
  | 'physio_medical'

export type VariantCard = {
  variant: TrainingVariant
  label: string
  summary: string
  decision: string
}

export type ExerciseMapping = {
  pattern: string
  defaultOption: string
  alternative: string
  yellowReturner: string
  coachFocus: string
}

const quickActionLimits: Record<TrainingQuickAction, CheckInLimit[]> = {
  variant_c: [],
  variant_d: ['kein_sprint', 'kein_cond', 'kein_schweres_heben', 'klaeren'],
  kein_sprint: ['kein_sprint'],
  kein_conditioning: ['kein_cond'],
  kein_schweres_heben: ['kein_schweres_heben'],
  physio_medical: ['physio', 'klaeren'],
}

function addLimits(existingLimits: CheckInLimit[], limitsToAdd: CheckInLimit[]) {
  return [...new Set([...existingLimits, ...limitsToAdd])]
}

export function applyTrainingQuickAction(
  entry: Pick<PlayerSessionEntry, 'limits'>,
  action: TrainingQuickAction,
): CheckInEntryPatch {
  const limits = addLimits(entry.limits, quickActionLimits[action])

  if (action === 'variant_c') {
    return { trainingVariant: 'C' }
  }

  if (action === 'variant_d') {
    return { trainingVariant: 'D', limits }
  }

  return { limits }
}
