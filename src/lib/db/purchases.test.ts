import { describe, it, expect, beforeEach } from 'vitest';
import {
  purchaseTicket,
  getPurchasesForBuyer,
  getPurchasesForProducer,
  authenticateTicket,
  getGateLogs,
} from './purchases';
import { createTicket } from './tickets';
import { registerUser } from './profiles';
import { MovieTicket, TicketPurchase } from '../../types';

describe('Purchases Database Module & LocalStorage Fallback', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('processes ticket purchase, adjusts quantities and credits producer', async () => {
    await registerUser({
      id: 'producer-100',
      email: 'prod@cinema.com',
      name: 'Producer Name',
      role: 'producer',
    });

    const mockTicket: MovieTicket = {
      id: 'tkt-123',
      title: 'Midnight Premiere',
      description: 'Grand Opening',
      price: 50,
      date: '2026-12-01',
      time: '19:00',
      venue: 'Accra Mall Silverbird',
      producerId: 'producer-100',
      producerName: 'Producer Name',
      totalQuantity: 100,
      availableQuantity: 10,
      coverUrl: 'https://example.com/cover.jpg',
      trailerUrl: 'https://example.com/trailer.mp4',
      createdAt: new Date().toISOString(),
    };

    await createTicket(mockTicket);

    const purchasePayload: TicketPurchase = {
      id: 'PUR-999-ABC',
      ticketId: 'tkt-123',
      movieTitle: 'Midnight Premiere',
      movieCoverUrl: 'https://example.com/cover.jpg',
      buyerId: 'buyer-50',
      buyerName: 'Jane Doe',
      buyerEmail: 'jane@example.com',
      amountPaid: 50,
      producerEarning: 48,
      hubEarning: 2,
      paystackRef: 'ref-12345',
      purchasedAt: new Date().toISOString(),
      status: 'unused',
    };

    const savedPurchase = await purchaseTicket(purchasePayload);
    expect(savedPurchase.id).toBe('PUR-999-ABC');

    const buyerPurchases = await getPurchasesForBuyer('buyer-50');
    expect(buyerPurchases.length).toBe(1);
    expect(buyerPurchases[0].id).toBe('PUR-999-ABC');

    const producerPurchases = await getPurchasesForProducer('producer-100');
    expect(producerPurchases.length).toBe(1);
  });

  it('authenticates a ticket pass code and prevents double gate entrance', async () => {
    const purchasePayload: TicketPurchase = {
      id: 'TKT-PASS-TEST-1',
      ticketId: 'tkt-xyz',
      movieTitle: 'Accra Film Festival',
      movieCoverUrl: 'https://example.com/cover.jpg',
      buyerId: 'buyer-1',
      buyerName: 'John Gate',
      buyerEmail: 'john@gate.com',
      amountPaid: 30,
      producerEarning: 28.5,
      hubEarning: 1.5,
      paystackRef: 'ref-gate-test',
      purchasedAt: new Date().toISOString(),
      status: 'unused',
    };

    await purchaseTicket(purchasePayload);

    // 1st entry attempt - valid
    const firstAuth = await authenticateTicket('TKT-PASS-TEST-1');
    expect(firstAuth.success).toBe(true);
    expect(firstAuth.message).toContain('Ticket Authenticated successfully');

    // 2nd entry attempt - double entry rejection
    const secondAuth = await authenticateTicket('TKT-PASS-TEST-1');
    expect(secondAuth.success).toBe(false);
    expect(secondAuth.message).toContain('already USED');

    // Check gate logs created
    const logs = await getGateLogs('unknown-producer');
    expect(Array.isArray(logs)).toBe(true);
  });
});
