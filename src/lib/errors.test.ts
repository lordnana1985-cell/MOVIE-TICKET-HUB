import { describe, it, expect } from 'vitest';
import {
  AppError,
  ValidationError,
  SupabaseError,
  DatabaseOfflineError,
  AuthError,
  NotFoundError,
  PaymentError,
} from './errors';

describe('App Error Classes', () => {
  it('instantiates AppError with default and custom values', () => {
    const err = new AppError('Server error');
    expect(err.message).toBe('Server error');
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('INTERNAL_ERROR');

    const customErr = new AppError('Custom', 418, 'TEAPOT', { extra: true });
    expect(customErr.statusCode).toBe(418);
    expect(customErr.code).toBe('TEAPOT');
    expect(customErr.details).toEqual({ extra: true });
  });

  it('instantiates specific subclasses with expected default codes and statuses', () => {
    const valErr = new ValidationError('Invalid input', { field: 'email' });
    expect(valErr.name).toBe('ValidationError');
    expect(valErr.statusCode).toBe(400);
    expect(valErr.code).toBe('VALIDATION_ERROR');

    const supaErr = new SupabaseError('Postgrest error');
    expect(supaErr.name).toBe('SupabaseError');
    expect(supaErr.statusCode).toBe(502);

    const offlineErr = new DatabaseOfflineError();
    expect(offlineErr.name).toBe('DatabaseOfflineError');
    expect(offlineErr.statusCode).toBe(503);
    expect(offlineErr.message).toBe('Database is currently offline or unreachable');

    const authErr = new AuthError('Unauthorized');
    expect(authErr.name).toBe('AuthError');
    expect(authErr.statusCode).toBe(401);

    const notFoundErr = new NotFoundError('Ticket');
    expect(notFoundErr.name).toBe('NotFoundError');
    expect(notFoundErr.statusCode).toBe(404);
    expect(notFoundErr.message).toBe('Ticket not found');

    const defaultNotFound = new NotFoundError();
    expect(defaultNotFound.message).toBe('Resource not found');

    const payErr = new PaymentError('Insufficient balance');
    expect(payErr.name).toBe('PaymentError');
    expect(payErr.statusCode).toBe(402);
  });
});
