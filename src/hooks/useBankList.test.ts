import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBankList, DEFAULT_GH_BANKS } from './useBankList';

describe('useBankList Hook', () => {
  const mockFetchedBanks = [
    { name: 'Access Bank', code: '044' },
    { name: 'Zenith Bank', code: '057' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with default Ghanaian banks and selected code', () => {
    const { result } = renderHook(() => useBankList({ enabled: false }));

    expect(result.current.bankList).toEqual(DEFAULT_GH_BANKS);
    expect(result.current.selectedBankCode).toBe(DEFAULT_GH_BANKS[0].code);
    expect(result.current.isLoading).toBe(false);
  });

  it('successfully fetches and updates bank list from API', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: true,
        data: mockFetchedBanks,
      }),
    } as Response);

    const { result } = renderHook(() => useBankList({ currency: 'NGN', enabled: true }));

    await act(async () => {
      await result.current.reloadBanks();
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/paystack/banks?currency=NGN');
    expect(result.current.bankList).toEqual(mockFetchedBanks);
    expect(result.current.selectedBankCode).toBe('044');
    expect(result.current.error).toBeNull();
  });

  it('falls back gracefully on network error without clearing default banks', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useBankList({ currency: 'GHS', enabled: true }));

    await act(async () => {
      await result.current.reloadBanks();
    });

    expect(result.current.bankList).toEqual(DEFAULT_GH_BANKS);
    expect(result.current.error).toContain('Unable to fetch live bank list');
    expect(result.current.isLoading).toBe(false);
  });
});
