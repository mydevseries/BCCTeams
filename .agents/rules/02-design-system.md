---
trigger: always_on
---
# Design system rules

- Build all UI strictly according to the specifications in `dev-docs/DESIGN.md`.
- Build all UI with Fluent UI React v9 components (@fluentui/react-components).
  Do not write custom buttons, menus, dialogs, inputs, tabs, avatars or tooltips
  when a Fluent component exists.
- Icons: only @fluentui/react-icons. Use the Regular variant normally and the Filled
  variant for the selected state.
- Theme: create the theme with createLightTheme / createDarkTheme from a BCC brand
  ramp in apps/web/src/theme/brand.ts. Support light, dark and system themes.
- Use Fluent design tokens (tokens.colorNeutralBackground1, tokens.spacingHorizontalM,
  tokens.fontSizeBase300, etc.) for all colors, spacing, font sizes and shadows.
  No hard-coded hex colors or px font sizes.
- App shell layout:
  1. Top bar (48px tall): BCC Teams logo, back/forward, global search box (max-w 640px),
     profile avatar (32px) with presence dot and user menu.
  2. Left app bar (68px wide): Activity, Chat, Teams, Calendar, Calls, Files,
     Apps; 24px icon with a label below; selected item shows a brand-colored teal indicator.
     Directory is accessible from the avatar menu or under Apps.
  3. List pane (320px, resizable): 20px semibold pane title, filter pills, collapsible
     sections, 32px avatars, 14px item titles, 12px one-line snippets, and timestamps.
  4. Main pane: flexible (min-width: 0), rounded corners, 48px header with tabs and action
     icons, centered content (max-w 1100px).
- Zero horizontal overflow: every screen and container must have `min-width: 0` on flex
  children and avoid horizontal scrolling down to 1024px wide.
- Every screen must work with keyboard only and with a screen reader (keep ARIA labels
  and focus order correct).
