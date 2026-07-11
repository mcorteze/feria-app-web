import './EmptyState.css'

export default function EmptyState({
  icon: Icon,
  title,
  message,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}) {
  return (
    <div className="ui-empty-state">
      {Icon ? (
        <div className="ui-empty-state__icon">
          <Icon size={32} strokeWidth={1.75} />
        </div>
      ) : null}
      {title ? <p className="ui-empty-state__title">{title}</p> : null}
      {message ? <p className="ui-empty-state__message">{message}</p> : null}
      {actionLabel && onAction ? (
        <button type="button" className="ui-empty-state__action" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
      {secondaryActionLabel && onSecondaryAction ? (
        <button
          type="button"
          className="ui-empty-state__secondary-action"
          onClick={onSecondaryAction}
        >
          {secondaryActionLabel}
        </button>
      ) : null}
    </div>
  )
}
