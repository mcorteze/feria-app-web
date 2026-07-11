import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ShoppingBag, ShoppingCart, Trash2 } from 'lucide-react'
import ScreenHeader from '../components/layout/ScreenHeader'
import {
  Avatar,
  Card,
  EmptyState,
  HeroButton,
  LoadingState,
  Modal,
  Pill,
} from '../components/ui'
import { useAuth } from '../hooks/useAuth'
import { useLists } from '../hooks/useLists'
import { deleteList, joinListAsBuyer } from '../services/listsRepository'
import { formatDateTime } from '../utils/format'
import { setLastRole } from '../utils/lastRole'
import '../styles/screen.css'
import '../styles/listCard.css'

export default function BuyerHome() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { data: lists, loading } = useLists(user?.uid, 'buyer')
  const [modalOpen, setModalOpen] = useState(false)
  const [listIdDraft, setListIdDraft] = useState('')
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)

  useEffect(() => {
    setLastRole('buyer')
  }, [])

  function openJoinModal() {
    setError('')
    setListIdDraft('')
    setModalOpen(true)
  }

  useEffect(() => {
    if (location.state?.openCreate) {
      openJoinModal()
      navigate(location.pathname, { replace: true, state: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state])

  async function handleJoin(e) {
    e.preventDefault()
    if (!listIdDraft.trim() || !user) return
    setJoining(true)
    setError('')
    try {
      const listId = await joinListAsBuyer(listIdDraft.trim(), user)
      setModalOpen(false)
      navigate(`/list/${listId}`)
    } catch {
      setError('No se encontró la lista. Revisa el código.')
    } finally {
      setJoining(false)
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    await deleteList(pendingDelete)
    setPendingDelete(null)
  }

  return (
    <div className="screen">
      <ScreenHeader title="Comprador" onBack={() => navigate('/home')} />

      <div className="screen-content">
        <HeroButton
          icon={ShoppingCart}
          label="Unirse a Lista"
          variant="buyer"
          onClick={openJoinModal}
        />

        <p className="screen-section-title">Mis compras</p>

        {loading ? (
          <LoadingState />
        ) : lists.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="Aún no te unes a ninguna lista"
            message="Pide el código de invitación al planificador."
            actionLabel="Unirse a Lista"
            onAction={() => setModalOpen(true)}
          />
        ) : (
          <div className="list-collection">
            {lists.map((list) => {
              const planner = list.collaborators?.find((c) => c.role === 'planner')
              return (
                <Card key={list.id} onClick={() => navigate(`/list/${list.id}`)}>
                  <div className="list-card-row">
                    <span className="list-card-name">{list.name}</span>
                    <Pill variant={list.status === 'completed' ? 'success' : 'pending'}>
                      {list.status === 'completed' ? 'Finalizada' : 'Pendiente'}
                    </Pill>
                  </div>
                  <div className="list-card-row">
                    <span className="list-card-creator">
                      <Avatar
                        photoURL={planner?.photoURL}
                        name={planner?.displayName}
                        size={22}
                      />
                      <span className="list-card-meta">
                        {planner?.displayName || 'Planificador'} · {formatDateTime(list.createdAt)}
                      </span>
                    </span>
                    <button
                      type="button"
                      className="list-card-delete"
                      onClick={(e) => {
                        e.stopPropagation()
                        setPendingDelete(list.id)
                      }}
                      aria-label="Eliminar lista"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Unirse a lista">
        <form className="form-field" onSubmit={handleJoin}>
          <label className="form-label" htmlFor="list-id">
            Código de invitación (ID de lista)
          </label>
          <input
            id="list-id"
            className="form-input"
            value={listIdDraft}
            onChange={(e) => setListIdDraft(e.target.value)}
            autoFocus
          />
          {error ? <p className="welcome-error">{error}</p> : null}
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
              disabled={!listIdDraft.trim() || joining}
            >
              {joining ? 'Uniendo...' : 'Unirse'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title="Eliminar lista"
      >
        <p>¿Seguro que quieres eliminar esta lista? Esta acción no se puede deshacer.</p>
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setPendingDelete(null)}
          >
            Cancelar
          </button>
          <button type="button" className="btn btn-danger" onClick={confirmDelete}>
            Eliminar
          </button>
        </div>
      </Modal>
    </div>
  )
}
