import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import TicketForm from './TicketForm';
import { UserProfile } from '../../types';
import { db } from '../../lib/db';

vi.mock('../../lib/db', () => ({
  db: {
    createTicket: vi.fn().mockResolvedValue({ id: 'new-ticket-1' }),
  },
  getSupabaseLastError: vi.fn(() => null),
  clearSupabaseLastError: vi.fn(),
}));

describe('TicketForm Component Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockProducer: UserProfile = {
    id: 'prod-123',
    email: 'producer@example.com',
    name: 'Cinema Producer',
    role: 'producer',
    balance: 0,
    companyName: 'Silverbird Cinemas',
  };

  it('renders ticket creation modal with input fields', () => {
    const handleClose = vi.fn();
    const handleSuccess = vi.fn();

    render(<TicketForm user={mockProducer} onClose={handleClose} onSuccess={handleSuccess} />);

    expect(screen.getByText(/Generate Event Ticket/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter event title\.\.\./i)).toBeInTheDocument();
  });

  it('allows category selection, form field updates, and cancel click', () => {
    const handleClose = vi.fn();
    const handleSuccess = vi.fn();

    render(<TicketForm user={mockProducer} onClose={handleClose} onSuccess={handleSuccess} />);

    const titleInput = screen.getByPlaceholderText(/Enter event title\.\.\./i);
    fireEvent.change(titleInput, { target: { value: 'Accra Afrobeats Gala' } });
    expect((titleInput as HTMLInputElement).value).toBe('Accra Afrobeats Gala');

    const cancelBtn = screen.getByText('Cancel');
    fireEvent.click(cancelBtn);
    expect(handleClose).toHaveBeenCalled();
  });

  it('submits ticket form and triggers db.createTicket and onSuccess callback', async () => {
    const handleClose = vi.fn();
    const handleSuccess = vi.fn();

    render(<TicketForm user={mockProducer} onClose={handleClose} onSuccess={handleSuccess} />);

    const titleInput = screen.getByPlaceholderText(/Enter event title\.\.\./i);
    fireEvent.change(titleInput, { target: { value: 'Epic Movie Night' } });

    const descInput = screen.getByPlaceholderText(/Provide a compelling description/i);
    fireEvent.change(descInput, {
      target: { value: 'Exclusive premiere with special guest stars' },
    });

    const venueInput = screen.getByPlaceholderText(/e\.g\. Silverbird Cinemas/i);
    fireEvent.change(venueInput, {
      target: { value: 'Accra Mall Silverbird' },
    });

    const submitBtn = screen.getByRole('button', { name: /Generate Premier Ticket/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(db.createTicket).toHaveBeenCalled();
      expect(handleSuccess).toHaveBeenCalled();
    });
  });
});
