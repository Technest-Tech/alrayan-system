# Design System

> **Locked.** Do not introduce new colors, fonts, or spacing scales without owner approval.

---

## Colors

| Token | Hex | Use |
|---|---|---|
| `--color-primary` | `#0B1F3A` | Headers, body text, footer background |
| `--color-secondary` | `#0E7C5A` | CTAs, primary buttons, success states |
| `--color-accent` | `#C9A24B` | Highlights, gold underlines, decorative dividers |
| `--color-cream` | `#F8F4ED` | Section backgrounds (alternate with white) |
| `--color-white` | `#FFFFFF` | Card backgrounds, default surface |
| `--color-text-muted` | `#5A6470` | Subheads, captions, secondary copy |
| `--color-border` | `#E8E2D5` | Hairline dividers, card borders |

### Tailwind config

```ts
// tailwind.config.ts (excerpt)
theme: {
  extend: {
    colors: {
      primary:   { DEFAULT: '#0B1F3A', 50: '#EEF1F6', /* ... */ },
      secondary: { DEFAULT: '#0E7C5A', 50: '#E6F4EE', /* ... */ },
      accent:    { DEFAULT: '#C9A24B', 50: '#FBF6EB', /* ... */ },
      cream:     '#F8F4ED',
      muted:     '#5A6470',
      'border-soft': '#E8E2D5',
    },
  },
}
```

---

## Typography

All loaded via `next/font/google` for zero CLS.

| Role | Font | Weights | Use |
|---|---|---|---|
| Display | Cormorant Garamond | 500, 600 | Hero H1, large quote pulls |
| Headings | Fraunces | 500, 600, 700 | H2, H3, H4 |
| Body / UI | Inter | 400, 500, 600 | Paragraphs, buttons, labels, nav |
| Arabic ayat | Amiri | 400, 700 | Quranic text and Arabic wordmark |

### Type scale (clamp for fluid sizing)

| Element | Size | Line-height | Tracking |
|---|---|---|---|
| H1 (hero) | `clamp(2.5rem, 5vw, 4.5rem)` | 1.05 | -0.02em |
| H2 | `clamp(2rem, 3.5vw, 3rem)` | 1.15 | -0.015em |
| H3 | `clamp(1.5rem, 2.2vw, 2rem)` | 1.25 | -0.01em |
| H4 | `1.25rem` | 1.35 | -0.005em |
| Body | `1.0625rem` (17px) | 1.65 | normal |
| Small / caption | `0.875rem` | 1.5 | 0.01em |
| Button | `1rem` | 1 | 0.02em |

---

## Spacing

Base unit **8px**. Scale: `4, 8, 12, 16, 24, 32, 48, 64, 96, 128`.

| Token | px |
|---|---|
| Container max-width | `1200px` |
| Container side padding | `clamp(20px, 4vw, 32px)` |
| Section vertical padding | `clamp(64px, 10vw, 120px)` |
| Card padding | `32px` (24px on mobile) |
| Card gap (grid) | `24px` |

---

## Radii

| Token | Value | Use |
|---|---|---|
| `rounded-sm` | `4px` | Tags, small chips |
| `rounded-md` | `8px` | Inputs |
| `rounded-lg` | `12px` | Buttons |
| `rounded-xl` | `16px` | Cards |
| `rounded-2xl` | `24px` | Hero blocks, feature panels |
| `rounded-full` | — | Avatars, pill buttons |

---

## Shadows

| Token | Value | Use |
|---|---|---|
| `shadow-soft` | `0 2px 8px rgba(11, 31, 58, 0.06)` | Card resting |
| `shadow-md` | `0 8px 24px rgba(11, 31, 58, 0.08)` | Card hover, dropdown |
| `shadow-lg` | `0 16px 48px rgba(11, 31, 58, 0.12)` | Modals, sticky nav on scroll |

---

## Buttons

| Variant | Background | Text | Border | Hover |
|---|---|---|---|---|
| Primary | `--color-secondary` | white | none | darken 8% |
| Outline | transparent | `--color-primary` | `--color-primary` 1px | bg `--color-primary` / text white |
| Gold | `--color-accent` | `--color-primary` | none | darken 6% |
| Ghost | transparent | `--color-primary` | none | bg `--color-cream` |

All buttons: `padding: 14px 28px`, `border-radius: 12px`, `font-weight: 500`, **visible focus ring** (`outline: 2px solid var(--color-accent); outline-offset: 2px`).

---

## Iconography

- **Lucide React** for UI icons (chevrons, check, mail, phone)
- Custom SVG for Islamic motifs (geometric patterns) — sparing use, decorative only
- Stroke width `1.5`, sized in 8px increments (16, 20, 24, 32)

---

## Imagery

- **Hero:** soft, atmospheric, bokeh / geometric — never literal stock photos of people praying
- **Teachers:** SVG circles with initials in navy on cream, accented with a gold ring (until real photos provided)
- **Course icons:** flat line illustrations in navy + gold; consistent stroke weight

---

## Motion

Default durations:
- Hover/state changes: `150ms ease-out`
- Section reveals: `400ms cubic-bezier(0.2, 0.8, 0.2, 1)`
- Modal/drawer: `300ms ease-in-out`

Respect `prefers-reduced-motion: reduce` — disable parallax, fade-ins, counters animation.

---

## Accessibility

- Min contrast: **AA** for body text, **AAA** target for primary CTAs
- Focus ring **visible on every interactive element** (gold, 2px, 2px offset)
- Touch targets ≥ 44×44px
- Headings in semantic order — no skipping levels
- All icons that convey meaning have `aria-label`; decorative icons get `aria-hidden="true"`
