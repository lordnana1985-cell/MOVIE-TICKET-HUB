import express, { Response, NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { healthRouter } from './src/server/routes/health.js';
import { paystackRouter } from './src/server/routes/paystack.js';
import {
  AugmentedRequest,
  serverLogger,
  getSupabaseServerStatus,
  getPaystackSecretKey,
  paystackFetch,
  sentryDsn,
} from './src/server/types.js';

// Re-export for compatibility with server imports and unit tests
export type { AugmentedRequest };
export {
  serverLogger,
  getSupabaseServerStatus,
  getPaystackSecretKey,
  paystackFetch,
  sentryDsn,
};

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = 3000;

// Request ID & Structured Route Context Middleware with typed AugmentedRequest
app.use((req: AugmentedRequest, res: Response, next: NextFunction) => {
  const reqId =
    (req.headers['x-request-id'] as string) ||
    `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  req.id = reqId;
  res.setHeader('x-request-id', reqId);
  next();
});

// Standard express JSON and URL encoded body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount Modular API Routers
app.use('/api', healthRouter);
app.use('/api', paystackRouter);

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
      app.get('*', (_req: AugmentedRequest, res: Response) => {
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
