# Changelog
## [Unreleased]

### Added
- **Feature F-001: User Authentication**
  - Backend NestJS `AuthModule`:
    - Registration with password hashing (bcrypt, 10 rounds).
    - JWT authentication with short-lived access tokens (15m) and persistent refresh tokens (7d).
    - Session revocation and logout with database persistence.
    - Password reset request and confirmation using crypto-secure SHA-256 tokens and 1-hour expiry.
    - Endpoints: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `POST /api/auth/refresh`, `GET /api/auth/me`, `POST /api/auth/password-reset/request`, `POST /api/auth/password-reset/confirm`.
    - Unit tests in `auth.service.spec.ts` passing.
  - Frontend React + Fluent UI v9:
    - `AuthContext`: token management, user state, auto-refresh.
    - `ProtectedRoute`: guard requiring authentication for app shell routes.
    - `SignInView`, `SignUpView`, `ForgotPasswordView`, `ResetPasswordView` with inline validation and BCC branding.
    - User avatar and profile dropdown menu in `AppShell` with Sign Out capability.
    - Component unit tests in `AuthViews.test.tsx` and `AppShell.test.tsx` passing.
    - End-to-end test suite in `tests/e2e/f001-auth.spec.ts` verifying all 6 acceptance criteria in Chromium/Chrome.

