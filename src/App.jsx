import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import Welcome from './screens/Welcome'
import PlannerHome from './screens/PlannerHome'
import BuyerHome from './screens/BuyerHome'
import ActiveList from './screens/ActiveList'
import ProductSelection from './screens/ProductSelection'
import ProductsCatalog from './screens/ProductsCatalog'
import History from './screens/History'

function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/planner" element={<PlannerHome />} />
          <Route path="/buyer" element={<BuyerHome />} />
          <Route path="/list/:listId" element={<ActiveList />} />
          <Route path="/list/:listId/add-product" element={<ProductSelection />} />
          <Route path="/products" element={<ProductsCatalog />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  )
}

export default App
