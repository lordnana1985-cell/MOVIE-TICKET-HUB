import express from "express";
import path from "path";

const app = express();
const PORT = 3000;

// Standard express JSON and URL encoded body parsers
app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API ROUTES BEFORE VITE MIDDLEWARE

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", paystackConfigured: !!(process.env.PAYSTACK_SECRET_KEY || process.env.VITE_PAYSTACK_SECRET_KEY) });
  });

  // 1. Paystack Banks Proxy endpoint
  // Retrieves banks for Ghana (GHS) or Nigeria (NGN)
  app.get("/api/paystack/banks", async (req, res) => {
    const currency = req.query.currency || "GHS";
    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || process.env.VITE_PAYSTACK_SECRET_KEY;

    if (!PAYSTACK_SECRET_KEY) {
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
      const response = await fetch(`https://api.paystack.co/bank?currency=${currency}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      });
      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ status: false, message: "Error fetching banks: " + err.message });
    }
  });

  // 2. Create Paystack Subaccount for Producer (sets up 80/20 split)
  app.post("/api/paystack/subaccount", async (req, res) => {
    const { business_name, settlement_bank, account_number, primary_contact_email } = req.body;
    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || process.env.VITE_PAYSTACK_SECRET_KEY;

    if (!business_name || !settlement_bank || !account_number) {
      return res.status(400).json({ status: false, message: "Missing required bank/business details." });
    }

    if (!PAYSTACK_SECRET_KEY) {
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
      const response = await fetch("https://api.paystack.co/subaccount", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          business_name,
          settlement_bank, // Bank code
          account_number,
          percentage_charge: 20, // 20% platform commission, producer keeps 80%
          primary_contact_email,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json(data);
      }
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ status: false, message: "Error creating subaccount: " + err.message });
    }
  });

  // 3. Initialize Paystack Split Payment
  app.post("/api/paystack/initialize", async (req, res) => {
    const { email, amount, subaccount_code, callback_url } = req.body;
    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || process.env.VITE_PAYSTACK_SECRET_KEY;

    if (!email || !amount) {
      return res.status(400).json({ status: false, message: "Missing payment details (email or amount)." });
    }

    if (!PAYSTACK_SECRET_KEY) {
      return res.status(400).json({ status: false, message: "PAYSTACK_SECRET_KEY is not configured on this server. Please define it in your environment." });
    }
    
    try {
      const payload: any = {
        email,
        amount: Math.round(amount * 100), // Convert to minor currency (e.g. pesewas / kobo / cents)
        callback_url,
      };

      // Apply the producer subaccount split only if we have a valid subaccount code
      if (subaccount_code) {
        payload.subaccount = subaccount_code;
      }

      const response = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json(data);
      }
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ status: false, message: "Error initializing payment: " + err.message });
    }
  });

  // 4. Verify Paystack Payment
  app.get("/api/paystack/verify/:reference", async (req, res) => {
    const { reference } = req.params;
    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || process.env.VITE_PAYSTACK_SECRET_KEY;

    if (!PAYSTACK_SECRET_KEY) {
      return res.status(400).json({ status: false, message: "PAYSTACK_SECRET_KEY is not configured on this server. Please define it in your environment." });
    }

    try {
      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json(data);
      }
      res.json(data);
    } catch (err: any) {
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
