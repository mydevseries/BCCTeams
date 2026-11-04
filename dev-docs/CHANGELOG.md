# Changelog
## [Unreleased]

### Added
- **Feature F-003: Organization Directory**
  - Backend NestJS `UsersModule` expansion:
    - Added `getDirectory` service method with alphabetical ordering (`displayName: 'asc'`), pagination (`page`, `limit`), and multi-attribute search across name, email, job title, and department.
    - Excluded inactive/suspended accounts (`isActive: false`) from standard directory results.
    - Added `GET /api/users` endpoint returning user profiles with presence and local time.
    - 3 unit tests in `users.service.spec.ts` passing.
  - Frontend React + Fluent UI v9:
    - Built `DirectoryView` component with responsive card grid, debounced (<150ms) search input, active members count badge, and empty state illustrations.
    - Integrated colleague cards with `MemberProfileCard` modal for contact details and quick actions (`Chat`, `Call`, `Email`).
    - Added Directory route in `App.tsx` and navigation button in left app bar (`AppShell.tsx`).
    - Component unit test in `DirectoryView.test.tsx` passing.
    - End-to-end test suite in `tests/e2e/f003-directory.spec.ts` verifying all 4 acceptance criteria in Chromium/Chrome.

- **Feature F-002: User Profile**
  - Backend NestJS `UsersModule`:
    - `UsersService` & `UsersController` for profile inspection, updating, avatar upload and deletion.
    - Endpoints: `GET /api/users/me`, `PATCH /api/users/me`, `POST /api/users/me/avatar`, `DELETE /api/users/me/avatar`, `GET /api/users/:id`.
    - Unit tests in `users.service.spec.ts` passing (8 tests).
  - Frontend React + Fluent UI v9:
    - `ProfileModal`: view and update full profile card (name, job title, department, phone, email, avatar).
    - Avatar upload support (PNG/JPEG/WebP up to 5MB) and one-click photo removal reverting to initials.
    - `MemberProfileCard`: modal card for colleagues displaying contact info, department, local time, and presence badge.
    - Component unit tests in `ProfileModal.test.tsx` and `MemberProfileCard.test.tsx` passing.
    - End-to-end test suite in `tests/e2e/f002-profile.spec.ts` verifying all 5 acceptance criteria in Chromium/Chrome.

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
