import { BrowserRouter, Routes, Route } from 'react-router-dom'
import PlatformDashboard from './pages/PlatformDashboard'
import LoginPage from './pages/LoginPage'
import InternalDashboard from './pages/InternalDashboard'
import './index.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PlatformDashboard />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/drive" element={<InternalDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
