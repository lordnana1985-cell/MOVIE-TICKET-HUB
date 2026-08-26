import { describe, it, expect } from 'vitest';
import {
  supabaseInsertPurchase,
  supabaseGetPurchasesForBuyer,
  supabaseGetPurchasesForProducer,
  supabaseInsertGateLog,
  supabaseGetPurchaseById,
  supabaseUpdatePurchaseStatus,
  supabaseGetGateLogs,
} from './purchases.supabase';

describe('Supabase Purchases Layer (Unit Fallback & Operations)', () => {
  it('returns graceful fallbacks when Supabase client is unconfigured or returns empty', async () => {
    const buyerPurchases = await supabaseGetPurchasesForBuyer('buyer-test');
    expect(Array.isArray(buyerPurchases)).toBe(true);

    const producerPurchases = await supabaseGetPurchasesForProducer(['tkt-test']);
    expect(Array.isArray(producerPurchases)).toBe(true);

    const purchase = await supabaseGetPurchaseById('pur-non-existent');
    expect(purchase === null || typeof purchase === 'object').toBe(true);

    const logs = await supabaseGetGateLogs();
    expect(Array.isArray(logs)).toBe(true);
  });

  it('handles safe stub calls without throwing unexpected fatal errors', async () => {
    await expect(
      supabaseInsertPurchase({
        id: 'pur-unit-1',
        ticketId: 'tkt-unit-1',
        movieTitle: 'Unit Test Show',
        movieCoverUrl: 'https://example.com/cover.jpg',
        buyerId: 'buyer-1',
        buyerName: 'Unit Buyer',
        buyerEmail: 'unit@buyer.com',
        amountPaid: 20,
        producerEarning: 16,
        hubEarning: 4,
        paystackRef: 'ref-unit-1',
        purchasedAt: new Date().toISOString(),
        status: 'unused',
      })
    ).resolves.not.toThrow();

    await expect(
      supabaseInsertGateLog({
        id: 'gl-unit-1',
        purchaseId: 'pur-unit-1',
        ticketId: 'tkt-unit-1',
        movieTitle: 'Unit Test Show',
        buyerName: 'Unit Buyer',
        scannedAt: new Date().toISOString(),
        status: 'success',
      })
    ).resolves.not.toThrow();

    await expect(
      supabaseUpdatePurchaseStatus('pur-unit-1', 'used', new Date().toISOString())
    ).resolves.not.toThrow();
  });
});
