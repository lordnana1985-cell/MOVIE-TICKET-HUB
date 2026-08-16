import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db } from '../lib/db';
import { MovieTicket, UserProfile, TicketPurchase } from '../types';

describe('Database Layer - Core Data Operations & Predictable State', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Ticket CRUD Operations', () => {
    const testTicket: MovieTicket = {
      id: 'ticket-cinema-101',
      title: 'Midnight in Accra',
      description: 'Exclusive screening event at Silverbird Cinemas',
      price: 75,
      date: '2026-10-15',
      time: '19:30',
      venue: 'Silverbird Cinemas, Accra Mall',
      trailerUrl: 'https://youtube.com/watch?v=sample-trailer',
      producerId: 'producer-gh-01',
      producerName: 'Gold Coast Films',
      totalQuantity: 100,
      availableQuantity: 100,
      coverUrl: 'https://images.unsplash.com/photo-sample',
      createdAt: new Date().toISOString(),
      category: 'movie'
    };

    it('should create and retrieve a new movie ticket', async () => {
      const created = await db.createTicket(testTicket);
      expect(created.id).toBe('ticket-cinema-101');
      expect(created.title).toBe('Midnight in Accra');
      expect(created.price).toBe(75);
      expect(created.availableQuantity).toBe(100);

      const allTickets = await db.getTickets();
      const match = allTickets.find(t => t.id === 'ticket-cinema-101');
      expect(match).toBeDefined();
      expect(match?.producerName).toBe('Gold Coast Films');
      expect(match?.category).toBe('movie');
    });

    it('should delete a ticket and ensure it is removed from active listings', async () => {
      await db.createTicket(testTicket);
      
      const beforeDelete = await db.getTickets();
      expect(beforeDelete.some(t => t.id === testTicket.id)).toBe(true);

      const deleteResult = await db.deleteTicket(testTicket.id);
      expect(deleteResult).toBe(true);

      const afterDelete = await db.getTickets();
      expect(afterDelete.some(t => t.id === testTicket.id)).toBe(false);
    });

    it('should clear all tickets and simulations completely', async () => {
      await db.createTicket(testTicket);
      await db.clearAllTickets();

      const tickets = await db.getTickets();
      expect(tickets.length).toBe(0);
    });
  });

  describe('Account Validation & Profile Management', () => {
    const producerProfile: Omit<UserProfile, 'balance'> = {
      id: 'producer-gh-01',
      email: 'organizer@accraevents.com',
      role: 'producer',
      name: 'Kofi Mensah',
      companyName: 'Accra Premier Events',
      phoneNumber: '+233241234567',
      settlementBank: 'MTN',
      accountNumber: '0241234567',
      paystackSubaccountCode: 'SUB_TEST_001'
    };

    const buyerProfile: Omit<UserProfile, 'balance'> = {
      id: 'buyer-gh-02',
      email: 'fan@ghanafilm.com',
      role: 'buyer',
      name: 'Ama Serwaa',
      phoneNumber: '+233209876543'
    };

    it('should register a new account with a zero starting balance', async () => {
      const created = await db.registerUser(producerProfile);
      expect(created.id).toBe('producer-gh-01');
      expect(created.email).toBe('organizer@accraevents.com');
      expect(created.balance).toBe(0);
      expect(created.paystackSubaccountCode).toBe('SUB_TEST_001');

      const fetched = await db.getUserProfile('producer-gh-01');
      expect(fetched).toBeDefined();
      expect(fetched?.name).toBe('Kofi Mensah');
      expect(fetched?.role).toBe('producer');
      expect(fetched?.balance).toBe(0);
    });

    it('should accurately validate email existence', async () => {
      await db.registerUser(producerProfile);

      const existsExact = await db.checkEmailExists('organizer@accraevents.com');
      expect(existsExact).toBe(true);

      const existsCaseInsensitive = await db.checkEmailExists('ORGANIZER@ACCRAEVENTS.COM');
      expect(existsCaseInsensitive).toBe(true);

      const notExists = await db.checkEmailExists('nonexistent@example.com');
      expect(notExists).toBe(false);
    });

    it('should detect opposite role collisions for same email', async () => {
      await db.registerUser(producerProfile);

      // Same email is already registered as 'producer', so checking for buyer should flag opposite role
      const oppositeRole = await db.checkEmailOppositeRole('organizer@accraevents.com', 'buyer');
      expect(oppositeRole).toBe('producer');

      // Checking for the same role should return null
      const sameRole = await db.checkEmailOppositeRole('organizer@accraevents.com', 'producer');
      expect(sameRole).toBe(null);
    });

    it('should validate user login matching or role transitions', async () => {
      await db.registerUser(buyerProfile);

      const loggedIn = await db.loginUser('fan@ghanafilm.com', 'buyer');
      expect(loggedIn).toBeDefined();
      expect(loggedIn?.id).toBe('buyer-gh-02');
      expect(loggedIn?.role).toBe('buyer');

      const invalidLogin = await db.loginUser('unknown@ghanafilm.com', 'buyer');
      expect(invalidLogin).toBe(null);
    });
  });

  describe('Balance Updates & Financial State', () => {
    const producerAccount: Omit<UserProfile, 'balance'> = {
      id: 'producer-fin-01',
      email: 'finance@ghanafilm.com',
      role: 'producer',
      name: 'Kwame Finance',
      companyName: 'Ghana Film Guild'
    };

    it('should update and persist user balance incrementally and reliably', async () => {
      await db.registerUser(producerAccount);

      // Initial balance check
      let profile = await db.getUserProfile('producer-fin-01');
      expect(profile?.balance).toBe(0);

      // Simulate revenue addition from ticket sales (e.g. 5 tickets @ 50 GHS = 250 GHS)
      const updated = await db.updateUserProfile('producer-fin-01', {
        balance: 250
      });
      expect(updated?.balance).toBe(250);

      // Verify updated balance in persistence
      profile = await db.getUserProfile('producer-fin-01');
      expect(profile?.balance).toBe(250);

      // Simulate payout withdrawal of 100 GHS leaving 150 GHS balance
      const afterWithdrawal = await db.updateUserProfile('producer-fin-01', {
        balance: 150
      });
      expect(afterWithdrawal?.balance).toBe(150);

      const finalCheck = await db.getUserProfile('producer-fin-01');
      expect(finalCheck?.balance).toBe(150);
    });
  });

  describe('Cascading Account Deletion & Cleanup', () => {
    it('should delete a producer account and cascade-delete their tickets predictably', async () => {
      const prodId = 'prod-to-delete-01';
      await db.registerUser({
        id: prodId,
        email: 'temp.producer@studios.com',
        role: 'producer',
        name: 'Temp Producer'
      });

      const ticket1: MovieTicket = {
        id: 't-temp-1',
        title: 'Temp Movie 1',
        description: 'Screening 1',
        price: 50,
        date: '2026-11-01',
        time: '18:00',
        venue: 'Cinema 1',
        trailerUrl: 'https://youtube.com/watch?v=temp1',
        coverUrl: 'https://images.unsplash.com/photo-temp1',
        producerId: prodId,
        producerName: 'Temp Producer',
        totalQuantity: 20,
        availableQuantity: 20,
        createdAt: new Date().toISOString(),
        category: 'movie'
      };

      await db.createTicket(ticket1);

      // Verify ticket exists
      const ticketsBefore = await db.getTickets();
      expect(ticketsBefore.some(t => t.id === 't-temp-1')).toBe(true);

      // Delete the producer profile
      const deleted = await db.deleteProfile(prodId);
      expect(deleted).toBe(true);

      // Verify profile is gone
      const profileAfter = await db.getUserProfile(prodId);
      expect(profileAfter).toBe(null);

      // Verify producer tickets were purged
      const ticketsAfter = await db.getTickets();
      expect(ticketsAfter.some(t => t.id === 't-temp-1')).toBe(false);
    });
  });
});
