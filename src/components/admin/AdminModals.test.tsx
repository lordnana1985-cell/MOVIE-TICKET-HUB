import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import AdminModals from './AdminModals';
import { MovieTicket, UserProfile } from '../../types';

describe('AdminModals Component', () => {
  const mockTicket: MovieTicket = {
    id: 'tkt-1',
    title: 'Midnight Screening',
    description: 'Premier of dark thriller.',
    price: 90,
    date: '2026-11-20',
    time: '23:00',
    venue: 'Accra Cinema',
    trailerUrl: 'https://youtube.com/trailer',
    producerId: 'prod-1',
    producerName: 'Nightfall Cinema',
    totalQuantity: 100,
    availableQuantity: 50,
    coverUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba',
    createdAt: '2026-01-01T00:00:00Z',
  };

  const mockProfile: UserProfile = {
    id: 'prod-1',
    email: 'night@cinema.com',
    role: 'producer',
    name: 'Nightfall Cinema',
    balance: 4500,
  };

  it('renders ticket delete modal and handles confirm/cancel events', () => {
    const handleCancel = vi.fn();
    const handleConfirm = vi.fn();

    render(
      <AdminModals
        ticketToDelete={mockTicket}
        profileToDelete={null}
        actionLoading={false}
        onCancelTicketDelete={handleCancel}
        onConfirmTicketDelete={handleConfirm}
        onCancelProfileDelete={vi.fn()}
        onConfirmProfileDelete={vi.fn()}
      />
    );

    expect(screen.getByText(/Delete Event Ticket\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Midnight Screening/i)).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: /CANCEL/i });
    fireEvent.click(cancelBtn);
    expect(handleCancel).toHaveBeenCalledTimes(1);

    const confirmBtn = screen.getByRole('button', { name: /CONFIRM & DELETE TICKET/i });
    fireEvent.click(confirmBtn);
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it('renders profile delete modal and handles confirm/cancel events', () => {
    const handleCancel = vi.fn();
    const handleConfirm = vi.fn();

    render(
      <AdminModals
        ticketToDelete={null}
        profileToDelete={mockProfile}
        actionLoading={false}
        onCancelTicketDelete={vi.fn()}
        onConfirmTicketDelete={vi.fn()}
        onCancelProfileDelete={handleCancel}
        onConfirmProfileDelete={handleConfirm}
      />
    );

    expect(screen.getByText(/Permanently Remove Account\?/i)).toBeInTheDocument();
    expect(screen.getByText(/CASCADING TERMINATION ENFORCED/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /CONFIRM ACCOUNT DELETION/i });
    fireEvent.click(confirmBtn);
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });
});
