import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import SalesFeed from './SalesFeed';
import { TicketPurchase } from '../../types';

describe('SalesFeed Component', () => {
  it('renders empty message when no purchases exist', () => {
    render(<SalesFeed purchases={[]} />);
    expect(screen.getByText(/No tickets purchased yet/i)).toBeInTheDocument();
  });

  it('renders admissions list when purchases are present', () => {
    const mockPurchases: TicketPurchase[] = [
      {
        id: 'pur-1',
        ticketId: 'tkt-1',
        movieTitle: 'Cinema Premier Alpha',
        movieCoverUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba',
        buyerId: 'buyer-1',
        buyerName: 'Alice Green',
        buyerEmail: 'alice@example.com',
        amountPaid: 100,
        producerEarning: 80,
        hubEarning: 20,
        purchasedAt: new Date('2026-01-01T12:00:00Z').toISOString(),
        paystackRef: 'T_REF_123456789ABCDEF',
        status: 'unused',
      },
    ];

    render(<SalesFeed purchases={mockPurchases} />);
    expect(screen.getByText(/Cinema Premier Alpha/i)).toBeInTheDocument();
    expect(screen.getByText(/Alice Green/i)).toBeInTheDocument();
    expect(screen.getByText(/\+GH₵80/i)).toBeInTheDocument();
    expect(screen.getByText(/SHARE \(80%\)/i)).toBeInTheDocument();
  });
});
