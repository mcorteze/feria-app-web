import './LoadingState.css'

export default function LoadingState({ label = 'Cargando...' }) {
  return (
    <div className="ui-loading-state">
      <span className="ui-loading-state__spinner" aria-hidden="true" />
      <span className="ui-loading-state__label">{label}</span>
    </div>
  )
}
