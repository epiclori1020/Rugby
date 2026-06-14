// Stable per (player, session) key base for the returner card's uncontrolled inputs.
// Field keys MUST NOT depend on entry.id: an unsaved entry mints a fresh id on every
// render, which remounts the inputs and drops typed caps/notes the moment any sibling
// state (sync/isLoading) updates. Including the session id keeps fields stable while
// editing but still refreshes them when the coach switches to another session.
export function returnerEntryKeyBase(playerId: string, sessionId: string) {
  return `${playerId}::${sessionId}`
}
