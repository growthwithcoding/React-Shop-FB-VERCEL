import { createContext, useState, useCallback, useEffect } from "react";
import { getDatePresets } from "../lib/utils";

const DashboardContext = createContext(null);

export { DashboardContext };

export function DashboardProvider({ children }) {
  // Date range filters
  const [dateRange, setDateRange] = useState(() => {
    const presets = getDatePresets();
    return presets.thisMonth;
  });
  
  const [compareMode, setCompareMode] = useState(false);
  const [timezone, setTimezone] = useState("America/Denver");
  
  // Global filters
  const [filters, setFilters] = useState({
    channel: "all", // Web, Amazon, eBay, all
    region: "all",
    category: "all",
    fulfillmentStatus: "all",
    quarter: "all", // Q1, Q2, Q3, Q4, all
    year: "all", // 2023, 2024, 2025, all
  });
  
  // Active filter chips (from clicking charts/KPIs)
  const [activeFilters, setActiveFilters] = useState([]);
  
  // Search query
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dark mode
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("darkMode") === "true";
    }
    return false;
  });
  
  // Saved views
  const [savedViews, setSavedViews] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dashboardViews");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  
  const [currentView, setCurrentView] = useState(null);
  
  // Apply dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);
  
  // Toggle dark mode
  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev);
  }, []);
  
  // Update filter
  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);
  
  // Add active filter chip (from chart interaction)
  const addFilterChip = useCallback((filter) => {
    setActiveFilters(prev => {
      // Don't add duplicate
      const exists = prev.find(f => f.type === filter.type && f.value === filter.value);
      if (exists) return prev;
      return [...prev, filter];
    });
  }, []);
  
  // Remove active filter chip
  const removeFilterChip = useCallback((filter) => {
    setActiveFilters(prev => prev.filter(f => !(f.type === filter.type && f.value === filter.value)));
  }, []);
  
  // Clear all filters
  const clearAllFilters = useCallback(() => {
    const presets = getDatePresets();
    setDateRange(presets.thisMonth); // Reset to "This month"
    setFilters({
      channel: "all",
      region: "all",
      category: "all",
      fulfillmentStatus: "all",
      quarter: "all",
      year: "all",
    });
    setActiveFilters([]);
    setSearchQuery("");
  }, []);
  
  // Save current view
  const saveView = useCallback((name, isDefault = false) => {
    const view = {
      id: Date.now().toString(),
      name,
      dateRange,
      filters,
      activeFilters,
      searchQuery,
      isDefault,
      createdAt: new Date().toISOString(),
    };
    
    setSavedViews(prev => {
      const updated = isDefault 
        ? prev.map(v => ({ ...v, isDefault: false })).concat(view)
        : [...prev, view];
      
      localStorage.setItem("dashboardViews", JSON.stringify(updated));
      return updated;
    });
    
    setCurrentView(view);
  }, [dateRange, filters, activeFilters, searchQuery]);
  
  // Load saved view
  const loadView = useCallback((view) => {
    setDateRange(view.dateRange);
    setFilters(view.filters);
    setActiveFilters(view.activeFilters);
    setSearchQuery(view.searchQuery);
    setCurrentView(view);
  }, []);
  
  // Delete saved view
  const deleteView = useCallback((viewId) => {
    setSavedViews(prev => {
      const updated = prev.filter(v => v.id !== viewId);
      localStorage.setItem("dashboardViews", JSON.stringify(updated));
      return updated;
    });
    
    if (currentView?.id === viewId) {
      setCurrentView(null);
    }
  }, [currentView]);
  
  // Apply date preset
  const applyDatePreset = useCallback((presetKey) => {
    const presets = getDatePresets();
    if (presets[presetKey]) {
      setDateRange(presets[presetKey]);
    }
  }, []);
  
  const value = {
    // Date range
    dateRange,
    setDateRange,
    compareMode,
    setCompareMode,
    timezone,
    setTimezone,
    applyDatePreset,
    
    // Filters
    filters,
    updateFilter,
    activeFilters,
    addFilterChip,
    removeFilterChip,
    clearAllFilters,
    
    // Search
    searchQuery,
    setSearchQuery,
    
    // Dark mode
    darkMode,
    toggleDarkMode,
    
    // Saved views
    savedViews,
    currentView,
    saveView,
    loadView,
    deleteView,
  };
  
  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}
