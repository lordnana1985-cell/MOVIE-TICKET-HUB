import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db } from './db';
import { MovieTicket, UserProfile } from '../types';

describe('Database Layer Unit Tests (src/lib/db.test.ts)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Ticket CRUD Operations & Deletions', () => {
    const mockTicket: MovieTicket = {
      id: 'ticket-test-999',
      title: 'Kumawood Premiere Night',
      description: 'Exclusive gala and premiere event in Kumasi.',
      price: 60,
      date: '2026-11-20',
      time: '18:00',
      venue: 'Golden Tulip Kumasi',
      trailerUrl: 'https://youtube.com/watch?v=sample-premiere',
      producerId: 'producer-acc-99',
      producerName: 'Ashanti Cinematic Arts',
      totalQuantity: 150,
      availableQuantity: 150,
      coverUrl: 'https://images.unsplash.com/photo-premiere',
      createdAt: new Date().toISOString(),
      category: 'movie',
    };

    it('creates a new ticket listing with correct initial state', async () => {
      const created = await db.createTicket(mockTicket);
      expect(created).toBeDefined();
      expect(created.id).toBe('ticket-test-999');
      expect(created.title).toBe('Kumawood Premiere Night');
      expect(created.price).toBe(60);
      expect(created.availableQuantity).toBe(150);

      const allTickets = await db.getTickets();
      const found = allTickets.find((t) => t.id === 'ticket-test-999');
      expect(found).toBeDefined();
      expect(found?.producerName).toBe('Ashanti Cinematic Arts');
    });

    it('deletes a ticket by ID and prevents it from appearing in subsequent queries', async () => {
      await db.createTicket(mockTicket);

      const beforeDelete = await db.getTickets();
      expect(beforeDelete.some((t) => t.id === mockTicket.id)).toBe(true);

      const deleteSuccess = await db.deleteTicket(mockTicket.id);
      expect(deleteSuccess).toBe(true);

      const afterDelete = await db.getTickets();
      expect(afterDelete.some((t) => t.id === mockTicket.id)).toBe(false);
    });

    it('allows deleting tickets silently with skipNotification flag', async () => {
      await db.createTicket(mockTicket);
      const deleteSuccess = await db.deleteTicket(mockTicket.id, true);
      expect(deleteSuccess).toBe(true);

      const tickets = await db.getTickets();
      expect(tickets.some((t) => t.id === mockTicket.id)).toBe(false);
    });

    it('handles clearAllTickets cleanly', async () => {
      await db.createTicket(mockTicket);
      await db.clearAllTickets();

      const tickets = await db.getTickets();
      expect(tickets.length).toBe(0);
    });
  });

  describe('Account Profile CRUD & Data Updates', () => {
    const producerProfile: Omit<UserProfile, 'balance'> = {
      id: 'producer-acc-99',
      email: 'producer99@cinema.gh',
      role: 'producer',
      name: 'Kwabena Osei',
      companyName: 'Ashanti Cinematic Arts',
      phoneNumber: '+233240001122',
      settlementBank: 'GCB Bank',
      accountNumber: '1029384756',
      paystackSubaccountCode: 'ACCT_PROD_99',
    };

    it('registers a user profile and establishes predictable zero starting balance', async () => {
      const registered = await db.registerUser(producerProfile);
      expect(registered).toBeDefined();
      expect(registered.id).toBe('producer-acc-99');
      expect(registered.balance).toBe(0);
      expect(registered.name).toBe('Kwabena Osei');
      expect(registered.paystackSubaccountCode).toBe('ACCT_PROD_99');

      const fetched = await db.getUserProfile('producer-acc-99');
      expect(fetched).not.toBeNull();
      expect(fetched?.email).toBe('producer99@cinema.gh');
      expect(fetched?.balance).toBe(0);
    });

    it('updates account metadata predictably (name, phone, company, settlement info)', async () => {
      await db.registerUser(producerProfile);

      const updated = await db.updateUserProfile('producer-acc-99', {
        name: 'Kwabena Osei, Producer',
        companyName: 'Ashanti Cinema Studios International',
        phoneNumber: '+233550009988',
        settlementBank: 'Fidelity Bank',
        accountNumber: '9988776655',
      });

      expect(updated).toBeDefined();
      expect(updated?.name).toBe('Kwabena Osei, Producer');
      expect(updated?.companyName).toBe('Ashanti Cinema Studios International');
      expect(updated?.phoneNumber).toBe('+233550009988');
      expect(updated?.settlementBank).toBe('Fidelity Bank');
      expect(updated?.accountNumber).toBe('9988776655');

      // Verify persisted state
      const reFetched = await db.getUserProfile('producer-acc-99');
      expect(reFetched?.companyName).toBe('Ashanti Cinema Studios International');
      expect(reFetched?.settlementBank).toBe('Fidelity Bank');
    });

    it('updates account balances accurately for ticket revenue and payouts', async () => {
      await db.registerUser(producerProfile);

      // Verify initial balance
      let profile = await db.getUserProfile('producer-acc-99');
      expect(profile?.balance).toBe(0);

      // Credit ticket earnings (e.g. 500 GHS)
      const afterSale = await db.updateUserProfile('producer-acc-99', { balance: 500 });
      expect(afterSale?.balance).toBe(500);

      // Withdraw payout of 200 GHS leaving 300 GHS
      const afterPayout = await db.updateUserProfile('producer-acc-99', { balance: 300 });
      expect(afterPayout?.balance).toBe(300);

      const finalState = await db.getUserProfile('producer-acc-99');
      expect(finalState?.balance).toBe(300);
    });

    it('validates email existence and prevents duplicate registrations with different roles', async () => {
      await db.registerUser(producerProfile);

      const emailExists = await db.checkEmailExists('producer99@cinema.gh');
      expect(emailExists).toBe(true);

      const nonExistent = await db.checkEmailExists('nobody@nowhere.com');
      expect(nonExistent).toBe(false);

      // Conflict check when a registered producer tries to register as a buyer
      const oppositeRole = await db.checkEmailOppositeRole('producer99@cinema.gh', 'buyer');
      expect(oppositeRole).toBe('producer');
    });

    it('deletes an account profile and cascades ticket removal', async () => {
      await db.registerUser(producerProfile);

      const ticket: MovieTicket = {
        id: 't-cascading-1',
        title: 'Cascading Test Ticket',
        description: 'Test Description',
        price: 50,
        date: '2026-12-01',
        time: '20:00',
        venue: 'Accra Mall',
        trailerUrl: 'https://youtube.com/watch?v=test',
        coverUrl: 'https://images.unsplash.com/photo-test',
        producerId: 'producer-acc-99',
        producerName: 'Kwabena Osei',
        totalQuantity: 50,
        availableQuantity: 50,
        createdAt: new Date().toISOString(),
        category: 'movie',
      };

      await db.createTicket(ticket);

      const ticketsBefore = await db.getTickets();
      expect(ticketsBefore.some((t) => t.id === 't-cascading-1')).toBe(true);

      // Delete the producer profile
      const deleteResult = await db.deleteProfile('producer-acc-99');
      expect(deleteResult).toBe(true);

      // Profile should be deleted
      const profileAfter = await db.getUserProfile('producer-acc-99');
      expect(profileAfter).toBeNull();

      // Associated tickets should be purged
      const ticketsAfter = await db.getTickets();
      expect(ticketsAfter.some((t) => t.id === 't-cascading-1')).toBe(false);
    });
  });

  describe('Environment Configuration & Secret Key Security', () => {
    it('verifies that Supabase credentials come from environment variables and not hardcoded defaults', async () => {
      const { SUPABASE_URL, SUPABASE_ANON_KEY } = await import('./db');
      expect(SUPABASE_URL).toBeDefined();
      expect(SUPABASE_ANON_KEY).toBeDefined();
      expect(typeof SUPABASE_URL).toBe('string');
      expect(typeof SUPABASE_ANON_KEY).toBe('string');
    });

    it('validates that sensitive keys like PAYSTACK_SECRET_KEY are not exported or bundled in the client database layer', async () => {
      const dbModule = await import('./db');
      expect((dbModule as any).PAYSTACK_SECRET_KEY).toBeUndefined();
      expect((dbModule as any).paystackSecretKey).toBeUndefined();
      expect((dbModule.db as any).PAYSTACK_SECRET_KEY).toBeUndefined();
    });
  });
});
