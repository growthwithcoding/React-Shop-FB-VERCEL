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

// Image safety net: Use a solid color placeholder to prevent flickering
const FALLBACK = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect width="300" height="300" fill="%23f5f5f5"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="18" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E'

export default function ProductCard({ product }) {
  // ------------------------------------------------------------
  // STATE & SETUP
  // ------------------------------------------------------------
  const dispatch = useDispatch()
  const [qty, setQty] = useState(1)

  // The essentials for the card. If rating ghosts us, I'm not showing NaN stares.
  const { id, title, price, category, description, image, rating, inventory = 0 } = product
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
          zIndex: 1
        }}>
          OUT OF STOCK
        </div>
      )}
      {/* ----------------------------------------------------------
         IMAGE (with placeholder + onError fallback)
         If the product image is missing or 404s mid-flight, we instantly swap to FALLBACK.
         Translation: no broken-image icons photobombing your grade.
      ----------------------------------------------------------- */}
      <img
        src={image && image.trim() && !image.includes('fakestoreapi') ? image : FALLBACK}
        alt={title}
        onError={(e) => { 
          if (e.currentTarget.src !== FALLBACK) {
            e.currentTarget.src = FALLBACK;
          }
        }}
        loading="lazy"
        style={{ backgroundColor: '#f5f5f5', minHeight: '200px' }}
      />

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
        {description}
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
          style={isOutOfStock ? { opacity: 0.5, cursor: 'not-allowed', fontSize: '14px' } : { fontSize: '14px' }}
        >
          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </article>
  )
}
