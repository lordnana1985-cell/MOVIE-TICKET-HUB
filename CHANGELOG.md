# Changelog

All notable changes to the Event Ticket Hub (ETH) platform are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
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
