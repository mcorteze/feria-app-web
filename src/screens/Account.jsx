import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeftRight, LogOut } from 'lucide-react'
import ScreenHeader from '../components/layout/ScreenHeader'
import { Avatar, Modal } from '../components/ui'
import { useAuth } from '../hooks/useAuth'
import { useProfileName } from '../hooks/useProfileName'
import { signOut } from '../services/authRepository'
import { setLastRole } from '../utils/lastRole'
import '../styles/screen.css'
import './Account.css'

export default function Account() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { name } = useProfileName(user)
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false)

  function goToRole(role) {
    setLastRole(role)
    navigate(`/${role}`)
  }

  return (
    <div className="screen">
      <ScreenHeader title="Cuenta" onBack={() => navigate(-1)} />

      <div className="screen-content">
        <div className="account-profile">
          <Avatar photoURL={user?.photoURL} name={name} size={56} />
          <span className="account-profile__name">{name}</span>
        </div>

        <p className="screen-section-title">Cambiar de rol</p>
        <div className="account-menu">
          <button type="button" className="account-menu__item" onClick={() => goToRole('planner')}>
            <ArrowLeftRight size={20} />
            Ir a Planificador
          </button>
          <button type="button" className="account-menu__item" onClick={() => goToRole('buyer')}>
            <ArrowLeftRight size={20} />
            Ir a Comprador
          </button>
        </div>

        <p className="screen-section-title">Sesión</p>
        <div className="account-menu">
          <button
            type="button"
            className="account-menu__item account-menu__item--danger"
            onClick={() => setSignOutConfirmOpen(true)}
          >
            <LogOut size={20} />
            Cerrar sesión
          </button>
        </div>
      </div>

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
    </div>
  )
}
