import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, ShoppingCart } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useProfileName } from '../hooks/useProfileName'
import { signInWithGoogle } from '../services/authRepository'
import { HeroButton, LoadingState } from '../components/ui'
import '../styles/screen.css'
import './Welcome.css'

export default function Welcome() {
  const navigate = useNavigate()
  const { user, loading, authError } = useAuth()
  const { name, saveName } = useProfileName(user)
  const [nameDraft, setNameDraft] = useState('')
  const [signingIn, setSigningIn] = useState(false)
  const [error, setError] = useState('')

  async function handleSignIn() {
    setError('')
    setSigningIn(true)
    try {
      await signInWithGoogle()
    } catch {
      setError('No se pudo iniciar sesión. Intenta nuevamente.')
    } finally {
      setSigningIn(false)
    }
  }

  function handleSaveName(e) {
    e.preventDefault()
    if (nameDraft.trim()) saveName(nameDraft.trim())
  }

  if (loading) {
    return (
      <div className="screen">
        <LoadingState label="Cargando..." />
      </div>
    )
  }

  return (
    <div className="screen">
      <div className="screen-content welcome-content">
        <div className="welcome-brand">
          <h1 className="welcome-title">Feria App</h1>
          <p className="welcome-subtitle">
            Organiza tus compras de feria en tiempo real, en equipo.
          </p>
        </div>

        {!user ? (
          <div className="welcome-auth">
            {(error || authError) ? <p className="welcome-error">{error || authError}</p> : null}
            <button
              type="button"
              className="welcome-google-btn"
              onClick={handleSignIn}
              disabled={signingIn}
            >
              {signingIn ? 'Conectando...' : 'Iniciar sesión con Google'}
            </button>
          </div>
        ) : !name ? (
          <form className="welcome-auth" onSubmit={handleSaveName}>
            <div className="form-field">
              <label className="form-label" htmlFor="displayName">
                ¿Cómo te llamas?
              </label>
              <input
                id="displayName"
                className="form-input"
                maxLength={10}
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                placeholder="Máx. 10 caracteres"
                autoFocus
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={!nameDraft.trim()}>
              Continuar
            </button>
          </form>
        ) : (
          <div className="welcome-roles">
            <p className="welcome-greeting">Hola, {name}</p>
            <HeroButton
              icon={ClipboardList}
              label="Planificador"
              variant="brand"
              onClick={() => navigate('/planner')}
            />
            <HeroButton
              icon={ShoppingCart}
              label="Comprador"
              variant="buyer"
              onClick={() => navigate('/buyer')}
            />
          </div>
        )}
      </div>
    </div>
  )
}
