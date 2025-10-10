import React, { useState } from "react";
import { ChevronDown, ChevronUp, Download, Mail, Printer, Package } from "lucide-react";
import { cn, USD, getDateFromTimestamp, toISODate } from "../../lib/utils";

export function OrdersTable({ orders = [], onOrderClick }) {
  const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [expandedOrder, setExpandedOrder] = useState(null);
  
  // Sorting
  const sortedOrders = [...orders].sort((a, b) => {
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    
    if (sortConfig.key === "createdAt") {
      const aDate = getDateFromTimestamp(aVal);
      const bDate = getDateFromTimestamp(bVal);
      return sortConfig.direction === "asc" ? aDate - bDate : bDate - aDate;
    }
    
    if (sortConfig.key === "total") {
      return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
    }
    
    return 0;
  });
  
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };
  
  const toggleSelectOrder = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };
  
  const toggleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(o => o.id));
    }
  };
  
  const handleBulkAction = (action) => {
    console.log(`Bulk action: ${action} on`, selectedOrders);
    // Implement bulk actions
  };
  
  const exportCSV = () => {
    const csvContent = [
      ["Order ID", "Date", "Customer", "Status", "Total"].join(","),
      ...orders.map(o => [
        o.id,
        toISODate(getDateFromTimestamp(o.createdAt)),
        o.customerName || o.customer || "",
        o.paymentStatus || o.status || "",
        o.total || 0
      ].join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${Date.now()}.csv`;
    a.click();
  };
  
  if (orders.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-semibold text-lg mb-2">No orders found</h3>
        <p className="text-muted-foreground mb-4">
          Adjust your filters or create a new order manually
        </p>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90">
          Create Order
        </button>
      </div>
    );
  }
  
  return (
    <div className="bg-card border border-border rounded-lg">
      {/* Bulk Actions Bar */}
      {selectedOrders.length > 0 && (
        <div className="px-4 py-3 bg-accent border-b border-border flex items-center justify-between">
          <span className="text-sm font-medium">
            {selectedOrders.length} order{selectedOrders.length > 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkAction("email")}
              className="flex items-center gap-2 px-3 py-1.5 bg-background border border-border rounded hover:bg-accent text-sm"
            >
              <Mail className="h-4 w-4" />
              Email
            </button>
            <button
              onClick={() => handleBulkAction("capture")}
              className="flex items-center gap-2 px-3 py-1.5 bg-background border border-border rounded hover:bg-accent text-sm"
            >
              Capture Payment
            </button>
            <button
              onClick={() => handleBulkAction("print")}
              className="flex items-center gap-2 px-3 py-1.5 bg-background border border-border rounded hover:bg-accent text-sm"
            >
              <Printer className="h-4 w-4" />
              Print Labels
            </button>
          </div>
        </div>
      )}
      
      {/* Table Controls */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSelectAll}
            className="px-3 py-1.5 text-sm border border-border rounded hover:bg-accent"
          >
            {selectedOrders.length === orders.length ? "Deselect All" : "Select All"}
          </button>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-3 py-1.5 text-sm border border-border rounded hover:bg-accent"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              <th className="w-12 px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedOrders.length === orders.length}
                  onChange={toggleSelectAll}
                  className="focus-ring"
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                <button
                  onClick={() => handleSort("id")}
                  className="flex items-center gap-1 hover:text-primary"
                >
                  Order ID
                  {sortConfig.key === "id" && (
                    sortConfig.direction === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                <button
                  onClick={() => handleSort("createdAt")}
                  className="flex items-center gap-1 hover:text-primary"
                >
                  Date
                  {sortConfig.key === "createdAt" && (
                    sortConfig.direction === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Customer</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-4 py-3 text-right text-sm font-semibold">
                <button
                  onClick={() => handleSort("total")}
                  className="flex items-center gap-1 hover:text-primary ml-auto"
                >
                  Total
                  {sortConfig.key === "total" && (
                    sortConfig.direction === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedOrders.map((order) => {
              const isExpanded = expandedOrder === order.id;
              const paymentStatus = order.paymentStatus || order.status || "pending";
              const fulfillmentStatus = order.fulfillmentStatus || order.fulfillment || "unfulfilled";
              
              return (
                <React.Fragment key={order.id}>
                  <tr
                    className={cn(
                      "border-b border-border hover:bg-accent/50 transition-colors",
                      selectedOrders.includes(order.id) && "bg-accent/30"
                    )}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => toggleSelectOrder(order.id)}
                        className="focus-ring"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                        className="text-primary hover:underline font-mono text-sm"
                      >
                        #{order.id.slice(0, 8)}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {toISODate(getDateFromTimestamp(order.createdAt))}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium">
                        {order.customerName || order.customer || "Unknown"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {order.customerEmail || order.email || ""}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                          paymentStatus === "paid" && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
                          paymentStatus === "unpaid" && "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
                          paymentStatus === "refunded" && "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        )}>
                          {paymentStatus}
                        </span>
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                          fulfillmentStatus === "fulfilled" && "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
                          fulfillmentStatus === "unfulfilled" && "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                        )}>
                          {fulfillmentStatus}
                        </span>
                        {order.flagged && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                            flagged
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {USD.format(Number(order.total) || 0)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => onOrderClick && onOrderClick(order)}
                        className="px-3 py-1 bg-primary text-primary-foreground rounded hover:opacity-90 text-sm"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                  
                  {/* Expanded Row */}
                  {isExpanded && (
                    <tr key={`${order.id}-expanded`} className="bg-accent/30">
                      <td colSpan="7" className="px-4 py-4">
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-semibold text-sm mb-2">Order Items</h4>
                            {order.items && order.items.length > 0 ? (
                              <div className="space-y-1">
                                {order.items.map((item, idx) => (
                                  <div key={`${order.id}-item-${idx}-${item.sku || item.productId || idx}`} className="flex justify-between text-sm">
                                    <span>{item.name || item.title} × {item.qty || item.quantity || 1}</span>
                                    <span className="font-medium">{USD.format(Number(item.price) || 0)}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No items</p>
                            )}
                          </div>
                          
                          {order.shippingAddressSnapshot && (
                            <div>
                              <h4 className="font-semibold text-sm mb-1">Shipping Address</h4>
                              <p className="text-sm text-muted-foreground">
                                {order.shippingAddressSnapshot.line1}, {order.shippingAddressSnapshot.city}, {order.shippingAddressSnapshot.state} {order.shippingAddressSnapshot.postalCode}
                              </p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
