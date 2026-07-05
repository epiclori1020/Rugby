import { X } from 'lucide-react'
import { useId, type ReactNode } from 'react'

type SheetProps = {
  title: string
  description?: string
  children: ReactNode
  onClose: () => void
}

export function Sheet({ children, description, onClose, title }: SheetProps) {
  const headingId = useId()

  return (
    <div className="of-sheet-backdrop">
      <section className="of-sheet" role="dialog" aria-modal="true" aria-labelledby={headingId}>
        <header className="of-sheet-header">
          <div>
            <h2 id={headingId}>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
          <button className="of-sheet-close" type="button" aria-label="Schliessen" onClick={onClose}>
            <X aria-hidden />
          </button>
        </header>
        <div className="of-sheet-body">{children}</div>
      </section>
    </div>
  )
}
