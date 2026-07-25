import { ArrowLeft } from 'lucide-react'
import './ScreenHeader.css'

export default function ScreenHeader({
  title,
  subtitle,
  onBack,
  onTitleClick,
  roleBadge,
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
            <ArrowLeft size={22} />
          </button>
        ) : null}
        <span className="screen-header__titles">
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
          {subtitle ? <span className="screen-header__subtitle">{subtitle}</span> : null}
        </span>
        {roleBadge ? <span className="screen-header__role-badge">{roleBadge}</span> : null}
      </div>
      {actions ? <div className="screen-header__actions">{actions}</div> : null}
    </header>
  )
}
