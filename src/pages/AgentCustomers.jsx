// AgentCustomers.jsx - Agent view of all customers
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../auth/useAuth";
import { collection, query, orderBy, getDocs, where } from "firebase/firestore";
import { db, firebaseInitialized } from "../lib/firebase";
import { useNavigate } from "react-router-dom";
import { RefreshCw, AlertTriangle, Mail, Calendar, User } from "lucide-react";
import BreadcrumbNav from '../components/BreadcrumbNav';
import { useTotalHeaderHeight } from '../hooks/useTotalHeaderHeight';;

export default function AgentCustomers() {
  const totalHeaderHeight = useTotalHeaderHeight();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Redirect non-agents
  useEffect(() => {
    if (user && user.role !== "agent") {
      navigate("/");
    }
  }, [user, navigate]);
  
  // Fetch all customers
  useEffect(() => {
    async function fetchCustomers() {
      try {
        setLoading(true);
        
        if (!firebaseInitialized || !db) {
          console.warn("Firebase not initialized, skipping data fetch");
          setCustomers([]);
          setLoading(false);
          return;
        }
        
        const customersQuery = query(
          collection(db, "users"),
          where("role", "==", "customer"),
          orderBy("createdAt", "desc")
        );
        const customersSnapshot = await getDocs(customersQuery);
        const customersData = customersSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        
        setCustomers(customersData);
      } catch (error) {
        console.error("Error fetching customers:", error);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    }
    
    if (user?.role === "agent") {
      fetchCustomers();
    }
  }, [user]);
  
  // Filter customers by search query
  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return customers;
    
    const search = searchQuery.toLowerCase();
    return customers.filter(c => {
      const matchesName = (c.displayName || "").toLowerCase().includes(search);
      const matchesEmail = (c.email || "").toLowerCase().includes(search);
      const matchesId = (c.id || "").toLowerCase().includes(search);
      
      return matchesName || matchesEmail || matchesId;
    });
  }, [customers, searchQuery]);
  
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
          <h2 className="text-2xl font-bold mb-2">Loading Customers...</h2>
          <p className="text-muted-foreground">Fetching customer data</p>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <BreadcrumbNav
        currentPage="All Customers"
        backButton={{ label: "Back to Dashboard", path: "/agent" }}
      />
      
      <div className="container-xl" style={{ paddingTop: totalHeaderHeight + 24, paddingBottom: 48 }}>
        {/* Page Title */}
        <div className="hero-headline" style={{ marginBottom: 8 }}>
          <div>
            <div className="kicker">Agent</div>
            <h1 style={{ margin: 0 }}>All Customers</h1>
          </div>
        </div>
      
      {/* Search Bar */}
      <div className="card" style={{ padding: 16, marginBottom: 24 }}>
        <input
          type="text"
          className="input"
          placeholder="Search by name, email, or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: "100%", maxWidth: 500 }}
        />
      </div>
      
      {/* Results Count */}
      {searchQuery && (
        <div style={{ marginBottom: 16, padding: 12, background: "#f0f9ff", borderRadius: 8 }}>
          <p style={{ margin: 0, fontSize: 14 }}>
            Showing {filteredCustomers.length} of {customers.length} customers
          </p>
        </div>
      )}
      
      {/* Customers List */}
      <div className="card" style={{ padding: 20 }}>
        {filteredCustomers.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#666" }}>
            <User size={48} style={{ margin: "0 auto 16px", opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
              {searchQuery ? "No customers found" : "No customers yet"}
            </p>
            <p style={{ margin: "8px 0 0 0", fontSize: 14 }}>
              {searchQuery ? "Try a different search term" : "Customers will appear here"}
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {filteredCustomers.map(customer => (
              <div
                key={customer.id}
                className="card"
                style={{
                  padding: 16,
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#fff"
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: 16
                      }}
                    >
                      {(customer.displayName || customer.email || "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                        {customer.displayName || "No Name"}
                      </h3>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                        <Mail size={12} style={{ color: "#666" }} />
                        <span style={{ fontSize: 13, color: "#666" }}>{customer.email}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 13, color: "#666" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Calendar size={14} />
                      <span>
                        Joined: {customer.createdAt?.toDate 
                          ? new Date(customer.createdAt.toDate()).toLocaleDateString() 
                          : "Unknown"}
                      </span>
                    </div>
                    <div>
                      <span className="pill" style={{ padding: "2px 8px", fontSize: 11 }}>
                        Customer
                      </span>
                    </div>
                  </div>
                </div>
                
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: "6px 12px", fontSize: 14 }}
                    onClick={() => {
                      // Could navigate to customer profile or orders
                      console.log("View customer:", customer.id);
                    }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Summary Stats */}
      <div className="card" style={{ padding: 20, marginTop: 24, background: "#f9fafb" }}>
        <h3 style={{ margin: "0 0 12px 0", fontSize: 16, fontWeight: 600 }}>Summary</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#3b82f6" }}>
              {customers.length}
            </div>
            <div style={{ fontSize: 13, color: "#666" }}>Total Customers</div>
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#10b981" }}>
              {filteredCustomers.length}
            </div>
            <div style={{ fontSize: 13, color: "#666" }}>
              {searchQuery ? "Matching Search" : "Active Accounts"}
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
