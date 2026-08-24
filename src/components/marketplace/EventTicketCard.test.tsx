import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import EventTicketCard from './EventTicketCard';
import { MovieTicket } from '../../types';

describe('EventTicketCard Unit Tests', () => {
  const mockTicket: MovieTicket = {
    id: 'evt-101',
    title: 'Afrobeats Summer Bash',
    description: 'High-energy musical festival in Accra.',
    producerId: 'prod-456',
    producerName: 'Vibe Nation',
    venue: 'Independence Square, Accra',
    date: '2026-10-15',
    time: '20:00',
    category: 'music',
    price: 120,
    totalQuantity: 500,
    availableQuantity: 420,
    trailerUrl: 'https://youtube.com/watch?v=afrobeatstest',
    coverUrl: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&q=80',
    createdAt: '2026-08-01T10:00:00Z',
  };

  const defaultProps = {
    ticket: mockTicket,
    onWatchTrailer: vi.fn(),
    onAddToCart: vi.fn(),
  };

  it('renders event card with title, producer name, price, and category badge', () => {
    render(<EventTicketCard {...defaultProps} />);

    expect(screen.getByText('Afrobeats Summer Bash')).toBeInTheDocument();
    expect(screen.getByText(/PRODUCER: Vibe Nation/i)).toBeInTheDocument();
    expect(screen.getByText('Independence Square, Accra')).toBeInTheDocument();
    expect(screen.getByText('GH₵120')).toBeInTheDocument();
    expect(screen.getByText('Music')).toBeInTheDocument();
  });

  it('triggers onWatchTrailer when play button overlay is clicked', () => {
    render(<EventTicketCard {...defaultProps} />);

    const playBtn = screen.getAllByRole('button')[0];
    fireEvent.click(playBtn);

    expect(defaultProps.onWatchTrailer).toHaveBeenCalledWith(mockTicket);
  });

  it('triggers onAddToCart when Add to Cart button is clicked', () => {
    render(<EventTicketCard {...defaultProps} />);

    const addToCartBtn = screen.getByRole('button', { name: /Add to Cart/i });
    fireEvent.click(addToCartBtn);

    expect(defaultProps.onAddToCart).toHaveBeenCalledWith(mockTicket);
  });

  it('disables add to cart button when ticket is sold out', () => {
    const soldOutTicket = { ...mockTicket, availableQuantity: 0 };
    render(<EventTicketCard {...defaultProps} ticket={soldOutTicket} />);

    const soldOutBtn = screen.getByRole('button', { name: /Sold Out/i });
    expect(soldOutBtn).toBeDisabled();
  });
});
