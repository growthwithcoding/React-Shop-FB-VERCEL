import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, User, AlertCircle, ExternalLink } from "lucide-react";
import { cn, getDateFromTimestamp } from "../../lib/utils";

const STATUS_COLUMNS = [
  { id: "open", title: "Open", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", dotColor: "bg-blue-500" },
  { id: "in_progress", title: "In Progress", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", dotColor: "bg-amber-500" },
  { id: "resolved", title: "Resolved", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", dotColor: "bg-green-500" },
  { id: "closed", title: "Closed", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", dotColor: "bg-purple-500" },
];

const PRIORITY_ICONS = {
  low: { emoji: "🔵", label: "Low" },
  normal: { emoji: "⚪", label: "Normal" },
  high: { emoji: "🟡", label: "High" },
  urgent: { emoji: "🔴", label: "Urgent" },
};

export function TicketsKanban({ tickets = [], onStatusChange }) {
  const navigate = useNavigate();
  const [draggedTicket, setDraggedTicket] = useState(null);
  
  const getTicketsByStatus = (status) => {
    return tickets.filter(t => (t.status || "open") === status);
  };
  
  const handleDragStart = (e, ticket) => {
    setDraggedTicket(ticket);
    e.dataTransfer.effectAllowed = "move";
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  
  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    if (draggedTicket && draggedTicket.status !== newStatus) {
      onStatusChange && onStatusChange(draggedTicket.id, newStatus);
    }
    setDraggedTicket(null);
  };
  
  const getSLABadge = (ticket) => {
    const createdAt = getDateFromTimestamp(ticket.createdAt);
    const now = new Date();
    const hoursSinceCreated = (now - createdAt) / (1000 * 60 * 60);
    
    // SLA thresholds based on priority
    const slaHours = {
      urgent: 4,
      high: 8,
      normal: 24,
      low: 48,
    };
    
    const threshold = slaHours[ticket.priority] || 24;
    const isAtRisk = hoursSinceCreated > threshold * 0.8;
    const isBreached = hoursSinceCreated > threshold;
    
    if (ticket.status === "resolved") return null;
    
    if (isBreached) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          <AlertCircle className="h-3 w-3" />
          SLA Breached
        </span>
      );
    }
    
    if (isAtRisk) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
          <Clock className="h-3 w-3" />
          At Risk
        </span>
      );
    }
    
    return null;
  };
  
  if (tickets.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-semibold text-lg mb-2">No tickets found</h3>
        <p className="text-muted-foreground">
          All support tickets will appear here
        </p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {STATUS_COLUMNS.map((column) => {
        const columnTickets = getTicketsByStatus(column.id);
        
        return (
          <div
            key={column.id}
            className="bg-muted/30 rounded-lg p-3"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">{column.title}</h3>
              <span className={cn(
                "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium",
                column.color
              )}>
                {columnTickets.length}
              </span>
            </div>
            
            <div className="space-y-2">
              {columnTickets.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No {column.title.toLowerCase()} tickets
                </div>
              ) : (
                columnTickets.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    onDoubleClick={() => navigate(`/tickets/${ticket.id}`)}
                    onDragStart={handleDragStart}
                    slaBadge={getSLABadge(ticket)}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TicketCard({ ticket, onDoubleClick, onDragStart, slaBadge }) {
  const status = ticket.status || "open";
  const statusColumn = STATUS_COLUMNS.find(col => col.id === status) || STATUS_COLUMNS[0];
  const isUnread = ticket.isRead === false;
  
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, ticket)}
      onDoubleClick={onDoubleClick}
      className={cn(
        "bg-card border border-border rounded-lg p-3 cursor-move hover:shadow-md transition-all group relative",
        "focus-ring",
        isUnread && "bg-blue-50 dark:bg-blue-950/20"
      )}
      title="Double-click to open ticket"
    >
      {/* Open Icon - appears on hover */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <ExternalLink className="h-4 w-4 text-primary" />
      </div>
      <div className="flex items-start gap-2 mb-2">
        <span 
          className={cn("w-3 h-3 rounded-full flex-shrink-0 mt-0.5", statusColumn.dotColor)} 
          title={`Status: ${statusColumn.title}`}
        />
        {isUnread && (
          <span 
            className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1 animate-pulse"
            title="Unread"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h4 className={cn("text-sm line-clamp-2", isUnread ? "font-bold" : "font-semibold")}>
              {ticket.subject}
            </h4>
            {ticket.readBy && ticket.readBy.some(userId => userId !== ticket.userId) && (
              <span 
                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                title="Reviewed by support staff"
              >
                ✓
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
        <User className="h-3 w-3" />
        <span className="truncate">{ticket.userName}</span>
      </div>
      
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
        <Clock className="h-3 w-3" />
        <span>
          {getDateFromTimestamp(ticket.createdAt).toLocaleDateString()} at{" "}
          {getDateFromTimestamp(ticket.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      
      <div className="flex flex-wrap gap-1">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
          {ticket.category}
        </span>
        
        {ticket.sentiment && (
          <span className={cn(
            "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
            ticket.sentiment === "positive" && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
            ticket.sentiment === "neutral" && "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
            ticket.sentiment === "negative" && "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
          )}>
            {ticket.sentiment}
          </span>
        )}
        
        {slaBadge}
      </div>
    </div>
  );
}
