import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import ScreenHeader from '../components/layout/ScreenHeader'
import { Card, EmptyState, LoadingState, QuantityOverlay, UnitOverlay } from '../components/ui'
import { useProducts } from '../hooks/useProducts'
import { createProduct } from '../services/productsRepository'
import { addItem } from '../services/itemsRepository'
import { useAuth } from '../hooks/useAuth'
import { formatCurrency } from '../utils/format'
import '../styles/screen.css'
import './ProductSelection.css'

export default function ProductSelection() {
  const { listId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: products, loading } = useProducts()
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [saving, setSaving] = useState(false)

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return products
    return products.filter((p) => p.name.toLowerCase().includes(term))
  }, [products, search])

  const grouped = useMemo(() => {
    const groups = new Map()
    for (const product of filtered) {
      const letter = product.name.charAt(0).toUpperCase()
      if (!groups.has(letter)) groups.set(letter, [])
      groups.get(letter).push(product)
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [filtered])

  const hasExactMatch = filtered.some(
    (p) => p.name.toLowerCase() === search.trim().toLowerCase(),
  )

  async function handleAddItem(product, details) {
    setSaving(true)
    try {
      await addItem(listId, {
        productId: product.id,
        productName: product.name,
        quantity: details.quantity,
        unit: details.unit,
        estimatedPrice: details.estimatedPrice,
        comment: details.comment,
        stallId: product.stallId,
        stallName: product.stallName,
      })
      setExpandedId(null)
      navigate(`/list/${listId}`)
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateAndAdd() {
    if (!search.trim() || !user) return
    setSaving(true)
    try {
      const productId = await createProduct(
        { name: search.trim(), defaultUnit: 'un' },
        user.uid,
      )
      await addItem(listId, {
        productId,
        productName: search.trim(),
        quantity: 1,
        unit: 'un',
        estimatedPrice: 0,
        comment: '',
        stallId: null,
        stallName: '',
      })
      navigate(`/list/${listId}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="screen">
      <ScreenHeader title="Agregar producto" onBack={() => navigate(`/list/${listId}`)} />

      <div className="screen-content">
        <div className="search-bar">
          <Search size={19} className="search-bar__icon" />
          <input
            className="search-bar__input"
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        {search.trim() && !hasExactMatch ? (
          <button type="button" className="create-product-btn" onClick={handleCreateAndAdd} disabled={saving}>
            <Plus size={18} /> Crear "{search.trim()}"
          </button>
        ) : null}

        {loading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <EmptyState title="Sin resultados" message="Prueba con otro nombre o créalo." />
        ) : (
          <div className="product-groups">
            {grouped.map(([letter, group]) => (
              <div key={letter} className="product-group">
                <p className="screen-section-title">{letter}</p>
                {group.map((product) => (
                  <ProductPickRow
                    key={product.id}
                    product={product}
                    expanded={expandedId === product.id}
                    onToggle={() =>
                      setExpandedId(expandedId === product.id ? null : product.id)
                    }
                    onAdd={(details) => handleAddItem(product, details)}
                    saving={saving}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ProductPickRow({ product, expanded, onToggle, onAdd, saving }) {
  const [quantity, setQuantity] = useState(1)
  const [unit, setUnit] = useState(product.defaultUnit || 'un')
  const [estimatedPrice, setEstimatedPrice] = useState(
    product.lastPrice ? String(product.lastPrice) : '',
  )
  const [comment, setComment] = useState('')
  const [quantityOverlayOpen, setQuantityOverlayOpen] = useState(false)
  const [unitOverlayOpen, setUnitOverlayOpen] = useState(false)

  return (
    <Card className="product-pick-row">
      <button type="button" className="product-pick-row__header" onClick={onToggle}>
        <span className="product-pick-row__name">{product.name}</span>
        {product.lastPrice ? (
          <span className="product-pick-row__price">{formatCurrency(product.lastPrice)}</span>
        ) : null}
      </button>

      {expanded ? (
        <div className="product-pick-row__form">
          <div className="form-row">
            <div className="form-field">
              <span className="form-label">Cantidad</span>
              <button
                type="button"
                className="form-input selection-trigger"
                onClick={() => setQuantityOverlayOpen(true)}
              >
                {quantity}
              </button>
            </div>
            <div className="form-field">
              <span className="form-label">Unidad</span>
              <button
                type="button"
                className="form-input selection-trigger"
                onClick={() => setUnitOverlayOpen(true)}
              >
                {unit}
              </button>
            </div>
          </div>
          <div className="form-field">
            <span className="form-label">Precio estimado</span>
            <input
              className="form-input"
              type="number"
              min="0"
              inputMode="numeric"
              value={estimatedPrice}
              onChange={(e) => setEstimatedPrice(e.target.value)}
            />
          </div>
          <div className="form-field">
            <span className="form-label">Comentario</span>
            <input
              className="form-input"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onToggle}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={saving}
              onClick={() =>
                onAdd({
                  quantity,
                  unit,
                  estimatedPrice: Number(estimatedPrice) || 0,
                  comment,
                })
              }
            >
              Agregar
            </button>
          </div>
          <QuantityOverlay
            open={quantityOverlayOpen}
            value={quantity}
            onSelect={setQuantity}
            onClose={() => setQuantityOverlayOpen(false)}
          />
          <UnitOverlay
            open={unitOverlayOpen}
            value={unit}
            onSelect={setUnit}
            onClose={() => setUnitOverlayOpen(false)}
          />
        </div>
      ) : null}
    </Card>
  )
}
