import { ArrowLeft } from 'lucide-react'
import './ScreenHeader.css'

export default function ScreenHeader({
  title,
  onBack,
  onTitleClick,
  actions,
}) {
  return (
    <header className="screen-header">
      <div className="screen-header__left">
        {onBack ? (
          <button
            type="button"
            className="screen-header__icon-btn"
            onClick={onBack}
            aria-label="Volver"
          >
            <ArrowLeft size={20} />
          </button>
        ) : null}
        {onTitleClick ? (
          <button
            type="button"
            className="screen-header__title screen-header__title--button"
            onClick={onTitleClick}
          >
            {title}
          </button>
        ) : (
          <h1 className="screen-header__title">{title}</h1>
        )}
      </div>
      {actions ? <div className="screen-header__actions">{actions}</div> : null}
    </header>
  )
}
