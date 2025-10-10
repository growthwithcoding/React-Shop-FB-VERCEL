// src/auth/ProtectedRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./useAuth";

export default function ProtectedRoute() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return <div style={{ padding: 24 }}>Loading…</div>;
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
