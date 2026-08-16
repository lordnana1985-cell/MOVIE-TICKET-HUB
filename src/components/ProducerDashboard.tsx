import { useState, useEffect, FormEvent } from 'react';
import { 
  Plus, 
  Film,
  DollarSign, 
  Tickets, 
  Percent, 
  Calendar, 
  Clock, 
  MapPin, 
  ChevronRight,
  TrendingUp,
  Briefcase,
  Layers,
  ArrowRight,
  Trash2,
  AlertTriangle,
  Phone,
  Database
} from 'lucide-react';
import { UserProfile, MovieTicket, TicketPurchase } from '../types';
import { db } from '../lib/db';
import { EmbeddedSupportCard } from './CustomerSupport';
import TicketForm from './producer/TicketForm';

interface ProducerDashboardProps {
  user: UserProfile;
  onTicketCreated: () => void;
  setActiveTab: (tab: 'marketplace' | 'producer_dashboard' | 'gate_auth') => void;
}

export default function ProducerDashboard({
  user,
  onTicketCreated,
  setActiveTab
}: ProducerDashboardProps) {
  const [tickets, setTickets] = useState<MovieTicket[]>([]);
  const [purchases, setPurchases] = useState<TicketPurchase[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Paystack subaccount configuration states
  const [bankSubaccount, setBankSubaccount] = useState<string | undefined>(user.paystackSubaccountCode);
  const [bankList, setBankList] = useState<{name: string, code: string}[]>([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
  const [isSubmittingSubaccount, setIsSubmittingSubaccount] = useState(false);
  const [subaccountError, setSubaccountError] = useState('');
  const [subaccountSuccess, setSubaccountSuccess] = useState('');
  const [isEditingSubaccount, setIsEditingSubaccount] = useState(!user.paystackSubaccountCode);

  // 4-digit code verification for editing/changing account
  const [generatedCode, setGeneratedCode] = useState('');
  const [userEnteredCode, setUserEnteredCode] = useState('');
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Form Fields
  const [setupCountry, setSetupCountry] = useState<'GHS' | 'NGN'>('GHS');
  const [setupBusinessName, setSetupBusinessName] = useState(user.businessName || user.companyName || user.name || '');
  const [setupBankCode, setSetupBankCode] = useState('');
  const [setupAccountNumber, setSetupAccountNumber] = useState(user.accountNumber || user.phoneNumber || '');

  // Fetch Banks List when country changes
  useEffect(() => {
    const fetchBanks = async () => {
      setIsLoadingBanks(true);
      try {
        const res = await fetch(`/api/paystack/banks?currency=${setupCountry}`);
        const result = await res.json();
        if (result.status && result.data) {
          setBankList(result.data);
          // Set default bank code if available
          if (result.data.length > 0) {
            setSetupBankCode(result.data[0].code);
          }
        }
      } catch (err) {
        console.error("Failed to load banks:", err);
      } finally {
        setIsLoadingBanks(false);
      }
    };
    fetchBanks();
  }, [setupCountry]);

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    const newCode = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedCode(newCode);
    setUserEnteredCode('');
    setVerificationError('');
    setResendCooldown(60);

    try {
      await fetch('/api/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          code: newCode,
          purpose: 'payout_account_change_resend'
        })
      });
      setSubaccountSuccess(`Verification code resent to ${user.email}.`);
    } catch (err) {
      console.error("Failed to resend verification code email:", err);
    }
  };

  const handleCreateSubaccount = async (e: FormEvent) => {
    e.preventDefault();
    setSubaccountError('');
    setSubaccountSuccess('');
    setVerificationError('');

    // Check if they are updating an existing subaccount
    if (bankSubaccount && !showVerificationInput) {
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedCode(code);
      setShowVerificationInput(true);
      setResendCooldown(60);

      // Dispatch code to organizer's registered email address
      try {
        await fetch('/api/send-verification-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            code,
            purpose: 'payout_account_change'
          })
        });
      } catch (err) {
        console.error("Failed to dispatch verification code email:", err);
      }
      return;
    }

    if (showVerificationInput) {
      if (userEnteredCode !== generatedCode) {
        setVerificationError('Invalid 4-digit verification code. Please confirm the code sent to your email.');
        return;
      }
      // Verification succeeded, reset verification states and proceed
      setShowVerificationInput(false);
      setGeneratedCode('');
      setUserEnteredCode('');
    }

    setIsSubmittingSubaccount(true);

    try {
      const res = await fetch('/api/paystack/subaccount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: setupBusinessName,
          settlement_bank: setupBankCode,
          account_number: setupAccountNumber,
          primary_contact_email: user.email
        })
      });

      const result = await res.json();

      if (result.status && result.data?.subaccount_code) {
        const code = result.data.subaccount_code;
        // Update user profile in DB
        await db.updateUserProfile(user.id, {
          paystackSubaccountCode: code,
          settlementBank: setupBankCode,
          accountNumber: setupAccountNumber,
          businessName: setupBusinessName
        });

        setBankSubaccount(code);
        setSubaccountSuccess(`Subaccount registered successfully: ${code}`);
        setIsEditingSubaccount(false);
        // Refresh parent App's user stats
        onTicketCreated();
      } else {
        setSubaccountError(result.message || 'Failed to create subaccount.');
      }
    } catch (err: any) {
      setSubaccountError(err.message || 'Network error.');
    } finally {
      setIsSubmittingSubaccount(false);
    }
  };

  // Fetch Producer Data
  const loadProducerData = async () => {
    try {
      const allTickets = await db.getTickets();
      const myTickets = allTickets.filter(t => t.producerId === user.id);
      setTickets(myTickets);

      const myPurchases = await db.getPurchasesForProducer(user.id);
      setPurchases(myPurchases);
    } catch (e) {
      console.error('Error loading producer dashboard data:', e);
    }
  };

  useEffect(() => {
    loadProducerData();

    // Auto generate Paystack subaccount if missing
    if (!user.paystackSubaccountCode) {
      const autoGenerate = async () => {
        try {
          const code = await db.generatePaystackSubaccount(user);
          if (code) {
            setBankSubaccount(code);
            setIsEditingSubaccount(false);
            onTicketCreated(); // Notify parent to reload user profile
          }
        } catch (err) {
          console.error("Auto generation of Paystack subaccount on dashboard mount failed:", err);
        }
      };
      autoGenerate();
    }
  }, [user.id, user.paystackSubaccountCode]);

  const handleDeleteTicket = async (id: string) => {
    setIsDeleting(id);
    setError('');
    setSuccess('');
    try {
      setTickets(prev => prev.filter(t => t.id !== id));
      await db.deleteTicket(id);
      setSuccess('Event ticket deleted successfully!');
      setTicketToDelete(null);
      await loadProducerData();
      onTicketCreated(); // notify parent
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to delete event ticket.');
      await loadProducerData();
    } finally {
      setIsDeleting(null);
    }
  };

  const handleClearAllTickets = async () => {
    setIsClearingAll(true);
    setError('');
    setSuccess('');
    try {
      await db.clearAllTickets();
      setSuccess('All event tickets cleared successfully across all registered organisers!');
      setShowClearAllConfirm(false);
      await loadProducerData();
      onTicketCreated(); // notify parent
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to clear event tickets.');
    } finally {
      setIsClearingAll(false);
    }
  };

  // Calculations
  const totalSalesCount = purchases.length;
  const totalGrossRevenue = purchases.reduce((acc, p) => acc + p.amountPaid, 0);
  const producerShare = purchases.reduce((acc, p) => acc + p.producerEarning, 0); // 80%
  const hubShare = purchases.reduce((acc, p) => acc + p.hubEarning, 0);           // 20%

  return (
    <div className="space-y-8 animate-fadeIn" id="producer-dashboard-container">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <span className="text-xs font-mono tracking-widest text-gold font-semibold uppercase">
            {user.companyName || 'Event Production'} Organiser Portal
          </span>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-white mt-1">
            Event Organiser <span className="bg-gradient-to-r from-sky-light to-sky-deep bg-clip-text text-transparent">Console</span>
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Manage your event tickets, upload trailers/covers, generate tickets, and view real-time earnings.
          </p>
          {user.phoneNumber && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gold/10 border border-gold/20 px-3.5 py-2 text-xs text-gold font-mono">
              <Phone className="h-3.5 w-3.5 text-gold-light animate-pulse" />
              <span>Payout Phone: <strong className="text-white font-sans">{user.phoneNumber}</strong></span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('gate_auth')}
            className="rounded-xl glass-panel px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-all border border-white/15 shadow-md flex items-center gap-2"
          >
            Gate Ticket Verifier
            <ArrowRight className="h-4 w-4 text-gold" />
          </button>

          <button
            onClick={() => setIsCreating(!isCreating)}
            className="rounded-xl bg-gradient-to-r from-gold to-gold-dark px-5 py-3 text-sm font-bold text-black hover:brightness-105 shadow-lg shadow-gold/10 transition-all flex items-center gap-2"
            id="producer-add-ticket-btn"
          >
            <Plus className="h-4 w-4 stroke-[3px]" />
            Generate Event Ticket
          </button>
        </div>
      </div>

      {/* OVERALL EARNINGS & SALES SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: GROSS SALES */}
        <div className="rounded-2xl glass-panel p-4 md:p-6 border-l-4 border-l-sky-deep shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] md:text-xs text-gray-400 font-mono tracking-wider font-medium">GROSS TICKETS REVENUE</span>
            <div className="h-8 w-8 rounded-lg bg-sky-deep/10 border border-sky-deep/20 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-sky-light" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl md:text-2xl font-black font-mono text-white">
              GH₵{totalGrossRevenue.toLocaleString()}
            </h3>
            <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-400" />
              100% of marketplace volume
            </p>
          </div>
        </div>

        {/* CARD 2: PRODUCER SHARE (80%) */}
        <div className="rounded-2xl glass-panel p-4 md:p-6 border-l-4 border-l-gold shadow-md gold-glow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] md:text-xs text-gold-light font-mono tracking-wider font-semibold">YOUR EARNINGS (80%)</span>
            <div className="h-8 w-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center">
              <Percent className="h-4 w-4 text-gold" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl md:text-2xl font-black font-mono text-gold-light">
              GH₵{producerShare.toLocaleString()}
            </h3>
            <p className="text-[10px] text-gold/60 mt-1 font-medium">
              Direct Paystack split payouts
            </p>
          </div>
        </div>

        {/* CARD 3: HUB SHARE (20%) */}
        <div className="rounded-2xl glass-panel p-4 md:p-6 border-l-4 border-l-white/20 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] md:text-xs text-gray-400 font-mono tracking-wider font-medium">HUB COMMISSION (20%)</span>
            <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
              <Briefcase className="h-4 w-4 text-gray-400" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl md:text-2xl font-black font-mono text-gray-300">
              GH₵{hubShare.toLocaleString()}
            </h3>
            <p className="text-[10px] text-gray-500 mt-1">
              Sent to ETH (Event Ticket Hub) platform
            </p>
          </div>
        </div>

        {/* CARD 4: TICKETS SOLD */}
        <div className="rounded-2xl glass-panel p-4 md:p-6 border-l-4 border-l-emerald-500 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] md:text-xs text-gray-400 font-mono tracking-wider font-medium">PREMIER ADMISSIONS</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Tickets className="h-4 w-4 text-emerald-400" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl md:text-2xl font-black font-mono text-white">
              {totalSalesCount} <span className="text-xs text-gray-500 font-normal">tickets</span>
            </h3>
            <p className="text-[10px] text-gray-500 mt-1">
              Live gate validation-ready passes
            </p>
          </div>
        </div>
      </div>

      {/* CREATE TICKET MODAL / FORM COLLAPSIBLE */}
      {isCreating && (
        <TicketForm
          user={user}
          onClose={() => setIsCreating(false)}
          onSuccess={() => {
            loadProducerData();
            onTicketCreated();
          }}
        />
      )}

      {/* DASHBOARD BODY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT TWO COLS: CREATED MOVIE TICKETS */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <Film className="h-4.5 w-4.5 text-gold" />
              Your Generated Event Tickets
            </h3>
            <div className="flex items-center gap-3">
              {tickets.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowClearAllConfirm(true)}
                  className="rounded-xl border border-red-500/30 hover:border-red-500 hover:bg-red-500/10 text-red-400 hover:text-white px-3 py-1.5 text-[11px] font-bold font-mono flex items-center gap-1.5 transition-all"
                  title="Clear all generated tickets across all organisers"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>CLEAR ALL TICKETS</span>
                </button>
              )}
              <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-xs text-gray-400 font-mono">
                {tickets.length} total
              </span>
            </div>
          </div>

          {showClearAllConfirm && (
            <div className="rounded-2xl bg-red-950/20 border border-red-500/30 p-5 space-y-4 animate-slideDown shadow-lg">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white font-mono">⚠️ CLEAR ALL TICKETS PROMPT</h4>
                  <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                    You are about to delete **all event tickets** created by all registered organisers in the database, along with any recorded purchases and validation logs. This operation cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-red-500/15">
                <button
                  type="button"
                  onClick={() => setShowClearAllConfirm(false)}
                  disabled={isClearingAll}
                  className="rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 text-xs font-semibold text-gray-300 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleClearAllTickets}
                  disabled={isClearingAll}
                  className="rounded-lg bg-red-600 hover:bg-red-500 px-4 py-1.5 text-xs font-bold text-white transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isClearingAll ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Clearing...</span>
                    </>
                  ) : (
                    <span>Yes, Clear All Tickets</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {tickets.length === 0 ? (
            <div className="rounded-2xl glass-panel p-10 text-center border border-white/5">
              <Film className="h-10 w-10 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400 text-sm font-medium">You haven't generated any movie premier tickets yet.</p>
              <button
                onClick={() => setIsCreating(true)}
                className="mt-4 rounded-xl border border-gold/30 hover:border-gold text-gold px-4 py-2 text-xs font-semibold hover:bg-gold/10 transition-all"
              >
                Generate Your First Ticket
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tickets.map((tkt) => {
                const sold = purchases.filter(p => p.ticketId === tkt.id).length;
                const progress = (sold / tkt.totalQuantity) * 100;

                return (
                  <div key={tkt.id} className="relative rounded-2xl glass-panel overflow-hidden border border-white/10 flex flex-col justify-between hover:border-gold/30 transition-all group shadow-md">
                    {/* CONFIRM DELETE OVERLAY */}
                    {ticketToDelete === tkt.id && (
                      <div className="absolute inset-0 bg-black/95 backdrop-blur-md z-30 flex flex-col items-center justify-center p-4 text-center animate-fadeIn">
                        <AlertTriangle className="h-8 w-8 text-red-500 mb-2 animate-pulse" />
                        <span className="text-white font-bold text-sm block">Delete this premiere?</span>
                        <p className="text-[10px] text-gray-400 mt-1 mb-4 leading-normal max-w-[90%]">
                          "{tkt.title}" will be permanently removed. This action cannot be undone.
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setTicketToDelete(null)}
                            disabled={isDeleting === tkt.id}
                            className="rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-semibold text-gray-300 px-3 py-1.5 transition-all disabled:opacity-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTicket(tkt.id)}
                            disabled={isDeleting === tkt.id}
                            className="rounded-lg bg-red-600 hover:bg-red-500 text-[10px] font-bold text-white px-3 py-1.5 transition-all disabled:opacity-50 flex items-center gap-1.5"
                          >
                            {isDeleting === tkt.id ? (
                              <>
                                <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span>Deleting...</span>
                              </>
                            ) : (
                              <span>Yes, Delete</span>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* TOP HERO */}
                    <div className="relative h-32 overflow-hidden">
                      <img src={tkt.coverUrl} alt={tkt.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />

                      {/* SYNC STATUS BADGES */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                        {tkt.isLocalOnly ? (
                          <span className="rounded bg-amber-500/90 text-black text-[8px] font-bold px-1.5 py-0.5 tracking-wider uppercase shadow flex items-center gap-1 w-max">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            Local Only
                          </span>
                        ) : (
                          <span className="rounded bg-emerald-600/90 text-white text-[8px] font-bold px-1.5 py-0.5 tracking-wider uppercase shadow flex items-center gap-1 w-max">
                            <Database className="h-2.5 w-2.5" />
                            Supabase DB
                          </span>
                        )}
                        {tkt.coverUrl?.includes('supabase') ? (
                          <span className="rounded bg-blue-600/90 text-white text-[8px] font-bold px-1.5 py-0.5 tracking-wider uppercase shadow flex items-center gap-1 w-max">
                            Cover In Bucket
                          </span>
                        ) : tkt.coverUrl?.startsWith('blob:') || tkt.coverUrl?.startsWith('data:') ? (
                          <span className="rounded bg-rose-600/90 text-white text-[8px] font-bold px-1.5 py-0.5 tracking-wider uppercase shadow flex items-center gap-1 w-max">
                            Cover Unsaved
                          </span>
                        ) : (
                          <span className="rounded bg-gray-600/90 text-white text-[8px] font-bold px-1.5 py-0.5 tracking-wider uppercase shadow flex items-center gap-1 w-max">
                            Preset Template
                          </span>
                        )}
                      </div>
                      
                      {/* DELETE ICON BUTTON */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTicketToDelete(tkt.id);
                        }}
                        className="absolute top-3 right-3 z-10 rounded-lg p-1.5 bg-black/60 hover:bg-red-600 border border-white/10 text-gray-400 hover:text-white transition-all shadow"
                        title="Delete Ticket Premiere"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>

                      <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                        <span className="rounded bg-sky-deep/80 text-white text-[9px] font-semibold px-2 py-0.5">
                          GH₵{tkt.price.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-gray-300 font-mono flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gold" />
                          {tkt.date}
                        </span>
                      </div>
                    </div>

                    {/* CONTENT */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-white text-base group-hover:text-gold-light transition-colors">{tkt.title}</h4>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{tkt.description}</p>
                      </div>

                      {/* SALES PROGRESS */}
                      <div className="mt-4 pt-4 border-t border-white/5 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-gray-400">Tickets Sold</span>
                          <span className="text-white font-bold">{sold} / {tkt.totalQuantity}</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-gradient-to-r from-sky-deep to-gold"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT ONE COL: RECENT SALES FEED */}
        <div className="space-y-6">
          {/* PAYSTACK SPLIT PAYOUT BANK SETUP CARD */}
          <div className="rounded-2xl glass-panel p-5 border border-gold/15 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h4 className="font-display text-sm font-black text-white flex items-center gap-2">
                <Percent className="h-4 w-4 text-gold" />
                80/20 Payout Subaccount
              </h4>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${bankSubaccount ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'bg-gold/15 text-gold border border-gold/25'}`}>
                {bankSubaccount ? 'ACTIVE' : 'PENDING'}
              </span>
            </div>

            {bankSubaccount && !isEditingSubaccount ? (
              <div className="space-y-3.5 animate-fadeIn">
                <p className="text-xs text-gray-400 leading-relaxed">
                  Automatic split is configured. When buyers purchase tickets, <strong className="text-gold">80%</strong> will go directly to your registered bank account below, and <strong className="text-sky-light">20%</strong> to the platform.
                </p>

                <div className="rounded-xl bg-white/5 border border-white/5 p-3.5 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Subaccount Code</span>
                    <span className="font-mono font-bold text-white">{bankSubaccount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Recipient Bank</span>
                    <span className="font-bold text-gray-200">
                      {bankList.find(b => b.code === user.settlementBank)?.name || user.settlementBank || 'Connected Bank'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Account Number</span>
                    <span className="font-mono text-gray-200">••••{user.accountNumber?.slice(-4) || '••••'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Registered Name</span>
                    <span className="font-semibold text-gray-200">{user.businessName || user.companyName || user.name}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditingSubaccount(true)}
                  className="w-full rounded-xl border border-white/10 hover:border-white/25 hover:bg-white/5 py-2 text-xs font-semibold text-gray-300 hover:text-white transition-all"
                >
                  Edit Payout Settlement Bank
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateSubaccount} className="space-y-3 animate-fadeIn">
                <p className="text-xs text-gray-400 leading-normal">
                  Configure your business bank details below to automatically receive 80% of ticket revenues directly via Paystack split-checkout.
                </p>

                {subaccountError && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-2.5 text-[11px] text-red-400 font-medium">
                    ⚠️ {subaccountError}
                  </div>
                )}

                {subaccountSuccess && (
                  <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-[11px] text-emerald-400 font-medium">
                    ✓ {subaccountSuccess}
                  </div>
                )}

                <div className="space-y-2 text-xs">
                  {/* COUNTRY SELECT */}
                  <div>
                    <label className="block text-gray-400 mb-1 font-semibold">Settlement Currency & Bank Location</label>
                    <select
                      value={setupCountry}
                      onChange={(e) => setSetupCountry(e.target.value as 'GHS' | 'NGN')}
                      disabled={showVerificationInput || isLoadingBanks}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-gold outline-none font-medium disabled:opacity-50"
                    >
                      <option value="GHS">Ghana (GHS / GH₵)</option>
                      <option value="NGN">Nigeria (NGN / ₦)</option>
                    </select>
                  </div>

                  {/* BUSINESS NAME */}
                  <div>
                    <label className="block text-gray-400 mb-1 font-semibold">Recipient / Business Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Silverbird Cinemas"
                      value={setupBusinessName}
                      onChange={(e) => setSetupBusinessName(e.target.value)}
                      disabled={showVerificationInput}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-gold outline-none disabled:opacity-50"
                    />
                  </div>

                  {/* SETTLEMENT BANK DROPDOWN */}
                  <div>
                    <label className="block text-gray-400 mb-1 font-semibold">Select Settlement Bank</label>
                    <select
                      required
                      value={setupBankCode}
                      onChange={(e) => setSetupBankCode(e.target.value)}
                      disabled={isLoadingBanks || showVerificationInput}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-gold outline-none disabled:opacity-50"
                    >
                      {isLoadingBanks ? (
                        <option>Loading banks list...</option>
                      ) : bankList.length === 0 ? (
                        <option>No banks found</option>
                      ) : (
                        bankList.map(bank => (
                          <option key={bank.code} value={bank.code}>{bank.name}</option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* ACCOUNT NUMBER */}
                  <div>
                    <label className="block text-gray-400 mb-1 font-semibold">Bank Account / Momo Number</label>
                    <input
                      type="text"
                      required
                      pattern="[0-9]+"
                      maxLength={20}
                      placeholder="e.g. 0244123456 or 10200456789"
                      value={setupAccountNumber}
                      onChange={(e) => setSetupAccountNumber(e.target.value.replace(/\D/g, ''))}
                      disabled={showVerificationInput}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:border-gold outline-none disabled:opacity-50"
                    />
                    {user.phoneNumber && !user.accountNumber && (
                      <p className="text-[11px] text-gold/95 mt-1 leading-normal flex items-center gap-1 font-sans font-medium">
                        ✓ Automatically prefilled with your registered phone number for payouts.
                      </p>
                    )}
                  </div>
                </div>

                {/* SECURE VERIFICATION CODE INPUT BLOCK */}
                {showVerificationInput && (
                  <div className="rounded-xl bg-gold/5 border border-gold/25 p-3.5 space-y-3 animate-fadeIn mt-3">
                    <div className="text-xs font-semibold text-gold flex items-center gap-1.5 uppercase font-mono tracking-wider">
                      <span>🔒 Secure Account Verification</span>
                    </div>
                    <p className="text-[11px] text-gray-300 leading-normal">
                      For your security, a 4-digit confirmation code has been sent to your email: <strong className="text-white">{user.email}</strong>. Please enter the code below to authorize changing your payout settlement account.
                    </p>
                    
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono uppercase text-gray-400">4-Digit Security Code</label>
                      <input
                        type="text"
                        maxLength={4}
                        required
                        placeholder="e.g. 1234"
                        value={userEnteredCode}
                        onChange={(e) => setUserEnteredCode(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-slate-950 border border-gold/30 rounded-xl px-3 py-2.5 text-center font-mono text-xl tracking-widest text-gold font-bold focus:border-gold outline-none"
                      />
                      <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                        <span>Didn't receive the email?</span>
                        <button
                          type="button"
                          onClick={handleResendCode}
                          disabled={resendCooldown > 0}
                          className="text-gold hover:underline font-medium text-[11px] disabled:opacity-50"
                        >
                          {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
                        </button>
                      </div>
                    </div>

                    {verificationError && (
                      <div className="text-[11px] text-red-400 font-medium text-center font-mono">
                        ⚠️ {verificationError}
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-2 flex gap-2">
                  {bankSubaccount && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingSubaccount(false);
                        setShowVerificationInput(false);
                        setGeneratedCode('');
                        setUserEnteredCode('');
                        setVerificationError('');
                      }}
                      className="flex-1 rounded-xl border border-white/10 hover:bg-white/5 py-2 text-xs font-semibold text-gray-400 transition-all"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmittingSubaccount || isLoadingBanks || (showVerificationInput && userEnteredCode.length < 4)}
                    className="flex-1 rounded-xl bg-gold hover:bg-yellow-500 py-2.5 text-xs font-bold text-slate-950 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(251,191,36,0.15)]"
                  >
                    {isSubmittingSubaccount ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5 text-slate-950" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Saving account changes...</span>
                      </>
                    ) : (
                      <span>{showVerificationInput ? "Verify & Save Changes" : "Register & Link Account"}</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-gold-light flex items-center gap-2">
                <Tickets className="h-4.5 w-4.5 text-gold" />
                Admissions Feed
              </h3>
              <span className="text-[10px] text-gray-400 font-mono font-semibold">LIVE FEED</span>
            </div>

          <div className="rounded-2xl glass-panel p-4 border border-gold/10 space-y-4 max-h-[500px] overflow-y-auto">
            {purchases.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-500">
                No tickets purchased yet. Share your movie premier ticket on the marketplace!
              </div>
            ) : (
              purchases.map((pur) => (
                <div key={pur.id} className="rounded-xl bg-white/5 border border-white/5 p-3 flex flex-col justify-between hover:bg-white/10 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] text-sky-light font-mono font-bold block truncate max-w-[150px]">
                        {pur.movieTitle}
                      </span>
                      <span className="text-xs text-white font-bold block mt-0.5">{pur.buyerName}</span>
                      <span className="text-[10px] text-gray-400 block">{pur.buyerEmail}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-gold-light block">
                        +GH₵{pur.producerEarning.toLocaleString()}
                      </span>
                      <span className="text-[8px] text-gray-500 block font-mono">
                        SHARE (80%)
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[9px] font-mono text-gray-500">
                    <span>Ref: {pur.paystackRef.substring(0, 15)}...</span>
                    <span>{new Date(pur.purchasedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* DIRECT CUSTOMER SUPPORT INFO BANNER */}
      <div className="mt-8">
        <EmbeddedSupportCard />
      </div>
    </div>
  </div>
  );
}
