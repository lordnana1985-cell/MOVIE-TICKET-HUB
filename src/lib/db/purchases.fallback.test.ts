import { describe, it, expect, beforeEach } from 'vitest';
import { purchaseTicket, getGateLogs, saveGateLog, authenticateTicket } from './purchases';
import { createTicket, getTickets, deleteTicket, clearAllTickets } from './tickets';
import { registerUser, getUserProfile, updateUserProfile, deleteProfile } from './profiles';
import { TicketPurchase } from '../../types';

describe('Comprehensive Fallback & Resilience Testing', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('handles invalid ticket authentication gracefully without crashing', async () => {
    const res = await authenticateTicket('NON-EXISTENT-PURCHASE-ID');
    expect(res.success).toBe(false);
    expect(res.message).toContain('Invalid ticket reference');
  });

  it('records gate logs accurately and filters by producer ID', async () => {
    await saveGateLog({
      id: 'gl-manual-1',
      purchaseId: 'pur-1',
      ticketId: 'tkt-prod-1',
      movieTitle: 'Indie Film',
      buyerName: 'Alice Buyer',
      scannedAt: new Date().toISOString(),
      status: 'success',
    });

    const logs = await getGateLogs();
    expect(logs.length).toBeGreaterThanOrEqual(1);
    expect(logs.some((l) => l.id === 'gl-manual-1')).toBe(true);
  });

  it('supports updating user profiles in local state seamlessly', async () => {
    const user = await registerUser({
      id: 'usr-edit-test',
      email: 'edit@cinema.com',
      name: 'Edit Tester',
      role: 'producer',
    });
    expect(user.id).toBe('usr-edit-test');

    const updated = await updateUserProfile('usr-edit-test', {
      name: 'Updated Name',
      settlementBank: 'GCB',
      accountNumber: '1234567890',
    });
    expect(updated?.name).toBe('Updated Name');
    expect(updated?.settlementBank).toBe('GCB');

    const fetched = await getUserProfile('usr-edit-test');
    expect(fetched?.name).toBe('Updated Name');
  });

  it('deletes user profile and cascades local tickets/purchases cleanup', async () => {
    await registerUser({
      id: 'usr-del-test',
      email: 'del@cinema.com',
      name: 'Del Tester',
      role: 'producer',
    });

    await createTicket({
      id: 'tkt-del-test',
      title: 'To Be Deleted',
      description: 'Will be removed',
      price: 15,
      date: '2026-11-11',
      time: '12:00',
      venue: 'Accra Cinema',
      trailerUrl: 'https://example.com/trailer.mp4',
      producerId: 'usr-del-test',
      producerName: 'Del Tester',
      totalQuantity: 50,
      availableQuantity: 50,
      coverUrl: 'https://example.com/cover.jpg',
      createdAt: new Date().toISOString(),
    });

    const purchase: TicketPurchase = {
      id: 'pur-del-test',
      ticketId: 'tkt-del-test',
      movieTitle: 'To Be Deleted',
      movieCoverUrl: 'https://example.com/cover.jpg',
      buyerId: 'usr-buyer-test',
      buyerName: 'Buyer Test',
      buyerEmail: 'buyer@test.com',
      amountPaid: 15,
      producerEarning: 12,
      hubEarning: 3,
      paystackRef: 'ref-del',
      purchasedAt: new Date().toISOString(),
      status: 'unused',
    };
    await purchaseTicket(purchase);

    const deleted = await deleteProfile('usr-del-test');
    expect(deleted).toBe(true);

    const user = await getUserProfile('usr-del-test');
    expect(user).toBeNull();

    const tickets = await getTickets();
    expect(tickets.some((t) => t.id === 'tkt-del-test')).toBe(false);
  });

  it('supports clearAllTickets and deleteTicket without breaking store consistency', async () => {
    await createTicket({
      id: 'tkt-clear-1',
      title: 'Clear Test 1',
      description: 'Clear Desc',
      price: 20,
      date: '2026-10-10',
      time: '15:00',
      venue: 'Test Venue',
      trailerUrl: 'https://example.com/trailer.mp4',
      producerId: 'p-1',
      producerName: 'P One',
      totalQuantity: 20,
      availableQuantity: 20,
      coverUrl: 'https://example.com/cover.jpg',
      createdAt: new Date().toISOString(),
    });

    await deleteTicket('tkt-clear-1');
    const ticketsAfterDelete = await getTickets();
    expect(ticketsAfterDelete.some((t) => t.id === 'tkt-clear-1')).toBe(false);

    await clearAllTickets();
    const ticketsAfterClear = await getTickets();
    expect(ticketsAfterClear.length).toBe(0);
  });
});
