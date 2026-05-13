# Design System — Management System

> Same brand. Different surface. The system **inherits** every token from the public-site design system ([../DESIGN-SYSTEM.md](../DESIGN-SYSTEM.md)) and **adds** an admin-density layer on top.

The site is a marketing experience: serif display, generous whitespace, atmospheric. The system is a **work tool**: dense data, predictable patterns, fast scanning. Both speak the same brand voice.

---

## Inheritance rules

- **Reuse:** colors (primary, secondary, accent, cream), font families, focus ring, brand motifs.
- **Override:** type scale (smaller, more numeric), spacing (denser), radii (slightly tighter), shadows (flatter), motion (faster).
- **Add:** admin-only tokens (sidebar widths, status colors, data-table density modes, dark-mode palette).

---

## Surface palette

System surfaces live on a calmer background than the marketing pages so dense tables and forms don't fatigue the eye.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--surface-bg` | `#F4F6FA` | `#0B1220` | App-wide background behind cards |
| `--surface-card` | `#FFFFFF` | `#101A2C` | Default card / panel |
| `--surface-card-2` | `#F8FAFC` | `#0F1929` | Nested cards, table headers |
| `--surface-sidebar` | `#0B1F3A` (primary) | `#070E1B` | Left navigation |
| `--surface-sidebar-active` | `#0E7C5A` (secondary) | `#0E7C5A` | Active nav item |
| `--surface-topbar` | `#FFFFFF` | `#0F1929` | Sticky topbar |
| `--surface-overlay` | `rgba(11,31,58,0.55)` | `rgba(0,0,0,0.7)` | Dialog backdrops |
| `--border-default` | `#E5E9F0` | `#1F2A3F` | All hairline borders |
| `--border-strong` | `#CBD3DE` | `#2C3A52` | Inputs, table separators on hover |

The brand colors (navy `#0B1F3A`, green `#0E7C5A`, gold `#C9A24B`, cream `#F8F4ED`) all carry over.

---

## Status colors

Used on student/invoice/payroll/session badges. Each has paired bg / text / border tokens for subtle pills.

| Status | Bg (light) | Text | Use |
|---|---|---|---|
| `success` | `#E6F4EE` / `text-#0E7C5A` | Paid, Active, Approved, Completed |
| `warning` | `#FEF6E1` / `text-#9A7117` | Trial, Pending review, Reminder due |
| `danger` | `#FCEAEA` / `text-#A6271E` | Overdue, Suspended, Cancelled |
| `info` | `#E6F0FB` / `text-#1E5AAB` | Sent, In progress, Scheduled |
| `neutral` | `#F1F4F8` / `text-#5A6470` | Draft, Paused, Archived |

Dark-mode variants are derived programmatically — `bg / 0.18` opacity over `--surface-card`.

---

## Typography (admin scale)

System UI uses **Inter** as the default — Cormorant/Fraunces stay reserved for marketing. Tabular numerals are essential for tables and money.

| Role | Font | Size | Line height | Weight |
|---|---|---|---|---|
| Page title (H1) | Fraunces 600 | `1.5rem` (24px) | 1.3 | — |
| Section title (H2) | Inter 600 | `1.125rem` (18px) | 1.4 | — |
| Card title (H3) | Inter 600 | `0.9375rem` (15px) | 1.4 | — |
| Body | Inter 400 | `0.875rem` (14px) | 1.55 | — |
| Body (dense) | Inter 400 | `0.8125rem` (13px) | 1.5 | tables, sidebar |
| Caption | Inter 500 | `0.75rem` (12px) | 1.4 | hints, helpers |
| Money / counts | Inter 600 | inherit | inherit | `font-variant-numeric: tabular-nums` |
| Code / IDs | JetBrains Mono | `0.8125rem` | 1.4 | invoice numbers, IDs |

Page titles use Fraunces (the marketing heading font) at small sizes — preserves brand recognition without wasting vertical space.

---

## Density modes

A single class on `<html>` swaps the data-table row height across the system:

| Mode | Row height | Use |
|---|---|---|
| `data-density="comfortable"` | 56px | Default — student lists, lead board |
| `data-density="default"` | 44px | Most tables |
| `data-density="compact"` | 36px | Audit log, delivery log, exports |

User setting persisted in `localStorage` and surfaced in the topbar.

---

## Spacing

Same 8px base, but the practical scale differs:

| Use | px |
|---|---|
| Page gutter (left/right of content) | `clamp(16px, 2.5vw, 32px)` |
| Page header → first card | `24px` |
| Card padding | `20px` (16px in compact mode) |
| Card gap (grid) | `16px` |
| Form field stack | `12px` |
| Section heading → content | `12px` |
| Sidebar width (expanded) | `260px` |
| Sidebar width (collapsed) | `72px` |
| Topbar height | `60px` |

---

## Radii (admin)

Slightly tighter than marketing. Cards feel more "tool", less "magazine".

| Token | Value | Use |
|---|---|---|
| `rounded-sm` | `4px` | Tags, status pills, small chips |
| `rounded-md` | `6px` | Inputs, dropdowns, table cells with action |
| `rounded-lg` | `8px` | Buttons, modals header |
| `rounded-xl` | `12px` | Cards, panels |
| `rounded-2xl` | `16px` | Marketing-flavored CTAs that bleed into the system (rare) |

---

## Shadows (admin)

Flatter — keep depth for things users actually need to notice (modals, dropdowns).

| Token | Value | Use |
|---|---|---|
| `shadow-flat` | `0 0 0 1px var(--border-default)` | Resting cards, no elevation |
| `shadow-soft` | `0 1px 2px rgba(11,31,58,0.05)` | Hovered cards, dropdowns |
| `shadow-pop` | `0 8px 24px rgba(11,31,58,0.10)` | Modal, command palette |
| `shadow-focus` | `0 0 0 3px rgba(201,162,75,0.4)` | Focus ring (gold accent, low alpha) |

---

## Components — system-only patterns

### App shell

```
┌────────────────────────────────────────────────────────────────┐
│ Topbar — search, breadcrumbs, notifications, user menu  [60px] │
├──────────┬─────────────────────────────────────────────────────┤
│          │                                                     │
│ Sidebar  │  Page content (max-width none — fills available)    │
│ (260px)  │                                                     │
│  collap- │  Page header (title + actions)                      │
│  sible   │  ────────────────────────────────                    │
│  to 72px │  Filter bar (date range, status, search)            │
│          │  ────────────────────────────────                    │
│          │  Content area (table / form / detail)               │
│          │                                                     │
└──────────┴─────────────────────────────────────────────────────┘
```

- Sidebar uses navy primary background. Active item is filled green; hovered item is a 6% white overlay.
- Sidebar groups use a tiny uppercase label in cream/60% opacity ("Operations", "Finance", "Settings").
- Topbar is white in light mode, deep navy-9 in dark.
- The site's floating WhatsApp button is **not** rendered in the system.

### Page header

Every page starts with the same shape:

```
[ Page Title ]                          [ Secondary action ] [ Primary action ]
[ Subtle description / count ]
```

Implemented via `components/system/primitives/PageHeader.tsx`. Title is Fraunces 24px, description is Inter 13px muted.

### Data table

Built on TanStack Table. Mandatory features:

- Column sorting (click header)
- Row selection with sticky-bar bulk actions
- Column visibility toggle in a popover
- Row density toggle in topbar
- Empty state with illustration + primary CTA
- Loading state: 5 skeleton rows
- Error state: inline alert with retry

```
┌──────────────────────────────────────────────────────────────┐
│ ☐ Student          Course      Status   Teacher    Next ses. │ ← header (sticky)
├──────────────────────────────────────────────────────────────┤
│ ☐ Sarah Ahmed      Tajweed     ● Active Sh. Omar   Mon 6 PM  │
│ ☐ Yusuf Khan       Hifz        ● Trial  Sh. Hassan  -        │
└──────────────────────────────────────────────────────────────┘
[ 1–25 of 124 ]                              [‹] [1] [2] [3] [›]
```

### Forms

- One column up to ~480px, two columns above (large dialogs and full-page forms).
- Labels above fields, 13px Inter 500, navy primary.
- Helper text below, 12px muted.
- Error state replaces helper text with a `--danger` text + a left red border on the input.
- Always include `<fieldset>` + legend semantics on grouped sections.

### Money / currency display

- Each student has a `currency` field. UI helper `formatMoney(value, currency)` returns `1,250 USD` style.
- All financial reports show currency as a column or column group; never mix currencies on a single sum without an explicit "in base currency (EGP)" footer.
- Negative values: red, no parentheses, with a leading `-`.

### Status badges

Pill, 22px high, 12px font, 8px horizontal padding. A 6px colored circle on the left.

```
┌──────────────────┐
│ ● Active         │   ← success
│ ● Trial          │   ← warning
│ ● Overdue        │   ← danger
│ ● Paused         │   ← neutral
└──────────────────┘
```

### Empty states

Every list view ships an empty state — illustration (32px line icon) + headline + description + primary action.

```
        ╭─────╮
        │  📚 │
        ╰─────╯
   No students yet
   Convert a lead, or add a student manually.
   [ + Add student ]
```

### Modals vs sheets vs drawers

- **Dialog (modal):** confirmations, short forms (≤6 fields), destructive actions.
- **Sheet (right side, 480px):** create / edit forms with up to ~12 fields. Most CRUD lives here.
- **Drawer (right side, 720px):** detail views that don't deserve a full page (session detail, invoice preview).
- **Full page:** complex flows (student profile, teacher profile, settings).

### Toasts (sonner)

- Top-right. 4s default, 8s for error.
- Success: green check, 1-line.
- Error: red, with a "Retry" action where applicable.
- Avoid toasts for routine saves — surface success in-context (button changes to "Saved ✓").

---

## Iconography

- **Lucide React** for everything UI.
- Stroke 1.5, sized in 4px increments (12, 16, 20, 24).
- Status icons: ✅ success, ⚠ warning, ⛔ danger, ℹ info, ⏸ paused.
- Nav icons paired 1:1 with sidebar items in `lib/system/nav.ts`.

---

## Charts

- **Recharts** with brand colors:
  - Primary series: `--color-secondary` (green)
  - Secondary series: `--color-primary` (navy)
  - Tertiary: `--color-accent` (gold)
  - Negative / loss: `--danger-500`
- Axes use Inter 12px muted; gridlines `--border-default` at 50% opacity.
- Always show empty state when there's no data — no flat lines on a 0-axis.

---

## Motion

Faster than the marketing site. Operators repeat actions all day.

| Interaction | Duration | Easing |
|---|---|---|
| Hover state | 80ms | `ease-out` |
| Sidebar collapse | 180ms | `cubic-bezier(0.4, 0, 0.2, 1)` |
| Sheet / drawer open | 220ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Modal open | 160ms | `ease-out` |
| Toast in/out | 220ms / 160ms | `ease-out` / `ease-in` |

Respect `prefers-reduced-motion: reduce` — disable transforms, keep opacity.

---

## Dark mode

Dark mode is **first-class**. Operators may work after sunset and the choice is on the user menu.

- Implementation: `next-themes` + Tailwind `dark:` variant.
- Default: matches OS preference.
- All tokens have a dark-mode value documented above.
- Charts swap palette automatically.
- Print stylesheets force light mode.

---

## Accessibility

Same baseline as the public site — AA contrast, visible focus rings, semantic headings, 44px touch targets — plus:

- All data tables are keyboard navigable (arrow keys move focus between cells).
- Sidebar items are `<a>` elements (not `<div>`) so screen readers announce them as links.
- Every dialog uses Radix's primitive (focus trap + ESC close + announce).
- Form errors announce via `aria-live="polite"`.
- All status colors have a non-color second cue (icon + text).

---

## Internationalization

- English only at v1 (system has no public-facing strings).
- Number, date, currency formatting use Intl APIs with the academy's `defaultLocale` setting.
- Phone numbers always rendered in E.164 with a country flag.

---

*Last updated: May 10, 2026*
