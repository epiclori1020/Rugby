// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { emptyCheckInDraft, type PlayerSessionEntry, type SessionLog } from '../domain/checkIn'
import type { PlayerExposureSummary } from '../domain/exposures'
import type { Player } from '../domain/players'
import { ExposureReviewPanel } from './ExposureReviewPanel'

const userId = 'user-1'

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
  createdAt: '2026-06-18T18:00:00.000Z',
  updatedAt: '2026-06-18T18:00:00.000Z',
  deletedAt: null,
  clientUpdatedAt: '2026-06-18T18:00:00.000Z',
  syncStatus: 'synced',
  syncError: null,
}

const sessionLog: SessionLog = {
  id: 'session-log-1',
  userId,
  sessionDefinitionId: 'session-def-1',
  date: '2026-06-18',
  status: 'in_progress',
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
}

const entry: PlayerSessionEntry = {
  ...emptyCheckInDraft,
  id: 'entry-1',
  userId,
  sessionLogId: sessionLog.id,
  playerId: player.id,
  present: true,
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
}

const summary: PlayerExposureSummary = {
  id: 'summary-1',
  userId,
  playerId: player.id,
  sessionLogId: sessionLog.id,
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
  coachNote: '',
  createdAt: '2026-06-18T18:00:00.000Z',
  updatedAt: '2026-06-18T18:00:00.000Z',
  deletedAt: null,
  clientUpdatedAt: '2026-06-18T18:00:00.000Z',
  syncStatus: 'synced',
  syncError: null,
}

describe('ExposureReviewPanel', () => {
  let root: Root | null = null

  beforeEach(() => {
    ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  })

  afterEach(async () => {
    if (root) {
      await act(async () => root?.unmount())
      root = null
    }
  })

  it('shows present-player exposure summaries and lets coach trigger regeneration', async () => {
    const onGenerate = vi.fn()
    const onManualOverride = vi.fn()
    const container = document.createElement('div')
    root = createRoot(container)

    await act(async () => {
      root?.render(
        <ExposureReviewPanel
          entries={[entry]}
          isSavingDisabled={false}
          onGenerate={onGenerate}
          onManualOverride={onManualOverride}
          players={[player]}
          sessionLog={sessionLog}
          summaries={[summary]}
        />,
      )
    })

    expect(container.textContent).toContain('Exposures')
    expect(container.textContent).toContain('Max Muster')
    expect(container.textContent).toContain('speed completed')
    expect(container.textContent).toContain('conditioning reduced')
    expect(container.textContent).toContain('contact_prep skipped')
    expect(container.textContent).toContain('keine medizinische Freigabe')

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((button) => button.textContent === 'Exposures aus Blockstatus aktualisieren')
        ?.click()
    })

    expect(onGenerate).toHaveBeenCalledTimes(1)
  })

  it('lets the coach manually add an exposure that defaulted to none', async () => {
    const onManualOverride = vi.fn()
    const container = document.createElement('div')
    root = createRoot(container)

    await act(async () => {
      root?.render(
        <ExposureReviewPanel
          entries={[entry]}
          isSavingDisabled={false}
          onGenerate={vi.fn()}
          onManualOverride={onManualOverride}
          players={[player]}
          sessionLog={sessionLog}
          summaries={[summary]}
        />,
      )
    })

    const codDecelSelect = Array.from(container.querySelectorAll('label'))
      .find((label) => label.textContent?.includes('cod_decel'))
      ?.querySelector('select')

    expect(codDecelSelect?.value).toBe('')

    await act(async () => {
      if (!codDecelSelect) {
        return
      }

      codDecelSelect.value = 'completed'
      codDecelSelect.dispatchEvent(new Event('change', { bubbles: true }))
    })

    expect(onManualOverride).toHaveBeenCalledWith(summary, 'cod_decel', {
      status: 'completed',
      note: 'Coach Override',
    })
  })
})
