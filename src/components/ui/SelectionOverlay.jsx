import Modal from './Modal'
import { UNITS } from '../../data/seedCategories'
import './SelectionOverlay.css'

export function QuantityOverlay({ open, value, onSelect, onClose }) {
  const options = Array.from({ length: 20 }, (_, i) => i + 1)
  return (
    <Modal open={open} onClose={onClose} title="Cantidad">
      <div className="selection-overlay-grid">
        {options.map((n) => (
          <button
            key={n}
            type="button"
            className={`selection-overlay-cell ${value === n ? 'selection-overlay-cell--active' : ''}`}
            onClick={() => {
              onSelect(n)
              onClose()
            }}
          >
            {n}
          </button>
        ))}
      </div>
    </Modal>
  )
}

export function UnitOverlay({ open, value, onSelect, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Unidad">
      <div className="selection-overlay-list">
        {UNITS.map((unit) => (
          <button
            key={unit}
            type="button"
            className={`selection-overlay-row ${value === unit ? 'selection-overlay-row--active' : ''}`}
            onClick={() => {
              onSelect(unit)
              onClose()
            }}
          >
            {unit}
          </button>
        ))}
      </div>
    </Modal>
  )
}
