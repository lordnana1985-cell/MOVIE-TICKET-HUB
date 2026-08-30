# Changelog

All notable changes to the Event Ticket Hub (ETH) platform are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Database Producer Subaccount Extraction (`src/lib/db/producer.ts`)**:
  - Extracted subaccount registration and Paystack proxy communication out of `ProducerDashboard.tsx` into standalone data module `src/lib/db/producer.ts`.
  - Paired with unit test suite `src/lib/db/producer.test.ts` asserting success, network error resilience, and profile commits.
- **Deep Supabase / LocalStorage Hybrid Fallback Integration Testing (`src/lib/db/profiles.test.ts`)**:
  - Added test coverage for `registerUser`, `loginUser`, and `updateUserProfile` under simulated Supabase service failure and LocalStorage fallback.
  - Asserted returned profile properties (`id`, `email`, `role`, `companyName`, `balance`).
- **Server Split-Payment Integration Tests (`src/test/server.test.ts`)**:
  - Added Supertest test suite exercising `/api/paystack/initialize` and `/api/paystack/verify/:reference` with both demo mode and mocked live Paystack client.
  - Asserted exact 80/20 revenue split breakdown (`producer_share: 80, hub_share: 20`, `producer_amount`, `hub_amount`).
- **Lightweight Error Tracking & Telemetry Hook (`src/lib/logger.ts`)**:
  - Added `logger.onError()` callback registry and automated HTTP error payload forwarding to remote telemetry endpoints or Sentry DSN.
  - Added test coverage in `src/lib/logger.test.ts` verifying safe execution and non-blocking swallow of network transport failures.
  - Declared `IS_TEST_ENV`, `ERROR_TRACKING_ENDPOINT`, and `VITE_ERROR_TRACKING_ENDPOINT` in `.env.example`.
- **Event Contract Documentation (`README.md`)**:
  - Documented `mt_hub_tickets_changed` custom event and `mt_hub_events` BroadcastChannel contract for real-time inter-component and cross-tab synchronization.
- **Dependency Staleness & Cadence CI Pipeline**:
  - Added non-blocking informational `npm outdated` step and separate job to `.github/workflows/ci.yml`.
  - Configured weekly dependency groupings in `.github/dependabot.yml` covering runtime and development ecosystems.
- **Server Structured Logging & Observability (`server.ts`)**:
  - Integrated `pino` high-performance structured JSON logger with ISO timestamping and route metadata across all Paystack endpoints.
  - Added request ID tracking middleware (`x-request-id` header injection and propagation).
  - Integrated optional Sentry error reporting with `@sentry/node`, gated safely by `SENTRY_DSN`.
  - Enhanced `/api/health` diagnostic endpoint reporting runtime connectivity checks for Supabase, Paystack, and Sentry.
- **Subaccount Verification Architecture**:
  - `useSubaccountVerification`: Encapsulated 6-digit confirmation code generation, countdown timers, email dispatch simulation, and verification logic with paired tests (`useSubaccountVerification.test.ts`).
- **Admin Tab Toggle Architecture**:
  - `useAdminTabToggle`: Encapsulated hidden administrative portal access, query param checks (`?admin=true`), secret logo click counter (5 taps), and cross-tab storage synchronization with paired tests (`useAdminTabToggle.test.ts`).
- **Extracted Modular Subcomponents**:
  - `CameraScannerView.tsx` & `CameraScannerView.test.tsx`: Isolated live camera viewport, lens selectors, stream status banners, and capture controls.
  - `QuickPassSimulator.tsx` & `QuickPassSimulator.test.tsx`: Isolated quick test pass list and pass triggers for fast gate testing.
  - `RoleSwitcher.tsx` & `RoleSwitcher.test.tsx`: Isolated customer, organiser, and admin role switching pill grid.
  - `ProducerHeader.tsx` & `ProducerHeader.test.tsx`: Isolated organiser console banner, payout telephone badge, and modal toggles.
- **Offline Reproducibility Documentation**:
  - Added comprehensive 'Running tests offline (Fresh-Clone Reproducibility)' subsection to `README.md` verifying zero external accounts needed.

### Changed
- **Decomposed Monolith Components Under 300 LOC (Risk Surface Reduction)**:
  - `src/components/ProducerDashboard.tsx` reduced from 476 to 288 LOC (<300 LOC).
  - `src/components/AuthPage.tsx` reduced from 374 to 272 LOC (<300 LOC).
  - `src/components/GateScanner.tsx` reduced from 372 to 188 LOC (<300 LOC).
- **Test Breadth & Coverage Expansion**:
  - Expanded `useAuthForm.test.ts` to test producer registration requirements, existing email detection, password recovery validation, and reset submissions.
  - Expanded `useCameraScanner.test.ts` to test camera switching, environment camera selection, and missing mediaDevices environment resilience.
  - Added unit test suite in `src/test/server.routes.test.ts` for health diagnostics, request IDs, and logger output.

## [0.1.0] - 2026-08-24

### Added
- **Dependency Automation**: Added `.github/dependabot.yml` for automated weekly npm updates and vulnerability monitoring.
- **Top-Level `test:ci` Pipeline Script**: Added standardized CI test execution script with zero-dependency environment fallback.
- **Modular Hooks & Subcomponents**:
  - `useAuthForm` & `useAssetUpload` extracted from monolithic components with 100% test-pairing.
  - Subcomponents `AuthHeroBanner`, `TicketMediaSection`, `TicketFormPreview`, `MarketplaceHero`, `EventTicketCard`, `TrailerLightboxModal`.

### Changed
- **Decomposed Monolith Components (Risk Surface Reduction)**:
  - `src/components/AuthPage.tsx` reduced from 730 to 365 LOC (<500 LOC).
  - `src/components/producer/TicketForm.tsx` reduced from 541 to 407 LOC (<500 LOC).
  - `src/components/Marketplace.tsx` reduced from 518 to 260 LOC (<500 LOC).
- **Structured Logging (`logger.ts`)**:
  - Replaced all direct `console.error` and `console.warn` calls with structured `logger.error` / `logger.warn` in `Marketplace.tsx`, `AdminPortal.tsx`, and `App.tsx`.
- **Offline Zero-Dependency Test Suite**:
  - Validated fresh-clone test execution with zero external network connectivity or live credentials required across 37 test files and 137 unit tests.
  - Coverage confirmed above CI thresholds: Lines >55%, Branches >45%.

## [0.0.1] - 2026-08-16
### Added
- Initial release of Event Ticket Hub (ETH).
- Multi-role support for Ticket Buyers, Event Organisers/Producers, and Super Admins.
- Paystack split payments with subaccounts and mobile money settlements.
- Offline-first fallback engine with dual Supabase and LocalStorage sync.
- QR/Barcode ticket authentication and gatekeeper verification terminal.
