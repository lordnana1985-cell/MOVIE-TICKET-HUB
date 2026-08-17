import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import GateScanner from './GateScanner';
import { db } from '../lib/db';
import { UserProfile } from '../types';

vi.mock('../lib/db', () => ({
  db: {
    authenticateTicket: vi.fn(),
    getGateLogs: vi.fn(() => Promise.resolve([])),
    getPurchasesForProducer: vi.fn(() => Promise.resolve([])),
    getPurchasesForBuyer: vi.fn(() => Promise.resolve([])),
    getTickets: vi.fn(() => Promise.resolve([]))
  }
}));

const mockProducerUser: UserProfile = {
  id: 'prod-123',
  email: 'producer@cinema.com',
  name: 'Cinema Producer',
  role: 'producer',
  companyName: 'Cinema Corp',
  balance: 500
};

describe('GateScanner Component Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (db.getGateLogs as any).mockResolvedValue([]);
    (db.getPurchasesForProducer as any).mockResolvedValue([]);
    (db.getTickets as any).mockResolvedValue([]);
  });

  it('renders Gate Access Scanner interface with title and input', () => {
    render(<GateScanner user={mockProducerUser} />);
    
    expect(screen.getByText(/Gatekeeper/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter Ticket Pass Code/i)).toBeInTheDocument();
  });

  it('handles manual ticket code submission and triggers authenticateTicket', async () => {
    (db.authenticateTicket as any).mockResolvedValue({
      success: true,
      message: 'Ticket Authenticated successfully! Welcome to the show.',
      purchase: {
        id: 'TICK-999',
        ticketId: 't-1',
        movieTitle: 'Inception',
        buyerName: 'John Doe',
        amountPaid: 50,
        status: 'used'
      }
    });

    render(<GateScanner user={mockProducerUser} />);
    
    const input = screen.getByPlaceholderText(/Enter Ticket Pass Code/i);
    fireEvent.change(input, { target: { value: 'TICK-999' } });

    const verifyBtn = screen.getByRole('button', { name: /Authenticate Pass/i });
    fireEvent.click(verifyBtn);

    await waitFor(() => {
      expect(db.authenticateTicket).toHaveBeenCalledWith('TICK-999');
    });
  });

  it('triggers authentication on failed verification', async () => {
    (db.authenticateTicket as any).mockResolvedValue({
      success: false,
      message: 'Invalid ticket reference! This ticket does not exist in our system.'
    });

    render(<GateScanner user={mockProducerUser} />);
    
    const input = screen.getByPlaceholderText(/Enter Ticket Pass Code/i);
    fireEvent.change(input, { target: { value: 'INVALID-CODE' } });

    const verifyBtn = screen.getByRole('button', { name: /Authenticate Pass/i });
    fireEvent.click(verifyBtn);

    await waitFor(() => {
      expect(db.authenticateTicket).toHaveBeenCalledWith('INVALID-CODE');
    });
  });
});
