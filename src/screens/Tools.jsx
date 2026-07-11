import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, History as HistoryIcon, ShoppingBasket, Users } from 'lucide-react'
import ScreenHeader from '../components/layout/ScreenHeader'
import { ImportListModal } from '../components/ui'
import { useAuth } from '../hooks/useAuth'
import { useFrequentCollaborators } from '../hooks/useFrequentCollaborators'
import { useProducts } from '../hooks/useProducts'
import { getLastRole } from '../utils/lastRole'
import '../styles/screen.css'
import './Tools.css'

const TOOLS = [
  { key: 'products', icon: ShoppingBasket, label: 'Catálogo', to: '/products' },
  { key: 'history', icon: HistoryIcon, label: 'Historial', to: '/history' },
  { key: 'import', icon: Download, label: 'Importar lista' },
  { key: 'collaborators', icon: Users, label: 'Colaboradores', to: '/collaborators' },
]

export default function Tools() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: products } = useProducts()
  const { data: frequentCollaborators } = useFrequentCollaborators(user?.uid)
  const [importModalOpen, setImportModalOpen] = useState(false)

  function handleToolClick(tool) {
    if (tool.key === 'import') {
      setImportModalOpen(true)
      return
    }
    navigate(tool.to)
  }

  return (
    <div className="screen">
      <ScreenHeader title="Accesos" onBack={() => navigate(-1)} />

      <div className="screen-content">
        <div className="tools-grid">
          {TOOLS.map((tool) => (
            <button
              key={tool.key}
              type="button"
              className="tools-grid__item"
              onClick={() => handleToolClick(tool)}
            >
              <span className="tools-grid__icon">
                <tool.icon size={24} />
              </span>
              <span className="tools-grid__label">{tool.label}</span>
            </button>
          ))}
        </div>
      </div>

      <ImportListModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImported={(listId) => navigate(`/list/${listId}`)}
        products={products}
        role={getLastRole()}
        frequentCollaborators={frequentCollaborators}
      />
    </div>
  )
}
