import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import AdminUserTable from './AdminUserTable';
import { UserProfile } from '../../types';

describe('AdminUserTable Component', () => {
  const mockAdmin: UserProfile = {
    id: 'admin-1',
    email: 'admin@hub.com',
    role: 'admin',
    name: 'Chief Admin',
    balance: 0,
  };

  const mockProfiles: UserProfile[] = [
    mockAdmin,
    {
      id: 'prod-1',
      email: 'prod@cinema.com',
      role: 'producer',
      name: 'Cinema Master',
      companyName: 'Universal Studios Ghana',
      phoneNumber: '+233501234567',
      balance: 12500,
      paystackSubaccountCode: 'ACCT_prod123',
    },
    {
      id: 'buyer-1',
      email: 'fan@cinema.com',
      role: 'buyer',
      name: 'Kwame Mensah',
      balance: 0,
    },
  ];

  it('renders registered profiles, filters, and supports delete interaction', () => {
    const handleSearch = vi.fn();
    const handleRoleFilter = vi.fn();
    const handleDelete = vi.fn();

    render(
      <AdminUserTable
        currentUser={mockAdmin}
        profiles={mockProfiles}
        profileSearch=""
        onProfileSearchChange={handleSearch}
        profileRoleFilter="all"
        onRoleFilterChange={handleRoleFilter}
        onSelectProfileToDelete={handleDelete}
      />
    );

    expect(screen.getByText('Chief Admin')).toBeInTheDocument();
    expect(screen.getByText('YOU (ADMIN)')).toBeInTheDocument();
    expect(screen.getByText('Cinema Master')).toBeInTheDocument();
    expect(screen.getByText(/Universal Studios Ghana/i)).toBeInTheDocument();
    expect(screen.getByText('Kwame Mensah')).toBeInTheDocument();

    const producerFilterBtn = screen.getByRole('button', { name: /producer/i });
    fireEvent.click(producerFilterBtn);
    expect(handleRoleFilter).toHaveBeenCalledWith('producer');

    const searchInput = screen.getByPlaceholderText(/Search user name/i);
    fireEvent.change(searchInput, { target: { value: 'Kwame' } });
    expect(handleSearch).toHaveBeenCalledWith('Kwame');

    const deleteButtons = screen.getAllByRole('button', { name: /DELETE USER/i });
    fireEvent.click(deleteButtons[0]);
    expect(handleDelete).toHaveBeenCalledWith(mockProfiles[1]);
  });
});
