import { AlertCircle, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";

export function AttentionCard({ 
  title, 
  count, 
  trend,
  trendDirection = "neutral",
  description,
  ctaText,
  ctaAction,
  severity = "info", // info, warning, danger
  icon: Icon,
}) {
  const severityStyles = {
    info: "border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900",
    warning: "border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900",
    danger: "border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900",
  };
  
  const countStyles = {
    info: "text-blue-900 dark:text-blue-100",
    warning: "text-amber-900 dark:text-amber-100",
    danger: "text-red-900 dark:text-red-100",
  };
  
  const trendStyles = {
    up: "text-red-600 dark:text-red-400",
    down: "text-green-600 dark:text-green-400",
    neutral: "text-gray-600 dark:text-gray-400",
  };
  
  return (
    <div className={cn(
      "border-2 rounded-lg p-4",
      severityStyles[severity]
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {Icon ? (
            <Icon className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>
        
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium",
            trendStyles[trendDirection]
          )}>
            {trendDirection === "up" && <TrendingUp className="h-3 w-3" />}
            {trendDirection === "down" && <TrendingDown className="h-3 w-3" />}
            <span>{trend}</span>
          </div>
        )}
      </div>
      
      <div className={cn(
        "text-3xl font-bold mb-2",
        countStyles[severity]
      )}>
        {count}
      </div>
      
      {description && (
        <p className="text-sm text-muted-foreground mb-3">{description}</p>
      )}
      
      {ctaText && (
        <button
          onClick={ctaAction}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md",
            "bg-background border border-border hover:bg-accent",
            "text-sm font-medium transition-colors focus-ring touch-target"
          )}
        >
          <span>{ctaText}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function InsightCard({ insights = [] }) {
  if (insights.length === 0) {
    return (
      <div className="border border-border rounded-lg p-4 bg-card">
        <h3 className="font-semibold text-sm mb-3">Insights</h3>
        <p className="text-sm text-muted-foreground">
          No anomalies detected. Everything looks normal.
        </p>
      </div>
    );
  }
  
  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <h3 className="font-semibold text-sm mb-3">Insights & Anomalies</h3>
      <div className="space-y-3">
        {insights.map((insight, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <div className={cn(
              "p-1.5 rounded-full flex-shrink-0",
              insight.type === "warning" && "bg-amber-100 text-amber-600 dark:bg-amber-900/30",
              insight.type === "info" && "bg-blue-100 text-blue-600 dark:bg-blue-900/30",
              insight.type === "success" && "bg-green-100 text-green-600 dark:bg-green-900/30"
            )}>
              <AlertCircle className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{insight.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {insight.description}
              </p>
              {insight.link && (
                <button
                  onClick={insight.link.action}
                  className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1"
                >
                  {insight.link.text}
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
