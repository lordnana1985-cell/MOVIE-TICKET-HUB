import { ShieldAlert, CheckCircle2 } from 'lucide-react';
import Header from './components/Header';
import AuthPage from './components/AuthPage';
import Marketplace from './components/Marketplace';
import ProducerDashboard from './components/ProducerDashboard';
import GateScanner from './components/GateScanner';
import CustomerSupport from './components/CustomerSupport';
import AdminPortal from './components/AdminPortal';
import { useAppState } from './hooks/useAppState';

export default function App() {
  const {
    user,
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
  } = useAppState();

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
