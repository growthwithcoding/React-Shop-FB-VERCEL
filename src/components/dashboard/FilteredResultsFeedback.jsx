import { AlertTriangle, X } from "lucide-react";
import { useDashboard } from "../../hooks/useDashboard";

/**
 * Component that displays a feedback message when filters are active and results are limited
 * @param {Object} props
 * @param {number} props.resultCount - Number of results found
 * @param {string} props.totalCount - Total number of items before filtering
 * @param {string} props.entityName - Name of the entity being filtered (e.g., "orders", "products")
 */
export function FilteredResultsFeedback({ resultCount, totalCount, entityName = "results" }) {
  const { filters, dateRange, searchQuery, clearAllFilters } = useDashboard();
  
  // Check if any filters are active
  const hasActiveFilters = 
    filters.channel !== "all" || 
    filters.region !== "all" || 
    filters.category !== "all" || 
    filters.fulfillmentStatus !== "all" ||
    searchQuery !== "" ||
    dateRange.label !== "Last 7 days"; // Default date range (note: lowercase 'd')
  
  // Only show feedback if filters are active AND results are limited
  if (!hasActiveFilters || resultCount === totalCount) {
    return null;
  }
  
  // Determine severity based on result count
  const getSeverity = () => {
    if (resultCount === 0) return "danger";
    if (resultCount < totalCount * 0.1) return "warning"; // Less than 10% of total
    return "info";
  };
  
  const severity = getSeverity();
  
  const getStyles = () => {
    switch (severity) {
      case "danger":
        return {
          background: "#fef2f2",
          border: "2px solid #fecaca",
          color: "#991b1b",
          icon: "#dc2626"
        };
      case "warning":
        return {
          background: "#fffbeb",
          border: "2px solid #fde68a",
          color: "#92400e",
          icon: "#f59e0b"
        };
      case "info":
      default:
        return {
          background: "#eff6ff",
          border: "2px solid #bfdbfe",
          color: "#1e40af",
          icon: "#3b82f6"
        };
    }
  };
  
  const styles = getStyles();
  
  // Build active filters list
  const activeFiltersList = [];
  if (dateRange.label && dateRange.label !== "Last 7 days") {
    activeFiltersList.push(`Date: ${dateRange.label || `${dateRange.from} to ${dateRange.to}`}`);
  }
  if (filters.channel !== "all") activeFiltersList.push(`Channel: ${filters.channel}`);
  if (filters.region !== "all") activeFiltersList.push(`Region: ${filters.region}`);
  if (filters.category !== "all") activeFiltersList.push(`Category: ${filters.category}`);
  if (filters.fulfillmentStatus !== "all") activeFiltersList.push(`Status: ${filters.fulfillmentStatus}`);
  if (searchQuery) activeFiltersList.push(`Search: "${searchQuery}"`);
  
  return (
    <div
      style={{
        padding: "16px 20px",
        borderRadius: "8px",
        background: styles.background,
        border: styles.border,
        marginBottom: "20px",
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
      }}
      role="alert"
    >
      <AlertTriangle 
        size={20} 
        style={{ 
          color: styles.icon, 
          flexShrink: 0, 
          marginTop: "2px" 
        }} 
      />
      <div style={{ flex: 1 }}>
        <div style={{ 
          fontWeight: 700, 
          fontSize: "14px", 
          color: styles.color, 
          marginBottom: "4px" 
        }}>
          {resultCount === 0 
            ? `No ${entityName} found` 
            : `Showing ${resultCount} of ${totalCount} ${entityName}`}
        </div>
        <div style={{ 
          fontSize: "13px", 
          color: styles.color, 
          lineHeight: 1.5 
        }}>
          {resultCount === 0 
            ? `Your current filters are hiding all ${entityName}. Try adjusting your search criteria.`
            : `Results are filtered. Adjust your search criteria to see more ${entityName}.`}
        </div>
        {activeFiltersList.length > 0 && (
          <div style={{ 
            marginTop: "8px", 
            fontSize: "12px", 
            color: styles.color 
          }}>
            <strong>Active filters:</strong> {activeFiltersList.join(", ")}
          </div>
        )}
      </div>
      <button
        onClick={clearAllFilters}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "4px",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          color: styles.color,
          fontSize: "12px",
          fontWeight: 600,
          flexShrink: 0,
        }}
        title="Clear all filters"
      >
        <X size={16} />
        Clear Filters
      </button>
    </div>
  );
}
