// src/pages/OrderDetail.jsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getOrderById } from '../services/orderService'
import BreadcrumbNav from '../components/BreadcrumbNav';
import { useTotalHeaderHeight } from '../hooks/useTotalHeaderHeight';
import { LayoutDashboard } from 'lucide-react'

const fmt = (v) => '$' + Number(v || 0).toFixed(2)

export default function OrderDetail() {
  const totalHeaderHeight = useTotalHeaderHeight();
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
    <>
      <BreadcrumbNav
        currentPage={`Order #${order.id.slice(-6).toUpperCase()}`}
        backButton={{ label: "Back to Orders", path: "/orders" }}
        rightActions={
          <div style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            background: "linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%)",
            padding: "6px 10px",
            borderRadius: 8,
            boxShadow: "0 2px 8px rgba(0, 113, 133, 0.15)"
          }}>
            <button 
              onClick={() => navigate('/dashboard')} 
              type="button"
              style={{
                background: "none",
                border: "none",
                color: "#00695c",
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                fontWeight: 600,
                whiteSpace: "nowrap",
                borderRadius: 6,
                transition: "background 0.2s"
              }}
              onMouseEnter={(e) => e.target.style.background = "rgba(255, 255, 255, 0.4)"}
              onMouseLeave={(e) => e.target.style.background = "none"}
            >
              <LayoutDashboard style={{ width: 16, height: 16 }} />
              Dashboard
            </button>
          </div>
        }
      />
      
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16
        }}>
          <div>
            <h1 style={{ 
              margin: '0 0 8px', 
              fontSize: 32, 
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              <span style={{ fontSize: 40 }}>📦</span>
              Order #{order.id.slice(-6).toUpperCase()}
            </h1>
            <div style={{ color: 'var(--muted)', fontSize: 15 }}>
              Placed on {formatDate(order.createdAt)}
            </div>
          </div>
          
          <span style={{ 
            padding: '8px 20px',
            borderRadius: 999,
            fontSize: 14,
            fontWeight: 700,
            textTransform: 'capitalize',
            backgroundColor: getStatusColor(status) + '20',
            color: getStatusColor(status),
            border: `2px solid ${getStatusColor(status)}`,
            whiteSpace: 'nowrap'
          }}>
            {status}
          </span>
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
                  <div style={{
                    width: 80,
                    height: 80,
                    flexShrink: 0,
                    backgroundColor: '#fff',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <img 
                      src={item.image || 'https://via.placeholder.com/80'} 
                      alt={item.title}
                      style={{ 
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain'
                      }} 
                    />
                  </div>
                  
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
    </>
  )
}
