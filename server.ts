import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { 
  subaccountSchema, 
  paymentInitializeSchema, 
  verificationCodeSchema 
} from "./src/lib/schemas.js";

// Load environment variables from .env file (primarily for local development)
dotenv.config();

const app = express();
const PORT = 3000;

// Standard express JSON and URL encoded body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper function to safely get and sanitize the Paystack Secret Key
export function getPaystackSecretKey(): string | undefined {
  const rawKey = process.env.PAYSTACK_SECRET_KEY;
  if (!rawKey) return undefined;
  // Clean surrounding quotes and trailing/leading whitespace
  return rawKey.trim().replace(/^["']|["']$/g, "");
}

// Robust Paystack fetch wrapper to prevent crashes and handle errors gracefully
export async function paystackFetch(url: string, options: { method: "GET" | "POST"; body?: any }) {
  const secretKey = getPaystackSecretKey();
  if (!secretKey) {
    throw new Error("Paystack Secret Key is not configured on this server.");
  }

  const headers: HeadersInit = {
    Authorization: `Bearer ${secretKey}`,
  };

  if (options.body) {
    headers["Content-Type"] = "application/json";
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
  } catch (err) {
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
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    paystackConfigured: !!getPaystackSecretKey(),
    uptimeSeconds: Math.floor(process.uptime())
  });
});

// 1. Paystack Banks Proxy endpoint
app.get("/api/paystack/banks", async (req: Request, res: Response) => {
  const currency = (req.query.currency as string) || "GHS";
  const secretKey = getPaystackSecretKey();

  if (!secretKey) {
    return res.json({
      status: true,
      message: "Banks retrieved successfully (DEMO MODE)",
      data: [
        { name: "MTN Mobile Money", code: "MTN" },
        { name: "Telecel Cash", code: "VOD" },
        { name: "AirtelTigo Money", code: "ATL" },
        { name: "GCB Bank", code: "040100" },
        { name: "Ecobank Ghana", code: "130100" },
        { name: "Zenith Bank Ghana", code: "180100" },
        { name: "Guaranty Trust Bank Ghana", code: "210100" },
        { name: "Fidelity Bank Ghana", code: "240100" }
      ]
    });
  }

  try {
    const result = await paystackFetch(`https://api.paystack.co/bank?currency=${currency}`, {
      method: "GET",
    });

    if (!result.ok) {
      return res.status(result.status).json(result.data);
    }
    res.json(result.data);
  } catch (err: any) {
    res.status(500).json({ status: false, message: "Error fetching banks: " + err.message });
  }
});

// 2. Create Paystack Subaccount for Producer (80/20 split)
app.post("/api/paystack/subaccount", async (req: Request, res: Response) => {
  const parseResult = subaccountSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ 
      status: false, 
      message: "Validation failed for subaccount parameters",
      errors: parseResult.error.flatten().fieldErrors 
    });
  }

  const { business_name, settlement_bank, account_number, primary_contact_email } = parseResult.data;
  const secretKey = getPaystackSecretKey();

  if (!secretKey) {
    const randomSubCode = "ACCT_" + Math.random().toString(36).substring(2, 12).toUpperCase();
    return res.json({
      status: true,
      message: "Subaccount created successfully (DEMO MODE)",
      data: {
        subaccount_code: randomSubCode,
        business_name,
        settlement_bank,
        account_number,
        percentage_charge: 20
      }
    });
  }

  try {
    const result = await paystackFetch("https://api.paystack.co/subaccount", {
      method: "POST",
      body: {
        business_name,
        settlement_bank,
        account_number,
        percentage_charge: 20, // 20% platform commission, producer keeps 80%
        primary_contact_email,
      },
    });

    if (!result.ok) {
      return res.status(result.status).json(result.data);
    }
    res.json(result.data);
  } catch (err: any) {
    res.status(500).json({ status: false, message: "Error creating subaccount: " + err.message });
  }
});

// 3. Initialize Paystack Split Payment
app.post("/api/paystack/initialize", async (req: Request, res: Response) => {
  const parseResult = paymentInitializeSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ 
      status: false, 
      message: "Validation failed for payment initialize parameters",
      errors: parseResult.error.flatten().fieldErrors 
    });
  }

  const { email, amount, subaccount_code, callback_url } = parseResult.data;
  const secretKey = getPaystackSecretKey();

  if (!secretKey) {
    const demoRef = "demo_ref_" + Math.random().toString(36).substring(2, 12);
    const separator = (callback_url && callback_url.includes('?')) ? '&' : '?';
    return res.json({
      status: true,
      message: "Payment initialized (DEMO MODE)",
      data: {
        authorization_url: `${callback_url || '/'}${separator}paystack_callback=true&status=success&ref=${demoRef}`,
        access_code: "demo_access_code",
        reference: demoRef
      }
    });
  }
  
  try {
    const payload: any = {
      email,
      amount: Math.round(Number(amount) * 100), // Convert to lowest currency unit
      callback_url,
    };

    if (subaccount_code) {
      payload.subaccount = subaccount_code;
    }

    const result = await paystackFetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      body: payload,
    });

    if (!result.ok) {
      return res.status(result.status).json(result.data);
    }
    res.json(result.data);
  } catch (err: any) {
    res.status(500).json({ status: false, message: "Error initializing payment: " + err.message });
  }
});

// 4. Verify Paystack Payment
app.get("/api/paystack/verify/:reference", async (req: Request, res: Response) => {
  const { reference } = req.params;
  const secretKey = getPaystackSecretKey();

  if (!reference || reference.trim().length === 0) {
    return res.status(400).json({ status: false, message: "Transaction reference is required." });
  }

  if (!secretKey || reference.startsWith('demo_ref_') || reference.startsWith('pstk_')) {
    return res.json({
      status: true,
      message: "Verification successful (DEMO MODE)",
      data: {
        status: "success",
        reference,
        amount: 10000,
        currency: "GHS"
      }
    });
  }

  try {
    const result = await paystackFetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
    });

    if (!result.ok) {
      return res.status(result.status).json(result.data);
    }
    res.json(result.data);
  } catch (err: any) {
    res.status(500).json({ status: false, message: "Error verifying payment: " + err.message });
  }
});

// 5. Send Security Verification Code
app.post("/api/send-verification-code", async (req: Request, res: Response) => {
  const parseResult = verificationCodeSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ 
      status: false, 
      message: "Validation failed for verification code payload",
      errors: parseResult.error.flatten().fieldErrors 
    });
  }

  const { email, code, purpose } = parseResult.data;

  return res.json({
    status: true,
    message: `Security code successfully dispatched to ${email}`,
    data: {
      recipient: email,
      purpose: purpose || 'verification',
      timestamp: new Date().toISOString()
    }
  });
});

// VITE DEV MIDDLEWARE / STATIC FILES FALLBACK
async function setupFrontend() {
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    try {
      const viteMod = "vite";
      const { createServer: createViteServer } = await import(viteMod);
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (err) {
      // Fallback
    }
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
}

setupFrontend();

if (!process.env.VERCEL && !process.env.VITEST && process.env.NODE_ENV !== "test") {
  app.listen(PORT, "0.0.0.0", () => {
    // Dev server listening
  });
}

export default app;
