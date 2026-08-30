import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../server';

describe('Server API Endpoints & Zod Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.PAYSTACK_SECRET_KEY;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('GET /api/health returns ok status and uptime', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body).toHaveProperty('uptimeSeconds');
  });

  it('GET /api/paystack/banks returns bank list in demo or live mode', async () => {
    const res = await request(app).get('/api/paystack/banks');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('POST /api/paystack/subaccount validates input with Zod schema and rejects invalid payload', async () => {
    const res = await request(app).post('/api/paystack/subaccount').send({
      business_name: 'A', // too short
      settlement_bank: '',
      account_number: '123',
    });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe(false);
    expect(res.body).toHaveProperty('errors');
  });

  it('POST /api/paystack/subaccount accepts valid input payload', async () => {
    const res = await request(app).post('/api/paystack/subaccount').send({
      business_name: 'Apex Cinema Group',
      settlement_bank: 'MTN',
      account_number: '0241234567',
      primary_contact_email: 'apex@cinema.com',
    });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(res.body.data).toHaveProperty('subaccount_code');
  });

  it('POST /api/paystack/initialize validates email and positive amount', async () => {
    const invalidRes = await request(app).post('/api/paystack/initialize').send({
      email: 'invalid-email',
      amount: -10,
    });

    expect(invalidRes.status).toBe(400);
    expect(invalidRes.body.status).toBe(false);

    const validRes = await request(app).post('/api/paystack/initialize').send({
      email: 'customer@domain.com',
      amount: 50,
      callback_url: 'https://movietickethub.app/callback',
    });

    expect(validRes.status).toBe(200);
    expect(validRes.body.status).toBe(true);
    expect(validRes.body.data).toHaveProperty('reference');
  });

  it('POST /api/paystack/initialize with subaccount code returns 80/20 split breakdown in demo mode', async () => {
    const res = await request(app).post('/api/paystack/initialize').send({
      email: 'buyer@example.com',
      amount: 200,
      subaccount_code: 'ACCT_PRODUCER_123',
      callback_url: 'https://movietickethub.app/callback',
    });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(res.body.data.split).toBeDefined();
    expect(res.body.data.split.subaccount).toBe('ACCT_PRODUCER_123');
    expect(res.body.data.split.producer_share).toBe(80);
    expect(res.body.data.split.hub_share).toBe(20);
    expect(res.body.data.split.producer_amount).toBe(160);
    expect(res.body.data.split.hub_amount).toBe(40);
  });

  it('POST /api/paystack/initialize with live mocked Paystack client returns 80/20 split fields', async () => {
    process.env.PAYSTACK_SECRET_KEY = 'sk_live_mock_secret_key_12345';
    const originalFetch = global.fetch;
    global.fetch = async (url: any, _opts: any) => {
      if (url.toString().includes('/transaction/initialize')) {
        return {
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify({
              status: true,
              message: 'Authorization URL created',
              data: {
                authorization_url: 'https://checkout.paystack.com/live_test_code',
                access_code: 'live_test_code',
                reference: 'ref_live_test_001',
              },
            }),
        } as any;
      }
      return { ok: true, status: 200, text: async () => '{}' } as any;
    };

    const res = await request(app).post('/api/paystack/initialize').send({
      email: 'patron@cinema.com',
      amount: 100,
      subaccount_code: 'ACCT_AFRICAN_TALES_99',
      callback_url: 'https://movietickethub.app/callback',
    });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(res.body.data.reference).toBe('ref_live_test_001');
    expect(res.body.data.split).toBeDefined();
    expect(res.body.data.split.subaccount).toBe('ACCT_AFRICAN_TALES_99');
    expect(res.body.data.split.producer_share).toBe(80);
    expect(res.body.data.split.hub_share).toBe(20);
    expect(res.body.data.split.producer_amount).toBe(80);
    expect(res.body.data.split.hub_amount).toBe(20);

    global.fetch = originalFetch;
  });

  it('GET /api/paystack/verify/:reference handles verification and asserts 80/20 split in demo mode', async () => {
    const res = await request(app).get('/api/paystack/verify/demo_ref_xyz123');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(res.body.data.status).toBe('success');
    expect(res.body.data.split).toBeDefined();
    expect(res.body.data.split.producer_share).toBe(80);
    expect(res.body.data.split.hub_share).toBe(20);
    expect(res.body.data.split.producer_amount).toBe(8000);
    expect(res.body.data.split.hub_amount).toBe(2000);
  });

  it('GET /api/paystack/verify/:reference with live mocked Paystack client asserts 80/20 split fields', async () => {
    process.env.PAYSTACK_SECRET_KEY = 'sk_live_mock_secret_key_12345';
    const originalFetch = global.fetch;
    global.fetch = async (url: any) => {
      if (url.toString().includes('/transaction/verify/')) {
        return {
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify({
              status: true,
              message: 'Verification successful',
              data: {
                status: 'success',
                reference: 'pstk_live_verif_9988',
                amount: 50000,
                currency: 'GHS',
                customer: { email: 'patron@cinema.com' },
              },
            }),
        } as any;
      }
      return { ok: true, status: 200, text: async () => '{}' } as any;
    };

    const res = await request(app).get('/api/paystack/verify/pstk_live_verif_9988');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(res.body.data.status).toBe('success');
    expect(res.body.data.reference).toBe('pstk_live_verif_9988');
    expect(res.body.data.split).toBeDefined();
    expect(res.body.data.split.producer_share).toBe(80);
    expect(res.body.data.split.hub_share).toBe(20);
    expect(res.body.data.split.producer_amount).toBe(40000);
    expect(res.body.data.split.hub_amount).toBe(10000);

    global.fetch = originalFetch;
  });

  it('POST /api/send-verification-code validates payload', async () => {
    const res = await request(app).post('/api/send-verification-code').send({
      email: 'user@example.com',
      code: '582910',
      purpose: 'account_recovery',
    });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(res.body.message).toContain('user@example.com');
  });
});
