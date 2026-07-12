import { useState, useEffect } from 'react';
import { 
  Film, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  HelpCircle,
  TrendingUp,
  Cpu,
  Tv
} from 'lucide-react';
import { UserProfile, MovieTicket, TicketPurchase } from './types';
import { db, getSupabaseStatus } from './lib/db';
import Header from './components/Header';
import AuthPage from './components/AuthPage';
import Marketplace from './components/Marketplace';
import ProducerDashboard from './components/ProducerDashboard';
import GateScanner from './components/GateScanner';
import CustomerSupport from './components/CustomerSupport';
import PaystackSandbox from './components/PaystackSandbox';
import AdminPortal from './components/AdminPortal';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const savedUser = localStorage.getItem('mt_hub_current_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        localStorage.removeItem('mt_hub_current_user');
        return null;
      }
    }
    return null;
  });

  // Intercept for Paystack Sandbox redirect window
  const urlParams = new URLSearchParams(window.location.search);
  const sandboxRef = urlParams.get('reference');
  const sandboxAmount = urlParams.get('amount');

  if (sandboxRef) {
    return <PaystackSandbox reference={sandboxRef} amount={sandboxAmount} />;
  }

  const [activeTab, setActiveTab] = useState<'marketplace' | 'producer_dashboard' | 'gate_auth' | 'admin_portal' | 'auth'>(() => {
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
      } catch (e) {
        return 'auth';
      }
    }
    return 'auth';
  });

  const [authModalRole, setAuthModalRole] = useState<'producer' | 'buyer' | 'admin'>('buyer');
  
  // Shared Live States
  const [tickets, setTickets] = useState<MovieTicket[]>([]);
  const [purchases, setPurchases] = useState<TicketPurchase[]>([]);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync session and load database items
  useEffect(() => {
    reloadData();
  }, [user?.id]);

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
  }, []);

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
  }, [user?.role, activeTab]);

  const reloadData = async () => {
    try {
      const liveTickets = await db.getTickets();
      setTickets(liveTickets);

      if (user) {
        // Enforce active email verification check if Supabase is configured
        if (getSupabaseStatus().configured) {
          const isEmailConfirmed = await db.checkUserEmailConfirmed();
          if (!isEmailConfirmed) {
            console.warn("User email not verified on reload. Logging out...");
            localStorage.removeItem('mt_hub_current_user');
            setUser(null);
            setActiveTab('auth');
            triggerAlert('error', 'Your email is not verified yet. Please check your inbox and verify your email before viewing your dashboard.');
            return;
          }
        }

        // Reload user stats/profile balance too
        const updatedProfile = await db.getUserProfile(user.id);
        if (updatedProfile) {
          setUser(updatedProfile);
          localStorage.setItem('mt_hub_current_user', JSON.stringify(updatedProfile));
        }

        if (user.role === 'producer') {
          const livePurchases = await db.getPurchasesForProducer(user.id);
          setPurchases(livePurchases);
        } else {
          const livePurchases = await db.getPurchasesForBuyer(user.id);
          setPurchases(livePurchases);
        }
      }
    } catch (e) {
      console.error('Failed to reload data:', e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('mt_hub_current_user');
    setUser(null);
    setActiveTab('auth');
    triggerAlert('success', 'Logged out successfully! Come back soon.');
  };

  const handleAuthSuccess = (profile: UserProfile) => {
    setUser(profile);
    localStorage.setItem('mt_hub_current_user', JSON.stringify(profile));
    
    // Redirect producers to their console, buyers stay on market
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

  const triggerAlert = (type: 'success' | 'error', text: string) => {
    setAlertMessage({ type, text });
    setTimeout(() => setAlertMessage(null), 4000);
  };

  const handleNavigationChange = (tab: 'marketplace' | 'producer_dashboard' | 'gate_auth' | 'admin_portal' | 'auth') => {
    if (!user) {
      setActiveTab('auth');
      triggerAlert('error', 'Authentication required: Please sign in or register first to explore the market.');
      return;
    }

    // ENFORCE STRICT ROLE ACCESS GUARDS
    if (user.role === 'buyer') {
      if (tab !== 'marketplace' && tab !== 'auth') {
        triggerAlert('error', 'Access Blocked: Buyers are strictly limited to the Marketplace.');
        setActiveTab('marketplace');
        return;
      }
    } else if (user.role === 'producer') {
      if (tab !== 'producer_dashboard' && tab !== 'gate_auth' && tab !== 'auth') {
        triggerAlert('error', 'Access Blocked: Producers are restricted to the Producer Console.');
        setActiveTab('producer_dashboard');
        return;
      }
    } else if (user.role === 'admin') {
      if (tab !== 'admin_portal' && tab !== 'marketplace' && tab !== 'auth') {
        triggerAlert('error', 'Access Blocked: Admins are restricted to Admin Portal and Marketplace.');
        setActiveTab('admin_portal');
        return;
      }
    }
    setActiveTab(tab);
  };

  const openAuthPortal = (role: 'producer' | 'buyer' | 'admin') => {
    setAuthModalRole(role);
    setActiveTab('auth');
  };

  return (
    <div className="min-h-screen bg-[#030712] text-gray-100 flex flex-col relative selection:bg-gold/30 selection:text-white">
      {/* GLOBAL MOOD GLOW BACKGROUND ORBS */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[50%] rounded-full bg-sky-deep/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gold/5 blur-[150px] pointer-events-none" />

      {/* HEADER CONTROLLER */}
      <Header 
        user={user}
        activeTab={activeTab}
        setActiveTab={handleNavigationChange}
        onLogout={handleLogout}
        onOpenAuth={openAuthPortal}
      />

      {/* FLOATING ALERTS DESPATCHER */}
      {alertMessage && (
        <div className="fixed top-20 right-6 z-50 max-w-sm rounded-xl glass-panel p-4 shadow-xl border border-white/10 animate-slideLeft">
          <div className="flex items-start gap-3">
            {alertMessage.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-gold shrink-0 mt-0.5" />
            )}
            <div>
              <span className="text-xs font-bold text-white block">
                {alertMessage.type === 'success' ? 'Operation Success' : 'Security Advisory'}
              </span>
              <p className="text-xs text-gray-300 mt-1">{alertMessage.text}</p>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER FRAME */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 md:px-8 relative z-10">
        {/* VIEW ROUTER */}
        {activeTab === 'marketplace' && (
          <Marketplace 
            user={user}
            tickets={tickets}
            purchases={purchases}
            onPurchaseComplete={reloadData}
            onOpenAuth={openAuthPortal}
          />
        )}

        {activeTab === 'producer_dashboard' && user && user.role === 'producer' && (
          <ProducerDashboard 
            user={user}
            onTicketCreated={reloadData}
            setActiveTab={handleNavigationChange}
          />
        )}

        {activeTab === 'admin_portal' && user && user.role === 'admin' && (
          <AdminPortal 
            user={user}
            tickets={tickets}
            onDataChanged={reloadData}
          />
        )}

        {activeTab === 'gate_auth' && user && user.role === 'producer' && (
          <GateScanner 
            user={user}
          />
        )}

        {activeTab === 'auth' && (
          <AuthPage 
            initialRole={authModalRole}
            onAuthSuccess={handleAuthSuccess}
          />
        )}
      </main>

      {/* GLOBAL FOOTER */}
      <footer className="border-t border-white/5 py-8 mt-12 bg-black/40">
        <div className="mx-auto max-w-7xl px-4 text-center md:px-8 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-2 border-b border-white/5 mb-4 text-xs font-mono">
            <span className="text-gray-400">Need immediate help? Contact Support:</span>
            <div className="flex items-center gap-4 flex-wrap justify-center">
              <a href="https://wa.me/233543198585" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>WhatsApp (0543198585)</span>
              </a>
              <span className="text-gray-600 hidden sm:inline">|</span>
              <a href="tel:0543198585" className="flex items-center gap-1.5 text-sky-light hover:text-sky-300 transition-colors">
                <span>Call (0543198585)</span>
              </a>
            </div>
          </div>
          <p className="text-xs text-gray-500 font-mono tracking-wider">
            © 2026 EVENT TICKET HUB (ETH) • ALL RIGHTS RESERVED
          </p>
          {activeTab !== 'auth' && (
            <div className="flex justify-center gap-6 text-[10px] font-mono text-gray-400 flex-wrap">
              <span>SECURED BY PAYSTACK INLINE</span>
              <span>•</span>
              <span>SPLIT SYSTEM: 80% ORGANISER / 20% HUB</span>
              <span>•</span>
              <span>SUPABASE INTEGRATION CAPABLE</span>
            </div>
          )}
        </div>
      </footer>

      {/* FLOATING CUSTOMER SUPPORT FAB & MENU */}
      <CustomerSupport />
    </div>
  );
}
