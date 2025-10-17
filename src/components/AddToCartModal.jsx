// AddToCartModal.jsx
// ------------------------------------------------------------
// WHAT THIS DOES:
// Confirmation modal after adding to cart.
// This shows a quick item summary, prevents broken images with a placeholder,
// and offers smooth routes back to shopping or the Cart per the assignment.
// ------------------------------------------------------------

import { useSelector, useDispatch } from 'react-redux'
import { hideAddModal } from '../features/ui/uiSlice.js'
import { useNavigate } from 'react-router-dom'
import { formatPrice } from '../utils/money.js'
import ImageWithFallback from './ImageWithFallback.jsx'

export default function AddToCartModal(){
  // Assignment: Modal State + Navigation
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const open = useSelector(s => s.ui.addModalOpen)
  const item = useSelector(s => s.ui.lastAdded)

  // If the modal isn't open, we ghost right out. No wasted DOM.
  if (!open) return null

  return (
    // Assignment: Modal UX & A11y (role+aria-modal)
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={()=>dispatch(hideAddModal())}>
      <div className="modal" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
        {/* Success Header with Cart Icon */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 12, 
          marginBottom: 16,
          paddingBottom: 12,
          borderBottom: '2px solid #e5e7eb'
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #16a34a 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <div>
            <h3 style={{ margin: 0, color: '#16a34a', fontSize: 20 }}>Added to Cart!</h3>
            <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>Item successfully added</p>
          </div>
        </div>

        {/* Assignment: Item Snapshot with Cart Visual */}
        {item && (
          <div style={{
            display: 'flex', 
            gap: 16, 
            alignItems: 'center',
            padding: 16,
            background: '#f9fafb',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            marginBottom: 16
          }}>
            {/* Product Image in Cart-like Container */}
            <div style={{
              position: 'relative',
              flexShrink: 0
            }}>
              <ImageWithFallback
                src={item.image}
                alt=""
                width={80}
                height={80}
                fallbackText="Item"
                style={{
                  objectFit: 'contain',
                  background: '#fff',
                  border: '2px solid #e5e7eb',
                  borderRadius: 10,
                  padding: 8
                }}
              />
              {/* Quantity Badge */}
              <div style={{
                position: 'absolute',
                top: -8,
                right: -8,
                background: 'var(--primary)',
                color: '#111',
                borderRadius: '50%',
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 800,
                border: '2px solid white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}>
                {item.quantity}
              </div>
            </div>

            {/* Product Details */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontWeight: 700,
                fontSize: 15,
                color: '#111',
                marginBottom: 8,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}>
                {item.title}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ 
                  fontSize: 13, 
                  color: '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <span style={{ fontWeight: 600 }}>Quantity:</span>
                  <span>{item.quantity}</span>
                </div>
                <div style={{ 
                  fontSize: 16, 
                  fontWeight: 800,
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#6b7280' }}>Price:</span>
                  {formatPrice(item.price * item.quantity)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Assignment: Modal Actions */}
        <div className="actions" style={{ gap: 10 }}>
          <button
            className="btn btn-secondary"
            onClick={()=>dispatch(hideAddModal())}
            style={{ flex: 1 }}
          >
            Continue Shopping
          </button>

          <button
            onClick={()=>{
              dispatch(hideAddModal())
              navigate('/cart')
            }}
            style={{ 
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              background: 'var(--primary)',
              color: '#111',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '15px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm10 0a2 2 0 1 0 .001 4A2 2 0 0 0 17 18ZM6.2 4l.65 3H21l-1.6 7.2a2 2 0 0 1-2 1.6H9a2 2 0 0 1-2-1.6L5.1 3.3A1 1 0 0 0 4.1 2H2v2h2.3l.4 2Z"/>
            </svg>
            View Cart
          </button>
        </div>
      </div>
    </div>
  )
}
