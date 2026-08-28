import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react'

interface PanelOverlayProps {
  /** Nombre accesible del panel, anunciado al abrir (FR-014) — aplicado vía `aria-label`, sin depender
   * de un `id` en el contenido envuelto (specs/026-navegacion-hub-mockup, no toca las 7 pantallas existentes). */
  labelledBy: string
  /** Se invoca al pulsar el control de cierre o Escape. El caller decide qué significa cerrar (pop del stack). */
  onClose: () => void
  children: ReactNode
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** specs/026-navegacion-hub-mockup (contracts/panel-shell.md). Contenedor de overlay reutilizable: fondo
 * oscurecido sobre la vista de base, focus trap y devolución de foco al cerrar — sin lógica de negocio. */
export function PanelOverlay({ labelledBy, onClose, children }: PanelOverlayProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null
    sheetRef.current?.focus()
    const previouslyFocused = previouslyFocusedRef.current
    return () => {
      previouslyFocused?.focus?.()
    }
  }, [])

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      onClose()
      return
    }
    if (event.key !== 'Tab' || !sheetRef.current) return

    const focusable = Array.from(sheetRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    if (focusable.length === 0) {
      event.preventDefault()
      sheetRef.current.focus()
      return
    }

    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <div className="panel-overlay">
      <div
        ref={sheetRef}
        className="panel-overlay__sheet"
        role="dialog"
        aria-modal="true"
        aria-label={labelledBy}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <div className="panel-overlay__header">
          <button className="panel-overlay__close" onClick={onClose} aria-label={`Cerrar ${labelledBy}`}>
            ✕
          </button>
        </div>
        <div className="panel-overlay__body">{children}</div>
      </div>
    </div>
  )
}
