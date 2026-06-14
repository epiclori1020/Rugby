import {
  applyAutoTrafficLight,
  applyManualTrafficLight,
  applySuggestedTrafficLight,
  deriveLimits,
  type CheckInDraft,
  type CheckInEntryPatch,
  type PlayerSessionEntry,
  type TrafficLight,
} from '../domain/checkIn'
import type { ReturnerEntry, ReturnerEntryPatch } from '../domain/returners'

type IdentifiedRecord = {
  id: string
}

function nowIso() {
  return new Date().toISOString()
}

function normalizeText(value: string | undefined, fallback: string) {
  return value !== undefined ? value.trim() : fallback
}

export function mergeRecordIntoList<T extends IdentifiedRecord>(records: T[], record: T) {
  const existingIndex = records.findIndex((candidate) => candidate.id === record.id)
  if (existingIndex === -1) {
    return [...records, record]
  }

  const nextRecords = [...records]
  nextRecords[existingIndex] = record
  return nextRecords
}

export function applyOptimisticCheckInPatch(
  entry: PlayerSessionEntry,
  patch: CheckInEntryPatch,
  manualTrafficLight?: TrafficLight | 'auto',
): PlayerSessionEntry {
  const timestamp = nowIso()
  const patchedDraft: CheckInDraft = {
    ...entry,
    ...patch,
    lifeFlag: patch.lifeFlag !== undefined ? patch.lifeFlag.trim() : entry.lifeFlag,
    painLocation: patch.painLocation !== undefined ? patch.painLocation.trim() : entry.painLocation,
    observation: patch.observation !== undefined ? patch.observation.trim() : entry.observation,
  }
  const draftWithLimits = {
    ...patchedDraft,
    limits: deriveLimits(patchedDraft),
  }
  const suggestedDraft = applySuggestedTrafficLight(draftWithLimits)
  const finalDraft =
    manualTrafficLight === 'auto'
      ? applyAutoTrafficLight(draftWithLimits)
      : manualTrafficLight
        ? applyManualTrafficLight(suggestedDraft, manualTrafficLight)
        : suggestedDraft

  return {
    ...entry,
    ...finalDraft,
    updatedAt: timestamp,
    clientUpdatedAt: timestamp,
    syncStatus: 'pending',
    syncError: null,
  }
}

export function applyOptimisticReturnerPatch(entry: ReturnerEntry, patch: ReturnerEntryPatch): ReturnerEntry {
  const timestamp = nowIso()

  return {
    ...entry,
    medicalContactNote: normalizeText(patch.medicalContactNote, entry.medicalContactNote),
    currentStage: normalizeText(patch.currentStage, entry.currentStage),
    speedCap: normalizeText(patch.speedCap, entry.speedCap),
    codDecelCap: normalizeText(patch.codDecelCap, entry.codDecelCap),
    conditioningCap: normalizeText(patch.conditioningCap, entry.conditioningCap),
    contactCap: normalizeText(patch.contactCap, entry.contactCap),
    allowedToday: normalizeText(patch.allowedToday, entry.allowedToday),
    plannedCaps: normalizeText(patch.plannedCaps, entry.plannedCaps),
    completed: normalizeText(patch.completed, entry.completed),
    symptomsDuring: normalizeText(patch.symptomsDuring, entry.symptomsDuring),
    nextMorning: normalizeText(patch.nextMorning, entry.nextMorning),
    decision: patch.decision !== undefined ? patch.decision : entry.decision,
    updatedAt: timestamp,
    clientUpdatedAt: timestamp,
    syncStatus: 'pending',
    syncError: null,
  }
}
