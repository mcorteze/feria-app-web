import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import './Modal.css'

export default function Modal({ open, onClose, title, children }) {
  const panelRef = useRef(null)
  const backdropPressRef = useRef(false)

  // onClose se recibe casi siempre como flecha inline desde la pantalla que
  // monta el modal, así que cambia de identidad en CADA render del padre. Si
  // entrara en las dependencias del efecto, escribir una letra en un input
  // (que re-renderiza al padre) limpiaría y volvería a montar el efecto: el
  // cleanup devuelve el foco al elemento anterior y el efecto lo lleva al
  // panel, robándoselo al input. En móvil eso cierra y reabre el teclado en
  // cada tecla. Se guarda en una ref para que el efecto dependa solo de `open`.
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement
    const panel = panelRef.current

    // Si el contenido trae su propio autoFocus, el foco ya está dentro del
    // panel: no se le quita. Solo se enfoca el panel cuando no hay nada
    // enfocado adentro, para que Escape y los lectores de pantalla funcionen.
    if (panel && !panel.contains(document.activeElement)) {
      panel.focus()
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') onCloseRef.current?.()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      // Si el cierre del modal vino acompañado de una navegación (ej. unirse
      // a una lista y saltar directo a /list/:id), el elemento que abrió el
      // modal puede ya no estar en el documento — enfocarlo ahí no sirve y en
      // móvil compite con el teclado virtual cerrándose, causando un
      // parpadeo visible. Solo se restaura el foco si sigue siendo parte del
      // documento (mismo flujo, sin cambio de ruta de por medio).
      if (previouslyFocused instanceof HTMLElement && document.contains(previouslyFocused)) {
        previouslyFocused.focus()
      }
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="ui-modal-backdrop"
      // El cierre por fondo exige que el gesto EMPIECE y TERMINE en el
      // backdrop. Sin esto, seleccionar texto dentro de un input y soltar el
      // dedo fuera del panel cerraba el modal, y en móvil el reflow por la
      // apertura del teclado podía dejar el punto de release fuera del panel.
      onPointerDown={(e) => {
        backdropPressRef.current = e.target === e.currentTarget
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && backdropPressRef.current) onClose?.()
        backdropPressRef.current = false
      }}
    >
      <div
        className="ui-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={panelRef}
      >
        <div className="ui-modal-header">
          {title ? <h2 className="ui-modal-title">{title}</h2> : <span />}
          <button
            type="button"
            className="ui-modal-close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={22} />
          </button>
        </div>
        <div className="ui-modal-body">{children}</div>
      </div>
    </div>
  )
}
