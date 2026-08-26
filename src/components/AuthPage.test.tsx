import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import AuthPage from './AuthPage';

vi.mock('../lib/db', () => ({
  db: {
    loginUser: vi.fn(),
    registerUser: vi.fn(),
    checkEmailExists: vi.fn(() => Promise.resolve(false)),
    checkEmailOppositeRole: vi.fn(() => Promise.resolve(false)),
    generatePaystackSubaccount: vi.fn(() => Promise.resolve('ACCT_TEST123')),
  },
  getSupabaseStatus: vi.fn(() => ({ isConnected: false, lastError: null })),
  supabase: {
    auth: {
      signInWithPassword: vi.fn(() =>
        Promise.resolve({ data: { user: { id: 'u1', email: 'test@example.com' } }, error: null })
      ),
      signUp: vi.fn(() =>
        Promise.resolve({ data: { user: { id: 'u2', email: 'buyer@example.com' } }, error: null })
      ),
      resetPasswordForEmail: vi.fn(() => Promise.resolve({ error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}));

describe('AuthPage Component Unit Tests', () => {
  const onAuthSuccess = vi.fn();
  const onCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders sign in form with title and email input', () => {
    render(<AuthPage initialRole="buyer" onAuthSuccess={onAuthSuccess} onCancel={onCancel} />);

    expect(screen.getAllByText(/Event Ticket Hub/i)[0]).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. yourname@domain\.com/i)).toBeInTheDocument();
  });

  it('switches between Sign In and Sign Up tabs', () => {
    render(<AuthPage initialRole="buyer" onAuthSuccess={onAuthSuccess} onCancel={onCancel} />);

    const createAccountButton = screen.getByRole('button', { name: /Create Account/i });
    fireEvent.click(createAccountButton);

    expect(screen.getByPlaceholderText(/e\.g\. Christopher Nolan/i)).toBeInTheDocument();
  });

  it('allows selecting organiser role and switching tabs', () => {
    render(<AuthPage initialRole="producer" onAuthSuccess={onAuthSuccess} onCancel={onCancel} />);

    const createAccountButton = screen.getByRole('button', { name: /Create Account/i });
    fireEvent.click(createAccountButton);

    expect(screen.getByPlaceholderText(/e\.g\. Christopher Nolan/i)).toBeInTheDocument();
  });

  it('calls onCancel when return button is clicked', () => {
    render(<AuthPage initialRole="buyer" onAuthSuccess={onAuthSuccess} onCancel={onCancel} />);

    const backBtn = screen.getByRole('button', { name: /Return to Marketplace/i });
    fireEvent.click(backBtn);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
