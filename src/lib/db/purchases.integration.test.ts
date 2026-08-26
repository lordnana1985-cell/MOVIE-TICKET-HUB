import { describe, it, expect, beforeEach } from 'vitest';
import {
  purchaseTicket,
  getPurchasesForBuyer,
  getPurchasesForProducer,
  authenticateTicket,
  getGateLogs,
} from './purchases';
import { createTicket, getTickets } from './tickets';
import { registerUser, getUserProfile } from './profiles';
import { MovieTicket, TicketPurchase } from '../../types';

describe('Purchases & Ticketing End-to-End Integration Flow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('runs complete lifecycle: producer registers -> creates ticket -> buyer purchases -> passes gate auth', async () => {
    // 1. Producer signs up
    const producer = await registerUser({
      id: 'prod-integration-01',
      email: 'producer@africacinema.com',
      name: 'Kofi Mensah',
      role: 'producer',
      companyName: 'Golden Coast Studios',
      settlementBank: 'MTN Mobile Money',
      accountNumber: '0241234567',
    });
    expect(producer.id).toBe('prod-integration-01');

    // 2. Producer publishes ticket premiere
    const movie: MovieTicket = {
      id: 'tkt-premiere-01',
      title: 'The Legend of Okomfo',
      description: 'An epic historical drama set in the ancient Ashanti Kingdom.',
      price: 80,
      date: '2026-11-20',
      time: '19:00',
      venue: 'National Theatre, Accra',
      trailerUrl: 'https://youtube.com/watch?v=sample',
      producerId: producer.id,
      producerName: producer.name,
      totalQuantity: 250,
      availableQuantity: 250,
      coverUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1',
      createdAt: new Date().toISOString(),
      category: 'movie',
    };
    await createTicket(movie);

    const activeTickets = await getTickets();
    const published = activeTickets.find((t) => t.id === 'tkt-premiere-01');
    expect(published).toBeDefined();
    expect(published?.availableQuantity).toBe(250);

    // 3. Buyer purchases a ticket
    const purchasePayload: TicketPurchase = {
      id: 'PUR-INT-OKOMFO-888',
      ticketId: 'tkt-premiere-01',
      movieTitle: 'The Legend of Okomfo',
      movieCoverUrl: movie.coverUrl,
      buyerId: 'buyer-ama-01',
      buyerName: 'Ama Serwaa',
      buyerEmail: 'ama.serwaa@example.com',
      amountPaid: 80,
      producerEarning: 64, // 80%
      hubEarning: 16, // 20%
      paystackRef: 'PSTK_REF_99887766',
      purchasedAt: new Date().toISOString(),
      status: 'unused',
    };

    const confirmedPurchase = await purchaseTicket(purchasePayload);
    expect(confirmedPurchase.id).toBe('PUR-INT-OKOMFO-888');

    // 4. Verify buyer history
    const buyerPurchases = await getPurchasesForBuyer('buyer-ama-01');
    expect(buyerPurchases.length).toBe(1);
    expect(buyerPurchases[0].id).toBe('PUR-INT-OKOMFO-888');
    expect(buyerPurchases[0].status).toBe('unused');

    // 5. Verify producer dashboard & balance credited
    const producerPurchases = await getPurchasesForProducer(producer.id);
    expect(producerPurchases.length).toBe(1);
    expect(producerPurchases[0].amountPaid).toBe(80);

    const producerUpdated = await getUserProfile(producer.id);
    expect(producerUpdated?.balance).toBe(64);

    // 6. Verify inventory decreased
    const inventoryTickets = await getTickets();
    const updatedTicket = inventoryTickets.find((t) => t.id === 'tkt-premiere-01');
    expect(updatedTicket?.availableQuantity).toBe(249);

    // 7. Gatekeeper scans and authenticates ticket at venue entrance
    const authResult1 = await authenticateTicket('PUR-INT-OKOMFO-888');
    expect(authResult1.success).toBe(true);
    expect(authResult1.message).toContain('Ticket Authenticated successfully');
    expect(authResult1.purchase?.status).toBe('used');

    // 8. Fraud / Duplicate entrance check
    const authResult2 = await authenticateTicket('PUR-INT-OKOMFO-888');
    expect(authResult2.success).toBe(false);
    expect(authResult2.message).toContain('already USED');

    // 9. Inspect audit gate logs
    const gateLogs = await getGateLogs(producer.id);
    expect(gateLogs.length).toBeGreaterThanOrEqual(2);
    expect(gateLogs.some((l) => l.status === 'success')).toBe(true);
    expect(gateLogs.some((l) => l.status === 'already_used')).toBe(true);
  });
});
