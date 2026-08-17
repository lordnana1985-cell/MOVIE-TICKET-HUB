# Movie Ticket Hub (Event Ticket Hub - ETH)

A full-stack, enterprise-grade African cinema, stage play, and live event ticketing platform with real-time seat inventory, Paystack automated revenue split settlement (80% producer / 20% platform), QR code gate validation, and offline-first hybrid data persistence.

---

## 🚀 Key Features

- **Event & Movie Marketplace**: Interactive event discovery, rich trailer media previews, category & venue filtering, dynamic cart management, and seat reservation counters.
- **Paystack 80/20 Automated Revenue Splits**: Server-side proxy handling subaccount creation, transaction initialization, webhook callbacks, and direct banking settlements.
- **Producer / Filmmaker Dashboard**: Self-serve ticket creation with custom tiering and seating capacities, live gross revenue metrics, automated bank account verification, and inventory control.
- **Gatekeeper Mobile Scanner**: High-speed camera QR code scanner & manual numerical ticket entry with live admission logging, duplicate prevention, and offline ticket verification.
- **Digital Pass Wallet**: Dynamic QR code passes, visual verification badges, offline wallet caching, and print/download pass capability.
- **Hybrid Data Layer**: Real-time Supabase cloud database with synchronized, transparent LocalStorage fallback for offline resilience.

---

## 🛠️ Architecture Overview

```
├── server.ts                    # Express backend with Vite SSR/SPA middleware & Paystack proxy routes
├── src/
│   ├── components/              # Modular UI components (Marketplace, Dashboards, Scanner)
│   │   ├── marketplace/         # Ticket checkout, cart drawers, filter bars
│   │   ├── producer/            # Event creation forms, payout setup, analytics widgets
│   │   └── auth/                # Customer & Organizer authentication forms
│   ├── lib/
│   │   ├── db/                  # Modular database persistence layer
│   │   │   ├── client.ts        # Supabase client initializer & connection health monitor
│   │   │   ├── tickets.ts       # Ticket inventory CRUD & real-time sync
│   │   │   ├── purchases.ts     # Transaction logging & booking verification
│   │   │   └── profiles.ts      # User & producer account profiles & balance tracking
│   │   └── db.ts                # Unified public data layer export
│   └── test/                    # Automated testing suite (Vitest + React Testing Library + Supertest)
```

---

## ⚙️ Quickstart & Local Setup

### 1. Prerequisites
- **Node.js**: Version 20.x or higher
- **NPM**: Version 10.x or higher

### 2. Installation
Clone the repository and install all dependencies:
```bash
git clone https://github.com/lordnana1985-cell/MOVIE-TICKET-HUB.git
cd MOVIE-TICKET-HUB
npm install
```

### 3. Environment Configuration & Secrets Management
Copy the sample environment configuration:
```bash
cp .env.example .env
```

#### Secrets Configuration Table
| Variable | Description | Required | Scope | Security Policy |
| :--- | :--- | :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes | Client (`import.meta.env`) | Safe for client bundle |
| `VITE_SUPABASE_ANON_KEY` | Supabase Anon/Public API Key | Yes | Client (`import.meta.env`) | Safe with Row-Level Security |
| `PAYSTACK_SECRET_KEY` | Paystack Secret Key for split payouts | Optional (Demo fallback provided) | **Server-Only** (`process.env`) | **NEVER** expose to browser client |
| `GEMINI_API_KEY` | Google Gemini API Key for AI assistance | Optional | **Server-Only** (`process.env`) | **NEVER** expose to browser client |
| `APP_URL` | Application root host URL | No | Server | Server configuration |
| `DISABLE_HMR` | Disables hot reload during container builds | No | Build System | CI/Container environments |

#### Production & CI Secrets Management
- **GitHub Secrets**: Add `PAYSTACK_SECRET_KEY`, `GEMINI_API_KEY`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY` in `Settings -> Secrets and variables -> Actions`.
- **Cloud Secret Manager**: When deploying to Google Cloud Run or AWS ECS, mount secrets as environment variables using Cloud Secret Manager or AWS Secrets Manager.
- **Local Development**: Keep your real keys in `.env` (which is in `.gitignore`) and never commit secret keys to git.

### 4. Running Development Server
```bash
npm run dev
```
The server will boot on `http://localhost:3000` with hot module reloading and backend API proxying.

---

## 🧪 Testing, Quality & CI Enforcement

Run the comprehensive unit, integration, and coverage test suite:
```bash
# Run all tests
npm run test

# Run tests with code coverage thresholds (Lines: >=60%, Branches: >=50%)
npm run test:coverage

# Run TypeScript type check
npm run lint

# Run ESLint validation
npm run lint:eslint

# Check code formatting with Prettier
npm run format:check

# Format code with Prettier
npm run format
```

---

## 🔒 Security Best Practices

1. **Zero Secret Leaks**: All payment secret keys (`PAYSTACK_SECRET_KEY`) and AI credentials (`GEMINI_API_KEY`) are accessed strictly on the Node.js server (`server.ts`) and never injected into the client bundle (`dist/`).
2. **Client Key Validation**: The client database initialization validates the presence of `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` and throws structured error boundaries if misconfigured.
3. **Automated CI/CD**: Every push and pull request is gated via GitHub Actions running dependency security audits (`npm audit`), type checks, test coverage checks, and production builds.

---

## 🐳 Docker Containerization

Run the app using Docker:
```bash
# Build the container
docker build -t movie-ticket-hub .

# Run the container
docker run -p 3000:3000 --env-file .env movie-ticket-hub
```

Or with Docker Compose:
```bash
docker compose up --build
```
