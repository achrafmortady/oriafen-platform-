import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import SetPassword from './pages/SetPassword'
import StudentDashboard from './pages/student/Dashboard'
import AdminDashboard from './pages/admin/Dashboard'

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-orias-green flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <svg width="48" height="48" viewBox="0 0 44 44" fill="none" className="animate-pulse">
          <rect width="44" height="44" rx="10" fill="#1a3d2b"/>
          <path d="M22 8L34 15V29L22 36L10 29V15L22 8Z" fill="none" stroke="#c49a2a" strokeWidth="2"/>
          <circle cx="22" cy="22" r="4" fill="#c49a2a"/>
        </svg>
        <div className="flex gap-1.5">
          <span className="w-2 h-2 rounded-full bg-orias-gold animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-orias-gold animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-orias-gold animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}

function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  const isAdminLike = user.role === 'admin' || user.role === 'super_admin'
  const hasAccess = requiredRole === 'admin' ? isAdminLike : user.role === requiredRole
  if (requiredRole && !hasAccess) {
    return <Navigate to={isAdminLike ? '/admin' : '/dashboard'} replace />
  }
  return children
}

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  const isAdminLike = user && (user.role === 'admin' || user.role === 'super_admin')

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/set-password" element={<SetPassword />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requiredRole="student">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          user
            ? <Navigate to={isAdminLike ? '/admin' : '/dashboard'} replace />
            : <Navigate to="/login" replace />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
