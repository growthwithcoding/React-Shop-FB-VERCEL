// src/pages/Dashboard.jsx
import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { listOrdersForUser } from "../services/orderService";
import { getAddresses, deleteAddress, setDefaultAddress } from "../services/addressService";
import { getPaymentMethods, deletePaymentMethod, setDefaultPaymentMethod } from "../services/paymentService";
import { getUser } from "../services/userService";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, firebaseInitialized } from "../lib/firebase";
import EditProfileModal from "../components/EditProfileModal";
import AddAddressModal from "../components/AddAddressModal";
import AddPaymentModal from "../components/AddPaymentModal";
import CreateSupportTicketModal from "../components/CreateSupportTicketModal";

const USD = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  // Modal states
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [addressModalMode, setAddressModalMode] = useState("create");
  const [addressModalData, setAddressModalData] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [createTicketModalOpen, setCreateTicketModalOpen] = useState(false);

  // Redirect admin to admin dashboard
  useEffect(() => {
    if (user && user.role === "admin") {
      navigate("/admin", { replace: true });
    }
  }, [user, navigate]);

  // Fetch user data
  useEffect(() => {
    async function fetchData() {
      if (!user?.uid) return;
      
      try {
        setLoading(true);
        console.log("Dashboard - Fetching data for user.uid:", user.uid);
        console.log("Dashboard - User object:", user);
        
        // Fetch support tickets (sort in memory to avoid composite index requirement)
        if (!firebaseInitialized || !db) {
          console.warn("Firebase not initialized, skipping support tickets fetch");
          setSupportTickets([]);
        } else {
          const ticketsQuery = query(
            collection(db, "supportTickets"),
            where("userId", "==", user.uid)
          );
          const ticketsSnapshot = await getDocs(ticketsQuery);
          const ticketsData = ticketsSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => {
              const aTime = a.createdAt?.seconds || 0;
              const bTime = b.createdAt?.seconds || 0;
              return bTime - aTime; // newest first
            });
          setSupportTickets(ticketsData);
        }
        
        const [ordersData, addressesData, paymentsData, profile] = await Promise.all([
          listOrdersForUser(user.uid, { take: 10 }),
          getAddresses(user.uid),
          getPaymentMethods(user.uid),
          getUser(user.uid),
        ]);
        
        console.log("Dashboard - Orders fetched:", ordersData?.length || 0);
        console.log("Dashboard - Addresses fetched:", addressesData?.length || 0, addressesData);
        console.log("Dashboard - Payments fetched:", paymentsData?.length || 0);
        console.log("Dashboard - Profile:", profile);
        
        setOrders(Array.isArray(ordersData) ? ordersData : []);
        setAddresses(Array.isArray(addressesData) ? addressesData : []);
        setPaymentMethods(Array.isArray(paymentsData) ? paymentsData : []);
        setUserProfile(profile);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setOrders([]);
        setAddresses([]);
        setPaymentMethods([]);
      } finally {
        setLoading(false);
      }
    }

    if (user && user.role !== "admin") {
      fetchData();
    }
  }, [user]);

  // Refresh data after modal actions
  async function refreshData() {
    if (!user?.uid) return;
    try {
      const [addressesData, paymentsData, profile] = await Promise.all([
        getAddresses(user.uid),
        getPaymentMethods(user.uid),
        getUser(user.uid),
      ]);
      setAddresses(Array.isArray(addressesData) ? addressesData : []);
      setPaymentMethods(Array.isArray(paymentsData) ? paymentsData : []);
      setUserProfile(profile);
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  }

  // Refresh support tickets
  async function refreshTickets() {
    if (!user?.uid) return;
    if (!firebaseInitialized || !db) {
      console.warn("Firebase not initialized");
      return;
    }
    try {
      const ticketsQuery = query(
        collection(db, "supportTickets"),
        where("userId", "==", user.uid)
      );
      const ticketsSnapshot = await getDocs(ticketsQuery);
      const ticketsData = ticketsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        });
      setSupportTickets(ticketsData);
    } catch (error) {
      console.error("Error refreshing tickets:", error);
    }
  }

  // Modal handlers
  function openEditProfile() {
    setEditProfileOpen(true);
  }

  function openAddAddress(type = "shipping") {
    setAddressModalMode("create");
    setAddressModalData({ type });
    setAddressModalOpen(true);
  }

  function openEditAddress(address) {
    setAddressModalMode("edit");
    setAddressModalData(address);
    setAddressModalOpen(true);
  }

  async function handleDeleteAddress(address) {
    if (!confirm(`Delete this ${address.type} address?`)) return;
    try {
      await deleteAddress(address.id);
      await refreshData();
    } catch (error) {
      alert(error.message || "Failed to delete address");
    }
  }

  async function handleSetDefaultAddress(address) {
    try {
      await setDefaultAddress(user.uid, address.id, address.type);
      await refreshData();
    } catch (error) {
      alert(error.message || "Failed to set default address");
    }
  }

  async function handleDeletePaymentMethod(payment) {
    const methodNames = {
      card: "card",
      paypal: "PayPal account",
      apple_pay: "Apple Pay",
      google_pay: "Google Pay"
    };
    const methodName = methodNames[payment.type] || "payment method";
    
    if (!confirm(`Delete this ${methodName}?`)) return;
    try {
      await deletePaymentMethod(payment.id);
      await refreshData();
    } catch (error) {
      alert(error.message || "Failed to delete payment method");
    }
  }

  async function handleSetDefaultPayment(payment) {
    try {
      await setDefaultPaymentMethod(user.uid, payment.id);
      await refreshData();
    } catch (error) {
      alert(error.message || "Failed to set default payment method");
    }
  }


  // Calculate stats
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const activeOrders = orders.filter(o => {
      const status = o.paymentStatus || o.status || "pending";
      return status === "pending" || status === "processing";
    }).length;
    
    return { totalOrders, totalSpent, activeOrders };
  }, [orders]);

  // Separate addresses by type
  const shippingAddresses = useMemo(() => 
    addresses.filter(a => a.type === "shipping"),
    [addresses]
  );
  
  const billingAddresses = useMemo(() => 
    addresses.filter(a => a.type === "billing"),
    [addresses]
  );

  if (loading) {
    return (
      <div className="container" style={{ padding: 24, textAlign: "center" }}>
        <h2>Loading your dashboard...</h2>
      </div>
    );
  }

  const userName = user?.displayName || user?.firstName || user?.email?.split("@")[0] || "there";

  return (
    <div className="container-xl" style={{ paddingTop: 24, paddingBottom: 24 }}>
      {/* Hero Headline */}
      <div className="hero-headline" style={{ marginBottom: 16 }}>
        <div>
          <div className="kicker">Welcome back</div>
          <h1 style={{ margin: 0 }}>Hi, {userName}! 👋</h1>
          <div className="meta" style={{ marginTop: 8 }}>
            Manage your orders, addresses, and account settings
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={openEditProfile} className="btn btn-secondary" style={{ fontSize: "13px", padding: "8px 14px" }}>
            Edit Profile
          </button>
          <Link to="/" className="btn btn-secondary" style={{ fontSize: "13px", padding: "8px 14px", whiteSpace: "nowrap" }}>
            ← Back to Home
          </Link>
        </div>
      </div>

      {/* QUICK STATS */}
      <section className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
        <StatCard 
          icon="📦" 
          title="Total Orders" 
          value={stats.totalOrders} 
          subtitle="All time"
        />
        <StatCard 
          icon="💰" 
          title="Total Spent" 
          value={USD.format(stats.totalSpent)} 
          subtitle="All time"
          tone="success"
        />
        <StatCard 
          icon="🚀" 
          title="Active Orders" 
          value={stats.activeOrders} 
          subtitle="In progress"
          tone={stats.activeOrders > 0 ? "info" : "muted"}
        />
      </section>

      {/* MAIN CONTENT GRID */}
      <section className="grid" style={{ gridTemplateColumns: "2fr 1fr", gap: 12, marginTop: 16 }}>
        {/* LEFT COLUMN: Recent Orders */}
        <div className="card" style={{ padding: 16 }}>
          <div className="hero-title-row" style={{ marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Recent Orders</h3>
            <Link to="/orders" className="btn btn-secondary btn-slim">
              View All
            </Link>
          </div>

          {orders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🛍️</div>
              <p className="meta" style={{ marginBottom: 16 }}>You haven't placed any orders yet.</p>
              <Link to="/" className="btn btn-primary">
                Start Shopping
              </Link>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {orders.slice(0, 5).map(order => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Quick Actions + Addresses */}
        <div style={{ display: "grid", gap: 12, gridAutoRows: "min-content" }}>
          {/* Quick Actions */}
          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>Quick Actions</h3>
            <div style={{ display: "grid", gap: 8 }}>
              <Link to="/orders" className="btn btn-secondary" style={{ justifyContent: "flex-start" }}>
                📋 View All Orders
              </Link>
              <button onClick={openEditProfile} className="btn btn-secondary" style={{ justifyContent: "flex-start" }}>
                👤 Edit Profile
              </button>
              <Link to="/" className="btn btn-primary" style={{ justifyContent: "flex-start" }}>
                🛍️ Continue Shopping
              </Link>
            </div>
          </div>

          {/* Account Info */}
          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>Account Info</h3>
            <div style={{ display: "grid", gap: 8 }}>
              <InfoRow label="Email" value={user?.email || "Not set"} />
              <InfoRow 
                label="Member since" 
                value={
                  userProfile?.createdAt?.toDate 
                    ? userProfile.createdAt.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                    : userProfile?.createdAt?.seconds
                    ? new Date(userProfile.createdAt.seconds * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                    : user?.metadata?.creationTime
                    ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                    : "Recently"
                } 
              />
              <InfoRow label="Account type" value="Customer" />
            </div>
          </div>
        </div>
      </section>

      {/* ADDRESSES SECTION */}
      <section className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
        {/* Shipping Addresses */}
        <div className="card" style={{ padding: 16 }}>
          <div className="hero-title-row" style={{ marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Shipping Addresses</h3>
            <button onClick={() => openAddAddress("shipping")} className="btn btn-secondary btn-slim">
              Add New
            </button>
          </div>

          {shippingAddresses.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <p className="meta" style={{ marginBottom: 12 }}>No shipping addresses yet.</p>
              <button onClick={() => openAddAddress("shipping")} className="btn btn-secondary btn-slim">
                Add Address
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {shippingAddresses.map(addr => (
                <AddressCardWithActions
                  key={addr.id}
                  address={addr}
                  onEdit={openEditAddress}
                  onDelete={handleDeleteAddress}
                  onSetDefault={handleSetDefaultAddress}
                />
              ))}
            </div>
          )}
        </div>

        {/* Billing Addresses */}
        <div className="card" style={{ padding: 16 }}>
          <div className="hero-title-row" style={{ marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Billing Addresses</h3>
            <button onClick={() => openAddAddress("billing")} className="btn btn-secondary btn-slim">
              Add New
            </button>
          </div>

          {billingAddresses.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <p className="meta" style={{ marginBottom: 12 }}>No billing addresses yet.</p>
              <button onClick={() => openAddAddress("billing")} className="btn btn-secondary btn-slim">
                Add Address
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {billingAddresses.map(addr => (
                <AddressCardWithActions
                  key={addr.id}
                  address={addr}
                  onEdit={openEditAddress}
                  onDelete={handleDeleteAddress}
                  onSetDefault={handleSetDefaultAddress}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* PAYMENT METHODS AND SUPPORT TICKETS SECTION */}
      <section className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
        {/* Payment Methods */}
        <div className="card" style={{ padding: 16 }}>
          <div className="hero-title-row" style={{ marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Payment Methods</h3>
            <button onClick={() => setPaymentModalOpen(true)} className="btn btn-secondary btn-slim">
              Add New
            </button>
          </div>
          
          {paymentMethods.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>💳</div>
              <p className="meta" style={{ marginBottom: 16 }}>No payment methods added yet.</p>
              <button onClick={() => setPaymentModalOpen(true)} className="btn btn-primary btn-slim">
                Add Payment Method
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {paymentMethods.map(payment => (
                <PaymentMethodCard
                  key={payment.id}
                  payment={payment}
                  onDelete={handleDeletePaymentMethod}
                  onSetDefault={handleSetDefaultPayment}
                />
              ))}
            </div>
          )}
        </div>

        {/* Support Tickets */}
        <div className="card" style={{ padding: 16 }}>
          <div className="hero-title-row" style={{ marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Support Tickets</h3>
            <button onClick={() => setCreateTicketModalOpen(true)} className="btn btn-secondary btn-slim">
              Create Ticket
            </button>
          </div>
          
          {supportTickets.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎫</div>
              <p className="meta" style={{ marginBottom: 16 }}>No support tickets yet.</p>
              <button onClick={() => setCreateTicketModalOpen(true)} className="btn btn-primary btn-slim">
                Create Support Ticket
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {supportTickets.slice(0, 5).map(ticket => (
                <SupportTicketCard key={ticket.id} ticket={ticket} navigate={navigate} />
              ))}
              {supportTickets.length > 5 && (
                <div style={{ textAlign: "center", marginTop: 8 }}>
                  <Link to="/contact" className="meta" style={{ fontSize: 12 }}>
                    View all {supportTickets.length} tickets →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* MODALS */}
      <EditProfileModal
        isOpen={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        initialData={userProfile}
        onSuccess={refreshData}
      />

      <AddAddressModal
        isOpen={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        mode={addressModalMode}
        initialData={addressModalData}
        onSuccess={refreshData}
      />

      <AddPaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSuccess={refreshData}
      />

      <CreateSupportTicketModal
        isOpen={createTicketModalOpen}
        onClose={() => setCreateTicketModalOpen(false)}
        onSuccess={refreshTickets}
      />
    </div>
  );
}

// ========== COMPONENTS ==========

function StatCard({ icon, title, value, subtitle, tone }) {
  const toneColors = {
    success: { bg: "#eaf8f0", border: "#d1fae5", accent: "#10b981" },
    info: { bg: "#eaf4ff", border: "#bfdbfe", accent: "#3b82f6" },
    muted: { bg: "#f3f4f6", border: "#e5e7eb", accent: "#6b7280" },
  };
  
  const colors = toneColors[tone] || { bg: "#fff", border: "#e5e7eb", accent: "#ff9900" };

  return (
    <div 
      className="card" 
      style={{ 
        padding: 16, 
        background: colors.bg,
        borderColor: colors.border,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <div style={{ fontSize: 32 }} aria-hidden="true">{icon}</div>
        <div style={{ flex: 1 }}>
          <div className="meta" style={{ fontWeight: 600 }}>{title}</div>
          <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.2, color: colors.accent }}>
            {value}
          </div>
        </div>
      </div>
      {subtitle && <div className="meta" style={{ fontSize: 12 }}>{subtitle}</div>}
    </div>
  );
}

function OrderCard({ order }) {
  const getOrderDate = (order) => {
    if (order.createdAt?.toDate) {
      return order.createdAt.toDate();
    }
    if (order.createdAt?.seconds) {
      return new Date(order.createdAt.seconds * 1000);
    }
    if (typeof order.createdAt === "string") {
      return new Date(order.createdAt);
    }
    return new Date();
  };

  const date = getOrderDate(order);
  const status = order.paymentStatus || order.status || "pending";
  const items = Array.isArray(order.items) ? order.items : [];
  const itemCount = items.reduce((sum, item) => sum + (Number(item.qty) || Number(item.quantity) || 1), 0);

  const statusColors = {
    paid: { bg: "#eaf8f0", border: "#d1fae5", text: "#065f46" },
    completed: { bg: "#eaf8f0", border: "#d1fae5", text: "#065f46" },
    pending: { bg: "#fff7e6", border: "#ffd8a8", text: "#8a5a00" },
    processing: { bg: "#eaf4ff", border: "#bfdbfe", text: "#1e3a8a" },
    cancelled: { bg: "#f3f4f6", border: "#e5e7eb", text: "#374151" },
  };

  const statusStyle = statusColors[status] || statusColors.pending;

  return (
    <Link 
      to={`/orders/${order.id}`}
      className="card"
      style={{ 
        padding: 12,
        textDecoration: "none",
        color: "inherit",
        transition: "all 0.2s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Order #{order.id.slice(0, 8)}</div>
          <div className="meta" style={{ fontSize: 12 }}>
            {date.toLocaleDateString()} • {itemCount} item{itemCount !== 1 ? 's' : ''}
          </div>
        </div>
        <div style={{ fontWeight: 800, fontSize: 16 }}>
          {USD.format(Number(order.total) || 0)}
        </div>
      </div>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span 
          className="pill" 
          style={{
            background: statusStyle.bg,
            borderColor: statusStyle.border,
            color: statusStyle.text,
            fontSize: 11,
            padding: "3px 8px",
          }}
        >
          {status}
        </span>
        <span className="meta" style={{ fontSize: 12 }}>View details →</span>
      </div>
    </Link>
  );
}

function AddressCard({ address }) {
  const fullAddress = [
    address.line1,
    address.line2,
    address.city,
    [address.state, address.postalCode].filter(Boolean).join(" "),
  ].filter(Boolean).join(", ");

  return (
    <div 
      className="card" 
      style={{ 
        padding: 12,
        background: address.isDefault ? "#f0fdf4" : "#fff",
        borderColor: address.isDefault ? "#bbf7d0" : "#e5e7eb",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <div style={{ fontWeight: 700, fontSize: 13 }}>
          {address.type === "shipping" ? "📦" : "💳"} {address.type.charAt(0).toUpperCase() + address.type.slice(1)}
        </div>
        {address.isDefault && (
          <span 
            className="pill" 
            style={{ 
              fontSize: 10,
              padding: "2px 6px",
              background: "#dcfce7",
              borderColor: "#bbf7d0",
              color: "#166534",
            }}
          >
            Default
          </span>
        )}
      </div>
      <div className="meta" style={{ fontSize: 12, lineHeight: 1.4 }}>
        {fullAddress || "No address details"}
      </div>
    </div>
  );
}

function AddressCardWithActions({ address, onEdit, onDelete, onSetDefault }) {
  const fullAddress = [
    address.line1,
    address.line2,
    address.city,
    [address.state, address.postalCode].filter(Boolean).join(" "),
  ].filter(Boolean).join(", ");

  return (
    <div 
      className="card" 
      style={{ 
        padding: 12,
        background: address.isDefault ? "#f0fdf4" : "#fff",
        borderColor: address.isDefault ? "#bbf7d0" : "#e5e7eb",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
            {address.type === "shipping" ? "📦" : "💳"} {address.type.charAt(0).toUpperCase() + address.type.slice(1)}
          </div>
          <div className="meta" style={{ fontSize: 12, lineHeight: 1.4 }}>
            {fullAddress || "No address details"}
          </div>
        </div>
        {address.isDefault && (
          <span 
            className="pill" 
            style={{ 
              fontSize: 10,
              padding: "2px 6px",
              background: "#dcfce7",
              borderColor: "#bbf7d0",
              color: "#166534",
            }}
          >
            Default
          </span>
        )}
      </div>
      
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        {!address.isDefault && (
          <button 
            onClick={() => onSetDefault(address)} 
            className="btn btn-secondary btn-slim"
            style={{ fontSize: 11, padding: "4px 8px" }}
          >
            Set Default
          </button>
        )}
        <button 
          onClick={() => onEdit(address)} 
          className="btn btn-secondary btn-slim"
          style={{ fontSize: 11, padding: "4px 8px" }}
        >
          Edit
        </button>
        <button 
          onClick={() => onDelete(address)} 
          className="btn btn-secondary btn-slim"
          style={{ fontSize: 11, padding: "4px 8px", background: "#fee", borderColor: "#fcc" }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 8, fontSize: 13 }}>
      <div className="meta">{label}:</div>
      <div style={{ fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function SupportTicketCard({ ticket, navigate }) {
  const getTicketDate = (ticket) => {
    if (ticket.createdAt?.toDate) {
      return ticket.createdAt.toDate();
    }
    if (ticket.createdAt?.seconds) {
      return new Date(ticket.createdAt.seconds * 1000);
    }
    if (typeof ticket.createdAt === "string") {
      return new Date(ticket.createdAt);
    }
    return new Date();
  };

  const date = getTicketDate(ticket);
  const status = ticket.status || "open";

  const statusColors = {
    open: { bg: "#eaf4ff", border: "#bfdbfe", text: "#1e3a8a", indicator: "#3b82f6" },
    in_progress: { bg: "#fff7e6", border: "#ffd8a8", text: "#8a5a00", indicator: "#f59e0b" },
    resolved: { bg: "#eaf8f0", border: "#d1fae5", text: "#065f46", indicator: "#10b981" },
    closed: { bg: "#f3f4f6", border: "#e5e7eb", text: "#374151", indicator: "#6b7280" },
  };

  const statusStyle = statusColors[status] || statusColors.open;

  return (
    <div 
      className="card"
      style={{ 
        padding: 12,
        cursor: "pointer",
        transition: "all 0.2s",
      }}
      onClick={() => navigate(`/tickets/${ticket.id}`)}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "";
        e.currentTarget.style.transform = "";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <span 
              style={{ 
                display: "inline-block",
                width: 12, 
                height: 12, 
                borderRadius: "50%", 
                background: statusStyle.indicator,
                border: "2px solid #fff",
                boxShadow: "0 0 0 1px rgba(0,0,0,0.1)"
              }}
              title={status.replace('_', ' ')}
            />
            <div style={{ fontWeight: 700, fontSize: 14 }}>{ticket.subject}</div>
            {ticket.readBy && ticket.readBy.some(userId => userId !== ticket.userId) && (
              <span 
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "2px 8px",
                  background: "#E8F5F2",
                  color: "#067D62",
                  borderRadius: 3,
                  fontSize: 11,
                  fontWeight: 700,
                  border: "1px solid #067D6220"
                }}
                title="A support team member has reviewed your ticket"
              >
                ✓ Reviewed
              </span>
            )}
          </div>
          <div className="meta" style={{ fontSize: 12, marginBottom: 4 }}>
            {ticket.category} • {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="meta" style={{ fontSize: 12, lineHeight: 1.4 }}>
            {ticket.message?.slice(0, 100)}{ticket.message?.length > 100 ? '...' : ''}
          </div>
        </div>
        <span 
          className="pill" 
          style={{
            background: statusStyle.bg,
            borderColor: statusStyle.border,
            color: statusStyle.text,
            fontSize: 11,
            padding: "3px 8px",
            marginLeft: 12,
          }}
        >
          {status.replace('_', ' ')}
        </span>
      </div>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
        <div className="meta" style={{ fontSize: 11 }}>
          Ticket ID: {ticket.id.slice(0, 8).toUpperCase()}
        </div>
        <div className="meta" style={{ fontSize: 11, color: "var(--primary)" }}>
          Click to {status === "resolved" || status === "closed" ? "view/reopen" : "edit"} →
        </div>
      </div>
    </div>
  );
}

function PaymentMethodCard({ payment, onDelete, onSetDefault }) {
  const getPaymentIcon = (type) => {
    switch(type) {
      case "card": return "💳";
      case "paypal": return "🔵";
      case "apple_pay": return "🍎";
      case "google_pay": return "🤖";
      default: return "💳";
    }
  };

  const getPaymentLabel = (payment) => {
    switch(payment.type) {
      case "card": {
        const brand = payment.cardBrand ? payment.cardBrand.charAt(0).toUpperCase() + payment.cardBrand.slice(1) : "Card";
        return `${brand} •••• ${payment.last4 || "****"}`;
      }
      case "paypal": 
        return payment.paypalEmail || "PayPal";
      case "apple_pay": 
        return "Apple Pay";
      case "google_pay": 
        return "Google Pay";
      default: 
        return "Payment Method";
    }
  };

  const getPaymentSubtitle = (payment) => {
    switch(payment.type) {
      case "card":
        if (payment.expiryMonth && payment.expiryYear) {
          return `Expires ${payment.expiryMonth}/${payment.expiryYear}`;
        }
        return payment.cardholderName || "Credit/Debit Card";
      case "paypal":
        return "PayPal Account";
      case "apple_pay":
        return "Digital Wallet";
      case "google_pay":
        return "Digital Wallet";
      default:
        return "";
    }
  };

  return (
    <div 
      className="card" 
      style={{ 
        padding: 12,
        background: payment.isDefault ? "#f0fdf4" : "#fff",
        borderColor: payment.isDefault ? "#bbf7d0" : "#e5e7eb",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <div style={{ fontSize: 32 }}>{getPaymentIcon(payment.type)}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>
            {getPaymentLabel(payment)}
          </div>
          <div className="meta" style={{ fontSize: 12 }}>
            {getPaymentSubtitle(payment)}
          </div>
        </div>
        {payment.isDefault && (
          <span 
            className="pill" 
            style={{ 
              fontSize: 10,
              padding: "2px 6px",
              background: "#dcfce7",
              borderColor: "#bbf7d0",
              color: "#166534",
            }}
          >
            Default
          </span>
        )}
      </div>
      
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        {!payment.isDefault && (
          <button 
            onClick={() => onSetDefault(payment)} 
            className="btn btn-secondary btn-slim"
            style={{ fontSize: 11, padding: "4px 8px" }}
          >
            Set Default
          </button>
        )}
        <button 
          onClick={() => onDelete(payment)} 
          className="btn btn-secondary btn-slim"
          style={{ fontSize: 11, padding: "4px 8px", background: "#fee", borderColor: "#fcc" }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
