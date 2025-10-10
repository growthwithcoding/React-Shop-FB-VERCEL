import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // Don't scroll if this is just a hash change (internal link on same page)
    // Hash changes are for anchor links like #section or tab navigation
    if (hash) {
      return;
    }

    // Scroll to absolute top of the page
    // The navbar spacing is already handled by App.jsx with paddingTop on main element
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });
  }, [pathname, hash]);

  return null;
}
