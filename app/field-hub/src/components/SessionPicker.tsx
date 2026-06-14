import { CalendarDays } from 'lucide-react'
import type { SessionDefinition } from '../content/types'

type SessionPickerProps = {
  sessions: SessionDefinition[]
  selectedSessionId: string
  onSessionChange: (sessionId: string) => void
}

function formatSessionDate(date: string) {
  return new Intl.DateTimeFormat('de-AT', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(`${date}T12:00:00`))
}

export function SessionPicker({ onSessionChange, selectedSessionId, sessions }: SessionPickerProps) {
  return (
    <label className="session-picker">
      <span>
        <CalendarDays className="nav-icon" aria-hidden />
        Einheit
      </span>
      <select value={selectedSessionId} onChange={(event) => onSessionChange(event.currentTarget.value)}>
        {sessions.map((session) => (
          <option key={session.id} value={session.id}>
            {formatSessionDate(session.date)} · {session.title}
          </option>
        ))}
      </select>
    </label>
  )
}
