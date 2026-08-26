import { describe, it, expect } from 'vitest';
import {
  subaccountSchema,
  paymentInitializeSchema,
  verificationCodeSchema,
  movieTicketSchema,
  ticketPurchaseSchema,
} from './schemas';

describe('Zod Validation Schemas', () => {
  describe('subaccountSchema', () => {
    it('validates correct subaccount data', () => {
      const valid = {
        business_name: 'Silverbird Cinemas',
        settlement_bank: 'MTN',
        account_number: '0240000000',
        primary_contact_email: 'producer@silverbird.com',
      };
      const result = subaccountSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects invalid email or short account number', () => {
      const invalid = {
        business_name: 'S',
        settlement_bank: '',
        account_number: '123',
        primary_contact_email: 'not-an-email',
      };
      const result = subaccountSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('paymentInitializeSchema', () => {
    it('validates correct payment init payload', () => {
      const valid = {
        email: 'customer@test.com',
        amount: 100,
        subaccount_code: 'ACCT_12345',
        callback_url: 'https://example.com/callback',
      };
      const result = paymentInitializeSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects zero or negative amounts', () => {
      const invalid = {
        email: 'customer@test.com',
        amount: -5,
      };
      const result = paymentInitializeSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('verificationCodeSchema', () => {
    it('validates verification code payloads', () => {
      const valid = {
        email: 'user@example.com',
        code: '123456',
        purpose: 'password_reset',
      };
      const result = verificationCodeSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe('movieTicketSchema', () => {
    it('validates correct movie ticket object', () => {
      const valid = {
        id: 't-1',
        title: 'Black Panther: Wakanda Forever',
        description: 'Action thriller in Wakanda',
        price: 70,
        date: '2026-10-01',
        time: '20:00',
        venue: 'Silverbird Cinemas',
        producerId: 'prod-1',
        producerName: 'Marvel Studios',
        totalQuantity: 150,
        availableQuantity: 150,
        coverUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1',
        category: 'movie' as const,
      };
      const result = movieTicketSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe('ticketPurchaseSchema', () => {
    it('validates valid ticket purchase structure', () => {
      const valid = {
        id: 'p-100',
        ticketId: 't-1',
        movieTitle: 'Black Panther',
        buyerId: 'b-1',
        buyerName: 'Ama Serwaa',
        buyerEmail: 'ama@gmail.com',
        amountPaid: 70,
        producerEarning: 56,
        hubEarning: 14,
        purchasedAt: '2026-08-16T12:00:00Z',
        status: 'unused' as const,
      };
      const result = ticketPurchaseSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });
});
