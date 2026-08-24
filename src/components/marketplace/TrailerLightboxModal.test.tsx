import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import TrailerLightboxModal from './TrailerLightboxModal';
import { MovieTicket } from '../../types';

describe('TrailerLightboxModal Unit Tests', () => {
  const mockTicket: MovieTicket = {
    id: 'evt-202',
    title: 'The Director Cut Premiere',
    description: 'Exclusive trailer preview.',
    producerId: 'prod-789',
    producerName: 'Nollywood Gold',
    venue: 'Silverbird Accra',
    date: '2026-11-20',
    time: '19:30',
    category: 'movie',
    price: 90,
    totalQuantity: 300,
    availableQuantity: 280,
    trailerUrl: 'https://youtube.com/watch?v=directorscut123',
    coverUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800',
    createdAt: '2026-08-01T10:00:00Z',
  };

  it('renders nothing when ticket is null', () => {
    const { container } = render(<TrailerLightboxModal ticket={null} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders YouTube iframe player when trailer is a YouTube URL', () => {
    render(<TrailerLightboxModal ticket={mockTicket} onClose={vi.fn()} />);

    expect(screen.getByTitle('The Director Cut Premiere Trailer')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Exit Player/i })).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onCloseMock = vi.fn();
    render(<TrailerLightboxModal ticket={mockTicket} onClose={onCloseMock} />);

    const exitBtn = screen.getByRole('button', { name: /Exit Player/i });
    fireEvent.click(exitBtn);

    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});
