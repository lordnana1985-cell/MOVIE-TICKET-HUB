import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthForm } from './useAuthForm';
import { db } from '../lib/db';

vi.mock('../lib/db', () => ({
  isSupabaseConfigured: false,
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

  it('toggles registration mode and updates fields', () => {
    const { result } = renderHook(() =>
      useAuthForm({
        initialRole: 'buyer',
        onAuthSuccess: mockOnAuthSuccess,
      })
    );

    act(() => {
      result.current.setIsRegister(true);
      result.current.setName('Test User');
      result.current.setPassword('password123');
      result.current.setConfirmPassword('password123');
      result.current.setPhoneNumber('0241234567');
      result.current.setEmail('test@example.com');
    });

    expect(result.current.isRegister).toBe(true);
    expect(result.current.name).toBe('Test User');
    expect(result.current.phoneNumber).toBe('0241234567');
  });

  it('validates required name on registration', async () => {
    const { result } = renderHook(() =>
      useAuthForm({
        initialRole: 'buyer',
        onAuthSuccess: mockOnAuthSuccess,
      })
    );

    act(() => {
      result.current.setIsRegister(true);
      result.current.setEmail('test@example.com');
      result.current.setPassword('password123');
      result.current.setName('');
    });

    const dummyEvent = { preventDefault: vi.fn() } as any;
    await act(async () => {
      await result.current.handleSubmit(dummyEvent);
    });

    expect(result.current.error).toBe('Full name is required.');
  });

  it('completes registration flow successfully', async () => {
    const mockCreatedUser = {
      id: 'usr-new-1',
      email: 'newuser@example.com',
      name: 'New User',
      role: 'buyer',
      balance: 0,
    };
    (db.checkEmailExists as any).mockResolvedValueOnce(false);
    (db.registerUser as any).mockResolvedValueOnce(mockCreatedUser);

    const { result } = renderHook(() =>
      useAuthForm({
        initialRole: 'buyer',
        onAuthSuccess: mockOnAuthSuccess,
      })
    );

    act(() => {
      result.current.setIsRegister(true);
      result.current.setEmail('newuser@example.com');
      result.current.setName('New User');
      result.current.setPassword('SecurePass123!');
      result.current.setConfirmPassword('SecurePass123!');
    });

    const dummyEvent = { preventDefault: vi.fn() } as any;
    await act(async () => {
      await result.current.handleSubmit(dummyEvent);
    });

    expect(result.current.success).toContain('Registration successful');
  });

  it('completes login flow successfully', async () => {
    const mockLoggedUser = {
      id: 'usr-logged-1',
      email: 'buyer@example.com',
      name: 'Logged Buyer',
      role: 'buyer',
      balance: 0,
    };
    (db.loginUser as any).mockResolvedValueOnce(mockLoggedUser);

    const { result } = renderHook(() =>
      useAuthForm({
        initialRole: 'buyer',
        onAuthSuccess: mockOnAuthSuccess,
      })
    );

    act(() => {
      result.current.setEmail('buyer@example.com');
      result.current.setPassword('SecurePass123!');
    });

    const dummyEvent = { preventDefault: vi.fn() } as any;
    await act(async () => {
      await result.current.handleSubmit(dummyEvent);
    });

    expect(result.current.success).toContain('Welcome back');
  });

  it('handles password recovery request in simulation mode', async () => {
    const { result } = renderHook(() =>
      useAuthForm({
        initialRole: 'buyer',
        onAuthSuccess: mockOnAuthSuccess,
      })
    );

    act(() => {
      result.current.setEmail('forgot@example.com');
    });

    const dummyEvent = { preventDefault: vi.fn() } as any;
    await act(async () => {
      await result.current.handleForgotPasswordSubmit(dummyEvent);
    });

    expect(result.current.success).toContain('Password reset');
  });
});
