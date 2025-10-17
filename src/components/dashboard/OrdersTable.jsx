import React from "react";
import { Eye, Edit2, Trash2, Package } from "lucide-react";
import { USD, getDateFromTimestamp, toISODate } from "../../lib/utils";

export function OrdersTable({ orders = [], onOrderClick, onEditOrder, onDeleteOrder, zebraStripe = false }) {
  
  if (orders.length === 0) {
    return (
      <div style={{ 
        padding: "48px 24px", 
        textAlign: "center",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        background: "#fff"
      }}>
        <Package style={{ width: 48, height: 48, color: "#9ca3af", margin: "0 auto 16px" }} />
        <h3 style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>No orders found</h3>
        <p style={{ color: "#6b7280", marginBottom: 16 }}>
          Adjust your filters or create a new order manually
        </p>
      </div>
    );
  }
  
  return (
    <div style={{ 
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      background: "#fff",
      overflow: "hidden"
    }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#374151" }}>
                Order ID
              </th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#374151" }}>
                Date
              </th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#374151" }}>
                Customer
              </th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#374151" }}>
                Status
              </th>
              <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "12px", fontWeight: 600, color: "#374151" }}>
                Total
              </th>
              <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "12px", fontWeight: 600, color: "#374151" }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, index) => {
              const paymentStatus = order.paymentStatus || order.status || "pending";
              const fulfillmentStatus = order.fulfillmentStatus || order.fulfillment || "unfulfilled";
              
              return (
                <tr
                  key={order.id}
                  style={{
                    borderBottom: index < orders.length - 1 ? "1px solid #e5e7eb" : "none",
                    background: zebraStripe && index % 2 !== 0 ? "#f9fafb" : "#fff",
                    transition: "background-color 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#f3f4f6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = zebraStripe && index % 2 !== 0 ? "#f9fafb" : "#fff";
                  }}
                >
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontFamily: "monospace", fontSize: "13px", color: "#146EB4", fontWeight: 600 }}>
                      #{order.id.slice(0, 8)}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: "13px", color: "#374151" }}>
                    {toISODate(getDateFromTimestamp(order.createdAt))}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontSize: "13px", fontWeight: 500, color: "#111827" }}>
                      {order.customerName || order.customer || "Unknown"}
                    </div>
                    <div style={{ fontSize: "11px", color: "#6b7280" }}>
                      {order.customerEmail || order.email || ""}
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: 600,
                        textTransform: "capitalize",
                        background: paymentStatus === "paid" || paymentStatus === "completed" ? "#dcfce7" : 
                                   paymentStatus === "unpaid" || paymentStatus === "pending" ? "#fef3c7" : 
                                   paymentStatus === "refunded" ? "#fee2e2" : "#f3f4f6",
                        color: paymentStatus === "paid" || paymentStatus === "completed" ? "#166534" : 
                               paymentStatus === "unpaid" || paymentStatus === "pending" ? "#92400e" : 
                               paymentStatus === "refunded" ? "#991b1b" : "#374151"
                      }}>
                        {paymentStatus}
                      </span>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: 600,
                        textTransform: "capitalize",
                        background: fulfillmentStatus === "fulfilled" || fulfillmentStatus === "shipped" || fulfillmentStatus === "delivered" ? "#dbeafe" : "#f3f4f6",
                        color: fulfillmentStatus === "fulfilled" || fulfillmentStatus === "shipped" || fulfillmentStatus === "delivered" ? "#1e40af" : "#6b7280"
                      }}>
                        {fulfillmentStatus}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600, fontSize: "14px", color: "#111827" }}>
                    {USD.format(Number(order.total) || 0)}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                      <button
                        onClick={() => onOrderClick && onOrderClick(order)}
                        title="View Order"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "6px",
                          background: "#146EB4",
                          color: "#fff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#0F4C8A";
                          e.currentTarget.style.transform = "translateY(-1px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#146EB4";
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        <Eye size={14} />
                      </button>
                      
                      {onEditOrder && (
                        <button
                          onClick={() => onEditOrder(order)}
                          title="Edit Order"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "6px",
                            background: "#FF9900",
                            color: "#fff",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#FF6600";
                            e.currentTarget.style.transform = "translateY(-1px)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#FF9900";
                            e.currentTarget.style.transform = "translateY(0)";
                          }}
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                      
                      {onDeleteOrder && (
                        <button
                          onClick={() => onDeleteOrder(order)}
                          title="Delete Order"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "6px",
                            background: "#E53E3E",
                            color: "#fff",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#C53030";
                            e.currentTarget.style.transform = "translateY(-1px)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#E53E3E";
                            e.currentTarget.style.transform = "translateY(0)";
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
