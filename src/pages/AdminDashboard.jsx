import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../auth/useAuth";
import { useNavigate } from "react-router-dom";
import { listOrders } from "../services/orderService";
import { listProducts } from "../services/productService";
import { createDiscount } from "../services/discountService";
import { collection, query, orderBy, getDocs, doc, updateDoc } from "firebase/firestore";
import { db, firebaseInitialized } from "../lib/firebase";
import { 
  DollarSign, ShoppingCart, TrendingUp, Percent, Package, 
  RefreshCw, AlertTriangle
} from "lucide-react";

import { DashboardProvider } from "../contexts/DashboardContext";
import { useDashboard } from "../hooks/useDashboard";
import { StatsContainer } from "../components/dashboard/StatsContainer";
import { AttentionCard, InsightCard } from "../components/dashboard/AttentionCard";
import { FilteredResultsFeedback } from "../components/dashboard/FilteredResultsFeedback";
import { TotalSalesChart } from "../components/dashboard/Charts";
import { OrdersTable } from "../components/dashboard/OrdersTable";
import { TicketsKanban } from "../components/dashboard/TicketsKanban";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import CreateDiscountModal from "../components/CreateDiscountModal";
import AddProductModal from "../components/AddProductModal";
import CreateOrderModal from "../components/CreateOrderModal";
import {
  USD, 
  getDateFromTimestamp, 
  toISODate, 
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
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  
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
        
        console.log("AdminDashboard - Orders loaded:", ordersData?.length || 0);
        console.log("AdminDashboard - Products loaded:", productsData?.length || 0);
        console.log("AdminDashboard - Sample order:", ordersData?.[0]);
        
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
    console.log("Filtering orders - Total orders:", orders.length);
    console.log("Date range:", dateRange);
    
    const filtered = orders.filter(o => {
      // Date range filter
      const orderDate = toISODate(getDateFromTimestamp(o.createdAt));
      if (orderDate < dateRange.from || orderDate > dateRange.to) {
        return false;
      }
      
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
    
    console.log("Filtered orders count:", filtered.length);
    return filtered;
  }, [orders, dateRange, filters, searchQuery]);
  
  // Calculate KPIs
  const kpis = useMemo(() => {
    // Use ALL filtered orders for order count (not just paid)
    const orderCount = filteredOrders.length;
    
    // Calculate revenue from all orders (you can filter by paid if needed)
    const revenue = filteredOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const aov = orderCount > 0 ? revenue / orderCount : 0;
    
    // Keep paid orders for specific calculations if needed
    const paidOrders = filteredOrders.filter(o => 
      o.paymentStatus === "paid" || o.status === "paid" || o.paymentStatus === "completed"
    );
    
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
      const stock = Number(p.inventory) || 0;
      const price = Number(p.price) || 0;
      return sum + (stock * price);
    }, 0);
    
    const refunds = filteredOrders.filter(o => o.paymentStatus === "refunded" || o.status === "refunded");
    const refundAmount = refunds.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    
    // Calculate previous period refunds
    const previousRefunds = previousOrders.filter(o => o.paymentStatus === "refunded" || o.status === "refunded");
    const previousRefundAmount = previousRefunds.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    
    const openTicketsCount = tickets.filter(t => 
      t.status === "open" || t.status === "in_progress"
    ).length;
    
    // Calculate gross margin if products have cost data
    const totalCost = paidOrders.reduce((sum, o) => {
      const orderCost = (o.items || []).reduce((itemSum, item) => {
        const product = products.find(p => p.id === item.productId);
        const cost = Number(product?.cost) || 0;
        const quantity = Number(item.quantity) || 0;
        return itemSum + (cost * quantity);
      }, 0);
      return sum + orderCost;
    }, 0);
    const grossProfit = revenue - totalCost;
    const grossMarginPercent = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    
    const previousTotalCost = previousOrders.filter(o => 
      o.paymentStatus === "paid" || o.status === "paid" || o.paymentStatus === "completed"
    ).reduce((sum, o) => {
      const orderCost = (o.items || []).reduce((itemSum, item) => {
        const product = products.find(p => p.id === item.productId);
        const cost = Number(product?.cost) || 0;
        const quantity = Number(item.quantity) || 0;
        return itemSum + (cost * quantity);
      }, 0);
      return sum + orderCost;
    }, 0);
    const previousGrossProfit = previousRevenue - previousTotalCost;
    const previousGrossMarginPercent = previousRevenue > 0 ? (previousGrossProfit / previousRevenue) * 100 : 0;
    
    return {
      revenue: { current: revenue, previous: previousRevenue },
      orders: { current: orderCount, previous: previousOrderCount },
      aov: { current: aov, previous: previousAov },
      conversionRate: { current: 0, previous: 0 }, // Requires visitor/session data not in DB
      grossMargin: { current: grossMarginPercent, previous: previousGrossMarginPercent },
      refunds: { current: refundAmount, previous: previousRefundAmount },
      inventoryValue: { current: inventoryValue, previous: inventoryValue * 0.95 },
      ticketsBacklog: { current: openTicketsCount, previous: openTicketsCount },
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
      const stock = Number(p.inventory) || 0;
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
  
  // Handle discount creation
  const handleCreateDiscount = async (discountData) => {
    try {
      await createDiscount(discountData);
      // Optionally refresh data or show success message
    } catch (error) {
      console.error("Error creating discount:", error);
      throw error;
    }
  };
  
  // Handle product creation - refetch products after creation
  const handleProductCreated = async () => {
    try {
      const productsData = await listProducts({ take: 500 });
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (error) {
      console.error("Error refreshing products:", error);
    }
  };
  
  // Handle order creation - refetch orders after creation
  const handleOrderCreated = async () => {
    try {
      const ordersData = await listOrders({ take: 500 });
      setOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (error) {
      console.error("Error refreshing orders:", error);
    }
  };
  
  // Prepare stats data for unified container
  const statsData = useMemo(() => [
    {
      title: "Revenue",
      value: kpis.revenue.current,
      previousValue: kpis.revenue.previous,
      format: "currency",
      icon: DollarSign,
      iconColor: "#146EB4"
    },
    {
      title: "Orders",
      value: kpis.orders.current,
      previousValue: kpis.orders.previous,
      format: "number",
      icon: ShoppingCart,
      iconColor: "#FF9900"
    },
    {
      title: "AOV",
      value: kpis.aov.current,
      previousValue: kpis.aov.previous,
      format: "currency",
      icon: TrendingUp,
      iconColor: "#067D62"
    },
    {
      title: "Conversion",
      value: kpis.conversionRate.current,
      previousValue: kpis.conversionRate.previous,
      format: "percent",
      icon: Percent,
      iconColor: "#146EB4"
    },
    {
      title: "Gross Margin",
      value: kpis.grossMargin.current,
      previousValue: kpis.grossMargin.previous,
      format: "percent",
      icon: Percent,
      iconColor: "#067D62"
    },
    {
      title: "Inventory",
      value: kpis.inventoryValue.current,
      previousValue: kpis.inventoryValue.previous,
      format: "currency",
      icon: Package,
      iconColor: "#37475A"
    },
    {
      title: "Refunds",
      value: kpis.refunds.current,
      previousValue: kpis.refunds.previous,
      format: "currency",
      icon: RefreshCw,
      iconColor: "#E53E3E"
    },
    {
      title: "Open Tickets",
      value: kpis.ticketsBacklog.current,
      previousValue: kpis.ticketsBacklog.previous,
      format: "number",
      icon: AlertTriangle,
      iconColor: "#F9C74F"
    }
  ], [kpis]);
  
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
        <div className="container-xl" style={{ paddingTop: 24, paddingBottom: 24 }}>
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
          
          {/* Key Metrics Header with Quick Actions on Same Row */}
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
                color: amazonColors.darkBg,
                margin: 0,
                marginBottom: 4
              }}>Key Metrics</h2>
              <div style={{ 
                height: 2, 
                width: 60,
                background: "linear-gradient(to right, #FF9900, transparent)",
                borderRadius: 2
              }} />
            </div>
            
            {/* Quick Actions Buttons */}
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setShowDiscountModal(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  background: amazonColors.orange,
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
                  e.currentTarget.style.background = amazonColors.darkOrange;
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = amazonColors.orange;
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
                }}
              >
                <Percent size={14} />
                Create Discount
              </button>
              
              <button
                onClick={() => setShowProductModal(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  background: amazonColors.accentBlue,
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
                  e.currentTarget.style.background = "#0F4C8A";
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = amazonColors.accentBlue;
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
                }}
              >
                <Package size={14} />
                Add Product
              </button>
              
              <button
                onClick={() => setShowOrderModal(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  background: amazonColors.success,
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
                  e.currentTarget.style.background = amazonColors.success;
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
                }}
              >
                <ShoppingCart size={14} />
                Create Order
              </button>
            </div>
          </div>
          
          {/* Amazon-Inspired Stats Container */}
          <StatsContainer stats={statsData} />
          
          
          {/* Insights */}
          {insights.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <InsightCard insights={insights} />
            </div>
          )}
          
          {/* Orders and Support Tickets - Side by Side (50/50) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
            {/* Orders Table with Sales Trend */}
            <div className="card" style={{ 
              padding: 20,
              background: "#fff",
              borderRadius: "12px",
              ...cardShadow
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2 
                  onClick={() => navigate('/admin/orders')}
                  style={{ 
                    margin: 0, 
                    fontSize: 20, 
                    fontWeight: 800, 
                    color: amazonColors.darkBg,
                    cursor: 'pointer',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = amazonColors.orange}
                  onMouseLeave={(e) => e.currentTarget.style.color = amazonColors.darkBg}
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
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#146EB4" }}>{attentionMetrics.unfulfilled}</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "10px", color: "#718096", fontWeight: 600, marginBottom: "2px" }}>FLAGGED</div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#E53E3E" }}>{attentionMetrics.flagged}</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "10px", color: "#718096", fontWeight: 600, marginBottom: "2px" }}>LOW STOCK</div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#FF9900" }}>{attentionMetrics.lowStock}</div>
                  </div>
                </div>
              </div>
              
              <OrdersTable 
                orders={filteredOrders.slice(0, 10)} 
                onOrderClick={(order) => navigate(`/admin/orders/${order.id}`)}
                onEditOrder={(order) => {
                  console.log("Edit order:", order);
                  // TODO: Implement edit order modal
                }}
                onDeleteOrder={(order) => {
                  if (window.confirm(`Are you sure you want to delete order #${order.id.slice(0, 8)}?`)) {
                    console.log("Delete order:", order);
                    // TODO: Implement delete order
                  }
                }}
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
                  onClick={() => navigate('/admin/tickets')}
                  style={{ 
                    margin: 0, 
                    fontSize: 20, 
                    fontWeight: 800, 
                    color: amazonColors.darkBg,
                    cursor: 'pointer',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = amazonColors.orange}
                  onMouseLeave={(e) => e.currentTarget.style.color = amazonColors.darkBg}
                >
                  Support Tickets
                </h2>
                
                {/* Ticket Status Mini Stats - Inline */}
                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "10px", color: "#718096", fontWeight: 600, marginBottom: "2px" }}>OPEN</div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#146EB4" }}>
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
                    <div style={{ fontSize: "10px", color: "#718096", fontWeight: 600, marginBottom: "2px" }}>RESOLVED</div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#067D62" }}>
                      {tickets.filter(t => t.status === "resolved").length}
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "10px", color: "#718096", fontWeight: 600, marginBottom: "2px" }}>CLOSED</div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#718096" }}>
                      {tickets.filter(t => t.status === "closed").length}
                    </div>
                  </div>
                </div>
              </div>
              
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
      
      {/* Discount Creation Modal */}
      <CreateDiscountModal
        open={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        onSave={handleCreateDiscount}
      />
      
      {/* Product Creation Modal */}
      <AddProductModal
        open={showProductModal}
        mode="create"
        onClose={() => setShowProductModal(false)}
        onSuccess={handleProductCreated}
      />
      
      {/* Order Creation Modal */}
      <CreateOrderModal
        open={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        onSave={handleOrderCreated}
      />
    </div>
  );
}

export default function AdminDashboard() {
  return <AdminDashboardContent />;
}
