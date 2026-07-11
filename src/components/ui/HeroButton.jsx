import './HeroButton.css'

const VARIANT_CLASS = {
  brand: 'hero-button--brand',
  buyer: 'hero-button--buyer',
}

export default function HeroButton({
  icon: Icon,
  label,
  variant = 'brand',
  onClick,
  type = 'button',
}) {
  return (
    <button
      type={type}
      className={`hero-button ${VARIANT_CLASS[variant] || VARIANT_CLASS.brand}`}
      onClick={onClick}
    >
      <span className="hero-button__icon-wrap">
        {Icon ? <Icon size={28} strokeWidth={2} /> : null}
      </span>
      <span className="hero-button__label">{label}</span>
    </button>
  )
}
