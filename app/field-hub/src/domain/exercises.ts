import {
  exerciseDefinitions,
  type ExerciseDefinition,
  type ExerciseKey,
  type ExerciseUnit,
} from '../content/exerciseDefinitions'
import type { SyncStatus } from './sync'

export const exerciseVariants = ['A_plus', 'A', 'B', 'C', 'D', 'custom'] as const
export type ExerciseVariant = (typeof exerciseVariants)[number]

export const exerciseTechniqueQualities = ['good', 'ok', 'limited', 'poor', 'not_recorded'] as const
export type ExerciseTechniqueQuality = (typeof exerciseTechniqueQualities)[number]

export const exercisePainResponses = ['none', 'same', 'worse', 'better', 'unclear'] as const
export type ExercisePainResponse = (typeof exercisePainResponses)[number]

export type ExerciseResult = {
  id: string
  userId: string
  playerId: string | null
  sessionLogId: string | null
  exerciseKey: ExerciseKey
  variant: ExerciseVariant
  sets: number | null
  reps: string
  loadValue: number | null
  loadUnit: ExerciseUnit
  rpe: number | null
  rir: number | null
  techniqueQuality: ExerciseTechniqueQuality
  painResponse: ExercisePainResponse
  notes: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  clientUpdatedAt: string
  syncStatus: SyncStatus
  syncError: string | null
}

export type ExerciseResultPatch = {
  sourceResultId?: string
  exerciseKey: string
  variant?: string
  sets?: number | string | null
  reps?: string | null
  loadValue?: number | string | null
  loadUnit?: string
  rpe?: number | string | null
  rir?: number | string | null
  techniqueQuality?: string
  painResponse?: string
  notes?: string | null
}

export type ValidExerciseResultPatch = {
  exerciseKey: ExerciseKey
  variant: ExerciseVariant
  sets: number | null
  reps: string
  loadValue: number | null
  loadUnit: ExerciseUnit
  rpe: number | null
  rir: number | null
  techniqueQuality: ExerciseTechniqueQuality
  painResponse: ExercisePainResponse
  notes: string
}

const exerciseDefinitionByKey = new Map<string, ExerciseDefinition>(
  exerciseDefinitions.map((definition) => [definition.key, definition]),
)

const exerciseUnits = new Set<ExerciseUnit>(['kg', 'bodyweight', 'm', 's', 'reps', 'cm'])

export function isKnownExerciseKey(value: string): value is ExerciseKey {
  return exerciseDefinitionByKey.has(value)
}

export function getExerciseDefinition(exerciseKey: string): ExerciseDefinition {
  const definition = exerciseDefinitionByKey.get(exerciseKey)
  if (!definition) {
    throw new Error(`Unbekannte Uebung: ${exerciseKey}`)
  }

  return definition
}

export function parseOptionalExerciseNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined) {
    return null
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  const trimmed = value.trim().replace(',', '.')
  if (!trimmed) {
    return null
  }

  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

function isExerciseVariant(value: string): value is ExerciseVariant {
  return exerciseVariants.includes(value as ExerciseVariant)
}

function isTechniqueQuality(value: string): value is ExerciseTechniqueQuality {
  return exerciseTechniqueQualities.includes(value as ExerciseTechniqueQuality)
}

function isPainResponse(value: string): value is ExercisePainResponse {
  return exercisePainResponses.includes(value as ExercisePainResponse)
}

function normalizeSets(value: number | string | null | undefined) {
  const parsed = parseOptionalExerciseNumber(value)
  if (parsed === null) {
    return null
  }

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 20) {
    throw new Error('Sets muss leer oder eine ganze Zahl zwischen 1 und 20 sein.')
  }

  return parsed
}

function normalizeOptionalRange(
  value: number | string | null | undefined,
  label: 'RPE' | 'RIR',
) {
  const parsed = parseOptionalExerciseNumber(value)
  if (parsed === null) {
    return null
  }

  if (parsed < 0 || parsed > 10) {
    throw new Error(`${label} muss leer oder zwischen 0 und 10 sein.`)
  }

  return parsed
}

export function validateExerciseResultPatch(patch: ExerciseResultPatch): ValidExerciseResultPatch {
  if (!isKnownExerciseKey(patch.exerciseKey)) {
    throw new Error('Unbekannte Uebung.')
  }

  const exerciseKey = patch.exerciseKey
  const definition = getExerciseDefinition(exerciseKey)
  const variant = patch.variant ?? 'custom'
  if (!isExerciseVariant(variant)) {
    throw new Error('Variante ist ungueltig.')
  }

  const loadUnit = patch.loadUnit ?? definition.defaultUnit
  if (!exerciseUnits.has(loadUnit as ExerciseUnit)) {
    throw new Error('Load-Einheit ist ungueltig.')
  }

  const loadValue = parseOptionalExerciseNumber(patch.loadValue)
  if (loadValue !== null && loadValue < 0) {
    throw new Error('Last muss leer oder groesser gleich 0 sein.')
  }

  const techniqueQuality = patch.techniqueQuality ?? 'not_recorded'
  if (!isTechniqueQuality(techniqueQuality)) {
    throw new Error('Technikqualitaet ist ungueltig.')
  }

  const painResponse = patch.painResponse ?? 'unclear'
  if (!isPainResponse(painResponse)) {
    throw new Error('Pain Response ist ungueltig.')
  }

  return {
    exerciseKey,
    variant,
    sets: normalizeSets(patch.sets),
    reps: patch.reps?.trim() ?? '',
    loadValue,
    loadUnit: loadUnit as ExerciseUnit,
    rpe: normalizeOptionalRange(patch.rpe, 'RPE'),
    rir: normalizeOptionalRange(patch.rir, 'RIR'),
    techniqueQuality,
    painResponse,
    notes: patch.notes?.trim() ?? '',
  }
}

export function hasExerciseResultContent(result: ExerciseResult | ValidExerciseResultPatch) {
  if ('deletedAt' in result && result.deletedAt !== null) {
    return false
  }

  return (
    result.sets !== null ||
    result.reps.trim().length > 0 ||
    result.loadValue !== null ||
    result.rpe !== null ||
    result.rir !== null ||
    result.techniqueQuality !== 'not_recorded' ||
    result.painResponse !== 'unclear' ||
    result.notes.trim().length > 0
  )
}

export function formatExerciseResult(
  result: Pick<ExerciseResult, 'exerciseKey' | 'sets' | 'reps' | 'loadValue' | 'loadUnit' | 'rpe' | 'rir'>,
) {
  const definition = getExerciseDefinition(result.exerciseKey)
  const parts = [
    result.sets !== null && result.reps ? `${result.sets}x${result.reps}` : result.reps || null,
    result.loadValue !== null ? `${result.loadValue} ${result.loadUnit}` : null,
    result.rpe !== null ? `RPE ${result.rpe}` : null,
    result.rir !== null ? `RIR ${result.rir}` : null,
  ].filter(Boolean)

  return `${definition.name}${parts.length > 0 ? `: ${parts.join(', ')}` : ''}`
}
