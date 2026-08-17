import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import Marketplace from './Marketplace';
import { MovieTicket, UserProfile } from '../types';

const mockTickets: MovieTicket[] = [
  {
    id: 'm-test-1',
    title: 'The Great African Adventure',
    description: 'An exhilarating cinematic journey across West Africa.',
    producerId: 'prod-1',
    producerName: 'Accra Studios',
    venue: 'Silverbird Cinemas, Accra Mall',
    date: '2026-09-01',
    time: '19:00',
    category: 'movie',
    price: 50,
    totalQuantity: 100,
    availableQuantity: 85,
    trailerUrl: 'https://youtube.com',
    coverUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80',
    createdAt: '2026-08-01T10:00:00Z',
  },
  {
    id: 'm-test-2',
    title: 'Night of Comedy & Drama',
    description: 'A hilarious live stage performance.',
    producerId: 'prod-2',
    producerName: 'Theatre Guild',
    venue: 'National Theatre, Accra',
    date: '2026-09-05',
    time: '18:30',
    category: 'music',
    price: 80,
    totalQuantity: 200,
    availableQuantity: 150,
    trailerUrl: 'https://youtube.com',
    coverUrl: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&q=80',
    createdAt: '2026-08-01T10:00:00Z',
  },
];

const mockUser: UserProfile = {
  id: 'user-buyer-1',
  email: 'buyer@test.com',
  name: 'Kofi Mensah',
  role: 'buyer',
  phoneNumber: '+233240000000',
  balance: 0,
};

describe('Marketplace Component Unit Tests', () => {
  const defaultProps = {
    user: mockUser,
    tickets: mockTickets,
    purchases: [],
    onPurchaseComplete: vi.fn(),
    onOpenAuth: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders marketplace search header and category navigation', () => {
    render(<Marketplace {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(/Search by event title, producer, or venue/i);
    expect(searchInput).toBeInTheDocument();

    expect(screen.getByText('All Events')).toBeInTheDocument();
    expect(screen.getByText('The Great African Adventure')).toBeInTheDocument();
    expect(screen.getByText('Night of Comedy & Drama')).toBeInTheDocument();
  });

  it('filters items correctly when typing in the search box', () => {
    render(<Marketplace {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(/Search by event title, producer, or venue/i);
    fireEvent.change(searchInput, { target: { value: 'Comedy' } });

    expect(screen.getByText('Night of Comedy & Drama')).toBeInTheDocument();
    expect(screen.queryByText('The Great African Adventure')).not.toBeInTheDocument();
  });

  it('renders tickets list and handles unauthenticated state gracefully', () => {
    const onOpenAuthMock = vi.fn();
    render(<Marketplace {...defaultProps} user={null} onOpenAuth={onOpenAuthMock} />);

    expect(screen.getByText('The Great African Adventure')).toBeInTheDocument();
    expect(screen.getByText('Night of Comedy & Drama')).toBeInTheDocument();
  });
});
