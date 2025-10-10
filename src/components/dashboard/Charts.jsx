import { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { USD, getDateFromTimestamp, toISODate } from "../../lib/utils";

// Custom tooltip for charts
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  
  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
      {label && <p className="font-medium text-sm mb-2">{label}</p>}
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">
            {USD.format(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Total Sales Over Time Chart
 * Shows gross sales, net sales (after refunds/discounts), and previous period comparison
 * Uses actual Firestore data from orders
 */
export function TotalSalesChart({ orders = [], dateRange, previousPeriodOrders = [] }) {
  const chartData = useMemo(() => {
    if (!orders || orders.length === 0) {
      return [];
    }

    // Calculate the number of days in the current period
    const startDate = new Date(dateRange.from);
    const endDate = new Date(dateRange.to);
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    // Generate data for each day in the period
    const data = [];
    
    for (let i = 0; i < daysDiff; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = toISODate(currentDate);
      
      // Filter orders for this specific date
      const dayOrders = orders.filter(order => {
        const orderDate = toISODate(getDateFromTimestamp(order.createdAt));
        return orderDate === dateStr;
      });

      // Calculate gross sales (all paid orders)
      const paidOrders = dayOrders.filter(o => 
        o.paymentStatus === "paid" || o.status === "paid" || o.paymentStatus === "completed"
      );
      const grossSales = paidOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

      // Calculate refunds
      const refundOrders = dayOrders.filter(o => 
        o.paymentStatus === "refunded" || o.status === "refunded"
      );
      const refunds = refundOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

      // Calculate discounts applied
      const discounts = paidOrders.reduce((sum, o) => sum + (Number(o.discount) || 0), 0);

      // Calculate net sales (gross - refunds - discounts)
      const netSales = grossSales - refunds;

      // Calculate previous period sales for comparison
      let previousSales = 0;
      if (previousPeriodOrders && previousPeriodOrders.length > 0) {
        const previousDate = new Date(currentDate);
        previousDate.setDate(previousDate.getDate() - daysDiff);
        const prevDateStr = toISODate(previousDate);
        
        const prevDayOrders = previousPeriodOrders.filter(order => {
          const orderDate = toISODate(getDateFromTimestamp(order.createdAt));
          return orderDate === prevDateStr;
        });

        const prevPaidOrders = prevDayOrders.filter(o => 
          o.paymentStatus === "paid" || o.status === "paid" || o.paymentStatus === "completed"
        );
        previousSales = prevPaidOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      }

      // Format date for display
      const displayDate = currentDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });

      data.push({
        date: displayDate,
        fullDate: dateStr,
        grossSales,
        netSales,
        refunds,
        discounts,
        previousPeriod: previousSales,
        orderCount: paidOrders.length,
      });
    }

    return data;
  }, [orders, dateRange, previousPeriodOrders]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const totalGross = chartData.reduce((sum, d) => sum + d.grossSales, 0);
    const totalNet = chartData.reduce((sum, d) => sum + d.netSales, 0);
    const totalRefunds = chartData.reduce((sum, d) => sum + d.refunds, 0);
    const totalDiscounts = chartData.reduce((sum, d) => sum + d.discounts, 0);
    const totalPrevious = chartData.reduce((sum, d) => sum + d.previousPeriod, 0);
    const totalOrders = chartData.reduce((sum, d) => sum + d.orderCount, 0);
    
    const growth = totalPrevious > 0 
      ? ((totalNet - totalPrevious) / totalPrevious * 100).toFixed(1)
      : 0;

    return {
      totalGross,
      totalNet,
      totalRefunds,
      totalDiscounts,
      totalPrevious,
      totalOrders,
      growth,
      avgOrderValue: totalOrders > 0 ? totalNet / totalOrders : 0,
    };
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="font-semibold mb-4">📊 Total Sales Over Time</h3>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          No sales data available for the selected period
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg">📊 Total Sales Over Time</h3>
          <div className="text-sm text-muted-foreground">
            {chartData[0]?.fullDate} - {chartData[chartData.length - 1]?.fullDate}
          </div>
        </div>
        
        {/* Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 p-3 bg-muted/50 rounded-lg">
          <div>
            <div className="text-xs text-muted-foreground">Gross Sales</div>
            <div className="text-lg font-bold text-primary">
              {USD.format(summary.totalGross)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Net Sales</div>
            <div className="text-lg font-bold text-green-600">
              {USD.format(summary.totalNet)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Total Orders</div>
            <div className="text-lg font-bold">
              {summary.totalOrders}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">vs Previous Period</div>
            <div className={`text-lg font-bold ${summary.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.growth >= 0 ? '+' : ''}{summary.growth}%
            </div>
          </div>
        </div>
        
        {/* Additional metrics */}
        <div className="grid grid-cols-3 gap-3 mt-3 text-xs">
          <div className="p-2 bg-amber-50 dark:bg-amber-950 rounded border border-amber-200 dark:border-amber-800">
            <div className="text-muted-foreground">Refunds</div>
            <div className="font-semibold text-amber-700 dark:text-amber-400">
              {USD.format(summary.totalRefunds)}
            </div>
          </div>
          <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded border border-blue-200 dark:border-blue-800">
            <div className="text-muted-foreground">Discounts</div>
            <div className="font-semibold text-blue-700 dark:text-blue-400">
              {USD.format(summary.totalDiscounts)}
            </div>
          </div>
          <div className="p-2 bg-purple-50 dark:bg-purple-950 rounded border border-purple-200 dark:border-purple-800">
            <div className="text-muted-foreground">Avg Order Value</div>
            <div className="font-semibold text-purple-700 dark:text-purple-400">
              {USD.format(summary.avgOrderValue)}
            </div>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="date" 
            stroke="hsl(var(--muted-foreground))"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          {/* Gross Sales Line */}
          <Line 
            type="monotone" 
            dataKey="grossSales" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2.5}
            name="Gross Sales"
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          
          {/* Net Sales Line */}
          <Line 
            type="monotone" 
            dataKey="netSales" 
            stroke="hsl(142, 76%, 36%)" 
            strokeWidth={2.5}
            name="Net Sales"
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          
          {/* Previous Period Line (dashed) */}
          {summary.totalPrevious > 0 && (
            <Line 
              type="monotone" 
              dataKey="previousPeriod" 
              stroke="hsl(var(--muted-foreground))" 
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Previous Period"
              dot={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
      
      <div className="mt-4 p-3 bg-muted/30 rounded text-xs text-muted-foreground">
        <strong>Key Insights:</strong>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li><strong>Gross Sales:</strong> Total revenue from all paid orders</li>
          <li><strong>Net Sales:</strong> Revenue after deducting refunds (discounts already applied at checkout)</li>
          <li><strong>Previous Period:</strong> Comparison line showing sales from the equivalent prior period</li>
        </ul>
      </div>
    </div>
  );
}
