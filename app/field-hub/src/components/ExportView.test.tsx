// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthSessionState } from '../lib/auth'
import { ExportView } from './ExportView'

const backupRepositoryMocks = vi.hoisted(() => ({
  createFieldHubBackup: vi.fn(),
  importFieldHubBackup: vi.fn(),
  previewFieldHubBackupImport: vi.fn(),
  setLastExportAt: vi.fn(),
}))

vi.mock('../lib/backupRepository', () => ({
  createFieldHubBackup: backupRepositoryMocks.createFieldHubBackup,
  importFieldHubBackup: backupRepositoryMocks.importFieldHubBackup,
  previewFieldHubBackupImport: backupRepositoryMocks.previewFieldHubBackupImport,
  setLastExportAt: backupRepositoryMocks.setLastExportAt,
}))

vi.mock('../lib/csvExport', () => ({
  buildBaselineCsv: vi.fn(() => 'baseline'),
  buildCheckInsCsv: vi.fn(() => 'check-ins'),
  buildExerciseResultsCsv: vi.fn(() => 'exercise-results'),
  buildExposureSummariesCsv: vi.fn(() => 'exposures'),
  buildMetricResultsCsv: vi.fn(() => 'metrics'),
  buildPlayersCsv: vi.fn(() => 'players'),
  buildProgressCsv: vi.fn(() => 'progress'),
  buildSessionBlocksCsv: vi.fn(() => 'blocks'),
  downloadTextFile: vi.fn(),
}))

const signedOutAuthState: AuthSessionState = {
  status: 'signed-out',
  session: null,
  user: null,
  error: null,
}

const signedInAuthState = {
  status: 'signed-in',
  session: { user: { id: 'user-1', email: 'coach@example.com' } },
  user: { id: 'user-1', email: 'coach@example.com' },
  error: null,
} as AuthSessionState

const emptyBackup = {
  type: 'rugby-field-hub-full-backup',
  version: 1,
  exportedAt: '2026-07-05T12:00:00.000Z',
  data: {
    players: [],
    sessionLogs: [],
    playerSessionEntries: [],
    progressEntries: [],
    baselineEntries: [],
    returnerEntries: [],
    sessionBlockLogs: [],
    playerExposureSummaries: [],
    exerciseResults: [],
    metricResults: [],
    publicCheckInLinks: [],
    publicCheckInLinkPlayers: [],
    publicCheckInSubmissions: [],
  },
}

function renderExport(authState: AuthSessionState = signedInAuthState) {
  return renderToStaticMarkup(
    <ExportView
      authState={authState}
      lastExportAt={null}
      onDataChanged={async () => undefined}
      onExportComplete={() => undefined}
    />,
  )
}

describe('ExportView utility zone', () => {
  beforeEach(() => {
    backupRepositoryMocks.createFieldHubBackup.mockResolvedValue(emptyBackup)
    backupRepositoryMocks.importFieldHubBackup.mockResolvedValue({ importedRecords: 4 })
    backupRepositoryMocks.previewFieldHubBackupImport.mockResolvedValue({
      valid: true,
      errors: [],
      totals: {
        totalRecords: 4,
        newRecords: 3,
        overwriteCandidates: 1,
        skippedOlderRecords: 0,
      },
    })
    backupRepositoryMocks.setLastExportAt.mockResolvedValue('2026-07-05T12:00:00.000Z')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('shows a coach-near locked state when signed out', () => {
    const markup = renderExport(signedOutAuthState)

    expect(markup).toContain('Export &amp; Backup')
    expect(markup).toContain('Coach-Login noetig')
    expect(markup).toContain('Import-Vorschau')
  })

  it('groups signed-in utilities into backup, CSV tables and import check', () => {
    const markup = renderExport()

    expect(markup).toContain('Komplettes Backup')
    expect(markup).toContain('CSV-Tabellen')
    expect(markup).toContain('Import-Vorschau')
    expect(markup).toContain('Backup-Datei pruefen')
    expect(markup).toContain('CSV Flexible Messwerte')
    expect(markup).toContain('export-action-list')
    expect((markup.match(/of-button-primary/g) ?? []).length).toBe(1)
    expect(markup).not.toContain('pending write queue')
    expect(markup).not.toContain('JSON conflict object')
  })

  it('previews a backup file before confirmation and reports pending sync after import', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <ExportView
          authState={signedInAuthState}
          lastExportAt={null}
          onDataChanged={async () => undefined}
          onExportComplete={() => undefined}
        />,
      )
    })

    expect(container.querySelector('input[type="file"]')).toBeNull()
    const openImportButton = Array.from(container.querySelectorAll('button'))
      .find((button) => button.textContent === 'Backup-Datei pruefen')
    await act(async () => openImportButton?.click())

    const input = container.querySelector<HTMLInputElement>('input[type="file"]')
    expect(input).not.toBeNull()
    expect(container.querySelector('[role="dialog"]')).not.toBeNull()

    const file = new File([JSON.stringify(emptyBackup)], 'backup.json', { type: 'application/json' })

    await act(async () => {
      Object.defineProperty(input, 'files', { value: [file], configurable: true })
      input?.dispatchEvent(new Event('change', { bubbles: true }))
    })

    expect(container.textContent).toContain('4 Datensaetze in Datei')
    expect(container.textContent).toContain('3 neu')
    expect(container.textContent).toContain('1 moegliche Ueberschreibungen')

    const confirmButton = Array.from(container.querySelectorAll('button'))
      .find((button) => button.textContent === 'Import bestaetigen')
    expect(confirmButton?.disabled).toBe(false)

    await act(async () => {
      confirmButton?.click()
    })

    expect(backupRepositoryMocks.importFieldHubBackup).toHaveBeenCalledWith(
      'user-1',
      emptyBackup,
      { confirmOverwrite: true },
    )
    expect(container.textContent).toContain('4 Datensaetze lokal importiert')
    expect(container.textContent).toContain('Aenderungen warten auf Sync')

    await act(async () => {
      root.unmount()
    })
  })

  it('blocks confirmation when preview validation fails', async () => {
    backupRepositoryMocks.previewFieldHubBackupImport.mockResolvedValueOnce({
      valid: false,
      errors: ['Backup-Datei passt nicht zu OnField Coach.'],
      totals: {
        totalRecords: 0,
        newRecords: 0,
        overwriteCandidates: 0,
        skippedOlderRecords: 0,
      },
    })

    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <ExportView
          authState={signedInAuthState}
          lastExportAt={null}
          onDataChanged={async () => undefined}
          onExportComplete={() => undefined}
        />,
      )
    })

    const openImportButton = Array.from(container.querySelectorAll('button'))
      .find((button) => button.textContent === 'Backup-Datei pruefen')
    await act(async () => openImportButton?.click())

    const input = container.querySelector<HTMLInputElement>('input[type="file"]')
    const file = new File([JSON.stringify({})], 'backup.json', { type: 'application/json' })

    await act(async () => {
      Object.defineProperty(input, 'files', { value: [file], configurable: true })
      input?.dispatchEvent(new Event('change', { bubbles: true }))
    })

    const confirmButton = Array.from(container.querySelectorAll('button'))
      .find((button) => button.textContent === 'Import bestaetigen')

    expect(container.textContent).toContain('Import blockiert')
    expect(container.textContent).toContain('Backup-Datei passt nicht zu OnField Coach.')
    expect(confirmButton?.disabled).toBe(true)

    await act(async () => {
      root.unmount()
    })
  })
})
