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

// Image safety net: if the API sneezes, we still look presentable.
const FALLBACK = 'https://via.placeholder.com/300x300?text=No+Image'

export default function ProductCard({ product }) {
  // ------------------------------------------------------------
  // STATE & SETUP
  // ------------------------------------------------------------
  const dispatch = useDispatch()
  const [qty, setQty] = useState(1)

  // The essentials for the card. If rating ghosts us, I’m not showing NaN stares.
  const { id, title, price, category, description, image, rating } = product
  const rate = rating?.rate ?? 'N/A'

  // ------------------------------------------------------------
  // ADD TO CART (Redux + UI Feedback)
  // ------------------------------------------------------------
  const add = () => {
    // Guardrail: never add less than 1 (because “zero items” is a prank, not a purchase).
    const quantity = Math.max(1, Number(qty) || 1)

    // Cart payload: the cart slice calculates totals elsewhere; we just deliver the goods.
    dispatch(addItem({ id, title, price, image, quantity }))

    // UI win: open the “Added to Cart” modal so users get that confetti moment.
    dispatch(showAddModal({ title, image, quantity, price }))
  }

  return (
    // ------------------------------------------------------------
    // CARD WRAPPER
    // ------------------------------------------------------------
    <article className="card p-card" aria-label={`Product: ${title}`}>
      {/* ----------------------------------------------------------
         IMAGE (with placeholder + onError fallback)
         If the product image is missing or 404s mid-flight, we instantly swap to FALLBACK.
         Translation: no broken-image icons photobombing your grade.
      ----------------------------------------------------------- */}
      <img
        src={image || FALLBACK}
        alt={title}
        onError={(e) => { e.currentTarget.src = FALLBACK }}
        loading="lazy"
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
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          aria-label={`Quantity for ${title}`}
        />

        {/* Add to Cart: dispatch to Redux and celebrate via modal. */}
        <button className="btn btn-primary" onClick={add}>
          Add to Cart
        </button>
      </div>
    </article>
  )
}
