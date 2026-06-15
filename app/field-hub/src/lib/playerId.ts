export function hasPlayerId<T extends { playerId: string | null }>(record: T): record is T & { playerId: string } {
  return record.playerId !== null
}
