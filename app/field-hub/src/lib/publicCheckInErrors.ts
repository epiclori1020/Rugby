export function publicSubmissionErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : ''
  if (message.toLocaleLowerCase('de-AT').includes('submission limit')) {
    return 'Check-in wurde bereits mehrfach abgeschickt. Sag Arwin bitte direkt Bescheid.'
  }

  return message || 'Check-in konnte nicht abgeschickt werden.'
}
