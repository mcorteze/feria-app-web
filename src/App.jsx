import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import RequireAuth from './components/layout/RequireAuth'
import Welcome from './screens/Welcome'
import Home from './screens/Home'
import PlannerHome from './screens/PlannerHome'
import BuyerHome from './screens/BuyerHome'
import ActiveList from './screens/ActiveList'
import ProductSelection from './screens/ProductSelection'
import ProductsCatalog from './screens/ProductsCatalog'
import History from './screens/History'
import FrequentCollaborators from './screens/FrequentCollaborators'
import Tools from './screens/Tools'
import Account from './screens/Account'

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/home" element={<RequireAuth><Home /></RequireAuth>} />
          <Route path="/planner" element={<RequireAuth><PlannerHome /></RequireAuth>} />
          <Route path="/buyer" element={<RequireAuth><BuyerHome /></RequireAuth>} />
          <Route path="/list/:listId" element={<RequireAuth><ActiveList /></RequireAuth>} />
          <Route
            path="/list/:listId/add-product"
            element={<RequireAuth><ProductSelection /></RequireAuth>}
          />
          <Route path="/products" element={<RequireAuth><ProductsCatalog /></RequireAuth>} />
          <Route path="/history" element={<RequireAuth><History /></RequireAuth>} />
          <Route
            path="/collaborators"
            element={<RequireAuth><FrequentCollaborators /></RequireAuth>}
          />
          <Route path="/accesos" element={<RequireAuth><Tools /></RequireAuth>} />
          <Route path="/cuenta" element={<RequireAuth><Account /></RequireAuth>} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  )
}

export default App
