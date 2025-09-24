import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectCartItems, selectTotalPrice } from '../features/cart/selectors.js'
import { clear } from '../features/cart/cartSlice.js'
import { formatPrice } from '../utils/money.js'
import { Link, useNavigate } from 'react-router-dom'

const FALLBACK = 'https://via.placeholder.com/80?text=No+Image'

export default function CheckoutPage() {
  const items = useSelector(selectCartItems)
  const subtotal = useSelector(selectTotalPrice)

  // input the user is typing
  const [coupon, setCoupon] = useState('')
  // coupon that has actually been applied by clicking the button
  const [appliedCoupon, setAppliedCoupon] = useState('')

  const [form, setForm] = useState({
    fullName: '', phone: '', address: '', country: '', state: '', city: '', zip: ''
  })

  const navigate = useNavigate()
  const dispatch = useDispatch()

  // local toast near the coupon box
  const [toast, setToast] = useState({ open: false, msg: '', kind: 'success' })
  useEffect(() => {
    if (!toast.open) return
    const t = setTimeout(() => setToast(s => ({ ...s, open: false })), 1800)
    return () => clearTimeout(t)
  }, [toast.open])

  const showToast = (msg, kind = 'success') =>
    setToast({ open: true, msg, kind })

  const normalizeCode = (code) => (code || '').trim().toUpperCase()

  const applyCoupon = () => {
    const norm = normalizeCode(coupon)
    if (norm === 'SAVE10') {
      setAppliedCoupon(norm)
      showToast('SAVE10 applied: 10% off 🎉 (max $50).', 'success')
    } else if (norm === 'REACT20') {
      setAppliedCoupon(norm)
      showToast('REACT20 applied: 20% off. 🎉', 'success')
    } else if (norm === 'CODINGTEMPLE') {
      setAppliedCoupon(norm)
      showToast('CODINGTEMPLE applied: 100% OFF! 🎉', 'success')
    } else if (norm) {
      setAppliedCoupon('')
      showToast('Invalid coupon code.', 'error')
    } else {
      setAppliedCoupon('')
      showToast('Enter a coupon code first.', 'error')
    }
  }

  // delivery & totals
  const baseDelivery = items.length ? 2 : 0
  const delivery = appliedCoupon === 'CODINGTEMPLE' ? 0 : baseDelivery
  const rate =
    appliedCoupon === 'CODINGTEMPLE'
      ? 1.0
      : appliedCoupon === 'SAVE10'
      ? 0.10
      : appliedCoupon === 'REACT20'
      ? 0.20
      : 0
  const discount = rate
    ? (appliedCoupon === 'SAVE10' ? Math.min(subtotal * 0.10, 50) : subtotal * rate)
    : 0
  const total = Math.max(subtotal + delivery - discount, 0)

  const placeOrder = (e) => {
    e.preventDefault()
    dispatch(clear())
    alert('Order placed! (Simulated) Your cart has been cleared.')
    navigate('/')
  }

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  // ---------- New: funny empty-state (mirrors Cart page vibe) ----------
  if (items.length === 0) {
    return (
      <main className="container" style={{ padding: 24 }}>
        <h1 style={{ marginTop: 0 }}>Checkout</h1>
        <section
          className="card"
          style={{
            textAlign: 'center',
            padding: '28px 24px',
            borderRadius: 12,
            boxShadow: '0 6px 24px rgba(0,0,0,0.06)',
          }}
        >
          <p style={{ marginBottom: 16 }}>
            Trying to check out with <strong>zero</strong> items? That’s a bold new budgeting strategy. 😄
          </p>
          <Link
            to="/"
            className="btn btn-primary"
            style={{
              display: 'inline-block',
              padding: '10px 16px',
              borderRadius: 8,
              textDecoration: 'none',
              fontWeight: 700,
            }}
          >
            Browse Products
          </Link>
        </section>
      </main>
    )
  }
  // ---------------------------------------------------------------------

  return (
    <div className="container grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <form className="grid" onSubmit={placeOrder}>
        <div className="card grid">
          <h3 style={{ margin: '0 0 6px' }}>Billing Address</h3>
          <input className="input" placeholder="Full Name *" value={form.fullName} onChange={update('fullName')} required />
          <input className="input" placeholder="Phone Number *" value={form.phone} onChange={update('phone')} required />
          <input className="input" placeholder="Address *" value={form.address} onChange={update('address')} required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input className="input" placeholder="Country *" value={form.country} onChange={update('country')} required />
            <input className="input" placeholder="State *" value={form.state} onChange={update('state')} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input className="input" placeholder="City *" value={form.city} onChange={update('city')} required />
            <input className="input" placeholder="Zip / Postal Code *" value={form.zip} onChange={update('zip')} required />
          </div>
        </div>

        <div className="card grid">
          <h3 style={{ margin: '0 0 6px' }}>Payment Method</h3>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="radio" name="pay" defaultChecked /> <span>Credit / Debit Card</span>
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="radio" name="pay" /> <span>PayPal</span>
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="radio" name="pay" /> <span>Cash on Delivery</span>
          </label>
        </div>

        <button className="btn btn-primary checkout-submit" type="submit">Place Order</button>
      </form>

      <section className="grid">
        <div className="card grid">
          <h3 style={{ margin: '0 0 6px' }}>Your Order</h3>
          {items.map(i => (
            <div key={i.id} className="card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <img
                src={i.image || FALLBACK}
                alt={i.title}
                width={80}
                height={80}
                style={{ objectFit: 'contain', background: '#fff', border: '1px solid #eee', borderRadius: 8 }}
                onError={(e) => { e.currentTarget.src = FALLBACK }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{i.title}</div>
                <div className="meta">Qty: {i.quantity}</div>
              </div>
              <div style={{ fontWeight: 700 }}>{formatPrice(i.price * i.quantity)}</div>
            </div>
          ))}

          {/* Coupon row with local toast over the input */}
          <form
            className="grid coupon-row"
            style={{ gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center' }}
            onSubmit={(e) => { e.preventDefault(); applyCoupon(); }}
          >
            {toast.open && (
              <div className={`toast coupon ${toast.kind}`} role="status" aria-live="polite">
                {toast.msg}
              </div>
            )}
            <input
              id="coupon-input"
              className="input"
              placeholder="Coupon Code (try SAVE10)"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
            />
            <button className="btn btn-secondary" type="submit">Apply</button>
          </form>

          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal</span><strong>{formatPrice(subtotal)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Delivery</span><strong>{formatPrice(delivery)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Discount</span><strong>-{formatPrice(discount)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18 }}>
              <span>Total</span><strong>{formatPrice(total)}</strong>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
