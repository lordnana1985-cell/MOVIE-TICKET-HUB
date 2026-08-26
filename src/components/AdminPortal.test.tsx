import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import AdminPortal from './AdminPortal';
import { UserProfile, MovieTicket } from '../types';
import { db } from '../lib/db';

vi.mock('../lib/db', () => ({
  db: {
    getAllProfiles: vi.fn(),
    getTickets: vi.fn(),
    deleteTicket: vi.fn(),
    deleteProfile: vi.fn(),
  },
}));

describe('AdminPortal Component', () => {
  const mockAdminUser: UserProfile = {
    id: 'admin-1',
    email: 'admin@hub.com',
    role: 'admin',
    name: 'Admin Supervisor',
    balance: 0,
  };

  const mockProfiles: UserProfile[] = [
    mockAdminUser,
    {
      id: 'prod-1',
      email: 'producer@cinema.com',
      role: 'producer',
      name: 'Cinema Mogul',
      companyName: 'Nollywood Stars',
      phoneNumber: '+233201234567',
      balance: 10000,
    },
    {
      id: 'buyer-1',
      email: 'fan@cinema.com',
      role: 'buyer',
      name: 'Kofi Mensah',
      balance: 0,
    },
  ];

  const mockTickets: MovieTicket[] = [
    {
      id: 'tkt-1',
      title: 'Grand Cinema Premiere',
      description: 'First screening event.',
      price: 100,
      date: '2026-11-10',
      time: '18:00',
      venue: 'Accra Mall Silverbird',
      trailerUrl: 'https://youtube.com/trailer',
      producerId: 'prod-1',
      producerName: 'Cinema Mogul',
      totalQuantity: 300,
      availableQuantity: 250,
      coverUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba',
      createdAt: '2026-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (db.getAllProfiles as any).mockResolvedValue(mockProfiles);
    (db.getTickets as any).mockResolvedValue(mockTickets);
  });

  it('renders admin dashboard with system control header, metrics, and directories', async () => {
    render(<AdminPortal user={mockAdminUser} tickets={mockTickets} onDataChanged={vi.fn()} />);

    expect(screen.getByText(/SYSTEM CONTROL PANEL/i)).toBeInTheDocument();
    expect(screen.getByText(/ADMINISTRATIVE OVERWATCH/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Grand Cinema Premiere')).toBeInTheDocument();
      expect(screen.getAllByText('Cinema Mogul').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Kofi Mensah')).toBeInTheDocument();
    });
  });

  it('allows searching and deleting a ticket with confirmation', async () => {
    (db.deleteTicket as any).mockResolvedValue(true);
    const onDataChanged = vi.fn();

    render(
      <AdminPortal user={mockAdminUser} tickets={mockTickets} onDataChanged={onDataChanged} />
    );

    await waitFor(() => {
      expect(screen.getByText('Grand Cinema Premiere')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByTitle('Delete Ticket');
    fireEvent.click(deleteBtn);

    expect(screen.getByText(/Delete Event Ticket\?/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /CONFIRM & DELETE TICKET/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(db.deleteTicket).toHaveBeenCalledWith('tkt-1');
      expect(onDataChanged).toHaveBeenCalled();
    });
  });

  it('allows deleting a user profile with confirmation', async () => {
    (db.deleteProfile as any).mockResolvedValue(true);
    const onDataChanged = vi.fn();

    render(
      <AdminPortal user={mockAdminUser} tickets={mockTickets} onDataChanged={onDataChanged} />
    );

    await waitFor(() => {
      expect(screen.getAllByText('Cinema Mogul').length).toBeGreaterThanOrEqual(1);
    });

    const deleteUserButtons = screen.getAllByRole('button', { name: /DELETE USER/i });
    fireEvent.click(deleteUserButtons[0]);

    expect(screen.getByText(/Permanently Remove Account\?/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /CONFIRM ACCOUNT DELETION/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(db.deleteProfile).toHaveBeenCalledWith('prod-1');
      expect(onDataChanged).toHaveBeenCalled();
    });
  });
});
