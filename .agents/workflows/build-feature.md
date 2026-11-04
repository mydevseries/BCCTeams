---
description: Build one feature from FEATURES.md end to end. Usage: /build-feature <feature-id>
---
1. Find the feature by its ID in FEATURES.md. Read its description and acceptance
   criteria, plus dev-docs/ARCHITECTURE.md. If the feature has no acceptance
   criteria yet, write 4-8 clear, testable criteria in FEATURES.md first and wait
   for my approval.
2. Create the branch feature/<feature-id>.
3. Write an implementation plan: database changes, API endpoints, real-time events,
   UI components, and tests. Wait for my approval.
4. Build the database migration and backend module with tests.
5. Build the frontend with Fluent UI v9 following 02-design-system.md.
6. Write Playwright tests that cover every acceptance criterion.
7. Run all tests and fix failures until they pass.
8. Start the app, open it in the browser, and perform each acceptance criterion as a
   real user (use two users for real-time features). Take screenshots.
9. Mark the feature "Done" in FEATURES.md, update ARCHITECTURE.md and CHANGELOG.md.
10. Write a walkthrough with screenshots and commit.
