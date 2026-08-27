import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import CheckoutFlow from './CheckoutFlow';
import { UserProfile, MovieTicket } from '../../types';

vi.mock('../../lib/db', () => ({
  db: {
    purchaseTicket: vi.fn().mockResolvedValue({}),
    getUserProfile: vi.fn().mockResolvedValue(null),
  },
}));

describe('CheckoutFlow Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUser: UserProfile = {
    id: 'usr-1',
    email: 'buyer@example.com',
    role: 'buyer',
    name: 'John Buyer',
    balance: 0,
  };

  const mockTicket: MovieTicket = {
    id: 'tkt-1',
    title: 'Accra Nights Premiere',
    description: 'Special screening',
    price: 100,
    totalQuantity: 200,
    availableQuantity: 100,
    coverUrl: 'https://example.com/poster.jpg',
    trailerUrl: 'https://example.com/trailer.mp4',
    date: '2026-09-01',
    time: '20:00',
    venue: 'Accra Mall',
    producerId: 'prod-1',
    producerName: 'Ghana Films',
    createdAt: '2026-08-01',
    category: 'movie',
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    cart: [{ ticket: mockTicket, quantity: 1 }],
    user: mockUser,
    onPurchaseComplete: vi.fn(),
    onClearCart: vi.fn(),
  };

  it('renders Paystack checkout interface when opened', () => {
    render(<CheckoutFlow {...defaultProps} />);
    expect(screen.getAllByText(/paystack/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Accra Nights Premiere/i)).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(<CheckoutFlow {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('handles payment initialization flow when Proceed to Pay is clicked', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: (key: string) => (key === 'content-type' ? 'application/json' : null),
      },
      json: async () => ({
        status: true,
        data: {
          authorization_url: 'https://checkout.paystack.com/test-ref',
          reference: 'pstk_test_123',
        },
      }),
    } as any);

    render(<CheckoutFlow {...defaultProps} />);
    const payBtn = screen.getByRole('button', { name: /Proceed to Pay/i });
    expect(payBtn).toBeInTheDocument();
    fireEvent.click(payBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/paystack/initialize',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });
});
