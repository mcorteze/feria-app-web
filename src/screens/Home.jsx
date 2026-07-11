import { useNavigate } from 'react-router-dom'
import { ClipboardList, ShoppingCart } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useProfileName } from '../hooks/useProfileName'
import { HeroButton } from '../components/ui'
import '../styles/screen.css'
import '../screens/Welcome.css'

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { name } = useProfileName(user)

  return (
    <div className="screen">
      <div className="screen-content welcome-content">
        <div className="welcome-brand">
          <p className="welcome-brand__label">Feria App</p>
          <h1 className="welcome-greeting">Hola, {name}</h1>
        </div>
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
      </div>
    </div>
  )
}
