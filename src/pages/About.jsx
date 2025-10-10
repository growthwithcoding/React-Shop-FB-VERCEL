// About.jsx
// Modern About page showcasing actual technologies and features

import BreadcrumbNav from '../components/BreadcrumbNav';
import { useTotalHeaderHeight } from '../hooks/useTotalHeaderHeight';

const FALLBACK = "https://via.placeholder.com/960x540?text=Project+Overview"

// Reusable inline icons
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
    case "check":
      return <svg {...common}><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2Z" fill="currentColor"/></svg>
    default:
      return null
  }
}

function Pill({ children }) {
  return (
    <span
      className="pill"
      style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        borderRadius: 999, padding: "6px 12px", fontSize: 12,
        background: "var(--pill-bg, #FFF7E6)",
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
  const totalHeaderHeight = useTotalHeaderHeight();
  return (
    <>
      <BreadcrumbNav
        currentPage="About"
        backButton={{ label: "Home", path: "/" }}
      />
      <main className="container-xl" style={{ paddingTop: 16, paddingBottom: 48 }}>
      {/* Page Title */}
      <div className="hero-headline" style={{ marginBottom: 24 }}>
        <div>
          <div className="kicker">Our Platform</div>
          <h1 style={{ margin: 0 }}>Modern E-Commerce Solution</h1>
          <div className="meta" style={{ marginTop: 8 }}>
            Built with enterprise-grade technologies for performance and scalability.
          </div>
        </div>
      </div>
      
      {/* HERO - 2 Column Layout */}
      <section
        className="about-hero card"
        style={{
          borderRadius: 20, padding: 24, marginTop: 16, marginBottom: 24,
          display: "grid", gap: 20
        }}
      >
        {/* 2 column layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20, alignItems: "start" }}>
          {/* Left column with content stacked, Built With at bottom */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18, minHeight: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <Pill>Modern React Stack</Pill>
              <Pill>Firebase Backend</Pill>
              <Pill>Production Ready</Pill>
              <Pill>Full E-Commerce</Pill>
            </div>

            <h1 style={{ margin: 0 }}>About This Project</h1>
            <p style={{ margin: 0, color: "#4b5563", flex: "1 1 auto" }}>
              A full-featured e-commerce platform built with modern React technologies, Firebase, and styled with Tailwind CSS. 
              This application demonstrates enterprise-level architecture with real-time data synchronization, 
              secure authentication, seamless payment processing, comprehensive order management, and a complete 
              admin dashboard. The project showcases best practices in modern web development, including state 
              management with Redux Toolkit, server state with React Query, responsive design with Tailwind CSS, 
              and a component-based architecture. Built with performance and scalability in mind, this e-commerce 
              solution provides a solid foundation for real-world applications with features like inventory tracking, 
              discount management, user roles, and transactional email notifications.
            </p>

            {/* Built With at bottom of left column */}
            <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 16, marginTop: "auto" }}>
              <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 16 }}>Built With</h3>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <a href="https://react.dev/" target="_blank" rel="noopener noreferrer" title="React">
              <img src="/logos/REACT.png" alt="React" style={{ height: 40, width: "auto" }} />
            </a>
            <span style={{ opacity: 0.3 }}>+</span>
            <a href="https://redux-toolkit.js.org/" target="_blank" rel="noopener noreferrer" title="Redux Toolkit">
              <img src="/logos/REDUX.png" alt="Redux Toolkit" style={{ height: 40, width: "auto" }} />
            </a>
            <span style={{ opacity: 0.3 }}>+</span>
            <a href="https://reactrouter.com/" target="_blank" rel="noopener noreferrer" title="React Router">
              <img src="/logos/REACT-ROUTER.png" alt="React Router" style={{ height: 40, width: "auto" }} />
            </a>
            <span style={{ opacity: 0.3 }}>+</span>
            <a href="https://tanstack.com/query/latest" target="_blank" rel="noopener noreferrer" title="React Query">
              <img src="/logos/REACT-QUERY.png" alt="React Query" style={{ height: 40, width: "auto" }} />
            </a>
            <span style={{ opacity: 0.3 }}>+</span>
            <a href="https://firebase.google.com/" target="_blank" rel="noopener noreferrer" title="Firebase">
              <img src="/logos/FB.png" alt="Firebase" style={{ height: 40, width: "auto" }} />
            </a>
            <span style={{ opacity: 0.3 }}>+</span>
            <a href="https://firebase.google.com/docs/firestore" target="_blank" rel="noopener noreferrer" title="Firestore">
              <img src="/logos/FIRESTORE.png" alt="Firestore" style={{ height: 40, width: "auto" }} />
            </a>
            <span style={{ opacity: 0.3 }}>+</span>
            <a href="https://vite.dev/" target="_blank" rel="noopener noreferrer" title="Vite">
              <img src="/logos/VITE.png" alt="Vite" style={{ height: 40, width: "auto" }} />
            </a>
            <span style={{ opacity: 0.3 }}>+</span>
            <a href="https://www.emailjs.com/" target="_blank" rel="noopener noreferrer" title="EmailJS">
              <img src="/logos/EMAILJS.png" alt="EmailJS" style={{ height: 60, width: "auto" }} />
            </a>
            <span style={{ opacity: 0.3 }}>+</span>
            <a href="https://tailwindcss.com/" target="_blank" rel="noopener noreferrer" title="Tailwind CSS">
              <img src="/logos/TAILWIND.png" alt="Tailwind CSS" style={{ height: 40, width: "auto" }} />
            </a>
              </div>
            </div>
          </div>

          {/* Image Column */}
          <div className="hero-media" style={{ borderRadius: 16, overflow: "hidden", border: "1px solid #eee" }}>
            <img
              src="/reactstore-hero.png"
              onError={(e) => { e.currentTarget.src = FALLBACK }}
              alt="Project overview"
              style={{ width: "100%", display: "block" }}
            />
          </div>
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
        <Card title="Firebase Backend" icon="catalog" subtitle="Firestore + Authentication">
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Real-time database with Firestore</li>
              <li>Secure authentication with Firebase Auth</li>
              <li>Cloud storage for product images</li>
            </ul>
          </Card>

          <Card title="Admin Dashboard" icon="category" subtitle="Complete business management">
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Product & inventory management</li>
              <li>Order tracking & fulfillment</li>
              <li>User management & analytics</li>
              <li>Discount code system</li>
            </ul>
          </Card>

          <Card title="Shopping Experience" icon="cart" subtitle="Redux Toolkit + Smart Cart">
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Persistent cart with Redux Toolkit</li>
              <li>Advanced search & filtering</li>
              <li>Category-based navigation</li>
              <li>Product recommendations</li>
            </ul>
          </Card>

          <Card title="Checkout & Orders" icon="image" subtitle="Complete order flow">
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Multiple payment methods support</li>
              <li>Address management system</li>
              <li>Discount code application</li>
              <li>Email confirmations via EmailJS</li>
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
          <Card title="Technology Stack" icon="query" subtitle="Modern React Ecosystem">
            <p className="muted" style={{ marginTop: 0 }}>
              Built with the latest React technologies for performance, scalability, and maintainability.
              Vite for lightning-fast builds, React Query for server state, Redux Toolkit for client state.
            </p>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--primary)" }}>
                <Icon name="check" /> <strong>React 18</strong> - Modern UI library
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--primary)" }}>
                <Icon name="check" /> <strong>Vite</strong> - Next-gen frontend tooling
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--primary)" }}>
                <Icon name="check" /> <strong>React Query</strong> - Server state management
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--primary)" }}>
                <Icon name="check" /> <strong>Redux Toolkit</strong> - Client state management
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--primary)" }}>
                <Icon name="check" /> <strong>React Router v6</strong> - Client-side routing
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--primary)" }}>
                <Icon name="check" /> <strong>Firebase</strong> - Authentication & hosting
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--primary)" }}>
                <Icon name="check" /> <strong>Firestore</strong> - NoSQL cloud database
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--primary)" }}>
                <Icon name="check" /> <strong>EmailJS</strong> - Transactional emails
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--primary)" }}>
                <Icon name="check" /> <strong>Tailwind CSS</strong> - Utility-first CSS framework
              </div>
            </div>
          </Card>

          <Card title="Key Features" icon="cart" subtitle="Enterprise-grade functionality">
            <p className="muted" style={{ marginTop: 0 }}>
              Complete e-commerce functionality including user authentication, role-based access control,
              order management, payment processing, inventory tracking, and administrative tools.
            </p>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--primary)" }}>
                <Icon name="check" /> User authentication & authorization
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--primary)" }}>
                <Icon name="check" /> Real-time inventory management
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--primary)" }}>
                <Icon name="check" /> Advanced search & filtering
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--primary)" }}>
                <Icon name="check" /> Discount code system
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--primary)" }}>
                <Icon name="check" /> Order tracking & history
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--primary)" }}>
                <Icon name="check" /> Help center with support tickets
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* TECHNICAL ARCHITECTURE */}
      <section style={{ marginTop: 32 }}>
        <h2 style={{ marginTop: 0 }}>Technical Architecture</h2>

        <div
          className="grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16
          }}
        >
          <div className="card" style={{ borderRadius: 16, padding: 18, background: "#fff", boxShadow: "0 6px 18px rgba(0,0,0,.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ width: 36, height: 36, display: "grid", placeItems: "center", borderRadius: 10, background: "#FFF4E5", color: "var(--primary)" }}>
                <Icon name="catalog" />
              </span>
              <h3 style={{ margin: 0, fontSize: 16 }}>Frontend</h3>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>React 18 with hooks & modern patterns</li>
              <li>Vite for fast dev server & builds</li>
              <li>React Query for server state</li>
              <li>Redux Toolkit for client state</li>
              <li>React Router v6 for navigation</li>
            </ul>
          </div>

          <div className="card" style={{ borderRadius: 16, padding: 18, background: "#fff", boxShadow: "0 6px 18px rgba(0,0,0,.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ width: 36, height: 36, display: "grid", placeItems: "center", borderRadius: 10, background: "#FFF4E5", color: "var(--primary)" }}>
                <Icon name="category" />
              </span>
              <h3 style={{ margin: 0, fontSize: 16 }}>Backend</h3>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Firebase Authentication</li>
              <li>Firestore NoSQL database</li>
              <li>Real-time data synchronization</li>
              <li>Cloud security rules</li>
              <li>Scalable cloud infrastructure</li>
            </ul>
          </div>

          <div className="card" style={{ borderRadius: 16, padding: 18, background: "#fff", boxShadow: "0 6px 18px rgba(0,0,0,.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ width: 36, height: 36, display: "grid", placeItems: "center", borderRadius: 10, background: "#FFF4E5", color: "var(--primary)" }}>
                <Icon name="cart" />
              </span>
              <h3 style={{ margin: 0, fontSize: 16 }}>Services</h3>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Product & inventory services</li>
              <li>Order management system</li>
              <li>User & authentication services</li>
              <li>Payment & address services</li>
              <li>EmailJS for notifications</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ marginTop: 28, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <a className="btn btn-primary" href="https://firebase.google.com" target="_blank" rel="noreferrer">Firebase</a>
        <a className="btn btn-secondary" href="https://tanstack.com/query/latest" target="_blank" rel="noreferrer">React Query</a>
        <a className="btn btn-secondary" href="https://redux-toolkit.js.org/" target="_blank" rel="noreferrer">Redux Toolkit</a>
        <a className="btn btn-secondary" href="https://reactrouter.com/" target="_blank" rel="noreferrer">React Router</a>
        <a className="btn btn-secondary" href="https://vitejs.dev" target="_blank" rel="noreferrer">Vite</a>
        <a className="btn btn-secondary" href="https://www.emailjs.com/" target="_blank" rel="noreferrer">EmailJS</a>
        <a className="btn btn-secondary" href="https://tailwindcss.com/" target="_blank" rel="noreferrer">Tailwind CSS</a>
      </section>

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 900px) {
          .about-hero {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      </main>
    </>
  )
}
