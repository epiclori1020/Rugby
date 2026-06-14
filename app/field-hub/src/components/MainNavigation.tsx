import {
  Activity,
  Archive,
  CalendarDays,
  ClipboardCheck,
  Dumbbell,
  FileDown,
  HeartPulse,
  Users,
} from 'lucide-react'
import type { ComponentType } from 'react'
import type { HubTab } from '../App'

type NavigationItem = {
  id: HubTab
  label: string
  Icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
}

const navigationItems: NavigationItem[] = [
  { id: 'heute', label: 'Heute', Icon: CalendarDays },
  { id: 'spieler', label: 'Spieler', Icon: Users },
  { id: 'check-in', label: 'Check-in', Icon: ClipboardCheck },
  { id: 'training', label: 'Training', Icon: Dumbbell },
  { id: 'nachbereitung', label: 'Nachbereitung', Icon: Activity },
  { id: 'returner', label: 'Returner', Icon: HeartPulse },
  { id: 'bibliothek', label: 'Bibliothek', Icon: Archive },
  { id: 'export', label: 'Export', Icon: FileDown },
]

type MainNavigationProps = {
  activeTab: HubTab
  onTabChange: (tab: HubTab) => void
}

export function MainNavigation({ activeTab, onTabChange }: MainNavigationProps) {
  return (
    <nav className="main-nav" aria-label="Bereiche">
      {navigationItems.map(({ id, label, Icon }) => (
        <button
          className={activeTab === id ? 'nav-button active' : 'nav-button'}
          key={id}
          type="button"
          aria-label={label}
          aria-current={activeTab === id ? 'page' : undefined}
          onClick={() => onTabChange(id)}
        >
          <Icon className="nav-icon" aria-hidden />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}
