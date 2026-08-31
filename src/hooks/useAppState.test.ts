import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppState } from './useAppState';
import { db } from '../lib/db';
import { UserProfile } from '../types';

describe('useAppState Hook', () => {
  const mockUser: UserProfile = {
    id: 'user_test_1',
    name: 'Jane Doe',
    email: 'jane@example.com',
    role: 'buyer',
    balance: 0,
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('initializes with null user and auth tab if no stored profile', () => {
    const { result } = renderHook(() => useAppState());
    expect(result.current.user).toBeNull();
    expect(result.current.activeTab).toBe('auth');
  });

  it('handles auth success and updates active tab according to role', async () => {
    vi.spyOn(db, 'getTickets').mockResolvedValue([]);
    vi.spyOn(db, 'getPurchasesForBuyer').mockResolvedValue([]);

    const { result } = renderHook(() => useAppState());

    act(() => {
      result.current.handleAuthSuccess(mockUser);
    });

    expect(result.current.user?.id).toBe('user_test_1');
    expect(result.current.activeTab).toBe('marketplace');
    expect(result.current.alertMessage?.type).toBe('success');
  });

  it('handles logout and clears storage', () => {
    localStorage.setItem('mt_hub_current_user', JSON.stringify(mockUser));
    const { result } = renderHook(() => useAppState());

    act(() => {
      result.current.handleLogout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.activeTab).toBe('auth');
    expect(localStorage.getItem('mt_hub_current_user')).toBeNull();
  });
});
