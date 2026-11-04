---
description: Create the BCC Teams monorepo skeleton and local dev environment
---
1. Read AGENTS.md and every file in .agents/rules.
2. Write an implementation plan and wait for my approval.
3. Create the pnpm + Turborepo monorepo with apps/web, apps/api and packages/shared
   (shared TypeScript types).
4. Create docker-compose.yml with PostgreSQL, Redis, MinIO and LiveKit, plus
   .env.example.
5. apps/api: NestJS app with Prisma connected to Postgres, a health endpoint, and
   Socket.IO gateway.
6. apps/web: Vite + React + Fluent UI v9 with the BCC light/dark theme and the empty
   app shell from 02-design-system.md (top bar, left app bar, list pane, main pane).
   Clicking app bar items switches routes.
7. Add lint, format, typecheck and test scripts at the root.
8. Run everything, open the web app in the browser, and take a screenshot.
9. Write a walkthrough and update dev-docs/ARCHITECTURE.md.
