import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { cn, USD, formatPercent, calculateChange } from "../../lib/utils";
import { useDashboard } from "../../hooks/useDashboard";

export function KpiCard({ 
  title, 
  value, 
  previousValue,
  format = "currency",
  sparklineData = [],
  subtitle,
  onClick,
  icon: Icon,
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
      // Add filter chip when clicking KPI
      addFilterChip({
        type: "kpi",
        value: title.toLowerCase().replace(/\s+/g, "_"),
        label: title,
      });
    }
  };
  
  return (
    <button
      onClick={handleClick}
      className={cn(
        "bg-card border border-border rounded-lg p-4 text-left w-full",
        "hover:shadow-md transition-shadow focus-ring",
        "touch-target"
      )}
      aria-label={`${title}: ${formatValue(value)}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          </div>
          <div className="text-2xl font-bold tracking-tight">
            {formatValue(value)}
          </div>
        </div>
        
        {change !== null && (
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium",
            isPositive && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
            isNegative && "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
            isNeutral && "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
          )}>
            {isPositive && <TrendingUp className="h-3 w-3" />}
            {isNegative && <TrendingDown className="h-3 w-3" />}
            {isNeutral && <Minus className="h-3 w-3" />}
            <span>{Math.abs(change).toFixed(1)}%</span>
          </div>
        )}
      </div>
      
      {subtitle && (
        <p className="text-xs text-muted-foreground mb-2">{subtitle}</p>
      )}
      
      {sparklineData.length > 0 && (
        <div className="h-12 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklineData}>
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      
      {previousValue !== undefined && (
        <div className="mt-2 pt-2 border-t border-border">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Previous</span>
            <span className="font-medium">{formatValue(previousValue)}</span>
          </div>
        </div>
      )}
    </button>
  );
}
