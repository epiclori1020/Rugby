import type { SessionDefinition } from '../content/types'
import type { Player } from '../domain/players'
import {
  createPublicCheckInToken,
  getLatestImportableSubmission,
  hashPublicCheckInToken,
  publicSubmissionPatch,
  shouldImportPublicSubmission,
  type PublicCheckInLink,
  type PublicCheckInLinkPlayer,
  type PublicCheckInSubmission,
} from '../domain/publicCheckIn'
import { ensureSessionLog, savePublicCheckInEntry } from './checkInRepository'
import { localDb } from './localDb'
import { createPublicCheckInClient, supabase } from './supabaseClient'

function nowIso() {
  return new Date().toISOString()
}

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function addHoursIso(timestamp: string, hours: number) {
  return new Date(new Date(timestamp).getTime() + hours * 60 * 60 * 1000).toISOString()
}

export function buildPublicCheckInUrl(token: string) {
  const baseUrl =
    typeof window === 'undefined'
      ? ''
      : `${window.location.origin}${window.location.pathname}`
  return `${baseUrl}#/checkin/${token}`
}

type PublicCheckInLinkRow = {
  id: string
  user_id: string
  session_definition_id: string
  session_title: string
  session_date: string
  token_hash: string
  expires_at: string
  closed_at: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  client_updated_at: string
}

type PublicCheckInLinkPlayerRow = {
  id: string
  user_id: string
  link_id: string
  player_id: string | null
  display_name: string
  sort_order: number
  created_at: string
  updated_at: string
  deleted_at: string | null
  client_updated_at: string
}

type PublicCheckInSubmissionRow = {
  id: string
  user_id: string
  link_id: string
  link_player_id: string
  player_id: string | null
  readiness: number | null
  life_flag: string
  pain_score: number | null
  pain_location: string
  returner_flag: PublicCheckInSubmission['returnerFlag']
  player_note: string
  status: PublicCheckInSubmission['status']
  submitted_at: string
  imported_at: string | null
  conflict_reason: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  client_updated_at: string
}

function linkFromRow(row: PublicCheckInLinkRow): PublicCheckInLink {
  return {
    id: row.id,
    userId: row.user_id,
    sessionDefinitionId: row.session_definition_id,
    sessionTitle: row.session_title,
    sessionDate: row.session_date,
    tokenHash: row.token_hash,
    expiresAt: row.expires_at,
    closedAt: row.closed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    clientUpdatedAt: row.client_updated_at,
    syncStatus: 'synced',
    syncError: null,
  }
}

function rowFromLink(link: PublicCheckInLink): PublicCheckInLinkRow {
  return {
    id: link.id,
    user_id: link.userId,
    session_definition_id: link.sessionDefinitionId,
    session_title: link.sessionTitle,
    session_date: link.sessionDate,
    token_hash: link.tokenHash,
    expires_at: link.expiresAt,
    closed_at: link.closedAt,
    created_at: link.createdAt,
    updated_at: link.updatedAt,
    deleted_at: link.deletedAt,
    client_updated_at: link.clientUpdatedAt,
  }
}

function linkPlayerFromRow(row: PublicCheckInLinkPlayerRow): PublicCheckInLinkPlayer {
  return {
    id: row.id,
    userId: row.user_id,
    linkId: row.link_id,
    playerId: row.player_id,
    displayName: row.display_name,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    clientUpdatedAt: row.client_updated_at,
    syncStatus: 'synced',
    syncError: null,
  }
}

function rowFromLinkPlayer(linkPlayer: PublicCheckInLinkPlayer): PublicCheckInLinkPlayerRow {
  return {
    id: linkPlayer.id,
    user_id: linkPlayer.userId,
    link_id: linkPlayer.linkId,
    player_id: linkPlayer.playerId,
    display_name: linkPlayer.displayName,
    sort_order: linkPlayer.sortOrder,
    created_at: linkPlayer.createdAt,
    updated_at: linkPlayer.updatedAt,
    deleted_at: linkPlayer.deletedAt,
    client_updated_at: linkPlayer.clientUpdatedAt,
  }
}

function submissionFromRow(row: PublicCheckInSubmissionRow): PublicCheckInSubmission {
  return {
    id: row.id,
    userId: row.user_id,
    linkId: row.link_id,
    linkPlayerId: row.link_player_id,
    playerId: row.player_id,
    readiness: row.readiness,
    lifeFlag: row.life_flag,
    painScore: row.pain_score,
    painLocation: row.pain_location,
    returnerFlag: row.returner_flag,
    playerNote: row.player_note,
    status: row.status,
    submittedAt: row.submitted_at,
    importedAt: row.imported_at,
    conflictReason: row.conflict_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    clientUpdatedAt: row.client_updated_at,
    syncStatus: 'synced',
    syncError: null,
  }
}

export type PublicCheckInImportResult = {
  imported: number
  conflicts: number
  superseded: number
}

async function markSubmission(
  submission: PublicCheckInSubmission,
  status: PublicCheckInSubmission['status'],
  patch: Partial<Pick<PublicCheckInSubmission, 'importedAt' | 'conflictReason'>> = {},
) {
  const timestamp = nowIso()
  const updatedSubmission: PublicCheckInSubmission = {
    ...submission,
    ...patch,
    status,
    updatedAt: timestamp,
    clientUpdatedAt: timestamp,
  }
  await localDb.publicCheckInSubmissions.put(updatedSubmission)
  if (supabase) {
    const { error } = await supabase
      .from('public_checkin_submissions')
      .update({
        status: updatedSubmission.status,
        imported_at: updatedSubmission.importedAt,
        conflict_reason: updatedSubmission.conflictReason,
        updated_at: updatedSubmission.updatedAt,
        client_updated_at: updatedSubmission.clientUpdatedAt,
      })
      .eq('id', updatedSubmission.id)
    if (error) {
      await localDb.publicCheckInSubmissions.put({
        ...updatedSubmission,
        syncStatus: 'error',
        syncError: error.message,
      })
    }
  }
  return updatedSubmission
}

function groupSubmissionsByPlayer(submissions: PublicCheckInSubmission[]) {
  const grouped = new Map<string, PublicCheckInSubmission[]>()

  for (const submission of submissions) {
    const key = submission.playerId ?? submission.linkPlayerId
    grouped.set(key, [...(grouped.get(key) ?? []), submission])
  }

  return grouped
}

export async function importPublicCheckInSubmissions(
  userId: string,
  sessionDefinition: SessionDefinition,
): Promise<PublicCheckInImportResult> {
  const pendingSubmissions = await localDb.publicCheckInSubmissions
    .where('[userId+status]')
    .equals([userId, 'pending'])
    .toArray()
  const groupedSubmissions = groupSubmissionsByPlayer(pendingSubmissions)
  const sessionLog = await ensureSessionLog(userId, sessionDefinition)
  let imported = 0
  let conflicts = 0
  let superseded = 0

  for (const submissions of groupedSubmissions.values()) {
    const latestSubmission = getLatestImportableSubmission(submissions)
    if (!latestSubmission?.playerId) {
      for (const submission of submissions) {
        await markSubmission(submission, 'conflict', { conflictReason: 'Spieler konnte nicht zugeordnet werden.' })
        conflicts += 1
      }
      continue
    }

    const player = await localDb.players.get(latestSubmission.playerId)
    if (!player || player.userId !== userId || !player.active) {
      for (const submission of submissions) {
        await markSubmission(submission, 'conflict', { conflictReason: 'Spieler ist nicht aktiv oder nicht vorhanden.' })
        conflicts += 1
      }
      continue
    }

    const existingEntry = await localDb.playerSessionEntries
      .where('userId')
      .equals(userId)
      .and((entry) => entry.sessionLogId === sessionLog.id && entry.playerId === player.id && !entry.deletedAt)
      .first()
    const decision = shouldImportPublicSubmission(existingEntry, latestSubmission)

    if (!decision.ok) {
      for (const submission of submissions) {
        await markSubmission(submission, 'conflict', { conflictReason: decision.reason })
        conflicts += 1
      }
      continue
    }

    for (const submission of submissions) {
      if (submission.id !== latestSubmission.id) {
        await markSubmission(submission, 'superseded')
        superseded += 1
      }
    }

    await savePublicCheckInEntry(
      userId,
      sessionLog.id,
      player as Player,
      publicSubmissionPatch(latestSubmission),
      latestSubmission.submittedAt,
    )
    await markSubmission(latestSubmission, 'imported', { importedAt: nowIso(), conflictReason: null })
    imported += 1
  }

  return { imported, conflicts, superseded }
}

export async function listLocalPublicCheckInLinks(userId: string, sessionDefinitionId: string) {
  return localDb.publicCheckInLinks
    .where('[userId+sessionDefinitionId]')
    .equals([userId, sessionDefinitionId])
    .and((link) => !link.deletedAt)
    .toArray()
}

export async function listLocalPublicCheckInSubmissions(userId: string, linkId: string) {
  return localDb.publicCheckInSubmissions
    .where('[userId+linkId]')
    .equals([userId, linkId])
    .and((submission) => !submission.deletedAt)
    .toArray()
}

export type PublicCheckInLinkBundle = {
  link: PublicCheckInLink
  linkPlayers: PublicCheckInLinkPlayer[]
}

export type CreatedPublicCheckInLink = PublicCheckInLinkBundle & {
  rawToken: string
  url: string
}

async function closeOpenPublicCheckInLinksForSession(
  userId: string,
  sessionDefinitionId: string,
  timestamp: string,
) {
  if (!supabase) {
    return
  }

  const { error } = await supabase
    .from('public_checkin_links')
    .update({ closed_at: timestamp, updated_at: timestamp, client_updated_at: timestamp })
    .eq('user_id', userId)
    .eq('session_definition_id', sessionDefinitionId)
    .is('closed_at', null)
    .is('deleted_at', null)
  if (error) {
    throw new Error(error.message)
  }

  const openLocalLinks = await localDb.publicCheckInLinks
    .where('[userId+sessionDefinitionId]')
    .equals([userId, sessionDefinitionId])
    .and((link) => !link.closedAt && !link.deletedAt)
    .toArray()
  if (openLocalLinks.length > 0) {
    await localDb.publicCheckInLinks.bulkPut(
      openLocalLinks.map((link) => ({
        ...link,
        closedAt: timestamp,
        updatedAt: timestamp,
        clientUpdatedAt: timestamp,
      })),
    )
  }
}

export async function createPublicCheckInLinkBundle(
  userId: string,
  sessionDefinition: SessionDefinition,
  players: Player[],
): Promise<CreatedPublicCheckInLink> {
  if (!supabase) {
    throw new Error('Supabase ist noch nicht konfiguriert.')
  }

  const timestamp = nowIso()
  const rawToken = createPublicCheckInToken()
  const tokenHash = await hashPublicCheckInToken(rawToken)
  await closeOpenPublicCheckInLinksForSession(userId, sessionDefinition.id, timestamp)
  const activePlayers = players
    .filter((player) => player.active && !player.deletedAt)
    .sort((a, b) => a.name.localeCompare(b.name, 'de-AT'))
  const link: PublicCheckInLink = {
    id: createId(),
    userId,
    sessionDefinitionId: sessionDefinition.id,
    sessionTitle: sessionDefinition.title,
    sessionDate: sessionDefinition.date,
    tokenHash,
    expiresAt: addHoursIso(timestamp, 8),
    closedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
    clientUpdatedAt: timestamp,
    syncStatus: 'synced',
    syncError: null,
  }
  const linkPlayers: PublicCheckInLinkPlayer[] = activePlayers.map((player, index) => ({
    id: createId(),
    userId,
    linkId: link.id,
    playerId: player.id,
    displayName: player.name,
    sortOrder: index,
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
    clientUpdatedAt: timestamp,
    syncStatus: 'synced',
    syncError: null,
  }))

  const { error: linkError } = await supabase.from('public_checkin_links').insert(rowFromLink(link))
  if (linkError) {
    throw new Error(linkError.message)
  }

  if (linkPlayers.length > 0) {
    const { error: linkPlayersError } = await supabase
      .from('public_checkin_link_players')
      .insert(linkPlayers.map(rowFromLinkPlayer))
    if (linkPlayersError) {
      throw new Error(linkPlayersError.message)
    }
  }

  await localDb.publicCheckInLinks.put(link)
  await localDb.publicCheckInLinkPlayers.bulkPut(linkPlayers)

  return {
    link,
    linkPlayers,
    rawToken,
    url: buildPublicCheckInUrl(rawToken),
  }
}

export async function closePublicCheckInLink(userId: string, linkId: string) {
  if (!supabase) {
    throw new Error('Supabase ist noch nicht konfiguriert.')
  }

  const timestamp = nowIso()
  const { error } = await supabase
    .from('public_checkin_links')
    .update({ closed_at: timestamp, updated_at: timestamp, client_updated_at: timestamp })
    .eq('id', linkId)
    .eq('user_id', userId)
  if (error) {
    throw new Error(error.message)
  }

  const link = await localDb.publicCheckInLinks.get(linkId)
  if (link) {
    await localDb.publicCheckInLinks.put({
      ...link,
      closedAt: timestamp,
      updatedAt: timestamp,
      clientUpdatedAt: timestamp,
    })
  }
}

export type PublicCheckInFormData = {
  link: Pick<PublicCheckInLink, 'id' | 'sessionDefinitionId' | 'sessionTitle' | 'sessionDate' | 'expiresAt' | 'closedAt'>
  linkPlayers: Array<Pick<PublicCheckInLinkPlayer, 'id' | 'linkId' | 'displayName' | 'sortOrder'>>
}

export async function loadPublicCheckInForm(token: string): Promise<PublicCheckInFormData> {
  const publicClient = createPublicCheckInClient(token)
  if (!publicClient) {
    throw new Error('Supabase ist noch nicht konfiguriert.')
  }

  const { data: linkRows, error: linkError } = await publicClient
    .from('public_checkin_links')
    .select('id,session_definition_id,session_title,session_date,expires_at,closed_at')
    .limit(1)
  if (linkError) {
    throw new Error(linkError.message)
  }

  const linkRow = linkRows?.[0]
  if (!linkRow) {
    throw new Error('Check-in-Link ist ungueltig oder abgelaufen.')
  }

  const { data: playerRows, error: playerError } = await publicClient
    .from('public_checkin_link_players')
    .select('id,link_id,display_name,sort_order')
    .eq('link_id', linkRow.id)
    .order('sort_order')
  if (playerError) {
    throw new Error(playerError.message)
  }

  return {
    link: {
      id: linkRow.id,
      sessionDefinitionId: linkRow.session_definition_id,
      sessionTitle: linkRow.session_title,
      sessionDate: linkRow.session_date,
      expiresAt: linkRow.expires_at,
      closedAt: linkRow.closed_at,
    },
    linkPlayers: (playerRows ?? []).map((row) => ({
      id: row.id,
      linkId: row.link_id,
      displayName: row.display_name,
      sortOrder: row.sort_order,
    })),
  }
}

export type PublicSubmissionInput = {
  linkId: string
  linkPlayerId: string
  readiness: number | null
  lifeFlag: string
  painScore: number | null
  painLocation: string
  returnerFlag: PublicCheckInSubmission['returnerFlag']
  playerNote: string
}

export async function submitPublicCheckIn(token: string, input: PublicSubmissionInput) {
  const publicClient = createPublicCheckInClient(token)
  if (!publicClient) {
    throw new Error('Supabase ist noch nicht konfiguriert.')
  }

  const timestamp = nowIso()
  const { error } = await publicClient.from('public_checkin_submissions').insert({
    id: createId(),
    link_id: input.linkId,
    link_player_id: input.linkPlayerId,
    readiness: input.readiness,
    life_flag: input.lifeFlag.trim(),
    pain_score: input.painScore,
    pain_location: input.painLocation.trim(),
    returner_flag: input.returnerFlag,
    player_note: input.playerNote.trim(),
    submitted_at: timestamp,
    client_updated_at: timestamp,
  })
  if (error) {
    throw new Error(error.message)
  }
}

export type RefreshRemotePublicCheckInsOptions = {
  sessionDefinitionId?: string
}

export async function refreshRemotePublicCheckIns(
  userId: string,
  options: RefreshRemotePublicCheckInsOptions = {},
) {
  if (!supabase) {
    throw new Error('Supabase ist noch nicht konfiguriert.')
  }

  let linkQuery = supabase
    .from('public_checkin_links')
    .select('id,user_id,session_definition_id,session_title,session_date,token_hash,expires_at,closed_at,created_at,updated_at,deleted_at,client_updated_at')
    .eq('user_id', userId)
  if (options.sessionDefinitionId) {
    linkQuery = linkQuery.eq('session_definition_id', options.sessionDefinitionId)
  }
  const { data: linkRows, error: linkError } = await linkQuery.is('deleted_at', null)
  if (linkError) {
    throw new Error(linkError.message)
  }

  const remoteLinks = (linkRows ?? []) as PublicCheckInLinkRow[]
  const localLinks = await localDb.publicCheckInLinks.bulkGet(remoteLinks.map((row) => row.id))
  const linksToPut = remoteLinks
    .map((row, index) => ({ local: localLinks[index], remote: linkFromRow(row), row }))
    .filter(({ local, row }) => {
      if (local && local.syncStatus !== 'synced') {
        return false
      }

      return !local || row.client_updated_at >= local.clientUpdatedAt
    })
    .map(({ remote }) => remote)
  await localDb.publicCheckInLinks.bulkPut(linksToPut)

  const linkIds = remoteLinks.map((row) => row.id)
  if (linkIds.length === 0) {
    return
  }

  const { data: playerRows, error: playerError } = await supabase
    .from('public_checkin_link_players')
    .select('id,user_id,link_id,player_id,display_name,sort_order,created_at,updated_at,deleted_at,client_updated_at')
    .eq('user_id', userId)
    .in('link_id', linkIds)
    .is('deleted_at', null)
  if (playerError) {
    throw new Error(playerError.message)
  }

  const remoteLinkPlayers = (playerRows ?? []) as PublicCheckInLinkPlayerRow[]
  const localLinkPlayers = await localDb.publicCheckInLinkPlayers.bulkGet(remoteLinkPlayers.map((row) => row.id))
  const linkPlayersToPut = remoteLinkPlayers
    .map((row, index) => ({ local: localLinkPlayers[index], remote: linkPlayerFromRow(row), row }))
    .filter(({ local, row }) => {
      if (local && local.syncStatus !== 'synced') {
        return false
      }

      return !local || row.client_updated_at >= local.clientUpdatedAt
    })
    .map(({ remote }) => remote)
  await localDb.publicCheckInLinkPlayers.bulkPut(linkPlayersToPut)

  const { data: submissionRows, error: submissionError } = await supabase
    .from('public_checkin_submissions')
    .select('id,user_id,link_id,link_player_id,player_id,readiness,life_flag,pain_score,pain_location,returner_flag,player_note,status,submitted_at,imported_at,conflict_reason,created_at,updated_at,deleted_at,client_updated_at')
    .eq('user_id', userId)
    .in('link_id', linkIds)
    .is('deleted_at', null)
  if (submissionError) {
    throw new Error(submissionError.message)
  }

  const remoteSubmissions = (submissionRows ?? []) as PublicCheckInSubmissionRow[]
  const localSubmissions = await localDb.publicCheckInSubmissions.bulkGet(remoteSubmissions.map((row) => row.id))
  const submissionsToPut = remoteSubmissions
    .map((row, index) => ({ local: localSubmissions[index], remote: submissionFromRow(row), row }))
    .filter(({ local, row }) => {
      if (local && local.syncStatus !== 'synced') {
        return false
      }

      return !local || row.client_updated_at >= local.clientUpdatedAt
    })
    .map(({ remote }) => remote)
  await localDb.publicCheckInSubmissions.bulkPut(submissionsToPut)
}
