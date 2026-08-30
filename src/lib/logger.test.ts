import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, LogPayload } from './logger';

describe('StructuredLogger & Error Tracking Unit Tests', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    logger.setTrackingEndpoint(null);
  });

  it('exposes debug, info, warn, error, and onError methods', () => {
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.onError).toBe('function');
    expect(typeof logger.setTrackingEndpoint).toBe('function');
  });

  it('safely handles debug and info without throwing', () => {
    expect(() => {
      logger.debug('Testing debug output', 'testContext', { userId: '123' });
      logger.info('User logged in', 'auth', { role: 'producer' });
    }).not.toThrow();
  });

  it('safely handles warn and error calls with complex objects and Error instances', () => {
    const errorInstance = new Error('Database unreachable');
    expect(() => {
      logger.warn('Rate limit approaching', 'api', { requestsRemaining: 5 });
      logger.error('Critical payment failure', 'payments', errorInstance, { amount: 50 });
    }).not.toThrow();
  });

  it('triggers registered onError tracking hook with formatted payload', () => {
    const capturedPayloads: LogPayload[] = [];
    const unsubscribe = logger.onError((payload) => {
      capturedPayloads.push(payload);
    });

    logger.error('Gate scanner timeout', 'gatekeeper', new Error('Camera stream failed'), {
      gateId: 'G1',
    });

    expect(capturedPayloads.length).toBe(1);
    expect(capturedPayloads[0].level).toBe('error');
    expect(capturedPayloads[0].message).toBe('Gate scanner timeout');
    expect(capturedPayloads[0].context).toBe('gatekeeper');
    expect(capturedPayloads[0].error.message).toBe('Camera stream failed');
    expect(capturedPayloads[0].data.gateId).toBe('G1');

    unsubscribe();

    logger.error('Another error after unsubscribe', 'test');
    expect(capturedPayloads.length).toBe(1);
  });

  it('forwards error payload to configured tracking endpoint via fetch', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = mockFetch;

    logger.setTrackingEndpoint('https://sentry.example.com/api/errors');

    logger.error('Payment split calculation error', 'paystack', new Error('Divide by zero'), {
      subaccount: 'ACCT_123',
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://sentry.example.com/api/errors',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.event).toBe('error_log');
    expect(callBody.payload.message).toBe('Payment split calculation error');
  });

  it('swallows fetch errors gracefully without disrupting application flow', () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));
    logger.setTrackingEndpoint('https://invalid.sentry.host');

    expect(() => {
      logger.error('Suppressed network failure', 'network', new Error('Simulated offline'));
    }).not.toThrow();
  });
});
