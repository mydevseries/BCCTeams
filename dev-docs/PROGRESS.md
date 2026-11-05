# BCC Teams — Implementation Progress

This document tracks overall project development, current status, active branch, and feature milestones.

Last Updated: 2026-11-05

---

## Before real users
- Enable RLS on all Supabase tables or disable the Supabase Data API.

---

## Overall Status

| Milestone | Target | Status | Notes |
|---|---|---|---|
| **Phase A: Project Structure** | Root structure cleanup, git, rules | **Done** | Agent pack moved to root, git initialized |
| **Phase B: Brand Assets** | Logo, mono, favicons, illustrations | **Done** | Teal palette `#0E7C86`, original badge & illustrations |
| **Phase C: Feature Expansion** | Complete catalog + 4-8 AC per P1/P2 | **Done** | Expanded across 13 phases, decisions documented |
| **Project Setup** | Monorepo, Docker Compose, NestJS, Vite shell | **Done** | Built monorepo, AppShell, Fluent theme, verified with unit tests & screenshot |
| **Task UI-001** | App Shell Overhaul & Design System | **Done** | Viewport reset, zero scroll, 14px typography, Light/Dark/System theme, 36 screenshots |
| **Phase 1: Foundation** | F-001 through F-009 | **In Progress** | F-001, F-002, F-003 Verified. Starting F-004 |
| **Phase 2: Chat** | C-001 through C-033 | Todo | Starting after F-006 |
| **Phase 3: Teams & Channels** | T-001 through T-020 | Todo | |
| **Phase 4: Activity & Search** | A-001 through A-009 | Todo | |
| **Phase 5: Files** | D-001 through D-008 | Todo | |
| **Phase 6: Meetings** | M-001 through M-040 | Todo | |
| **Phase 7: Calls** | K-001 through K-014 | Todo | |
| **Phase 8: Apps** | P-001 through P-009 | Todo | |
| **Phase 9: Admin & Security** | S-001 through S-014 | Todo | |
| **Phase 10: Desktop & Mobile** | X-001 through X-005 | Todo | |
| **Phase 11: Calendar & Workplace** | W-001 through W-006 | Todo | |
| **Phase 12: Frontline** | L-001 through L-003 | Todo | |
| **Phase 13: AI** | I-001 through I-004 | Todo | |

---

## Phase 1 Feature Status

| ID | Feature | Branch | Status | Notes / Verification |
|---|---|---|---|---|
| F-001 | Sign up, sign in, sign out, password reset | `feature/F-001` | **Verified** | 6 Jest unit tests, 6 Vitest component tests, 5 Playwright E2E tests passing 100%. Merged to master. |
| F-002 | User profile: name, photo, job title, department, phone | `feature/F-002` | **Verified** | 8 Jest unit tests, 2 Vitest component tests, 3 Playwright E2E tests passing 100%. Merged to master. |
| F-003 | Organization directory: browse and search all users | `feature/F-003` | **Verified** | 3 Jest unit tests, 1 Vitest component test, 3 Playwright E2E tests passing 100%. Merged to master. |
| UI-001 | App Shell Layout, Zero-Scroll & Theme Persistence | `fix/UI-001` | **Verified** | 36 screenshots, 13/13 Playwright E2E tests passing across 1920x1080 and 1366x768. |
| F-004 | Presence: Available, Busy, Do not disturb, Be right back, Away, Offline; automatic Away after inactivity; custom status message with expiry | `feature/F-004` | **In Progress** | Connection tracking, 30s grace period, auto vs manual rules, presence:<userId> rooms. |

---

## Active Work

- **Current Step:** Completed UI-001 & Step 1 cleanup; merging to master and starting F-004 (Presence System)
- **Active Branch:** `feature/F-004`
- **Next Up:** Feature F-005: Settings (theme, language, notification preferences)

---

## Change Log Summary
- Initialized monorepo configuration with pnpm + Turborepo.
- Created original BCC Teams brand identity, logos, and illustration suite in BCC Teal `#0E7C86`.
- Baseline migration created and resolved for Supabase PostgreSQL without data loss. Established Prisma seed at `apps/api/prisma/seed.ts`.
- Recorded technical decisions replacing Microsoft proprietary products with open-source equivalents.
- **F-001 (User Authentication):** Implemented NestJS `AuthModule` (bcrypt, JWT access/refresh tokens, SHA-256 password reset tokens, token revocation), React Fluent UI authentication views (`SignInView`, `SignUpView`, `ForgotPasswordView`, `ResetPasswordView`), route protection with `ProtectedRoute`, and automated Playwright E2E tests.
- **F-002 (User Profile):** Implemented NestJS `UsersModule` (`UsersService`, `UsersController`), profile view/edit modal (`ProfileModal`), colleague contact card (`MemberProfileCard`), avatar photo upload and removal with initial fallback, immediate PostgreSQL persistence, and automated Playwright E2E tests.
- **F-003 (Organization Directory):** Implemented `GET /api/users` directory endpoint with alphabetical sorting, pagination, multi-attribute real-time search, inactive account exclusion, Fluent UI `DirectoryView`, colleague member cards with contact profile modal integration, and automated Playwright E2E tests.
- **UI-001 (App Shell & Design):** Full design system compliance with `dev-docs/DESIGN.md`, 48px top bar, 68px left app bar, 320px list pane, centered main pane, Light/Dark/System theme switch, zero horizontal scroll, removal of hardcoded dummy data, and unbuilt feature badges.
