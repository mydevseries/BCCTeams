# BCC Teams — Start Here (Antigravity)

## Step 0. Install what you need (once)
1. Install: Google Antigravity, Git, Node.js 22 LTS, pnpm (`npm i -g pnpm`), Docker Desktop.
2. Install the Antigravity browser extension (needed so agents can test the app).
3. Create an empty GitHub repo named `bcc-teams` and clone it.
4. Unzip this pack into the repo root. You should see:
   AGENTS.md, FEATURES.md, BUGS.md, START-HERE.md, .agents/rules/*, .agents/workflows/*, dev-docs/*
5. Put your logo in `assets/brand/logo.svg` and decide your brand color (hex).
6. Commit: `git add . && git commit -m "Add BCC Teams agent pack"`.

## Step 1. Open the project in Antigravity
1. Open Antigravity -> Agent Manager -> Open Folder -> select `bcc-teams`.
2. Choose "Review-driven" mode when asked.
3. Open Customizations (the "..." menu in the agent panel) -> Rules. Check that the
   four rules appear and are set to Always On. Then check Workflows lists:
   /setup-project, /build-feature, /test-feature, /fix-bugs.
4. Use Planning mode and the strongest model available for all prompts below.

## Step 2. Prompt 1 — build the skeleton (one agent)
```
/setup-project
Our brand color is #XXXXXX and the logo is assets/brand/logo.svg.
```
Approve the plan. When it finishes, check the screenshot: the empty app shell with
top bar, left app bar, list pane and main pane. Merge to main.

## Step 3. Prompt 2 — Phase 1 features (one agent, in order)
```
/build-feature F-001
```
Then F-002, F-003, F-004, F-005, F-006 — one conversation each.
After each one, open a NEW conversation (the "Tester") and run:
```
/test-feature F-001
```
If bugs are found:
```
/fix-bugs F-001
```
Merge to main only when the feature is "Verified".

## Step 4. Run agents in parallel (from Phase 2 onward)
Open 3 conversations at once in Agent Manager, each on a DIFFERENT feature area so they
don't edit the same files:
- Agent A: `/build-feature C-001`  (chat)
- Agent B: `/build-feature T-001`  (teams)
- Agent C: `/test-feature <the last finished feature>`
Merge each branch when Verified, then give each agent the next feature.

## Step 5. Order to follow
Phase 1 -> 2 (Chat) -> 3 (Teams) -> 4 (Activity/Search) -> 5 (Files)
-> 6 (Meetings) -> 7 (Calls) -> 8 (Apps) -> 9 (Admin) -> 10 (Desktop/Mobile)

Useful extra prompts:
```
Read FEATURES.md and write acceptance criteria for every feature in Phase 2.
Wait for my approval before changing the file.
```
```
Review the whole web app for visual consistency with .agents/rules/02-design-system.md.
List every screen that breaks a rule, then fix them one by one.
```
```
Run the full test suite and all Playwright tests. Report failures grouped by feature.
```

## Step 6. Where REA fits (only on BCC Teams itself)
Install once: `npx rea-agents setup`, choose Antigravity (or add REA manually as an MCP
server in Customizations -> MCP), restart Antigravity.
Use it for:
1. Desktop app debugging (after X-001):
```
Use REA to analyze our built BCC Teams desktop app at <path>. Map modules, IPC
channels and native boundaries, and list anything that looks wrong or unused.
```
2. Agent test environment (after Phase 4):
```
Use REA to build an RL environment from our BCC Teams web app at
http://localhost:5173. Cover creating chats, sending messages, creating teams and
channels. Use test accounts only. Save it in tests/agent-env.
```
3. Understanding open-source libraries we use (LiveKit, Excalidraw, etc.) when an agent
   is stuck on how they work internally.
Do not point REA at Microsoft Teams.

## Step 7. Before launch
- Lawyer review of the "BCC Teams" name, logo and dependency licenses.
- Security review of Phase 9 items.
- Pilot with one department, collect feedback in BUGS.md.
