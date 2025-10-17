// src/pages/OrderDetail.jsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getOrderById } from '../services/orderService'
import { LayoutDashboard } from 'lucide-react'

const fmt = (v) => '$' + Number(v || 0).toFixed(2)
const FALLBACK_IMAGE = 'https://via.placeholder.com/400x400?text=Product+Image'

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const run = async () => {
      try {
        const data = await getOrderById(id)
        if (active) setOrder(data)
      } finally {
        if (active) setLoading(false)
      }
    }
    run()
    return () => { active = false }
  }, [id])

  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return 'Pending'
    const date = timestamp.toDate()
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
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
          <div style={{ fontSize: 18, color: 'var(--muted)' }}>Loading order details...</div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container" style={{ paddingTop: 40 }}>
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.3 }}>❌</div>
          <h3 style={{ margin: '0 0 8px', fontSize: 20 }}>Order Not Found</h3>
          <p style={{ color: 'var(--muted)', marginBottom: 20 }}>
            The order you're looking for doesn't exist or has been removed.
          </p>
          <button onClick={() => navigate('/orders')} className="btn btn-primary">
            Back to Orders
          </button>
        </div>
      </div>
    )
  }

  const status = order.status || 'pending'
  const totalItems = order.items?.reduce((n, i) => n + (i.quantity || 0), 0) || 0
  const subtotal = order.items?.reduce((sum, i) => sum + ((i.price || 0) * (i.quantity || 0)), 0) || 0

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 60 }}>
      {/* Hero Headline */}
      <div className="hero-headline" style={{ marginBottom: 24 }}>
        <div>
          <div className="kicker">Order Details</div>
          <h1 style={{ margin: 0 }}>Order #{order.id.slice(-6).toUpperCase()}</h1>
          <div className="meta" style={{ marginTop: 8 }}>
            Placed on {formatDate(order.createdAt)} • Status: {status}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link 
            to="/orders" 
            className="btn btn-secondary"
            style={{
              fontSize: "13px",
              padding: "8px 14px",
              whiteSpace: "nowrap"
            }}
          >
            ← Back to Orders
          </Link>
          <Link 
            to="/dashboard" 
            className="btn btn-secondary"
            style={{
              fontSize: "13px",
              padding: "8px 14px",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <LayoutDashboard style={{ width: 16, height: 16 }} />
            Dashboard
          </Link>
        </div>
      </div>

        <div className="order-detail-grid">
        {/* Left Column - Items */}
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 700 }}>
              Order Items ({totalItems} {totalItems === 1 ? 'item' : 'items'})
            </h2>
            
            <div style={{ display: 'grid', gap: 12 }}>
              {order.items?.map((item, idx) => (
                <div 
                  key={item.id || idx} 
                  style={{ 
                    display: 'flex',
                    gap: 16,
                    padding: 12,
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    backgroundColor: '#fafafa',
                    alignItems: 'center'
                  }}
                >
                  <Link to={`/product/${item.id}`} style={{
                    width: 80,
                    height: 80,
                    flexShrink: 0,
                    backgroundColor: '#fff',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}>
                    <img 
                      src={item.image || FALLBACK_IMAGE} 
                      alt={item.title}
                      style={{ 
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain'
                      }}
                      onError={(e) => {
                        if (e.currentTarget.src !== FALLBACK_IMAGE) {
                          e.currentTarget.src = FALLBACK_IMAGE
                        }
                      }}
                    />
                  </Link>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      fontWeight: 700,
                      fontSize: 15,
                      marginBottom: 4,
                      color: '#111'
                    }}>
                      {item.title}
                    </div>
                    <div style={{ 
                      fontSize: 13,
                      color: 'var(--muted)',
                      marginBottom: 6
                    }}>
                      Quantity: {item.quantity}
                    </div>
                    <div style={{ 
                      fontSize: 14,
                      color: '#666'
                    }}>
                      {fmt(item.price)} each
                    </div>
                  </div>
                  
                  <div style={{ 
                    fontWeight: 800,
                    fontSize: 18,
                    color: 'var(--primary-dark)',
                    whiteSpace: 'nowrap'
                  }}>
                    {fmt((item.price || 0) * (item.quantity || 0))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🚚</span> Shipping Address
              </h3>
              <div style={{ 
                padding: 12,
                backgroundColor: '#f9fafb',
                borderRadius: 8,
                border: '1px solid var(--border)'
              }}>
                <div style={{ fontSize: 15, lineHeight: 1.6 }}>
                  {order.shippingAddress.street && <div>{order.shippingAddress.street}</div>}
                  {order.shippingAddress.city && order.shippingAddress.state && order.shippingAddress.zip && (
                    <div>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</div>
                  )}
                  {order.shippingAddress.country && <div>{order.shippingAddress.country}</div>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Summary */}
        <div>
          <div className="card" style={{ position: 'sticky', top: 120 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>
              Order Summary
            </h3>
            
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              paddingBottom: 16,
              borderBottom: '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15 }}>
                <span style={{ color: 'var(--muted)' }}>Subtotal</span>
                <span style={{ fontWeight: 600 }}>{fmt(subtotal)}</span>
              </div>
              
              {order.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15 }}>
                  <span style={{ color: 'var(--muted)' }}>Discount</span>
                  <span style={{ fontWeight: 600, color: 'var(--success)' }}>
                    -{fmt(order.discount)}
                  </span>
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15 }}>
                <span style={{ color: 'var(--muted)' }}>Delivery</span>
                <span style={{ fontWeight: 600 }}>
                  {order.delivery === 0 ? 'FREE' : fmt(order.delivery || 0)}
                </span>
              </div>
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 16,
              fontSize: 20,
              fontWeight: 800
            }}>
              <span>Total</span>
              <span style={{ color: 'var(--primary-dark)' }}>{fmt(order.total)}</span>
            </div>

            {/* Payment Method */}
            {order.paymentMethod && (
              <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6, fontWeight: 600 }}>
                  Payment Method
                </div>
                <div style={{ 
                  padding: 12,
                  backgroundColor: '#f9fafb',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  fontSize: 15,
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <span style={{ fontSize: 20 }}>💳</span>
                  {order.paymentMethod.replace(/_/g, ' ')}
                </div>
              </div>
            )}

            {/* Order ID */}
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>
                Order ID
              </div>
              <div style={{ 
                fontSize: 12,
                fontFamily: 'monospace',
                padding: '8px 12px',
                backgroundColor: '#f3f4f6',
                borderRadius: 6,
                border: '1px solid var(--border)',
                wordBreak: 'break-all'
              }}>
                {order.id}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
