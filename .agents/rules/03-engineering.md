---
trigger: always_on
---
# Engineering rules

- TypeScript strict mode everywhere. No `any` unless explained in a comment.
- Backend: one NestJS module per feature area (chat, teams, channels, meetings,
  calls, files, calendar, activity, presence, search, users, admin).
- Every API endpoint checks permissions (who is a member, owner, guest, admin).
- Database changes only through Prisma migrations. Never use db push; only use prisma migrate dev / prisma migrate deploy.
- Real-time events go through Socket.IO rooms named by entity, e.g. chat:<id>,
  channel:<id>, user:<id>.
- Never log passwords, tokens or message contents.
- Secrets only in .env files, never committed. Keep .env.example up to date.
- After each feature, update dev-docs/ARCHITECTURE.md and dev-docs/CHANGELOG.md.
  Record any important technical choice in dev-docs/DECISIONS.md.
