// src/components/NavBar.jsx
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useEffect, useRef, useState } from 'react';
import { selectTotalCount } from '../features/cart/selectors.js';
import { useAuth } from '../auth/useAuth';
import CategorySearchBar from './CategorySearchBar.jsx';
import ZipModal from './ZipModal.jsx';
import { getSettings, watchSettings } from '../services/settingsService';
import { formatInTimeZone } from '../services/timezoneService';
import { LayoutDashboard, ShoppingCart as ShoppingCartIcon, Users, Settings, Package, Percent, Calendar as CalendarIcon, Clock, MessageSquare } from 'lucide-react';
import { GlobalFiltersBar } from './dashboard/GlobalFiltersBar';

/**
 * Top navigation bar. Dynamically uses the store name from Firestore settings.
 */
export default function NavBar() {
  const count = useSelector(selectTotalCount);
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const location = useLocation();

  // store name state; default fallback is the original name
  const [storeName, setStoreName] = useState('Advanced React E-Commerce');
  const [storeTimeZone, setStoreTimeZone] = useState('America/Denver');
  
  // Current time state
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Deliver-to (IP → city/zip)
  const [shipTo, setShipTo] = useState(() => {
    const cached = localStorage.getItem('shipTo');
    return cached ? JSON.parse(cached) : { city: '', postal: '', region: '', country: '' };
  });

  const [zipOpen, setZipOpen] = useState(false);

  // Load store name and timezone from Firestore settings on mount, then keep it live
  useEffect(() => {
    let stop = null;

    (async () => {
      try {
        const settings = await getSettings();
        const name = settings?.store?.name?.trim();
        const tz = settings?.store?.serverTimeZone;
        if (name) setStoreName(name);
        if (tz) setStoreTimeZone(tz);
      } catch {
        // ignore; keep fallback
      }

      // Subscribe for live updates so the name/timezone changes immediately after Admin saves
      stop = watchSettings((s) => {
        const liveName = s?.store?.name?.trim();
        const liveTz = s?.store?.serverTimeZone;
        if (liveName) setStoreName(liveName);
        if (liveTz) setStoreTimeZone(liveTz);
      });
    })();

    return () => {
      if (typeof stop === 'function') stop();
    };
  }, []);

  // Fetch IP location once if not already set
  useEffect(() => {
    if (shipTo?.postal) return;

    let ignore = false;
    (async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        if (!res.ok) throw new Error('ipapi failed');
        const data = await res.json();
        if (ignore) return;
        const next = {
          city: data?.city || '',
          postal: data?.postal || '',
          region: data?.region || '',
          country: data?.country_code || ''
        };
        setShipTo(next);
        localStorage.setItem('shipTo', JSON.stringify(next));
      } catch {
        // no-op
      }
    })();

    return () => { ignore = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenZipModal = () => setZipOpen(true);

  const handleSaveZip = ({ postal, city, region, country }) => {
    const next = {
      postal: (postal || '').trim(),
      city: (city || '').trim(),
      region: (region || '').trim(),
      country: (country || '').trim()
    };
    setShipTo(next);
    localStorage.setItem('shipTo', JSON.stringify(next));
    setZipOpen(false);
  };

  // --- Mini search across the top (Amazon vibe) ---
  const [navQuery, setNavQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const navigate = useNavigate();
  const onSubmitMini = (e) => {
    e.preventDefault();
    const q = navQuery.trim();
    const params = new URLSearchParams();
    
    if (q) params.append('q', q);
    if (selectedCategory !== 'all') params.append('category', selectedCategory);
    
    navigate(params.toString() ? `/?${params.toString()}` : '/');
  };

  // Close account menu on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const storeNavHeight = 67; // Actual measured height of the store nav
  
  // Check if we're on a dashboard page where filters should be shown
  const showAdminFilters = user?.role === 'admin' && (
    location.pathname === '/admin' || 
    location.pathname.startsWith('/admin/')
  );
  
  const showAgentFilters = user?.role === 'agent' && (
    location.pathname === '/agent' || 
    location.pathname.startsWith('/agent/')
  );
  
  return (
    <>
      {/* Store Nav - Always on top */}
      <header className="site-nav" style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        marginTop: 0,
        marginBottom: 0
      }}>
        <div className="nav-inner container nav-top">
        {/* Brand */}
        <Link to="/" className="brand" aria-label="Home">
          {storeName || 'Advanced React E-Commerce'}
        </Link>

        {/* Deliver to (click to open ZipModal) */}
        <button
          type="button"
          className="shipto"
          onClick={handleOpenZipModal}
          title="Click to change delivery location"
        >
          <span className="shipto-pin" aria-hidden>📍</span>
          <span className="shipto-lines">
            <span className="shipto-line1">Deliver to</span>
            <span className="shipto-line2">
              {shipTo?.postal ? `${shipTo.city ? shipTo.city + ' ' : ''}${shipTo.postal}` : 'Update location'}
            </span>
          </span>
        </button>

        {/* MINI SEARCH */}
        <form className="nav-mini-search" onSubmit={onSubmitMini} role="search" aria-label="Header search">
          <CategorySearchBar
            value={navQuery}
            onChange={setNavQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            placeholder="Search products…"
          />
        </form>

        {/* Right side actions */}
        <nav className="nav-links" aria-label="Primary">
          <NavLink className="nav-link" to="/">Home</NavLink>
          <NavLink className="nav-link" to="/about">About</NavLink>
          <NavLink className="nav-link" to="/contact">Contact</NavLink>
          {user && <NavLink className="nav-link" to="/orders">Orders</NavLink>}
          {user && user.role === 'customer' && <NavLink className="nav-link" to="/my-tickets">My Tickets</NavLink>}

          {/* Cart with count */}
          <NavLink
            className="nav-link cart-link"
            to="/cart"
            aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}
          >
            <span className="cart-icon" aria-hidden>
              <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" focusable="false">
                <path d="M7 18a2 2 0 1 0 .001 3.999A2 2 0 0 0 7 18zm10 0a2 2 0 1 0 .001 3.999A2 2 0 0 0 17 18zM6.2 6l.31 2h12.88a1 1 0 0 1 .98 1.196l-1.2 6A1 1 0 0 1 18.2 16H8.12a1 1 0 0 1-.98-.804L5.2 4H3a1 1 0 1 1 0-2h3a1 1 0 0 1 .98.804L7.02 6H6.2z"/>
              </svg>
              <span className="cart-count">{count}</span>
            </span>
            <span className="cart-text">Cart</span>
          </NavLink>

          {/* Account dropdown */}
          <div ref={menuRef} className="account" style={{ marginRight: 16 }}>
            <button
              type="button"
              className="account-btn"
              onClick={() => setOpen(v => !v)}
              aria-haspopup="menu"
              aria-expanded={open ? 'true' : 'false'}
            >
              <span className="account-label">{user ? (user.displayName || user.email || 'Account') : 'Account'}</span>
              <span className="caret" aria-hidden>▾</span>
            </button>

            {open && (
              <div className="menu" role="menu">
                {!user ? (
                  <>
                    <Link to="/login?mode=login" onClick={() => setOpen(false)} role="menuitem" className="menu-item">Sign In</Link>
                    <Link to="/login?mode=signup" onClick={() => setOpen(false)} role="menuitem" className="menu-item">Register</Link>
                  </>
                ) : (
                  <>
                    {user.role === 'admin' ? (
                      <>
                        <Link to="/admin" onClick={() => setOpen(false)} role="menuitem" className="menu-item">Admin Dashboard</Link>
                        <Link to="/admin/orders" onClick={() => setOpen(false)} role="menuitem" className="menu-item">Manage Orders</Link>
                        <Link to="/admin/products" onClick={() => setOpen(false)} role="menuitem" className="menu-item">Manage Products</Link>
                        <Link to="/admin/users" onClick={() => setOpen(false)} role="menuitem" className="menu-item">Manage Users</Link>
                        <Link to="/admin/discounts" onClick={() => setOpen(false)} role="menuitem" className="menu-item">Manage Discounts</Link>
                        <Link to="/admin/settings" onClick={() => setOpen(false)} role="menuitem" className="menu-item">Store Settings</Link>
                        <div style={{ height: 1, background: "var(--border)", margin: "8px 0" }} />
                        <Link to="/orders" onClick={() => setOpen(false)} role="menuitem" className="menu-item">My Orders</Link>
                        <Link to="/profile" onClick={() => setOpen(false)} role="menuitem" className="menu-item">My Profile</Link>
                      </>
                    ) : user.role === 'agent' ? (
                      <>
                        <Link to="/agent" onClick={() => setOpen(false)} role="menuitem" className="menu-item">Agent Dashboard</Link>
                        <Link to="/agent/orders" onClick={() => setOpen(false)} role="menuitem" className="menu-item">Manage Orders</Link>
                        <Link to="/agent/tickets" onClick={() => setOpen(false)} role="menuitem" className="menu-item">Support Tickets</Link>
                        <Link to="/agent/users" onClick={() => setOpen(false)} role="menuitem" className="menu-item">Manage Customers</Link>
                        <div style={{ height: 1, background: "var(--border)", margin: "8px 0" }} />
                        <Link to="/agent/my-orders" onClick={() => setOpen(false)} role="menuitem" className="menu-item">My Orders</Link>
                        <Link to="/profile" onClick={() => setOpen(false)} role="menuitem" className="menu-item">My Profile</Link>
                      </>
                    ) : (
                      <>
                        <Link to="/dashboard" onClick={() => setOpen(false)} role="menuitem" className="menu-item">Dashboard</Link>
                        <Link to="/orders" onClick={() => setOpen(false)} role="menuitem" className="menu-item">My Orders</Link>
                        <Link to="/my-tickets" onClick={() => setOpen(false)} role="menuitem" className="menu-item">My Tickets</Link>
                        <Link to="/profile" onClick={() => setOpen(false)} role="menuitem" className="menu-item">My Profile</Link>
                      </>
                    )}
                    <div style={{ height: 1, background: "var(--border)", margin: "8px 0" }} />
                    <button
                      onClick={() => { setOpen(false); logout(); }}
                      role="menuitem"
                      className="menu-item btn-like"
                    >
                      Sign Out
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </nav>
      </div>

        {/* Zip modal */}
        <ZipModal
          open={zipOpen}
          onClose={() => setZipOpen(false)}
          onSave={handleSaveZip}
          initialPostal={shipTo?.postal}
          initialCity={shipTo?.city}
          initialRegion={shipTo?.region}
          initialCountry={shipTo?.country || 'US'}
        />
      </header>

      {/* Admin Sticky Bar - Below store nav when admin is logged in */}
      {user?.role === 'admin' && (
        <div style={{
          position: 'fixed',
          top: `${storeNavHeight}px`,
          left: 0,
          right: 0,
          zIndex: 99,
          background: 'linear-gradient(135deg, #232F3E 0%, #37475A 100%)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          borderBottom: '3px solid #FF9900',
        }}>
          <div style={{
            maxWidth: '100%',
            margin: '0 auto',
            padding: '12px 20px',
            display: 'grid',
            gridTemplateColumns: 'auto 1fr auto',
            alignItems: 'center',
            gap: '20px',
          }}>
            {/* Far Left: Icon + Admin Panel + Email */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', whiteSpace: 'nowrap' }}>
              <LayoutDashboard size={24} color="#FF9900" />
              <div>
                <div style={{ 
                  color: '#FF9900', 
                  fontSize: '12px', 
                  fontWeight: 600, 
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Admin Panel
                </div>
                <div style={{ 
                  color: '#fff', 
                  fontSize: '13px', 
                  fontWeight: 500 
                }}>
                  {user.displayName || user.email}
                </div>
              </div>
            </div>

            {/* Center: Admin Navigation Buttons */}
            <nav style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              justifyContent: 'center',
              flexWrap: 'nowrap',
              overflow: 'hidden'
            }}>
              <NavLink 
                to="/admin"
                end
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  background: isActive ? '#FF9900' : 'transparent',
                  color: isActive ? '#000' : '#fff',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  border: isActive ? 'none' : '1px solid rgba(255,255,255,0.3)',
                })}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.classList.contains('active')) {
                    e.currentTarget.style.background = 'rgba(255,153,0,0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.classList.contains('active')) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <LayoutDashboard size={16} />
                Dashboard
              </NavLink>

              <NavLink 
                to="/admin/orders" 
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  background: isActive ? '#FF9900' : 'transparent',
                  color: isActive ? '#000' : '#fff',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  border: isActive ? 'none' : '1px solid rgba(255,255,255,0.3)',
                })}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.classList.contains('active')) {
                    e.currentTarget.style.background = 'rgba(255,153,0,0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.classList.contains('active')) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <ShoppingCartIcon size={16} />
                Orders
              </NavLink>

              <NavLink 
                to="/admin/products" 
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  background: isActive ? '#FF9900' : 'transparent',
                  color: isActive ? '#000' : '#fff',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  border: isActive ? 'none' : '1px solid rgba(255,255,255,0.3)',
                })}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.classList.contains('active')) {
                    e.currentTarget.style.background = 'rgba(255,153,0,0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.classList.contains('active')) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <Package size={16} />
                Products
              </NavLink>

              <NavLink 
                to="/admin/users" 
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  background: isActive ? '#FF9900' : 'transparent',
                  color: isActive ? '#000' : '#fff',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  border: isActive ? 'none' : '1px solid rgba(255,255,255,0.3)',
                })}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.classList.contains('active')) {
                    e.currentTarget.style.background = 'rgba(255,153,0,0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.classList.contains('active')) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <Users size={16} />
                Users
              </NavLink>

              <NavLink 
                to="/admin/discounts" 
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  background: isActive ? '#FF9900' : 'transparent',
                  color: isActive ? '#000' : '#fff',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  border: isActive ? 'none' : '1px solid rgba(255,255,255,0.3)',
                })}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.classList.contains('active')) {
                    e.currentTarget.style.background = 'rgba(255,153,0,0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.classList.contains('active')) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <Percent size={16} />
                Discounts
              </NavLink>

              <NavLink 
                to="/admin/tickets" 
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  background: isActive ? '#FF9900' : 'transparent',
                  color: isActive ? '#000' : '#fff',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  border: isActive ? 'none' : '1px solid rgba(255,255,255,0.3)',
                })}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.classList.contains('active')) {
                    e.currentTarget.style.background = 'rgba(255,153,0,0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.classList.contains('active')) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <MessageSquare size={16} />
                Tickets
              </NavLink>

              <NavLink 
                to="/admin/settings"
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  background: isActive ? '#FF9900' : 'transparent',
                  color: isActive ? '#000' : '#fff',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  border: isActive ? 'none' : '1px solid rgba(255,255,255,0.3)',
                })}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.classList.contains('active')) {
                    e.currentTarget.style.background = 'rgba(255,153,0,0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.classList.contains('active')) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <Settings size={16} />
                Settings
              </NavLink>
            </nav>

            {/* Far Right: Date/Time and Filters */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '4px'
            }}>
              {/* SERVER DATE/TIME Label */}
              <div style={{ 
                color: '#FF9900', 
                fontSize: '12px', 
                fontWeight: 600, 
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Server Date/Time
              </div>
              
              {/* Date and Time Display */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: 'rgba(255,255,255,0.9)',
                fontSize: '11px',
                fontWeight: 500,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CalendarIcon size={14} />
                  <span>{formatInTimeZone(currentTime, storeTimeZone, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} />
                  <span>{formatInTimeZone(currentTime, storeTimeZone, { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}</span>
                </div>
              </div>
              
              {/* Filters */}
              {showAdminFilters && (
                <div style={{ whiteSpace: 'nowrap' }}>
                  <GlobalFiltersBar />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Agent Sticky Bar - Below store nav when agent is logged in */}
      {user?.role === 'agent' && (
        <div style={{
          position: 'fixed',
          top: `${storeNavHeight}px`,
          left: 0,
          right: 0,
          zIndex: 99,
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          borderBottom: '3px solid #60a5fa',
        }}>
          <div style={{
            maxWidth: '100%',
            margin: '0 auto',
            padding: '12px 20px',
            display: 'grid',
            gridTemplateColumns: 'auto 1fr auto',
            alignItems: 'center',
            gap: '20px',
          }}>
            {/* Far Left: Icon + Agent Panel + Email */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', whiteSpace: 'nowrap' }}>
              <Users size={24} color="#60a5fa" />
              <div>
                <div style={{ 
                  color: '#60a5fa', 
                  fontSize: '12px', 
                  fontWeight: 600, 
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Agent Panel
                </div>
                <div style={{ 
                  color: '#fff', 
                  fontSize: '13px', 
                  fontWeight: 500 
                }}>
                  {user.displayName || user.email}
                </div>
              </div>
            </div>

            {/* Center: Agent Navigation Buttons */}
            <nav style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              justifyContent: 'center',
              flexWrap: 'nowrap',
              overflow: 'hidden'
            }}>
              <NavLink 
                to="/agent"
                end
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  background: isActive ? '#60a5fa' : 'transparent',
                  color: isActive ? '#000' : '#fff',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  border: isActive ? 'none' : '1px solid rgba(255,255,255,0.3)',
                })}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.classList.contains('active')) {
                    e.currentTarget.style.background = 'rgba(96,165,250,0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.classList.contains('active')) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <LayoutDashboard size={16} />
                Dashboard
              </NavLink>

              <NavLink 
                to="/agent/orders" 
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  background: isActive ? '#60a5fa' : 'transparent',
                  color: isActive ? '#000' : '#fff',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  border: isActive ? 'none' : '1px solid rgba(255,255,255,0.3)',
                })}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.classList.contains('active')) {
                    e.currentTarget.style.background = 'rgba(96,165,250,0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.classList.contains('active')) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <ShoppingCartIcon size={16} />
                Orders
              </NavLink>

              <NavLink 
                to="/agent/users"
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  background: isActive ? '#60a5fa' : 'transparent',
                  color: isActive ? '#000' : '#fff',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  border: isActive ? 'none' : '1px solid rgba(255,255,255,0.3)',
                })}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.classList.contains('active')) {
                    e.currentTarget.style.background = 'rgba(96,165,250,0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.classList.contains('active')) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <Users size={16} />
                Customers
              </NavLink>

              <NavLink 
                to="/agent/tickets" 
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  background: isActive ? '#60a5fa' : 'transparent',
                  color: isActive ? '#000' : '#fff',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  border: isActive ? 'none' : '1px solid rgba(255,255,255,0.3)',
                })}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.classList.contains('active')) {
                    e.currentTarget.style.background = 'rgba(96,165,250,0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.classList.contains('active')) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <MessageSquare size={16} />
                Tickets
              </NavLink>
            </nav>

            {/* Far Right: Date/Time and Filters */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '4px'
            }}>
              {/* SERVER DATE/TIME Label */}
              <div style={{ 
                color: '#60a5fa', 
                fontSize: '12px', 
                fontWeight: 600, 
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Server Date/Time
              </div>
              
              {/* Date and Time Display */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: 'rgba(255,255,255,0.9)',
                fontSize: '11px',
                fontWeight: 500,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CalendarIcon size={14} />
                  <span>{formatInTimeZone(currentTime, storeTimeZone, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} />
                  <span>{formatInTimeZone(currentTime, storeTimeZone, { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}</span>
                </div>
              </div>
              
              {/* Filters */}
              {showAgentFilters && (
                <div style={{ whiteSpace: 'nowrap' }}>
                  <GlobalFiltersBar />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
