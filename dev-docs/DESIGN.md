# BCC Teams — Design System Specification

## Brand Identity & Color Ramp

BCC Teams uses an original brand identity centered around **BCC Violet (`#7A3E9D`)**.

### Anti-Convergence Rule (Microsoft Separation)
To ensure strict separation from Microsoft Teams, BCC Teams **strictly forbids** using Microsoft Teams' signature purples:
- Prohibited: `#6264A7`, `#5B5FC7`, `#464775`, `#4F52B2`
- BCC Identity: Warm, regal violet with hue `~278°`, saturation `43%`, lightness `43%`.

---

## 16-Step Fluent Brand Ramp

Defined in [`apps/web/src/theme/brand.ts`](file:///c:/Users/cvalley/Desktop/BCCTeams/apps/web/src/theme/brand.ts):

| Step | Hex Code | Purpose / Semantic Role |
|---|---|---|
| `10` | `#1B0A26` | Deepest shadow tint |
| `20` | `#260E36` | Dark surface container |
| `30` | `#35154B` | Dark surface stroke |
| `40` | `#461D62` | Dark interactive pressed |
| `50` | `#562479` | Dark interactive hover |
| `60` | `#682D90` | High-contrast light text |
| `70` | `#7A3E9D` | **Base BCC Brand Violet** (primary buttons, badge background, logo) |
| `80` | `#8B48B2` | Light hover / subtle fill |
| `90` | `#9E59C7` | Interactive active state |
| `100` | `#B875DF` | Dark theme high-contrast link pressed (4.61:1 on `#292929`) |
| `110` | `#C78BE7` | **Dark mode primary brand foreground & links** (5.73:1 contrast on `#292929`) |
| `120` | `#D5A2EF` | **Dark mode link hover** (7.10:1 contrast on `#292929`) |
| `130` | `#E2B9F6` | Soft pill tint |
| `140` | `#EDCEFA` | Light mode border / selection |
| `150` | `#F6E4FC` | Light mode subtle hover tint |
| `160` | `#FAF2FD` | Light mode soft background / message bubble |

---

## Accessibility (WCAG AA Compliance)

- **Light Mode (`#ffffff` background):**
  - Brand text and icons (`#7A3E9D`) provide **6.99:1** contrast (exceeds WCAG AA 4.5:1 requirement).
  - White text on primary button (`#7A3E9D`) provides **6.99:1** contrast.
- **Dark Mode (`#292929` and `#1f1f1f` backgrounds):**
  - Text, links, and selection indicators use ramp steps `110` (`#C78BE7`) and `120` (`#D5A2EF`), achieving **5.73:1** to **7.10:1** contrast against dark neutral backgrounds.

---

## Component Token Guidelines

All UI components must be styled strictly through `@fluentui/react-components` design tokens:
1. **Primary Buttons:** `appearance="primary"` automatically utilizes `tokens.colorBrandBackground`.
2. **Selected App Bar Indicators:** Left 3px indicator pill utilizes `tokens.colorBrandForeground1`.
3. **Links & Action Text:** `tokens.colorBrandForegroundLink`.
4. **Chat Message Bubbles:**
   - **Own messages:** Background `tokens.colorBrandBackground`, text `tokens.colorNeutralForegroundOnBrand`.
   - **Other messages:** Background `tokens.colorNeutralBackground2`, text `tokens.colorNeutralForeground1`.
5. **Focus Rings:** `tokens.colorStrokeFocus2`.
6. **Zero Hardcoded Colors:** Never write raw `#hex` values in components.
