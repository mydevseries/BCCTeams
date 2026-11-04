---
description: Independently verify a finished feature. Usage: /test-feature <feature-id>
---
1. Read the feature's acceptance criteria in FEATURES.md. Do not read the
   implementation plan first.
2. Start the app and test every acceptance criterion in the browser as a normal user,
   then as a user without permission.
3. Try edge cases: empty input, very long text, emoji, slow network, two users editing
   at once, page refresh in the middle of an action.
4. Check keyboard navigation and dark theme.
5. Report every bug in BUGS.md with steps to reproduce and a screenshot.
   If nothing fails, write "Verified" next to the feature in FEATURES.md.
