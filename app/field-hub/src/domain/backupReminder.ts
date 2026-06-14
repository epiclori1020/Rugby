export type BackupReminderInput = {
  completedSessionClientUpdatedAt: string | null
  dismissedReminderKey: string | null
  lastExportAt: string | null
  reminderKey: string | null
}

export function shouldShowBackupReminder({
  completedSessionClientUpdatedAt,
  dismissedReminderKey,
  lastExportAt,
  reminderKey,
}: BackupReminderInput) {
  if (!completedSessionClientUpdatedAt || !reminderKey) {
    return false
  }

  if (dismissedReminderKey === reminderKey) {
    return false
  }

  if (lastExportAt && lastExportAt >= completedSessionClientUpdatedAt) {
    return false
  }

  return true
}
