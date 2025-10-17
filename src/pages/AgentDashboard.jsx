import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../auth/useAuth";
import { useNavigate } from "react-router-dom";
import { listOrders } from "../services/orderService";
import { collection, query, orderBy, getDocs, doc, updateDoc } from "firebase/firestore";
import { db, firebaseInitialized } from "../lib/firebase";
import { 
  Users, ShoppingCart, AlertTriangle, MessageSquare, 
  RefreshCw, Package
} from "lucide-react";

import { DashboardProvider } from "../contexts/DashboardContext";
import { useDashboard } from "../hooks/useDashboard";
import { StatsContainer } from "../components/dashboard/StatsContainer";
import { FilteredResultsFeedback } from "../components/dashboard/FilteredResultsFeedback";
import { OrdersTable } from "../components/dashboard/OrdersTable";
import { TicketsKanban } from "../components/dashboard/TicketsKanban";
import {
  USD, 
  getDateFromTimestamp, 
  toISODate
} from "../lib/utils";

function AgentDashboardContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { dateRange, filters, searchQuery } = useDashboard();
  
  const [orders, setOrders] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Redirect non-agents
  useEffect(() => {
    if (user && user.role === "admin") {
      navigate("/admin");
    } else if (user && user.role !== "agent") {
      navigate("/");
    }
  }, [user, navigate]);
  
  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        if (!firebaseInitialized || !db) {
          console.warn("Firebase not initialized, skipping data fetch");
          setOrders([]);
          setTickets([]);
          setCustomers([]);
          setLoading(false);
          return;
        }
        
        const ticketsQuery = query(
          collection(db, "supportTickets"),
          orderBy("createdAt", "desc")
        );
        const ticketsSnapshot = await getDocs(ticketsQuery);
        const ticketsData = ticketsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const customersQuery = query(
          collection(db, "users")
        );
        const customersSnapshot = await getDocs(customersQuery);
        const customersData = customersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const ordersData = await listOrders({ take: 500 });
        
        setOrders(Array.isArray(ordersData) ? ordersData : []);
        setTickets(ticketsData);
        setCustomers(customersData.filter(c => c.role === "customer"));
      } catch (error) {
        console.error("Error fetching agent dashboard data:", error);
        setOrders([]);
        setTickets([]);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    }
    
    if (user?.role === "agent") {
      fetchData();
    }
  }, [user]);
  
  // Filter orders by date range and ALL global filters
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Date range filter
      const orderDate = toISODate(getDateFromTimestamp(o.createdAt));
      if (orderDate < dateRange.from || orderDate > dateRange.to) return false;
      
      // Fulfillment status filter
      if (filters.fulfillmentStatus !== "all") {
        const fulfillment = o.fulfillmentStatus || o.fulfillment || "unfulfilled";
        if (fulfillment !== filters.fulfillmentStatus) return false;
      }
      
      // Category filter
      if (filters.category !== "all") {
        const hasCategory = o.items?.some(item => item.category === filters.category);
        if (!hasCategory) return false;
      }
      
      // Channel filter
      if (filters.channel !== "all" && o.channel) {
        if (o.channel !== filters.channel) return false;
      }
      
      // Region filter
      if (filters.region !== "all" && o.region) {
        if (o.region !== filters.region) return false;
      }
      
      // Search query filter
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        const matchesId = (o.id || "").toLowerCase().includes(search);
        const matchesCustomer = (o.customerName || o.customer || "").toLowerCase().includes(search);
        const matchesEmail = (o.customerEmail || o.email || "").toLowerCase().includes(search);
        
        if (!matchesId && !matchesCustomer && !matchesEmail) return false;
      }
      
      return true;
    });
  }, [orders, dateRange, filters, searchQuery]);
  
  // Calculate agent-specific metrics
  const metrics = useMemo(() => {
    const totalCustomers = customers.length;
    
    const openTickets = tickets.filter(t => t.status === "open").length;
    const inProgressTickets = tickets.filter(t => t.status === "in_progress").length;
    const urgentTickets = tickets.filter(t => 
      t.priority === "urgent" && (t.status === "open" || t.status === "in_progress")
    ).length;
    
    const ongoingOrders = filteredOrders.filter(o => {
      const fulfillment = o.fulfillmentStatus || "unfulfilled";
      return fulfillment === "unfulfilled" || fulfillment === "shipped";
    }).length;
    
    return {
      totalCustomers,
      openTickets,
      inProgressTickets,
      urgentTickets,
      ongoingOrders,
    };
  }, [filteredOrders, tickets, customers]);
  
  // Attention metrics
  const attentionMetrics = useMemo(() => {
    const unpaid = filteredOrders.filter(o => 
      o.paymentStatus === "unpaid" || o.paymentStatus === "pending" || o.status === "unpaid"
    ).length;
    
    const unfulfilled = filteredOrders.filter(o => {
      const paymentStatus = o.paymentStatus || o.status || "pending";
      const fulfillmentStatus = o.fulfillmentStatus || o.fulfillment || "unfulfilled";
      return (paymentStatus === "paid" || paymentStatus === "completed") && 
        fulfillmentStatus === "unfulfilled";
    }).length;
    
    return { unpaid, unfulfilled };
  }, [filteredOrders]);
  
  // Handle ticket status change
  const handleTicketStatusChange = async (ticketId, newStatus) => {
    if (!firebaseInitialized || !db) {
      console.warn("Firebase not initialized");
      return;
    }
    
    try {
      await updateDoc(doc(db, "supportTickets", ticketId), {
        status: newStatus,
        updatedAt: new Date(),
      });
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
    } catch (error) {
      console.error("Error updating ticket status:", error);
    }
  };
  
  // Agent color palette - Light Blue Theme
  const agentColors = {
    primary: "#3b82f6",      // Blue
    lightBlue: "#60a5fa",    // Light Blue
    darkBlue: "#1e3a8a",     // Dark Blue
    skyBlue: "#0ea5e9",      // Sky Blue
    textLight: "#FFFFFF",
    textDark: "#0F1111",
    borderLight: "#DDD",
    success: "#067D62",
    warning: "#F9C74F",
    danger: "#E53E3E",
  };
  
  // Enhanced box shadow styles
  const cardShadow = {
    boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
    transition: "all 0.3s cubic-bezier(.25,.8,.25,1)",
  };
  
  // Prepare stats data for unified container
  const statsData = useMemo(() => [
    {
      title: "Total Customers",
      value: metrics.totalCustomers,
      previousValue: metrics.totalCustomers,
      format: "number",
      icon: Users,
      iconColor: agentColors.primary
    },
    {
      title: "Open Tickets",
      value: metrics.openTickets,
      previousValue: metrics.openTickets,
      format: "number",
      icon: MessageSquare,
      iconColor: agentColors.skyBlue
    },
    {
      title: "Ongoing Orders",
      value: metrics.ongoingOrders,
      previousValue: metrics.ongoingOrders,
      format: "number",
      icon: ShoppingCart,
      iconColor: agentColors.lightBlue
    },
    {
      title: "Urgent Tickets",
      value: metrics.urgentTickets,
      previousValue: metrics.urgentTickets,
      format: "number",
      icon: AlertTriangle,
      iconColor: agentColors.danger
    }
  ], [metrics, agentColors]);
  
  if (!user || user.role !== "agent") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You need agent privileges to view this page.</p>
        </div>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
          <h2 className="text-2xl font-bold mb-2">Loading Dashboard...</h2>
          <p className="text-muted-foreground">Fetching your data</p>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #e0f2fe 0%, #bfdbfe 100%)" }}>
        <div className="container-xl" style={{ paddingTop: 24, paddingBottom: 24 }}>
          {/* Hero Headline */}
          <div className="hero-headline" style={{ marginBottom: 16 }}>
            <div>
              <div className="kicker">Agent</div>
              <h1 style={{ margin: 0 }}>Dashboard</h1>
              <div className="meta" style={{ marginTop: 8 }}>
                Monitor orders, support tickets, and customer interactions
              </div>
            </div>
          </div>
          
          {/* Filtered Results Feedback */}
          <FilteredResultsFeedback 
            resultCount={filteredOrders.length} 
            totalCount={orders.length} 
            entityName="orders" 
          />
          
          {/* Key Metrics Header with Quick Actions */}
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "flex-end",
            marginBottom: 8
          }}>
            <div>
              <h2 style={{ 
                fontSize: 20, 
                fontWeight: 800, 
                color: agentColors.darkBlue,
                margin: 0,
                marginBottom: 4
              }}>Key Metrics</h2>
              <div style={{ 
                height: 2, 
                width: 60,
                background: "linear-gradient(to right, #3b82f6, transparent)",
                borderRadius: 2
              }} />
            </div>
            
            {/* Quick Actions Buttons */}
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => navigate("/agent/orders")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  background: agentColors.primary,
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = agentColors.darkBlue;
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = agentColors.primary;
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
                }}
              >
                <ShoppingCart size={14} />
                Manage Orders
              </button>
              
              <button
                onClick={() => navigate("/agent/users")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  background: agentColors.skyBlue,
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#0284c7";
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = agentColors.skyBlue;
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
                }}
              >
                <Users size={14} />
                View Customers
              </button>
              
              <button
                onClick={() => navigate("/agent/tickets")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  background: agentColors.success,
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#055A4A";
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = agentColors.success;
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
                }}
              >
                <MessageSquare size={14} />
                Support Tickets
              </button>
            </div>
          </div>
          
          {/* Agent Stats Container */}
          <StatsContainer stats={statsData} />
          
          {/* Orders and Support Tickets - Side by Side (50/50) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
            {/* Orders Table */}
            <div className="card" style={{ 
              padding: 20,
              background: "#fff",
              borderRadius: "12px",
              ...cardShadow
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2 
                  onClick={() => navigate('/agent/orders')}
                  style={{ 
                    margin: 0, 
                    fontSize: 20, 
                    fontWeight: 800, 
                    color: agentColors.darkBlue,
                    cursor: 'pointer',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = agentColors.primary}
                  onMouseLeave={(e) => e.currentTarget.style.color = agentColors.darkBlue}
                >
                  Recent Orders
                </h2>
                
                {/* Order Status Mini Stats - Inline */}
                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "10px", color: "#718096", fontWeight: 600, marginBottom: "2px" }}>UNPAID</div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#F9C74F" }}>{attentionMetrics.unpaid}</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "10px", color: "#718096", fontWeight: 600, marginBottom: "2px" }}>UNFULFILLED</div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#3b82f6" }}>{attentionMetrics.unfulfilled}</div>
                  </div>
                </div>
              </div>
              
              <OrdersTable 
                orders={filteredOrders.slice(0, 10)} 
                onOrderClick={(order) => navigate(`/orders/${order.id}`)}
                zebraStripe={true}
              />
            </div>
            
            {/* Support Tickets Kanban */}
            <div className="card" style={{ 
              padding: 20,
              background: "#fff",
              borderRadius: "12px",
              ...cardShadow
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2 
                  onClick={() => navigate('/agent/tickets')}
                  style={{ 
                    margin: 0, 
                    fontSize: 20, 
                    fontWeight: 800, 
                    color: agentColors.darkBlue,
                    cursor: 'pointer',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = agentColors.primary}
                  onMouseLeave={(e) => e.currentTarget.style.color = agentColors.darkBlue}
                >
                  Support Tickets
                </h2>
                
                {/* Ticket Status Mini Stats - Inline */}
                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "10px", color: "#718096", fontWeight: 600, marginBottom: "2px" }}>OPEN</div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#3b82f6" }}>
                      {tickets.filter(t => t.status === "open").length}
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "10px", color: "#718096", fontWeight: 600, marginBottom: "2px" }}>IN PROGRESS</div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#F9C74F" }}>
                      {tickets.filter(t => t.status === "in_progress").length}
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "10px", color: "#718096", fontWeight: 600, marginBottom: "2px" }}>URGENT</div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#E53E3E" }}>
                      {metrics.urgentTickets}
                    </div>
                  </div>
                </div>
              </div>
              
              <TicketsKanban 
                tickets={tickets.slice(0, 8)} 
                onStatusChange={handleTicketStatusChange} 
              />
            </div>
          </div>
          
          {/* Quick Customer Data Actions */}
          <div className="card" style={{ 
            padding: 20,
            background: "#fff",
            borderRadius: "12px",
            ...cardShadow
          }}>
            <h2 style={{ margin: "0 0 16px 0", fontSize: 20, fontWeight: 800, color: agentColors.darkBlue }}>Quick Actions</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              <button 
                onClick={() => navigate("/agent/orders")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "12px 16px",
                  background: "#f0f9ff",
                  border: "2px solid #bfdbfe",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: agentColors.darkBlue,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#dbeafe";
                  e.currentTarget.style.borderColor = "#93c5fd";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#f0f9ff";
                  e.currentTarget.style.borderColor = "#bfdbfe";
                }}
              >
                <ShoppingCart size={18} />
                Manage All Orders
              </button>
              
              <button 
                onClick={() => navigate("/agent/my-orders")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "12px 16px",
                  background: "#f0f9ff",
                  border: "2px solid #bfdbfe",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: agentColors.darkBlue,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#dbeafe";
                  e.currentTarget.style.borderColor = "#93c5fd";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#f0f9ff";
                  e.currentTarget.style.borderColor = "#bfdbfe";
                }}
              >
                <Package size={18} />
                My Orders
              </button>
              
              <button 
                onClick={() => navigate("/agent/users")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "12px 16px",
                  background: "#f0f9ff",
                  border: "2px solid #bfdbfe",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: agentColors.darkBlue,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#dbeafe";
                  e.currentTarget.style.borderColor = "#93c5fd";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#f0f9ff";
                  e.currentTarget.style.borderColor = "#bfdbfe";
                }}
              >
                <Users size={18} />
                Customer Data
              </button>
              
              <button 
                onClick={() => navigate("/agent/tickets")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "12px 16px",
                  background: "#f0f9ff",
                  border: "2px solid #bfdbfe",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: agentColors.darkBlue,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#dbeafe";
                  e.currentTarget.style.borderColor = "#93c5fd";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#f0f9ff";
                  e.currentTarget.style.borderColor = "#bfdbfe";
                }}
              >
                <MessageSquare size={18} />
                Support Tickets
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AgentDashboard() {
  return <AgentDashboardContent />;
}
