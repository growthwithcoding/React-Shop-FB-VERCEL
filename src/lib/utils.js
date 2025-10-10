import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with proper precedence
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency
 */
export const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

/**
 * Format number with abbreviation (1.2K, 3.4M, etc.)
 */
export function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

/**
 * Format percentage
 */
export function formatPercent(value, decimals = 1) {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Calculate percentage change
 */
export function calculateChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Get date from various Firestore timestamp formats
 */
export function getDateFromTimestamp(timestamp) {
  if (!timestamp) return new Date();
  if (timestamp.toDate) return timestamp.toDate();
  if (timestamp.seconds) return new Date(timestamp.seconds * 1000);
  if (typeof timestamp === "string") return new Date(timestamp);
  return new Date(timestamp);
}

/**
 * Format date to ISO string (YYYY-MM-DD)
 */
export function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

/**
 * Get date range presets
 */
export function getDatePresets() {
  const now = new Date();
  const today = toISODate(now);
  
  return {
    today: {
      label: "Today",
      from: today,
      to: today,
    },
    yesterday: {
      label: "Yesterday",
      from: toISODate(new Date(now.getTime() - 86400000)),
      to: toISODate(new Date(now.getTime() - 86400000)),
    },
    last7days: {
      label: "Last 7 days",
      from: toISODate(new Date(now.getTime() - 6 * 86400000)),
      to: today,
    },
    last30days: {
      label: "Last 30 days",
      from: toISODate(new Date(now.getTime() - 29 * 86400000)),
      to: today,
    },
    thisMonth: {
      label: "This month",
      from: toISODate(new Date(now.getFullYear(), now.getMonth(), 1)),
      to: today,
    },
    lastMonth: {
      label: "Last month",
      from: toISODate(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
      to: toISODate(new Date(now.getFullYear(), now.getMonth(), 0)),
    },
  };
}

/**
 * Debounce function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Generate sparkline data points from orders
 */
export function generateSparklineData(orders, days = 7) {
  const now = new Date();
  const data = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 86400000);
    const dateStr = toISODate(date);
    
    const dayOrders = orders.filter(o => {
      const orderDate = toISODate(getDateFromTimestamp(o.createdAt));
      return orderDate === dateStr && (o.paymentStatus === "paid" || o.status === "paid");
    });
    
    const total = dayOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    
    data.push({
      date: dateStr,
      value: total,
    });
  }
  
  return data;
}

/**
 * Safe get nested object property
 */
export function get(obj, path, defaultValue = undefined) {
  const travel = regexp =>
    String.prototype.split
      .call(path, regexp)
      .filter(Boolean)
      .reduce((res, key) => (res !== null && res !== undefined ? res[key] : res), obj);
  const result = travel(/[,[\]]+?/) || travel(/[,[\].]+?/);
  return result === undefined || result === obj ? defaultValue : result;
}
