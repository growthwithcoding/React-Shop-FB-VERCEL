import { Link } from 'react-router-dom';
import Cart from '../components/Cart.jsx'
import CartRecommendations from '../components/CartRecommendations.jsx'

export default function CartPage() {
  return (
    <div style={{ 
      width: '100%',
      maxWidth: '100%',
      paddingTop: 24, 
      paddingBottom: 24,
      paddingLeft: 'max(24px, calc((100vw - 1400px) / 2))',
      paddingRight: 'max(24px, calc((100vw - 1400px) / 2))'
    }}>
      {/* Hero Headline */}
      <div className="hero-headline" style={{ marginBottom: 24 }}>
        <div>
          <div className="kicker">Your Cart</div>
          <h1 style={{ margin: 0 }}>Shopping Cart</h1>
          <div className="meta" style={{ marginTop: 8 }}>
            Review your items and proceed to checkout
          </div>
        </div>
        <Link 
          to="/" 
          className="btn btn-secondary"
          style={{
            fontSize: "13px",
            padding: "8px 14px",
            whiteSpace: "nowrap"
          }}
        >
          ← Continue Shopping
        </Link>
      </div>

      {/* Full-width layout with 2 columns: 2/3 cart, 1/3 recommendations */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 32,
          alignItems: 'start'
        }}>
          {/* Left column: Cart (2/3 width) */}
          <main>
            <Cart />
          </main>

          {/* Right column: Recommendations (1/3 width) */}
          <aside>
            <CartRecommendations />
          </aside>
      </div>
    </div>
  );
}
