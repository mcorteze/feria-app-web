import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { LoadingState } from '../ui'

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <LoadingState label="Cargando..." />
  if (!user) return <Navigate to="/" replace />

  return children
}
