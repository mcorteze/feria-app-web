import './Card.css'

export default function Card({ children, onClick, className = '' }) {
  const isInteractive = typeof onClick === 'function'
  const Tag = isInteractive ? 'button' : 'div'

  return (
    <Tag
      type={isInteractive ? 'button' : undefined}
      className={`ui-card ${isInteractive ? 'ui-card--interactive' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </Tag>
  )
}
