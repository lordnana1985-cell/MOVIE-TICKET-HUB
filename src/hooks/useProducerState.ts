import { useState, useCallback, useEffect, FormEvent } from 'react';
import { UserProfile, MovieTicket, TicketPurchase } from '../types';
import { db } from '../lib/db';
import { logger } from '../lib/logger';
import { useBankList } from './useBankList';
import { useSubaccountVerification } from './useSubaccountVerification';

interface UseProducerStateProps {
  user: UserProfile;
  initialTickets?: MovieTicket[];
  initialPurchases?: TicketPurchase[];
  onTicketCreated?: () => void;
}

export function useProducerState({
  user,
  initialTickets,
  initialPurchases,
  onTicketCreated = () => {},
}: UseProducerStateProps) {
  const [tickets, setTickets] = useState<MovieTicket[]>(initialTickets || []);
  const [purchases, setPurchases] = useState<TicketPurchase[]>(initialPurchases || []);
  const [isCreating, setIsCreating] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Currency & subaccount setup
  const [setupCountry, setSetupCountry] = useState<'GHS' | 'NGN'>('GHS');
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
      const result = await db.registerProducerSubaccount(user.id, {
        businessName: setupBusinessName,
        settlementBank: setupBankCode,
        accountNumber: setupAccountNumber,
        primaryContactEmail: user.email,
      });

      if (result.success && result.subaccountCode) {
        setBankSubaccount(result.subaccountCode);
        setSubaccountSuccess(`Subaccount registered successfully: ${result.subaccountCode}`);
        setIsEditingSubaccount(false);
        onTicketCreated();
      } else {
        setSubaccountError(result.message || 'Failed to create subaccount.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error.';
      setSubaccountError(message);
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
        } catch (err: unknown) {
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

  const handleDeleteTicket = async (ticketId: string) => {
    setIsDeleting(ticketId);
    setError('');
    setSuccess('');
    try {
      await db.deleteTicket(ticketId);
      setSuccess('Event ticket deleted successfully.');
      setTicketToDelete(null);
      await loadProducerData();
      onTicketCreated();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete event ticket.';
      logger.error('Failed to delete ticket', 'ProducerDashboard', err);
      setError(message);
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to clear event tickets.';
      logger.error('Failed to clear tickets', 'ProducerDashboard', err);
      setError(message);
    } finally {
      setIsClearingAll(false);
    }
  };

  const totalSalesCount = purchases.length;
  const totalGrossRevenue = purchases.reduce((acc, p) => acc + p.amountPaid, 0);
  const producerShare = purchases.reduce((acc, p) => acc + p.producerEarning, 0);
  const hubShare = purchases.reduce((acc, p) => acc + p.hubEarning, 0);

  return {
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
  };
}
