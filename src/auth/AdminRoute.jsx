// src/auth/AdminRoute.jsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './useAuth'

export default function AdminRoute() {
  const { user, initializing } = useAuth()

  if (initializing) {
    return <div style={{ padding: 24 }}>Loading…</div>
  }
  if (!user) return <Navigate to="/login?mode=login" replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />

  // IMPORTANT: render nested routes here
  return <Outlet />
}
