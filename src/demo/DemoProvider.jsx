// src/demo/DemoProvider.jsx
import { useState, useEffect } from 'react';
import { DemoContext } from './DemoContext.js';

// Process environment variable BEFORE React renders anything
// This ensures the demo role is set in localStorage before AuthProvider checks it
const envRole = import.meta.env.VITE_DEMO_ROLE;
const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

if (envRole && ['customer', 'agent', 'admin'].includes(envRole)) {
  // If a role is specified via environment variable, set it
  localStorage.setItem('demoRole', envRole);
  sessionStorage.setItem('demoInitialized', 'true');
} else if (isDemoMode) {
  // Only clear localStorage if this is a fresh browser session (first page load)
  // This allows user-selected roles to persist during page reloads within the same session
  const isSessionInitialized = sessionStorage.getItem('demoInitialized');
  
  if (!isSessionInitialized) {
    // First load in this browser session - clear any stored role
    localStorage.removeItem('demoRole');
    sessionStorage.setItem('demoInitialized', 'true');
  }
  // If session is already initialized, keep the stored role (user may have selected it)
}

export function DemoProvider({ children }) {
  const [demoRole, setDemoRole] = useState(() => {
    return localStorage.getItem('demoRole') || null;
  });
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    // Check if demo mode is enabled via environment variable
    const demoEnabled = import.meta.env.VITE_DEMO_MODE === 'true';
    setIsDemoMode(demoEnabled);
    
    // If demo mode is disabled and there's a stored role, clean it up
    if (!demoEnabled && demoRole) {
      localStorage.removeItem('demoRole');
      setDemoRole(null);
    }
  }, [demoRole]);

  const activateRole = (role) => {
    localStorage.setItem('demoRole', role);
    window.location.reload();
  };

  const deactivateDemo = () => {
    localStorage.removeItem('demoRole');
    window.location.reload();
  };

  const value = {
    demoRole,
    isDemoMode,
    activateRole,
    deactivateDemo,
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}
