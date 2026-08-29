import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProducerHeader from './ProducerHeader';
import { UserProfile } from '../../types';

describe('ProducerHeader Component', () => {
  const mockUser: UserProfile = {
    id: 'prod-1',
    email: 'producer@test.com',
    role: 'producer',
    name: 'Kofi Annan',
    companyName: 'Ghana Film Studios',
    phoneNumber: '+233240000111',
    balance: 0,
  };

  it('renders company name, header titles, and phone badge', () => {
    render(
      <ProducerHeader
        user={mockUser}
        isCreating={false}
        onToggleCreating={vi.fn()}
        onOpenGateScanner={vi.fn()}
      />
    );

    expect(screen.getByText(/Ghana Film Studios/i)).toBeInTheDocument();
    expect(screen.getByText('Event Organiser')).toBeInTheDocument();
    expect(screen.getByText('+233240000111')).toBeInTheDocument();
    expect(screen.getByText('Gate Ticket Verifier')).toBeInTheDocument();
    expect(screen.getByText('Generate Event Ticket')).toBeInTheDocument();
  });

  it('handles toggle creating ticket form', () => {
    const toggleMock = vi.fn();
    render(
      <ProducerHeader
        user={mockUser}
        isCreating={true}
        onToggleCreating={toggleMock}
        onOpenGateScanner={vi.fn()}
      />
    );

    const button = screen.getByText('Close Ticket Form');
    fireEvent.click(button);
    expect(toggleMock).toHaveBeenCalledTimes(1);
  });

  it('handles open gate scanner button click', () => {
    const gateMock = vi.fn();
    render(
      <ProducerHeader
        user={mockUser}
        isCreating={false}
        onToggleCreating={vi.fn()}
        onOpenGateScanner={gateMock}
      />
    );

    const gateBtn = screen.getByText('Gate Ticket Verifier');
    fireEvent.click(gateBtn);
    expect(gateMock).toHaveBeenCalledTimes(1);
  });
});
