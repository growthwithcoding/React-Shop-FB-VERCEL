import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../auth/useAuth";
import { listOrders } from "../services/orderService";
import { collection, query, orderBy, getDocs, doc, updateDoc } from "firebase/firestore";
import { db, firebaseInitialized } from "../lib/firebase";
import { 
  ShoppingCart, AlertTriangle, RefreshCw, Users, MessageSquare
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { DashboardProvider } from "../contexts/DashboardContext";
import { useDashboard } from "../hooks/useDashboard";
import { OrdersTable } from "../components/dashboard/OrdersTable";
import { TicketsKanban } from "../components/dashboard/TicketsKanban";
import { FilteredResultsFeedback } from "../components/dashboard/FilteredResultsFeedback";
import { getDateFromTimestamp, toISODate } from "../lib/utils";

function AgentDashboardContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { dateRange, filters, searchQuery } = useDashboard();
  
  const [orders, setOrders] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Redirect admins to their dashboard
  useEffect(() => {
    if (user && user.role === "admin") {
      navigate("/admin");
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
          collection(db, "users"),
          orderBy("createdAt", "desc")
        );
        const customersSnapshot = await getDocs(customersQuery);
        const customersData = customersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const ordersData = await listOrders({ take: 500 });
        
        setOrders(Array.isArray(ordersData) ? ordersData : []);
        setTickets(ticketsData);
        setCustomers(customersData);
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
      
      // Category filter - check if any item in the order matches the category
      if (filters.category !== "all") {
        const hasCategory = o.items?.some(item => item.category === filters.category);
        if (!hasCategory) return false;
      }
      
      // Channel filter (if orders have channel data)
      if (filters.channel !== "all" && o.channel) {
        if (o.channel !== filters.channel) return false;
      }
      
      // Region filter (if orders have region data)
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
    const unpaidCount = filteredOrders.filter(o => 
      o.paymentStatus === "unpaid" || o.paymentStatus === "pending" || o.status === "unpaid"
    ).length;
    
    const unfulfilledCount = filteredOrders.filter(o => {
      const paymentStatus = o.paymentStatus || o.status || "pending";
      const fulfillmentStatus = o.fulfillmentStatus || o.fulfillment || "unfulfilled";
      return (paymentStatus === "paid" || paymentStatus === "completed") && 
        fulfillmentStatus === "unfulfilled";
    }).length;
    
    const openTickets = tickets.filter(t => 
      t.status === "open"
    ).length;
    
    const inProgressTickets = tickets.filter(t => 
      t.status === "in_progress"
    ).length;
    
    const resolvedTickets = tickets.filter(t => 
      t.status === "resolved"
    ).length;
    
    const urgentTickets = tickets.filter(t => 
      t.priority === "urgent" && (t.status === "open" || t.status === "in_progress")
    ).length;
    
    const totalCustomers = customers.filter(c => c.role === "customer").length;
    
    return {
      unpaidOrders: unpaidCount,
      unfulfilledOrders: unfulfilledCount,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      urgentTickets,
      totalCustomers,
    };
  }, [filteredOrders, tickets, customers]);
  
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
  
  // Agent color palette
  const agentColors = {
    blue: "#3b82f6",
    lightBlue: "#60a5fa",
    darkBlue: "#1e3a8a",
    textLight: "#FFFFFF",
    textDark: "#0F1111",
    borderLight: "#DDD",
    success: "#067D62",
    warning: "#F9C74F",
    danger: "#E53E3E",
  };
  
  // Card shadow styles
  const cardShadow = {
    boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
    transition: "all 0.3s cubic-bezier(.25,.8,.25,1)",
  };
  
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
        <div className="container-xl" style={{ paddingTop: 16, paddingBottom: 24 }}>
          {/* Page Title */}
          <div className="hero-headline" style={{ marginBottom: 24 }}>
            <div>
              <div className="kicker">Agent</div>
              <h1 style={{ margin: 0 }}>Dashboard</h1>
            </div>
          </div>
          
          {/* Filtered Results Feedback */}
          <FilteredResultsFeedback 
            resultCount={filteredOrders.length} 
            totalCount={orders.length} 
            entityName="orders" 
          />
          
          {/* Quick Stats */}
          <div className="grid" style={{ 
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
            gap: 16, 
            marginBottom: 24 
          }}>
            {/* Orders Requiring Attention */}
            <div className="card" style={{ 
              padding: "20px",
              background: "#fff",
              borderRadius: "12px",
              border: `2px solid ${agentColors.warning}`,
              ...cardShadow
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#666" }}>Unpaid Orders</span>
                <ShoppingCart size={20} style={{ color: agentColors.warning }} />
              </div>
              <div style={{ fontSize: "32px", fontWeight: 800, color: agentColors.warning }}>{metrics.unpaidOrders}</div>
              <div style={{ fontSize: "12px", color: "#999", marginTop: 4 }}>Require payment</div>
            </div>
            
            <div className="card" style={{ 
              padding: "20px",
              background: "#fff",
              borderRadius: "12px",
              border: `2px solid ${agentColors.blue}`,
              ...cardShadow
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#666" }}>Unfulfilled Orders</span>
                <ShoppingCart size={20} style={{ color: agentColors.blue }} />
              </div>
              <div style={{ fontSize: "32px", fontWeight: 800, color: agentColors.blue }}>{metrics.unfulfilledOrders}</div>
              <div style={{ fontSize: "12px", color: "#999", marginTop: 4 }}>Ready to ship</div>
            </div>
            
            <div className="card" style={{ 
              padding: "20px",
              background: "#fff",
              borderRadius: "12px",
              border: `2px solid ${agentColors.danger}`,
              ...cardShadow
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#666" }}>Urgent Tickets</span>
                <AlertTriangle size={20} style={{ color: agentColors.danger }} />
              </div>
              <div style={{ fontSize: "32px", fontWeight: 800, color: agentColors.danger }}>{metrics.urgentTickets}</div>
              <div style={{ fontSize: "12px", color: "#999", marginTop: 4 }}>Need immediate attention</div>
            </div>
            
            <div className="card" style={{ 
              padding: "20px",
              background: "#fff",
              borderRadius: "12px",
              border: `2px solid ${agentColors.lightBlue}`,
              ...cardShadow
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#666" }}>Total Customers</span>
                <Users size={20} style={{ color: agentColors.lightBlue }} />
              </div>
              <div style={{ fontSize: "32px", fontWeight: 800, color: agentColors.lightBlue }}>{metrics.totalCustomers}</div>
              <div style={{ fontSize: "12px", color: "#999", marginTop: 4 }}>Registered users</div>
            </div>
          </div>
          
          {/* Support Ticket Status Cards */}
          <div className="grid" style={{ 
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
            gap: 16, 
            marginBottom: 24 
          }}>
            <div className="card" style={{ 
              padding: "20px",
              background: "#fff",
              borderRadius: "12px",
              border: `2px solid ${agentColors.blue}`,
              ...cardShadow
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#666" }}>Open Tickets</span>
                <MessageSquare size={20} style={{ color: agentColors.blue }} />
              </div>
              <div style={{ fontSize: "32px", fontWeight: 800, color: agentColors.blue }}>{metrics.openTickets}</div>
              <div style={{ fontSize: "12px", color: "#999", marginTop: 4 }}>Awaiting response</div>
            </div>
            
            <div className="card" style={{ 
              padding: "20px",
              background: "#fff",
              borderRadius: "12px",
              border: `2px solid ${agentColors.warning}`,
              ...cardShadow
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#666" }}>In Progress</span>
                <RefreshCw size={20} style={{ color: agentColors.warning }} />
              </div>
              <div style={{ fontSize: "32px", fontWeight: 800, color: agentColors.warning }}>{metrics.inProgressTickets}</div>
              <div style={{ fontSize: "12px", color: "#999", marginTop: 4 }}>Being worked on</div>
            </div>
            
            <div className="card" style={{ 
              padding: "20px",
              background: "#fff",
              borderRadius: "12px",
              border: `2px solid ${agentColors.success}`,
              ...cardShadow
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#666" }}>Resolved</span>
                <ShoppingCart size={20} style={{ color: agentColors.success }} />
              </div>
              <div style={{ fontSize: "32px", fontWeight: 800, color: agentColors.success }}>{metrics.resolvedTickets}</div>
              <div style={{ fontSize: "12px", color: "#999", marginTop: 4 }}>Ready to close</div>
            </div>
          </div>
          
          {/* Main Content: Orders and Tickets Side by Side */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
            {/* Orders Table */}
            <div className="card" style={{ 
              padding: 20,
              background: "#fff",
              borderRadius: "12px",
              ...cardShadow
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: agentColors.darkBlue }}>Recent Orders</h2>
                <button 
                  onClick={() => navigate("/agent/orders")}
                  className="btn btn-primary"
                  style={{ padding: "6px 12px", fontSize: "14px" }}
                >
                  View All
                </button>
              </div>
              <OrdersTable orders={filteredOrders.slice(0, 10)} onOrderClick={(orderId) => navigate(`/orders/${orderId}`)} />
            </div>
            
            {/* Support Tickets Kanban */}
            <div className="card" style={{ 
              padding: 20,
              background: "#fff",
              borderRadius: "12px",
              ...cardShadow
            }}>
              <h2 style={{ margin: "0 0 16px 0", fontSize: 20, fontWeight: 800, color: agentColors.darkBlue }}>Support Tickets</h2>
              <TicketsKanban 
                tickets={tickets.slice(0, 8)} 
                onStatusChange={handleTicketStatusChange} 
              />
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="card" style={{ 
            padding: 20,
            background: "#fff",
            borderRadius: "12px",
            ...cardShadow
          }}>
            <h2 style={{ margin: "0 0 16px 0", fontSize: 20, fontWeight: 800, color: agentColors.darkBlue }}>Quick Actions</h2>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button 
                onClick={() => navigate("/agent/orders")}
                className="btn btn-primary"
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <ShoppingCart size={16} />
                Manage Orders
              </button>
              <button 
                onClick={() => navigate("/agent/users")}
                className="btn btn-secondary"
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <Users size={16} />
                View Customers
              </button>
              <button 
                className="btn btn-secondary"
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <MessageSquare size={16} />
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
