import { describe, expect, it } from 'vitest'
import { buildCheckInsCsv, buildCsv, buildPlayersCsv } from './csvExport'
import type { Player } from '../domain/players'

const player: Player = {
  id: 'player-1',
  userId: 'user-1',
  name: 'Muster; Spieler',
  position: 'Back Row',
  cluster: 'back_row',
  active: true,
  consentStatus: 'vorhanden',
  photoConsentStatus: 'allowed',
  photoPath: 'user-1/players/player-1/profile.webp',
  photoUpdatedAt: '2026-06-16T18:05:00.000Z',
  returnerStatus: 'nein',
  notes: 'Quote "Test"\nzweite Zeile',
  createdAt: '2026-06-16T18:00:00.000Z',
  updatedAt: '2026-06-16T18:05:00.000Z',
  deletedAt: null,
  clientUpdatedAt: '2026-06-16T18:05:00.000Z',
  syncStatus: 'synced',
  syncError: null,
}

describe('csvExport', () => {
  it('builds semicolon CSV with BOM, CRLF and escaped values', () => {
    const csv = buildCsv(
      ['Name', 'Notiz'],
      [
        ['Normal', 'ok'],
        ['Muster; Spieler', 'Quote "Test"\nzweite Zeile'],
      ],
    )

    expect(csv).toBe(
      '\uFEFFName;Notiz\r\nNormal;ok\r\n"Muster; Spieler";"Quote ""Test""\nzweite Zeile"',
    )
  })

  it('exports player rows for spreadsheet use without photo blobs', () => {
    const csv = buildPlayersCsv([player])

    expect(csv).toContain('Name;Position;Cluster;Aktiv;Geloescht am;Consent;Foto-Erlaubnis;Returner;Notizen')
    expect(csv).toContain('"Muster; Spieler";Back Row;back_row;ja;;vorhanden;allowed;nein;')
    expect(csv).not.toContain('profile.webp')
  })

  it('marks soft-deleted players in player CSV exports', () => {
    const csv = buildPlayersCsv([{ ...player, active: false, deletedAt: '2026-06-18T19:00:00.000Z' }])

    expect(csv).toContain('"Muster; Spieler";Back Row;back_row;nein;2026-06-18T19:00:00.000Z;')
  })

  it('labels anonymized historical rows without a player id', () => {
    const csv = buildCheckInsCsv(
      [
        {
          id: 'entry-1',
          userId: player.userId,
          sessionLogId: 'session-1',
          playerId: null,
          present: true,
          readiness: null,
          lifeFlag: '',
          painScore: null,
          painLocation: '',
          sessionReaction: 'none',
          returnerFlag: 'nein',
          redFlag: 'none',
          movementConcern: false,
          previousWarning: false,
          trafficLight: 'green',
          trafficLightSuggestion: 'green',
          trafficLightWasManual: false,
          trainingVariant: null,
          limits: [],
          observation: '',
          sessionRpe: null,
          durationMinutes: null,
          sessionLoad: null,
          postPainScore: null,
          postPainLocation: '',
          e2Decision: null,
          nextStep: null,
          createdAt: '2026-06-18T18:00:00.000Z',
          updatedAt: '2026-06-18T18:00:00.000Z',
          deletedAt: null,
          clientUpdatedAt: '2026-06-18T18:00:00.000Z',
          syncStatus: 'synced',
          syncError: null,
        },
      ],
      [player],
      [
        {
          id: 'session-1',
          userId: player.userId,
          sessionDefinitionId: 'session-def-1',
          date: '2026-06-18',
          status: 'completed',
          coach: '',
          groupSize: null,
          weatherOrHeatNote: '',
          planChanged: false,
          durationMinutes: null,
          contactIndex: '',
          speedExposureNote: '',
          coachReview: '',
          createdAt: '2026-06-18T18:00:00.000Z',
          updatedAt: '2026-06-18T18:00:00.000Z',
          deletedAt: null,
          clientUpdatedAt: '2026-06-18T18:00:00.000Z',
          syncStatus: 'synced',
          syncError: null,
        },
      ],
    )

    expect(csv).toContain('2026-06-18;Geloeschter Spieler;ja;;;;;none;nein')
  })
})
