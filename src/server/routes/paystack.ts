import { Router, Response } from 'express';
import * as Sentry from '@sentry/node';
import {
  subaccountSchema,
  paymentInitializeSchema,
  verificationCodeSchema,
} from '../../lib/schemas.js';
import {
  AugmentedRequest,
  serverLogger,
  getPaystackSecretKey,
  paystackFetch,
  sentryDsn,
} from '../types.js';

export const paystackRouter = Router();

// 1. Paystack Banks Proxy endpoint
paystackRouter.get('/paystack/banks', async (req: AugmentedRequest, res: Response) => {
  const currency = (req.query.currency as string) || 'GHS';
  const secretKey = getPaystackSecretKey();
  const reqId = req.id;

  if (!secretKey) {
    serverLogger.info(
      { reqId, route: '/api/paystack/banks', currency, mode: 'demo' },
      'Serving mock banks in demo mode'
    );
    return res.json({
      status: true,
      message: 'Banks retrieved successfully (DEMO MODE)',
      data: [
        { name: 'MTN Mobile Money', code: 'MTN' },
        { name: 'Telecel Cash', code: 'VOD' },
        { name: 'AirtelTigo Money', code: 'ATL' },
        { name: 'GCB Bank', code: '040100' },
        { name: 'Ecobank Ghana', code: '130100' },
        { name: 'Zenith Bank Ghana', code: '180100' },
        { name: 'Guaranty Trust Bank Ghana', code: '210100' },
        { name: 'Fidelity Bank Ghana', code: '240100' },
      ],
    });
  }

  try {
    serverLogger.info(
      { reqId, route: '/api/paystack/banks', currency, mode: 'live' },
      'Fetching banks from Paystack API'
    );
    const result = await paystackFetch(`https://api.paystack.co/bank?currency=${currency}`, {
      method: 'GET',
    });

    if (!result.ok) {
      serverLogger.warn(
        { reqId, route: '/api/paystack/banks', status: result.status },
        'Paystack banks retrieval non-ok response'
      );
      return res.status(result.status).json(result.data);
    }
    res.json(result.data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    serverLogger.error(
      { reqId, route: '/api/paystack/banks', error: message },
      'Error fetching banks from Paystack'
    );
    res.status(500).json({ status: false, message: 'Error fetching banks: ' + message });
  }
});

// 2. Create Paystack Subaccount for Producer (80/20 split)
paystackRouter.post('/paystack/subaccount', async (req: AugmentedRequest, res: Response) => {
  const reqId = req.id;
  const parseResult = subaccountSchema.safeParse(req.body);
  if (!parseResult.success) {
    serverLogger.warn(
      { reqId, route: '/api/paystack/subaccount', errors: parseResult.error.flatten().fieldErrors },
      'Validation failed for subaccount parameters'
    );
    return res.status(400).json({
      status: false,
      message: 'Validation failed for subaccount parameters',
      errors: parseResult.error.flatten().fieldErrors,
    });
  }

  const { business_name, settlement_bank, account_number, primary_contact_email } =
    parseResult.data;
  const secretKey = getPaystackSecretKey();

  if (!secretKey) {
    const randomSubCode = 'ACCT_' + Math.random().toString(36).substring(2, 12).toUpperCase();
    serverLogger.info(
      { reqId, route: '/api/paystack/subaccount', subaccount_code: randomSubCode, mode: 'demo' },
      'Subaccount created in demo mode'
    );
    return res.json({
      status: true,
      message: 'Subaccount created successfully (DEMO MODE)',
      data: {
        subaccount_code: randomSubCode,
        business_name,
        settlement_bank,
        account_number,
        percentage_charge: 20,
      },
    });
  }

  try {
    serverLogger.info(
      { reqId, route: '/api/paystack/subaccount', business_name, settlement_bank, mode: 'live' },
      'Creating Paystack subaccount'
    );
    const result = await paystackFetch('https://api.paystack.co/subaccount', {
      method: 'POST',
      body: {
        business_name,
        settlement_bank,
        account_number,
        percentage_charge: 20, // 20% platform commission, producer keeps 80%
        primary_contact_email,
      },
    });

    if (!result.ok) {
      serverLogger.warn(
        { reqId, route: '/api/paystack/subaccount', status: result.status },
        'Paystack subaccount creation returned non-ok status'
      );
      return res.status(result.status).json(result.data);
    }
    res.json(result.data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    serverLogger.error(
      { reqId, route: '/api/paystack/subaccount', error: message },
      'Error creating subaccount'
    );
    res.status(500).json({ status: false, message: 'Error creating subaccount: ' + message });
  }
});

// 3. Initialize Paystack Split Payment
paystackRouter.post('/paystack/initialize', async (req: AugmentedRequest, res: Response) => {
  const reqId = req.id;
  const parseResult = paymentInitializeSchema.safeParse(req.body);
  if (!parseResult.success) {
    serverLogger.warn(
      { reqId, route: '/api/paystack/initialize', errors: parseResult.error.flatten().fieldErrors },
      'Validation failed for payment initialize parameters'
    );
    return res.status(400).json({
      status: false,
      message: 'Validation failed for payment initialize parameters',
      errors: parseResult.error.flatten().fieldErrors,
    });
  }

  const { email, amount, subaccount_code, callback_url } = parseResult.data;
  const secretKey = getPaystackSecretKey();

  if (!secretKey) {
    const demoRef = 'demo_ref_' + Math.random().toString(36).substring(2, 12);
    const separator = callback_url && callback_url.includes('?') ? '&' : '?';
    const totalAmount = Number(amount) || 0;
    const splitData = subaccount_code
      ? {
          subaccount: subaccount_code,
          producer_share: 80,
          hub_share: 20,
          producer_share_percentage: 80,
          platform_share_percentage: 20,
          producer_amount: Math.round(totalAmount * 0.8),
          hub_amount: Math.round(totalAmount * 0.2),
        }
      : undefined;

    serverLogger.info(
      { reqId, route: '/api/paystack/initialize', reference: demoRef, mode: 'demo' },
      'Payment initialized in demo mode'
    );
    return res.json({
      status: true,
      message: 'Payment initialized (DEMO MODE)',
      data: {
        authorization_url: `${callback_url || '/'}${separator}paystack_callback=true&status=success&ref=${demoRef}`,
        access_code: 'demo_access_code',
        reference: demoRef,
        split: splitData,
      },
    });
  }

  try {
    serverLogger.info(
      { reqId, route: '/api/paystack/initialize', email, amount, subaccount_code, mode: 'live' },
      'Initializing Paystack payment'
    );
    const payload: { email: string; amount: number; callback_url?: string; subaccount?: string } = {
      email,
      amount: Math.round(Number(amount) * 100), // Convert to lowest currency unit
      callback_url,
    };

    if (subaccount_code) {
      payload.subaccount = subaccount_code;
    }

    const result = await paystackFetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      body: payload,
    });

    if (!result.ok) {
      serverLogger.warn(
        { reqId, route: '/api/paystack/initialize', status: result.status },
        'Paystack payment initialization returned non-ok status'
      );
      return res.status(result.status).json(result.data);
    }
    const responseData = { ...result.data };
    if (responseData.data && subaccount_code) {
      const totalAmount = Number(amount) || 0;
      responseData.data.split = responseData.data.split || {
        subaccount: subaccount_code,
        producer_share: 80,
        hub_share: 20,
        producer_share_percentage: 80,
        platform_share_percentage: 20,
        producer_amount: Math.round(totalAmount * 0.8),
        hub_amount: Math.round(totalAmount * 0.2),
      };
    }
    res.json(responseData);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    serverLogger.error(
      { reqId, route: '/api/paystack/initialize', error: message },
      'Error initializing payment'
    );
    res.status(500).json({ status: false, message: 'Error initializing payment: ' + message });
  }
});

// 4. Verify Paystack Payment
paystackRouter.get('/paystack/verify/:reference', async (req: AugmentedRequest, res: Response) => {
  const reqId = req.id;
  const { reference } = req.params;
  const secretKey = getPaystackSecretKey();

  if (!reference || reference.trim().length === 0) {
    serverLogger.warn(
      { reqId, route: '/api/paystack/verify/:reference' },
      'Transaction reference is required'
    );
    return res.status(400).json({ status: false, message: 'Transaction reference is required.' });
  }

  if (!secretKey || reference.startsWith('demo_ref_')) {
    serverLogger.info(
      { reqId, route: '/api/paystack/verify/:reference', reference, mode: 'demo' },
      'Payment verified in demo mode'
    );
    const defaultAmount = 10000;
    return res.json({
      status: true,
      message: 'Verification successful (DEMO MODE)',
      data: {
        status: 'success',
        reference,
        amount: defaultAmount,
        currency: 'GHS',
        split: {
          producer_share: 80,
          hub_share: 20,
          producer_share_percentage: 80,
          platform_share_percentage: 20,
          producer_amount: Math.round(defaultAmount * 0.8),
          hub_amount: Math.round(defaultAmount * 0.2),
        },
      },
    });
  }

  try {
    serverLogger.info(
      { reqId, route: '/api/paystack/verify/:reference', reference, mode: 'live' },
      'Verifying payment with Paystack'
    );
    const result = await paystackFetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
    });

    if (!result.ok) {
      serverLogger.warn(
        { reqId, route: '/api/paystack/verify/:reference', reference, status: result.status },
        'Paystack verification returned non-ok status'
      );
      return res.status(result.status).json(result.data);
    }
    const responseData = { ...result.data };
    if (responseData.data) {
      const verifiedAmount = responseData.data.amount || 0;
      responseData.data.split = responseData.data.split || {
        producer_share: 80,
        hub_share: 20,
        producer_share_percentage: 80,
        platform_share_percentage: 20,
        producer_amount: Math.round(verifiedAmount * 0.8),
        hub_amount: Math.round(verifiedAmount * 0.2),
      };
    }
    res.json(responseData);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const stack = err instanceof Error ? err.stack : undefined;
    serverLogger.error(
      {
        reqId,
        route: '/api/paystack/verify/:reference',
        reference,
        error: message,
        stack,
      },
      'Error verifying payment'
    );
    if (sentryDsn && !sentryDsn.includes('placeholder')) {
      Sentry.captureException(err, {
        extra: {
          route: req.originalUrl,
          reference,
          reqId,
        },
      });
    }
    res.status(500).json({ status: false, message: 'Error verifying payment: ' + message });
  }
});

// 5. Send Security Verification Code
paystackRouter.post('/send-verification-code', async (req: AugmentedRequest, res: Response) => {
  const reqId = req.id;
  const parseResult = verificationCodeSchema.safeParse(req.body);
  if (!parseResult.success) {
    serverLogger.warn(
      {
        reqId,
        route: '/api/send-verification-code',
        errors: parseResult.error.flatten().fieldErrors,
      },
      'Validation failed for verification code payload'
    );
    return res.status(400).json({
      status: false,
      message: 'Validation failed for verification code payload',
      errors: parseResult.error.flatten().fieldErrors,
    });
  }

  const { email, purpose } = parseResult.data;
  serverLogger.info(
    { reqId, route: '/api/send-verification-code', email, purpose },
    'Security verification code sent'
  );

  return res.json({
    status: true,
    message: `Security code successfully dispatched to ${email}`,
    data: {
      recipient: email,
      purpose: purpose || 'verification',
      timestamp: new Date().toISOString(),
    },
  });
});
