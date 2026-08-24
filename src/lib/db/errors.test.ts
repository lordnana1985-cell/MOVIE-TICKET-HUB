import { describe, it, expect } from 'vitest';
import { DbError, isDbError } from './errors';

describe('DbError Class & Error Utilities', () => {
  it('constructs DbError with operation, cause, and fallbackUsed properties', () => {
    const originalError = new Error('Connection timed out');
    const err = new DbError('Failed to query profiles', {
      operation: 'queryProfiles',
      cause: originalError,
      fallbackUsed: true,
      details: { table: 'profiles' },
    });

    expect(err.name).toBe('DbError');
    expect(err.code).toBe('DB_ERROR');
    expect(err.statusCode).toBe(500);
    expect(err.operation).toBe('queryProfiles');
    expect(err.fallbackUsed).toBe(true);
    expect(err.cause).toBe(originalError);
    expect(err.message).toBe('Failed to query profiles');
    expect(err.details).toEqual({ table: 'profiles' });
  });

  it('creates DbError cleanly fromError helper', () => {
    const cause = new Error('Supabase network failure');
    const dbErr = DbError.fromError('registerUser', cause, true, 'Registration fallback active');

    expect(dbErr.operation).toBe('registerUser');
    expect(dbErr.fallbackUsed).toBe(true);
    expect(dbErr.message).toContain('Registration fallback active: Supabase network failure');
    expect(dbErr.cause).toBe(cause);
    expect(isDbError(dbErr)).toBe(true);
  });

  it('validates isDbError type guard correctly', () => {
    const regularError = new Error('Standard JS error');
    const dbErr = new DbError('Database error', { operation: 'deleteTicket' });

    expect(isDbError(dbErr)).toBe(true);
    expect(isDbError(regularError)).toBe(false);
    expect(isDbError(null)).toBe(false);
    expect(isDbError('string error')).toBe(false);
  });
});
