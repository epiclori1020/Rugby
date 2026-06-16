import type { CheckInEntryPatch, PlayerSessionEntry, ReturnerFlag } from './checkIn'
import type { SyncStatus } from './sync'

export type PublicCheckInSubmissionStatus = 'pending' | 'imported' | 'conflict' | 'superseded'

export type PublicCheckInLink = {
  id: string
  userId: string
  sessionDefinitionId: string
  sessionTitle: string
  sessionDate: string
  tokenHash: string
  expiresAt: string
  closedAt: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  clientUpdatedAt: string
  syncStatus: SyncStatus
  syncError: string | null
}

export type PublicCheckInLinkPlayer = {
  id: string
  userId: string
  linkId: string
  playerId: string | null
  displayName: string
  sortOrder: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  clientUpdatedAt: string
  syncStatus: SyncStatus
  syncError: string | null
}

export type PublicCheckInSubmission = {
  id: string
  userId: string
  linkId: string
  linkPlayerId: string
  playerId: string | null
  readiness: number | null
  lifeFlag: string
  painScore: number | null
  painLocation: string
  returnerFlag: ReturnerFlag
  playerNote: string
  status: PublicCheckInSubmissionStatus
  submittedAt: string
  importedAt: string | null
  conflictReason: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  clientUpdatedAt: string
  syncStatus: SyncStatus
  syncError: string | null
}

export type PublicSubmissionImportDecision =
  | { ok: true }
  | { ok: false; reason: string }

export function publicSubmissionPatch(submission: PublicCheckInSubmission): CheckInEntryPatch {
  return {
    present: true,
    readiness: submission.readiness,
    lifeFlag: submission.lifeFlag.trim(),
    painScore: submission.painScore,
    painLocation: submission.painLocation.trim(),
    returnerFlag: submission.returnerFlag,
    playerNote: submission.playerNote.trim(),
  }
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

function arrayBufferToHex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function createPublicCheckInToken() {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return bytesToBase64Url(bytes)
}

export async function hashPublicCheckInToken(token: string) {
  const encodedToken = new TextEncoder().encode(token)
  const digest = await crypto.subtle.digest('SHA-256', encodedToken)
  return arrayBufferToHex(digest)
}

export function shouldImportPublicSubmission(
  existingEntry: Pick<PlayerSessionEntry, 'coachEditedAt'> | null | undefined,
  submission: PublicCheckInSubmission,
): PublicSubmissionImportDecision {
  if (submission.status !== 'pending') {
    return { ok: false, reason: 'Spieler-Check-in wurde bereits verarbeitet.' }
  }

  if (existingEntry?.coachEditedAt) {
    return { ok: false, reason: 'Coach hat diesen Spieler bereits bearbeitet.' }
  }

  return { ok: true }
}

export function getLatestImportableSubmission(submissions: PublicCheckInSubmission[]) {
  return submissions
    .filter((submission) => submission.status === 'pending' && !submission.deletedAt)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0] ?? null
}
