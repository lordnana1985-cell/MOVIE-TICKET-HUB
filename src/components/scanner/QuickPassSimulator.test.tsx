import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QuickPassSimulator from './QuickPassSimulator';
import { TicketPurchase } from '../../types';

describe('QuickPassSimulator Component', () => {
  const mockPurchases: TicketPurchase[] = [
    {
      id: 'TKT-1001-ALPHA',
      ticketId: 't1',
      buyerId: 'b1',
      buyerName: 'Ama Serwaa',
      buyerEmail: 'ama@test.com',
      movieTitle: 'The Legend of Okomfo Anokye',
      movieCoverUrl: 'https://example.com/cover1.jpg',
      amountPaid: 100,
      producerEarning: 80,
      hubEarning: 20,
      paystackRef: 'ref-1001',
      status: 'unused',
      purchasedAt: '2026-08-25T10:00:00Z',
    },
    {
      id: 'TKT-1002-BETA',
      ticketId: 't2',
      buyerId: 'b2',
      buyerName: 'Kwame Mensah',
      buyerEmail: 'kwame@test.com',
      movieTitle: 'Accra Midnight Special',
      movieCoverUrl: 'https://example.com/cover2.jpg',
      amountPaid: 160,
      producerEarning: 128,
      hubEarning: 32,
      paystackRef: 'ref-1002',
      status: 'used',
      purchasedAt: '2026-08-25T11:00:00Z',
    },
  ];

  it('renders ticket list with movie titles and buyer names', () => {
    render(<QuickPassSimulator purchasableTickets={mockPurchases} onQuickScan={vi.fn()} />);

    expect(screen.getByText('The Legend of Okomfo Anokye')).toBeInTheDocument();
    expect(screen.getByText('Ama Serwaa')).toBeInTheDocument();
    expect(screen.getByText('Accra Midnight Special')).toBeInTheDocument();
    expect(screen.getByText('Kwame Mensah')).toBeInTheDocument();
    expect(screen.getByText('2 Passes On File')).toBeInTheDocument();
  });

  it('invokes onQuickScan when pass button is clicked', () => {
    const onScanMock = vi.fn();
    render(<QuickPassSimulator purchasableTickets={mockPurchases} onQuickScan={onScanMock} />);

    const button = screen.getByTestId('quick-pass-btn-TKT-1001-ALPHA');
    fireEvent.click(button);

    expect(onScanMock).toHaveBeenCalledWith(mockPurchases[0]);
  });
});
