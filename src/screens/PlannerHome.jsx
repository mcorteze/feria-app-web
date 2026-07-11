import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeftRight,
  ClipboardList,
  History as HistoryIcon,
  Plus,
  ShoppingBasket,
} from 'lucide-react'
import ScreenHeader from '../components/layout/ScreenHeader'
import {
  Avatar,
  Card,
  EmptyState,
  GuideCard,
  HeroButton,
  LoadingState,
  Modal,
  Pill,
} from '../components/ui'
import { useAuth } from '../hooks/useAuth'
import { useLists } from '../hooks/useLists'
import { useProducts } from '../hooks/useProducts'
import { createList } from '../services/listsRepository'
import { formatDateTime, formatShortDate } from '../utils/format'
import '../styles/screen.css'
import '../styles/listCard.css'

const CATALOG_HINT_DISMISSED_KEY = 'feria-app:catalogHintDismissed'

export default function PlannerHome() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: lists, loading } = useLists(user?.uid, 'planner')
  const { data: products, loading: productsLoading } = useProducts()
  const [modalOpen, setModalOpen] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [creating, setCreating] = useState(false)
  const [hintDismissed, setHintDismissed] = useState(
    () => localStorage.getItem(CATALOG_HINT_DISMISSED_KEY) === '1',
  )

  function dismissHint() {
    localStorage.setItem(CATALOG_HINT_DISMISSED_KEY, '1')
    setHintDismissed(true)
  }

  const showCatalogHint =
    !hintDismissed && !productsLoading && products.length === 0

  function openModal() {
    setNameDraft(`Feria ${formatShortDate(new Date())}`)
    setModalOpen(true)
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!nameDraft.trim() || !user) return
    setCreating(true)
    try {
      const listId = await createList(nameDraft.trim(), {
        uid: user.uid,
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
      })
      setModalOpen(false)
      navigate(`/list/${listId}`)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="screen">
      <ScreenHeader
        title="Planificador"
        actions={
          <>
            <button
              type="button"
              className="screen-header__icon-btn screen-header__icon-btn--ghost"
              onClick={() => navigate('/products')}
              aria-label="Catálogo de productos"
              title="Catálogo de productos"
            >
              <ShoppingBasket size={20} />
            </button>
            <button
              type="button"
              className="screen-header__icon-btn screen-header__icon-btn--ghost"
              onClick={() => navigate('/history')}
              aria-label="Historial de compras"
              title="Historial"
            >
              <HistoryIcon size={20} />
            </button>
            <button
              type="button"
              className="screen-header__icon-btn screen-header__icon-btn--ghost"
              onClick={() => navigate('/')}
              aria-label="Cambiar de rol"
              title="Cambiar de rol"
            >
              <ArrowLeftRight size={20} />
            </button>
          </>
        }
      />

      <div className="screen-content">
        {showCatalogHint ? (
          <GuideCard
            icon={ShoppingBasket}
            title="Tu catálogo está vacío"
            message="Carga los productos comunes de feria para agregarlos más rápido a tus listas."
            actionLabel="Ir al catálogo"
            onAction={() => navigate('/products')}
            onDismiss={dismissHint}
          />
        ) : null}

        <HeroButton icon={Plus} label="Nueva Lista" variant="brand" onClick={openModal} />

        <p className="screen-section-title">Mis listas</p>

        {loading ? (
          <LoadingState />
        ) : lists.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Sin listas todavía"
            message="Crea tu primera lista de compras para una feria."
            actionLabel="Nueva Lista"
            onAction={openModal}
          />
        ) : (
          <div className="list-collection">
            {lists.map((list) => (
              <Card key={list.id} onClick={() => navigate(`/list/${list.id}`)}>
                <div className="list-card-row">
                  <span className="list-card-name">{list.name}</span>
                  <Pill variant={list.status === 'completed' ? 'success' : 'pending'}>
                    {list.status === 'completed' ? 'Finalizada' : 'Pendiente'}
                  </Pill>
                </div>
                <div className="list-card-row">
                  <span className="list-card-meta">{formatDateTime(list.createdAt)}</span>
                  <span className="avatar-stack">
                    {(list.collaborators || []).slice(0, 4).map((c) => (
                      <Avatar key={c.uid} photoURL={c.photoURL} name={c.displayName} size={22} />
                    ))}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva lista">
        <form className="form-field" onSubmit={handleCreate}>
          <label className="form-label" htmlFor="list-name">
            Nombre de la lista
          </label>
          <input
            id="list-name"
            className="form-input"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            autoFocus
          />
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!nameDraft.trim() || creating}
            >
              {creating ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
