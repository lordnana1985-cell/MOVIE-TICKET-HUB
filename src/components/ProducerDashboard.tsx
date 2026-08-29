import { useState, useEffect, useCallback, FormEvent } from 'react';
import { Film, Trash2 } from 'lucide-react';
import { UserProfile, MovieTicket, TicketPurchase } from '../types';
import { db } from '../lib/db';
import { logger } from '../lib/logger';
import { useBankList } from '../hooks/useBankList';
import { useSubaccountVerification } from '../hooks/useSubaccountVerification';
import { EmbeddedSupportCard } from './CustomerSupport';
import TicketForm from './producer/TicketForm';
import MetricsOverview from './producer/MetricsOverview';
import SubaccountSetup from './producer/SubaccountSetup';
import SalesFeed from './producer/SalesFeed';
import ProducerTicketCard from './producer/ProducerTicketCard';
import ClearAllModal from './producer/ClearAllModal';
import ProducerHeader from './producer/ProducerHeader';

interface ProducerDashboardProps {
  user: UserProfile;
  tickets?: MovieTicket[];
  purchases?: TicketPurchase[];
  onTicketCreated?: () => void;
  setActiveTab?: (tab: 'marketplace' | 'producer_dashboard' | 'gate_auth') => void;
  onOpenGateScanner?: () => void;
}

export default function ProducerDashboard({
  user,
  tickets: initialTickets,
  purchases: initialPurchases,
  onTicketCreated = () => {},
  setActiveTab,
  onOpenGateScanner,
}: ProducerDashboardProps) {
  const [tickets, setTickets] = useState<MovieTicket[]>(initialTickets || []);
  const [purchases, setPurchases] = useState<TicketPurchase[]>(initialPurchases || []);
  const [isCreating, setIsCreating] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form Country
  const [setupCountry, setSetupCountry] = useState<'GHS' | 'NGN'>('GHS');

  // Paystack subaccount configuration states & hooks
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

  const {
    userEnteredCode,
    setUserEnteredCode,
    showVerificationInput,
    verificationError,
    resendCooldown,
    initiateVerification,
    resendVerificationCode,
    verifyEnteredCode,
    resetVerification,
  } = useSubaccountVerification();

  const [isSubmittingSubaccount, setIsSubmittingSubaccount] = useState(false);
  const [subaccountError, setSubaccountError] = useState('');
  const [subaccountSuccess, setSubaccountSuccess] = useState('');
  const [isEditingSubaccount, setIsEditingSubaccount] = useState(!user.paystackSubaccountCode);

  // Form Fields
  const [setupBusinessName, setSetupBusinessName] = useState(
    user.businessName || user.companyName || user.name || ''
  );
  const [setupAccountNumber, setSetupAccountNumber] = useState(
    user.accountNumber || user.phoneNumber || ''
  );

  const handleResendCode = async () => {
    const code = await resendVerificationCode(user.email);
    if (code) {
      setSubaccountSuccess(`Verification code resent to ${user.email}.`);
    }
  };

  const handleCreateSubaccount = async (e: FormEvent) => {
    e.preventDefault();
    setSubaccountError('');
    setSubaccountSuccess('');

    // Check if updating existing subaccount
    if (bankSubaccount && !showVerificationInput) {
      await initiateVerification(user.email);
      return;
    }

    if (showVerificationInput) {
      const isValid = verifyEnteredCode();
      if (!isValid) return;
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

  const loadProducerData = useCallback(async () => {
    try {
      const allTickets = await db.getTickets();
      const myTickets = allTickets.filter((t) => t.producerId === user.id);
      setTickets(myTickets);

      const myPurchases = await db.getPurchasesForProducer(user.id);
      setPurchases(myPurchases);
    } catch (e: unknown) {
      logger.error('Error loading producer dashboard data', 'ProducerDashboard', e);
    }
  }, [user.id]);

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
        } catch (err) {
          logger.error(
            'Failed to auto-generate default demo subaccount for producer',
            'ProducerDashboard',
            err
          );
        }
      };
      autoGenerate();
    }
  }, [user, onTicketCreated, loadProducerData]);

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
      <ProducerHeader
        user={user}
        isCreating={isCreating}
        onToggleCreating={() => setIsCreating(!isCreating)}
        onOpenGateScanner={
          onOpenGateScanner || (setActiveTab ? () => setActiveTab('gate_auth') : undefined)
        }
      />

      {(error || success) && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold ${
            error
              ? 'bg-red-950/60 border-red-500/30 text-red-300'
              : 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
          }`}
        >
          {error || success}
        </div>
      )}

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
                type="button"
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
              resetVerification();
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
