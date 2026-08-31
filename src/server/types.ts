import { Request } from 'express';
import pino from 'pino';
import * as Sentry from '@sentry/node';

export interface AugmentedRequest extends Request {
  id?: string;
}

// Optional Sentry error tracking initialization
export const sentryDsn = process.env.SENTRY_DSN?.trim();
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
