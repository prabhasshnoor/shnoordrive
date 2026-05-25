import { Routes, Route } from 'react-router-dom'
import PlatformDashboard from './pages/PlatformDashboard'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import InternalDashboard from './pages/InternalDashboard'
import SharedFilePage from './pages/SharedFilePage'
import ProtectedRoute from './components/ProtectedRoute'
import { Toaster } from 'react-hot-toast'
import './index.css'

function App() {
  return (
    <>
      <Toaster position="bottom-center" toastOptions={{ className: 'font-sans text-xs font-semibold' }} />
      <Routes>
        <Route path="/" element={<PlatformDashboard />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/shared/:shareId" element={<SharedFilePage />} />
        <Route path="/shared/:shareId/view" element={<SharedFilePage />} />
        <Route path="/drive" element={
          <ProtectedRoute>
            <InternalDashboard />
          </ProtectedRoute>
        } />
        <Route path="/drive/shared/:shareId" element={
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
        <Route path="/drive/shared-links" element={
          <ProtectedRoute>
            <InternalDashboard />
          </ProtectedRoute>
        } />
        <Route path="/drive/access-requests" element={
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
    </>
  )
}

export default App
