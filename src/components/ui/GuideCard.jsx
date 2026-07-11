import './GuideCard.css'

export default function GuideCard({ icon: Icon, title, message, actionLabel, onAction, onDismiss }) {
  return (
    <div className="ui-guide-card">
      {Icon ? (
        <span className="ui-guide-card__icon">
          <Icon size={18} strokeWidth={2} />
        </span>
      ) : null}
      <div className="ui-guide-card__body">
        {title ? <p className="ui-guide-card__title">{title}</p> : null}
        {message ? <p className="ui-guide-card__message">{message}</p> : null}
        {actionLabel && onAction ? (
          <button type="button" className="ui-guide-card__action" onClick={onAction}>
            {actionLabel}
          </button>
        ) : null}
      </div>
      {onDismiss ? (
        <button
          type="button"
          className="ui-guide-card__dismiss"
          onClick={onDismiss}
          aria-label="Descartar"
        >
          ×
        </button>
      ) : null}
    </div>
  )
}
