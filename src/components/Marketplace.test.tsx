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
    createdAt: '2026-08-01T10:00:00Z'
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
    createdAt: '2026-08-01T10:00:00Z'
  }
];

const mockUser: UserProfile = {
  id: 'user-buyer-1',
  email: 'buyer@test.com',
  name: 'Kofi Mensah',
  role: 'buyer',
  phoneNumber: '+233240000000',
  balance: 0
};

describe('Marketplace Component Unit Tests', () => {
  const defaultProps = {
    user: mockUser,
    tickets: mockTickets,
    purchases: [],
    onPurchaseComplete: vi.fn(),
    onOpenAuth: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders marketplace search header and category navigation', () => {
    render(<Marketplace {...defaultProps} />);
    
    // Check for search input
    const searchInput = screen.getByPlaceholderText(/Search premiere title, venue, or director/i);
    expect(searchInput).toBeDefined();

    // Check category pills and titles exist
    expect(screen.getByText('All Events')).toBeDefined();
    expect(screen.getByText('The Great African Adventure')).toBeDefined();
    expect(screen.getByText('Night of Comedy & Drama')).toBeDefined();
  });

  it('filters items correctly when typing in the search box', () => {
    render(<Marketplace {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText(/Search premiere title, venue, or director/i);
    fireEvent.change(searchInput, { target: { value: 'Comedy' } });
    
    expect(screen.getByText('Night of Comedy & Drama')).toBeDefined();
    expect(screen.queryByText('The Great African Adventure')).toBeNull();
  });

  it('renders tickets list and handles unauthenticated state gracefully', () => {
    const onOpenAuthMock = vi.fn();
    render(<Marketplace {...defaultProps} user={null} onOpenAuth={onOpenAuthMock} />);

    expect(screen.getByText('The Great African Adventure')).toBeDefined();
    expect(screen.getByText('Night of Comedy & Drama')).toBeDefined();
  });
});
