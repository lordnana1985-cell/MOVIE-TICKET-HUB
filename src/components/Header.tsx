import { Film, User, LogOut, LayoutDashboard, Store, KeyRound } from 'lucide-react';
// @ts-ignore
import logoUrl from '../assets/images/movie_ticket_hub_logo_new_1783537722922.jpg';
import { UserProfile } from '../types';

interface HeaderProps {
  user: UserProfile | null;
  activeTab: 'marketplace' | 'producer_dashboard' | 'gate_auth' | 'auth';
  setActiveTab: (tab: 'marketplace' | 'producer_dashboard' | 'gate_auth' | 'auth') => void;
  onLogout: () => void;
  onOpenAuth: (role: 'producer' | 'buyer') => void;
}

export default function Header({
  user,
  activeTab,
  setActiveTab,
  onLogout,
  onOpenAuth
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 px-4 md:px-8 bg-[#030712]/90 backdrop-blur-md flex flex-col justify-center py-4 md:py-3">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2">
        {/* LOGO & BRANDING */}
        <div 
          onClick={() => {
            if (user) {
              setActiveTab(user.role === 'producer' ? 'producer_dashboard' : 'marketplace');
            } else {
              setActiveTab('auth');
            }
          }} 
          className="flex cursor-pointer items-center gap-2 sm:gap-3 transition-all hover:scale-[1.02]"
          id="brand-logo-container"
        >
          <div className="relative h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 overflow-hidden rounded-lg border-2 border-gold bg-gradient-to-tr from-gold to-gold-dark p-0.5 shadow-[0_0_15px_rgba(251,191,36,0.4)]">
            <img 
              src={logoUrl} 
              alt="Movie Ticket Hub Logo" 
              className="h-full w-full object-cover rounded-md"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h1 className="font-display text-sm sm:text-lg md:text-xl font-black tracking-tighter text-white">
              MOVIE TICKET <span className="text-gold">HUB</span>
            </h1>
            <p className="text-[8px] sm:text-[9px] font-mono tracking-widest text-sky-light/60 uppercase">
              Premier Cinema Access
            </p>
          </div>
        </div>

        {/* NAVIGATION LINKS */}
        {user && (
          <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
            {user.role === 'buyer' && (
              <button
                onClick={() => setActiveTab('marketplace')}
                className={`flex items-center gap-2 py-1 transition-all ${
                  activeTab === 'marketplace'
                    ? 'text-white border-b-2 border-gold font-bold'
                    : 'text-sky-100/70 hover:text-white'
                }`}
                id="nav-marketplace-btn"
              >
                <Store className="h-4 w-4" />
                Marketplace
              </button>
            )}

            {user.role === 'producer' && (
              <>
                <button
                  onClick={() => setActiveTab('producer_dashboard')}
                  className={`flex items-center gap-2 py-1 transition-all ${
                    activeTab === 'producer_dashboard'
                      ? 'text-white border-b-2 border-gold font-bold'
                      : 'text-sky-100/70 hover:text-white'
                  }`}
                  id="nav-dashboard-btn"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Producer Dashboard
                </button>

                <button
                  onClick={() => setActiveTab('gate_auth')}
                  className={`flex items-center gap-2 py-1 transition-all ${
                    activeTab === 'gate_auth'
                      ? 'text-white border-b-2 border-gold font-bold'
                      : 'text-sky-100/70 hover:text-white'
                  }`}
                  id="nav-gate-btn"
                >
                  <KeyRound className="h-4 w-4" />
                  Gate Gatekeeper
                </button>
              </>
            )}
          </nav>
        )}

        {/* AUTH ACTIONS & PROFILE */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {/* PRODUCER MODE BADGE */}
              {user.role === 'producer' && (
                <span className="bg-sky-500/20 text-sky-300 px-3 py-1 rounded-full text-xs font-bold border border-sky-400/30 hidden lg:inline-block">
                  PRODUCER MODE
                </span>
              )}

              {/* BALANCE BADGE */}
              <div className="flex flex-col items-end text-right shrink-0">
                <span className="text-[8px] sm:text-[10px] text-white/40 font-mono font-bold tracking-tighter uppercase leading-none mb-0.5">
                  {user.role === 'producer' ? 'REVENUE' : 'BALANCE'}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-gold font-mono leading-none">
                  GH₵{user.balance.toLocaleString()}
                </span>
              </div>

              {/* USER PROFILE CARD */}
              <div className="flex items-center gap-1.5 rounded-full bg-white/5 p-1 sm:pr-3 border border-white/10">
                <div className="w-7 h-7 rounded-full bg-sky-300 flex items-center justify-center text-slate-950 font-bold border-2 border-gold shrink-0">
                  {user.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="hidden md:flex flex-col">
                  <span className="max-w-[80px] truncate text-xs font-medium text-white">
                    {user.name}
                  </span>
                  <span className="text-[9px] text-sky-light/80 capitalize">
                    {user.role}
                  </span>
                </div>
              </div>

              {/* LOGOUT */}
              <button
                onClick={onLogout}
                className="hidden md:flex items-center gap-1.5 rounded-lg border border-red-500/10 bg-red-500/5 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-all shrink-0"
                title="Logout"
                id="header-logout-btn"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('buyer')}
                className="rounded-xl bg-gradient-to-r from-sky-deep via-gold to-gold-dark text-white hover:opacity-95 text-xs font-bold px-4 py-2 transition-all shadow-md shadow-gold/5 flex items-center gap-1.5 border border-white/10"
                id="header-login-btn"
              >
                <Film className="h-3.5 w-3.5 text-gold animate-pulse" />
                Sign In / Register
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE NAV (SCROLLABLE ROW) */}
      {user && (
        <div className="mt-3 flex overflow-x-auto gap-1 py-1 no-scrollbar md:hidden">
          {user.role === 'buyer' && (
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === 'marketplace'
                  ? 'bg-sky-deep text-white'
                  : 'text-gray-300 bg-white/5'
              }`}
              id="mobile-nav-market"
            >
              <Store className="h-3.5 w-3.5" />
              Marketplace
            </button>
          )}

          {user.role === 'producer' && (
            <>
              <button
                onClick={() => setActiveTab('producer_dashboard')}
                className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  activeTab === 'producer_dashboard'
                    ? 'bg-gold text-black font-semibold'
                    : 'text-gray-300 bg-white/5'
                }`}
                id="mobile-nav-dashboard"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                Dashboard
              </button>

              <button
                onClick={() => setActiveTab('gate_auth')}
                className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  activeTab === 'gate_auth'
                    ? 'bg-white text-black font-semibold'
                    : 'text-gray-300 bg-white/5'
                }`}
                id="mobile-nav-gate"
              >
                <KeyRound className="h-3.5 w-3.5" />
                Gate Gatekeeper
              </button>
            </>
          )}

          <button
            onClick={onLogout}
            className="flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all border border-red-500/10"
            id="mobile-nav-logout"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      )}
    </header>
  );
}
