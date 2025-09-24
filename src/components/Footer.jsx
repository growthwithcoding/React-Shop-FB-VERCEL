// Footer.jsx
// -------------------------------------------------------=======-----
// WHAT THIS DOES:
// Site-wide footer with dynamic “Popular” chips, quick nav columns,
// and a capstone blurb. Even has category links that jump to the Hero.
// ---------------------------------------------------------========---

import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getAllProducts } from '../api/fakestore.js'

function truncate(s, n=26){
  if(!s) return ''
  return s.length > n ? s.slice(0, n-1) + '…' : s
}

export default function Footer(){
  const { data: products = [] } = useQuery({ queryKey: ['footer-popular'], queryFn: getAllProducts })
  const picks = products.slice().sort((a,b) => (b?.rating?.rate??0) - (a?.rating?.rate??0) || (b.price - a.price)).slice(0, 5)

  return (
    <footer className="footer">
      <div className="container">
        <div className="foot-products full">
          <div className="foot-label">Popular:</div>
          <div className="foot-chips">
            {picks.map(p => (
              <Link key={p.id} to={`/product/${p.id}`} className="chip link">
                {truncate(p.title)}
              </Link>
            ))}
          </div>
        </div>

        <div className="footer-columns">
          <div className="col about">
            <img src="/reactstore.svg" alt="ReactStore logo" className="footer-logo" />
            <h4>Advanced React E-Commerce</h4>
            <p>
              Capstone for the <strong>Coding Temple Software Engineering Boot Camp</strong> | 
              a compact build using React Query, Redux Toolkit, routing, and a simulated
              checkout over FakeStore API.
            </p>
          </div>

          <div className="col">
            <h5>Shop</h5>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/cart">Cart</Link></li>
              <li><Link to="/checkout">Checkout</Link></li>
            </ul>
          </div>

          <div className="col">
            <h5>Categories</h5>
            <ul>
              <li><Link to={{ pathname: "/", search: `?cat=electronics` }}>Electronics</Link></li>
              <li><Link to={{ pathname: "/", search: `?cat=jewelery` }}>Jewelery</Link></li>
              <li><Link to={{ pathname: "/", search: `?cat=${encodeURIComponent("men's clothing")}` }}>Men’s clothing</Link></li>
              <li><Link to={{ pathname: "/", search: `?cat=${encodeURIComponent("women's clothing")}` }}>Women’s clothing</Link></li>
            </ul>
          </div>

          <div className="col">
            <h5>Resources</h5>
            <ul>
              <li><a href="https://react.dev" target="_blank" rel="noreferrer">React</a></li>
              <li><a href="https://tanstack.com/query/latest" target="_blank" rel="noreferrer">React Query</a></li>
              <li><a href="https://redux-toolkit.js.org/" target="_blank" rel="noreferrer">Redux Toolkit</a></li>
              <li><a href="https://reactrouter.com/" target="_blank" rel="noreferrer">React Router</a></li>
              <li><a href="https://vitejs.dev" target="_blank" rel="noreferrer">Vite</a></li>
              <li><a href="https://fakestoreapi.com" target="_blank" rel="noreferrer">FakeStore API</a></li>
            </ul>
          </div>

          <div className="col">
            <h5>Company</h5>
            <ul>
              <li><Link to="/about">About</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <small>© 2025 Advanced React E-Commerce. All rights reserved.</small>
          <a className="tag" href="https://github.com/growthwithcoding" target="_blank" rel="noreferrer">#growthwithcoding</a>
        </div>
      </div>
    </footer>
  )
}
