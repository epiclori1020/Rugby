import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SessionDefinition } from '../content/types'
import type { Player } from '../domain/players'
import { localDb } from './localDb'

const supabaseState = vi.hoisted(() => ({
  closedLinkFilters: [] as Array<{ patch: Record<string, unknown>; userId: string; sessionDefinitionId: string }>,
  insertedLinks: [] as unknown[],
  insertedLinkPlayers: [] as unknown[],
}))

vi.mock('./supabaseClient', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'public_checkin_links') {
        return {
          update: vi.fn((patch: Record<string, unknown>) => ({
            eq: vi.fn((_userColumn: string, userId: string) => ({
              eq: vi.fn((_sessionColumn: string, sessionDefinitionId: string) => ({
                is: vi.fn(() => ({
                  is: vi.fn(async () => {
                    supabaseState.closedLinkFilters.push({ patch, userId, sessionDefinitionId })
                    return { error: null }
                  }),
                })),
              })),
            })),
          })),
          insert: vi.fn(async (row: unknown) => {
            supabaseState.insertedLinks.push(row)
            return { error: null }
          }),
        }
      }

      return {
        insert: vi.fn(async (rows: unknown) => {
          supabaseState.insertedLinkPlayers.push(rows)
          return { error: null }
        }),
      }
    }),
  },
}))

const userId = '00000000-0000-4000-8000-000000000001'

const sessionDefinition: SessionDefinition = {
  id: 'test-session',
  date: '2026-06-16',
  kw: 'KW25',
  title: 'Test Session',
  type: 'training',
  summary: 'Test',
  primarySource: 'test.md',
  pdfRefs: [],
  goals: [],
  timeline: [],
  materials: [],
  safetyNotes: [],
  coachNotes: [],
  libraryRefs: [],
}

const player: Player = {
  id: 'player-1',
  userId,
  name: 'Max Muster',
  position: 'Back Row',
  cluster: 'back_row',
  active: true,
  consentStatus: 'vorhanden',
  photoConsentStatus: 'not_asked',
  photoPath: null,
  photoUpdatedAt: null,
  returnerStatus: 'nein',
  notes: '',
  createdAt: '2026-06-16T18:00:00.000Z',
  updatedAt: '2026-06-16T18:00:00.000Z',
  deletedAt: null,
  clientUpdatedAt: '2026-06-16T18:00:00.000Z',
  syncStatus: 'synced',
  syncError: null,
}

describe('public check-in link lifecycle', () => {
  beforeEach(async () => {
    supabaseState.closedLinkFilters = []
    supabaseState.insertedLinks = []
    supabaseState.insertedLinkPlayers = []
    await localDb.delete()
    await localDb.open()
    await localDb.publicCheckInLinks.put({
      id: 'old-link',
      userId,
      sessionDefinitionId: sessionDefinition.id,
      sessionTitle: sessionDefinition.title,
      sessionDate: sessionDefinition.date,
      tokenHash: 'a'.repeat(64),
      expiresAt: '2026-06-16T23:00:00.000Z',
      closedAt: null,
      createdAt: '2026-06-16T17:00:00.000Z',
      updatedAt: '2026-06-16T17:00:00.000Z',
      deletedAt: null,
      clientUpdatedAt: '2026-06-16T17:00:00.000Z',
      syncStatus: 'synced',
      syncError: null,
    })
  })

  it('closes existing open links for the same session before creating a new link', async () => {
    const { createPublicCheckInLinkBundle } = await import('./publicCheckInRepository')

    await createPublicCheckInLinkBundle(userId, sessionDefinition, [player])

    const oldLink = await localDb.publicCheckInLinks.get('old-link')
    expect(supabaseState.closedLinkFilters).toMatchObject([
      { userId, sessionDefinitionId: sessionDefinition.id },
    ])
    expect(oldLink?.closedAt).toBeTruthy()
    expect(supabaseState.insertedLinks).toHaveLength(1)
    expect(supabaseState.insertedLinkPlayers).toHaveLength(1)
  })
})
