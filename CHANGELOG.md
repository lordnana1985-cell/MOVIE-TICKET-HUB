# Changelog

All notable changes to the Event Ticket Hub (ETH) platform are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Admin Portal (`AdminPortal.tsx`)**: System administrative dashboard with live analytics, volume metrics, database inspection, audit log monitoring, and granular control over simulation environments.
- **Custom Hooks Architecture**:
  - `useCameraScanner`: Encapsulated camera hardware discovery, permission management, track cleanup, and live HUD scanning simulation.
  - `useBankList`: Centralized Paystack banking partners lookup across Ghana (GHS) and Nigeria (NGN) with offline fallback data.
- **Structured Database Error Handling**:
  - Introduced typed `DbError` extending `AppError` with operation tags, fallback flags, and structured cause chains.
  - Comprehensive unit test suites for database fallback and data synchronization (`errors.test.ts`, `profiles.test.ts`, `purchases.test.ts`).
- **Structured Logging (`logger.ts`)**:
  - Standardized JSON formatting across environments with context tags and test-suite noise suppression.
  - Added `logger.test.ts` unit verification.

### Changed
- **Decomposed Monolith Components**:
  - Refactored `GateScanner.tsx` to consume `useCameraScanner` and centralized logging.
  - Refactored `AuthPage.tsx` and `ProducerDashboard.tsx` to consume `useBankList` and unified logger.
- **CI / CD Pipeline Hardening**:
  - Upgraded GitHub Actions workflow to Node.js 22 LTS with caching.
  - Enforced strict security audit gates (`npm audit --audit-level=high`) with no bypass.
- **Type Safety & Testing**:
  - Removed remaining `any` types from database catch blocks in `profiles.ts`, `purchases.ts`, and `tickets.ts`.
  - Expanded test suites across components and hooks with Vitest and `@testing-library/react`.

## [1.0.0] - 2026-08-16
### Added
- Initial release of Event Ticket Hub (ETH).
- Multi-role support for Ticket Buyers, Event Organisers/Producers, and Super Admins.
- Paystack split payments with subaccounts and mobile money settlements.
- Offline-first fallback engine with dual Supabase and LocalStorage sync.
- QR/Barcode ticket authentication and gatekeeper verification terminal.
