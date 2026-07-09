import { useState, useEffect } from 'react';
import { 
  Database, 
  CloudAlert, 
  Check, 
  Copy, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  Wifi, 
  WifiOff,
  HelpCircle,
  X
} from 'lucide-react';
import { getSupabaseStatus, getSupabaseLastError } from '../lib/db';

export default function DatabaseSyncStatus() {
  const [status, setStatus] = useState(getSupabaseStatus());
  const [lastError, setLastError] = useState(getSupabaseLastError());
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSql, setShowSql] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState<string | null>(null);
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem('mt_hub_dismiss_sync_warning') === 'true';
  });

  // Check periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(getSupabaseStatus());
      setLastError(getSupabaseLastError());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const isUsingPlaceholder = status.url === 'https://aegpswfduxjayoeidztz.supabase.co';
  const hasConnectionIssue = lastError !== null || isUsingPlaceholder;

  const handleDismiss = () => {
    localStorage.setItem('mt_hub_dismiss_sync_warning', 'true');
    setIsDismissed(true);
  };

  const handleResetDismiss = () => {
    localStorage.removeItem('mt_hub_dismiss_sync_warning');
    setIsDismissed(false);
  };

  const sqlSchema = `-- ==========================================
-- MOVIE TICKET HUB - DATABASE SCHEMA SETUP
-- Paste this script into your Supabase SQL Editor
-- ==========================================

-- 1. Create Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    name TEXT NOT NULL,
    company_name TEXT,
    phone_number TEXT,
    balance NUMERIC DEFAULT 0,
    paystack_subaccount_code TEXT,
    settlement_bank TEXT,
    account_number TEXT,
    business_name TEXT
);

-- 2. Create Movie Tickets Table
CREATE TABLE IF NOT EXISTS public.movie_tickets (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    venue TEXT NOT NULL,
    trailer_url TEXT,
    producer_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
    producer_name TEXT NOT NULL,
    total_quantity NUMERIC NOT NULL,
    available_quantity NUMERIC NOT NULL,
    cover_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Ticket Purchases Table
CREATE TABLE IF NOT EXISTS public.ticket_purchases (
    id TEXT PRIMARY KEY,
    ticket_id TEXT REFERENCES public.movie_tickets(id) ON DELETE CASCADE,
    movie_title TEXT NOT NULL,
    movie_cover_url TEXT,
    buyer_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
    buyer_name TEXT NOT NULL,
    buyer_email TEXT NOT NULL,
    amount_paid NUMERIC NOT NULL,
    producer_earning NUMERIC NOT NULL,
    hub_earning NUMERIC NOT NULL,
    paystack_ref TEXT,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'unused',
    scanned_at TIMESTAMP WITH TIME ZONE
);

-- 4. Create Gate Logs Table
CREATE TABLE IF NOT EXISTS public.gate_logs (
    id TEXT PRIMARY KEY,
    purchase_id TEXT,
    ticket_id TEXT,
    movie_title TEXT NOT NULL,
    buyer_name TEXT NOT NULL,
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT NOT NULL
);

-- 5. Enable Row Level Security (RLS) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movie_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gate_logs ENABLE ROW LEVEL SECURITY;

-- 6. Setup Public Read/Write Access Policies
CREATE POLICY "Public profiles policy" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public movie_tickets policy" ON public.movie_tickets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public ticket_purchases policy" ON public.ticket_purchases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public gate_logs policy" ON public.gate_logs FOR ALL USING (true) WITH CHECK (true);`;

  const copyToClipboard = (text: string, type: 'sql' | 'url' | 'key') => {
    navigator.clipboard.writeText(text);
    if (type === 'sql') {
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2000);
    } else {
      setCopiedEnv(type);
      setTimeout(() => setCopiedEnv(null), 2000);
    }
  };

  if (isDismissed) {
    return (
      <div className="flex justify-end pr-2 -mt-4 mb-4">
        <button 
          onClick={handleResetDismiss} 
          className="text-[10px] font-mono text-gray-400 hover:text-gold flex items-center gap-1 underline transition-all"
        >
          <Database className="h-3 w-3" />
          <span>Show Database Sync Diagnostics</span>
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-gold/20 bg-gradient-to-r from-slate-950 via-amber-950/20 to-slate-950 p-5 md:p-6 shadow-xl space-y-4 relative overflow-hidden animate-fadeIn mb-8">
      {/* Decorative Blur Backing */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

      {/* Close button */}
      <button 
        onClick={handleDismiss}
        className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        title="Dismiss Diagnostics"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex flex-col md:flex-row items-start gap-4">
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 shrink-0 text-gold">
          {isUsingPlaceholder ? <CloudAlert className="h-6 w-6 animate-pulse" /> : <Database className="h-6 w-6 text-emerald-400" />}
        </div>

        <div className="space-y-1.5 flex-1 min-w-0 pr-6">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display font-bold text-base text-white">
              {isUsingPlaceholder ? "Vercel Hosting Sync Alert: Local Sandbox Mode Active" : "Supabase Cloud Sync Status"}
            </h3>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold font-mono uppercase tracking-wider ${
              isUsingPlaceholder 
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                : lastError 
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}>
              {isUsingPlaceholder ? (
                <>
                  <WifiOff className="h-3 w-3" />
                  <span>Sandbox (Local Browser Only)</span>
                </>
              ) : lastError ? (
                <>
                  <WifiOff className="h-3 w-3" />
                  <span>Connection Issue</span>
                </>
              ) : (
                <>
                  <Wifi className="h-3 w-3 animate-pulse" />
                  <span>Cloud Live Synced</span>
                </>
              )}
            </span>
          </div>

          <p className="text-xs text-gray-300 leading-relaxed max-w-4xl">
            {isUsingPlaceholder ? (
              <span>
                <strong>Why your friend in the USA cannot see uploaded movies:</strong> You deployed this application on Vercel without linking your own custom <strong>Supabase Cloud Database</strong>. The app has fallen back to storing movies inside <strong>your local computer browser storage</strong>. Since browser storage is private to your device, people in other locations see a blank list!
              </span>
            ) : (
              <span>
                Your custom Supabase credentials are configured. Movies, profiles, tickets, and gate access logs are stored in your central cloud database and shared globally with any users.
              </span>
            )}
          </p>
        </div>
      </div>

      {isUsingPlaceholder && (
        <div className="border-t border-white/5 pt-4 space-y-4">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-white font-bold transition-all flex items-center gap-2 border border-white/10"
            >
              <span>{isExpanded ? "Hide Setup Guide" : "How to link Supabase & Vercel (3 Steps)"}</span>
              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            <a 
              href="https://supabase.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="px-4 py-2 rounded-xl bg-gold text-black font-bold text-xs hover:bg-yellow-500 transition-all flex items-center gap-1.5"
            >
              <span>Get Free Supabase DB</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          {isExpanded && (
            <div className="rounded-2xl bg-black/40 border border-white/5 p-4 space-y-4 text-xs text-gray-400 animate-fadeIn">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* STEP 1 */}
                <div className="space-y-2 p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="h-6 w-6 rounded-full bg-gold/10 text-gold flex items-center justify-center font-bold font-mono">1</div>
                  <h4 className="font-bold text-white">Create a Supabase Project</h4>
                  <p className="text-[11px] leading-relaxed">
                    Create a free project on <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-gold underline">supabase.com</a>. Copy your <strong>Project URL</strong> and your <strong>Anon API Key</strong> from Settings &gt; API.
                  </p>
                </div>

                {/* STEP 2 */}
                <div className="space-y-2 p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="h-6 w-6 rounded-full bg-gold/10 text-gold flex items-center justify-center font-bold font-mono">2</div>
                  <h4 className="font-bold text-white">Run SQL Schema Table Script</h4>
                  <p className="text-[11px] leading-relaxed">
                    Open your Supabase project's <strong>SQL Editor</strong>, click "New Query", paste the schema script provided below, and click <strong>Run</strong> to generate all required tables and permissions.
                  </p>
                  <button
                    onClick={() => setShowSql(!showSql)}
                    className="text-gold text-[10px] font-bold font-mono hover:underline flex items-center gap-1 mt-2"
                  >
                    <span>{showSql ? "Hide SQL Script" : "Show SQL Script"}</span>
                    {showSql ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                </div>

                {/* STEP 3 */}
                <div className="space-y-2 p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="h-6 w-6 rounded-full bg-gold/10 text-gold flex items-center justify-center font-bold font-mono">3</div>
                  <h4 className="font-bold text-white">Paste Vercel Env Variables</h4>
                  <p className="text-[11px] leading-relaxed">
                    In your <strong>Vercel Project Dashboard</strong> under <strong>Settings &gt; Environment Variables</strong>, add these two exact environment variables, then trigger a new deployment!
                  </p>
                  <div className="space-y-1.5 mt-2 font-mono text-[10px] text-white">
                    <div className="flex items-center justify-between bg-black/50 p-1.5 rounded border border-white/5">
                      <span>VITE_SUPABASE_URL</span>
                      <button 
                        onClick={() => copyToClipboard('VITE_SUPABASE_URL', 'url')}
                        className="text-gold hover:text-white"
                      >
                        {copiedEnv === 'url' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                    <div className="flex items-center justify-between bg-black/50 p-1.5 rounded border border-white/5">
                      <span>VITE_SUPABASE_ANON_KEY</span>
                      <button 
                        onClick={() => copyToClipboard('VITE_SUPABASE_ANON_KEY', 'key')}
                        className="text-gold hover:text-white"
                      >
                        {copiedEnv === 'key' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* EXPANDABLE SQL VIEW */}
              {showSql && (
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 font-mono">SUPABASE CONFIGURATION SQL SCHEMA (CLICK COPY):</span>
                    <button
                      onClick={() => copyToClipboard(sqlSchema, 'sql')}
                      className="px-3 py-1 rounded bg-gold text-black font-bold text-[10px] hover:bg-yellow-500 transition-colors flex items-center gap-1"
                    >
                      {copiedSql ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedSql ? "Copied!" : "Copy SQL Script"}</span>
                    </button>
                  </div>
                  <pre className="p-4 bg-black/60 rounded-xl font-mono text-[10px] text-sky-light/90 overflow-x-auto max-h-60 leading-relaxed border border-white/5 select-all">
                    {sqlSchema}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {lastError && !isUsingPlaceholder && (
        <div className="p-3.5 rounded-xl border border-red-500/10 bg-red-500/5 text-xs text-red-300 flex items-start gap-2 animate-fadeIn">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Last Database Sync Error:</span>
            <p className="font-mono text-[11px] text-red-400">{lastError}</p>
            <p className="text-gray-400 text-[10px] leading-relaxed">
              If you see a "relation does not exist" error, it means you have configured your environment variables, but forgot to run the SQL Table Setup script in Step 2. Please open the SQL guide above to run the schema script.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
