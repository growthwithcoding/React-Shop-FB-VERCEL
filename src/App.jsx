// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom"
import { useEffect, useState } from "react"
import Home from "./pages/Home.jsx"
import ProductPage from "./pages/ProductPage.jsx"
import CartPage from "./pages/CartPage.jsx"
import CheckoutPage from "./pages/CheckoutPage.jsx"
import About from "./pages/About.jsx"
import Contact from "./pages/Contact.jsx"
import Navbar from "./components/NavBar.jsx"
import Footer from "./components/Footer.jsx"
import AddToCartModal from "./components/AddToCartModal.jsx"
import AuthPage from "./pages/AuthPage.jsx"
import ProtectedRoute from "./auth/ProtectedRoute.jsx"
import AdminRoute from "./auth/AdminRoute.jsx"
import AgentRoute from "./auth/AgentRoute.jsx"
import Dashboard from "./pages/Dashboard.jsx"
import AdminDashboard from "./pages/AdminDashboard.jsx"
import AgentDashboard from "./pages/AgentDashboard.jsx"
import Orders from "./pages/Orders.jsx"
import OrderDetail from "./pages/OrderDetail.jsx"
import AdminProducts from "./pages/AdminProducts.jsx"
import Profile from "./pages/Profile.jsx"
import OrderConfirmation from "./pages/OrderConfirmation.jsx"
import Onboarding from "./pages/Onboarding.jsx"
import TicketDetail from "./pages/TicketDetail.jsx"
import { isOnboardingComplete } from "./services/onboardingService"
import { DashboardProvider } from "./contexts/DashboardContext"
import ScrollToTop from "./components/ScrollToTop.jsx"
import { useNavbarHeight } from "./hooks/useNavbarHeight.js"

// Demo mode - conditionally imported
let DemoProvider = null;
let DemoModeToggle = null;
let DemoEntry = null;
let DEMO_AVAILABLE = false;

try {
  const demoModule = await import('./demo/index.js');
  DemoProvider = demoModule.DemoProvider;
  DemoModeToggle = demoModule.DemoModeToggle;
  DemoEntry = demoModule.DemoEntry;
  DEMO_AVAILABLE = demoModule.DEMO_AVAILABLE;
} catch {
  // Demo module not available - gracefully continue without it
  console.log('Demo mode is not available');
}

// NEW: Admin pages
import AdminOrders from "./pages/AdminOrders.jsx"
import { AdminUsers } from "./pages/AdminUsers.jsx"
import { AdminDiscounts } from "./pages/AdminDiscounts.jsx"
import { AdminSettings } from "./pages/AdminSettings.jsx"
import AgentOrders from "./pages/AgentOrders.jsx"
import AgentCustomers from "./pages/AgentCustomers.jsx"
import { AgentUsers } from "./pages/AgentUsers.jsx"

export default function App() {
  const navbarHeight = useNavbarHeight();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  // Check if onboarding is needed on mount
  useEffect(() => {
    let mounted = true;
    
    async function checkOnboarding() {
      try {
        const isComplete = await isOnboardingComplete();
        if (mounted) {
          setNeedsOnboarding(!isComplete);
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
        // On error, assume onboarding is needed
        if (mounted) {
          setNeedsOnboarding(true);
        }
      } finally {
        if (mounted) {
          setCheckingOnboarding(false);
        }
      }
    }
    
    checkOnboarding();
    
    return () => {
      mounted = false;
    };
  }, []);

  // Show loading while checking onboarding status
  if (checkingOnboarding) {
    return (
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        minHeight: "100vh",
        background: "var(--background)"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏪</div>
          <h2 style={{ marginBottom: 8 }}>Loading Store...</h2>
          <p style={{ color: "var(--text-secondary)" }}>Please wait</p>
        </div>
      </div>
    );
  }

  // If onboarding is needed, redirect all routes to onboarding
  if (needsOnboarding) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }
  
  // Use the calculated navbar height for proper spacing
  // This accounts for both the main navbar and any admin/agent panels
  const mainPaddingTop = navbarHeight > 0 ? `${navbarHeight}px` : '0px';
  
  // Normal app flow after onboarding is complete
  // Wrap entire app in DashboardProvider so NavBar and dashboard pages share same context
  const appContent = (
    <DashboardProvider>
      <ScrollToTop />
      <Navbar />
      <main className="page" style={{ paddingTop: mainPaddingTop }}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/products/:id" element={<ProductPage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />

          {/* Protected (wrap once, then list protected children) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/order-confirmation" element={<OrderConfirmation />} />
            <Route path="/tickets/:ticketId" element={<TicketDetail />} />

            {/* Admin-only nested under Protected */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/products" element={<AdminProducts />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/discounts" element={<AdminDiscounts />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
            </Route>

            {/* Agent-only nested under Protected */}
            <Route element={<AgentRoute />}>
              <Route path="/agent" element={<AgentDashboard />} />
              <Route path="/agent/orders" element={<AgentOrders />} />
              <Route path="/agent/customers" element={<AgentCustomers />} />
              <Route path="/agent/users" element={<AgentUsers />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <AddToCartModal />
      {DEMO_AVAILABLE && DemoModeToggle && <DemoModeToggle />}
      {DEMO_AVAILABLE && DemoEntry && <DemoEntry />}
      <Footer />
    </DashboardProvider>
  );

  // Wrap with DemoProvider if available
  if (DEMO_AVAILABLE && DemoProvider) {
    return <DemoProvider>{appContent}</DemoProvider>;
  }

  return appContent;
}
