import {
  CalendarDays,
  ClipboardCheck,
  LineChart,
  MoreHorizontal,
  Users,
} from 'lucide-react'
import type { ComponentType } from 'react'
import type { AppSection } from '../navigation'

type NavigationItem = {
  id: AppSection
  label: string
  Icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
}

const navigationItems: NavigationItem[] = [
  { id: 'today', label: 'Heute', Icon: CalendarDays },
  { id: 'unit', label: 'Einheit', Icon: ClipboardCheck },
  { id: 'players', label: 'Spieler', Icon: Users },
  { id: 'analysis', label: 'Analyse', Icon: LineChart },
  { id: 'more', label: 'Mehr', Icon: MoreHorizontal },
]

type MainNavigationProps = {
  activeSection: AppSection
  onSectionChange: (section: AppSection) => void
}

export function MainNavigation({ activeSection, onSectionChange }: MainNavigationProps) {
  return (
    <nav className="main-nav bottom-tab-bar" aria-label="Hauptbereiche">
      {navigationItems.map(({ id, label, Icon }) => (
        <button
          className={activeSection === id ? 'nav-button active' : 'nav-button'}
          key={id}
          type="button"
          aria-label={label}
          aria-current={activeSection === id ? 'page' : undefined}
          onClick={() => onSectionChange(id)}
        >
          <Icon className="nav-icon" aria-hidden />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}
