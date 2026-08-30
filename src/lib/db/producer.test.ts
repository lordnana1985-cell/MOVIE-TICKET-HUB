import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createPaystackSubaccount, registerProducerSubaccount } from './producer';
import * as profilesModule from './profiles';

describe('Producer Database Module Unit Tests', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('successfully creates paystack subaccount and returns code', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: true,
        message: 'Subaccount created',
        data: { subaccount_code: 'ACCT_TEST_CODE_123', percentage_charge: 20 },
      }),
    } as any);

    const result = await createPaystackSubaccount({
      businessName: 'Ghana Cinema Hub',
      settlementBank: 'MTN',
      accountNumber: '0240000000',
      primaryContactEmail: 'producer@cinema.com',
    });

    expect(result.success).toBe(true);
    expect(result.subaccountCode).toBe('ACCT_TEST_CODE_123');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/paystack/subaccount',
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  it('handles server rejection responses with error message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        status: false,
        message: 'Account number is invalid for specified bank',
      }),
    } as any);

    const result = await createPaystackSubaccount({
      businessName: 'Accra Productions',
      settlementBank: 'GCB',
      accountNumber: '123',
      primaryContactEmail: 'producer@accra.com',
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain('Account number is invalid');
  });

  it('handles network throw gracefully without crashing', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network connection timeout'));

    const result = await createPaystackSubaccount({
      businessName: 'Apex Film Works',
      settlementBank: 'MTN',
      accountNumber: '0241234567',
      primaryContactEmail: 'apex@films.com',
    });

    expect(result.success).toBe(false);
    expect(result.message).toBeDefined();
  });

  it('registers producer subaccount and updates user profile in DB', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: true,
        data: { subaccount_code: 'ACCT_PRODUCER_999' },
      }),
    } as any);

    const updateProfileSpy = vi.spyOn(profilesModule, 'updateUserProfile').mockResolvedValue({
      id: 'producer-42',
      email: 'organizer@hub.com',
      name: 'Organizer',
      role: 'producer',
      balance: 0,
      paystackSubaccountCode: 'ACCT_PRODUCER_999',
    } as any);

    const result = await registerProducerSubaccount('producer-42', {
      businessName: 'Studio 42',
      settlementBank: 'VODAFONE',
      accountNumber: '0209998888',
      primaryContactEmail: 'organizer@hub.com',
    });

    expect(result.success).toBe(true);
    expect(result.subaccountCode).toBe('ACCT_PRODUCER_999');
    expect(updateProfileSpy).toHaveBeenCalledWith('producer-42', {
      paystackSubaccountCode: 'ACCT_PRODUCER_999',
      settlementBank: 'VODAFONE',
      accountNumber: '0209998888',
      businessName: 'Studio 42',
    });
  });
});
