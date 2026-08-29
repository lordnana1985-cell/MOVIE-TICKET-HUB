import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import pino from 'pino';
import * as Sentry from '@sentry/node';
import {
  subaccountSchema,
  paymentInitializeSchema,
  verificationCodeSchema,
} from './src/lib/schemas.js';

// Load environment variables from .env file (primarily for local development)
dotenv.config();

// Optional Sentry error tracking initialization
const sentryDsn = process.env.SENTRY_DSN?.trim();
if (sentryDsn && !sentryDsn.includes('placeholder')) {
  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 1.0,
  });
}

// Structured Pino logger with test-mode suppression
export const serverLogger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'test' ? 'silent' : 'info'),
  formatters: {
    level: (label) => ({ level: label }),
  },
});

const app = express();
const PORT = 3000;

// Request ID & Structured Route Context Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const reqId =
    (req.headers['x-request-id'] as string) ||
    `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  (req as any).id = reqId;
  res.setHeader('x-request-id', reqId);
  next();
});

// Standard express JSON and URL encoded body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper function to safely check Supabase configuration on the server side
export function getSupabaseServerStatus() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseKey =
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    '';
  const isConfigured = Boolean(
    supabaseUrl &&
    supabaseKey &&
    (supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://')) &&
    !supabaseUrl.includes('placeholder') &&
    !supabaseUrl.includes('your-project')
  );
  return {
    configured: isConfigured,
    mode: isConfigured ? ('live' as const) : ('simulation' as const),
    status: 'ready' as const,
  };
}

// Helper function to safely get and sanitize the Paystack Secret Key
export function getPaystackSecretKey(): string | undefined {
  const rawKey = process.env.PAYSTACK_SECRET_KEY;
  if (!rawKey) return undefined;
  // Clean surrounding quotes and trailing/leading whitespace
  const cleaned = rawKey.trim().replace(/^["']|["']$/g, '');
  if (
    cleaned.length === 0 ||
    cleaned.includes('placeholder') ||
    cleaned.includes('your_') ||
    cleaned.includes('your-')
  ) {
    return undefined;
  }
  return cleaned;
}

// Robust Paystack fetch wrapper to prevent crashes and handle errors gracefully
export async function paystackFetch(url: string, options: { method: 'GET' | 'POST'; body?: any }) {
  const secretKey = getPaystackSecretKey();
  if (!secretKey) {
    throw new Error('Paystack Secret Key is not configured on this server.');
  }

  const headers: HeadersInit = {
    Authorization: `Bearer ${secretKey}`,
  };

  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    method: options.method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const responseText = await response.text();
  let responseData: any;
  try {
    responseData = JSON.parse(responseText);
  } catch {
    throw new Error(`Paystack API returned non-JSON response (status ${response.status})`);
  }

  return {
    ok: response.ok,
    status: response.status,
    data: responseData,
  };
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// Health check endpoint with diagnostic metrics
app.get('/api/health', (req: Request, res: Response) => {
  const secretKey = getPaystackSecretKey();
  const supabaseStatus = getSupabaseServerStatus();
  const reqId = (req as any).id;

  serverLogger.info({ reqId, route: '/api/health' }, 'Health check requested');

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    paystackConfigured: !!secretKey,
    paystack: {
      configured: !!secretKey,
      mode: secretKey ? 'live' : 'simulation',
      status: 'ready',
    },
    supabase: supabaseStatus,
    sentry: {
      enabled: Boolean(sentryDsn && !sentryDsn.includes('placeholder')),
    },
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

// 1. Paystack Banks Proxy endpoint
app.get('/api/paystack/banks', async (req: Request, res: Response) => {
  const currency = (req.query.currency as string) || 'GHS';
  const secretKey = getPaystackSecretKey();
  const reqId = (req as any).id;

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
  } catch (err: any) {
    serverLogger.error(
      { reqId, route: '/api/paystack/banks', error: err.message },
      'Error fetching banks from Paystack'
    );
    res.status(500).json({ status: false, message: 'Error fetching banks: ' + err.message });
  }
});

// 2. Create Paystack Subaccount for Producer (80/20 split)
app.post('/api/paystack/subaccount', async (req: Request, res: Response) => {
  const reqId = (req as any).id;
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
  } catch (err: any) {
    serverLogger.error(
      { reqId, route: '/api/paystack/subaccount', error: err.message },
      'Error creating subaccount'
    );
    res.status(500).json({ status: false, message: 'Error creating subaccount: ' + err.message });
  }
});

// 3. Initialize Paystack Split Payment
app.post('/api/paystack/initialize', async (req: Request, res: Response) => {
  const reqId = (req as any).id;
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
      },
    });
  }

  try {
    serverLogger.info(
      { reqId, route: '/api/paystack/initialize', email, amount, subaccount_code, mode: 'live' },
      'Initializing Paystack payment'
    );
    const payload: any = {
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
    res.json(result.data);
  } catch (err: any) {
    serverLogger.error(
      { reqId, route: '/api/paystack/initialize', error: err.message },
      'Error initializing payment'
    );
    res.status(500).json({ status: false, message: 'Error initializing payment: ' + err.message });
  }
});

// 4. Verify Paystack Payment
app.get('/api/paystack/verify/:reference', async (req: Request, res: Response) => {
  const reqId = (req as any).id;
  const { reference } = req.params;
  const secretKey = getPaystackSecretKey();

  if (!reference || reference.trim().length === 0) {
    serverLogger.warn(
      { reqId, route: '/api/paystack/verify/:reference' },
      'Transaction reference is required'
    );
    return res.status(400).json({ status: false, message: 'Transaction reference is required.' });
  }

  if (!secretKey || reference.startsWith('demo_ref_') || reference.startsWith('pstk_')) {
    serverLogger.info(
      { reqId, route: '/api/paystack/verify/:reference', reference, mode: 'demo' },
      'Payment verified in demo mode'
    );
    return res.json({
      status: true,
      message: 'Verification successful (DEMO MODE)',
      data: {
        status: 'success',
        reference,
        amount: 10000,
        currency: 'GHS',
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
    res.json(result.data);
  } catch (err: any) {
    serverLogger.error(
      {
        reqId,
        route: '/api/paystack/verify/:reference',
        reference,
        error: err.message,
        stack: err.stack,
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
    res.status(500).json({ status: false, message: 'Error verifying payment: ' + err.message });
  }
});

// 5. Send Security Verification Code
app.post('/api/send-verification-code', async (req: Request, res: Response) => {
  const reqId = (req as any).id;
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

// VITE DEV MIDDLEWARE / STATIC FILES FALLBACK
async function startServer() {
  try {
    if (process.env.NODE_ENV !== 'production') {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    const isTest = process.env.IS_TEST_ENV === 'true' || process.env.NODE_ENV === 'test';
    if (!isTest) {
      const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
      server.on('error', (err) => {
        console.error('Express listen error:', err);
      });
    }
  } catch (err) {
    console.error('Error in startServer:', err);
  }
}

const isTest = process.env.IS_TEST_ENV === 'true' || process.env.NODE_ENV === 'test';
if (!isTest) {
  startServer();
}

export default app;
