import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import ProducerDashboard from './ProducerDashboard';
import { UserProfile } from '../types';
import { db } from '../lib/db';

vi.mock('../lib/db', () => ({
  db: {
    getTickets: vi.fn(),
    getPurchasesForProducer: vi.fn(),
    generatePaystackSubaccount: vi.fn(),
    updateUserProfile: vi.fn(),
    deleteTicket: vi.fn(),
    clearAllTickets: vi.fn(),
  },
}));

describe('ProducerDashboard Component', () => {
  const mockUser: UserProfile = {
    id: 'prod-123',
    email: 'producer@cinema.com',
    role: 'producer',
    name: 'Producer Name',
    companyName: 'Cinema Pro',
    businessName: 'Cinema Pro Ltd',
    settlementBank: '044',
    accountNumber: '1234567890',
    paystackSubaccountCode: 'ACCT_test123',
    balance: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ status: true, data: [{ name: 'Access Bank', code: '044' }] }),
    }) as any;

    (db.getTickets as any).mockResolvedValue([
      {
        id: 'tkt-1',
        title: 'Premiere Night',
        description: 'Exclusive first screening',
        price: 120,
        date: '2026-10-15',
        time: '19:00',
        venue: 'Silverbird Cinemas',
        trailerUrl: 'https://youtube.com/watch?v=123',
        totalQuantity: 100,
        availableQuantity: 80,
        producerId: 'prod-123',
        producerName: 'Cinema Pro',
        coverUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba',
        createdAt: '2026-01-01T00:00:00Z',
        isLocalOnly: false,
      },
    ]);
    (db.getPurchasesForProducer as any).mockResolvedValue([
      {
        id: 'pur-1',
        ticketId: 'tkt-1',
        movieTitle: 'Premiere Night',
        movieCoverUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba',
        buyerId: 'buyer-1',
        buyerName: 'Jane Smith',
        buyerEmail: 'jane@example.com',
        amountPaid: 240,
        producerEarning: 192,
        hubEarning: 48,
        purchasedAt: '2026-01-02T12:00:00Z',
        paystackRef: 'REF123456789',
        status: 'unused',
      },
    ]);
  });

  it('loads and displays producer dashboard with metrics and tickets', async () => {
    render(
      <ProducerDashboard
        user={mockUser}
        onTicketCreated={vi.fn()}
        setActiveTab={vi.fn()}
      />
    );

    expect(screen.getByText(/Event Organiser/i)).toBeInTheDocument();
    expect(screen.getByText(/Gate Ticket Verifier/i)).toBeInTheDocument();
    expect(screen.getByText(/Generate Event Ticket/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText('Premiere Night').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/240/).length).toBeGreaterThanOrEqual(1);
    });
  });
});
