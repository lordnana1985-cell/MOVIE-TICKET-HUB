import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import CartDrawer from './CartDrawer';
import { MovieTicket } from '../../types';

describe('CartDrawer Component', () => {
  const mockTicket: MovieTicket = {
    id: 'tkt-101',
    title: 'The Black Star Premiere',
    description: 'Exclusive screening',
    price: 150,
    totalQuantity: 100,
    availableQuantity: 50,
    coverUrl: 'https://example.com/cover.jpg',
    trailerUrl: 'https://example.com/trailer.mp4',
    date: '2026-10-15',
    time: '19:00',
    venue: 'Silverbird Cinemas',
    producerId: 'prod-1',
    producerName: 'AfroCinema Studios',
    createdAt: '2026-08-01',
    category: 'movie',
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    cart: [{ ticket: mockTicket, quantity: 2 }],
    totalItemsCount: 2,
    cartTotal: 300,
    onUpdateQuantity: vi.fn(),
    onRemoveFromCart: vi.fn(),
    onClearCart: vi.fn(),
    onCheckout: vi.fn(),
  };

  it('renders cart title, ticket items, and total amount when open', () => {
    render(<CartDrawer {...defaultProps} />);
    expect(screen.getByText(/Your Ticket Cart/i)).toBeInTheDocument();
    expect(screen.getByText('The Black Star Premiere')).toBeInTheDocument();
    expect(screen.getAllByText(/GH₵300/i).length).toBeGreaterThan(0);
  });

  it('handles quantity update and checkout button clicks', () => {
    const { container } = render(<CartDrawer {...defaultProps} />);
    const plusBtn = container.querySelector('#qty-plus-tkt-101');
    expect(plusBtn).toBeTruthy();
    if (plusBtn) {
      fireEvent.click(plusBtn);
      expect(defaultProps.onUpdateQuantity).toHaveBeenCalledWith('tkt-101', 1);
    }

    const checkoutBtn = screen.getByRole('button', { name: /Checkout Now/i });
    fireEvent.click(checkoutBtn);
    expect(defaultProps.onCheckout).toHaveBeenCalledTimes(1);

    const clearBtn = screen.getByRole('button', { name: /Clear Cart/i });
    fireEvent.click(clearBtn);
    expect(defaultProps.onClearCart).toHaveBeenCalledTimes(1);
  });

  it('returns null when isOpen is false', () => {
    const { container } = render(<CartDrawer {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });
});
