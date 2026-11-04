---
trigger: always_on
---
# Design system rules

- Build all UI with Fluent UI React v9 components (@fluentui/react-components).
  Do not write custom buttons, menus, dialogs, inputs, tabs, avatars or tooltips
  when a Fluent component exists.
- Icons: only @fluentui/react-icons. Use the Regular variant normally and the Filled
  variant for the selected state.
- Theme: create the theme with createLightTheme / createDarkTheme from a BCC brand
  ramp in apps/web/src/theme/brand.ts. Support light, dark and high-contrast themes.
- Use Fluent design tokens (tokens.colorNeutralBackground1, tokens.spacingHorizontalM,
  etc.) for all colors, spacing, font sizes and shadows. No hard-coded hex colors or px
  font sizes.
- App shell layout:
  1. Top bar: BCC Teams logo, back/forward, global search box, profile avatar with
     presence and status menu.
  2. Left app bar (about 68px wide): Activity, Chat, Teams, Calendar, Calls, Files,
     Apps; icon with a label below; selected item shows a brand-colored indicator.
  3. List pane (about 320px, resizable): chat list, team/channel tree, etc.
  4. Main pane: the selected chat, channel, meeting or file.
- Every screen must work with keyboard only and with a screen reader (Fluent handles
  most of this; keep ARIA labels and focus order correct).
- Every screen must be responsive down to 1024px wide. Mobile layout comes later.
