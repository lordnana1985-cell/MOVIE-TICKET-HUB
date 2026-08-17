import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import AdminTicketTable from './AdminTicketTable';
import { MovieTicket } from '../../types';

describe('AdminTicketTable Component', () => {
  const mockTickets: MovieTicket[] = [
    {
      id: 'tkt-1',
      title: 'Action Night Gala',
      description: 'Big premiere of high budget action thriller.',
      price: 150,
      date: '2026-12-01',
      time: '20:00',
      venue: 'Accra Cinema Hall',
      trailerUrl: 'https://youtube.com/trailer',
      producerId: 'prod-1',
      producerName: 'Silver Star Studios',
      totalQuantity: 200,
      availableQuantity: 180,
      coverUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba',
      createdAt: '2026-01-01T00:00:00Z',
    },
  ];

  it('renders tickets list and handles search and delete interactions', () => {
    const handleSearch = vi.fn();
    const handleDelete = vi.fn();

    render(
      <AdminTicketTable
        tickets={mockTickets}
        ticketSearch=""
        onSearchChange={handleSearch}
        onSelectTicketToDelete={handleDelete}
      />
    );

    expect(screen.getByText('Action Night Gala')).toBeInTheDocument();
    expect(screen.getByText('Silver Star Studios')).toBeInTheDocument();
    expect(screen.getByText(/GH₵150/i)).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/Search movies/i);
    fireEvent.change(searchInput, { target: { value: 'Action' } });
    expect(handleSearch).toHaveBeenCalledWith('Action');

    const deleteBtn = screen.getByTitle('Delete Ticket');
    fireEvent.click(deleteBtn);
    expect(handleDelete).toHaveBeenCalledWith(mockTickets[0]);
  });

  it('renders empty state when no tickets exist', () => {
    render(
      <AdminTicketTable
        tickets={[]}
        ticketSearch="Nonexistent"
        onSearchChange={vi.fn()}
        onSelectTicketToDelete={vi.fn()}
      />
    );

    expect(screen.getByText(/No matching tickets discovered/i)).toBeInTheDocument();
  });
});
