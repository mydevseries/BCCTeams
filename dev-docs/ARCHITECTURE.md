# BCC Teams Architecture

BCC Teams is BCC's internal collaboration platform: unified chat, teams, channels, meetings, calls, files, activity feed, and app integrations built from scratch with original code and open-source libraries.

---

## High-Level Topology

```
+-----------------------------------------------------------------------------------+
|                                  apps/web                                         |
|  React 18 + Vite + TypeScript + Fluent UI React v9 + React Router v6              |
|  Theme: Custom BCC Teal Brand Ramp (#0E7C86) for Light, Dark, High Contrast       |
+-----------------------------------------------------------------------------------+
             | REST APIs                                        ^ WebSocket (Socket.IO)
             v                                                  |
+-----------------------------------------------------------------------------------+
|                                  apps/api                                         |
|  Node.js + NestJS (TypeScript Strict)                                             |
|  - Health & Diagnostics (`/api/health`)                                           |
|  - WebSocket Gateway (`EventsGateway` room management: chat:<id>, user:<id>)       |
|  - Prisma ORM Data Access Layer                                                   |
+-----------------------------------------------------------------------------------+
         |                        |                       |                  |
         v                        v                       v                  v
+------------------+     +------------------+    +------------------+  +---------------+
|    PostgreSQL    |     |      Redis       |    |    SeaweedFS     |  |    LiveKit    |
| (Prisma Schema:  |     | (Cache, Pub/Sub, |    | (S3-Compatible   |  | (Self-Hosted  |
|  Users, Sessions,|     |  Presence State) |    |  Object Storage) |  |  WebRTC SFU)  |
|  Presence, etc.) |     |                  |    |                  |  |               |
+------------------+     +------------------+    +------------------+  +---------------+
```

---

## Monorepo Layout

- `apps/web`: Frontend single-page application built on React 18, Vite, and Microsoft Fluent UI React v9 (`@fluentui/react-components`).
  - `src/theme/brand.ts`: 16-step brand ramp generated from BCC Primary Brand Teal (`#0E7C86`).
  - `src/components/layout/AppShell.tsx`: Standard four-region shell: Top bar (48px), Left app bar (68px), Resizable list pane (320px), and Main content pane.
  - `src/views/`: Routed modular views (`ChatView`, `DirectoryView`, `GenericSectionView`).
- `apps/api`: Modular NestJS backend application with global validation and CORS.
  - `src/prisma/`: Centralized Prisma client service and lifecycle connection management.
  - `src/health/`: System health check verifying database and service availability.
  - `src/gateway/`: Socket.IO WebSocket gateway managing entity-scoped event broadcasting.
  - `src/users/`: Directory and user profile service/controller.
  - `prisma/schema.prisma`: Relational models for Users, Tokens, Presence, and Settings.
- `packages/shared`: Shared TypeScript types (`@bcc/shared`) consumed by both web and api packages.
- `assets/brand/`: Vector and bitmap brand assets (`logo.svg`, `logo-mono.svg`, `icon-512.png`, `icon-192.png`, `favicon.ico`, `favicon.svg`).
- `assets/illustrations/`: Vector placeholder graphics in the BCC color palette for empty states, avatars, and onboarding.

---

## Infrastructure & Local Dev Services

Defined in `docker-compose.yml`:
1. **PostgreSQL**: Local port 5433 / 5432 (default db `bccteams`).
2. **Redis 7**: Port 6379 (caching, presence heartbeats, Socket.IO adapter).
3. **SeaweedFS**: S3-compatible object store (Ports 8333, 9333, 8888).
4. **LiveKit Server**: Self-hosted WebRTC SFU (Ports 7880, 7881, 7882).

---

## Security & Authentication (F-001)

- **Password Storage**: Hashed via `bcrypt` with work factor 10.
- **Token Model**: Dual-token architecture:
  - **Access Token**: Short-lived (15 minutes), signed with `JWT_SECRET`, containing `userId`, `email`, and `role`.
  - **Refresh Token**: Long-lived (7 days), hashed with SHA-256 before storing in PostgreSQL `RefreshToken` table.
- **Password Reset**: Cryptographically random 32-byte tokens, hashed with SHA-256 in PostgreSQL `PasswordResetToken` table, expiring after 60 minutes. All existing sessions are revoked upon password reset.
- **Client Route Protection**: `<ProtectedRoute>` wrapping authenticated routes, automatically redirecting expired or missing tokens to `/signin`.

---

## User Profile System (F-002)

- **Backend Module**: `UsersModule` exposing REST endpoints for profile retrieval (`/api/users/me`), profile updates (`PATCH /api/users/me`), photo management (`POST/DELETE /api/users/me/avatar`), and member inspection (`/api/users/:id`).
- **Storage Strategy**:
  - Image uploads (PNG/JPEG/WebP up to 5MB) processed via Multer, stored in `/uploads/avatars/` and served statically, with object storage compatibility for SeaweedFS S3.
  - Removing a photo clears `avatarUrl` in PostgreSQL, reverting client components to deterministic initials avatars.
- **Client Components**:
  - `ProfileModal`: Dialog using Fluent UI v9 form controls (`Field`, `Input`, `Avatar`, `Button`) with live feedback.
  - `MemberProfileCard`: Dialog displaying colleague avatar, presence badge, contact details, local time calculation, and direct action triggers (Chat, Call, Email).

---

## Organization Directory Architecture (F-003)

- **Backend Endpoint**: `GET /api/users` query-driven directory service.
  - Filters: strict exclusion of `isActive: false` accounts.
  - Ordering: deterministic alphabetical ascending sort by `displayName`.
  - Search: Case-insensitive sub-string filtering across `displayName`, `email`, `jobTitle`, and `department`.
  - Pagination: Configurable `page` and `limit` to support smooth scrolling or pagination over large organizational headcounts.
- **Client Implementation**:
  - `DirectoryView`: Responsive multi-column grid with debounced (<150ms) search input, real-time query updates, pagination controls, and BCC brand empty states.
  - Accessible card triggers for modal colleague inspection via `MemberProfileCard`.
