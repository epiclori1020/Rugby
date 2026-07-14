import { X } from 'lucide-react'
import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react'

type SheetProps = {
  title: string
  description?: string
  children: ReactNode
  onClose: () => void
}

export function Sheet({ children, description, onClose, title }: SheetProps) {
  const headingId = useId()
  const descriptionId = useId()
  const dialogRef = useRef<HTMLElement | null>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    )
    ;(firstFocusable ?? dialogRef.current)?.focus()

    return () => returnFocusRef.current?.focus()
  }, [])

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
      return
    }

    if (event.key !== 'Tab') {
      return
    }

    const focusableElements = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    )
    const firstFocusable = focusableElements[0]
    const lastFocusable = focusableElements.at(-1)
    if (!firstFocusable || !lastFocusable) {
      event.preventDefault()
      dialogRef.current?.focus()
      return
    }

    if (event.shiftKey && (document.activeElement === firstFocusable || document.activeElement === dialogRef.current)) {
      event.preventDefault()
      lastFocusable.focus()
    } else if (!event.shiftKey && (document.activeElement === lastFocusable || document.activeElement === dialogRef.current)) {
      event.preventDefault()
      firstFocusable.focus()
    }
  }

  return (
    <div className="of-sheet-backdrop">
      <section
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={headingId}
        aria-modal="true"
        className="of-sheet"
        onKeyDown={handleKeyDown}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <header className="of-sheet-header">
          <div>
            <h2 id={headingId}>{title}</h2>
            {description ? <p id={descriptionId}>{description}</p> : null}
          </div>
          <button className="of-sheet-close" type="button" aria-label="Schließen" onClick={onClose}>
            <X aria-hidden />
          </button>
        </header>
        <div className="of-sheet-body">{children}</div>
      </section>
    </div>
  )
}
