// src/demo/DemoEntry.jsx
import { useState } from 'react';
import { User, UserCog, Shield, Eye, Lock } from 'lucide-react';
import { useDemo } from './useDemo.js';
import { useAuth } from '../auth/useAuth.js';
import './demo.css';

/**
 * DemoEntry - Initial screen shown when demo mode is enabled but not yet activated
 * Requires admin authentication before allowing role selection
 */
export default function DemoEntry() {
  const { isDemoMode, demoRole, activateRole } = useDemo();
  const { user, signInEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Only show if demo mode is enabled AND no role is selected yet
  if (!isDemoMode || demoRole) {
    return null;
  }

  // Check if user is logged in and is an admin
  const isAdminAuthenticated = user && user.role === 'admin';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInEmail(email, password);
      // After successful login, the user state will update
      // and we'll re-check if they're an admin
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // If not authenticated as admin, show login screen
  if (!isAdminAuthenticated) {
    return (
      <div className="demo-entry-background">
        <div className="demo-entry-container">
          {/* Header */}
          <div className="demo-entry-header">
            <div className="demo-entry-icon" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
              <Lock size={40} color="#fff" />
            </div>
            <h1 className="demo-entry-title">Admin Authentication Required</h1>
            <p className="demo-entry-subtitle">
              You must be signed in to an admin account to view the demo
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} style={{ width: '100%', maxWidth: '400px' }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: 600,
                color: '#374151'
              }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@example.com"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  transition: 'border-color 0.2s',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#f59e0b'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: 600,
                color: '#374151'
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  transition: 'border-color 0.2s',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#f59e0b'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>

            {error && (
              <div style={{
                marginBottom: '20px',
                padding: '12px',
                background: '#fee2e2',
                border: '1px solid #ef4444',
                borderRadius: '8px',
                color: '#dc2626',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: loading ? '#9ca3af' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(245, 158, 11, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)';
              }}
            >
              {loading ? 'Signing In...' : 'Sign In as Admin'}
            </button>
          </form>

          {/* Info Box */}
          <div className="demo-info-box" style={{ marginTop: '30px' }}>
            <strong>Why Admin Access?</strong>
            <p style={{ marginTop: '8px', marginBottom: 0, color: '#6b7280', fontSize: '13px' }}>
              Demo mode allows viewing the application from different role perspectives. 
              Admin authentication ensures only authorized users can access this feature.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const roles = [
    {
      id: 'customer',
      label: 'Customer',
      icon: User,
      color: '#10b981',
      description: 'Browse products, add to cart, and place orders'
    },
    {
      id: 'agent',
      label: 'Support Agent',
      icon: UserCog,
      color: '#3b82f6',
      description: 'Manage support tickets and assist customers'
    },
    {
      id: 'admin',
      label: 'Administrator',
      icon: Shield,
      color: '#f59e0b',
      description: 'Full system access - manage products, orders, users, and settings'
    }
  ];

  return (
    <div className="demo-entry-background">
      <div className="demo-entry-container">
        {/* Header */}
        <div className="demo-entry-header">
          <div className="demo-entry-icon">
            <Eye size={40} color="#fff" />
          </div>
          <h1 className="demo-entry-title">Demo Mode</h1>
          <p className="demo-entry-subtitle">
            Select a role to preview the application
          </p>
        </div>

        {/* Role Selection */}
        <div className="demo-roles-container">
          {roles.map((role) => {
            const Icon = role.icon;
            
            return (
              <button
                key={role.id}
                onClick={() => activateRole(role.id)}
                className="demo-role-button"
                style={{
                  borderColor: '#e5e7eb'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = role.color;
                  e.currentTarget.style.background = `${role.color}08`;
                  e.currentTarget.style.boxShadow = `0 4px 12px ${role.color}30`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.background = '#fff';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div
                  className="demo-role-icon"
                  style={{
                    background: `${role.color}20`
                  }}
                >
                  <Icon size={24} color={role.color} />
                </div>
                <div className="demo-role-content">
                  <div className="demo-role-label">{role.label}</div>
                  <div className="demo-role-description">{role.description}</div>
                </div>
                <div className="demo-role-arrow" style={{ color: role.color }}>
                  →
                </div>
              </button>
            );
          })}
        </div>

        {/* Info Box */}
        <div className="demo-info-box">
          <strong>About Demo Mode:</strong>
          <ul>
            <li>Experience the application from different user perspectives</li>
            <li>All data interactions are simulated - no real changes are made</li>
            <li>Use the floating button to switch roles or exit demo mode</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
