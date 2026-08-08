import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Check,
  CheckSquare,
  Circle,
  CheckCircle2,
  CopyPlus,
  Edit2,
  GripVertical,
  Layers,
  Lock,
  MessageSquare,
  SearchX,
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
  duplicateList,
  renameList,
  splitItemsByOutcome,
} from '../services/listsRepository'
import {
  assignItemsToStall,
  deleteItem,
  markItemBought,
  markItemNotFound,
  updateItem,
} from '../services/itemsRepository'
import {
  createStall,
  deleteStall,
  nextStallName,
  reorderStalls,
} from '../services/stallsRepository'
import { rememberProductStall } from '../services/productsRepository'
import { formatCurrency, formatDateTime, formatShortDate } from '../utils/format'
import { formatListAge, isListExpired, LIST_EDIT_WINDOW_HOURS } from '../utils/listAge'
import '../styles/screen.css'
import './ActiveList.css'

const UNGROUPED_KEY = '__sin-puesto__'

function getRole(list, uid) {
  return list?.collaborators?.find((c) => c.uid === uid)?.role
}

// Arma los grupos de compra a partir de los ítems y del catálogo de puestos.
//
// Dos correcciones respecto de la versión anterior:
//  1. El nombre del puesto se resuelve SIEMPRE desde la colección `stalls` por
//     stallId. Los ítems guardan una copia de `stallName` que puede estar
//     vacía (puestos creados sin nombre) y esa copia vacía era la que hacía
//     aparecer el rótulo "General" en grupos que sí tenían puesto asignado.
//  2. Los grupos se ordenan por `locationOrder` — el orden que mueve el drag &
//     drop — y no alfabéticamente, que era el motivo por el que reordenar
//     puestos no producía ningún cambio visible.
function buildGroups(items, stalls) {
  const stallById = new Map(stalls.map((stall) => [stall.id, stall]))
  const stallOrder = new Map(stalls.map((stall, index) => [stall.id, index]))

  const ungrouped = {
    key: UNGROUPED_KEY,
    stallId: null,
    stallName: 'Sin puesto',
    items: [],
  }
  const groups = new Map()

  for (const item of items) {
    if (!item.stallId) {
      ungrouped.items.push(item)
      continue
    }
    if (!groups.has(item.stallId)) {
      groups.set(item.stallId, {
        key: item.stallId,
        stallId: item.stallId,
        stallName: stallById.get(item.stallId)?.name || item.stallName || 'Puesto',
        items: [],
      })
    }
    groups.get(item.stallId).items.push(item)
  }

  const ordered = Array.from(groups.values()).sort(
    (a, b) =>
      (stallOrder.get(a.stallId) ?? Number.MAX_SAFE_INTEGER) -
      (stallOrder.get(b.stallId) ?? Number.MAX_SAFE_INTEGER),
  )
  const all = ungrouped.items.length > 0 ? [ungrouped, ...ordered] : ordered

  // Dentro de cada grupo, lo resuelto baja al final. Un grupo cuyos ítems
  // están todos resueltos sale del muro de pendientes y pasa a la sección
  // apagada del pie.
  const activeGroups = []
  const doneGroups = []
  for (const group of all) {
    const pending = group.items.filter((item) => !item.isBought)
    const resolved = group.items.filter((item) => item.isBought)
    const entry = { ...group, items: [...pending, ...resolved], pendingCount: pending.length }
    if (pending.length === 0) doneGroups.push(entry)
    else activeGroups.push(entry)
  }

  return { activeGroups, doneGroups }
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
  const [renewOpen, setRenewOpen] = useState(false)
  const [renewing, setRenewing] = useState(false)
  const [renewError, setRenewError] = useState('')
  const [buyItem, setBuyItem] = useState(null)
  const [editItem, setEditItem] = useState(null)
  const [isOrganizing, setIsOrganizing] = useState(false)
  const [selectedForGroup, setSelectedForGroup] = useState(new Set())
  const [assignModalOpen, setAssignModalOpen] = useState(false)

  const role = getRole(list, user?.uid)
  const isReadOnly = list?.status === 'completed'
  const isExpired = isListExpired(list)
  const isShoppingMode = role === 'buyer' && !isReadOnly
  // El bloqueo por antigüedad frena la edición estructural del planificador,
  // no la compra: si el comprador sale a la feria al cuarto día tiene que
  // poder marcar productos y cerrar la lista igual.
  const isPlanningMode = role === 'planner' && !isReadOnly && !isExpired
  const isPlannerOwner = role === 'planner' && !isReadOnly

  const { activeGroups, doneGroups } = useMemo(
    () => buildGroups(items, stalls),
    [items, stalls],
  )
  const sortableIds = useMemo(
    () => activeGroups.filter((group) => group.stallId).map((group) => group.key),
    [activeGroups],
  )
  const doneCount = useMemo(
    () => doneGroups.reduce((sum, group) => sum + group.items.length, 0),
    [doneGroups],
  )

  const sensors = useSensors(
    // Un umbral de 6px evita que un toque para seleccionar un ítem se
    // interprete como inicio de arrastre en pantallas táctiles.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

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

  // El arrastre solo ve los puestos con ítems pendientes, pero locationOrder es
  // global: se aplica el movimiento sobre la lista COMPLETA de puestos para no
  // pisar el orden de los que no están en pantalla.
  async function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return
    const oldIndex = stalls.findIndex((stall) => stall.id === active.id)
    const newIndex = stalls.findIndex((stall) => stall.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const orderedIds = arrayMove(stalls, oldIndex, newIndex).map((stall) => stall.id)
    await reorderStalls(orderedIds)
  }

  // Productos detrás de los ítems seleccionados, para llevar la agrupación al
  // catálogo además de a esta lista.
  function selectedProductIds() {
    return items.filter((i) => selectedForGroup.has(i.id)).map((i) => i.productId)
  }

  async function handleDeleteStall(stallId, stallItems) {
    await assignItemsToStall(listId, stallItems.map((i) => i.id), null)
    // El puesto deja de existir: hay que olvidarlo también en el catálogo, o
    // los productos seguirían apuntando a un puesto borrado y las listas
    // siguientes nacerían con un grupo fantasma.
    await rememberProductStall(stallItems.map((i) => i.productId), null)
    await deleteStall(stallId)
  }

  async function handleCreateAndAssign(name) {
    // El nombre por defecto tiene que propagarse tanto al puesto como a los
    // ítems. Antes solo se le pasaba a createStall y los ítems quedaban con
    // stallName vacío, que se renderizaba como "General".
    const stallName = name?.trim() || nextStallName(stalls)
    const stallId = await createStall(stallName, user.uid, stalls.length)
    const stall = { id: stallId, name: stallName }
    const productIds = selectedProductIds()
    await assignItemsToStall(listId, Array.from(selectedForGroup), stall)
    await rememberProductStall(productIds, stall)
    setSelectedForGroup(new Set())
    setAssignModalOpen(false)
  }

  async function handleAssignToExisting(stall) {
    const productIds = selectedProductIds()
    await assignItemsToStall(listId, Array.from(selectedForGroup), stall)
    await rememberProductStall(productIds, stall)
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

  async function handleRenew({ name, includeBought, includeNotFound }) {
    if (!user || !list) return
    setRenewing(true)
    setRenewError('')
    try {
      const newListId = await duplicateList(
        list,
        items,
        {
          uid: user.uid,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
        },
        { name, includeBought, includeNotFound },
      )
      setRenewOpen(false)
      navigate(`/list/${newListId}`, { replace: true })
    } catch (err) {
      setRenewError(err.message || 'No se pudo crear la lista nueva.')
    } finally {
      setRenewing(false)
    }
  }

  async function handleRemoveItem(itemId) {
    await deleteItem(listId, itemId)
  }

  async function checkAllResolvedAndComplete(excludeId, extraPaid) {
    const remaining = items.filter((i) => i.id !== excludeId && !i.isBought)
    if (remaining.length === 0) {
      const total =
        items
          .filter((i) => i.id !== excludeId)
          .reduce((sum, i) => sum + (Number(i.paidPrice) || 0), 0) + Number(extraPaid || 0)
      await completeList(listId, total)
    }
  }

  async function handleConfirmBuy(quantity, paidPrice) {
    if (!buyItem) return
    await markItemBought(listId, buyItem.id, { quantity, paidPrice })
    await checkAllResolvedAndComplete(buyItem.id, paidPrice)
    setBuyItem(null)
  }

  async function handleConfirmNotFound(comment) {
    if (!buyItem) return
    await markItemNotFound(listId, buyItem.id, comment)
    await checkAllResolvedAndComplete(buyItem.id, 0)
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

  const groupProps = {
    isOrganizing,
    selectedForGroup,
    activeItemId: buyItem?.id,
    onToggleSelection: toggleSelection,
    onPickItem: setBuyItem,
    onDeleteStall: handleDeleteStall,
  }

  return (
    <div className="screen">
      <ScreenHeader
        title={list.name}
        subtitle={role === 'buyer' ? 'Comprador' : 'Planificador'}
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
            {isPlannerOwner ? (
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

      <div className={`screen-content ${!itemsLoading && items.length === 0 ? 'screen-content--centered' : ''}`}>
        {isReadOnly ? (
          <div className="active-list-summary-banner">
            <Pill variant="success">Finalizada</Pill>
            <span className="active-list-summary-total">
              Total gastado: {formatCurrency(list.totalSpent)}
            </span>
          </div>
        ) : null}

        {isExpired && isPlannerOwner ? (
          <div className="list-locked">
            <div className="list-locked__head">
              <Lock size={18} className="list-locked__icon" />
              <p className="list-locked__title">Esta lista ya no se puede editar</p>
            </div>
            <p className="list-locked__text">
              Se creó {formatListAge(list)} y una lista corresponde a una sola feria.
              Después de {LIST_EDIT_WINDOW_HOURS} horas se cierra a cambios, para que
              nadie agregue productos nuevos sobre otros que ya se compraron o se
              marcaron como no encontrados.
            </p>
            <button
              type="button"
              className="btn btn-primary list-locked__action"
              onClick={() => {
                setRenewError('')
                setRenewOpen(true)
              }}
            >
              <CopyPlus size={18} /> Crear lista nueva con estos productos
            </button>
          </div>
        ) : null}

        {isExpired && isShoppingMode ? (
          <p className="list-age-note">
            Esta lista se creó {formatListAge(list)}. El planificador ya no puede
            modificarla, pero puedes terminar de comprarla.
          </p>
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                {activeGroups.map((group) =>
                  group.stallId ? (
                    <SortableStallGroup
                      key={group.key}
                      group={group}
                      {...groupProps}
                    />
                  ) : (
                    <StallGroup key={group.key} group={group} {...groupProps} />
                  ),
                )}
              </SortableContext>
            </DndContext>

            {doneGroups.length > 0 ? (
              <div className="completed-section">
                <div className="completed-section__divider">
                  <span className="completed-section__label">
                    Listo · {doneCount} {doneCount === 1 ? 'producto' : 'productos'}
                  </span>
                </div>
                {doneGroups.map((group) => (
                  <StallGroup key={group.key} group={group} {...groupProps} />
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="active-list-plain">
            {items.map((item) => (
              <div
                key={item.id}
                className={`item-row item-row--plain ${item.isBought ? 'item-row--bought' : ''} ${item.notFound ? 'item-row--not-found' : ''}`}
              >
                {/* El planificador también ve el desenlace de cada producto.
                    Cuando esta vista lo ocultaba, una lista ya comprada se veía
                    idéntica a una lista nueva y se editaba sin advertirlo. */}
                {item.notFound ? (
                  <SearchX size={20} className="item-row__check item-row__check--not-found" />
                ) : item.isBought ? (
                  <CheckCircle2 size={20} className="item-row__check item-row__check--done" />
                ) : (
                  <Circle size={20} className="item-row__check" />
                )}
                <span className="item-row__body">
                  <span className="item-row__name">{item.productName}</span>
                  <span className="item-row__meta">
                    {item.quantity} {item.unit}
                    {item.notFound
                      ? ' · No encontrado'
                      : item.isBought
                        ? ` · Comprado${item.paidPrice != null ? ` en ${formatCurrency(item.paidPrice)}` : ''}`
                        : item.estimatedPrice
                          ? ` · ${formatCurrency(item.estimatedPrice)} est.`
                          : ''}
                  </span>
                  {item.comment ? (
                    <Pill variant="info" icon={MessageSquare}>
                      {item.comment}
                    </Pill>
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

      <RenewListModal
        open={renewOpen}
        onClose={() => setRenewOpen(false)}
        items={items}
        working={renewing}
        error={renewError}
        onConfirm={handleRenew}
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

      <BuyItemModal
        item={buyItem}
        onClose={() => setBuyItem(null)}
        onConfirm={handleConfirmBuy}
        onNotFound={handleConfirmNotFound}
      />

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

function SortableStallGroup(props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.group.key,
  })
  return (
    <StallGroup
      {...props}
      containerRef={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      isDragging={isDragging}
      dragHandleProps={{ ...attributes, ...listeners }}
    />
  )
}

function StallGroup({
  group,
  isOrganizing,
  selectedForGroup,
  activeItemId,
  onToggleSelection,
  onPickItem,
  onDeleteStall,
  containerRef,
  style,
  isDragging,
  dragHandleProps,
}) {
  const isDone = group.pendingCount === 0
  const canOrganize = isOrganizing && Boolean(group.stallId)

  return (
    <div
      ref={containerRef}
      style={style}
      className={`stall-group ${isDragging ? 'stall-group--dragging' : ''}`}
    >
      <div
        className={`stall-group__header ${isDone ? 'stall-group__header--done' : 'stall-group__header--pending'}`}
      >
        <span className="stall-group__title">
          {canOrganize && dragHandleProps ? (
            <button
              type="button"
              className="stall-group__drag-handle"
              aria-label={`Reordenar ${group.stallName}`}
              {...dragHandleProps}
            >
              <GripVertical size={16} />
            </button>
          ) : null}
          <span>{group.stallName}</span>
        </span>
        <span className="stall-group__header-actions">
          <span className="stall-group__count">
            {group.items.length - group.pendingCount}/{group.items.length}
          </span>
          {canOrganize ? (
            <button
              type="button"
              className="stall-group__reorder-btn"
              onClick={() => onDeleteStall(group.stallId, group.items)}
              aria-label={`Eliminar ${group.stallName}`}
            >
              <Trash2 size={16} />
            </button>
          ) : null}
        </span>
      </div>

      {group.items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`item-row ${item.isBought ? 'item-row--bought' : ''} ${item.notFound ? 'item-row--not-found' : ''} ${activeItemId === item.id ? 'item-row--active' : ''}`}
          onClick={() =>
            isOrganizing ? onToggleSelection(item.id) : !item.isBought && onPickItem(item)
          }
        >
          {isOrganizing ? (
            selectedForGroup.has(item.id) ? (
              <CheckSquare size={22} className="item-row__check item-row__check--done" />
            ) : (
              <Square size={22} className="item-row__check" />
            )
          ) : item.notFound ? (
            <SearchX size={22} className="item-row__check item-row__check--not-found" />
          ) : item.isBought ? (
            <CheckCircle2 size={22} className="item-row__check item-row__check--done" />
          ) : (
            <Circle size={22} className="item-row__check" />
          )}
          <span className="item-row__body">
            <span className="item-row__name">{item.productName}</span>
            <span className="item-row__meta">
              {item.quantity} {item.unit}
              {item.notFound
                ? ' · No encontrado'
                : item.isBought && item.paidPrice != null
                  ? ` · ${formatCurrency(item.paidPrice)}`
                  : ''}
            </span>
            {item.comment ? (
              <Pill variant="info" icon={MessageSquare}>
                {item.comment}
              </Pill>
            ) : null}
          </span>
        </button>
      ))}
    </div>
  )
}

function RenewListModal({ open, onClose, items, working, error, onConfirm }) {
  const { pending, bought, notFound } = splitItemsByOutcome(items)
  const [name, setName] = useState('')
  const [includeBought, setIncludeBought] = useState(false)
  // Un producto que no se encontró la vez pasada sigue haciendo falta, así que
  // por defecto se arrastra; uno ya comprado, no.
  const [includeNotFound, setIncludeNotFound] = useState(true)

  useEffect(() => {
    if (!open) return
    setName(`Feria ${formatShortDate(new Date())}`)
    setIncludeBought(false)
    setIncludeNotFound(true)
  }, [open])

  const totalToCopy =
    pending.length + (includeBought ? bought.length : 0) + (includeNotFound ? notFound.length : 0)

  return (
    <Modal open={open} onClose={onClose} title="Crear lista nueva">
      <div className="form-field">
        <label className="form-label" htmlFor="renew-name">
          Nombre de la lista
        </label>
        <input
          id="renew-name"
          className="form-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="form-field">
        <span className="form-label">Qué se copia</span>
        <p className="renew-summary">
          {pending.length} {pending.length === 1 ? 'producto pendiente' : 'productos pendientes'} se
          copian siempre. Los demás quedaron resueltos en la feria anterior:
        </p>

        <div className="collaborator-checklist">
          <button
            type="button"
            className="collaborator-checklist__row"
            onClick={() => setIncludeNotFound((v) => !v)}
            disabled={notFound.length === 0}
          >
            {includeNotFound && notFound.length > 0 ? (
              <CheckSquare size={20} className="item-row__check item-row__check--done" />
            ) : (
              <Square size={20} className="item-row__check" />
            )}
            <span className="renew-option">
              <span className="renew-option__label">
                No encontrados ({notFound.length})
              </span>
              <span className="renew-option__hint">
                No se consiguieron; lo normal es volver a buscarlos.
              </span>
            </span>
          </button>

          <button
            type="button"
            className="collaborator-checklist__row"
            onClick={() => setIncludeBought((v) => !v)}
            disabled={bought.length === 0}
          >
            {includeBought && bought.length > 0 ? (
              <CheckSquare size={20} className="item-row__check item-row__check--done" />
            ) : (
              <Square size={20} className="item-row__check" />
            )}
            <span className="renew-option">
              <span className="renew-option__label">Ya comprados ({bought.length})</span>
              <span className="renew-option__hint">
                Se compraron la vez pasada; se excluyen salvo que los necesites otra vez.
              </span>
            </span>
          </button>
        </div>

        <p className="form-hint">
          Se copian en blanco: ningún producto llega marcado como comprado ni como no
          encontrado.
        </p>
      </div>

      {error ? <p className="welcome-error">{error}</p> : null}

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancelar
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!name.trim() || working}
          onClick={() => onConfirm({ name: name.trim(), includeBought, includeNotFound })}
        >
          {working ? 'Creando...' : `Crear con ${totalToCopy}`}
        </button>
      </div>
    </Modal>
  )
}

function BuyItemModal({ item, onClose, onConfirm, onNotFound }) {
  const [quantity, setQuantity] = useState(1)
  const [paidPrice, setPaidPrice] = useState('')
  const [quantityOverlayOpen, setQuantityOverlayOpen] = useState(false)
  const [notFoundMode, setNotFoundMode] = useState(false)
  const [notFoundComment, setNotFoundComment] = useState('')

  useEffect(() => {
    if (item) {
      setQuantity(item.quantity || 1)
      setPaidPrice(item.estimatedPrice ? String(item.estimatedPrice) : '')
      setNotFoundMode(false)
      setNotFoundComment('')
    }
  }, [item])

  if (!item) return null

  return (
    <Modal open={Boolean(item)} onClose={onClose} title={`Comprar: ${item.productName}`}>
      {notFoundMode ? (
        <>
          <div className="form-field">
            <label className="form-label" htmlFor="not-found-comment">
              ¿Por qué no lo encontraste? (opcional)
            </label>
            <input
              id="not-found-comment"
              className="form-input"
              value={notFoundComment}
              onChange={(e) => setNotFoundComment(e.target.value)}
              placeholder="Ej: no había en el puesto habitual"
              autoFocus
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setNotFoundMode(false)}>
              Volver
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => onNotFound(notFoundComment.trim())}
            >
              <SearchX size={18} /> Marcar no encontrado
            </button>
          </div>
        </>
      ) : (
        <>
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
          <button
            type="button"
            className="not-found-trigger"
            onClick={() => setNotFoundMode(true)}
          >
            <SearchX size={16} /> No lo encontré
          </button>
        </>
      )}
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
  const defaultName = nextStallName(stalls)

  function itemsForStall(stallId) {
    return listItems.filter((i) => i.stallId === stallId)
  }

  function handleClose() {
    setNameDraft('')
    onClose?.()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Asignar a puesto">
      {/* Antes esta tarjeta solo aparecía si no había ningún puesto vacío, lo
          que dejaba sin salida al usuario que quería un puesto nuevo. Ahora
          crear siempre está disponible y el nombre es opcional. */}
      <div className="assign-stall-card">
        <div className="form-field">
          <label className="form-label" htmlFor="new-stall-name">
            Nuevo puesto
          </label>
          <input
            id="new-stall-name"
            className="form-input"
            placeholder={defaultName}
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
          />
          <p className="form-hint">Si lo dejas vacío se llamará "{defaultName}".</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            onCreateAndAssign(nameDraft.trim())
            setNameDraft('')
          }}
        >
          Crear puesto
        </button>
      </div>

      {stalls.length > 0 ? (
        <p className="screen-section-title">Puestos existentes ({stalls.length})</p>
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
