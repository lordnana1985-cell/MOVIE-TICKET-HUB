import React, { useState, useEffect, FormEvent } from 'react';
import { Plus, Film, ArrowRight, Trash2, Phone } from 'lucide-react';
import { UserProfile, MovieTicket, TicketPurchase } from '../types';
import { db } from '../lib/db';
import { logger } from '../lib/logger';
import { useBankList } from '../hooks/useBankList';
import { EmbeddedSupportCard } from './CustomerSupport';
import TicketForm from './producer/TicketForm';
import MetricsOverview from './producer/MetricsOverview';
import SubaccountSetup from './producer/SubaccountSetup';
import SalesFeed from './producer/SalesFeed';
import ProducerTicketCard from './producer/ProducerTicketCard';
import ClearAllModal from './producer/ClearAllModal';

interface ProducerDashboardProps {
  user: UserProfile;
  onTicketCreated: () => void;
  setActiveTab: (tab: 'marketplace' | 'producer_dashboard' | 'gate_auth') => void;
}

export default function ProducerDashboard({
  user,
  onTicketCreated,
  setActiveTab,
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

  // Form Country
  const [setupCountry, setSetupCountry] = useState<'GHS' | 'NGN'>('GHS');

  // Paystack subaccount configuration states & hook
  const [bankSubaccount, setBankSubaccount] = useState<string | undefined>(
    user.paystackSubaccountCode
  );

  const {
    bankList,
    isLoading: isLoadingBanks,
    selectedBankCode: setupBankCode,
    setSelectedBankCode: setSetupBankCode,
  } = useBankList({
    currency: setupCountry,
    enabled: true,
  });

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
      const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Form Fields
  const [setupBusinessName, setSetupBusinessName] = useState(
    user.businessName || user.companyName || user.name || ''
  );
  const [setupAccountNumber, setSetupAccountNumber] = useState(
    user.accountNumber || user.phoneNumber || ''
  );

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
          purpose: 'payout_account_change_resend',
        }),
      });
      setSubaccountSuccess(`Verification code resent to ${user.email}.`);
    } catch (err) {
      logger.error('Failed to resend verification code email', 'ProducerDashboard', err);
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

      try {
        await fetch('/api/send-verification-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            code,
            purpose: 'payout_account_change',
          }),
        });
      } catch (err) {
        logger.error('Failed to dispatch verification code email', 'ProducerDashboard', err);
      }
      return;
    }

    if (showVerificationInput) {
      if (userEnteredCode !== generatedCode) {
        setVerificationError(
          'Invalid 4-digit verification code. Please confirm the code sent to your email.'
        );
        return;
      }
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
          primary_contact_email: user.email,
        }),
      });

      const result = await res.json();

      if (result.status && result.data?.subaccount_code) {
        const code = result.data.subaccount_code;
        await db.updateUserProfile(user.id, {
          paystackSubaccountCode: code,
          settlementBank: setupBankCode,
          accountNumber: setupAccountNumber,
          businessName: setupBusinessName,
        });

        setBankSubaccount(code);
        setSubaccountSuccess(`Subaccount registered successfully: ${code}`);
        setIsEditingSubaccount(false);
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

  const loadProducerData = async () => {
    try {
      const allTickets = await db.getTickets();
      const myTickets = allTickets.filter((t) => t.producerId === user.id);
      setTickets(myTickets);

      const myPurchases = await db.getPurchasesForProducer(user.id);
      setPurchases(myPurchases);
    } catch (e: unknown) {
      logger.error('Error loading producer dashboard data', 'ProducerDashboard', e);
    }
  };

  useEffect(() => {
    loadProducerData();

    if (!user.paystackSubaccountCode) {
      const autoGenerate = async () => {
        try {
          const code = await db.generatePaystackSubaccount(user);
          if (code) {
            setBankSubaccount(code);
            setIsEditingSubaccount(false);
            onTicketCreated();
          }
        } catch (err: unknown) {
          logger.error(
            'Auto generation of Paystack subaccount on dashboard mount failed',
            'ProducerDashboard',
            err
          );
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
      setTickets((prev) => prev.filter((t) => t.id !== id));
      await db.deleteTicket(id);
      setSuccess('Event ticket deleted successfully!');
      setTicketToDelete(null);
      await loadProducerData();
      onTicketCreated();
    } catch (err: any) {
      logger.error('Failed to delete ticket', 'ProducerDashboard', err);
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
      onTicketCreated();
    } catch (err: any) {
      logger.error('Failed to clear tickets', 'ProducerDashboard', err);
      setError(err?.message || 'Failed to clear event tickets.');
    } finally {
      setIsClearingAll(false);
    }
  };

  // Calculations
  const totalSalesCount = purchases.length;
  const totalGrossRevenue = purchases.reduce((acc, p) => acc + p.amountPaid, 0);
  const producerShare = purchases.reduce((acc, p) => acc + p.producerEarning, 0); // 80%
  const hubShare = purchases.reduce((acc, p) => acc + p.hubEarning, 0); // 20%

  return (
    <div className="space-y-8 animate-fadeIn" id="producer-dashboard-container">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <span className="text-xs font-mono tracking-widest text-gold font-semibold uppercase">
            {user.companyName || 'Event Production'} Organiser Portal
          </span>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-white mt-1">
            Event Organiser{' '}
            <span className="bg-gradient-to-r from-sky-light to-sky-deep bg-clip-text text-transparent">
              Console
            </span>
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Manage your event tickets, upload trailers/covers, generate tickets, and view real-time
            earnings.
          </p>
          {user.phoneNumber && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gold/10 border border-gold/20 px-3.5 py-2 text-xs text-gold font-mono">
              <Phone className="h-3.5 w-3.5 text-gold-light animate-pulse" />
              <span>
                Payout Phone: <strong className="text-white font-sans">{user.phoneNumber}</strong>
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('gate_auth')}
            className="rounded-xl glass-panel px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-all border border-white/15 shadow-md flex items-center gap-2 cursor-pointer"
            id="gate-verifier-nav-btn"
          >
            Gate Ticket Verifier
            <ArrowRight className="h-4 w-4 text-gold" />
          </button>

          <button
            onClick={() => setIsCreating(!isCreating)}
            className="rounded-xl bg-gradient-to-r from-gold to-gold-dark px-5 py-3 text-sm font-bold text-black hover:brightness-105 shadow-lg shadow-gold/10 transition-all flex items-center gap-2 cursor-pointer"
            id="producer-add-ticket-btn"
          >
            <Plus className="h-4 w-4 stroke-[3px]" />
            Generate Event Ticket
          </button>
        </div>
      </div>

      {/* OVERALL EARNINGS & SALES SUMMARY */}
      <MetricsOverview
        totalGrossRevenue={totalGrossRevenue}
        producerShare={producerShare}
        hubShare={hubShare}
        totalSalesCount={totalSalesCount}
      />

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
                  className="rounded-xl border border-red-500/30 hover:border-red-500 hover:bg-red-500/10 text-red-400 hover:text-white px-3 py-1.5 text-[11px] font-bold font-mono flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Clear all generated tickets across all organisers"
                  id="clear-all-tickets-btn"
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

          <ClearAllModal
            isOpen={showClearAllConfirm}
            isClearing={isClearingAll}
            onCancel={() => setShowClearAllConfirm(false)}
            onConfirm={handleClearAllTickets}
          />

          {tickets.length === 0 ? (
            <div className="rounded-2xl glass-panel p-10 text-center border border-white/5">
              <Film className="h-10 w-10 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400 text-sm font-medium">
                You haven't generated any event premier tickets yet.
              </p>
              <button
                onClick={() => setIsCreating(true)}
                className="mt-4 rounded-xl border border-gold/30 hover:border-gold text-gold px-4 py-2 text-xs font-semibold hover:bg-gold/10 transition-all cursor-pointer"
              >
                Generate Your First Ticket
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tickets.map((tkt) => {
                const sold = purchases.filter((p) => p.ticketId === tkt.id).length;

                return (
                  <ProducerTicketCard
                    key={tkt.id}
                    ticket={tkt}
                    soldCount={sold}
                    isConfirmingDelete={ticketToDelete === tkt.id}
                    isDeleting={isDeleting === tkt.id}
                    onPromptDelete={(id) => setTicketToDelete(id)}
                    onCancelDelete={() => setTicketToDelete(null)}
                    onConfirmDelete={(id) => handleDeleteTicket(id)}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT ONE COL: RECENT SALES FEED & SUBACCOUNT SETUP */}
        <div className="space-y-6">
          <SubaccountSetup
            user={user}
            bankSubaccount={bankSubaccount}
            bankList={bankList}
            isLoadingBanks={isLoadingBanks}
            isSubmittingSubaccount={isSubmittingSubaccount}
            subaccountError={subaccountError}
            subaccountSuccess={subaccountSuccess}
            isEditingSubaccount={isEditingSubaccount}
            setIsEditingSubaccount={setIsEditingSubaccount}
            setupCountry={setupCountry}
            setSetupCountry={setSetupCountry}
            setupBusinessName={setupBusinessName}
            setSetupBusinessName={setSetupBusinessName}
            setupBankCode={setupBankCode}
            setSetupBankCode={setSetupBankCode}
            setupAccountNumber={setupAccountNumber}
            setSetupAccountNumber={setSetupAccountNumber}
            showVerificationInput={showVerificationInput}
            userEnteredCode={userEnteredCode}
            setUserEnteredCode={setUserEnteredCode}
            verificationError={verificationError}
            resendCooldown={resendCooldown}
            handleResendCode={handleResendCode}
            handleCreateSubaccount={handleCreateSubaccount}
            onCancelEdit={() => {
              setIsEditingSubaccount(false);
              setShowVerificationInput(false);
              setGeneratedCode('');
              setUserEnteredCode('');
              setVerificationError('');
            }}
          />

          <SalesFeed purchases={purchases} />
        </div>
      </div>

      {/* DIRECT CUSTOMER SUPPORT INFO BANNER */}
      <div className="mt-8">
        <EmbeddedSupportCard />
      </div>
    </div>
  );
}
