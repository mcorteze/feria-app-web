import { useLocation } from 'react-router-dom'
import BottomNav from './BottomNav'
import './AppLayout.css'

export default function AppLayout({ children }) {
  const location = useLocation()
  const showBottomNav = location.pathname !== '/'

  return (
    <div className="app-layout">
      <div className="app-layout__content">{children}</div>
      {showBottomNav ? <BottomNav /> : null}
    </div>
  )
}
