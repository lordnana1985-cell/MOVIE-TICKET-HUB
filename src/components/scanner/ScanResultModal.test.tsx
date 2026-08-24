import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ScanResultModal from './ScanResultModal';
import { TicketPurchase } from '../../types';

describe('ScanResultModal Unit Tests', () => {
  const mockPurchase: TicketPurchase = {
    id: 'TKT-PASS-TEST-100',
    ticketId: 'evt-1',
    buyerId: 'usr-1',
    buyerName: 'Yaw Boateng',
    buyerEmail: 'yaw@test.com',
    movieTitle: 'Cinema Premiere Accra',
    movieCoverUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1',
    amountPaid: 150,
    producerEarning: 120,
    hubEarning: 30,
    status: 'used',
    purchasedAt: '2026-08-24T10:00:00Z',
    paystackRef: 'PSTK-REF-777',
  };

  it('renders ACCESS GRANTED view on successful check-in', () => {
    render(
      <ScanResultModal
        scanResult={{
          success: true,
          message: 'Welcome to the show!',
          purchase: { ...mockPurchase, status: 'used' },
        }}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('ACCESS GRANTED')).toBeInTheDocument();
    expect(screen.getByText('Welcome to the show!')).toBeInTheDocument();
    expect(screen.getByText('Cinema Premiere Accra')).toBeInTheDocument();
    expect(screen.getByText('Yaw Boateng')).toBeInTheDocument();
  });

  it('renders ACCESS DENIED view on invalid pass attempt', () => {
    render(
      <ScanResultModal
        scanResult={{
          success: false,
          message: 'Invalid ticket code provided.',
        }}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('ACCESS DENIED')).toBeInTheDocument();
    expect(screen.getByText('Invalid ticket code provided.')).toBeInTheDocument();
  });

  it('calls onClose when dismiss button is clicked', () => {
    const onClose = vi.fn();
    render(
      <ScanResultModal
        scanResult={{
          success: true,
          message: 'Ticket Validated',
        }}
        onClose={onClose}
      />
    );

    const closeBtn = screen.getByLabelText('Dismiss result');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
