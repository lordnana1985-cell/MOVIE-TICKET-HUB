import express from "express";
import path from "path";
import dotenv from "dotenv";

// Load environment variables from .env file (primarily for local development)
dotenv.config();

const app = express();
const PORT = 3000;

// Standard express JSON and URL encoded body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper function to safely get and sanitize the Paystack Secret Key
function getPaystackSecretKey(): string | undefined {
  const rawKey = process.env.PAYSTACK_SECRET_KEY || process.env.VITE_PAYSTACK_SECRET_KEY;
  if (!rawKey) return undefined;
  // Clean surrounding double/single quotes and any trailing/leading whitespace from copied-and-pasted keys
  return rawKey.trim().replace(/^["']|["']$/g, "");
}

// Robust Paystack fetch wrapper to prevent 500 crashes and catch non-JSON/HTML errors gracefully
async function paystackFetch(url: string, options: { method: "GET" | "POST"; body?: any }) {
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
    console.error(`[Paystack API Non-JSON Error] Path: ${url}. Status Code: ${response.status}. Raw Response:`, responseText);
    throw new Error(`Paystack API returned an invalid non-JSON response (status code ${response.status}). Ensure your PAYSTACK_SECRET_KEY is fully valid.`);
  }

  return {
    ok: response.ok,
    status: response.status,
    data: responseData,
  };
}

  // API ROUTES BEFORE VITE MIDDLEWARE

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", paystackConfigured: !!getPaystackSecretKey() });
  });

  // 1. Paystack Banks Proxy endpoint
  // Retrieves banks for Ghana (GHS) or Nigeria (NGN)
  app.get("/api/paystack/banks", async (req, res) => {
    const currency = req.query.currency || "GHS";
    const secretKey = getPaystackSecretKey();

    if (!secretKey) {
      // Return beautiful mock banks list for testing when not configured
      console.log("No PAYSTACK_SECRET_KEY found, returning demo banks.");
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
      console.error("[Banks API Error]:", err);
      res.status(500).json({ status: false, message: "Error fetching banks: " + err.message });
    }
  });

  // 2. Create Paystack Subaccount for Producer (sets up 80/20 split)
  app.post("/api/paystack/subaccount", async (req, res) => {
    const { business_name, settlement_bank, account_number, primary_contact_email } = req.body;
    const secretKey = getPaystackSecretKey();

    if (!business_name || !settlement_bank || !account_number) {
      return res.status(400).json({ status: false, message: "Missing required bank/business details." });
    }

    if (!secretKey) {
      // Simulate subaccount creation for demo testing
      const randomSubCode = "ACCT_" + Math.random().toString(36).substring(2, 12).toUpperCase();
      console.log(`[Demo] Creating subaccount for ${business_name} with subaccount_code ${randomSubCode}`);
      return res.json({
        status: true,
        message: "Subaccount created successfully (DEMO MODE)",
        data: {
          subaccount_code: randomSubCode,
          business_name,
          settlement_bank,
          account_number
        }
      });
    }

    try {
      const result = await paystackFetch("https://api.paystack.co/subaccount", {
        method: "POST",
        body: {
          business_name,
          settlement_bank, // Bank code
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
      console.error("[Subaccount API Error]:", err);
      res.status(500).json({ status: false, message: "Error creating subaccount: " + err.message });
    }
  });

  // 3. Initialize Paystack Split Payment
  app.post("/api/paystack/initialize", async (req, res) => {
    const { email, amount, subaccount_code, callback_url } = req.body;
    const secretKey = getPaystackSecretKey();

    if (!email || !amount) {
      return res.status(400).json({ status: false, message: "Missing payment details (email or amount)." });
    }

    if (!secretKey) {
      return res.status(400).json({ status: false, message: "PAYSTACK_SECRET_KEY is not configured on this server. Please define it in your environment." });
    }
    
    try {
      const payload: any = {
        email,
        amount: Math.round(Number(amount) * 100), // Convert to minor currency (e.g. pesewas / kobo / cents)
        callback_url,
      };

      // Apply the producer subaccount split only if we have a valid subaccount code
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
      console.error("[Initialize API Error]:", err);
      res.status(500).json({ status: false, message: "Error initializing payment: " + err.message });
    }
  });

  // 4. Verify Paystack Payment
  app.get("/api/paystack/verify/:reference", async (req, res) => {
    const { reference } = req.params;
    const secretKey = getPaystackSecretKey();

    if (!secretKey) {
      return res.status(400).json({ status: false, message: "PAYSTACK_SECRET_KEY is not configured on this server. Please define it in your environment." });
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
      console.error("[Verify API Error]:", err);
      res.status(500).json({ status: false, message: "Error verifying payment: " + err.message });
    }
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
        console.error("Failed to load Vite server middleware:", err);
      }
    } else if (!process.env.VERCEL) {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }

  setupFrontend();

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

  export default app;
