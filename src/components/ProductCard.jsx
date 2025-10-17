// ProductCard.jsx
// ------------------------------------------------------------
// WHAT THIS DOES:
// Reusable product card with resilient images, live price formatting, quantity control, and an “Add to Cart” flow wired to Redux — tidy and testable for the assignment.
// ------------------------------------------------------------

import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { addItem } from '../features/cart/cartSlice.js'
import { showAddModal } from '../features/ui/uiSlice.js'
import { formatPrice } from '../utils/money.js'
import ImageWithFallback from './ImageWithFallback.jsx'

export default function ProductCard({ product }) {
  // ------------------------------------------------------------
  // STATE & SETUP
  // ------------------------------------------------------------
  const dispatch = useDispatch()
  const [qty, setQty] = useState(1)

  // The essentials for the card. If rating ghosts us, I'm not showing NaN stares.
  const { id, title, price, category, shortDescription, image, rating, inventory = 0 } = product
  const rate = rating?.rate ?? 'N/A'
  const isOutOfStock = inventory === 0

  // ------------------------------------------------------------
  // ADD TO CART (Redux + UI Feedback)
  // ------------------------------------------------------------
  const add = () => {
    // Don't allow adding out of stock items
    if (isOutOfStock) return

    // Guardrail: never add less than 1 (because "zero items" is a prank, not a purchase).
    const quantity = Math.max(1, Number(qty) || 1)

    // Additional check: don't allow adding more than available inventory
    const finalQuantity = Math.min(quantity, inventory)

    // Cart payload: the cart slice calculates totals elsewhere; we just deliver the goods.
    dispatch(addItem({ id, title, price, image, quantity: finalQuantity }))

    // UI win: open the "Added to Cart" modal so users get that confetti moment.
    dispatch(showAddModal({ title, image, quantity: finalQuantity, price }))
  }

  return (
    // ------------------------------------------------------------
    // CARD WRAPPER
    // ------------------------------------------------------------
    <article className="card p-card" aria-label={`Product: ${title}`} style={{ position: 'relative' }}>
      {/* Out of Stock Badge */}
      {isOutOfStock && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: '#dc3545',
          color: 'white',
          padding: '4px 12px',
          borderRadius: '4px',
          fontWeight: 'bold',
          fontSize: '12px',
          zIndex: 10,
          pointerEvents: 'none'
        }}>
          OUT OF STOCK
        </div>
      )}
      {/* ----------------------------------------------------------
         IMAGE (with placeholder API fallback)
         Uses ImageWithFallback component that automatically falls back to 
         placeholder API when images fail to load.
         Wrapped in Link to navigate to product detail page.
      ----------------------------------------------------------- */}
      <Link to={`/product/${id}`} style={{ display: 'block', overflow: 'hidden', borderRadius: '12px' }}>
        <ImageWithFallback
          src={image}
          alt={title}
          width={300}
          height={300}
          fallbackText="Product"
          loading="lazy"
          style={{ 
            width: '100%',
            height: '220px',
            objectFit: 'contain',
            cursor: 'pointer',
            background: '#fff',
            border: '1px solid #e5e7eb'
          }}
        />
      </Link>

      {/* ------------------------------------------------------------
         TITLE → DETAILS LINK
         Heads-up: adjust the route to match your app. If your detail page
         uses `/product/:id` (singular), swap it below. I’m leaving your
         original `/products/:id` intact.
      ------------------------------------------------------------- */}
      <Link to={`/product/${id}`} className="p-title">
        {title}
      </Link>

      {/* ------------------------------------------------------------
         META LINE (Category + Rating)
      ------------------------------------------------------------- */}
      <div className="meta">
        {category} • ⭐ {rate}
      </div>

      {/* ------------------------------------------------------------
         SHORT DESCRIPTION
      ------------------------------------------------------------- */}
      <p className="meta" style={{ marginTop: 6, minHeight: 40 }}>
        {shortDescription}
      </p>

      {/* ------------------------------------------------------------
         INVENTORY STATUS
      ------------------------------------------------------------- */}
      {!isOutOfStock && inventory <= 10 && (
        <p className="meta" style={{ marginTop: 4, color: '#dc3545', fontWeight: 'bold' }}>
          Only {inventory} left in stock!
        </p>
      )}

      {/* ------------------------------------------------------------
         PURCHASE STRIP: Price — Qty — Add
         One tidy row: formatted price, quantity input, and the CTA.
      ------------------------------------------------------------- */}
      <div className="buy-row">
        <span className="price">{formatPrice(price)}</span>

        {/* Quantity input: browser validation + controlled state.
           If someone types chaos (0, -7, NaN), the add() guardrail fixes it. */}
        <input
          className="input qty"
          type="number"
          min="1"
          max={isOutOfStock ? 0 : inventory}
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          aria-label={`Quantity for ${title}`}
          disabled={isOutOfStock}
          style={isOutOfStock ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
        />

        {/* Add to Cart: dispatch to Redux and celebrate via modal. */}
        <button 
          className="btn btn-primary" 
          onClick={add}
          disabled={isOutOfStock}
          style={isOutOfStock ? { opacity: 0.5, cursor: 'not-allowed', fontSize: '14px', whiteSpace: 'nowrap' } : { fontSize: '14px', whiteSpace: 'nowrap' }}
        >
          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </article>
  )
}
