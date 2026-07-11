import './Avatar.css'

export default function Avatar({ photoURL, name, size = 28 }) {
  const initial = (name || '?').charAt(0).toUpperCase()
  const style = { width: size, height: size, fontSize: size * 0.42 }

  if (photoURL) {
    return (
      <img
        className="ui-avatar"
        style={style}
        src={photoURL}
        alt={name || 'Perfil'}
        referrerPolicy="no-referrer"
      />
    )
  }
  return (
    <span className="ui-avatar ui-avatar--fallback" style={style}>
      {initial}
    </span>
  )
}
