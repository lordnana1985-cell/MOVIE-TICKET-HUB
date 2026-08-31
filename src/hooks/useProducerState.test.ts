import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProducerState } from './useProducerState';
import { db } from '../lib/db';
import { UserProfile } from '../types';

describe('useProducerState Hook', () => {
  const mockUser: UserProfile = {
    id: 'prod_123',
    name: 'Test Producer',
    email: 'producer@movieticket.com',
    role: 'producer',
    balance: 5000,
    paystackSubaccountCode: 'ACCT_PROD_999',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes default state and calculates revenue shares properly', () => {
    const initialPurchases = [
      {
        id: 'purch_1',
        ticketId: 'tkt_1',
        movieTitle: 'Cinema Alpha',
        movieCoverUrl: '',
        buyerId: 'b_1',
        buyerName: 'Buyer 1',
        buyerEmail: 'buyer1@test.com',
        amountPaid: 100,
        producerEarning: 80,
        hubEarning: 20,
        paystackRef: 'ref_1',
        purchasedAt: new Date().toISOString(),
        status: 'unused' as const,
      },
    ];

    const { result } = renderHook(() =>
      useProducerState({
        user: mockUser,
        initialTickets: [],
        initialPurchases,
      })
    );

    expect(result.current.totalSalesCount).toBe(1);
    expect(result.current.totalGrossRevenue).toBe(100);
    expect(result.current.producerShare).toBe(80);
    expect(result.current.hubShare).toBe(20);
    expect(result.current.bankSubaccount).toBe('ACCT_PROD_999');
  });

  it('handles ticket deletion smoothly', async () => {
    const deleteTicketSpy = vi.spyOn(db, 'deleteTicket').mockResolvedValue(true);
    const getTicketsSpy = vi.spyOn(db, 'getTickets').mockResolvedValue([]);
    const getPurchasesSpy = vi.spyOn(db, 'getPurchasesForProducer').mockResolvedValue([]);
    const onTicketCreated = vi.fn();

    const { result } = renderHook(() =>
      useProducerState({
        user: mockUser,
        initialTickets: [],
        onTicketCreated,
      })
    );

    await act(async () => {
      await result.current.handleDeleteTicket('tkt_to_delete');
    });

    expect(deleteTicketSpy).toHaveBeenCalledWith('tkt_to_delete');
    expect(result.current.success).toBe('Event ticket deleted successfully.');
    expect(onTicketCreated).toHaveBeenCalled();

    deleteTicketSpy.mockRestore();
    getTicketsSpy.mockRestore();
    getPurchasesSpy.mockRestore();
  });
});
