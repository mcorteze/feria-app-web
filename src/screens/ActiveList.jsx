import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Check,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Circle,
  CheckCircle2,
  Edit2,
  Layers,
  Share2,
  Square,
  Trash2,
} from 'lucide-react'
import ScreenHeader from '../components/layout/ScreenHeader'
import {
  Avatar,
  EmptyState,
  FAB,
  LoadingState,
  Modal,
  Pill,
  QuantityOverlay,
  UnitOverlay,
} from '../components/ui'
import { useAuth } from '../hooks/useAuth'
import { useList } from '../hooks/useList'
import { useListItems } from '../hooks/useListItems'
import { useStalls } from '../hooks/useStalls'
import {
  completeList,
  deleteList,
  renameList,
} from '../services/listsRepository'
import {
  assignItemsToStall,
  deleteItem,
  markItemBought,
  updateItem,
} from '../services/itemsRepository'
import {
  createStall,
  deleteStall,
  swapStallOrder,
} from '../services/stallsRepository'
import { formatCurrency, formatDateTime } from '../utils/format'
import '../styles/screen.css'
import './ActiveList.css'

function getRole(list, uid) {
  return list?.collaborators?.find((c) => c.uid === uid)?.role
}

function groupByStall(items) {
  const groups = new Map()
  groups.set('__general__', { stallId: null, stallName: 'General', items: [] })
  for (const item of items) {
    const key = item.stallId || '__general__'
    if (!groups.has(key)) {
      groups.set(key, { stallId: item.stallId, stallName: item.stallName || 'General', items: [] })
    }
    groups.get(key).items.push(item)
  }
  const general = groups.get('__general__')
  groups.delete('__general__')
  const rest = Array.from(groups.values()).sort((a, b) =>
    a.stallName.localeCompare(b.stallName),
  )
  return general.items.length ? [general, ...rest] : rest
}

export default function ActiveList() {
  const { listId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: list, loading: listLoading } = useList(listId)
  const { data: items, loading: itemsLoading } = useListItems(listId)
  const { data: stalls } = useStalls()

  const [renameOpen, setRenameOpen] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [shareOpen, setShareOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [buyItem, setBuyItem] = useState(null)
  const [editItem, setEditItem] = useState(null)
  const [isOrganizing, setIsOrganizing] = useState(false)
  const [selectedForGroup, setSelectedForGroup] = useState(new Set())
  const [assignModalOpen, setAssignModalOpen] = useState(false)

  const role = getRole(list, user?.uid)
  const isReadOnly = list?.status === 'completed'
  const isShoppingMode = role === 'buyer' && !isReadOnly
  const isPlanningMode = role === 'planner' && !isReadOnly

  const grouped = useMemo(() => groupByStall(items), [items])

  function goHome() {
    navigate(role === 'buyer' ? '/buyer' : '/planner', { replace: true })
  }

  function toggleOrganizing() {
    setIsOrganizing((v) => !v)
    setSelectedForGroup(new Set())
  }

  function toggleSelection(itemId) {
    setSelectedForGroup((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return next
    })
  }

  async function handleDeleteStall(stallId, stallItems) {
    await assignItemsToStall(listId, stallItems.map((i) => i.id), null)
    await deleteStall(stallId)
  }

  async function handleMoveStall(stallId, direction) {
    const idx = stalls.findIndex((s) => s.id === stallId)
    const neighborIdx = idx + direction
    if (idx === -1 || neighborIdx < 0 || neighborIdx >= stalls.length) return
    await swapStallOrder(stalls[idx], stalls[neighborIdx])
  }

  async function handleCreateAndAssign(name) {
    const stallId = await createStall(
      name || `Puesto ${stalls.length + 1}`,
      user.uid,
      stalls.length,
    )
    await assignItemsToStall(listId, Array.from(selectedForGroup), { id: stallId, name })
    setSelectedForGroup(new Set())
    setAssignModalOpen(false)
  }

  async function handleAssignToExisting(stall) {
    await assignItemsToStall(listId, Array.from(selectedForGroup), stall)
    setSelectedForGroup(new Set())
    setAssignModalOpen(false)
  }

  async function handleRename(e) {
    e.preventDefault()
    if (!nameDraft.trim()) return
    await renameList(listId, nameDraft.trim())
    setRenameOpen(false)
  }

  async function handleDelete() {
    await deleteList(listId)
    setDeleteOpen(false)
    goHome()
  }

  async function handleRemoveItem(itemId) {
    await deleteItem(listId, itemId)
  }

  async function handleConfirmBuy(quantity, paidPrice) {
    if (!buyItem) return
    await markItemBought(listId, buyItem.id, { quantity, paidPrice })
    const remaining = items.filter((i) => i.id !== buyItem.id && !i.isBought)
    if (remaining.length === 0) {
      const total =
        items
          .filter((i) => i.id !== buyItem.id)
          .reduce((sum, i) => sum + (Number(i.paidPrice) || 0), 0) +
        Number(paidPrice || 0)
      await completeList(listId, total)
    }
    setBuyItem(null)
  }

  if (listLoading) {
    return (
      <div className="screen">
        <LoadingState />
      </div>
    )
  }

  if (!list) {
    return (
      <div className="screen">
        <ScreenHeader title="Lista no encontrada" onBack={goHome} />
        <div className="screen-content">
          <EmptyState title="Esta lista ya no existe" />
        </div>
      </div>
    )
  }

  const total = items.reduce((sum, i) => sum + (Number(i.paidPrice) || 0), 0)

  return (
    <div className="screen">
      <ScreenHeader
        title={list.name}
        onBack={goHome}
        onTitleClick={
          isPlanningMode
            ? () => {
                setNameDraft(list.name)
                setRenameOpen(true)
              }
            : undefined
        }
        actions={
          <>
            {isShoppingMode ? (
              <button
                type="button"
                className={`screen-header__icon-btn screen-header__icon-btn--ghost ${isOrganizing ? 'screen-header__icon-btn--active' : ''}`}
                onClick={toggleOrganizing}
                aria-label="Organizar puestos"
                title="Organizar"
              >
                <Layers size={22} />
              </button>
            ) : null}
            <button
              type="button"
              className="screen-header__icon-btn screen-header__icon-btn--ghost"
              onClick={() => setShareOpen(true)}
              aria-label="Compartir"
            >
              <Share2 size={22} />
            </button>
            {isPlanningMode ? (
              <button
                type="button"
                className="screen-header__icon-btn screen-header__icon-btn--ghost"
                onClick={() => setDeleteOpen(true)}
                aria-label="Eliminar lista"
              >
                <Trash2 size={22} />
              </button>
            ) : null}
          </>
        }
      />

      <div className="active-list-group-bar">
        <span className="avatar-stack">
          {(list.collaborators || []).map((c) => (
            <Avatar key={c.uid} photoURL={c.photoURL} name={c.displayName} size={24} />
          ))}
        </span>
        <span className="active-list-group-bar__meta">
          {(list.collaborators || []).length} colaborador(es) · {formatDateTime(list.createdAt)}
        </span>
      </div>

      <div className="screen-content">
        {isReadOnly ? (
          <div className="active-list-summary-banner">
            <Pill variant="success">Finalizada</Pill>
            <span className="active-list-summary-total">
              Total gastado: {formatCurrency(list.totalSpent)}
            </span>
          </div>
        ) : null}

        {!isReadOnly && role === 'buyer' ? (
          <div className="active-list-summary-banner">
            <span className="active-list-summary-total">
              Total: {formatCurrency(total)}
            </span>
          </div>
        ) : null}

        {itemsLoading ? (
          <LoadingState />
        ) : items.length === 0 ? (
          <EmptyState
            title="Sin productos aún"
            message={
              isPlanningMode
                ? 'Agrega productos con el botón +'
                : 'El planificador aún no agrega productos.'
            }
          />
        ) : isShoppingMode ? (
          <div className="active-list-groups">
            {grouped.map((group, groupIdx) => {
              const pending = group.items.filter((i) => !i.isBought)
              const allBought = pending.length === 0
              const stallIdx = group.stallId ? stalls.findIndex((s) => s.id === group.stallId) : -1
              return (
                <div key={group.stallName} className="stall-group">
                  <div
                    className={`stall-group__header ${allBought ? 'stall-group__header--done' : 'stall-group__header--pending'}`}
                  >
                    <span className="stall-group__title">
                      {isOrganizing && group.stallId ? (
                        <button
                          type="button"
                          className="stall-group__reorder-btn"
                          onClick={() => handleDeleteStall(group.stallId, group.items)}
                          aria-label="Eliminar puesto"
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : null}
                      <span>{group.stallName}</span>
                    </span>
                    {isOrganizing && group.stallId ? (
                      <span className="stall-group__header-actions">
                        <button
                          type="button"
                          className="stall-group__reorder-btn"
                          onClick={() => handleMoveStall(group.stallId, -1)}
                          disabled={stallIdx <= 0}
                          aria-label="Subir puesto"
                        >
                          <ChevronUp size={16} />
                        </button>
                        <button
                          type="button"
                          className="stall-group__reorder-btn"
                          onClick={() => handleMoveStall(group.stallId, 1)}
                          disabled={stallIdx === -1 || stallIdx >= stalls.length - 1}
                          aria-label="Bajar puesto"
                        >
                          <ChevronDown size={16} />
                        </button>
                      </span>
                    ) : (
                      <span className="stall-group__count">
                        {group.items.length - pending.length}/{group.items.length}
                      </span>
                    )}
                  </div>
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`item-row ${item.isBought ? 'item-row--bought' : ''} ${buyItem?.id === item.id ? 'item-row--active' : ''}`}
                      onClick={() =>
                        isOrganizing ? toggleSelection(item.id) : !item.isBought && setBuyItem(item)
                      }
                    >
                      {isOrganizing ? (
                        selectedForGroup.has(item.id) ? (
                          <CheckSquare size={22} className="item-row__check item-row__check--done" />
                        ) : (
                          <Square size={22} className="item-row__check" />
                        )
                      ) : item.isBought ? (
                        <CheckCircle2 size={22} className="item-row__check item-row__check--done" />
                      ) : (
                        <Circle size={22} className="item-row__check" />
                      )}
                      <span className="item-row__body">
                        <span className="item-row__name">{item.productName}</span>
                        <span className="item-row__meta">
                          {item.quantity} {item.unit}
                          {item.isBought && item.paidPrice != null
                            ? ` · ${formatCurrency(item.paidPrice)}`
                            : ''}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="active-list-plain">
            {items.map((item) => (
              <div key={item.id} className="item-row item-row--plain">
                <span className="item-row__body">
                  <span className="item-row__name">{item.productName}</span>
                  <span className="item-row__meta">
                    {item.quantity} {item.unit}
                    {item.estimatedPrice ? ` · ${formatCurrency(item.estimatedPrice)}` : ''}
                  </span>
                  {item.comment ? (
                    <span className="item-row__comment">{item.comment}</span>
                  ) : null}
                </span>
                {isPlanningMode ? (
                  <span className="item-row__actions">
                    <button
                      type="button"
                      className="screen-header__icon-btn screen-header__icon-btn--ghost"
                      onClick={() => setEditItem(item)}
                      aria-label="Editar"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      type="button"
                      className="screen-header__icon-btn screen-header__icon-btn--ghost"
                      onClick={() => handleRemoveItem(item.id)}
                      aria-label="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      {isPlanningMode ? (
        <FAB onClick={() => navigate(`/list/${listId}/add-product`)} />
      ) : null}

      {isOrganizing && selectedForGroup.size > 0 ? (
        <div className="organize-bar">
          <span>
            <span className="organize-bar__count">{selectedForGroup.size} seleccionados</span>
            <span className="organize-bar__hint"> · Agrúpalos en un puesto</span>
          </span>
          <button type="button" className="btn btn-primary" onClick={() => setAssignModalOpen(true)}>
            Agregar a Grupo
          </button>
        </div>
      ) : null}

      <AssignStallModal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        stalls={stalls}
        listItems={items}
        onCreateAndAssign={handleCreateAndAssign}
        onAssignToExisting={handleAssignToExisting}
      />

      <Modal open={renameOpen} onClose={() => setRenameOpen(false)} title="Renombrar lista">
        <form className="form-field" onSubmit={handleRename}>
          <input
            className="form-input"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            autoFocus
          />
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setRenameOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={!nameDraft.trim()}>
              Guardar
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={shareOpen} onClose={() => setShareOpen(false)} title="Compartir lista">
        <p className="share-instructions">
          Comparte este código con quien vaya a comprar. Debe pegarlo en
          "Unirse a Lista" desde su perfil de Comprador.
        </p>
        <div className="share-code">{listId}</div>

        <div className="share-group">
          <span className="form-label">En este grupo</span>
          <div className="share-group__list">
            {(list.collaborators || []).map((c) => (
              <div key={c.uid} className="share-group__row">
                <Avatar photoURL={c.photoURL} name={c.displayName} size={26} />
                <span className="share-group__name">{c.displayName || 'Sin nombre'}</span>
                <Pill variant={c.role === 'planner' ? 'success' : 'info'}>
                  {c.role === 'planner' ? 'Planificador' : 'Comprador'}
                </Pill>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigator.clipboard?.writeText(listId)}
        >
          Copiar código
        </button>
      </Modal>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Eliminar lista">
        <p>¿Seguro que quieres eliminar esta lista? Esta acción no se puede deshacer.</p>
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setDeleteOpen(false)}>
            Cancelar
          </button>
          <button type="button" className="btn btn-danger" onClick={handleDelete}>
            Eliminar
          </button>
        </div>
      </Modal>

      <BuyItemModal item={buyItem} onClose={() => setBuyItem(null)} onConfirm={handleConfirmBuy} />

      <EditItemModal
        item={editItem}
        onClose={() => setEditItem(null)}
        onSave={async (changes) => {
          if (!editItem) return
          await updateItem(listId, editItem.id, changes)
          setEditItem(null)
        }}
      />
    </div>
  )
}

function BuyItemModal({ item, onClose, onConfirm }) {
  const [quantity, setQuantity] = useState(1)
  const [paidPrice, setPaidPrice] = useState('')
  const [quantityOverlayOpen, setQuantityOverlayOpen] = useState(false)

  useEffect(() => {
    if (item) {
      setQuantity(item.quantity || 1)
      setPaidPrice(item.estimatedPrice ? String(item.estimatedPrice) : '')
    }
  }, [item])

  if (!item) return null

  return (
    <Modal open={Boolean(item)} onClose={onClose} title={`Comprar: ${item.productName}`}>
      <div className="form-field">
        <span className="form-label">Cantidad</span>
        <button
          type="button"
          className="form-input selection-trigger"
          onClick={() => setQuantityOverlayOpen(true)}
        >
          {quantity} {item.unit}
        </button>
      </div>
      <div className="form-field">
        <label className="form-label" htmlFor="paid-price">
          Precio pagado
        </label>
        <input
          id="paid-price"
          className="form-input"
          type="number"
          min="0"
          inputMode="numeric"
          value={paidPrice}
          onChange={(e) => setPaidPrice(e.target.value)}
          autoFocus
        />
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancelar
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => onConfirm(quantity, Number(paidPrice) || 0)}
        >
          <Check size={18} /> Confirmar
        </button>
      </div>
      <QuantityOverlay
        open={quantityOverlayOpen}
        value={quantity}
        onSelect={setQuantity}
        onClose={() => setQuantityOverlayOpen(false)}
      />
    </Modal>
  )
}

function EditItemModal({ item, onClose, onSave }) {
  const [quantity, setQuantity] = useState(1)
  const [unit, setUnit] = useState('un')
  const [estimatedPrice, setEstimatedPrice] = useState('')
  const [comment, setComment] = useState('')
  const [quantityOverlayOpen, setQuantityOverlayOpen] = useState(false)
  const [unitOverlayOpen, setUnitOverlayOpen] = useState(false)

  useEffect(() => {
    if (item) {
      setQuantity(item.quantity || 1)
      setUnit(item.unit || 'un')
      setEstimatedPrice(item.estimatedPrice ? String(item.estimatedPrice) : '')
      setComment(item.comment || '')
    }
  }, [item])

  if (!item) return null

  return (
    <Modal open={Boolean(item)} onClose={onClose} title={`Editar: ${item.productName}`}>
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
        <label className="form-label" htmlFor="estimated-price">
          Precio estimado
        </label>
        <input
          id="estimated-price"
          className="form-input"
          type="number"
          min="0"
          inputMode="numeric"
          value={estimatedPrice}
          onChange={(e) => setEstimatedPrice(e.target.value)}
        />
      </div>
      <div className="form-field">
        <label className="form-label" htmlFor="comment">
          Comentario
        </label>
        <input
          id="comment"
          className="form-input"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancelar
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() =>
            onSave({
              quantity,
              unit,
              estimatedPrice: Number(estimatedPrice) || 0,
              comment,
            })
          }
        >
          Guardar
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
    </Modal>
  )
}

function AssignStallModal({
  open,
  onClose,
  stalls,
  listItems,
  onCreateAndAssign,
  onAssignToExisting,
}) {
  const [nameDraft, setNameDraft] = useState('')

  function itemsForStall(stallId) {
    return listItems.filter((i) => i.stallId === stallId)
  }

  const noStallIsEmpty =
    stalls.length === 0 || stalls.every((s) => itemsForStall(s.id).length > 0)

  function handleClose() {
    setNameDraft('')
    onClose?.()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Asignar a puesto">
      {noStallIsEmpty ? (
        <div className="assign-stall-card">
          <div className="form-field">
            <label className="form-label" htmlFor="new-stall-name">
              Nuevo grupo
            </label>
            <input
              id="new-stall-name"
              className="form-input"
              placeholder="Nombre del puesto"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              onCreateAndAssign(nameDraft.trim())
              setNameDraft('')
            }}
          >
            Crear
          </button>
        </div>
      ) : null}

      {stalls.length > 0 ? (
        <p className="screen-section-title">Grupos existentes ({stalls.length})</p>
      ) : null}

      {stalls.map((stall) => {
        const stallItems = itemsForStall(stall.id)
        const preview = stallItems.slice(0, 3).map((i) => i.productName)
        const extra = stallItems.length - preview.length
        return (
          <button
            key={stall.id}
            type="button"
            className="assign-stall-card"
            onClick={() => onAssignToExisting(stall)}
          >
            <div className="list-card-row">
              <span className="list-card-name">{stall.name}</span>
              <span className="list-card-meta">
                {stallItems.length === 0 ? '(Vacío - Usar este)' : '(Mover aquí)'}
              </span>
            </div>
            {preview.length > 0 ? (
              <p className="assign-stall-card__preview">
                {preview.join(', ')}
                {extra > 0 ? ` ...y ${extra} más` : ''}
              </p>
            ) : null}
          </button>
        )
      })}
    </Modal>
  )
}
