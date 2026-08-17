import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../../server';

describe('Server API Endpoints & Zod Validation', () => {
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
    const res = await request(app)
      .post('/api/paystack/subaccount')
      .send({
        business_name: 'A', // too short
        settlement_bank: '',
        account_number: '123'
      });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe(false);
    expect(res.body).toHaveProperty('errors');
  });

  it('POST /api/paystack/subaccount accepts valid input payload', async () => {
    const res = await request(app)
      .post('/api/paystack/subaccount')
      .send({
        business_name: 'Apex Cinema Group',
        settlement_bank: 'MTN',
        account_number: '0241234567',
        primary_contact_email: 'apex@cinema.com'
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(res.body.data).toHaveProperty('subaccount_code');
  });

  it('POST /api/paystack/initialize validates email and positive amount', async () => {
    const invalidRes = await request(app)
      .post('/api/paystack/initialize')
      .send({
        email: 'invalid-email',
        amount: -10
      });

    expect(invalidRes.status).toBe(400);
    expect(invalidRes.body.status).toBe(false);

    const validRes = await request(app)
      .post('/api/paystack/initialize')
      .send({
        email: 'customer@domain.com',
        amount: 50,
        callback_url: 'https://movietickethub.app/callback'
      });

    expect(validRes.status).toBe(200);
    expect(validRes.body.status).toBe(true);
    expect(validRes.body.data).toHaveProperty('reference');
  });

  it('GET /api/paystack/verify/:reference handles verification', async () => {
    const res = await request(app).get('/api/paystack/verify/demo_ref_xyz123');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(res.body.data.status).toBe('success');
  });

  it('POST /api/send-verification-code validates payload', async () => {
    const res = await request(app)
      .post('/api/send-verification-code')
      .send({
        email: 'user@example.com',
        code: '582910',
        purpose: 'account_recovery'
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(res.body.message).toContain('user@example.com');
  });
});
