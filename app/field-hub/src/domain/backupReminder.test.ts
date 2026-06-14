import { describe, expect, it } from 'vitest'
import { shouldShowBackupReminder } from './backupReminder'

describe('backupReminder', () => {
  it('shows a reminder when a completed session changed after the last export', () => {
    expect(
      shouldShowBackupReminder({
        completedSessionClientUpdatedAt: '2026-06-18T20:00:00.000Z',
        dismissedReminderKey: null,
        lastExportAt: '2026-06-18T19:00:00.000Z',
        reminderKey: 'session-1:2026-06-18T20:00:00.000Z',
      }),
    ).toBe(true)
  })

  it('hides a reminder after export or temporary dismissal for the same session version', () => {
    expect(
      shouldShowBackupReminder({
        completedSessionClientUpdatedAt: '2026-06-18T20:00:00.000Z',
        dismissedReminderKey: null,
        lastExportAt: '2026-06-18T20:01:00.000Z',
        reminderKey: 'session-1:2026-06-18T20:00:00.000Z',
      }),
    ).toBe(false)

    expect(
      shouldShowBackupReminder({
        completedSessionClientUpdatedAt: '2026-06-18T20:00:00.000Z',
        dismissedReminderKey: 'session-1:2026-06-18T20:00:00.000Z',
        lastExportAt: null,
        reminderKey: 'session-1:2026-06-18T20:00:00.000Z',
      }),
    ).toBe(false)
  })

  it('shows the reminder again when the completed session changes after dismissal', () => {
    expect(
      shouldShowBackupReminder({
        completedSessionClientUpdatedAt: '2026-06-18T20:05:00.000Z',
        dismissedReminderKey: 'session-1:2026-06-18T20:00:00.000Z',
        lastExportAt: null,
        reminderKey: 'session-1:2026-06-18T20:05:00.000Z',
      }),
    ).toBe(true)
  })
})
