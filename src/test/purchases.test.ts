import { describe, it, expect, beforeEach, vi } from 'vitest';
import { purchaseTicket, getPurchasesForBuyer, getPurchasesForProducer, authenticateTicket, saveGateLog, getGateLogs } from '../lib/db/purchases';
import { createTicket } from '../lib/db/tickets';
import { MovieTicket, TicketPurchase, GateLog } from '../types';

describe('purchases db module', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const sampleTicket: MovieTicket = {
    id: 'tkt-test-purchase',
    title: 'Concert Premiere',
    description: 'Live performance',
    price: 200,
    date: '2026-09-15',
    time: '19:00',
    venue: 'Accra International Conference Centre',
    trailerUrl: 'https://youtube.com/test',
    producerId: 'prod-456',
    producerName: 'Music Producer',
    totalQuantity: 100,
    availableQuantity: 100,
    coverUrl: 'https://images.unsplash.com/test',
    createdAt: new Date().toISOString(),
    category: 'music'
  };

  const samplePurchase: TicketPurchase = {
    id: 'purch-12345',
    ticketId: 'tkt-test-purchase',
    movieTitle: 'Concert Premiere',
    movieCoverUrl: 'https://images.unsplash.com/test',
    buyerId: 'buyer-789',
    buyerName: 'Jane Buyer',
    buyerEmail: 'buyer@example.com',
    amountPaid: 200,
    producerEarning: 160,
    hubEarning: 40,
    paystackRef: 'pstk_ref_12345',
    purchasedAt: new Date().toISOString(),
    status: 'unused'
  };

  it('records a purchase with 80/20 revenue split calculations', async () => {
    await createTicket(sampleTicket);
    const recorded = await purchaseTicket(samplePurchase);

    expect(recorded).toBeDefined();
    expect(recorded.amountPaid).toBe(200);
    expect(recorded.producerEarning).toBe(160);
    expect(recorded.hubEarning).toBe(40);
    expect(recorded.status).toBe('unused');
  });

  it('retrieves purchases for a specific buyer', async () => {
    await createTicket(sampleTicket);
    await purchaseTicket({
      ...samplePurchase,
      id: 'purch-buyer-1',
      buyerId: 'buyer-abc'
    });

    const buyerPurchases = await getPurchasesForBuyer('buyer-abc');
    expect(buyerPurchases.length).toBe(1);
    expect(buyerPurchases[0].buyerId).toBe('buyer-abc');
  });

  it('retrieves purchases for a producer', async () => {
    await createTicket(sampleTicket);
    await purchaseTicket({
      ...samplePurchase,
      id: 'purch-prod-1'
    });

    const producerPurchases = await getPurchasesForProducer('prod-456');
    expect(producerPurchases.length).toBe(1);
    expect(producerPurchases[0].ticketId).toBe('tkt-test-purchase');
  });

  it('authenticates tickets and logs gate scans', async () => {
    await createTicket(sampleTicket);
    await purchaseTicket({
      ...samplePurchase,
      id: 'purch-gate-test',
      status: 'unused'
    });

    const validResult = await authenticateTicket('purch-gate-test');
    expect(validResult.success).toBe(true);
    expect(validResult.purchase?.status).toBe('used');

    // Second scan of same ticket should indicate already used
    const secondResult = await authenticateTicket('purch-gate-test');
    expect(secondResult.success).toBe(false);
    expect(secondResult.message).toContain('already USED');
  });

  it('records gate logs correctly', async () => {
    const log: GateLog = {
      id: 'gl_test_1',
      purchaseId: 'purch-12345',
      ticketId: 'tkt-test-purchase',
      movieTitle: 'Concert Premiere',
      buyerName: 'Jane Buyer',
      scannedAt: new Date().toISOString(),
      status: 'success'
    };

    await saveGateLog(log);
    const logs = await getGateLogs();
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].id).toBe('gl_test_1');
  });
});
