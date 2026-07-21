import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  CheckSquare,
  ClipboardList,
  Plus,
  ShoppingBasket,
  Square,
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
import { useFrequentCollaborators } from '../hooks/useFrequentCollaborators'
import { useLists } from '../hooks/useLists'
import { useProducts } from '../hooks/useProducts'
import { createList } from '../services/listsRepository'
import { formatDateTime, formatShortDate } from '../utils/format'
import { setLastRole } from '../utils/lastRole'
import '../styles/screen.css'
import '../styles/listCard.css'

const CATALOG_HINT_DISMISSED_KEY = 'feria-app:catalogHintDismissed'

export default function PlannerHome() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { data: lists, loading } = useLists(user?.uid, 'planner')
  const { data: products, loading: productsLoading } = useProducts()
  const { data: frequentCollaborators } = useFrequentCollaborators(user?.uid)
  const [modalOpen, setModalOpen] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [selectedCollaborators, setSelectedCollaborators] = useState([])
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [hintDismissed, setHintDismissed] = useState(
    () => localStorage.getItem(CATALOG_HINT_DISMISSED_KEY) === '1',
  )

  useEffect(() => {
    setLastRole('planner')
  }, [])

  function dismissHint() {
    localStorage.setItem(CATALOG_HINT_DISMISSED_KEY, '1')
    setHintDismissed(true)
  }

  const showCatalogHint =
    !hintDismissed && !productsLoading && products.length === 0

  function openModal() {
    setNameDraft(`Feria ${formatShortDate(new Date())}`)
    setSelectedCollaborators([])
    setCreateError('')
    setModalOpen(true)
  }

  useEffect(() => {
    if (location.state?.openCreate) {
      openModal()
      navigate(location.pathname, { replace: true, state: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state])

  function toggleCollaborator(collaborator) {
    setSelectedCollaborators((prev) =>
      prev.some((c) => c.uid === collaborator.uid)
        ? prev.filter((c) => c.uid !== collaborator.uid)
        : [...prev, collaborator],
    )
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!nameDraft.trim() || !user) return
    setCreating(true)
    setCreateError('')
    try {
      const listId = await createList(
        nameDraft.trim(),
        {
          uid: user.uid,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
        },
        'planner',
        selectedCollaborators,
      )
      setModalOpen(false)
      navigate(`/list/${listId}`)
    } catch (err) {
      setCreateError(err.message || 'No se pudo crear la lista.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="screen">
      <ScreenHeader title="Planificador" onBack={() => navigate('/home')} />

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

          {frequentCollaborators.length > 0 ? (
            <div className="form-field">
              <span className="form-label">Agregar colaboradores habituales</span>
              <div className="collaborator-checklist">
                {frequentCollaborators.map((c) => {
                  const checked = selectedCollaborators.some((s) => s.uid === c.uid)
                  return (
                    <button
                      key={c.id}
                      type="button"
                      className="collaborator-checklist__row"
                      onClick={() => toggleCollaborator(c)}
                    >
                      {checked ? (
                        <CheckSquare size={20} className="item-row__check item-row__check--done" />
                      ) : (
                        <Square size={20} className="item-row__check" />
                      )}
                      <Avatar photoURL={c.photoURL} name={c.displayName} size={24} />
                      <span className="list-card-meta">{c.displayName || c.email}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}

          {createError ? <p className="welcome-error">{createError}</p> : null}

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
