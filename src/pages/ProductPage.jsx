import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getProduct } from '../api/fakestore.js'
// suggestions
import { getProductsByCategory } from '../api/fakestore.js'
import { useDispatch } from 'react-redux'
import { addItem } from '../features/cart/cartSlice.js'
import { showAddModal } from '../features/ui/uiSlice.js'
import { useState } from 'react'
import { formatPrice } from '../utils/money.js'
import Testimonials from '../components/Testimonials.jsx'
import ProductCard from '../components/ProductCard.jsx'

const FALLBACK = 'https://via.placeholder.com/400x400?text=Product'

export default function ProductPage(){
  const { id } = useParams()
  const { data: p, isLoading, isError } = useQuery({ queryKey:['product', id], queryFn:()=>getProduct(id) })
  const [qty, setQty] = useState(1)
  const dispatch = useDispatch()

  // Fetch related products from same category once product is loaded
  const { data: related = [] } = useQuery({
    enabled: !!p?.category,
    queryKey: ['related', p?.category],
    queryFn: () => getProductsByCategory(p.category)
  })
  if (isLoading) return <div className="container"><p>Loading…</p></div>
  if (isError || !p) return <div className="container"><p>Could not load product.</p></div>

  const add = () => {
    const quantity = Math.max(1, Number(qty) || 1)
    dispatch(addItem({ id: p.id, title: p.title, price: p.price, image: p.image, quantity }))
    dispatch(showAddModal({ title: p.title, image: p.image, quantity, price: p.price }))
  }

  return (
  <div className="container" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:20}}>
    <div className="card">
      <img src={p.image || FALLBACK} alt={p.title} style={{width:'100%',height:380,objectFit:'contain'}}
           onError={(e)=>{e.currentTarget.src=FALLBACK}} />
    </div>
    <div className="card product-detail-card">
      <h2 style={{marginTop:0}}>{p.title}</h2>
      <div className="meta">{p.category} • ⭐ {p.rating?.rate ?? 'N/A'}</div>
      <p style={{marginTop:10}}>{p.description}</p>

      {/* ONE ROW: Price — Qty — Add */}
      <div className="buy-row">
        <span className="price">{formatPrice(p.price)}</span>
        <input
          className="input qty"
          type="number"
          min="1"
          value={qty}
          onChange={(e)=>setQty(e.target.value)}
        />
        <button className="btn btn-primary" onClick={add}>Add to Cart</button>
      </div>
    </div>

    {/* Full-width below details */}
    <div style={{gridColumn:'1 / -1'}}>
      <Testimonials productId={p.id} rating={p.rating?.rate || 0} />

      <section className="suggested-section">
        <h3>You might also like</h3>
        <div className="suggested-grid">
          {(related || []).filter(r => r.id !== p.id).slice(0,8).map(r => (
            <ProductCard key={r.id} product={r} />
          ))}
        </div>
      </section>
    </div>
  </div>
)
}
