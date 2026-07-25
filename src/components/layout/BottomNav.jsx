import { useLocation, useNavigate } from 'react-router-dom'
import { ClipboardList, Grid2x2, ShoppingCart, User } from 'lucide-react'
import { getLastRole } from '../../utils/lastRole'
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

  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          className={`bottom-nav__item${item.active ? ' bottom-nav__item--active' : ''}`}
          onClick={item.onClick}
        >
          <item.icon size={22} />
          <span className="bottom-nav__label">{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
