# BCC Teams

BCC Teams is BCC's internal collaboration app: chat, teams and channels, meetings,
calls, files, calendar and activity feed in one place. It offers the same set of
features people know from Microsoft Teams, built from scratch with original code and
open-source libraries.

## Tech stack (fixed — do not change without an entry in dev-docs/DECISIONS.md)
- Monorepo: pnpm workspaces + Turborepo
- apps/web: React 18 + Vite + TypeScript + Fluent UI React v9 (@fluentui/react-components)
  + Fluent System Icons (@fluentui/react-icons)
- apps/api: Node.js + NestJS + TypeScript, REST + WebSocket (Socket.IO)
- Database: PostgreSQL with Prisma ORM. Cache/pub-sub/presence: Redis
- Files: SeaweedFS (S3-compatible, Apache-2.0)
- Meetings and calls: LiveKit (self-hosted) + livekit-client / @livekit/components-react
- Search: PostgreSQL full-text search (Meilisearch later if needed)
- Auth: email + password with JWT, then Microsoft Entra ID / Google SSO via OIDC
- Desktop (later): Tauri wrapping apps/web. Mobile (later): Expo React Native
- Local dev: docker-compose for Postgres, Redis, SeaweedFS, LiveKit

## Key documents
- FEATURES.md — every feature, its status and acceptance criteria
- dev-docs/ARCHITECTURE.md — how the system is built right now
- dev-docs/DECISIONS.md — why we chose things
- dev-docs/CHANGELOG.md — what changed

Read the rules in .agents/rules before starting any task.
