import { useState, useEffect, useCallback } from 'react';
import { logger } from '../lib/logger';

export interface BankItem {
  name: string;
  code: string;
  id?: number | string;
  [key: string]: unknown;
}

export const DEFAULT_GH_BANKS: BankItem[] = [
  { name: 'MTN Mobile Money', code: 'MTN' },
  { name: 'Telecel Cash', code: 'VOD' },
  { name: 'AirtelTigo Money', code: 'ATL' },
  { name: 'GCB Bank', code: '040100' },
  { name: 'Ecobank Ghana', code: '130100' },
  { name: 'Zenith Bank Ghana', code: '180100' },
  { name: 'Guaranty Trust Bank Ghana', code: '210100' },
  { name: 'Fidelity Bank Ghana', code: '240100' },
];

export interface UseBankListOptions {
  currency?: string;
  enabled?: boolean;
  initialBanks?: BankItem[];
}

export interface UseBankListResult {
  bankList: BankItem[];
  isLoading: boolean;
  error: string | null;
  selectedBankCode: string;
  setSelectedBankCode: (code: string) => void;
  reloadBanks: () => Promise<void>;
}

export function useBankList(options: UseBankListOptions = {}): UseBankListResult {
  const { currency = 'GHS', enabled = true, initialBanks = DEFAULT_GH_BANKS } = options;

  const [bankList, setBankList] = useState<BankItem[]>(initialBanks);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBankCode, setSelectedBankCode] = useState<string>(
    initialBanks.length > 0 ? initialBanks[0].code : 'MTN'
  );

  const fetchBanks = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/paystack/banks?currency=${currency}`);
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const result = await res.json();
      if (result.status && Array.isArray(result.data) && result.data.length > 0) {
        setBankList(result.data);
        if (!selectedBankCode || !result.data.some((b: BankItem) => b.code === selectedBankCode)) {
          setSelectedBankCode(result.data[0].code);
        }
      }
    } catch (err: unknown) {
      logger.error('Failed to load banks', 'useBankList', err);
      setError('Unable to fetch live bank list, using offline defaults.');
    } finally {
      setIsLoading(false);
    }
  }, [currency, enabled, selectedBankCode]);

  useEffect(() => {
    fetchBanks();
  }, [currency, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    bankList,
    isLoading,
    error,
    selectedBankCode,
    setSelectedBankCode,
    reloadBanks: fetchBanks,
  };
}
