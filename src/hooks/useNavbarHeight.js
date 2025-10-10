import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to calculate the total height of stacked navigation bars
 * Main navbar + admin/agent panel (if present)
 */
export function useNavbarHeight() {
  // Start with the known store nav height (67px) instead of 0 to prevent initial jump
  const [navbarHeight, setNavbarHeight] = useState(67);
  const previousHeightRef = useRef(67);

  useEffect(() => {
    function calculateNavbarHeight() {
      // Find all fixed/sticky elements at the top and sum their heights
      let totalHeight = 0;
      const navbars = [];
      
      // Look for all fixed or sticky elements
      const allElements = document.querySelectorAll('*');
      
      allElements.forEach(el => {
        // Skip the breadcrumb nav itself
        if (el.hasAttribute('data-breadcrumb-nav')) {
          return;
        }
        
        const styles = window.getComputedStyle(el);
        const position = styles.position;
        
        if (position === 'fixed' || position === 'sticky') {
          const rect = el.getBoundingClientRect();
          const top = rect.top;
          const bottom = rect.bottom;
          
          // Only consider elements at or near the top with reasonable height
          if (top >= 0 && top < 150 && rect.height > 30 && rect.height < 150) {
            navbars.push({ top, bottom, height: rect.height, element: el });
          }
        }
      });
      
      // Sort by top position
      navbars.sort((a, b) => a.top - b.top);
      
      // Calculate total by finding the bottom of the last navbar
      if (navbars.length > 0) {
        // Use the bottommost navbar's bottom edge
        totalHeight = Math.max(...navbars.map(n => n.bottom));
      }
      
      // Fallback if nothing found - use the known store nav height
      if (totalHeight === 0) {
        totalHeight = 67;
      }
      
      // Only update if the height actually changed
      if (totalHeight !== previousHeightRef.current) {
        console.log('Total navbar height:', totalHeight, 'from', navbars.length, 'navbar(s)');
        previousHeightRef.current = totalHeight;
        setNavbarHeight(totalHeight);
      }
    }

    // Initial calculation
    calculateNavbarHeight();

    // Recalculate on window resize
    window.addEventListener('resize', calculateNavbarHeight);

    // Multiple delayed calculations to catch dynamically loaded navbars
    const timeout1 = setTimeout(calculateNavbarHeight, 100);
    const timeout2 = setTimeout(calculateNavbarHeight, 300);
    const timeout3 = setTimeout(calculateNavbarHeight, 500);
    const timeout4 = setTimeout(calculateNavbarHeight, 1000);
    
    // Use MutationObserver to detect DOM changes
    const observer = new MutationObserver(() => {
      calculateNavbarHeight();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    return () => {
      window.removeEventListener('resize', calculateNavbarHeight);
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
      clearTimeout(timeout4);
      observer.disconnect();
    };
  }, []); // Empty dependency array - only run once on mount

  return navbarHeight;
}
