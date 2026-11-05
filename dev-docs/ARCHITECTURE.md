# BCC Teams Architecture

BCC Teams is BCC's internal collaboration platform: unified chat, teams, channels, meetings, calls, files, activity feed, and app integrations built from scratch with original code and open-source libraries.

---

## High-Level Topology

```
+-----------------------------------------------------------------------------------+
|                                  apps/web                                         |
|  React 18 + Vite + TypeScript + Fluent UI React v9 + React Router v6              |
|  Theme: Custom BCC Violet Brand Ramp (#7A3E9D) for Light, Dark, High Contrast     |
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
  - `src/theme/brand.ts`: 16-step brand ramp generated from BCC Primary Brand Violet (`#7A3E9D`).
  - `src/components/layout/AppShell.tsx`: Standard four-region shell: Top bar (48px), Left app bar (68px), Resizable list pane (320px), and Main content pane.
  - `src/views/`: Routed modular views (`ChatView`, `DirectoryView`, `GenericSectionView`).
- `apps/api`: Modular NestJS backend application with global validation and CORS.
  - `src/prisma/`: Centralized Prisma client service and lifecycle connection management.
  - `src/health/`: System health check verifying database and service availability.
  - `src/gateway/`: Socket.IO WebSocket gateway managing entity-scoped event broadcasting.
  - `src/users/`: Directory and user profile service/controller.
  - `src/settings/`: User preferences and settings module.
  - `src/roles/`: RBAC roles and permissions module (Admin, Member, Guest) with guards and protection.
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

---

## Real-time Presence System Architecture (F-004)

- **Backend Architecture (`PresenceModule`)**:
  - `PresenceService`: In-memory multi-tab socket connection tracking (`userConnections`, `socketToUser`) backed by persistent database state in PostgreSQL (`Presence` table).
  - 30-Second Grace Period: When all tabs for a user disconnect, a 30s timer is set before declaring the user `OFFLINE`. Reconnection within 30s cancels the timer, preventing transient flicker.
  - Manual vs. Automatic Status: Manual user selections (`isManual: true`) persist through reconnection. Automatic transitions (e.g., 5-minute inactivity away) save the previous status (`savedStatus`) and automatically restore `AVAILABLE` upon resumption of user activity.
  - Expiry Cleaner: A scheduled background interval (every 30 seconds) identifies expired custom status messages and clears them automatically.
  - Scoped Real-time Broadcasts: Clients subscribe to individual presence channels `presence:<userId>` rather than global broadcasts, maintaining minimal overhead at scale.
- **Client Implementation (`apps/web`)**:
  - `PresenceContext`: Manages Socket.IO connection, `presence:init`, `presence:heartbeat`, scoped subscriptions for visible UI elements, and 5-minute user idle event listeners (`mousemove`, `keydown`, `click`, `scroll`).
  - `StatusMessageModal`: Fluent UI v9 modal dialog allowing users to set custom status text up to 280 characters with preset expiration intervals (1h, 4h, today, this week, never) or clear it.
  - `AppShell` & `DirectoryView`: Display real-time status badges and responsive avatar menus across all active views.

---

## Search Type-Ahead Dropdown & Modular Shell Architecture (A-010)

- **Search Type-Ahead Dropdown (`SearchBox`)**:
  - Live query debouncing (~150ms) querying `/api/users?query=...&limit=5`.
  - Top action item routing to directory search on `Enter` or click.
  - People section displaying matched colleagues with initials/photo avatar, real-time presence dot, highlighted substring matches, and job title.
  - Profile inspection integration: selecting a person opens `MemberProfileCard` and registers them in localStorage recent people.
  - Focused empty state displaying customizable recent searches and recent people.
  - Full keyboard accessibility: `ArrowDown`/`ArrowUp` item cursor navigation, `Enter` selection trigger, `Escape` blur, and `Ctrl+E` global shortcut.
- **Modular App Shell Decomposition**:
  - `AppShell.tsx`: Root shell container (< 80 lines).
  - `TopBar.tsx`: Top header (48px) with brand title, history navigation, SearchBox, and AvatarMenu (< 150 lines).
  - `AppBar.tsx`: Left rail (68px) with 7 primary navigation targets and active teal indicator (< 175 lines).
  - `ListPane.tsx`: 320px resizable secondary pane with filter pills and active route listings (< 270 lines).
  - `MainPane.tsx`: Main content pane mounting active view and dialog overlays (< 80 lines).
  - `AvatarMenu.tsx`: Header profile avatar menu with presence options and modal triggers (< 150 lines).
  - `SearchBox.tsx`: Global search input and type-ahead popover (< 300 lines).


---

## Files & Storage System Architecture (Phase 5: D-001 through D-005, D-009)

- **Storage Engine (StorageModule)**:
  - IStorageService interface abstracts binary object storage behind upload(), download(), delete(), and exists() methods.
  - S3-compatible client (@aws-sdk/client-s3) defaults to SeaweedFS (http://localhost:8333 in local Docker development).
  - Resilient local disk fallback (uploads/storage/) activates automatically when the external S3 endpoint is unavailable.
- **Relational Metadata Layer (Prisma on Supabase PostgreSQL)**:
  - FileItem: Represents files and folders in a hierarchical self-referential tree (parentId referencing FileItem). Tracks name, size, MIME type, owner, current version, storage key, and soft-delete state.
  - FileVersion: Immutable historical snapshots capturing prior version numbers, sizes, storage keys, and author attribution.
  - FileShare: Permissions management supporting VIEW and EDIT privileges across SPECIFIC_PEOPLE, ORGANIZATION, and ANYONE_WITH_LINK scopes via unique shareToken strings.
  - FileAccessRequest: Auditable access request workflow supporting requester notes, reviewer assignment, status transitions (PENDING, APPROVED, DENIED), and automatic FileShare creation upon approval.
  - Attachment: Generic decoupled attachment entity designed for seamless integration with chat messages in Phase 2 (C-011).
  - Row Level Security (RLS) enabled on all 5 new tables in Supabase PostgreSQL.
- **Backend API Layer (FilesModule)**:
  - FilesService: Implements folder navigation, multipart uploads via Multer, download streaming with Content-Disposition, rename/move operations, sharing token verification, version restoration, and access request reviews.
  - FilesController: Guarded REST controller (/api/files) exposing endpoints for views, operations, inline previews, shares, versions, access requests, and attachment streaming.
- **Client Implementation (pps/web/src/files)**:
  - FilesView: Main view featuring sidebar navigation (My files, Recent, Shared with me, Access requests), folder breadcrumb trail, drag-and-drop file upload target area, file search filtering, and contextual action menus.
  - FilePreviewModal: In-app multimedia viewer with zoom/pan controls for images, iframe PDF embedding, HTML5 video/audio playback, formatted code/text rendering, and graceful fallback for unsupported formats.
  - ShareModal: Intuitive sharing modal with permission radio selectors, link generator, one-click clipboard copying, and active share revocation.
  - VersionHistoryModal: Interactive audit trail of file versions with metadata, author attribution, and one-click version restoration.
  - RequestAccessModal & AccessRequestsTab: Access gating UX enabling users to request permissions on restricted items and empowering file owners to review and approve/deny requests with pending badge counters.