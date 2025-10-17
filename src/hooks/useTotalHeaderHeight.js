import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../auth/useAuth';

/**
 * Comprehensive hook to calculate all stacked header heights
 * Returns individual heights and totals for flexible layout calculations
 */
export function useTotalHeaderHeight() {
  const { user } = useAuth();
  
  // Known constants
  const STORE_NAV_HEIGHT = 67;
  const ADMIN_PANEL_HEIGHT = 98;
  const AGENT_PANEL_HEIGHT = 98;
  
  // State for measured heights
  const [measuredHeights, setMeasuredHeights] = useState({
    storeNav: STORE_NAV_HEIGHT,
    adminPanel: 0,
    agentPanel: 0,
    breadcrumb: 40,
    totalNavbar: STORE_NAV_HEIGHT,
  });
  
  const previousHeightsRef = useRef(measuredHeights);

  useEffect(() => {
    function measureHeaders() {
      let storeNavHeight = STORE_NAV_HEIGHT;
      let adminPanelHeight = 0;
      let agentPanelHeight = 0;
      let breadcrumbHeight = 40;
      
      // Measure store nav
      const storeNav = document.querySelector('.site-nav');
      if (storeNav) {
        const rect = storeNav.getBoundingClientRect();
        storeNavHeight = rect.height;
      }
      
      // Measure breadcrumb nav
      const breadcrumbNav = document.querySelector('[data-breadcrumb-nav]');
      if (breadcrumbNav) {
        const rect = breadcrumbNav.getBoundingClientRect();
        breadcrumbHeight = rect.height;
      }
      
      // Measure admin/agent panel based on user role
      if (user?.role === 'admin') {
        // Find admin panel (the div right after store nav)
        const allFixedElements = document.querySelectorAll('div[style*="position: fixed"]');
        for (const el of allFixedElements) {
          const style = el.getAttribute('style');
          if (style && style.includes('top: 67px') && style.includes('linear-gradient(135deg, #232F3E')) {
            const rect = el.getBoundingClientRect();
            adminPanelHeight = rect.height;
            break;
          }
        }
        // Fallback to known height if not measured
        if (adminPanelHeight === 0) {
          adminPanelHeight = ADMIN_PANEL_HEIGHT;
        }
      } else if (user?.role === 'agent') {
        // Find agent panel
        const allFixedElements = document.querySelectorAll('div[style*="position: fixed"]');
        for (const el of allFixedElements) {
          const style = el.getAttribute('style');
          if (style && style.includes('top: 67px') && style.includes('linear-gradient(135deg, #1e3a8a')) {
            const rect = el.getBoundingClientRect();
            agentPanelHeight = rect.height;
            break;
          }
        }
        // Fallback to known height if not measured
        if (agentPanelHeight === 0) {
          agentPanelHeight = AGENT_PANEL_HEIGHT;
        }
      }
      
      const totalNavbar = storeNavHeight + adminPanelHeight + agentPanelHeight;
      
      const newHeights = {
        storeNav: storeNavHeight,
        adminPanel: adminPanelHeight,
        agentPanel: agentPanelHeight,
        breadcrumb: breadcrumbHeight,
        totalNavbar,
      };
      
      // Only update if changed
      if (JSON.stringify(newHeights) !== JSON.stringify(previousHeightsRef.current)) {
        console.log('Header heights updated:', newHeights);
        previousHeightsRef.current = newHeights;
        setMeasuredHeights(newHeights);
      }
    }

    // Initial measurement
    measureHeaders();

    // Measure on resize
    window.addEventListener('resize', measureHeaders);

    // Multiple delayed measurements to catch dynamic content
    const timeout1 = setTimeout(measureHeaders, 100);
    const timeout2 = setTimeout(measureHeaders, 300);
    const timeout3 = setTimeout(measureHeaders, 500);
    
    // Watch for DOM changes
    const observer = new MutationObserver(() => {
      measureHeaders();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    return () => {
      window.removeEventListener('resize', measureHeaders);
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
      observer.disconnect();
    };
  }, [user?.role]);

  return {
    // Individual heights
    storeNavHeight: measuredHeights.storeNav,
    adminPanelHeight: measuredHeights.adminPanel,
    agentPanelHeight: measuredHeights.agentPanel,
    
    // Combined heights
    totalNavbarHeight: measuredHeights.totalNavbar,
    breadcrumbNavHeight: measuredHeights.breadcrumb,
    totalHeaderHeight: measuredHeights.totalNavbar + measuredHeights.breadcrumb,
  };
}
