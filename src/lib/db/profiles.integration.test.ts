import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import app from '../../../server';
import * as serverTypes from '../../server/types';

describe('Profiles & Payment Integration Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('exercises /api/paystack/initialize and /api/paystack/verify/:reference end-to-end with stubbed Paystack fetch', async () => {
    process.env.PAYSTACK_SECRET_KEY = 'sk_test_mock_secret_key_12345';

    // Spy on paystackFetch to simulate live Paystack gateway responses
    const fetchSpy = vi.spyOn(serverTypes, 'paystackFetch');

    // 1. Stub initialize response
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      data: {
        status: true,
        message: 'Authorization URL created',
        data: {
          authorization_url: 'https://checkout.paystack.com/mock-auth-code',
          access_code: 'mock_access_code_999',
          reference: 'test_ref_live_001',
        },
      },
    });

    const initRes = await request(app).post('/api/paystack/initialize').send({
      email: 'buyer@example.com',
      amount: 150,
      subaccount_code: 'ACCT_PROD_123',
      callback_url: 'https://movieticket.app/callback',
    });

    expect(initRes.status).toBe(200);
    expect(initRes.body.status).toBe(true);
    expect(initRes.body.data.reference).toBe('test_ref_live_001');
    expect(initRes.body.data.split).toBeDefined();
    expect(initRes.body.data.split.subaccount).toBe('ACCT_PROD_123');
    expect(initRes.body.data.split.producer_amount).toBe(120); // 80% of 150
    expect(initRes.body.data.split.hub_amount).toBe(30); // 20% of 150

    // 2. Stub verify response
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      data: {
        status: true,
        message: 'Verification successful',
        data: {
          status: 'success',
          reference: 'test_ref_live_001',
          amount: 15000, // in lowest currency unit
          currency: 'GHS',
          customer: {
            email: 'buyer@example.com',
          },
        },
      },
    });

    const verifyRes = await request(app).get('/api/paystack/verify/test_ref_live_001');

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.status).toBe(true);
    expect(verifyRes.body.data.status).toBe('success');
    expect(verifyRes.body.data.reference).toBe('test_ref_live_001');
    expect(verifyRes.body.data.split).toBeDefined();
    expect(verifyRes.body.data.split.producer_amount).toBe(12000);
    expect(verifyRes.body.data.split.hub_amount).toBe(3000);
  });
});
