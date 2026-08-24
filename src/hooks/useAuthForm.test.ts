import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthForm } from './useAuthForm';
import { db, supabase } from '../lib/db';

vi.mock('../lib/db', () => ({
  db: {
    checkEmailExists: vi.fn(),
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    generatePaystackSubaccount: vi.fn(),
    resendVerificationEmail: vi.fn(),
  },
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
    },
  },
}));

describe('useAuthForm Hook Unit Tests', () => {
  const mockOnAuthSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with default role and fields', () => {
    const { result } = renderHook(() =>
      useAuthForm({
        initialRole: 'buyer',
        onAuthSuccess: mockOnAuthSuccess,
      })
    );

    expect(result.current.role).toBe('buyer');
    expect(result.current.isRegister).toBe(false);
    expect(result.current.email).toBe('');
    expect(result.current.loading).toBe(false);
  });

  it('sets admin email when role is switched to admin', () => {
    const { result } = renderHook(() =>
      useAuthForm({
        initialRole: 'admin',
        onAuthSuccess: mockOnAuthSuccess,
      })
    );

    expect(result.current.email).toBe('admin@movieticket.com');
  });

  it('validates required fields on sign in', async () => {
    const { result } = renderHook(() =>
      useAuthForm({
        initialRole: 'buyer',
        onAuthSuccess: mockOnAuthSuccess,
      })
    );

    const dummyEvent = { preventDefault: vi.fn() } as any;
    await act(async () => {
      await result.current.handleSubmit(dummyEvent);
    });

    expect(result.current.error).toBe('Email and password are required.');
  });

  it('handles resend verification link', async () => {
    (db.resendVerificationEmail as any).mockResolvedValueOnce({
      success: true,
      message: 'Verification email sent!',
    });

    const { result } = renderHook(() =>
      useAuthForm({
        initialRole: 'buyer',
        onAuthSuccess: mockOnAuthSuccess,
      })
    );

    act(() => {
      result.current.setEmail('user@test.com');
    });

    await act(async () => {
      await result.current.handleResendVerification();
    });

    expect(db.resendVerificationEmail).toHaveBeenCalledWith('user@test.com');
    expect(result.current.success).toBe('Verification email sent!');
    expect(result.current.resendCooldown).toBe(60);
  });
});
