---
trigger: always_on
---
# Testing rules

- Backend: Jest unit tests for services, plus e2e tests for each endpoint
  (success case, permission-denied case, bad-input case).
- Frontend: Vitest + React Testing Library for components.
- End-to-end: Playwright tests in tests/e2e for every acceptance criterion in
  FEATURES.md.
- Real-time features must be tested with two browser users at once.
- A feature is only "Done" when all its tests pass and the browser check passes.
