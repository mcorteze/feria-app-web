import { Plus } from 'lucide-react'
import './FAB.css'

export default function FAB({ onClick, icon: Icon = Plus, label = 'Agregar' }) {
  return (
    <button type="button" className="ui-fab" onClick={onClick} aria-label={label}>
      <Icon size={26} strokeWidth={2.5} />
    </button>
  )
}
