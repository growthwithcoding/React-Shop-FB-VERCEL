import { useState } from "react";
import { Calendar, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useDashboard } from "../../hooks/useDashboard";
import { getDatePresets } from "../../lib/utils";
import { getCategories, categoryLabel } from "../../services/productService";

export function GlobalFiltersBar() {
  const {
    dateRange,
    setDateRange,
    compareMode,
    setCompareMode,
    filters,
    updateFilter,
  } = useDashboard();
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const presets = getDatePresets();
  
  // Fetch actual product categories
  const { data: categories = [] } = useQuery({
    queryKey: ["product-categories"],
    queryFn: getCategories,
  });
  
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap', justifyContent: 'space-between', width: '100%' }}>
        {/* Filters Group */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap' }}>
          {/* Date Range Picker */}
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
              aria-label="Select date range"
            >
              <Calendar className="h-3 w-3" />
              <span>{dateRange.label || `${dateRange.from} to ${dateRange.to}`}</span>
            </button>
            
            {showDatePicker && (
              <div 
                className="absolute top-full mt-2 left-0 bg-popover border border-border rounded-lg shadow-lg z-50"
                style={{
                  width: '320px',
                  maxHeight: '500px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border)'
                }}>
                  <h3 style={{ fontWeight: 600, fontSize: '14px' }}>Date Range</h3>
                  <button
                    onClick={() => setShowDatePicker(false)}
                    style={{
                      padding: '4px',
                      borderRadius: '4px',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    aria-label="Close date picker"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border)'
                }}>
                  {Object.entries(presets).map(([key, preset]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setDateRange(preset);
                        setShowDatePicker(false);
                      }}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        background: dateRange.label === preset.label ? 'var(--primary)' : 'transparent',
                        color: dateRange.label === preset.label ? '#fff' : 'inherit',
                        fontSize: '13px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        fontWeight: dateRange.label === preset.label ? 600 : 400,
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (dateRange.label !== preset.label) {
                          e.currentTarget.style.background = 'var(--accent)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (dateRange.label !== preset.label) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                
                <div style={{ padding: '12px 16px' }}>
                  <label style={{ display: 'block', marginBottom: '12px' }}>
                    <span style={{ 
                      display: 'block', 
                      fontSize: '12px', 
                      fontWeight: 500,
                      marginBottom: '4px',
                      color: 'var(--muted-foreground)' 
                    }}>
                      From
                    </span>
                    <input
                      type="date"
                      value={dateRange.from}
                      onChange={(e) => setDateRange({ ...dateRange, from: e.target.value, label: 'Custom' })}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid var(--input)',
                        borderRadius: '4px',
                        fontSize: '13px'
                      }}
                    />
                  </label>
                  <label style={{ display: 'block', marginBottom: '12px' }}>
                    <span style={{ 
                      display: 'block', 
                      fontSize: '12px', 
                      fontWeight: 500,
                      marginBottom: '4px',
                      color: 'var(--muted-foreground)' 
                    }}>
                      To
                    </span>
                    <input
                      type="date"
                      value={dateRange.to}
                      onChange={(e) => setDateRange({ ...dateRange, to: e.target.value, label: 'Custom' })}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid var(--input)',
                        borderRadius: '4px',
                        fontSize: '13px'
                      }}
                    />
                  </label>
                  
                  {/* Quarter and Year Filters */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px' }}>
                    <label style={{ display: 'block' }}>
                      <span style={{ 
                        display: 'block', 
                        fontSize: '12px', 
                        fontWeight: 500,
                        marginBottom: '4px',
                        color: 'var(--muted-foreground)' 
                      }}>
                        Quarter
                      </span>
                      <select
                        value={filters.quarter}
                        onChange={(e) => updateFilter("quarter", e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          border: '1px solid var(--input)',
                          borderRadius: '4px',
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="all">All Quarters</option>
                        <option value="Q1">Q1 (Jan-Mar)</option>
                        <option value="Q2">Q2 (Apr-Jun)</option>
                        <option value="Q3">Q3 (Jul-Sep)</option>
                        <option value="Q4">Q4 (Oct-Dec)</option>
                      </select>
                    </label>
                    
                    <label style={{ display: 'block' }}>
                      <span style={{ 
                        display: 'block', 
                        fontSize: '12px', 
                        fontWeight: 500,
                        marginBottom: '4px',
                        color: 'var(--muted-foreground)' 
                      }}>
                        Year
                      </span>
                      <select
                        value={filters.year}
                        onChange={(e) => updateFilter("year", e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          border: '1px solid var(--input)',
                          borderRadius: '4px',
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="all">All Years</option>
                        <option value="2023">2023</option>
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                      </select>
                    </label>
                  </div>
                  
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    fontSize: '13px',
                    marginTop: '12px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={compareMode}
                      onChange={(e) => setCompareMode(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>Compare to previous period</span>
                  </label>
                </div>
              </div>
            )}
          </div>
          
          {/* Inline Filters - Compact with clear button when active */}
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <select
              value={filters.channel}
              onChange={(e) => updateFilter("channel", e.target.value)}
              style={{
                padding: '4px 24px 4px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              <option value="all" style={{ color: '#000', background: '#fff' }}>All Channels</option>
              <option value="web" style={{ color: '#000', background: '#fff' }}>Web</option>
              <option value="amazon" style={{ color: '#000', background: '#fff' }}>Amazon</option>
              <option value="ebay" style={{ color: '#000', background: '#fff' }}>eBay</option>
            </select>
            {filters.channel !== "all" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateFilter("channel", "all");
                }}
                style={{
                  position: 'absolute',
                  right: '6px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.9)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: '#333',
                  padding: 0,
                }}
                title="Clear channel filter"
              >
                ×
              </button>
            )}
          </div>
          
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <select
              value={filters.region}
              onChange={(e) => updateFilter("region", e.target.value)}
              style={{
                padding: '4px 24px 4px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              <option value="all" style={{ color: '#000', background: '#fff' }}>All Regions</option>
              <option value="us" style={{ color: '#000', background: '#fff' }}>United States</option>
              <option value="eu" style={{ color: '#000', background: '#fff' }}>Europe</option>
              <option value="asia" style={{ color: '#000', background: '#fff' }}>Asia</option>
            </select>
            {filters.region !== "all" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateFilter("region", "all");
                }}
                style={{
                  position: 'absolute',
                  right: '6px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.9)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: '#333',
                  padding: 0,
                }}
                title="Clear region filter"
              >
                ×
              </button>
            )}
          </div>
          
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <select
              value={filters.category}
              onChange={(e) => updateFilter("category", e.target.value)}
              style={{
                padding: '4px 24px 4px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              <option value="all" style={{ color: '#000', background: '#fff' }}>All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat} style={{ color: '#000', background: '#fff' }}>
                  {categoryLabel(cat)}
                </option>
              ))}
            </select>
            {filters.category !== "all" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateFilter("category", "all");
                }}
                style={{
                  position: 'absolute',
                  right: '6px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.9)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: '#333',
                  padding: 0,
                }}
                title="Clear category filter"
              >
                ×
              </button>
            )}
          </div>
          
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <select
              value={filters.fulfillmentStatus}
              onChange={(e) => updateFilter("fulfillmentStatus", e.target.value)}
              style={{
                padding: '4px 24px 4px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              <option value="all" style={{ color: '#000', background: '#fff' }}>All Status</option>
              <option value="fulfilled" style={{ color: '#000', background: '#fff' }}>Fulfilled</option>
              <option value="unfulfilled" style={{ color: '#000', background: '#fff' }}>Unfulfilled</option>
              <option value="partial" style={{ color: '#000', background: '#fff' }}>Partial</option>
            </select>
            {filters.fulfillmentStatus !== "all" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateFilter("fulfillmentStatus", "all");
                }}
                style={{
                  position: 'absolute',
                  right: '6px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.9)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: '#333',
                  padding: 0,
                }}
                title="Clear status filter"
              >
                ×
              </button>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
