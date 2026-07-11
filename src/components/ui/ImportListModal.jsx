import { useState } from 'react'
import { CheckSquare, Square, Upload } from 'lucide-react'
import Modal from './Modal'
import Avatar from './Avatar'
import { useAuth } from '../../hooks/useAuth'
import { createList, deleteList } from '../../services/listsRepository'
import { addItemsBatch } from '../../services/itemsRepository'
import { findOrCreateProduct } from '../../services/productsRepository'
import { normalizeUnit } from '../../utils/units'
import { parseImportPayload } from '../../utils/importList'

export default function ImportListModal({
  open,
  onClose,
  onImported,
  products,
  role = 'planner',
  frequentCollaborators = [],
}) {
  const { user } = useAuth()
  const [text, setText] = useState('')
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')
  const [selectedCollaborators, setSelectedCollaborators] = useState([])

  function handleClose() {
    setText('')
    setError('')
    setImporting(false)
    setSelectedCollaborators([])
    onClose?.()
  }

  function toggleCollaborator(collaborator) {
    setSelectedCollaborators((prev) =>
      prev.some((c) => c.uid === collaborator.uid)
        ? prev.filter((c) => c.uid !== collaborator.uid)
        : [...prev, collaborator],
    )
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const content = await file.text()
    setText(content)
    e.target.value = ''
  }

  async function handleImport() {
    setError('')
    setImporting(true)
    let listId
    try {
      const payload = parseImportPayload(text)

      listId = await createList(
        payload.name,
        {
          uid: user.uid,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
        },
        role,
        selectedCollaborators,
      )

      const knownProducts = [...products]
      const items = []
      for (const rawItem of payload.items) {
        const productName = rawItem.product_name || rawItem.productName
        if (!productName) continue
        const unit = normalizeUnit(rawItem.unit)
        const product = await findOrCreateProduct(productName, unit, knownProducts, user.uid)
        if (!knownProducts.some((p) => p.id === product.id)) {
          knownProducts.push(product)
        }
        items.push({
          productId: product.id,
          productName: product.name,
          quantity: rawItem.quantity || 1,
          unit,
          comment: rawItem.comment || '',
        })
      }

      await addItemsBatch(listId, items)
      handleClose()
      onImported?.(listId)
    } catch (err) {
      if (listId) await deleteList(listId).catch(() => {})
      setError(err.message || 'No se pudo importar la lista.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Importar lista">
      <div className="form-field">
        <label className="form-file-btn" htmlFor="import-file">
          <Upload size={16} />
          Seleccionar archivo JSON
        </label>
        <input
          id="import-file"
          type="file"
          accept="application/json,.json"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        <label className="form-label" htmlFor="import-text">
          O pega el código aquí
        </label>
        <textarea
          id="import-text"
          className="form-input form-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='{ "name": "...", "items": [...] }'
        />
        <p className="form-hint">
          Se importan cantidades y unidades; precios y estado de compra no se incluyen.
        </p>

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

        {error ? <p className="welcome-error">{error}</p> : null}

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={handleClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleImport}
            disabled={!text.trim() || importing}
          >
            {importing ? 'Importando...' : 'Importar'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
