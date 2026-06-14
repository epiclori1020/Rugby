import type { SyncStatus } from './sync'

export type PlayerCluster =
  | 'front_row'
  | 'locks'
  | 'back_row'
  | 'halves'
  | 'centres'
  | 'back_three'
  | 'offen'

export type ConsentStatus = 'vorhanden' | 'offen' | 'unklar'
export type PhotoConsentStatus = 'not_asked' | 'allowed' | 'denied'
export type ReturnerStatus = 'nein' | 'ja' | 'offen'

export type Player = {
  id: string
  userId: string
  name: string
  position: string
  cluster: PlayerCluster
  active: boolean
  consentStatus: ConsentStatus
  photoConsentStatus: PhotoConsentStatus
  photoPath: string | null
  photoUpdatedAt: string | null
  returnerStatus: ReturnerStatus
  notes: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  clientUpdatedAt: string
  syncStatus: SyncStatus
  syncError: string | null
}

export type PlayerFormValues = {
  name: string
  position: string
  cluster: PlayerCluster
  active: boolean
  consentStatus: ConsentStatus
  photoConsentStatus: PhotoConsentStatus
  returnerStatus: ReturnerStatus
  notes: string
}

export const clusterOptions: Array<{ value: PlayerCluster; label: string }> = [
  { value: 'offen', label: 'Offen' },
  { value: 'front_row', label: 'Front Row' },
  { value: 'locks', label: 'Locks' },
  { value: 'back_row', label: 'Back Row' },
  { value: 'halves', label: 'Halves' },
  { value: 'centres', label: 'Centres' },
  { value: 'back_three', label: 'Back Three' },
]

export const consentStatusOptions: Array<{ value: ConsentStatus; label: string }> = [
  { value: 'unklar', label: 'Unklar' },
  { value: 'offen', label: 'Offen' },
  { value: 'vorhanden', label: 'Vorhanden' },
]

export const photoConsentOptions: Array<{ value: PhotoConsentStatus; label: string }> = [
  { value: 'not_asked', label: 'Nicht gefragt' },
  { value: 'allowed', label: 'Erlaubt' },
  { value: 'denied', label: 'Abgelehnt' },
]

export const returnerStatusOptions: Array<{ value: ReturnerStatus; label: string }> = [
  { value: 'offen', label: 'Offen' },
  { value: 'nein', label: 'Nein' },
  { value: 'ja', label: 'Ja' },
]

export const emptyPlayerFormValues: PlayerFormValues = {
  name: '',
  position: '',
  cluster: 'offen',
  active: true,
  consentStatus: 'unklar',
  photoConsentStatus: 'not_asked',
  returnerStatus: 'offen',
  notes: '',
}

export function playerToFormValues(player: Player): PlayerFormValues {
  return {
    name: player.name,
    position: player.position === 'offen' ? '' : player.position,
    cluster: player.cluster,
    active: player.active,
    consentStatus: player.consentStatus,
    photoConsentStatus: player.photoConsentStatus,
    returnerStatus: player.returnerStatus,
    notes: player.notes,
  }
}

export function getPlayerInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

