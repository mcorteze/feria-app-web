import { useLocation, useNavigate } from 'react-router-dom'
import { ClipboardList, Grid2x2, Plus, ShoppingCart, User } from 'lucide-react'
import { getLastRole, setLastRole } from '../../utils/lastRole'
import './BottomNav.css'

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const lastRole = getLastRole()
  const roleIsBuyer = lastRole === 'buyer'

  const items = [
    {
      key: 'home',
      icon: ClipboardList,
      label: 'Inicio',
      active: location.pathname === '/home',
      onClick: () => navigate('/home'),
    },
    {
      key: 'role',
      icon: roleIsBuyer ? ShoppingCart : ClipboardList,
      label: roleIsBuyer ? 'Comprador' : 'Planificador',
      active: location.pathname === `/${lastRole}`,
      onClick: () => navigate(`/${lastRole}`),
    },
    { key: 'add', isAction: true },
    {
      key: 'tools',
      icon: Grid2x2,
      label: 'Accesos',
      active: location.pathname === '/accesos',
      onClick: () => navigate('/accesos'),
    },
    {
      key: 'account',
      icon: User,
      label: 'Cuenta',
      active: location.pathname === '/cuenta',
      onClick: () => navigate('/cuenta'),
    },
  ]

  function handleAdd() {
    setLastRole(lastRole)
    navigate(`/${lastRole}`, { state: { openCreate: true } })
  }

  return (
    <nav className="bottom-nav">
      {items.map((item) =>
        item.isAction ? (
          <button
            key={item.key}
            type="button"
            className="bottom-nav__fab"
            onClick={handleAdd}
            aria-label="Crear"
          >
            <Plus size={26} strokeWidth={2.5} />
          </button>
        ) : (
          <button
            key={item.key}
            type="button"
            className={`bottom-nav__item${item.active ? ' bottom-nav__item--active' : ''}`}
            onClick={item.onClick}
          >
            <item.icon size={22} />
            <span className="bottom-nav__label">{item.label}</span>
          </button>
        ),
      )}
    </nav>
  )
}
