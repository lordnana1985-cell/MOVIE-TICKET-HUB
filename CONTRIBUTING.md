# Contributing to Movie Ticket Hub (ETH)

Thank you for your interest in contributing to **Movie Ticket Hub**! This document provides guidelines and conventions for contributing to the project.

---

## 🛠️ Development Setup

### Prerequisites
- **Node.js**: v20.x or v22.x LTS
- **npm**: v10+
- **Docker** (Optional, for containerized local development)

### Quick Start
```bash
# 1. Clone the repository
git clone https://github.com/lordnana1985-cell/MOVIE-TICKET-HUB.git
cd MOVIE-TICKET-HUB

# 2. Install dependencies
npm ci || npm install

# 3. Configure environment variables
cp .env.example .env

# 4. Start development server (Port 3000)
npm run dev
```

---

## 🧪 Testing & Code Quality Gates

We enforce high standards of quality through automated CI pipelines. Ensure all checks pass before opening a Pull Request.

### Commands

| Command | Purpose |
|---|---|
| `npm run lint` | TypeScript compiler type-check (`tsc --noEmit`) |
| `npm run lint:eslint` | ESLint static code analysis (`--max-warnings=0`) |
| `npm run format:check` | Prettier code formatting verification |
| `npm run format` | Auto-format codebase using Prettier |
| `npm run test` | Run Vitest unit & integration test suites |
| `npm run test:coverage` | Vitest coverage suite (Enforces ≥60% coverage threshold) |
| `npm run build` | Full production build & server bundling |

---

## 📐 Architecture & Principles

1. **Dual-Write / Offline-First Resilience**:
   - Primary database: **Supabase** (Postgres + Storage + Auth).
   - Fallback store: **LocalStorage** cache when offline or in standalone simulation.
   - Operations must log structured warnings/errors via `logger.warn` / `logger.error` without crashing the user interface.

2. **File Size & Modularity**:
   - Keep modules under **300 lines of code (LOC)**.
   - Extract UI subcomponents into `src/components/...` and database operations into `src/lib/db/...`.

3. **Security**:
   - Never expose server secrets (Paystack keys, Gemini keys) in browser bundles.
   - API endpoints (`/api/*`) in `server.ts` proxy backend operations securely.

---

## 📝 Commit Conventions

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat(scope): add feature description`
- `fix(scope): fix bug description`
- `test(scope): add or improve tests`
- `refactor(scope): refactor without behavior changes`
- `docs(scope): documentation updates`
- `chore(scope): build, CI, or dependency updates`

---

## 🚀 Pull Request Checklist

- [ ] `npm run lint` passes with 0 type errors.
- [ ] `npm run lint:eslint` passes with 0 warnings.
- [ ] `npm run format:check` passes with no formatting diffs.
- [ ] `npm run test:coverage` passes with ≥60% coverage across all thresholds.
- [ ] `npm run build` succeeds cleanly.
