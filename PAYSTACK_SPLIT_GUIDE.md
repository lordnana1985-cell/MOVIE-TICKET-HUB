# Paystack 80/20 Revenue Split Integration Guide

This guide provides a complete, production-ready full-stack code solution to automatically split ticket sales on your platform: **80% to the Producer** and **20% to the Admin (Movie Ticket Hub)**.

---

## How Split Payments Work in Paystack

Paystack offers a powerful native feature called **Subaccounts** and **Split Transactions**. 
The most efficient way to handle this is:
1. **Create a Subaccount** for each movie producer using their bank details.
2. Set the subaccount's `percentage_charge` to `20` (which means the main account/admin keeps 20% of all sales routed to this subaccount).
3. **Initialize the Transaction** on your backend, passing the producer's `subaccount` code. Paystack automatically splits the funds: **20% to your main admin account** and **80% to the producer's subaccount**.

---

## 1. Where to Run This Code (Architecture)

> ⚠️ **CRITICAL SECURITY WARNING:** Never make direct Paystack API calls from your frontend React components. This would expose your `PAYSTACK_SECRET_KEY` in the browser, allowing anyone to steal your funds.
>
> You must run this code in a secure server-side environment. You have two primary options:

### Option A: A Node.js / Express Backend (Recommended for custom servers)
You can set up a secure Express server in your project. We've included the complete server file structure below.

### Option B: Supabase Edge Functions (Recommended if you are client-only)
Since you are already using Supabase, you can run this inside a **Supabase Edge Function** (written in TypeScript/Deno).

---

## 2. Complete Server-Side Code Solution (Express / Node.js)

Create a secure file (e.g., `server-paystack.js` or integrate into your Express backend) to handle the Paystack requests.

```javascript
import express from 'express';
import fetch from 'node-fetch'; // or use native fetch in Node 18+
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

/**
 * 1. CREATE SUBACCOUNT FOR PRODUCER
 * Run this when a producer registers their bank payout details.
 * This sets up the 20% platform commission (so producer gets 80%).
 */
app.post('/api/paystack/subaccount', async (req, res) => {
  const { business_name, settlement_bank, account_number, primary_contact_email } = req.body;

  if (!business_name || !settlement_bank || !account_number) {
    return res.status(400).json({ error: 'Missing required bank/business details.' });
  }

  try {
    const response = await fetch('https://api.paystack.co/subaccount', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        business_name,
        settlement_bank, // Bank Code (e.g. "058" for GTBank, or "057" for Zenith Ghana, etc.)
        account_number,
        percentage_charge: 20, // 20% goes to Admin (Main Account), 80% goes to Producer
        primary_contact_email,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.message });
    }

    // This will return a subaccount code, e.g., "ACCT_xxxxxxxxx"
    res.json({
      success: true,
      subaccount_code: data.data.subaccount_code,
      message: 'Subaccount created successfully with 20% admin commission.',
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

/**
 * 2. INITIALIZE PAYMENT WITH SPLIT
 * Run this when a customer clicks "Proceed to Pay" in the cart.
 * Passes the producer's subaccount code to trigger the 80/20 automatic split.
 */
app.post('/api/paystack/initialize', async (req, res) => {
  const { email, amount, subaccount_code } = req.body;

  if (!email || !amount || !subaccount_code) {
    return res.status(400).json({ error: 'Missing payment details (email, amount, or subaccount).' });
  }

  try {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amount * 100), // Convert to minor units (e.g. GH₵100 -> 10000)
        subaccount: subaccount_code, // This triggers the automatic 80/20 split!
        callback_url: 'https://yourdomain.com/payment/verify', // URL redirected to after payment
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.message });
    }

    // Returns checkout url to redirect your user to
    res.json({
      success: true,
      authorization_url: data.data.authorization_url,
      reference: data.data.reference,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

/**
 * 3. VERIFY PAYMENT (WEBHOOK OR CALLBACK)
 * Run this to confirm the payment was successful before granting movie passes.
 */
app.get('/api/paystack/verify/:reference', async (req, res) => {
  const { reference } = req.params;

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    const data = await response.json();

    if (!response.ok || data.data.status !== 'success') {
      return res.status(400).json({ success: false, message: 'Payment verification failed.' });
    }

    // Payment is verified successfully!
    res.json({
      success: true,
      amount: data.data.amount / 100, // back to major units
      metadata: data.data.metadata,
      message: 'Payment verified and split successfully processed.',
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Secure Paystack server running on port ${PORT}`);
});
```

---

## 3. Option B: Supabase Edge Function Code

If you want to run this without managing your own Node.js server, you can deploy a **Supabase Edge Function**!

Create a file at `supabase/functions/paystack-split/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, ...payload } = await req.json();

    // 1. Create Subaccount Action
    if (action === "create-subaccount") {
      const response = await fetch("https://api.paystack.co/subaccount", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          business_name: payload.business_name,
          settlement_bank: payload.settlement_bank,
          account_number: payload.account_number,
          percentage_charge: 20, // 20% admin commission, 80% to producer
          primary_contact_email: payload.email,
        }),
      });

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: response.status,
      });
    }

    // 2. Initialize Split Transaction Action
    if (action === "initialize-payment") {
      const response = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: payload.email,
          amount: Math.round(payload.amount * 100),
          subaccount: payload.subaccount_code, // Automatic split code
          callback_url: payload.callback_url,
        }),
      });

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: response.status,
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
```

---

## 4. Frontend Integration Example (React)

When your user clicks **Proceed to Pay** in `Marketplace.tsx`, call your secure backend or Supabase Edge function:

```typescript
const handleProceedToPay = async () => {
  try {
    // 1. Call your secure server endpoint to initialize payment
    const response = await fetch('https://your-api.com/api/paystack/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        amount: cartTotal,
        subaccount_code: activeProducer.paystack_subaccount_code // e.g. ACCT_xxxxxxxx
      })
    });

    const result = await response.json();

    if (result.success && result.authorization_url) {
      // 2. Redirect user to secure Paystack hosted split gateway
      window.location.href = result.authorization_url;
    } else {
      alert('Error initializing payment: ' + result.error);
    }
  } catch (err) {
    console.error('Payment error:', err);
  }
};
```

---

## 5. Fetching Bank Codes

Paystack requires **Settlement Bank Codes** when creating a subaccount. You can get the bank list for your target country (e.g. Ghana or Nigeria) dynamically using this public Paystack endpoint:

* **Ghana Banks:** `GET https://api.paystack.co/bank?currency=GHS`
* **Nigeria Banks:** `GET https://api.paystack.co/bank?currency=NGN`

Your app can fetch this bank list and populate a dropdown when producers enter their payout account details!
