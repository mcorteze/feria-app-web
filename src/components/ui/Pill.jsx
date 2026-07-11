import './Pill.css'

const VARIANT_CLASS = {
  success: 'ui-pill--success',
  pending: 'ui-pill--pending',
  neutral: 'ui-pill--neutral',
  danger: 'ui-pill--danger',
  info: 'ui-pill--info',
}

export default function Pill({ children, variant = 'neutral', icon: Icon }) {
  return (
    <span className={`ui-pill ${VARIANT_CLASS[variant] || VARIANT_CLASS.neutral}`}>
      {Icon ? <Icon size={12} strokeWidth={2.5} /> : null}
      {children}
    </span>
  )
}
