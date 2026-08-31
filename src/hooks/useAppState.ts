import { useState, useCallback, useEffect } from 'react';
import { UserProfile, MovieTicket, TicketPurchase } from '../types';
import { db } from '../lib/db';
import { logger } from '../lib/logger';

export function useAppState() {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const savedUser = localStorage.getItem('mt_hub_current_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        localStorage.removeItem('mt_hub_current_user');
        return null;
      }
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState<
    'marketplace' | 'producer_dashboard' | 'gate_auth' | 'admin_portal' | 'auth'
  >(() => {
    const savedUser = localStorage.getItem('mt_hub_current_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.role === 'producer') {
          return 'producer_dashboard';
        } else if (parsed.role === 'admin') {
          return 'admin_portal';
        }
        return 'marketplace';
      } catch {
        return 'auth';
      }
    }
    return 'auth';
  });

  const [authModalRole, setAuthModalRole] = useState<'producer' | 'buyer' | 'admin'>('buyer');

  // Shared Live States
  const [tickets, setTickets] = useState<MovieTicket[]>([]);
  const [purchases, setPurchases] = useState<TicketPurchase[]>([]);
  const [alertMessage, setAlertMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const triggerAlert = useCallback((type: 'success' | 'error', text: string) => {
    setAlertMessage({ type, text });
    setTimeout(() => setAlertMessage(null), 4000);
  }, []);

  const reloadData = useCallback(async () => {
    try {
      const allTickets = await db.getTickets();
      setTickets(allTickets);

      if (user) {
        if (user.role === 'producer') {
          const prodPurchases = await db.getPurchasesForProducer(user.id);
          setPurchases(prodPurchases);
        } else if (user.role === 'buyer') {
          const myPurchases = await db.getPurchasesForBuyer(user.id);
          setPurchases(myPurchases);
        }
      }
    } catch (e: unknown) {
      logger.error('Failed to load tickets and purchases', 'useAppState', e);
    }
  }, [user]);

  useEffect(() => {
    reloadData();
  }, [reloadData]);

  useEffect(() => {
    const handleStorageChange = () => {
      const savedUser = localStorage.getItem('mt_hub_current_user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);
        } catch {
          // ignore corrupted json in storage
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    if (user) {
      if (user.role === 'buyer') {
        if (
          activeTab === 'producer_dashboard' ||
          activeTab === 'gate_auth' ||
          activeTab === 'admin_portal'
        ) {
          setActiveTab('marketplace');
        }
      } else if (user.role === 'producer') {
        if (activeTab === 'admin_portal') {
          setActiveTab('producer_dashboard');
        }
      }
    } else {
      if (activeTab !== 'auth') {
        setActiveTab('auth');
      }
    }
  }, [user, activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('mt_hub_current_user');
    setUser(null);
    setActiveTab('auth');
    triggerAlert('success', 'Logged out successfully! Come back soon.');
  };

  const handleAuthSuccess = (profile: UserProfile) => {
    setUser(profile);
    localStorage.setItem('mt_hub_current_user', JSON.stringify(profile));

    if (profile.role === 'producer') {
      setActiveTab('producer_dashboard');
    } else if (profile.role === 'admin') {
      setActiveTab('admin_portal');
    } else {
      setActiveTab('marketplace');
    }
    reloadData();
    triggerAlert('success', `Welcome back, ${profile.name}!`);
  };

  const handleNavigationChange = (
    tab: 'marketplace' | 'producer_dashboard' | 'gate_auth' | 'admin_portal' | 'auth'
  ) => {
    if (!user) {
      setActiveTab('auth');
      triggerAlert(
        'error',
        'Authentication required: Please sign in or register first to explore the market.'
      );
      return;
    }

    if (user.role === 'buyer') {
      if (tab !== 'marketplace' && tab !== 'auth') {
        triggerAlert('error', 'Access Blocked: Buyers are strictly limited to the Marketplace.');
        setActiveTab('marketplace');
        return;
      }
    }

    if (user.role === 'producer') {
      if (tab === 'admin_portal') {
        triggerAlert('error', 'Access Blocked: Producers cannot access the Admin Portal.');
        setActiveTab('producer_dashboard');
        return;
      }
    }

    if (user.role === 'admin') {
      if (tab === 'producer_dashboard' || tab === 'gate_auth') {
        triggerAlert(
          'error',
          'Notice: Admin accounts should manage events from the Admin Console.'
        );
      }
    }

    setActiveTab(tab);
  };

  return {
    user,
    setUser,
    activeTab,
    setActiveTab,
    authModalRole,
    setAuthModalRole,
    tickets,
    purchases,
    alertMessage,
    triggerAlert,
    reloadData,
    handleLogout,
    handleAuthSuccess,
    handleNavigationChange,
  };
}
