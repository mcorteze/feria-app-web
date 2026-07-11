import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layers, Plus, Search } from 'lucide-react'
import ScreenHeader from '../components/layout/ScreenHeader'
import { Card, EmptyState, FAB, LoadingState, Modal, Pill } from '../components/ui'
import { useProducts } from '../hooks/useProducts'
import { useCategories } from '../hooks/useCategories'
import { useStalls } from '../hooks/useStalls'
import { useAuth } from '../hooks/useAuth'
import { createProduct } from '../services/productsRepository'
import { createStall } from '../services/stallsRepository'
import { formatCurrency } from '../utils/format'
import '../styles/screen.css'
import './ProductsCatalog.css'

export default function ProductsCatalog() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: products, loading } = useProducts()
  const { data: categories } = useCategories()
  const { data: stalls } = useStalls()
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  const categoryById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  )

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return products
    return products.filter((p) => p.name.toLowerCase().includes(term))
  }, [products, search])

  return (
    <div className="screen">
      <ScreenHeader title="Catálogo" onBack={() => navigate(-1)} />

      <div className="screen-content">
        <div className="search-bar">
          <Search size={18} className="search-bar__icon" />
          <input
            className="search-bar__input"
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="Catálogo vacío"
            message="Agrega productos para reutilizarlos en tus listas."
            actionLabel="Nuevo producto"
            onAction={() => setModalOpen(true)}
          />
        ) : (
          <div className="catalog-list">
            {filtered.map((product) => {
              const category = categoryById.get(product.categoryId)
              return (
                <Card key={product.id} className="catalog-row">
                  <span
                    className="catalog-avatar"
                    style={{ background: category?.color || '#9E9E9E' }}
                  >
                    {product.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="catalog-info">
                    <span className="catalog-name">{product.name}</span>
                    <span className="catalog-badges">
                      {category ? <Pill variant="neutral">{category.name}</Pill> : null}
                      {product.stallName ? <Pill variant="info">{product.stallName}</Pill> : null}
                    </span>
                  </span>
                  {product.lastPrice ? (
                    <span className="catalog-price">{formatCurrency(product.lastPrice)}</span>
                  ) : null}
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <FAB onClick={() => setModalOpen(true)} icon={Plus} label="Nuevo producto" />

      <NewProductModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        categories={categories}
        stalls={stalls}
        ownerUid={user?.uid}
      />
    </div>
  )
}

function NewProductModal({ open, onClose, categories, stalls, ownerUid }) {
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState(null)
  const [stallId, setStallId] = useState(null)
  const [newStallName, setNewStallName] = useState('')
  const [creatingStall, setCreatingStall] = useState(false)
  const [saving, setSaving] = useState(false)

  function reset() {
    setName('')
    setCategoryId(null)
    setStallId(null)
    setNewStallName('')
    setCreatingStall(false)
  }

  async function handleSave() {
    if (!name.trim() || !ownerUid) return
    setSaving(true)
    try {
      let finalStallId = stallId
      let finalStallName = stalls.find((s) => s.id === stallId)?.name || ''
      if (creatingStall && newStallName.trim()) {
        finalStallId = await createStall(newStallName.trim(), ownerUid)
        finalStallName = newStallName.trim()
      }
      await createProduct(
        {
          name: name.trim(),
          categoryId,
          stallId: finalStallId,
          stallName: finalStallName,
        },
        ownerUid,
      )
      reset()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title="Nuevo producto"
    >
      <div className="form-field">
        <label className="form-label" htmlFor="product-name">
          Nombre
        </label>
        <input
          id="product-name"
          className="form-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>

      <div className="form-field">
        <span className="form-label">Categoría</span>
        <div className="chip-row">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`chip ${categoryId === cat.id ? 'chip--active' : ''}`}
              style={
                categoryId === cat.id
                  ? { background: cat.color, color: '#fff', borderColor: cat.color }
                  : undefined
              }
              onClick={() => setCategoryId(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="form-field">
        <span className="form-label">Puesto</span>
        <div className="chip-row">
          {stalls.map((stall) => (
            <button
              key={stall.id}
              type="button"
              className={`chip ${stallId === stall.id && !creatingStall ? 'chip--active' : ''}`}
              onClick={() => {
                setStallId(stall.id)
                setCreatingStall(false)
              }}
            >
              {stall.name}
            </button>
          ))}
          <button
            type="button"
            className={`chip ${creatingStall ? 'chip--active' : ''}`}
            onClick={() => setCreatingStall(true)}
          >
            + Nuevo puesto
          </button>
        </div>
        {creatingStall ? (
          <input
            className="form-input"
            placeholder="Nombre del puesto"
            value={newStallName}
            onChange={(e) => setNewStallName(e.target.value)}
          />
        ) : null}
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancelar
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!name.trim() || saving}
          onClick={handleSave}
        >
          {saving ? 'Guardando...' : 'Crear'}
        </button>
      </div>
    </Modal>
  )
}
