// About.jsx
// ------------------------------------------------------------
// WHAT THIS DOES:
// A presentable About page that breaks the assignment into 
// clear, scannable sections with icon cards, and checklists.
// ------------------------------------------------------------

const FALLBACK = "https://via.placeholder.com/960x540?text=Project+Overview"

// Tiny, reusable inline icons — tinted with the app’s orange so the page feels on-brand.
function Icon({ name }) {
  const common = { width: 24, height: 24, viewBox: "0 0 24 24", "aria-hidden": true }
  switch (name) {
    case "catalog":
      return <svg {...common}><path d="M4 5h6v6H4V5Zm10 0h6v6h-6V5ZM4 13h6v6H4v-6Zm10 6v-6h6v6h-6Z" fill="currentColor"/></svg>
    case "category":
      return <svg {...common}><path d="M12 2 2 7l10 5 10-5-10-5Zm-8 9v6l8 5 8-5v-6l-8 4-8-4Z" fill="currentColor"/></svg>
    case "cart":
      return <svg {...common}><path d="M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm10 0a2 2 0 1 0 .001 4A2 2 0 0 0 17 18ZM6.2 4l.65 3H21l-1.6 7.2a2 2 0 0 1-2 1.6H9a2 2 0 0 1-2-1.6L5.1 3.3A1 1 0 0 0 4.1 2H2v2h2.3l.4 2Z" fill="currentColor"/></svg>
    case "image":
      return <svg {...common}><path d="M21 5H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm0 12H3V7h18v10Zm-3-9-4 5-2-2-4 6h14l-4-9Z" fill="currentColor"/></svg>
    case "query":
      return <svg {...common}><path d="M11 18a7 7 0 1 1 4.9-12l3.8 3.8-1.4 1.4-3.8-3.8A5 5 0 1 0 13 16v2H9v-2h2Z" fill="currentColor"/></svg>
    case "redux":
      return <svg {...common}><path d="M12 3a4 4 0 0 1 3.9 3h-2.1a2 2 0 1 0-1.8 3H15a4 4 0 0 1-3 6.9 4 4 0 0 1-3.9-3h2.1a2 2 0 1 0 1.8-3H9a4 4 0 0 1 3-6.9Z" fill="currentColor"/></svg>
    case "router":
      return <svg {...common}><path d="M3 11h18v2H3v-2Zm4-6h10v2H7V5Zm0 12h10v2H7v-2Z" fill="currentColor"/></svg>
    case "check":
      return <svg {...common}><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2Z" fill="currentColor"/></svg>
    default:
      return null
  }
}

// Orange pills
function Pill({ children }) {
  return (
    <span
      className="pill"
      style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        borderRadius: 999, padding: "6px 12px", fontSize: 12,
        background: "var(--pill-bg, #FFF7E6)",   // light orange
        color: "var(--pill-fg, var(--primary-dark))"
      }}
    >
      {children}
    </span>
  )
}

function Card({ title, icon, subtitle, children }) {
  return (
    <div
      className="card about-card"
      style={{
        borderRadius: 16, padding: 20, boxShadow: "0 8px 24px rgba(0,0,0,.06)",
        background: "#fff", display: "grid", gap: 12
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          className="iconwrap"
          style={{
            display: "grid", placeItems: "center",
            width: 40, height: 40, borderRadius: 12,
            background: "#FFF4E5",  
            color: "var(--primary)"    
          }}
        >
          <Icon name={icon} />
        </span>
        <div>
          <h3 style={{ margin: 0, fontSize: 18 }}>{title}</h3>
          {subtitle && <p className="muted" style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>{subtitle}</p>}
        </div>
      </div>
      <div>{children}</div>
    </div>
  )
}

export default function About() {
  const checklist = [
    {
      title: "Product Catalog",
      points: [
        "Use React Query to fetch all store products on Home.",
        "Display title, price, category, description, rating, and image.",
        "Include an Add to Cart button on every product card."
      ],
      icon: "catalog"
    },
    {
      title: "Category Navigation",
      points: [
        "Dropdown pulls categories dynamically (not hard-coded).",
        "GET /products/categories via React Query.",
        "Selecting a category fetches GET /products/category/{category} and shows only those products."
      ],
      icon: "category"
    },
    {
      title: "Shopping Cart (Redux Toolkit)",
      points: [
        "Reducers/actions for add, update quantity, and remove.",
        "Cart page lists items with image, count, and price.",
        "Add-to-cart works directly from the product listing."
      ],
      icon: "cart"
    },
    {
      title: "Persistence & Totals",
      points: [
        "Cart stored in sessionStorage as an array of product objects.",
        "Show total count and total price; both update live.",
        "Checkout simulates order by clearing Redux + sessionStorage and shows success feedback."
      ],
      icon: "redux"
    },
    {
      title: "Image Resilience",
      points: [
        "FakeStore images can 404; use a placeholder fallback.",
        "onError handlers swap to a visible placeholder instantly.",
        "Keeps the UI clean and usable even when the API ghosts us."
      ],
      icon: "image"
    },
    {
      title: "Project Logistics",
      points: [
        "Commit to a GitHub repo with a clean README.",
        "Submit repo to Classroom when finished.",
        "Present the project live — no presentation = automatic failure."
      ],
      icon: "router"
    }
  ]

  return (
    <main className="container" style={{ paddingBottom: 48 }}>
      {/* HERO */}
      <section
        className="about-hero card"
        style={{
          borderRadius: 20, padding: 24, marginTop: 16, marginBottom: 24,
          display: "grid", gap: 18, alignItems: "center"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <Pill>Assignment Overview</Pill>
          <Pill>React Query</Pill>
          <Pill>Redux Toolkit</Pill>
          <Pill>Router</Pill>
        </div>

        <h1 style={{ margin: 0 }}>About This Project</h1>
        <p style={{ margin: 0, color: "#4b5563" }}>
          Built as my capstone for the Coding Temple Software Engineering Boot Camp. The goal:
          turn advanced React topics into a clean, demo-ready e-commerce app — data fetching,
          state management, navigation, and a checkout story that behaves like the real thing.
        </p>

        <div className="hero-media" style={{ borderRadius: 16, overflow: "hidden", border: "1px solid #eee" }}>
          <img
            src="/reactstore-hero.png"
            onError={(e) => { e.currentTarget.src = FALLBACK }}
            alt="Project overview"
            style={{ width: "100%", display: "block" }}
          />
        </div>
      </section>

      {/* SNAPSHOT CARDS */}
      <section style={{ display: "grid", gap: 16 }}>
        <div
          className="grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16
          }}
        >
          <Card title="Product Catalog" icon="catalog" subtitle="React Query + product details">
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Live fetch from FakeStore API</li>
              <li>All key fields visible at a glance</li>
              <li>Add-to-cart right on the card</li>
            </ul>
          </Card>

          <Card title="Category Navigation" icon="category" subtitle="Dynamic, not hard-coded">
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Dropdown data via GET /products/categories</li>
              <li>Category view via GET /products/category/:cat</li>
              <li>Parent filters products in-place</li>
            </ul>
          </Card>

          <Card title="Cart & Checkout" icon="cart" subtitle="Redux Toolkit + sessionStorage">
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Add / update qty / remove</li>
              <li>Live totals (count + price)</li>
              <li>Checkout clears state + shows success</li>
            </ul>
          </Card>

          <Card title="Image Fallbacks" icon="image" subtitle="No broken thumbnails allowed">
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Placeholder on missing/failed images</li>
              <li>onError handler swaps instantly</li>
              <li>Consistent visuals even on 404s</li>
            </ul>
          </Card>
        </div>
      </section>

      {/* DEEP DIVE */}
      <section style={{ marginTop: 28 }}>
        <div
          className="grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 16
          }}
        >
          <Card title="Data & State" icon="query" subtitle="React Query + Redux Toolkit">
            <p className="muted" style={{ marginTop: 0 }}>
              React Query owns network state (loading, error, caching). Redux owns app state for
              the cart (items + quantities). Clear separation, fewer headaches.
            </p>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--primary)" }}>
                <Icon name="check" /> Category list cached by <code>queryKey</code>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--primary)" }}>
                <Icon name="check" /> Cart persisted to <code>sessionStorage</code>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--primary)" }}>
                <Icon name="check" /> Derived totals via selectors
              </div>
            </div>
          </Card>

          <Card title="Routing & UX" icon="router" subtitle="React Router + small wins">
            <p className="muted" style={{ marginTop: 0 }}>
              Routes for Home, Cart, Product Details, and Checkout. Plus fit-and-finish touches like
              back-to-top, hero highlights, and accessible controls.
            </p>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--primary)" }}>
                <Icon name="check" /> Keyboard-friendly controls + ARIA labels
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--primary)" }}>
                <Icon name="check" /> Modal feedback after “Add to Cart”
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--primary)" }}>
                <Icon name="check" /> Smooth “Shop Now” jump to products
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* FULL ASSIGNMENT BREAKDOWN */}
      <section style={{ marginTop: 32 }}>
        <h2 style={{ marginTop: 0 }}>Assignment — Full Breakdown</h2>

        <div
          className="grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 16
          }}
        >
          {checklist.map(({ title, points, icon }) => (
            <div
              key={title}
              className="card"
              style={{ borderRadius: 16, padding: 18, background: "#fff", boxShadow: "0 6px 18px rgba(0,0,0,.05)" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ width: 36, height: 36, display: "grid", placeItems: "center", borderRadius: 10, background: "#FFF4E5", color: "var(--primary)" }}>
                  <Icon name={icon} />
                </span>
                <h3 style={{ margin: 0, fontSize: 16 }}>{title}</h3>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {points.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* SUBMISSION + PRESENTATION */}
      <section className="card" style={{ marginTop: 28, borderRadius: 18, padding: 18 }}>
        <h2 style={{ marginTop: 0 }}>Submission & Presentation</h2>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--primary)" }}>
            <Icon name="check" /> Repo with frequent commits and a clean README that explains features and how to run it.
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--primary)" }}>
            <Icon name="check" /> Submit to Classroom per instructions.
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--primary)" }}>
            <Icon name="check" /> Live presentation to demo features, architecture, and implementation.
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ marginTop: 28, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <a className="btn btn-primary" href="https://fakestoreapi.com" target="_blank" rel="noreferrer">FakeStore API</a>
        <a className="btn btn-secondary" href="https://tanstack.com/query/latest" target="_blank" rel="noreferrer">React Query</a>
        <a className="btn btn-secondary" href="https://redux-toolkit.js.org/" target="_blank" rel="noreferrer">Redux Toolkit</a>
        <a className="btn btn-secondary" href="https://reactrouter.com/" target="_blank" rel="noreferrer">React Router</a>
      </section>
    </main>
  )
}
