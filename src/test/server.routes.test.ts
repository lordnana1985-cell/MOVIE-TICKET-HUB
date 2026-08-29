import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app, { getPaystackSecretKey, paystackFetch, getSupabaseServerStatus } from '../../server';

describe('Server API Routes & Integration Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('GET /api/health returns status ok with diagnostic and connectivity information', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.timestamp).toBe('string');
    expect(typeof res.body.paystackConfigured).toBe('boolean');
    expect(res.body.paystack).toHaveProperty('configured');
    expect(res.body.paystack).toHaveProperty('mode');
    expect(res.body.supabase).toHaveProperty('configured');
    expect(res.body.supabase).toHaveProperty('mode');
    expect(res.body.sentry).toHaveProperty('enabled');
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('correctly evaluates getSupabaseServerStatus based on environment variables', () => {
    delete process.env.VITE_SUPABASE_URL;
    delete process.env.VITE_SUPABASE_ANON_KEY;
    const simStatus = getSupabaseServerStatus();
    expect(simStatus.configured).toBe(false);
    expect(simStatus.mode).toBe('simulation');

    process.env.VITE_SUPABASE_URL = 'https://demo-project.supabase.co';
    process.env.VITE_SUPABASE_ANON_KEY = 'real-anon-key-12345';
    const liveStatus = getSupabaseServerStatus();
    expect(liveStatus.configured).toBe(true);
    expect(liveStatus.mode).toBe('live');
  });

  it('GET /api/paystack/banks returns default banks in demo mode', async () => {
    delete process.env.PAYSTACK_SECRET_KEY;
    const res = await request(app).get('/api/paystack/banks?currency=GHS');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('code');
  });

  it('POST /api/paystack/subaccount validates required payload and creates subaccount', async () => {
    delete process.env.PAYSTACK_SECRET_KEY;
    const validPayload = {
      business_name: 'Studio Cinema Hub',
      settlement_bank: 'MTN',
      account_number: '+233240000000',
      primary_contact_email: 'producer@studio.com',
    };

    const res = await request(app).post('/api/paystack/subaccount').send(validPayload);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(res.body.data.subaccount_code).toBeDefined();
    expect(res.body.data.percentage_charge).toBe(20);
  });

  it('POST /api/paystack/subaccount rejects invalid payload with 400', async () => {
    const res = await request(app).post('/api/paystack/subaccount').send({});
    expect(res.status).toBe(400);
    expect(res.body.status).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  it('POST /api/paystack/initialize initializes payment in demo mode', async () => {
    delete process.env.PAYSTACK_SECRET_KEY;
    const res = await request(app).post('/api/paystack/initialize').send({
      email: 'buyer@example.com',
      amount: 150,
      subaccount_code: 'ACCT_DEMO123',
      callback_url: 'https://example.com/callback',
    });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(res.body.data.authorization_url).toBeDefined();
    expect(res.body.data.reference).toBeDefined();
  });

  it('POST /api/paystack/initialize rejects negative or zero amounts', async () => {
    const res = await request(app).post('/api/paystack/initialize').send({
      email: 'buyer@example.com',
      amount: -10,
    });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe(false);
  });

  it('GET /api/paystack/verify/:reference handles verification for valid reference', async () => {
    delete process.env.PAYSTACK_SECRET_KEY;
    const res = await request(app).get('/api/paystack/verify/demo_ref_12345');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(res.body.data.status).toBe('success');
    expect(res.body.data.reference).toBe('demo_ref_12345');
  });

  it('POST /api/send-verification-code sends code and returns success', async () => {
    const res = await request(app).post('/api/send-verification-code').send({
      email: 'user@example.com',
      code: '123456',
      purpose: 'login_verification',
    });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(res.body.data.recipient).toBe('user@example.com');
  });

  it('POST /api/send-verification-code rejects invalid email or missing code', async () => {
    const res = await request(app).post('/api/send-verification-code').send({
      email: 'not-an-email',
      code: '12',
    });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  it('throws error when paystackFetch is called without secret key', async () => {
    delete process.env.PAYSTACK_SECRET_KEY;
    await expect(paystackFetch('https://api.paystack.co/bank', { method: 'GET' })).rejects.toThrow(
      'Paystack Secret Key is not configured on this server.'
    );
  });

  it('handles non-JSON error in paystackFetch gracefully', async () => {
    process.env.PAYSTACK_SECRET_KEY = 'sk_test_fake_key';
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      text: () => Promise.resolve('<html>Bad Gateway</html>'),
    } as any);

    await expect(paystackFetch('https://api.paystack.co/bank', { method: 'GET' })).rejects.toThrow(
      'Paystack API returned non-JSON response'
    );

    global.fetch = originalFetch;
  });

  it('handles live paystack API response in /api/paystack/banks', async () => {
    process.env.PAYSTACK_SECRET_KEY = 'sk_test_mock';
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () =>
        Promise.resolve(
          JSON.stringify({ status: true, data: [{ name: 'Test Bank', code: 'TB' }] })
        ),
    } as any);

    const res = await request(app).get('/api/paystack/banks');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(res.body.data[0].code).toBe('TB');

    global.fetch = originalFetch;
  });

  it('handles live paystack API error in /api/paystack/banks', async () => {
    process.env.PAYSTACK_SECRET_KEY = 'sk_test_mock';
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve(JSON.stringify({ status: false, message: 'Invalid Key' })),
    } as any);

    const res = await request(app).get('/api/paystack/banks');
    expect(res.status).toBe(401);
    expect(res.body.status).toBe(false);

    global.fetch = originalFetch;
  });

  it('sanitizes Paystack secret key with quotes correctly', () => {
    process.env.PAYSTACK_SECRET_KEY = '"sk_test_123456"';
    expect(getPaystackSecretKey()).toBe('sk_test_123456');
  });
});
