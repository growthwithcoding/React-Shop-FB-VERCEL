import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn, USD, formatPercent, calculateChange } from "../../lib/utils";
import { useDashboard } from "../../hooks/useDashboard";
import "./StatsContainer.css";

/**
 * StatItem - Individual statistic display within the unified container
 * Amazon-inspired compact design with icon, value, and change indicator
 */
function StatItem({ 
  title, 
  value, 
  previousValue,
  format = "currency",
  icon: Icon,
  onClick,
  iconColor = "#146EB4"
}) {
  const { addFilterChip } = useDashboard();
  
  const change = previousValue !== undefined 
    ? calculateChange(parseFloat(value) || 0, parseFloat(previousValue) || 0)
    : null;
  
  const isPositive = change > 0;
  const isNegative = change < 0;
  const isNeutral = change === 0;
  
  const formatValue = (val) => {
    if (format === "currency") return USD.format(val);
    if (format === "percent") return formatPercent(val);
    if (format === "number") return val.toLocaleString();
    return val;
  };
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      addFilterChip({
        type: "kpi",
        value: title.toLowerCase().replace(/\s+/g, "_"),
        label: title,
      });
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };
  
  const changeText = change !== null 
    ? `${isPositive ? "+" : ""}${change.toFixed(1)}%`
    : "";
  
  return (
    <div 
      className="stat-item"
      role="button"
      tabIndex={0}
      aria-label={`${title}: ${formatValue(value)}${changeText ? `, ${changeText} change` : ""}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <div className="stat-header">
        {Icon && <Icon className="stat-icon" style={{ color: iconColor }} />}
        <span className="stat-label">{title}</span>
      </div>
      
      <div className="stat-body">
        <div className="stat-value">{formatValue(value)}</div>
        
        {change !== null && (
          <div className={cn(
            "stat-change",
            isPositive && "positive",
            isNegative && "negative",
            isNeutral && "neutral"
          )}>
            {isPositive && <TrendingUp size={14} />}
            {isNegative && <TrendingDown size={14} />}
            {isNeutral && <Minus size={14} />}
            <span>{Math.abs(change).toFixed(1)}%</span>
          </div>
        )}
      </div>
      
      {previousValue !== undefined && (
        <div className="stat-footer">
          <span>Previous: {formatValue(previousValue)}</span>
        </div>
      )}
    </div>
  );
}

/**
 * StatsContainer - Unified container for all dashboard statistics
 * Amazon-inspired design: single card with inline stats, minimal whitespace
 */
export function StatsContainer({ stats, title }) {
  return (
    <div className="stats-container-wrapper">
      {title && (
        <div className="stats-container-header">
          <h2 className="stats-container-title">{title}</h2>
          <div className="stats-container-divider"></div>
        </div>
      )}
      
      <div className="stats-container">
        {stats.map((stat, index) => (
          <StatItem
            key={stat.title || index}
            title={stat.title}
            value={stat.value}
            previousValue={stat.previousValue}
            format={stat.format}
            icon={stat.icon}
            onClick={stat.onClick}
            iconColor={stat.iconColor}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Example usage in AdminDashboard.jsx:
 * 
 * const statsData = [
 *   {
 *     title: "Revenue",
 *     value: kpis.revenue.current,
 *     previousValue: kpis.revenue.previous,
 *     format: "currency",
 *     icon: DollarSign,
 *     iconColor: "#146EB4"
 *   },
 *   {
 *     title: "Orders",
 *     value: kpis.orders.current,
 *     previousValue: kpis.orders.previous,
 *     format: "number",
 *     icon: ShoppingCart,
 *     iconColor: "#FF9900"
 *   },
 *   // ... more stats
 * ];
 * 
 * <StatsContainer stats={statsData} />
 */
