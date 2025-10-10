// src/auth/AgentRoute.jsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './useAuth'

export default function AgentRoute() {
  const { user, initializing } = useAuth()

  if (initializing) {
    return <div style={{ padding: 24 }}>Loading…</div>
  }
  if (!user) return <Navigate to="/login?mode=login" replace />
  if (user.role !== 'agent' && user.role !== 'admin') return <Navigate to="/" replace />

  // IMPORTANT: render nested routes here
  return <Outlet />
}
