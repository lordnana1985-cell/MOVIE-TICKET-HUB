import { Router, Response } from 'express';
import { serverLogger, getPaystackSecretKey, getSupabaseServerStatus, sentryDsn, AugmentedRequest } from '../types.js';

export const healthRouter = Router();

// Health check endpoint with diagnostic metrics
healthRouter.get('/health', (req: AugmentedRequest, res: Response) => {
  const secretKey = getPaystackSecretKey();
  const supabaseStatus = getSupabaseServerStatus();
  const reqId = req.id;

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
