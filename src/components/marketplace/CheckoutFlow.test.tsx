import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import CheckoutFlow from './CheckoutFlow';
import { UserProfile, MovieTicket } from '../../types';

describe('CheckoutFlow Component', () => {
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
});
