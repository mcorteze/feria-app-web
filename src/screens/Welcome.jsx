import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ClipboardList, LogOut, ShoppingCart } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useProfileName } from '../hooks/useProfileName'
import { signInWithGoogle, signOut } from '../services/authRepository'
import { auth } from '../firebase/config'
import { Avatar, HeroButton, LoadingState, Modal } from '../components/ui'
import '../styles/screen.css'
import './Welcome.css'

export default function Welcome() {
  const navigate = useNavigate()
  const { user, loading, authError } = useAuth()
  const { name, saveName } = useProfileName(user)
  const [nameDraft, setNameDraft] = useState('')
  const [signingIn, setSigningIn] = useState(false)
  const [error, setError] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  async function handleSignIn() {
    setError('')
    setSigningIn(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      // TEMPORAL — diagnóstico de auth/unauthorized-domain, quitar cuando se resuelva.
      setError(`DEBUG: code=${err?.code || 'sin código'} | message=${err?.message || err} | host=${window.location.hostname} | authDomain=${auth.config.authDomain}`)
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
          <div className="welcome-profile" ref={menuRef}>
            <button
              type="button"
              className="welcome-profile__trigger"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <Avatar photoURL={user.photoURL} name={name || user.displayName} size={32} />
              <span className="welcome-topbar__name">{name || user.displayName}</span>
              <ChevronDown size={16} className={`welcome-profile__chevron ${menuOpen ? 'welcome-profile__chevron--open' : ''}`} />
            </button>

            {menuOpen ? (
              <div className="welcome-profile__menu" role="menu">
                <button
                  type="button"
                  className="welcome-profile__menu-item welcome-profile__menu-item--danger"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false)
                    setSignOutConfirmOpen(true)
                  }}
                >
                  <LogOut size={18} />
                  Cerrar sesión
                </button>
              </div>
            ) : null}
          </div>
        </header>
      ) : null}

      <Modal
        open={signOutConfirmOpen}
        onClose={() => setSignOutConfirmOpen(false)}
        title="Cerrar sesión"
      >
        <p>¿Seguro que quieres cerrar sesión?</p>
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setSignOutConfirmOpen(false)}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => {
              setSignOutConfirmOpen(false)
              signOut()
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </Modal>

      <div className="screen-content welcome-content">
        {!user ? (
          <>
            <div className="welcome-brand">
              <h1 className="welcome-title">Feria App</h1>
            </div>
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
