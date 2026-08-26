import { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';
import { UserProfile, MovieTicket, TicketPurchase } from './types';
import { db, getSupabaseStatus } from './lib/db';
import { logger } from './lib/logger';
import Header from './components/Header';
import AuthPage from './components/AuthPage';
import Marketplace from './components/Marketplace';
import ProducerDashboard from './components/ProducerDashboard';
import GateScanner from './components/GateScanner';
import CustomerSupport from './components/CustomerSupport';
import AdminPortal from './components/AdminPortal';

export default function App() {
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
      const liveTickets = await db.getTickets();
      setTickets(liveTickets);

      if (user) {
        if (getSupabaseStatus().configured) {
          const isEmailConfirmed = await db.checkUserEmailConfirmed();
          if (!isEmailConfirmed) {
            logger.warn('User email not verified on reload. Logging out...', 'App');
            localStorage.removeItem('mt_hub_current_user');
            setUser(null);
            setActiveTab('auth');
            triggerAlert(
              'error',
              'Your email is not verified yet. Please check your inbox and verify your email before viewing your dashboard.'
            );
            return;
          }
        }

        const updatedProfile = await db.getUserProfile(user.id);
        if (updatedProfile) {
          setUser((prev) => {
            if (!prev) return updatedProfile;
            if (
              prev.id === updatedProfile.id &&
              prev.role === updatedProfile.role &&
              prev.name === updatedProfile.name &&
              prev.email === updatedProfile.email &&
              prev.balance === updatedProfile.balance &&
              prev.companyName === updatedProfile.companyName &&
              prev.phoneNumber === updatedProfile.phoneNumber &&
              prev.paystackSubaccountCode === updatedProfile.paystackSubaccountCode
            ) {
              return prev;
            }
            return updatedProfile;
          });
          localStorage.setItem('mt_hub_current_user', JSON.stringify(updatedProfile));
        } else {
          logger.warn('User account was removed. Logging out...', 'App');
          localStorage.removeItem('mt_hub_current_user');
          setUser(null);
          setActiveTab('auth');
          triggerAlert(
            'error',
            'Your session expired or your account has been removed. Please sign in again.'
          );
          return;
        }

        if (user.role === 'producer') {
          const livePurchases = await db.getPurchasesForProducer(user.id);
          setPurchases(livePurchases);
        } else {
          const livePurchases = await db.getPurchasesForBuyer(user.id);
          setPurchases(livePurchases);
        }
      }
    } catch (e: unknown) {
      const err = e instanceof Error ? e.message : String(e);
      logger.error('Failed to reload data:', 'App', { error: err });
    }
  }, [user, triggerAlert]);

  // Sync session and load database items
  useEffect(() => {
    reloadData();
  }, [reloadData]);

  // Real-time listener for ticket updates and deletions across the application
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const handleTicketsChanged = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        reloadData();
      }, 300);
    };
    window.addEventListener('mt_hub_tickets_changed', handleTicketsChanged);
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      window.removeEventListener('mt_hub_tickets_changed', handleTicketsChanged);
    };
  }, [reloadData]);

  // Real-time listener for secret admin tab toggle
  useEffect(() => {
    const handleToggleAdminEvent = () => {
      const nextState = localStorage.getItem('mt_hub_show_admin_tab') === 'true';
      if (nextState) {
        triggerAlert('success', 'Admin Portal Login Option is now VISIBLE on the login screen!');
      } else {
        triggerAlert('success', 'Admin Portal Login Option is now HIDDEN from the login screen.');
      }
    };
    window.addEventListener('mt_hub_toggle_admin_tab', handleToggleAdminEvent);
    return () => {
      window.removeEventListener('mt_hub_toggle_admin_tab', handleToggleAdminEvent);
    };
  }, [triggerAlert]);

  // Strict role-based navigation enforcement guard
  useEffect(() => {
    if (user) {
      if (user.role === 'buyer') {
        if (activeTab !== 'marketplace') {
          setActiveTab('marketplace');
        }
      } else if (user.role === 'producer') {
        if (activeTab !== 'producer_dashboard' && activeTab !== 'gate_auth') {
          setActiveTab('producer_dashboard');
        }
      } else if (user.role === 'admin') {
        if (activeTab !== 'admin_portal' && activeTab !== 'marketplace') {
          setActiveTab('admin_portal');
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

  return (
    <div className="min-h-screen bg-midnight text-gray-100 flex flex-col font-sans selection:bg-gold/30 selection:text-gold-light">
      <Header
        activeTab={activeTab}
        setActiveTab={handleNavigationChange}
        user={user}
        onLogout={handleLogout}
        onOpenAuth={(role) => {
          setAuthModalRole(role);
          setActiveTab('auth');
        }}
      />

      {alertMessage && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown max-w-md shadow-2xl">
          <div
            className={`flex items-center gap-3 p-4 rounded-xl border backdrop-blur-md ${
              alertMessage.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300'
                : 'bg-red-950/80 border-red-500/30 text-red-300'
            }`}
          >
            {alertMessage.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
            ) : (
              <ShieldAlert className="h-5 w-5 shrink-0 text-red-400" />
            )}
            <span className="text-xs font-semibold leading-relaxed">{alertMessage.text}</span>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'auth' && (
          <AuthPage
            initialRole={authModalRole}
            onSuccess={handleAuthSuccess}
            onBackToMarket={() => {
              if (user) {
                if (user.role === 'producer') setActiveTab('producer_dashboard');
                else if (user.role === 'admin') setActiveTab('admin_portal');
                else setActiveTab('marketplace');
              } else {
                triggerAlert(
                  'error',
                  'Please sign in or create an account to enter the marketplace.'
                );
              }
            }}
          />
        )}

        {activeTab === 'marketplace' && (
          <Marketplace
            user={user}
            tickets={tickets}
            onOpenAuth={(role) => {
              setAuthModalRole(role);
              setActiveTab('auth');
            }}
            onPurchaseSuccess={() => {
              reloadData();
              triggerAlert('success', 'Ticket successfully purchased! View your passes anytime.');
            }}
          />
        )}

        {activeTab === 'producer_dashboard' && user && user.role === 'producer' && (
          <ProducerDashboard
            user={user}
            tickets={tickets.filter((t) => t.producerId === user.id)}
            purchases={purchases}
            onTicketCreated={() => {
              reloadData();
              triggerAlert('success', 'New Premiere Event published successfully!');
            }}
            onOpenGateScanner={() => setActiveTab('gate_auth')}
          />
        )}

        {activeTab === 'gate_auth' && user && user.role === 'producer' && (
          <GateScanner user={user} onBack={() => setActiveTab('producer_dashboard')} />
        )}

        {activeTab === 'admin_portal' && user && user.role === 'admin' && (
          <AdminPortal
            adminUser={user}
            onActionNotice={(msg, type) => triggerAlert(type || 'success', msg)}
          />
        )}
      </main>

      <CustomerSupport />
    </div>
  );
}
