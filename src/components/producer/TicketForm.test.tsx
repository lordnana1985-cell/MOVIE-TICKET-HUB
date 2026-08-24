import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TicketForm from './TicketForm';
import { UserProfile } from '../../types';

describe('TicketForm Component Unit Tests', () => {
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

    render(
      <TicketForm 
        user={mockProducer} 
        onClose={handleClose} 
        onSuccess={handleSuccess} 
      />
    );

    expect(screen.getByText(/Generate Event Ticket/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter event title\.\.\./i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Provide a compelling description/i)).toBeInTheDocument();
  });

  it('allows category selection and form field updates', () => {
    const handleClose = vi.fn();
    const handleSuccess = vi.fn();

    render(
      <TicketForm 
        user={mockProducer} 
        onClose={handleClose} 
        onSuccess={handleSuccess} 
      />
    );

    const titleInput = screen.getByPlaceholderText(/Enter event title\.\.\./i);
    fireEvent.change(titleInput, { target: { value: 'Accra Afrobeats Gala' } });
    expect((titleInput as HTMLInputElement).value).toBe('Accra Afrobeats Gala');

    const cancelBtn = screen.getByText('Cancel');
    fireEvent.click(cancelBtn);
    expect(handleClose).toHaveBeenCalled();
  });
});
