import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSubaccountVerification } from './useSubaccountVerification';

describe('useSubaccountVerification Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: true }),
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('initializes with default empty states', () => {
    const { result } = renderHook(() => useSubaccountVerification());
    expect(result.current.generatedCode).toBe('');
    expect(result.current.userEnteredCode).toBe('');
    expect(result.current.showVerificationInput).toBe(false);
    expect(result.current.verificationError).toBe('');
    expect(result.current.resendCooldown).toBe(0);
  });

  it('initiates verification, generates 4-digit code, and triggers email API', async () => {
    const { result } = renderHook(() => useSubaccountVerification({ cooldownSeconds: 30 }));

    let code: string | null = null;
    await act(async () => {
      code = await result.current.initiateVerification('producer@test.com');
    });

    expect(code).toBeDefined();
    expect(code?.length).toBe(4);
    expect(result.current.showVerificationInput).toBe(true);
    expect(result.current.resendCooldown).toBe(30);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/send-verification-code',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('producer@test.com'),
      })
    );
  });

  it('ticks down resend cooldown over time', async () => {
    const { result } = renderHook(() => useSubaccountVerification({ cooldownSeconds: 10 }));

    await act(async () => {
      await result.current.initiateVerification('producer@test.com');
    });

    expect(result.current.resendCooldown).toBe(10);

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.resendCooldown).toBe(7);

    act(() => {
      vi.advanceTimersByTime(7000);
    });
    expect(result.current.resendCooldown).toBe(0);
  });

  it('rejects resend when cooldown is active', async () => {
    const { result } = renderHook(() => useSubaccountVerification({ cooldownSeconds: 30 }));

    await act(async () => {
      await result.current.initiateVerification('producer@test.com');
    });

    let resendResult: string | null = 'sentinel';
    await act(async () => {
      resendResult = await result.current.resendVerificationCode('producer@test.com');
    });

    expect(resendResult).toBeNull();
  });

  it('validates entered code and handles mismatch vs match', async () => {
    const { result } = renderHook(() => useSubaccountVerification());

    await act(async () => {
      await result.current.initiateVerification('producer@test.com');
    });

    const generated = result.current.generatedCode;

    // Wrong code
    act(() => {
      result.current.setUserEnteredCode('9999');
    });

    let isValid = false;
    act(() => {
      isValid = result.current.verifyEnteredCode();
    });

    expect(isValid).toBe(false);
    expect(result.current.verificationError).toContain('Invalid 4-digit verification code');

    // Correct code
    act(() => {
      result.current.setUserEnteredCode(generated);
    });

    act(() => {
      isValid = result.current.verifyEnteredCode();
    });

    expect(isValid).toBe(true);
    expect(result.current.verificationError).toBe('');
    expect(result.current.showVerificationInput).toBe(false);
    expect(result.current.generatedCode).toBe('');
  });

  it('resets verification states cleanly', async () => {
    const { result } = renderHook(() => useSubaccountVerification());

    await act(async () => {
      await result.current.initiateVerification('producer@test.com');
    });

    act(() => {
      result.current.resetVerification();
    });

    expect(result.current.generatedCode).toBe('');
    expect(result.current.showVerificationInput).toBe(false);
    expect(result.current.resendCooldown).toBe(0);
  });
});
