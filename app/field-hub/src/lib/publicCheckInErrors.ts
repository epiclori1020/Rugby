export function publicSubmissionErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : ''
  const normalizedMessage = message.toLocaleLowerCase('de-AT')

  if (normalizedMessage.includes('submission limit')) {
    return 'Check-in wurde bereits mehrfach abgeschickt. Bitte Coach direkt informieren.'
  }

  if (
    normalizedMessage.includes('ungueltig') ||
    normalizedMessage.includes('ungültig') ||
    normalizedMessage.includes('abgelaufen') ||
    normalizedMessage.includes('invalid link') ||
    normalizedMessage.includes('expired')
  ) {
    return 'Check-in-Link ist ungültig oder abgelaufen. Bitte Coach informieren.'
  }

  if (
    normalizedMessage.includes('row-level security') ||
    normalizedMessage.includes('rls') ||
    normalizedMessage.includes('permission') ||
    normalizedMessage.includes('policy') ||
    normalizedMessage.includes('supabase') ||
    normalizedMessage.includes('failed to fetch') ||
    normalizedMessage.includes('network')
  ) {
    return 'Check-in konnte gerade nicht gespeichert werden. Bitte erneut versuchen oder Coach informieren.'
  }

  return 'Check-in konnte gerade nicht gespeichert werden. Bitte erneut versuchen oder Coach informieren.'
}
