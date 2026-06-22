import { describe, expect, it } from 'vitest'
import {
  buildCheckInsCsv,
  buildCsv,
  buildExerciseResultsCsv,
  buildExposureSummariesCsv,
  buildMetricResultsCsv,
  buildPlayersCsv,
  buildSessionBlocksCsv,
} from './csvExport'
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

  it('exports session block status rows', () => {
    const csv = buildSessionBlocksCsv(
      [
        {
          id: 'block-log-1',
          userId: player.userId,
          sessionLogId: 'session-1',
          sessionDefinitionId: 'session-def-1',
          blockKey: 'session-def-1:speed',
          blockTitle: 'Speed',
          blockOrder: 30,
          plannedTime: '18-28',
          plannedWork: '4x10 m',
          status: 'skipped',
          reason: 'time',
          coachNote: 'Zeitdruck',
          createdAt: '2026-06-18T18:00:00.000Z',
          updatedAt: '2026-06-18T18:05:00.000Z',
          deletedAt: null,
          clientUpdatedAt: '2026-06-18T18:05:00.000Z',
          syncStatus: 'synced',
          syncError: null,
        },
      ],
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

    expect(csv).toContain('Session;Session Definition;Block Order;Block Key;Block;Geplante Zeit;Geplante Arbeit;Status;Grund;Notiz')
    expect(csv).toContain('2026-06-18;session-def-1;30;session-def-1:speed;Speed;18-28;4x10 m;skipped;time;Zeitdruck')
  })

  it('exports exposure summary rows', () => {
    const csv = buildExposureSummariesCsv(
      [
        {
          id: 'exposure-1',
          userId: player.userId,
          playerId: player.id,
          sessionLogId: 'session-1',
          sessionDefinitionId: 'session-def-1',
          sessionDate: '2026-06-18',
          statuses: {
            speed: 'completed',
            acceleration: 'completed',
            cod_decel: 'none',
            lower_strength: 'none',
            upper_strength: 'none',
            power: 'none',
            conditioning: 'reduced',
            contact_prep: 'skipped',
            neck_trunk: 'none',
            mobility: 'none',
            reconditioning: 'none',
          },
          sources: {},
          manualOverrides: {},
          coachNote: 'Coach Review',
          createdAt: '2026-06-18T18:00:00.000Z',
          updatedAt: '2026-06-18T18:05:00.000Z',
          deletedAt: null,
          clientUpdatedAt: '2026-06-18T18:05:00.000Z',
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

    expect(csv).toContain('Session;Spieler;Speed;Acceleration;COD/Decel;Lower Strength')
    expect(csv).toContain('2026-06-18;"Muster; Spieler";completed;completed;none;none;none;none;reduced;skipped')
  })

  it('exports flexible metric result rows with metric units and context', () => {
    const csv = buildMetricResultsCsv(
      [
        {
          id: 'metric-1',
          userId: player.userId,
          playerId: player.id,
          sessionLogId: 'session-1',
          metricKey: 'med_ball_chest_pass',
          value: 6.25,
          attempt: 1,
          isValid: true,
          bodySide: 'none',
          contextNote: '5 kg',
          createdAt: '2026-06-18T18:00:00.000Z',
          updatedAt: '2026-06-18T18:05:00.000Z',
          deletedAt: null,
          clientUpdatedAt: '2026-06-18T18:05:00.000Z',
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

    expect(csv).toContain('Session;Spieler;Metric;Einheit;Wert;Attempt;Gueltig;Seite;Kontext')
    expect(csv).toContain('2026-06-18;"Muster; Spieler";Med-Ball Chest Pass;m;6.25;1;ja;none;5 kg')
  })

  it('exports structured exercise result rows with exercise definitions and load units', () => {
    const csv = buildExerciseResultsCsv(
      [
        {
          id: 'exercise-1',
          userId: player.userId,
          playerId: player.id,
          sessionLogId: 'session-1',
          exerciseKey: 'trap_bar_deadlift',
          variant: 'A',
          sets: 3,
          reps: '5',
          loadValue: 90,
          loadUnit: 'kg',
          rpe: 7,
          rir: null,
          techniqueQuality: 'good',
          painResponse: 'none',
          notes: 'sauber',
          createdAt: '2026-06-18T18:00:00.000Z',
          updatedAt: '2026-06-18T18:05:00.000Z',
          deletedAt: null,
          clientUpdatedAt: '2026-06-18T18:05:00.000Z',
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

    expect(csv).toContain('Session;Spieler;Uebung;Pattern;Variante;Sets;Reps;Last;Einheit;RPE;RIR;Technik;Pain Response;Notiz')
    expect(csv).toContain('2026-06-18;"Muster; Spieler";Trap Bar Deadlift;hinge;A;3;5;90;kg;7;;good;none;sauber')
  })
})
