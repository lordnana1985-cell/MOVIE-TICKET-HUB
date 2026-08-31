import { Film, Trash2 } from 'lucide-react';
import { UserProfile, MovieTicket, TicketPurchase } from '../types';
import { EmbeddedSupportCard } from './CustomerSupport';
import TicketForm from './producer/TicketForm';
import MetricsOverview from './producer/MetricsOverview';
import SubaccountSetup from './producer/SubaccountSetup';
import SalesFeed from './producer/SalesFeed';
import ProducerTicketCard from './producer/ProducerTicketCard';
import ClearAllModal from './producer/ClearAllModal';
import ProducerHeader from './producer/ProducerHeader';
import { useProducerState } from '../hooks/useProducerState';

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
  const {
    tickets,
    purchases,
    isCreating,
    setIsCreating,
    ticketToDelete,
    setTicketToDelete,
    isDeleting,
    showClearAllConfirm,
    setShowClearAllConfirm,
    isClearingAll,
    error,
    success,
    setupCountry,
    setSetupCountry,
    bankSubaccount,
    bankList,
    isLoadingBanks,
    setupBankCode,
    setSetupBankCode,
    userEnteredCode,
    setUserEnteredCode,
    showVerificationInput,
    verificationError,
    resendCooldown,
    resetVerification,
    isSubmittingSubaccount,
    subaccountError,
    subaccountSuccess,
    isEditingSubaccount,
    setIsEditingSubaccount,
    setupBusinessName,
    setSetupBusinessName,
    setupAccountNumber,
    setSetupAccountNumber,
    handleResendCode,
    handleCreateSubaccount,
    loadProducerData,
    handleDeleteTicket,
    handleClearAllTickets,
    totalSalesCount,
    totalGrossRevenue,
    producerShare,
    hubShare,
  } = useProducerState({
    user,
    initialTickets,
    initialPurchases,
    onTicketCreated,
  });

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
