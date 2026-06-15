import type {
  ConsentStatus,
  PhotoConsentStatus,
  Player,
  PlayerCluster,
  PlayerFormValues,
  ReturnerStatus,
} from '../domain/players'
import type { PlayerSyncOverview, SyncStatus } from '../domain/sync'
import { defaultPlayerSyncOverview } from '../domain/sync'
import { getSyncMeta, localDb, setSyncMeta } from './localDb'
import { markSyncedIfUnchanged, markSyncErrorIfUnchanged } from './pendingWriteSync'
import { measureInteraction } from './performanceTrace'
import { supabase } from './supabaseClient'

const PLAYER_PHOTOS_BUCKET = 'player-photos'
const pendingPlayerSyncs = new Map<string, Promise<PlayerSyncOverview>>()
const playerPhotoUrlCache = new Map<string, string>()

type PlayerRow = {
  id: string
  user_id: string
  name: string
  position: string
  cluster: PlayerCluster
  active: boolean
  consent_status: ConsentStatus
  photo_consent_status: PhotoConsentStatus
  photo_path: string | null
  photo_updated_at: string | null
  returner_status: ReturnerStatus
  notes: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  client_updated_at: string
}

type PhotoCleanupResult = {
  removed: boolean
  errorMessage: string | null
}

type ResizedPhoto = {
  blob: Blob
  extension: string
  contentType: string
  sourceBytes: number
  outputBytes: number
  width: number
  height: number
}

function nowIso() {
  return new Date().toISOString()
}

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function normalizePlayerValues(values: PlayerFormValues) {
  return {
    name: values.name.trim(),
    position: values.position.trim() || 'offen',
    cluster: values.cluster,
    active: values.active,
    consentStatus: values.consentStatus,
    photoConsentStatus: values.photoConsentStatus,
    returnerStatus: values.returnerStatus,
    notes: values.notes.trim(),
  }
}

function playerFromRow(row: PlayerRow, syncStatus: SyncStatus = 'synced', syncError: string | null = null): Player {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    position: row.position,
    cluster: row.cluster,
    active: row.active,
    consentStatus: row.consent_status,
    photoConsentStatus: row.photo_consent_status,
    photoPath: row.photo_path,
    photoUpdatedAt: row.photo_updated_at,
    returnerStatus: row.returner_status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    clientUpdatedAt: row.client_updated_at,
    syncStatus,
    syncError,
  }
}

function rowFromPlayer(player: Player): PlayerRow {
  return {
    id: player.id,
    user_id: player.userId,
    name: player.name,
    position: player.position,
    cluster: player.cluster,
    active: player.active,
    consent_status: player.consentStatus,
    photo_consent_status: player.photoConsentStatus,
    photo_path: player.photoPath,
    photo_updated_at: player.photoUpdatedAt,
    returner_status: player.returnerStatus,
    notes: player.notes,
    created_at: player.createdAt,
    updated_at: player.updatedAt,
    deleted_at: player.deletedAt,
    client_updated_at: player.clientUpdatedAt,
  }
}

async function queuePlayerWrite(player: Player, metadata?: Record<string, string | null>) {
  await localDb.pendingWrites.where('recordId').equals(player.id).delete()
  await localDb.pendingWrites.add({
    table: 'players',
    operation: 'upsert',
    recordId: player.id,
    userId: player.userId,
    createdAt: nowIso(),
    metadata,
  })
}

async function queuePlayerDelete(player: Player, metadata?: Record<string, string | null>) {
  await localDb.pendingWrites.where('recordId').equals(player.id).delete()
  await localDb.pendingWrites.add({
    table: 'players',
    operation: 'delete',
    recordId: player.id,
    userId: player.userId,
    createdAt: nowIso(),
    metadata,
  })
}

function isOffline() {
  return typeof navigator !== 'undefined' && !navigator.onLine
}

function needsStoredPhotoCleanup(player: Player) {
  return Boolean(player.photoPath && (player.deletedAt || player.photoConsentStatus !== 'allowed'))
}

async function removeStoredPlayerPhoto(photoPath: string | null): Promise<PhotoCleanupResult> {
  if (!photoPath || !supabase) {
    return { removed: true, errorMessage: null }
  }

  if (isOffline()) {
    return { removed: false, errorMessage: null }
  }

  try {
    const { error } = await supabase.storage.from(PLAYER_PHOTOS_BUCKET).remove([photoPath])
    if (error) {
      return { removed: false, errorMessage: error.message }
    }
  } catch (caughtError) {
    return {
      removed: false,
      errorMessage: caughtError instanceof Error ? caughtError.message : 'Profilfoto konnte nicht geloescht werden.',
    }
  }

  return { removed: true, errorMessage: null }
}

export async function listLocalPlayers(userId: string) {
  const players = await localDb.players.where('userId').equals(userId).toArray()
  return players
    .filter((player) => !player.deletedAt)
    .sort((a, b) => a.name.localeCompare(b.name, 'de-AT'))
}

export async function getPlayerSyncOverview(userId: string): Promise<PlayerSyncOverview> {
  const pendingCount = await localDb.pendingWrites
    .where('userId')
    .equals(userId)
    .and((write) => write.table === 'players')
    .count()
  const erroredCount = await localDb.players
    .where('userId')
    .equals(userId)
    .and((player) => player.syncStatus === 'error')
    .count()
  const lastSuccessfulSyncAt = await getSyncMeta(`players:lastSuccessfulSyncAt:${userId}`)

  return {
    ...defaultPlayerSyncOverview,
    isOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
    status: erroredCount > 0 ? 'error' : pendingCount > 0 ? 'pending' : 'synced',
    pendingCount,
    lastSuccessfulSyncAt,
    errorMessage: erroredCount > 0 ? 'Mindestens ein Spieler konnte nicht synchronisiert werden.' : null,
  }
}

export async function savePlayer(userId: string, values: PlayerFormValues, existing?: Player) {
  const normalized = normalizePlayerValues(values)
  if (!normalized.name) {
    throw new Error('Name ist erforderlich.')
  }

  const photoAllowed = normalized.photoConsentStatus === 'allowed'
  const timestamp = nowIso()
  const photoPath = photoAllowed ? (existing?.photoPath ?? null) : null
  const photoUpdatedAt = photoAllowed ? (existing?.photoUpdatedAt ?? null) : null
  const removePhotoPath = existing?.photoPath && !photoAllowed ? existing.photoPath : null

  const player: Player = {
    id: existing?.id ?? createId(),
    userId,
    name: normalized.name,
    position: normalized.position,
    cluster: normalized.cluster,
    active: normalized.active,
    consentStatus: normalized.consentStatus,
    photoConsentStatus: normalized.photoConsentStatus,
    photoPath,
    photoUpdatedAt,
    returnerStatus: normalized.returnerStatus,
    notes: normalized.notes,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    deletedAt: existing?.deletedAt ?? null,
    clientUpdatedAt: timestamp,
    syncStatus: 'pending',
    syncError: null,
  }

  await localDb.players.put(player)
  await queuePlayerWrite(player, removePhotoPath ? { removePhotoPath } : undefined)

  return player
}

export async function deactivatePlayer(player: Player) {
  const timestamp = nowIso()
  const updatedPlayer: Player = {
    ...player,
    active: false,
    updatedAt: timestamp,
    clientUpdatedAt: timestamp,
    syncStatus: 'pending',
    syncError: null,
  }

  await localDb.players.put(updatedPlayer)
  await queuePlayerWrite(updatedPlayer)

  return updatedPlayer
}

export async function deletePlayer(player: Player) {
  const timestamp = nowIso()
  const deletedPlayer: Player = {
    ...player,
    active: false,
    updatedAt: timestamp,
    deletedAt: timestamp,
    clientUpdatedAt: timestamp,
    syncStatus: 'pending',
    syncError: null,
  }

  await Promise.all([
    localDb.players.delete(player.id),
    localDb.pendingPhotoUploads.where('playerId').equals(player.id).delete(),
    localDb.photoCache.where('photoPath').equals(player.photoPath ?? '').delete(),
  ])
  await queuePlayerDelete(deletedPlayer, player.photoPath ? { photoPath: player.photoPath } : undefined)

  return deletedPlayer
}

async function uploadQueuedPlayerPhoto(player: Player) {
  if (!player.photoPath || !supabase) {
    return
  }
  const supabaseClient = supabase

  const pendingPhotoUpload = await localDb.pendingPhotoUploads.get(player.photoPath)
  if (!pendingPhotoUpload) {
    return
  }

  const { error } = await measureInteraction('player-photo:upload', () =>
    supabaseClient.storage.from(PLAYER_PHOTOS_BUCKET).upload(player.photoPath!, pendingPhotoUpload.blob, {
      contentType: pendingPhotoUpload.contentType,
      upsert: true,
    }),
  )

  if (error) {
    throw new Error(error.message)
  }

  await localDb.pendingPhotoUploads.delete(player.photoPath)
}

async function cleanupQueuedPhotoPath(photoPath: string | null | undefined) {
  const cleanupResult = await removeStoredPlayerPhoto(photoPath ?? null)
  if (!cleanupResult.removed) {
    throw new Error(cleanupResult.errorMessage ?? 'Profilfoto wird geloescht, sobald das Geraet online ist.')
  }
}

async function deleteRemotePlayer(write: { recordId: string; localId?: number; metadata?: Record<string, string | null> }) {
  const photoPath = write.metadata?.photoPath ?? null
  await cleanupQueuedPhotoPath(photoPath)

  const { error } = await supabase!.from('players').delete().eq('id', write.recordId)
  if (error) {
    throw new Error(error.message)
  }

  await Promise.all([
    localDb.pendingWrites.delete(write.localId ?? 0),
    localDb.players.delete(write.recordId),
    photoPath ? localDb.photoCache.where('photoPath').equals(photoPath).delete() : Promise.resolve(),
  ])
}

async function syncPlayersOnce(userId: string): Promise<PlayerSyncOverview> {
  if (!supabase) {
    return {
      ...(await getPlayerSyncOverview(userId)),
      status: 'error',
      errorMessage: 'Supabase ist noch nicht konfiguriert.',
    }
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      ...(await getPlayerSyncOverview(userId)),
      isOnline: false,
    }
  }

  const pendingWrites = await localDb.pendingWrites
    .where('userId')
    .equals(userId)
    .and((write) => write.table === 'players')
    .toArray()

  let processedPlayerDeleteCount = 0
  for (const write of pendingWrites.filter((pendingWrite) => pendingWrite.operation === 'delete')) {
    try {
      await deleteRemotePlayer(write)
      processedPlayerDeleteCount += 1
    } catch (caughtError) {
      return {
        ...(await getPlayerSyncOverview(userId)),
        status: 'error',
        errorMessage: caughtError instanceof Error ? caughtError.message : 'Spieler konnte nicht geloescht werden.',
      }
    }
  }

  const upsertWrites = pendingWrites.filter((pendingWrite) => pendingWrite.operation === 'upsert')
  const upsertSnapshots: Array<{ player: Player; writeLocalId?: number }> = []

  for (const write of upsertWrites) {
    let player = await localDb.players.get(write.recordId)
    if (!player) {
      await localDb.pendingWrites.delete(write.localId ?? 0)
      continue
    }

    try {
      if (write.metadata?.removePhotoPath) {
        await cleanupQueuedPhotoPath(write.metadata.removePhotoPath)
      }

      if (needsStoredPhotoCleanup(player)) {
        await cleanupQueuedPhotoPath(player.photoPath)

        const latestPlayer = await localDb.players.get(player.id)
        if (!latestPlayer || latestPlayer.clientUpdatedAt !== player.clientUpdatedAt) {
          await localDb.pendingWrites.delete(write.localId ?? 0)
          continue
        }

        player = {
          ...latestPlayer,
          photoPath: null,
          photoUpdatedAt: null,
          syncError: null,
        }
        await localDb.players.put(player)
      }

      await uploadQueuedPlayerPhoto(player)
    } catch (caughtError) {
      const errorMessage = caughtError instanceof Error ? caughtError.message : 'Spieler-Sync fehlgeschlagen.'
      await markSyncErrorIfUnchanged(localDb.players, player, errorMessage)

      return {
        ...(await getPlayerSyncOverview(userId)),
        status: 'error',
        errorMessage,
      }
    }

    upsertSnapshots.push({ player, writeLocalId: write.localId })
  }

  if (upsertSnapshots.length > 0) {
    const { error } = await supabase.from('players').upsert(upsertSnapshots.map(({ player }) => rowFromPlayer(player))).select('id')
    if (error) {
      for (const { player } of upsertSnapshots) {
        await markSyncErrorIfUnchanged(localDb.players, player, error.message)
      }

      return {
        ...(await getPlayerSyncOverview(userId)),
        status: 'error',
        errorMessage: error.message,
      }
    }

    await Promise.all(upsertSnapshots.map(({ player, writeLocalId }) => markSyncedIfUnchanged(localDb.players, player, writeLocalId)))
  }

  const { data, error } = await supabase
    .from('players')
    .select(
      'id,user_id,name,position,cluster,active,consent_status,photo_consent_status,photo_path,photo_updated_at,returner_status,notes,created_at,updated_at,deleted_at,client_updated_at',
    )
    .eq('user_id', userId)
    .order('name', { ascending: true })

  if (error) {
    return {
      ...(await getPlayerSyncOverview(userId)),
      status: 'error',
      errorMessage: error.message,
    }
  }

  const remoteRows = (data ?? []) as PlayerRow[]
  const remoteIds = new Set(remoteRows.map((row) => row.id))
  const pendingPlayerWritesAfterPush = await localDb.pendingWrites
    .where('userId')
    .equals(userId)
    .and((write) => write.table === 'players')
    .toArray()
  const pendingLocalPlayerIds = new Set(pendingPlayerWritesAfterPush.map((write) => write.recordId))

  for (const row of remoteRows) {
    const localPlayer = await localDb.players.get(row.id)
    if (localPlayer?.syncStatus === 'pending') {
      continue
    }

    if (!localPlayer || row.client_updated_at >= localPlayer.clientUpdatedAt) {
      await localDb.players.put(playerFromRow(row))
    }
  }

  const localPlayers = await localDb.players.where('userId').equals(userId).toArray()
  const syncedLocalPlayers = localPlayers.filter((player) => player.syncStatus !== 'pending' && !player.deletedAt)
  const shouldReconcileMissingPlayers =
    remoteRows.length > 0 || (syncedLocalPlayers.length <= 1 && processedPlayerDeleteCount === 0)

  if (shouldReconcileMissingPlayers) {
    for (const localPlayer of localPlayers) {
      if (
        !pendingLocalPlayerIds.has(localPlayer.id) &&
        localPlayer.syncStatus !== 'pending' &&
        !remoteIds.has(localPlayer.id)
      ) {
        await localDb.players.delete(localPlayer.id)
      }
    }
  }

  const timestamp = nowIso()
  await setSyncMeta(`players:lastSuccessfulSyncAt:${userId}`, timestamp)

  return {
    ...(await getPlayerSyncOverview(userId)),
    status: 'synced',
    pendingCount: 0,
    lastSuccessfulSyncAt: timestamp,
    errorMessage: null,
  }
}

export async function syncPlayers(userId: string): Promise<PlayerSyncOverview> {
  const pendingSync = pendingPlayerSyncs.get(userId)
  if (pendingSync) {
    return pendingSync
  }

  const syncPromise = measureInteraction('sync:players', () => syncPlayersOnce(userId)).finally(() => {
    pendingPlayerSyncs.delete(userId)
  })
  pendingPlayerSyncs.set(userId, syncPromise)

  return syncPromise
}

async function decodeImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file)
  }

  const imageUrl = URL.createObjectURL(file)
  const image = new Image()

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('Bild konnte nicht gelesen werden.'))
    image.src = imageUrl
  })

  URL.revokeObjectURL(imageUrl)
  return image
}

export async function resizeImageForUpload(file: File): Promise<ResizedPhoto> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Nur Bilddateien sind fuer Spielerfotos erlaubt.')
  }

  return measureInteraction('player-photo:resize', async () => {
    const image = await decodeImage(file)
    const isHtmlImage = typeof HTMLImageElement !== 'undefined' && image instanceof HTMLImageElement
    const sourceWidth = isHtmlImage ? image.naturalWidth : image.width
    const sourceHeight = isHtmlImage ? image.naturalHeight : image.height

    const maxWidth = 320
    const scale = Math.min(1, maxWidth / sourceWidth)
    const width = Math.round(sourceWidth * scale)
    const height = Math.round(sourceHeight * scale)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Bild konnte nicht verarbeitet werden.')
    }

    context.drawImage(image, 0, 0, width, height)
    if ('close' in image && typeof image.close === 'function') {
      image.close()
    }

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/webp', 0.72)
    })

    if (blob) {
      return { blob, extension: 'webp', contentType: 'image/webp', sourceBytes: file.size, outputBytes: blob.size, width, height }
    }

    const fallbackBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.72)
    })

    if (!fallbackBlob) {
      throw new Error('Bild konnte nicht komprimiert werden.')
    }

    return {
      blob: fallbackBlob,
      extension: 'jpg',
      contentType: 'image/jpeg',
      sourceBytes: file.size,
      outputBytes: fallbackBlob.size,
      width,
      height,
    }
  })
}

export async function uploadPlayerPhoto(player: Player, file: File) {
  if (player.photoConsentStatus !== 'allowed') {
    throw new Error('Profilfoto ist nur mit Foto-Erlaubnis erlaubt.')
  }

  const { blob, extension, contentType } = await resizeImageForUpload(file)
  const path = `${player.userId}/players/${player.id}/profile.${extension}`
  const timestamp = nowIso()
  const updatedPlayer: Player = {
    ...player,
    photoPath: path,
    photoUpdatedAt: timestamp,
    updatedAt: timestamp,
    clientUpdatedAt: timestamp,
    syncStatus: 'pending',
    syncError: null,
  }

  const cacheKey = playerPhotoCacheKey(path, timestamp)
  await Promise.all([
    localDb.players.put(updatedPlayer),
    localDb.pendingPhotoUploads.put({
      photoPath: path,
      userId: player.userId,
      playerId: player.id,
      blob,
      contentType,
      createdAt: timestamp,
    }),
    localDb.photoCache.put({
      cacheKey,
      photoPath: path,
      photoUpdatedAt: timestamp,
      blob,
      cachedAt: timestamp,
    }),
  ])
  await queuePlayerWrite(updatedPlayer)

  return updatedPlayer
}

export async function removePlayerPhoto(player: Player) {
  const timestamp = nowIso()
  const updatedPlayer: Player = {
    ...player,
    photoPath: null,
    photoUpdatedAt: null,
    updatedAt: timestamp,
    clientUpdatedAt: timestamp,
    syncStatus: 'pending',
    syncError: null,
  }

  await Promise.all([
    localDb.players.put(updatedPlayer),
    player.photoPath ? localDb.pendingPhotoUploads.delete(player.photoPath) : Promise.resolve(),
    player.photoPath ? localDb.photoCache.where('photoPath').equals(player.photoPath).delete() : Promise.resolve(),
  ])
  await queuePlayerWrite(updatedPlayer, player.photoPath ? { removePhotoPath: player.photoPath } : undefined)

  return updatedPlayer
}

function playerPhotoCacheKey(photoPath: string, photoUpdatedAt: string | null = null) {
  return `${photoPath}::${photoUpdatedAt ?? ''}`
}

export function clearPlayerPhotoUrlCache() {
  for (const url of playerPhotoUrlCache.values()) {
    URL.revokeObjectURL(url)
  }
  playerPhotoUrlCache.clear()
}

export async function downloadPlayerPhotoUrl(photoPath: string, photoUpdatedAt: string | null = null) {
  if (!supabase) {
    return null
  }

  const cacheKey = playerPhotoCacheKey(photoPath, photoUpdatedAt)
  const cachedUrl = playerPhotoUrlCache.get(cacheKey)
  if (cachedUrl) {
    return cachedUrl
  }

  const cachedPhoto = await localDb.photoCache.get(cacheKey)
  if (cachedPhoto) {
    const objectUrl = URL.createObjectURL(cachedPhoto.blob)
    playerPhotoUrlCache.set(cacheKey, objectUrl)
    return objectUrl
  }

  const { data, error } = await supabase.storage.from(PLAYER_PHOTOS_BUCKET).download(photoPath)
  if (error || !data) {
    return null
  }

  await localDb.photoCache.put({
    cacheKey,
    photoPath,
    photoUpdatedAt,
    blob: data,
    cachedAt: nowIso(),
  })

  const objectUrl = URL.createObjectURL(data)
  playerPhotoUrlCache.set(cacheKey, objectUrl)
  return objectUrl
}
