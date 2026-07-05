import type { ReactNode } from 'react'

type OnFieldTopbarProps = {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
  syncStatus?: ReactNode
}

export function OnFieldTopbar({ actions, description, eyebrow, syncStatus, title }: OnFieldTopbarProps) {
  return (
    <header className="of-topbar">
      <div className="of-topbar-copy">
        {eyebrow ? <p className="of-topbar-eyebrow">{eyebrow}</p> : null}
        <h2 className="of-topbar-title">{title}</h2>
        {description ? <p className="of-topbar-description">{description}</p> : null}
      </div>
      {actions || syncStatus ? (
        <div className="of-topbar-actions">
          {actions}
          {syncStatus}
        </div>
      ) : null}
    </header>
  )
}
