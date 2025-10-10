// Cart.jsx
// ------------------------------------------------------------
// WHAT THIS DOES:
// Shopping cart page with live totals, quantity controls, and checkout flow — all wired into Redux.
// ------------------------------------------------------------

import { useDispatch, useSelector } from 'react-redux'
import { removeItem, setQuantity } from '../features/cart/cartSlice.js'
import { selectCartItems, selectTotalCount, selectTotalPrice } from '../features/cart/selectors.js'
import { Link, useNavigate } from 'react-router-dom'
import { formatPrice } from '../utils/money.js'

const FALLBACK = 'https://via.placeholder.com/80?text=No+Image'

export default function Cart() {
  // Assignment: Cart State & Derivations
  // Pulling the goods (items) plus the derived totals (count/price) straight from Redux.
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const items = useSelector(selectCartItems)
  const totalCount = useSelector(selectTotalCount)
  const totalPrice = useSelector(selectTotalPrice)

  // Assignment: Empty Cart View
  // If you've got nothing, I'm not making you scroll through existential emptiness.
  if (!items || items.length === 0) {
    return (
      <section className="container cart">
        <div className="hero-headline" style={{ marginBottom: 12 }}>
          <div>
            <div className="kicker">Your Selections</div>
            <h1 style={{ margin: 0 }}>Shopping Cart</h1>
            <div className="meta" style={{ marginTop: 8 }}>
              Your cart is empty. Start adding items to begin shopping.
            </div>
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 24 }}>
          <p>Cart's looking a little… minimalist.</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Browse Products
          </button>
        </div>
      </section>
    )
  }

  // Helper: clamp quantity to a sensible min (1) so we never store a zero or negative.
  const clampQty = (n) => (Number.isFinite(+n) && +n > 0 ? Math.floor(+n) : 1)

  return (
    <section className="container cart" aria-live="polite">
      {/* Assignment: Cart Header w/ Counts */}
      <div className="hero-headline" style={{ marginBottom: 12 }}>
        <div>
          <div className="kicker">Your Selections</div>
          <h1 style={{ margin: 0 }}>Shopping Cart</h1>
          <div className="meta" style={{ marginTop: 8 }}>
            Review your items and proceed to checkout. <strong>{totalCount}</strong> {totalCount === 1 ? 'item' : 'items'} in cart.
          </div>
        </div>
      </div>

      {/* Assignment: Cart Line Items */}
      <div className="stack" style={{ display: 'grid', gap: 12 }}>
        {items.map((i) => (
          <article
            key={i.id}
            className="card"
            style={{ display: 'grid', gridTemplateColumns: '80px 1fr auto', gap: 12, alignItems: 'center' }}
            aria-label={`Cart item: ${i.title}`}
          >
            {/* Assignment: Product Image + Fallback */}
            <img
              src={i.image || FALLBACK}
              alt=""
              width={80}
              height={80}
              style={{ objectFit: 'contain', background: '#fff', border: '1px solid #eee', borderRadius: 8 }}
              onError={(e) => {
                // Assignment: Image Fallback — if the API is shy, we’re still showing something.
                e.currentTarget.src = FALLBACK
              }}
            />

            {/* Assignment: Title + Price */}
            <div style={{ display: 'grid', gap: 6 }}>
              <div style={{ fontWeight: 700, lineHeight: 1.2 }}>{i.title}</div>
              <div className="muted">
                {/* Unit price stays visible so no one needs a calculator mid-scroll. */}
                {formatPrice(i.price)}
              </div>

              {/* Assignment: Quantity Controls (a11y-friendly)
              a11y = accessibility; prioritize semantic HTML, proper labeling, visible focus,
              and keyboard operability; use ARIA to fill gaps for custom controls. */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                <label htmlFor={`qty-${i.id}`} className="sr-only">Quantity for {i.title}</label>
                <button
                  type="button"
                  className="btn"
                  aria-label={`Decrease quantity for ${i.title}`}
                  onClick={() => dispatch(setQuantity({ id: i.id, quantity: Math.max(1, i.quantity - 1) }))}
                >
                  −
                </button>
                <input
                  id={`qty-${i.id}`}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={i.quantity}
                  onChange={(e) => {
                    const next = clampQty(e.target.value)
                    dispatch(setQuantity({ id: i.id, quantity: next }))
                  }}
                  onBlur={(e) => {
                    // Normalize any weird input on blur (because chaos belongs in dev, not prod).
                    const next = clampQty(e.target.value)
                    if (next !== i.quantity) {
                      dispatch(setQuantity({ id: i.id, quantity: next }))
                    }
                  }}
                  style={{ width: 64, textAlign: 'center' }}
                />
                <button
                  type="button"
                  className="btn"
                  aria-label={`Increase quantity for ${i.title}`}
                  onClick={() => dispatch(setQuantity({ id: i.id, quantity: i.quantity + 1 }))}
                >
                  +
                </button>
              </div>
            </div>

            {/* Assignment: Line Total + Remove */}
            <div style={{ display: 'grid', justifyItems: 'end', gap: 8 }}>
              <div style={{ fontWeight: 700 }}>
                {formatPrice(i.price * i.quantity)}
              </div>
              <button
                className="btn btn-danger"
                aria-label={`Remove ${i.title} from cart`}
                onClick={() => dispatch(removeItem(i.id))}
              >
                Remove
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* Assignment: Subtotal + Checkout CTA */}
      <div
        className="card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 12,
          paddingTop: 16
        }}
      >
        <div style={{ fontWeight: 800 }}>
          Subtotal: {formatPrice(totalPrice)}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/')}
            aria-label="Continue shopping"
          >
            Continue Shopping
          </button>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/checkout')}
            aria-label="Proceed to checkout"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>

      {/* Assignment: Accessibility Notes
          - Live region on the section keeps assistive tech informed when totals change.
          - Explicit aria-labels on buttons so “Remove” doesn’t feel mysterious. */}
    </section>
  )
}
