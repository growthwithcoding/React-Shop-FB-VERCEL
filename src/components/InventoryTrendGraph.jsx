// src/components/InventoryTrendGraph.jsx
import { useMemo } from "react";

/**
 * Simple inventory trend visualization component
 * Shows stock levels over time periods (simulated for now, ready for real data)
 */
export default function InventoryTrendGraph({ products = [], orders = [] }) {
  // Calculate inventory metrics over last 30 days
  const trendData = useMemo(() => {
    if (!products.length) return null;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Calculate current totals
    const totalStock = products.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
    const lowStockCount = products.filter(p => {
      const stock = Number(p.stock) || 0;
      const threshold = Number(p.threshold) || Number(p.lowStockThreshold) || 5;
      return stock <= threshold;
    }).length;

    // Calculate sales velocity (items sold per day)
    const recentOrders = orders.filter(o => {
      let orderDate;
      if (o.createdAt?.toDate) {
        orderDate = o.createdAt.toDate();
      } else if (o.createdAt?.seconds) {
        orderDate = new Date(o.createdAt.seconds * 1000);
      } else if (typeof o.createdAt === "string") {
        orderDate = new Date(o.createdAt);
      }
      return orderDate && orderDate >= thirtyDaysAgo;
    });

    const totalSold = recentOrders.reduce((sum, order) => {
      const items = Array.isArray(order.items) ? order.items : [];
      return sum + items.reduce((itemSum, item) => 
        itemSum + (Number(item.quantity) || Number(item.qty) || 1), 0
      );
    }, 0);

    const avgDailySales = totalSold / 30;

    // Calculate turnover rate
    const turnoverRate = totalStock > 0 ? ((totalSold / totalStock) * 100).toFixed(1) : 0;

    // Generate simple weekly data points for visualization
    const weeks = [];
    for (let i = 4; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - (i - 1) * 7 * 24 * 60 * 60 * 1000);
      
      const weekOrders = orders.filter(o => {
        let orderDate;
        if (o.createdAt?.toDate) {
          orderDate = o.createdAt.toDate();
        } else if (o.createdAt?.seconds) {
          orderDate = new Date(o.createdAt.seconds * 1000);
        } else if (typeof o.createdAt === "string") {
          orderDate = new Date(o.createdAt);
        }
        return orderDate && orderDate >= weekStart && orderDate < weekEnd;
      });

      const weekSold = weekOrders.reduce((sum, order) => {
        const items = Array.isArray(order.items) ? order.items : [];
        return sum + items.reduce((itemSum, item) => 
          itemSum + (Number(item.quantity) || Number(item.qty) || 1), 0
        );
      }, 0);

      weeks.push({
        label: i === 0 ? "This week" : `${i}w ago`,
        sold: weekSold,
      });
    }

    return {
      totalStock,
      lowStockCount,
      totalSold,
      avgDailySales: avgDailySales.toFixed(1),
      turnoverRate,
      weeks,
    };
  }, [products, orders]);

  if (!trendData) {
    return (
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        height: 200, 
        background: "linear-gradient(180deg, #f9fafb 0%, #ffffff 100%)",
        border: "2px dashed var(--border)",
        borderRadius: 8,
        color: "var(--muted)"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
          <div style={{ fontWeight: 600 }}>No inventory data yet</div>
        </div>
      </div>
    );
  }

  const maxSold = Math.max(...trendData.weeks.map(w => w.sold), 1);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <div style={{ padding: 12, background: "#f9fafb", borderRadius: 8, border: "1px solid var(--border)" }}>
          <div className="meta" style={{ fontSize: 11, marginBottom: 4 }}>Total Stock</div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{trendData.totalStock}</div>
        </div>
        <div style={{ padding: 12, background: "#fff7e6", borderRadius: 8, border: "1px solid #ffd8a8" }}>
          <div className="meta" style={{ fontSize: 11, marginBottom: 4 }}>Low Stock Items</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#8a5a00" }}>{trendData.lowStockCount}</div>
        </div>
        <div style={{ padding: 12, background: "#eaf4ff", borderRadius: 8, border: "1px solid #bfdbfe" }}>
          <div className="meta" style={{ fontSize: 11, marginBottom: 4 }}>Sold (30d)</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#1e3a8a" }}>{trendData.totalSold}</div>
        </div>
        <div style={{ padding: 12, background: "#eaf8f0", borderRadius: 8, border: "1px solid #d1fae5" }}>
          <div className="meta" style={{ fontSize: 11, marginBottom: 4 }}>Turnover Rate</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#065f46" }}>{trendData.turnoverRate}%</div>
        </div>
      </div>

      {/* Bar Chart */}
      <div>
        <div className="meta" style={{ fontWeight: 700, marginBottom: 10 }}>
          Sales Activity (Last 5 Weeks)
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
          {trendData.weeks.map((week, idx) => {
            const height = maxSold > 0 ? (week.sold / maxSold) * 100 : 0;
            return (
              <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    width: "100%",
                    height: `${Math.max(height, 5)}%`,
                    background: `linear-gradient(180deg, #febd69 0%, #ff9900 100%)`,
                    borderRadius: "4px 4px 0 0",
                    transition: "height 0.3s ease",
                    position: "relative",
                  }}
                  title={`${week.sold} items sold`}
                >
                  {week.sold > 0 && (
                    <div style={{ 
                      position: "absolute", 
                      top: -20, 
                      left: "50%", 
                      transform: "translateX(-50%)",
                      fontSize: 11,
                      fontWeight: 700,
                      whiteSpace: "nowrap"
                    }}>
                      {week.sold}
                    </div>
                  )}
                </div>
                <div className="meta" style={{ fontSize: 10, textAlign: "center" }}>
                  {week.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Insights */}
      <div style={{ padding: 12, background: "#f9fafb", borderRadius: 8, fontSize: 13 }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>📊 Insights</div>
        <div className="meta">
          Average daily sales: <strong>{trendData.avgDailySales} items/day</strong>
          {trendData.turnoverRate > 50 && " • High turnover rate indicates strong sales"}
          {trendData.lowStockCount > 5 && ` • ${trendData.lowStockCount} items need restocking`}
        </div>
      </div>
    </div>
  );
}
