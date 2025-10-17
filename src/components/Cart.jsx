// Cart.jsx
// ------------------------------------------------------------
// WHAT THIS DOES:
// Shopping cart page with live totals, quantity controls, and checkout flow — all wired into Redux.
// ------------------------------------------------------------

import { useDispatch, useSelector } from 'react-redux'
import { removeItem, setQuantity } from '../features/cart/cartSlice.js'
import { selectCartItems, selectTotalPrice } from '../features/cart/selectors.js'
import { Link, useNavigate } from 'react-router-dom'
import { formatPrice } from '../utils/money.js'
import ImageWithFallback from './ImageWithFallback.jsx'
import { useQuery } from '@tanstack/react-query'
import { getProduct } from '../services/productService'

export default function Cart() {
  // Assignment: Cart State & Derivations
  // Pulling the goods (items) plus the derived totals (count/price) straight from Redux.
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const items = useSelector(selectCartItems)
  const totalPrice = useSelector(selectTotalPrice)

  // Fetch product details for all cart items to get current inventory
  const productQueries = useQuery({
    queryKey: ['cart-products', items.map(i => i.id)],
    queryFn: async () => {
      const products = await Promise.all(
        items.map(item => getProduct(item.id).catch(() => null))
      )
      return products.reduce((acc, product) => {
        if (product) {
          acc[product.id] = product
        }
        return acc
      }, {})
    },
    enabled: items.length > 0,
  })

  const productsData = productQueries.data || {}

  // Assignment: Empty Cart View
  // If you've got nothing, I'm not making you scroll through existential emptiness.
  if (!items || items.length === 0) {
    return (
      <section className="container cart">
        <div className="card" style={{ textAlign: 'center', padding: 24 }}>
          <p>Cart's looking a little… minimalist.</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Browse Products
          </button>
        </div>
      </section>
    )
  }

  // Helper: clamp quantity to a sensible min (1) and max (inventory) so we never store invalid quantities.
  const clampQty = (n, maxInventory) => {
    const num = Number.isFinite(+n) && +n > 0 ? Math.floor(+n) : 1
    return maxInventory !== undefined ? Math.min(num, maxInventory) : num
  }

  // Get max quantity for a cart item based on product inventory
  const getMaxQuantity = (itemId) => {
    const product = productsData[itemId]
    return product?.inventory ?? 999 // Default to high number if inventory not found
  }

  return (
    <section className="container cart" aria-live="polite">
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
            <Link to={`/product/${i.id}`} style={{ position: 'relative', display: 'block' }}>
              <ImageWithFallback
                src={i.image}
                alt=""
                width={80}
                height={80}
                fallbackText="Cart"
                style={{ objectFit: 'contain', border: '1px solid #eee', borderRadius: 8, cursor: 'pointer' }}
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
                {i.quantity}
              </div>
            </Link>

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
                  max={getMaxQuantity(i.id)}
                  value={i.quantity}
                  onChange={(e) => {
                    const maxQty = getMaxQuantity(i.id)
                    const next = clampQty(e.target.value, maxQty)
                    dispatch(setQuantity({ id: i.id, quantity: next }))
                  }}
                  onBlur={(e) => {
                    // Normalize any weird input on blur and enforce inventory limits.
                    const maxQty = getMaxQuantity(i.id)
                    const next = clampQty(e.target.value, maxQty)
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
                  onClick={() => {
                    const maxQty = getMaxQuantity(i.id)
                    const newQty = Math.min(i.quantity + 1, maxQty)
                    dispatch(setQuantity({ id: i.id, quantity: newQty }))
                  }}
                  disabled={i.quantity >= getMaxQuantity(i.id)}
                >
                  +
                </button>
              </div>
              {/* Show inventory warning if low stock */}
              {(() => {
                const product = productsData[i.id]
                if (product && product.inventory <= 10 && product.inventory > 0) {
                  return (
                    <div style={{ fontSize: 12, color: '#856404', marginTop: 4 }}>
                      Only {product.inventory} left in stock
                    </div>
                  )
                }
                if (product && product.inventory === 0) {
                  return (
                    <div style={{ fontSize: 12, color: '#dc3545', marginTop: 4, fontWeight: 600 }}>
                      Out of stock
                    </div>
                  )
                }
                return null
              })()}
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
