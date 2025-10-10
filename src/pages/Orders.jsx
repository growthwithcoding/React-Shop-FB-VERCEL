// src/pages/Orders.jsx
import { useEffect, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { listOrdersForUser } from '../services/orderService'
import { Link } from 'react-router-dom'
import BreadcrumbNav from '../components/BreadcrumbNav';
import { useTotalHeaderHeight } from '../hooks/useTotalHeaderHeight';

export default function Orders() {
  const totalHeaderHeight = useTotalHeaderHeight();
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const run = async () => {
      try {
        const data = await listOrdersForUser(user.uid)
        if (active) setOrders(data)
      } finally {
        if (active) setLoading(false)
      }
    }
    if (user?.uid) run()
    return () => { active = false }
  }, [user?.uid])

  const getStatusColor = (status) => {
    const colors = {
      pending: '#fbbf24',
      processing: '#3b82f6',
      shipped: '#8b5cf6',
      delivered: '#10b981',
      cancelled: '#ef4444'
    }
    return colors[status?.toLowerCase()] || '#6b7280'
  }

  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return 'Pending'
    const date = timestamp.toDate()
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: 40 }}>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
          <div style={{ fontSize: 18, color: 'var(--muted)' }}>Loading your orders...</div>
        </div>
      </div>
    )
  }

  if (!orders.length) {
    return (
      <>
        <BreadcrumbNav
          currentPage="My Orders"
          backButton={{ label: "Back to Dashboard", path: "/dashboard" }}
        />
        <div className="container" style={{ paddingTop: 40 }}>
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.3 }}>🛍️📦</div>
          <h3 style={{ margin: '0 0 8px', fontSize: 20 }}>No orders yet</h3>
          <p style={{ color: 'var(--muted)', marginBottom: 20 }}>
            You haven't placed any orders yet. Start shopping to see your orders here!
          </p>
          <Link to="/" className="btn btn-primary">
            Start Shopping
          </Link>
        </div>
        </div>
      </>
    )
  }

  return (
    <>
      <BreadcrumbNav
        currentPage="My Orders"
        backButton={{ label: "Back to Dashboard", path: "/dashboard" }}
        centerContent={
          <span style={{ fontSize: 14, color: "#565959" }}>
            {orders.length} {orders.length === 1 ? 'order' : 'orders'} found
          </span>
        }
      />
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <div className="hero-headline" style={{ marginBottom: 24 }}>
          <div>
            <div className="kicker">Order History</div>
            <h1 style={{ margin: 0 }}>My Orders</h1>
            <div className="meta" style={{ marginTop: 8 }}>
              Track and manage all your orders in one place.
            </div>
          </div>
        </div>

      <div style={{ display: 'grid', gap: 16 }}>
        {orders.map(o => {
          const totalItems = o.items?.reduce((n, i) => n + (i.quantity || 0), 0) || 0
          const status = o.status || 'pending'
          
          return (
            <Link 
              key={o.id} 
              to={`/orders/${o.id}`} 
              className="card" 
              style={{ 
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,.12)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'var(--shadow)'
              }}
            >
              {/* Header Row */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 12,
                paddingBottom: 12,
                borderBottom: '1px solid var(--border)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ 
                    fontSize: 32,
                    lineHeight: 1
                  }}>
                    📦
                  </span>
                  <div>
                    <div style={{ 
                      fontWeight: 800, 
                      fontSize: 16,
                      marginBottom: 2
                    }}>
                      Order #{o.id.slice(-6).toUpperCase()}
                    </div>
                    <div style={{ 
                      fontSize: 13, 
                      color: 'var(--muted)'
                    }}>
                      {formatDate(o.createdAt)}
                    </div>
                  </div>
                </div>
                
                {/* Status Badge */}
                <span style={{ 
                  padding: '4px 12px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'capitalize',
                  backgroundColor: getStatusColor(status) + '20',
                  color: getStatusColor(status),
                  border: `1px solid ${getStatusColor(status)}40`
                }}>
                  {status}
                </span>
              </div>

              {/* Order Details */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 16
              }}>
                <div>
                  <div style={{ 
                    fontSize: 12, 
                    color: 'var(--muted)', 
                    marginBottom: 4,
                    fontWeight: 600
                  }}>
                    Total Amount
                  </div>
                  <div style={{ 
                    fontSize: 20, 
                    fontWeight: 800,
                    color: 'var(--primary-dark)'
                  }}>
                    ${Number(o.total || 0).toFixed(2)}
                  </div>
                </div>

                <div>
                  <div style={{ 
                    fontSize: 12, 
                    color: 'var(--muted)', 
                    marginBottom: 4,
                    fontWeight: 600
                  }}>
                    Items
                  </div>
                  <div style={{ 
                    fontSize: 18, 
                    fontWeight: 700
                  }}>
                    {totalItems} {totalItems === 1 ? 'item' : 'items'}
                  </div>
                </div>

                {o.paymentMethod && (
                  <div>
                    <div style={{ 
                      fontSize: 12, 
                      color: 'var(--muted)', 
                      marginBottom: 4,
                      fontWeight: 600
                    }}>
                      Payment
                    </div>
                    <div style={{ 
                      fontSize: 14, 
                      fontWeight: 600,
                      textTransform: 'capitalize'
                    }}>
                      {o.paymentMethod.replace(/_/g, ' ')}
                    </div>
                  </div>
                )}
              </div>

              {/* View Details Arrow */}
              <div style={{ 
                marginTop: 12,
                paddingTop: 12,
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--accent)'
              }}>
                View Details →
              </div>
            </Link>
          )
        })}
      </div>
      </div>
    </>
  )
}
