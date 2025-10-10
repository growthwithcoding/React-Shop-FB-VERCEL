import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../auth/useAuth";
import { useNavigate } from "react-router-dom";
import { listOrders } from "../services/orderService";
import { listProducts } from "../services/productService";
import { collection, query, orderBy, getDocs, doc, updateDoc } from "firebase/firestore";
import { db, firebaseInitialized } from "../lib/firebase";
import { 
  DollarSign, ShoppingCart, TrendingUp, Percent, Package, 
  RefreshCw, AlertTriangle
} from "lucide-react";

import { DashboardProvider } from "../contexts/DashboardContext";
import { useDashboard } from "../hooks/useDashboard";
import { KpiCard } from "../components/dashboard/KpiCard";
import { AttentionCard, InsightCard } from "../components/dashboard/AttentionCard";
import { FilteredResultsFeedback } from "../components/dashboard/FilteredResultsFeedback";
import { TotalSalesChart } from "../components/dashboard/Charts";
import { OrdersTable } from "../components/dashboard/OrdersTable";
import { TicketsKanban } from "../components/dashboard/TicketsKanban";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { 
  USD, 
  getDateFromTimestamp, 
  toISODate, 
  generateSparklineData,
  calculateChange 
} from "../lib/utils";

function AdminDashboardContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { dateRange, filters, searchQuery } = useDashboard();
  
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Redirect agents to their dashboard
  useEffect(() => {
    if (user && user.role === "agent") {
      navigate("/agent");
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
          setProducts([]);
          setTickets([]);
          setLoading(false);
          return;
        }
        
        const ticketsQuery = query(
          collection(db, "supportTickets"),
          orderBy("createdAt", "desc")
        );
        const ticketsSnapshot = await getDocs(ticketsQuery);
        const ticketsData = ticketsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const [ordersData, productsData] = await Promise.all([
          listOrders({ take: 500 }),
          listProducts({ take: 500 }),
        ]);
        
        setOrders(Array.isArray(ordersData) ? ordersData : []);
        setProducts(Array.isArray(productsData) ? productsData : []);
        setTickets(ticketsData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setOrders([]);
        setProducts([]);
        setTickets([]);
      } finally {
        setLoading(false);
      }
    }
    
    if (user?.role === "admin") {
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
  
  // Calculate KPIs
  const kpis = useMemo(() => {
    const paidOrders = filteredOrders.filter(o => 
      o.paymentStatus === "paid" || o.status === "paid" || o.paymentStatus === "completed"
    );
    
    const revenue = paidOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const orderCount = paidOrders.length;
    const aov = orderCount > 0 ? revenue / orderCount : 0;
    
    // Previous period for comparison
    const daysDiff = Math.ceil(
      (new Date(dateRange.to) - new Date(dateRange.from)) / (1000 * 60 * 60 * 24)
    );
    const previousFrom = toISODate(new Date(new Date(dateRange.from).getTime() - daysDiff * 86400000));
    const previousTo = toISODate(new Date(new Date(dateRange.to).getTime() - daysDiff * 86400000));
    
    const previousOrders = orders.filter(o => {
      const orderDate = toISODate(getDateFromTimestamp(o.createdAt));
      return orderDate >= previousFrom && orderDate <= previousTo;
    });
    
    const previousRevenue = previousOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const previousOrderCount = previousOrders.length;
    const previousAov = previousOrderCount > 0 ? previousRevenue / previousOrderCount : 0;
    
    const inventoryValue = products.reduce((sum, p) => {
      const stock = Number(p.stock) || 0;
      const price = Number(p.price) || 0;
      return sum + (stock * price);
    }, 0);
    
    const refunds = filteredOrders.filter(o => o.paymentStatus === "refunded" || o.status === "refunded");
    const refundAmount = refunds.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    
    const openTicketsCount = tickets.filter(t => 
      t.status === "open" || t.status === "in_progress"
    ).length;
    
    return {
      revenue: { current: revenue, previous: previousRevenue },
      orders: { current: orderCount, previous: previousOrderCount },
      aov: { current: aov, previous: previousAov },
      conversionRate: { current: 2.4, previous: 2.1 },
      grossMargin: { current: 44.0, previous: 42.5 },
      refunds: { current: refundAmount, previous: 0 },
      inventoryValue: { current: inventoryValue, previous: inventoryValue * 0.95 },
      ticketsBacklog: { current: openTicketsCount, previous: openTicketsCount + 3 },
    };
  }, [filteredOrders, orders, products, tickets, dateRange]);
  
  // Calculate previous period orders for comparison
  const previousOrders = useMemo(() => {
    const daysDiff = Math.ceil(
      (new Date(dateRange.to) - new Date(dateRange.from)) / (1000 * 60 * 60 * 24)
    );
    const previousFrom = toISODate(new Date(new Date(dateRange.from).getTime() - daysDiff * 86400000));
    const previousTo = toISODate(new Date(new Date(dateRange.to).getTime() - daysDiff * 86400000));
    
    return orders.filter(o => {
      const orderDate = toISODate(getDateFromTimestamp(o.createdAt));
      return orderDate >= previousFrom && orderDate <= previousTo;
    });
  }, [orders, dateRange]);
  
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
    
    const flagged = filteredOrders.filter(o => o.flagged === true).length;
    
    const urgentTickets = tickets.filter(t => 
      t.priority === "urgent" && t.status !== "resolved" && t.status !== "closed"
    ).length;

    const lowStockCount = products.filter(p => {
      const stock = Number(p.stock) || 0;
      const threshold = Number(p.threshold) || Number(p.lowStockThreshold) || 5;
      return stock <= threshold;
    }).length;
    
    return { unpaid, unfulfilled, flagged, urgentTickets, lowStock: lowStockCount };
  }, [filteredOrders, tickets, products]);
  
  
  // Insights
  const insights = useMemo(() => {
    const result = [];
    const aovChange = calculateChange(kpis.aov.current, kpis.aov.previous);
    if (aovChange < -10) {
      result.push({
        type: "warning",
        title: `AOV down ${Math.abs(aovChange).toFixed(1)}% vs previous period`,
        description: "Consider upselling strategies or reviewing discount policies",
        link: { text: "View AOV analysis", action: () => {} },
      });
    }
    if (attentionMetrics.urgentTickets > 5) {
      result.push({
        type: "warning",
        title: `${attentionMetrics.urgentTickets} urgent support tickets`,
        description: "Some customers may be waiting for critical responses",
        link: { text: "View tickets", action: () => {} },
      });
    }
    return result;
  }, [kpis, attentionMetrics]);
  
  // Keyboard shortcuts
  useKeyboardShortcuts([
    { keys: "ctrl+k", action: () => {
        const searchInput = document.querySelector('input[placeholder*="Search"]');
        if (searchInput) searchInput.focus();
      }
    },
  ]);
  
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
  
  // Calculate support ticket status counts
  const ticketStatusCounts = useMemo(() => {
    const open = tickets.filter(t => t.status === "open").length;
    const inProgress = tickets.filter(t => t.status === "in_progress").length;
    const resolved = tickets.filter(t => t.status === "resolved").length;
    const closed = tickets.filter(t => t.status === "closed").length;
    return { open, inProgress, resolved, closed };
  }, [tickets]);
  
  const sparklineData = generateSparklineData(orders, 7);
  
  // Amazon color palette
  const amazonColors = {
    orange: "#FF9900",
    darkOrange: "#FF6600",
    darkBg: "#232F3E",
    lightBg: "#37475A",
    accentBlue: "#146EB4",
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
  
  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You need admin privileges to view this page.</p>
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
      <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)" }}>
        <div className="container-xl" style={{ paddingTop: 60, paddingBottom: 24 }}>
          {/* Page Title */}
          <div className="hero-headline" style={{ marginBottom: 8 }}>
            <div>
              <div className="kicker">Admin</div>
              <h1 style={{ margin: 0 }}>Dashboard</h1>
            </div>
          </div>
          
          {/* Filtered Results Feedback */}
          <FilteredResultsFeedback 
            resultCount={filteredOrders.length} 
            totalCount={orders.length} 
            entityName="orders" 
          />
          
          {/* KPI Strip */}
          <div className="grid" style={{ 
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", 
            gap: 16,
            marginBottom: 24 
          }}>
            <KpiCard title="Revenue" value={kpis.revenue.current} previousValue={kpis.revenue.previous} format="currency" sparklineData={sparklineData} icon={DollarSign} />
            <KpiCard title="Orders" value={kpis.orders.current} previousValue={kpis.orders.previous} format="number" icon={ShoppingCart} />
            <KpiCard title="AOV" value={kpis.aov.current} previousValue={kpis.aov.previous} format="currency" icon={TrendingUp} />
            <KpiCard title="Conversion Rate" value={kpis.conversionRate.current} previousValue={kpis.conversionRate.previous} format="percent" icon={Percent} />
            <KpiCard title="Gross Margin" value={kpis.grossMargin.current} previousValue={kpis.grossMargin.previous} format="percent" icon={Percent} />
            <KpiCard title="Inventory Value" value={kpis.inventoryValue.current} previousValue={kpis.inventoryValue.previous} format="currency" icon={Package} />
          </div>
          
          {/* Attention & Tasks */}
          <div className="grid" style={{ 
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
            gap: 16, 
            marginBottom: 24 
          }}>
            <AttentionCard title="Unpaid Orders" count={attentionMetrics.unpaid} severity="warning" ctaText="Collect Payment" ctaAction={() => {}} />
            <AttentionCard title="Unfulfilled Orders" count={attentionMetrics.unfulfilled} severity="info" ctaText="Create Shipment" ctaAction={() => {}} />
            <AttentionCard title="Flagged Orders" count={attentionMetrics.flagged} severity="danger" ctaText="Review Flags" ctaAction={() => {}} />
            <AttentionCard title="Low Stock Items" count={attentionMetrics.lowStock} severity="warning" ctaText="View Inventory" ctaAction={() => {}} icon={Package} />
            <AttentionCard title="Urgent Tickets" count={attentionMetrics.urgentTickets} severity="danger" ctaText="View Tickets" ctaAction={() => {}} icon={AlertTriangle} />
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
              border: `2px solid ${amazonColors.accentBlue}`,
              ...cardShadow
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#666" }}>Open Tickets</span>
                <AlertTriangle size={20} style={{ color: amazonColors.accentBlue }} />
              </div>
              <div style={{ fontSize: "32px", fontWeight: 800, color: amazonColors.accentBlue }}>{ticketStatusCounts.open}</div>
              <div style={{ fontSize: "12px", color: "#999", marginTop: 4 }}>Need attention</div>
            </div>
            
            <div className="card" style={{ 
              padding: "20px",
              background: "#fff",
              borderRadius: "12px",
              border: `2px solid ${amazonColors.warning}`,
              ...cardShadow
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#666" }}>In Progress</span>
                <RefreshCw size={20} style={{ color: amazonColors.warning }} />
              </div>
              <div style={{ fontSize: "32px", fontWeight: 800, color: amazonColors.warning }}>{ticketStatusCounts.inProgress}</div>
              <div style={{ fontSize: "12px", color: "#999", marginTop: 4 }}>Being worked on</div>
            </div>
            
            <div className="card" style={{ 
              padding: "20px",
              background: "#fff",
              borderRadius: "12px",
              border: `2px solid ${amazonColors.success}`,
              ...cardShadow
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#666" }}>Resolved</span>
                <ShoppingCart size={20} style={{ color: amazonColors.success }} />
              </div>
              <div style={{ fontSize: "32px", fontWeight: 800, color: amazonColors.success }}>{ticketStatusCounts.resolved}</div>
              <div style={{ fontSize: "12px", color: "#999", marginTop: 4 }}>Awaiting closure</div>
            </div>
            
            <div className="card" style={{ 
              padding: "20px",
              background: "#fff",
              borderRadius: "12px",
              border: "2px solid #999",
              ...cardShadow
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#666" }}>Closed</span>
                <Package size={20} style={{ color: "#999" }} />
              </div>
              <div style={{ fontSize: "32px", fontWeight: 800, color: "#666" }}>{ticketStatusCounts.closed}</div>
              <div style={{ fontSize: "12px", color: "#999", marginTop: 4 }}>Completed</div>
            </div>
          </div>
          
          {/* Insights */}
          {insights.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <InsightCard insights={insights} />
            </div>
          )}
          
          {/* Orders and Support Tickets in Columns */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
            {/* Orders Table */}
            <div className="card" style={{ 
              padding: 20,
              background: "#fff",
              borderRadius: "12px",
              ...cardShadow
            }}>
              <h2 style={{ margin: "0 0 16px 0", fontSize: 20, fontWeight: 800, color: amazonColors.darkBg }}>Recent Orders</h2>
              <OrdersTable orders={filteredOrders.slice(0, 10)} onOrderClick={() => {}} />
            </div>
            
            {/* Support Tickets Kanban */}
            <div className="card" style={{ 
              padding: 20,
              background: "#fff",
              borderRadius: "12px",
              ...cardShadow
            }}>
              <h2 style={{ margin: "0 0 16px 0", fontSize: 20, fontWeight: 800, color: amazonColors.darkBg }}>Support Tickets</h2>
              <TicketsKanban tickets={tickets.slice(0, 8)} onStatusChange={handleTicketStatusChange} />
            </div>
          </div>
          
          {/* Total Sales Over Time Chart */}
          <div className="card" style={{ 
            padding: 20,
            background: "#fff",
            borderRadius: "12px",
            ...cardShadow
          }}>
            <TotalSalesChart 
              orders={filteredOrders} 
              dateRange={dateRange}
              previousPeriodOrders={previousOrders}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return <AdminDashboardContent />;
}
