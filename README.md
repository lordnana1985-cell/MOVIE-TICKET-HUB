# Movie Ticket Hub (Event Ticket Hub - ETH)

[![CI Build & Test](https://img.shields.io/badge/CI-Passing-success?style=flat-square&logo=githubactions)](https://github.com/lordnana1985-cell/MOVIE-TICKET-HUB/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4.1-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-Coverage_Enforced-yellow?style=flat-square&logo=vitest)](https://vitest.dev/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

An enterprise-grade African cinema, stage play, and live event ticketing platform. Features real-time seat inventory, Paystack automated revenue split settlement (**80% event producer / 20% platform**), high-speed QR/barcode gate validation, and offline-first hybrid data persistence.

---

## 📑 Table of Contents

- [Key Features](#-key-features)
- [Architecture & Package Responsibilities](#-architecture--package-responsibilities)
- [Data Flow & 80/20 Payment Split Architecture](#-data-flow--8020-payment-split-architecture)
- [Quickstart & Onboarding](#-quickstart--onboarding)
- [Environment Variables Reference](#-environment-variables-reference)
- [Backend API Specification](#-backend-api-specification)
- [Database & Offline-First Resilience](#-database--offline-first-resilience)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [CI/CD & Security Audits](#-cicd--security-audits)
- [Docker & Containerization](#-docker--containerization)
- [Contributing Guidelines](#-contributing-guidelines)

---

## 🚀 Key Features

- **Event & Movie Marketplace**: Interactive event discovery, rich trailer media previews, category & venue filtering, dynamic cart management, and seat reservation counters.
- **Paystack 80/20 Automated Revenue Splits**: Server-side proxy handling subaccount creation, transaction initialization, webhook callbacks, and direct banking settlements without exposing secrets to the browser.
- **Producer / Filmmaker Dashboard**: Self-serve ticket creation with custom tiering and seating capacities, live gross revenue metrics, automated bank account verification, and inventory control.
- **Gatekeeper Mobile Scanner**: High-speed camera QR code scanner & manual numerical ticket entry with live admission logging, duplicate prevention, and offline ticket verification.
- **Digital Pass Wallet**: Dynamic QR code passes, visual verification badges, offline wallet caching, and print/download pass capability.
- **Hybrid Data Layer**: Real-time Supabase cloud database with synchronized, transparent LocalStorage fallback for offline resilience.

---

## 🛠️ Architecture & Package Responsibilities

```
├── server.ts                    # Express backend with Vite SSR/SPA middleware & Paystack proxy routes
├── src/
│   ├── components/              # Modular UI components
│   │   ├── admin/               # Super Admin metrics, user tables, ticket moderators, modals
│   │   ├── auth/                # Customer, Organizer, and Admin authentication & recovery
│   │   ├── marketplace/         # Ticket checkout, cart drawers, filter bars, movie cards
│   │   ├── producer/            # Event creation forms, subaccount payout setup, analytics widgets
│   │   ├── AdminPortal.tsx      # Central administrative control panel
│   │   ├── AuthPage.tsx         # Unified authentication view with role switcher
│   │   ├── CustomerSupport.tsx  # Interactive live support drawer & WhatsApp direct link
│   │   ├── GateScanner.tsx      # Camera QR & manual ticket verification terminal
│   │   ├── Marketplace.tsx      # Public event browse & catalog screen
│   │   └── ProducerDashboard.tsx# Producer revenue dashboard & ticket manager
│   ├── hooks/                   # Reusable React hooks
│   │   ├── useBankList.ts       # Centralized Paystack banking partner query & cache
│   │   └── useCameraScanner.ts  # Hardware camera lifecycle, stream capture, & HUD simulator
│   ├── lib/
│   │   ├── db/                  # Modular database persistence layer
│   │   │   ├── client.ts        # Supabase client initializer & connection health monitor
│   │   │   ├── errors.ts        # Typed DbError classes & error categorization
│   │   │   ├── mockData.ts      # Offline fallback & initial bootstrap seed data
│   │   │   ├── profiles.ts      # User & producer account profiles & balance tracking
│   │   │   ├── purchases.ts     # Transaction logging & booking verification
│   │   │   └── tickets.ts       # Ticket inventory CRUD & real-time sync
│   │   ├── db.ts                # Unified public data layer export
│   │   ├── errors.ts            # Application-level typed error hierarchy
│   │   ├── logger.ts            # Structured JSON logger with context tags
│   │   └── schemas.ts           # Zod schema validation boundaries
│   ├── types.ts                 # TypeScript interfaces, types, and enumerations
│   └── test/                    # Automated testing suite (Vitest + React Testing Library + Supertest)
```

---

## 💳 Data Flow & 80/20 Payment Split Architecture

The platform implements an automated split-payment workflow using Paystack Subaccounts:

```
[ Customer / Buyer ]
        │ (Selects Tickets & Proceeds to Checkout)
        ▼
[ Express Server Proxy (/api/paystack/initialize) ]
        │ Validates Payload via Zod Schema
        │ Injects Producer Subaccount Code
        │ Configures 20% Platform Fee Retention (80% direct to Producer)
        ▼
[ Paystack Payment Gateway ]
        │ (Mobile Money / Visa / Mastercard Authorization)
        ▼
[ Webhook / Verification Route (/api/paystack/verify/:ref) ]
        │ Verifies settlement integrity
        ▼
[ Supabase + LocalStorage Hybrid DB ]
        │ Creates TicketPurchase record (Status: "unused")
        │ Decrements available inventory atomically
        │ Credits Producer Balance
        ▼
[ Buyer Receives Unique QR Pass (e.g., TKT-1234-ABCD) ]
        │
        ▼
[ Gatekeeper Scanner (GateScanner.tsx) ]
        │ Scans QR / Verifies Pass Code
        │ Validates ticket status
        │ Marks status = "used" (prevents duplicate admission)
```

---

## ⚙️ Quickstart & Onboarding

Get the development environment running in under 2 minutes:

### 1. Prerequisites
- **Node.js**: Version 20.x or 22.x LTS (`node -v`)
- **NPM**: Version 10.x or higher (`npm -v`)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/lordnana1985-cell/MOVIE-TICKET-HUB.git
cd MOVIE-TICKET-HUB

# Install dependencies cleanly
npm install
```

### 3. Environment Configuration
Create your local environment file:
```bash
cp .env.example .env
```
*(The default configuration includes demo fallbacks, allowing the app to run immediately without external credentials.)*

### 4. Run Development Server
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## 🔐 Environment Variables Reference

| Variable | Description | Required | Scope | Security Policy |
| :--- | :--- | :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Supabase project URL | Yes | Client (`import.meta.env`) | Safe for client bundle |
| `VITE_SUPABASE_ANON_KEY` | Supabase Anon/Public API Key | Yes | Client (`import.meta.env`) | Safe with Row-Level Security |
| `PAYSTACK_SECRET_KEY` | Paystack Secret Key for split payouts | Optional | **Server-Only** (`process.env`) | **NEVER** expose to browser client |
| `GEMINI_API_KEY` | Google Gemini API Key for AI features | Optional | **Server-Only** (`process.env`) | **NEVER** expose to browser client |
| `PORT` | HTTP port for server binding (default: 3000) | No | Server (`process.env`) | Internal network config |
| `NODE_ENV` | Environment mode (`development`, `production`, `test`) | No | System | Runtime flag |

---

## 🔌 Backend API Specification

All backend endpoints validate input parameters at the boundary using **Zod schemas**:

### 1. `GET /api/health`
Checks server health, uptime, and integration status.
- **Response `200 OK`**:
  ```json
  {
    "status": "ok",
    "timestamp": "2026-08-24T12:00:00.000Z",
    "paystackConfigured": true,
    "uptime": 124.5
  }
  ```

### 2. `GET /api/paystack/banks?currency=GHS`
Retrieves supported settlement banks and Mobile Money providers for Ghana (`GHS`) or Nigeria (`NGN`).
- **Query Params**: `currency` (`GHS` | `NGN`)
- **Response `200 OK`**:
  ```json
  {
    "status": true,
    "message": "Banks retrieved successfully",
    "data": [
      { "name": "MTN Mobile Money", "code": "MTN", "currency": "GHS" },
      { "name": "Telecel Cash", "code": "VOD", "currency": "GHS" },
      { "name": "GCB Bank", "code": "GCB", "currency": "GHS" }
    ]
  }
  ```

### 3. `POST /api/paystack/subaccount`
Creates a dedicated Paystack settlement subaccount for an event organizer.
- **Request Body**:
  ```json
  {
    "business_name": "Silverbird Cinemas Accra",
    "settlement_bank": "MTN",
    "account_number": "0241234567",
    "primary_contact_email": "producer@cinema.com"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "status": true,
    "data": {
      "subaccount_code": "ACCT_8x9abc123",
      "business_name": "Silverbird Cinemas Accra",
      "percentage_charge": 20
    }
  }
  ```

### 4. `POST /api/paystack/initialize`
Initializes a split-payment transaction for ticket checkout.
- **Request Body**:
  ```json
  {
    "email": "buyer@example.com",
    "amount": 100.00,
    "subaccount_code": "ACCT_8x9abc123",
    "callback_url": "https://yourapp.com"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "status": true,
    "data": {
      "authorization_url": "https://checkout.paystack.com/0123abcd",
      "reference": "REF_999ABC123"
    }
  }
  ```

### 5. `GET /api/paystack/verify/:reference`
Verifies a transaction reference and returns settlement breakdown.

---

## 💾 Database & Offline-First Resilience

The persistence layer (`src/lib/db/`) uses a **dual-engine architecture**:
1. **Supabase Cloud Database**: Stores event tickets, customer profiles, subaccount records, and purchases with full PostgreSQL relational integrity.
2. **Transparent LocalStorage Cache**: Automatically caches records locally. If network connectivity drops or Supabase credentials are not configured, queries gracefully fall back to local storage without throwing unhandled exceptions.
3. **Structured Errors (`DbError`)**: All database operations catch and wrap failures into typed `DbError` objects containing operation tags, table names, and fallback flags.

---

## 🧪 Testing & Quality Assurance

The codebase maintains rigorous unit and integration test coverage using **Vitest**, **React Testing Library**, and **Supertest**:

```bash
# Run all test suites
npm run test

# Run CI test suite with coverage report
npm run test:ci

# Run tests with code coverage report
npm run test:coverage

# Run TypeScript compilation check (0 errors required)
npm run lint

# Run ESLint validation
npm run lint:eslint

# Check code formatting with Prettier
npm run format:check
```

### Coverage & Test Strategy
- **Lines Coverage**: >50% enforced in CI (`vitest.config.ts`)
- **Branches Coverage**: >40% enforced in CI
- **Zero External Dependencies in Tests**: All unit tests run against in-memory mocks, isolated localStorage simulators, and Vitest spy handlers, requiring zero live external services or active internet connectivity.
- **Test Suites**: 35+ test files covering Components, Database adapters, Custom Hooks, Schemas, and Server API routes.

---

## 🔒 CI/CD, Dependency Automation & Security Audits

Every pull request and push to `main` executes a multi-stage GitHub Actions pipeline (`.github/workflows/ci.yml`):

1. **Dependency Installation**: `npm ci` with cache optimization.
2. **Security & Vulnerability Audit**: `npm audit --audit-level=high` (fails pipeline if high/critical vulnerabilities exist).
3. **TypeScript Static Analysis**: `npm run lint` (`tsc --noEmit`).
4. **Automated Test Suite**: `npm run test:ci` (enforcing coverage minimums).
5. **Production Build**: `npm run build` (bundles client and standalone Express server).

### Automated Dependency Management (Dependabot)
- Automated weekly dependency update PRs configured via `.github/dependabot.yml` monitoring npm dependencies with automated reviewer assignments and security vulnerability alerts.

---

## 🐳 Docker & Containerization

Run the full-stack app in an isolated container:

```bash
# Build Docker image
docker build -t movie-ticket-hub .

# Run container on port 3000
docker run -p 3000:3000 --env-file .env movie-ticket-hub
```

Or with Docker Compose:
```bash
docker compose up --build
```

---

## 🤝 Contributing Guidelines

1. **Fork the repository** and create your branch: `git checkout -b feature/my-feature`.
2. **Ensure all checks pass**:
   ```bash
   npm run lint && npm run test:coverage && npm run build
   ```
3. **Submit a Pull Request** with a concise description of your changes.

