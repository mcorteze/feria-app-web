import { useNavigate } from 'react-router-dom'
import { History as HistoryIcon } from 'lucide-react'
import ScreenHeader from '../components/layout/ScreenHeader'
import { Card, EmptyState, LoadingState } from '../components/ui'
import { useAuth } from '../hooks/useAuth'
import { useCompletedLists } from '../hooks/useLists'
import { formatCurrency, formatDateTime } from '../utils/format'
import '../styles/screen.css'
import '../styles/listCard.css'

export default function History() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: lists, loading } = useCompletedLists(user?.uid)

  return (
    <div className="screen">
      <ScreenHeader title="Historial" onBack={() => navigate(-1)} />

      <div className="screen-content">
        {loading ? (
          <LoadingState />
        ) : lists.length === 0 ? (
          <EmptyState
            icon={HistoryIcon}
            title="Sin compras finalizadas"
            message="Aquí verás las listas que ya completaste."
          />
        ) : (
          <div className="list-collection">
            {lists.map((list) => (
              <Card key={list.id} onClick={() => navigate(`/list/${list.id}`)}>
                <div className="list-card-row">
                  <span className="list-card-name">{list.name}</span>
                  <span className="list-card-meta">{formatCurrency(list.totalSpent)}</span>
                </div>
                <span className="list-card-meta">{formatDateTime(list.createdAt)}</span>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
