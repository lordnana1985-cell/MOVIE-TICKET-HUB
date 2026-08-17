import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ProducerTicketCard from './ProducerTicketCard';
import { MovieTicket } from '../../types';

describe('ProducerTicketCard Component', () => {
  const mockTicket: MovieTicket = {
    id: 'tkt-123',
    title: 'The Great Premiere',
    description: 'Exclusive first screening of the blockbuster event.',
    price: 150,
    date: '2026-10-15',
    time: '19:00',
    venue: 'Silverbird Cinemas, Accra Mall',
    trailerUrl: 'https://youtube.com/watch?v=123',
    totalQuantity: 200,
    availableQuantity: 150,
    producerId: 'prod-1',
    producerName: 'Silverbird Studios',
    coverUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba',
    createdAt: '2026-01-01T00:00:00Z',
    isLocalOnly: false,
  };

  const defaultProps = {
    ticket: mockTicket,
    soldCount: 50,
    isConfirmingDelete: false,
    isDeleting: false,
    onPromptDelete: vi.fn(),
    onCancelDelete: vi.fn(),
    onConfirmDelete: vi.fn(),
  };

  it('renders ticket details and progress bar', () => {
    render(<ProducerTicketCard {...defaultProps} />);
    expect(screen.getByText('The Great Premiere')).toBeInTheDocument();
    expect(screen.getByText(/GH₵150/i)).toBeInTheDocument();
    expect(screen.getByText(/50 \/ 200/i)).toBeInTheDocument();
    expect(screen.getByText(/Supabase DB/i)).toBeInTheDocument();
  });

  it('triggers onPromptDelete when delete icon is clicked', () => {
    render(<ProducerTicketCard {...defaultProps} />);
    const deleteBtn = screen.getByRole('button', { name: /Delete The Great Premiere/i });
    fireEvent.click(deleteBtn);
    expect(defaultProps.onPromptDelete).toHaveBeenCalledWith('tkt-123');
  });

  it('displays confirmation modal when isConfirmingDelete is true', () => {
    render(<ProducerTicketCard {...defaultProps} isConfirmingDelete={true} />);
    expect(screen.getByText(/Delete this premiere\?/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Yes, Delete/i })).toBeInTheDocument();
  });
});
