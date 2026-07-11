import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, ShoppingCart } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useProfileName } from '../hooks/useProfileName'
import { signInWithGoogle, signOut } from '../services/authRepository'
import { Avatar, HeroButton, LoadingState } from '../components/ui'
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
    } catch (err) {
      setError(err?.code === 'auth/network-request-failed'
        ? 'Sin conexión. Revisa tu internet e intenta de nuevo.'
        : 'No se pudo iniciar sesión. Intenta nuevamente.')
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
      {user ? (
        <header className="welcome-topbar">
          <Avatar photoURL={user.photoURL} name={name || user.displayName} size={32} />
          <span className="welcome-topbar__name">{name || user.displayName}</span>
          <button type="button" className="welcome-signout" onClick={() => signOut()}>
            Salir
          </button>
        </header>
      ) : null}

      <div className="screen-content welcome-content">
        {!user ? (
          <>
            <div className="welcome-brand">
              <h1 className="welcome-title">Feria App</h1>
            </div>
            <div className="welcome-auth">
              <p style={{ fontSize: 10, wordBreak: 'break-all', opacity: 0.5, margin: 0 }}>
                {window.location.href}
              </p>
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
          </>
        ) : !name ? (
          <form className="welcome-auth" onSubmit={handleSaveName}>
            <div className="form-field">
              <label className="form-label" htmlFor="displayName">
                ¿Cómo te llamas?
              </label>
              <input
                id="displayName"
                className="form-input"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                autoFocus
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={!nameDraft.trim()}>
              Continuar
            </button>
          </form>
        ) : (
          <div className="welcome-roles">
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
            <p className="welcome-hint">
              Planificador arma la lista. Comprador la lleva a la feria.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
