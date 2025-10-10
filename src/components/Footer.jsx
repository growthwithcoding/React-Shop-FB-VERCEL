import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  listProducts,
  getCategories,
  categoryLabel,
} from "../services/productService.js";
import { listOrders } from "../services/orderService.js";
import { useAuth } from "../auth/useAuth";
import { useState, useEffect, useMemo } from "react";
import { watchSettings } from "../services/settingsService";
import { APP_VERSION } from "../lib/version.js";

/**
 * Truncate a string to a maximum length, adding an ellipsis if needed.
 */
function truncate(s, n = 26) {
  if (!s) return "";
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

/**
 * Site footer. Uses store settings to render the brand name and logo.
 */
export default function Footer() {
  const { user } = useAuth();

  const [storeName, setStoreName] = useState("Advanced React E-Commerce");
  const [storeLogo, setStoreLogo] = useState("/reactstore.svg");
  const [supportHours, setSupportHours] = useState(null);

  // Watch store settings for real-time updates
  useEffect(() => {
    const unsubscribe = watchSettings((settings) => {
      if (settings.store) {
        if (settings.store.name) setStoreName(settings.store.name);
        if (settings.store.logo) setStoreLogo(settings.store.logo || "/reactstore.svg");
        if (settings.store.supportHours) setSupportHours(settings.store.supportHours);
      }
    });
    return () => unsubscribe();
  }, []);

  // Popular products - based on most sold
  const {
    data: products = [],
    isLoading: loadingProducts,
    isError: errorProducts,
  } = useQuery({ queryKey: ["footer-popular"], queryFn: listProducts });

  const {
    data: orders = [],
    isLoading: loadingOrders,
  } = useQuery({ queryKey: ["footer-orders"], queryFn: () => listOrders({ take: 200 }) });

  // Calculate most sold products
  const picks = useMemo(() => {
    if (!products.length) return [];
    
    // If no orders, fallback to random products
    if (!orders.length) {
      const shuffled = [...products].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 5);
    }
    
    // Tally up sales by SKU (order items use sku field)
    const salesTally = new Map();
    for (const order of orders) {
      const items = Array.isArray(order.items) ? order.items : [];
      for (const item of items) {
        const sku = item.sku;
        if (sku) {
          const qty = Number(item.qty) || Number(item.quantity) || 1;
          salesTally.set(sku, (salesTally.get(sku) || 0) + qty);
        }
      }
    }
    
    // Sort products by sales count (matching by product.id which is the SKU)
    const productsWithSales = products
      .map(p => ({
        ...p,
        totalSold: salesTally.get(p.id) || 0,
      }))
      .filter(p => p.totalSold > 0)
      .sort((a, b) => b.totalSold - a.totalSold);
    
    // If we have products with sales, return top 5
    if (productsWithSales.length > 0) {
      return productsWithSales.slice(0, 5);
    }
    
    // Fallback to random products if no sales data
    const shuffled = [...products].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 5);
  }, [orders, products]);

  // Categories
  const {
    data: categories = [],
    isLoading: loadingCats,
    isError: errorCats,
  } = useQuery({ queryKey: ["footer-categories"], queryFn: getCategories });

  const hasCategories =
    !loadingCats && !errorCats && Array.isArray(categories) && categories.length > 0;

  return (
    <footer className="footer">
      <div className="container">
        {/* Popular products */}
        <div className="foot-products full">
          <div className="foot-label">Popular:</div>
          <div className="foot-chips" aria-live="polite">
            {(loadingProducts || loadingOrders) && <span className="chip">Loading…</span>}
            {errorProducts && <span className="chip">Couldn't load</span>}
            {!loadingProducts && !loadingOrders && !errorProducts && picks.length === 0 && (
              <>
                <span className="chip" aria-disabled="true">No products yet</span>
                {user?.role === "admin" && (
                  <Link to="/admin/products" className="chip link" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    + Add your first product
                  </Link>
                )}
              </>
            )}
            {!loadingProducts &&
              !loadingOrders &&
              !errorProducts &&
              picks.map((p) => (
                <Link key={p.id} to={`/product/${p.id}`} className="chip link" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                  {truncate(p.title)}
                </Link>
              ))}
          </div>
        </div>

        <div className="footer-columns">
          <div className="col about">
            <img
              src={storeLogo || "/reactstore.svg"}
              alt={`${storeName} logo`}
              className="footer-logo"
            />
            <h4>{storeName}</h4>
            <p>
              Capstone for the <strong>Coding Temple Software Engineering Boot
              Camp</strong> — built with React Query, Redux Toolkit, React
              Router, and Firestore.
            </p>
          </div>

          <div className="col">
            <h5>Shop</h5>
            <ul>
              <li><Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Home</Link></li>
              <li><Link to="/cart" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Cart</Link></li>
              <li><Link to="/checkout" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Checkout</Link></li>
              <li><Link to="/about" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>About</Link></li>
              <li><Link to="/contact" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Support</Link></li>
            </ul>
          </div>

          {supportHours && (
            <div className="col">
              <h5>Support Hours</h5>
              <ul>
                {Object.entries(supportHours).map(([day, hours]) => (
                  <li key={day}>
                    <span style={{ textTransform: "capitalize" }}>
                      {day.slice(0, 3)}:
                    </span>{" "}
                    <span style={{ opacity: 0.8 }}>
                      {hours.isOpen 
                        ? `${hours.open} - ${hours.close}`
                        : "Closed"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Categories column */}
          <div className="col">
            <h5>Categories</h5>
            <ul>
              {loadingCats && <li>Loading…</li>}
              {errorCats && <li>Couldn't load</li>}

              {/* Empty-state logic */}
              {!loadingCats && !errorCats && !hasCategories && (
                <>
                  <li>No categories yet</li>
                  {user?.role === "admin" && (
                    <li>
                      <Link to="/admin/products" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        + Create a product
                      </Link>
                    </li>
                  )}
                </>
              )}

              {/* Real categories */}
              {hasCategories &&
                categories.map((cat) => (
                  <li key={cat}>
                    <Link
                      to={{ pathname: "/", search: `?cat=${encodeURIComponent(cat)}` }}
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    >
                      {categoryLabel(cat)}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>

        </div>
      </div>

      <div className="footer-bottom">
        <div className="tech-stack">
          <a href="https://react.dev/" target="_blank" rel="noopener noreferrer">
            <img src="/logos/REACT.png" alt="React" title="React" className="stack-logo" />
          </a>
          <img src="/logos/plus.png" alt="+" className="stack-plus" />
          <a href="https://redux-toolkit.js.org/" target="_blank" rel="noopener noreferrer">
            <img src="/logos/REDUX.png" alt="Redux Toolkit" title="Redux Toolkit" className="stack-logo" />
          </a>
          <img src="/logos/plus.png" alt="+" className="stack-plus" />
          <a href="https://reactrouter.com/" target="_blank" rel="noopener noreferrer">
            <img src="/logos/REACT-ROUTER.png" alt="React Router" title="React Router" className="stack-logo" />
          </a>
          <img src="/logos/plus.png" alt="+" className="stack-plus" />
          <a href="https://tanstack.com/query/latest" target="_blank" rel="noopener noreferrer">
            <img src="/logos/REACT-QUERY.png" alt="TanStack Query" title="TanStack Query (React Query)" className="stack-logo" />
          </a>
          <img src="/logos/plus.png" alt="+" className="stack-plus" />
          <a href="https://firebase.google.com/" target="_blank" rel="noopener noreferrer">
            <img src="/logos/FB.png" alt="Firebase" title="Firebase" className="stack-logo" />
          </a>
          <img src="/logos/plus.png" alt="+" className="stack-plus" />
          <a href="https://firebase.google.com/docs/firestore" target="_blank" rel="noopener noreferrer">
            <img src="/logos/FIRESTORE.png" alt="Firestore" title="Firestore" className="stack-logo" />
          </a>
          <img src="/logos/plus.png" alt="+" className="stack-plus" />
          <a href="https://vite.dev/" target="_blank" rel="noopener noreferrer">
            <img src="/logos/VITE.png" alt="Vite" title="Vite" className="stack-logo" />
          </a>
          <img src="/logos/plus.png" alt="+" className="stack-plus" />
          <a href="https://www.emailjs.com/" target="_blank" rel="noopener noreferrer">
            <img src="/logos/EMAILJS.png" alt="EmailJS" title="EmailJS" className="stack-logo emailjs" />
          </a>
          <img src="/logos/plus.png" alt="+" className="stack-plus" />
          <a href="https://tailwindcss.com/" target="_blank" rel="noopener noreferrer">
            <img src="/logos/TAILWIND.png" alt="Tailwind CSS" title="Tailwind CSS" className="stack-logo" />
          </a>
        </div>
        <small>© 2025 {storeName}. All rights reserved. | Version {APP_VERSION}</small>
        <a className="tag" href="https://github.com/growthwithcoding" target="_blank" rel="noreferrer">
          #growthwithcoding
        </a>
      </div>
    </footer>
  );
}
