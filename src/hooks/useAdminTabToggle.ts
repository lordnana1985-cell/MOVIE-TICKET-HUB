import { useState, useEffect, useCallback } from 'react';

export function useAdminTabToggle() {
  const [showAdminTab, setShowAdminTab] = useState(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true') return true;
    return localStorage.getItem('mt_hub_show_admin_tab') === 'true';
  });

  const [logoClicks, setLogoClicks] = useState(0);

  useEffect(() => {
    const handleToggle = () => {
      const nextState = localStorage.getItem('mt_hub_show_admin_tab') === 'true';
      setShowAdminTab(nextState);
    };

    window.addEventListener('mt_hub_toggle_admin_tab', handleToggle);
    return () => {
      window.removeEventListener('mt_hub_toggle_admin_tab', handleToggle);
    };
  }, []);

  const handleLogoClick = useCallback(() => {
    setLogoClicks((prev) => {
      const newClicks = prev + 1;
      if (newClicks >= 5) {
        setShowAdminTab((curr) => {
          const nextState = !curr;
          localStorage.setItem('mt_hub_show_admin_tab', String(nextState));
          window.dispatchEvent(new Event('mt_hub_toggle_admin_tab'));
          return nextState;
        });
        return 0;
      }
      return newClicks;
    });
  }, []);

  const setAdminTabExplicitly = useCallback((visible: boolean) => {
    setShowAdminTab(visible);
    localStorage.setItem('mt_hub_show_admin_tab', String(visible));
    window.dispatchEvent(new Event('mt_hub_toggle_admin_tab'));
  }, []);

  return {
    showAdminTab,
    setShowAdminTab,
    logoClicks,
    handleLogoClick,
    setAdminTabExplicitly,
  };
}
