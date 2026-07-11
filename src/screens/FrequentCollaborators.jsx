import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, Users } from 'lucide-react'
import ScreenHeader from '../components/layout/ScreenHeader'
import { Avatar, Card, EmptyState, LoadingState } from '../components/ui'
import { useAuth } from '../hooks/useAuth'
import { useFrequentCollaborators } from '../hooks/useFrequentCollaborators'
import { findUserByEmail } from '../services/authRepository'
import {
  addFrequentCollaborator,
  removeFrequentCollaborator,
} from '../services/frequentCollaboratorsRepository'
import '../styles/screen.css'
import '../styles/listCard.css'

export default function FrequentCollaborators() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: collaborators, loading } = useFrequentCollaborators(user?.uid)
  const [email, setEmail] = useState('')
  const [searching, setSearching] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  async function handleSearch(e) {
    e.preventDefault()
    if (!email.trim()) return
    setSearching(true)
    setError('')
    setResult(null)
    try {
      const found = await findUserByEmail(email)
      if (!found) {
        setError('No se encontró ningún usuario con ese email. Debe haber iniciado sesión al menos una vez.')
      } else if (found.id === user.uid) {
        setError('Ese eres tú.')
      } else {
        setResult(found)
      }
    } finally {
      setSearching(false)
    }
  }

  async function handleAdd() {
    if (!result) return
    await addFrequentCollaborator(user.uid, {
      uid: result.id,
      displayName: result.displayName,
      email: result.email,
      photoURL: result.photoURL,
    })
    setResult(null)
    setEmail('')
  }

  return (
    <div className="screen">
      <ScreenHeader title="Colaboradores habituales" onBack={() => navigate(-1)} />

      <div className="screen-content">
        <form className="form-field" onSubmit={handleSearch}>
          <label className="form-label" htmlFor="collaborator-email">
            Buscar por email
          </label>
          <input
            id="collaborator-email"
            className="form-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nombre@correo.com"
          />
          {error ? <p className="welcome-error">{error}</p> : null}
          <button type="submit" className="btn btn-primary" disabled={!email.trim() || searching}>
            {searching ? 'Buscando...' : 'Buscar'}
          </button>
        </form>

        {result ? (
          <Card>
            <div className="list-card-row">
              <span className="list-card-creator">
                <Avatar photoURL={result.photoURL} name={result.displayName} size={32} />
                <span className="list-card-meta">{result.displayName || result.email}</span>
              </span>
              <button type="button" className="btn btn-primary" onClick={handleAdd}>
                Agregar
              </button>
            </div>
          </Card>
        ) : null}

        <p className="screen-section-title">Tus colaboradores habituales</p>

        {loading ? (
          <LoadingState />
        ) : collaborators.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Sin colaboradores habituales"
            message="Busca por email para agregar a alguien que ya usó la app."
          />
        ) : (
          <div className="list-collection">
            {collaborators.map((c) => (
              <Card key={c.id}>
                <div className="list-card-row">
                  <span className="list-card-creator">
                    <Avatar photoURL={c.photoURL} name={c.displayName} size={32} />
                    <span className="list-card-meta">{c.displayName || c.email}</span>
                  </span>
                  <button
                    type="button"
                    className="list-card-delete"
                    onClick={() => removeFrequentCollaborator(user.uid, c.id)}
                    aria-label="Quitar"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
