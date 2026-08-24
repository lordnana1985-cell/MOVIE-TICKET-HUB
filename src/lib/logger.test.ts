import { describe, it, expect, vi } from 'vitest';
import { logger } from './logger';

describe('StructuredLogger Unit Tests', () => {
  it('exposes debug, info, warn, and error methods', () => {
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
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
});
