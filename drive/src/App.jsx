import { Routes, Route } from 'react-router-dom'
import PlatformDashboard from './pages/PlatformDashboard'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import InternalDashboard from './pages/InternalDashboard'
import ProtectedRoute from './components/ProtectedRoute'
import './index.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<PlatformDashboard />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/drive" element={
        <ProtectedRoute>
          <InternalDashboard />
        </ProtectedRoute>
      } />
      <Route path="/drive/recent" element={
        <ProtectedRoute>
          <InternalDashboard />
        </ProtectedRoute>
      } />
      <Route path="/drive/starred" element={
        <ProtectedRoute>
          <InternalDashboard />
        </ProtectedRoute>
      } />
      <Route path="/drive/bin" element={
        <ProtectedRoute>
          <InternalDashboard />
        </ProtectedRoute>
      } />
      <Route path="/drive/storage" element={
        <ProtectedRoute>
          <InternalDashboard />
        </ProtectedRoute>
      } />
    </Routes>
  )
}

export default App
