import { useState } from 'react'
import { Upload } from 'lucide-react'
import Modal from './Modal'
import { useAuth } from '../../hooks/useAuth'
import { createList, deleteList } from '../../services/listsRepository'
import { addItemsBatch } from '../../services/itemsRepository'
import { findOrCreateProduct } from '../../services/productsRepository'
import { normalizeUnit } from '../../utils/units'
import { parseImportPayload } from '../../utils/importList'

export default function ImportListModal({ open, onClose, onImported, products, role = 'planner' }) {
  const { user } = useAuth()
  const [text, setText] = useState('')
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')

  function handleClose() {
    setText('')
    setError('')
    setImporting(false)
    onClose?.()
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
