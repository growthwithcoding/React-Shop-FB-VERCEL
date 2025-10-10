// src/demo/DemoModeToggle.jsx
import { useState } from 'react';
import { User, UserCog, Shield, X, Eye } from 'lucide-react';
import { useDemo } from './useDemo.js';
import './demo.css';

/**
 * DemoModeToggle - Floating widget to switch between different user roles
 * for demonstration purposes without needing to log in as different users.
 * Only renders when VITE_DEMO_MODE environment variable is set to 'true'
 * Requires admin authentication to use.
 */
export default function DemoModeToggle() {
  const { demoRole, isDemoMode, activateRole, deactivateDemo } = useDemo();
  const [isOpen, setIsOpen] = useState(false);

  // Don't render if demo mode is not enabled
  if (!isDemoMode) {
    return null;
  }

  const roles = [
    {
      id: 'customer',
      label: 'Customer',
      icon: User,
      color: '#10b981',
      description: 'Browse and shop'
    },
    {
      id: 'agent',
      label: 'Agent',
      icon: UserCog,
      color: '#3b82f6',
      description: 'Support & manage customers'
    },
    {
      id: 'admin',
      label: 'Admin',
      icon: Shield,
      color: '#f59e0b',
      description: 'Full system access'
    }
  ];

  const handleRoleChange = (role) => {
    if (demoRole === role) {
      // If clicking the same role, turn off demo mode
      deactivateDemo();
    } else {
      // Set new role
      activateRole(role);
    }
  };

  // If no demo role is active, don't show the button
  if (!demoRole) {
    return null;
  }

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '24px',
          zIndex: 9999,
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #ffa41c 0%, #f08804 100%)',
          border: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
          color: '#fff',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        }}
        title="Demo Mode - Switch Roles"
        aria-label="Toggle demo mode panel"
      >
        {isOpen ? <X size={28} /> : <Eye size={28} />}
      </button>

      {/* Floating Panel */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '148px',
            right: '24px',
            zIndex: 9998,
            width: '320px',
            background: '#fff',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            padding: '20px',
            animation: 'slideUp 0.3s ease',
          }}
        >
          <style>
            {`
              @keyframes slideUp {
                from {
                  opacity: 0;
                  transform: translateY(20px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            `}
          </style>

          {/* Header */}
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ 
              margin: 0, 
              fontSize: '18px', 
              fontWeight: 700,
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Eye size={20} />
              Demo Mode
            </h3>
            <p style={{ 
              margin: '4px 0 0 0', 
              fontSize: '13px', 
              color: '#6b7280' 
            }}>
              Switch between roles to preview different views
            </p>
          </div>

          {/* Current Role Indicator */}
          {demoRole && (
            <div style={{
              marginBottom: '16px',
              padding: '12px',
              background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#374151',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                background: '#10b981',
                animation: 'pulse 2s infinite'
              }} />
              Currently viewing as: <strong style={{ textTransform: 'capitalize' }}>{demoRole}</strong>
            </div>
          )}

          <style>
            {`
              @keyframes pulse {
                0%, 100% {
                  opacity: 1;
                }
                50% {
                  opacity: 0.5;
                }
              }
            `}
          </style>

          {/* Role Buttons */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '10px' 
          }}>
            {roles.map((role) => {
              const Icon = role.icon;
              const isActive = demoRole === role.id;
              
              return (
                <button
                  key={role.id}
                  onClick={() => handleRoleChange(role.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 16px',
                    border: isActive ? `2px solid ${role.color}` : '2px solid #e5e7eb',
                    borderRadius: '10px',
                    background: isActive ? `${role.color}15` : '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    width: '100%',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = role.color;
                      e.currentTarget.style.background = `${role.color}08`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.background = '#fff';
                    }
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: isActive ? role.color : `${role.color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={20} color={isActive ? '#fff' : role.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontWeight: 600, 
                      fontSize: '14px',
                      color: isActive ? role.color : '#1f2937',
                      marginBottom: '2px'
                    }}>
                      {role.label}
                      {isActive && (
                        <span style={{ 
                          marginLeft: '8px',
                          fontSize: '11px',
                          fontWeight: 500,
                          color: role.color,
                          opacity: 0.8
                        }}>
                          ● Active
                        </span>
                      )}
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#6b7280' 
                    }}>
                      {role.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer Note */}
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: '#fef3c7',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#92400e',
            lineHeight: '1.5'
          }}>
            <strong>Note:</strong> Demo mode simulates different user roles. Changes made are temporary and will reset on page reload when not in demo mode.
          </div>
        </div>
      )}
    </>
  );
}
