# Sprint 1 — Foundation & Design System

**Duration:** 2 weeks
**Status:** Detailed, ready to implement.
**Sprint goal:** Empty pages render with the locked design system. Layout shell (Navbar, Footer, WhatsApp button) is production-quality. Backend has a health endpoint and CI runs on every PR.

---

## Definition of Done

- [ ] `pnpm dev` starts the Next.js app at `localhost:3000`
- [ ] `php artisan serve` starts Laravel at `localhost:8000`
- [ ] Visiting `/` shows a placeholder home page using all four fonts and the design tokens
- [ ] Navbar is sticky, becomes blurred-background on scroll, mobile-collapses to hamburger
- [ ] Floating WhatsApp button visible on every route, opens `wa.me` link
- [ ] Footer renders with course/company/legal columns and social icons
- [ ] All design tokens (colors, fonts, spacing, radii, shadows) accessible as Tailwind classes AND CSS variables
- [ ] `https://api.alrayan-academy.com/api/v1/up` (locally `http://localhost:8000/api/v1/up`) returns `{"status":"ok"}`
- [ ] GitHub Actions: typecheck + lint passes on every PR
- [ ] Vercel staging deployed at `staging.alrayan-academy.com`
- [ ] Lighthouse on staging home: Performance ≥ 95, Accessibility ≥ 95, Best Practices = 100, SEO ≥ 90
- [ ] Mobile QA: tested on iPhone SE (375px) and Pixel 5 (393px)

---

## Story Breakdown

### S1-01 — Repo & monorepo scaffolding *(0.5 day)*

- [ ] Initialize git repo at `/Users/ahmedomar/Documents/Alrayan-Academy/site`
- [ ] Create top-level `.gitignore` (covers `node_modules`, `.next`, `vendor`, `.env`, `.DS_Store`, etc.)
- [ ] Create `frontend/` and `backend/` empty dirs
- [ ] Top-level `README.md` describing both apps and how to run them
- [ ] First commit: `chore: initial monorepo scaffold`

---

### S1-02 — Frontend bootstrap *(0.5 day)*

```bash
cd site
pnpm create next-app@latest frontend \
  --typescript --tailwind --eslint --app --src-dir \
  --import-alias "@/*" --no-turbopack
```

- [ ] Verify `frontend/` is created with App Router + `src/app`
- [ ] Replace default `page.tsx` with a minimal placeholder
- [ ] Install: `pnpm add next-intl react-hook-form zod @hookform/resolvers lucide-react clsx tailwind-merge`
- [ ] Install dev: `pnpm add -D prettier prettier-plugin-tailwindcss`
- [ ] `pnpm dev` runs cleanly, no console warnings

---

### S1-03 — Design system: Tailwind config + CSS variables *(1 day)*

**File:** `frontend/tailwind.config.ts`

```ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1.25rem', md: '2rem' },
      screens: { '2xl': '1200px' },
    },
    extend: {
      colors: {
        primary:   { DEFAULT: 'rgb(var(--color-primary)   / <alpha-value>)' },
        secondary: { DEFAULT: 'rgb(var(--color-secondary) / <alpha-value>)' },
        accent:    { DEFAULT: 'rgb(var(--color-accent)    / <alpha-value>)' },
        cream:     'rgb(var(--color-cream) / <alpha-value>)',
        muted:     'rgb(var(--color-muted) / <alpha-value>)',
        'border-soft': 'rgb(var(--color-border) / <alpha-value>)',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        heading: ['var(--font-heading)'],
        sans:    ['var(--font-body)'],
        arabic:  ['var(--font-arabic)'],
      },
      borderRadius: {
        '2xl': '1.5rem',
      },
      boxShadow: {
        soft: '0 2px 8px rgb(11 31 58 / 0.06)',
        md:   '0 8px 24px rgb(11 31 58 / 0.08)',
        lg:   '0 16px 48px rgb(11 31 58 / 0.12)',
      },
      maxWidth: { container: '1200px' },
    },
  },
  plugins: [],
} satisfies Config
```

**File:** `frontend/src/styles/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-primary:   11 31 58;     /* #0B1F3A */
  --color-secondary: 14 124 90;    /* #0E7C5A */
  --color-accent:    201 162 75;   /* #C9A24B */
  --color-cream:     248 244 237;  /* #F8F4ED */
  --color-muted:     90 100 112;   /* #5A6470 */
  --color-border:    232 226 213;  /* #E8E2D5 */

  --section-y: clamp(64px, 10vw, 120px);
}

@layer base {
  html { -webkit-font-smoothing: antialiased; }
  body { @apply bg-white text-primary font-sans text-[17px] leading-[1.65]; }
  h1   { @apply font-display font-medium tracking-tight; }
  h2   { @apply font-heading font-semibold tracking-tight; }
  h3, h4 { @apply font-heading font-semibold; }
  ::selection { @apply bg-accent/30 text-primary; }
  *:focus-visible { @apply outline-2 outline-accent outline-offset-2; outline-style: solid; }
}

@layer components {
  .section { padding-top: var(--section-y); padding-bottom: var(--section-y); }
}
```

- [ ] All four colors verified visually (paste swatches in a temp page)
- [ ] Section padding scales correctly between mobile and desktop

---

### S1-04 — Fonts via `next/font` *(0.5 day)*

**File:** `frontend/src/styles/fonts.ts`

```ts
import { Cormorant_Garamond, Fraunces, Inter, Amiri } from 'next/font/google'

export const fontDisplay = Cormorant_Garamond({
  subsets: ['latin'], weight: ['500', '600'], variable: '--font-display', display: 'swap',
})
export const fontHeading = Fraunces({
  subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-heading', display: 'swap',
})
export const fontBody = Inter({
  subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-body', display: 'swap',
})
export const fontArabic = Amiri({
  subsets: ['arabic'], weight: ['400', '700'], variable: '--font-arabic', display: 'swap',
})
```

- [ ] Apply variables in root layout `<html>` tag
- [ ] Verify no CLS via Chrome DevTools Performance tab
- [ ] Verify Arabic wordmark renders in Amiri (test with "الريان")

---

### S1-05 — Site config + nav config *(0.5 day)*

**File:** `frontend/src/config/site.ts`

```ts
export const siteConfig = {
  name: 'Alrayan Academy',
  nameArabic: 'الريان',
  description: 'Premium online Quran, Arabic, and Islamic studies for students worldwide.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://alrayan-academy.com',
  email: 'info@alrayan-academy.com',
  phone: '+20 100 000 0000',
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP ?? '201000000000',
  whatsappPrefilled: 'Assalamu alaikum, I would like to learn more about your courses.',
  social: {
    facebook:  'https://facebook.com/alrayanacademy',
    instagram: 'https://instagram.com/alrayanacademy',
    youtube:   'https://youtube.com/@alrayanacademy',
    twitter:   'https://twitter.com/alrayanacademy',
  },
} as const

export const whatsappLink = (text?: string) =>
  `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(text ?? siteConfig.whatsappPrefilled)}`
```

**File:** `frontend/src/config/nav.ts`

```ts
export const mainNav = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  {
    label: 'Courses',
    href: '/courses',
    children: [
      { label: 'Quran for Kids', href: '/courses/quran-classes-for-kids' },
      { label: 'Quran for Adults', href: '/courses/quran-classes-for-adults' },
      { label: 'Tajweed', href: '/courses/tajweed-course' },
      { label: 'Hifz / Memorization', href: '/courses/hifz-memorization' },
      { label: 'Arabic for Non-Arabs', href: '/courses/arabic-for-non-arabs' },
      { label: 'Ijazah Program', href: '/courses/ijazah-program' },
      { label: 'Female Teachers', href: '/courses/female-quran-teachers' },
    ],
  },
  { label: 'Pricing', href: '/pricing' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact', href: '/contact' },
]

export const footerNav = {
  Courses: [
    { label: 'Noorani Qaida', href: '/courses/noorani-qaida' },
    { label: 'Quran for Kids', href: '/courses/quran-classes-for-kids' },
    { label: 'Quran for Adults', href: '/courses/quran-classes-for-adults' },
    { label: 'Tajweed', href: '/courses/tajweed-course' },
    { label: 'Hifz / Memorization', href: '/courses/hifz-memorization' },
    { label: 'Tafseer', href: '/courses/tafseer-course' },
    { label: 'Ijazah', href: '/courses/ijazah-program' },
    { label: 'Ten Qiraat', href: '/courses/ten-qiraat' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Blog', href: '/blog' },
    { label: 'Contact', href: '/contact' },
  ],
  Regions: [
    { label: 'USA', href: '/countries/usa' },
    { label: 'UK', href: '/countries/uk' },
    { label: 'Canada', href: '/countries/canada' },
    { label: 'Australia', href: '/countries/australia' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
}
```

---

### S1-06 — Logo SVG *(0.5 day)*

**File:** `frontend/public/logo/alrayan-full.svg`

A clean, single-color-fillable logo with:
- Left: small geometric mark (octagonal Islamic motif) in **gold** (`#C9A24B`)
- Right: stacked wordmark — top line "الريان" in **Amiri** navy (`#0B1F3A`), bottom line "Alrayan Academy" in **Fraunces small caps** navy
- Total dimensions: 240 × 64

Also create:
- `alrayan-mark.svg` — just the geometric mark, 64×64
- `alrayan-white.svg` — same as full but all elements white (for footer)

(Implementer: hand-draw SVG paths. No fancy gradients — solid fills only so it scales clean and prints right.)

---

### S1-07 — Base UI components *(2 days)*

Install shadcn (we copy components, no runtime dep):

```bash
cd frontend
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button input label textarea select accordion sheet dialog
```

After install, **edit each component's variants** to match our design system (e.g., button `default` becomes secondary green; add `gold` and `outline` variants).

Custom components to write:

| Component | Path | Notes |
|---|---|---|
| `Container` | `components/layout/Container.tsx` | Wraps with `max-w-container mx-auto px-5 md:px-8` |
| `Section` | `components/layout/Section.tsx` | Adds `.section` padding + optional `bg="cream"` prop |
| `Heading` | `components/ui/Heading.tsx` | Polymorphic h1–h4 with display/heading font + accent gold underline option |
| `LinkButton` | `components/ui/LinkButton.tsx` | Wraps `<Link>` with Button styles |

**Acceptance:**
- [ ] Each component has a `<ComponentName>.stories.tsx` file (or rendered on a temp `/dev/components` page) showing all variants

---

### S1-08 — Layout shell: Navbar *(1 day)*

**File:** `frontend/src/components/layout/Navbar.tsx`

Behavior:
- Position: `fixed top-0 left-0 right-0 z-50`
- Default state: transparent background, white text (over hero)
- Scrolled state (after 24px): `bg-white/80 backdrop-blur-md shadow-soft`, navy text
- Logo on the left, nav items center/right, "Free Trial" gold button on the far right
- Mobile: hamburger opens a `Sheet` (shadcn) sliding in from the right with full nav stacked
- Courses item has a hover dropdown on desktop, accordion on mobile
- Skip-to-content link (a11y)

**Hooks:**
- `useScroll()` (custom 5-line hook with `window.scrollY` listener and `requestAnimationFrame`)

---

### S1-09 — Layout shell: Footer *(0.5 day)*

**File:** `frontend/src/components/layout/Footer.tsx`

- Background: `bg-primary text-white`
- Top section: 4 columns from `footerNav` (Courses / Company / Regions / Legal)
- Logo + tagline on the left of those columns
- Bottom section: copyright, social icons, "Made with care for the global Ummah" small line in gold

---

### S1-10 — Layout shell: Floating WhatsApp button *(0.5 day)*

**File:** `frontend/src/components/layout/WhatsAppButton.tsx`

- Position: `fixed bottom-6 right-6 z-40`
- 56×56 circle, WhatsApp green background (`#25D366`), white WhatsApp icon
- Drop shadow on hover, subtle pulse animation (respects `prefers-reduced-motion`)
- `aria-label="Chat with us on WhatsApp"`
- Opens `whatsappLink()` in a new tab
- Hidden by default for screen readers when on `/contact` page (the form is the primary action there) — handled with a `usePathname()` check

---

### S1-11 — Marketing layout group *(0.25 day)*

**File:** `frontend/src/app/(marketing)/layout.tsx`

```tsx
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppButton } from '@/components/layout/WhatsAppButton'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main id="main">{children}</main>
      <Footer />
      <WhatsAppButton />
    </>
  )
}
```

Move existing `page.tsx` into `(marketing)/page.tsx` and replace it with a placeholder home that proves the design system works (hero block with display H1, accent rule, two CTAs, cream section below).

---

### S1-12 — Robots + Sitemap skeleton *(0.25 day)*

**File:** `frontend/src/app/robots.ts`

```ts
import type { MetadataRoute } from 'next'
import { siteConfig } from '@/config/site'

export default function robots(): MetadataRoute.Robots {
  const isProd = process.env.VERCEL_ENV === 'production'
  return isProd
    ? { rules: [{ userAgent: '*', allow: '/' }], sitemap: `${siteConfig.url}/sitemap.xml` }
    : { rules: [{ userAgent: '*', disallow: '/' }] }
}
```

**File:** `frontend/src/app/sitemap.ts` — return only `/`, `/about`, `/pricing`, `/contact`, `/faq` for now. Course/blog/country routes added in their respective sprints.

---

### S1-13 — SEO helpers *(0.5 day)*

**File:** `frontend/src/lib/seo.ts`

```ts
import type { Metadata } from 'next'
import { siteConfig } from '@/config/site'

export function buildMetadata({
  title, description, path, image,
}: { title: string; description: string; path?: string; image?: string }): Metadata {
  const url = `${siteConfig.url}${path ?? ''}`
  const ogImage = image ?? `${siteConfig.url}/og-default.jpg`
  return {
    title, description,
    metadataBase: new URL(siteConfig.url),
    alternates: { canonical: url },
    openGraph: {
      title, description, url, type: 'website',
      siteName: siteConfig.name,
      images: [{ url: ogImage, width: 1200, height: 630 }],
      locale: 'en_US',
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
  }
}
```

Use it in root layout for site-wide defaults, then override per-page via `generateMetadata`.

---

### S1-14 — Backend bootstrap *(1 day)*

```bash
cd site
composer create-project laravel/laravel backend "11.*"
cd backend
php artisan install:api          # adds Sanctum
```

- [ ] Configure `.env.example` with full template (see [SERVER-SETUP.md](../SERVER-SETUP.md))
- [ ] Add `/api/v1/up` route returning `['status' => 'ok', 'version' => config('app.version', '0.1.0')]`
- [ ] Configure `config/cors.php` to allow only `localhost:3000` in dev and prod/staging frontend URLs from env
- [ ] Add `RateLimiter` for `api` group: 60/min default, with `form` named limiter at 5/min for forms
- [ ] First Pest/PHPUnit test: `GET /api/v1/up` → 200 with correct shape
- [ ] `php artisan test` passes

---

### S1-15 — CI: GitHub Actions *(0.5 day)*

**File:** `.github/workflows/frontend-ci.yml`

```yaml
name: Frontend CI
on:
  pull_request:
    paths: ['frontend/**']
jobs:
  check:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: frontend } }
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm', cache-dependency-path: frontend/pnpm-lock.yaml }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm build
```

**File:** `.github/workflows/backend-ci.yml`

```yaml
name: Backend CI
on:
  pull_request:
    paths: ['backend/**']
jobs:
  test:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: backend } }
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with: { php-version: 8.3, coverage: none }
      - run: composer install --prefer-dist --no-progress
      - run: cp .env.example .env && php artisan key:generate
      - run: php artisan test
```

Add `pnpm typecheck` script in `frontend/package.json` (`tsc --noEmit`).

---

### S1-16 — Deploy staging to Vercel *(0.5 day)*

- [ ] Push branch to GitHub
- [ ] Vercel → import → root `frontend`
- [ ] Add env vars (placeholders for now: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WHATSAPP`)
- [ ] Add `staging.alrayan-academy.com` domain (after DNS CNAME set)
- [ ] First deploy succeeds → URL shared with owner

---

### S1-17 — QA + screenshots *(0.5 day)*

- [ ] Lighthouse on staging home: capture report, fix any failing items
- [ ] Mobile screenshots: iPhone SE, iPhone 14 Pro Max, iPad
- [ ] Desktop screenshots: 1280, 1440, 1920
- [ ] Tab through entire page using only keyboard — focus rings visible everywhere
- [ ] Open with VoiceOver / NVDA — landmarks announced (`main`, `nav`, `footer`)

---

## Files created in this sprint (full list)

```
site/
├── .github/workflows/frontend-ci.yml
├── .github/workflows/backend-ci.yml
├── .gitignore
├── README.md
├── TODO.md (already exists)
├── backend/
│   ├── (Laravel 11 scaffold)
│   ├── routes/api.php             ← /api/v1/up
│   └── tests/Feature/HealthTest.php
└── frontend/
    ├── public/
    │   ├── favicon.ico
    │   ├── og-default.jpg
    │   └── logo/{alrayan-full,mark,white}.svg
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx              ← root layout, fonts, metadata defaults
    │   │   ├── (marketing)/
    │   │   │   ├── layout.tsx
    │   │   │   └── page.tsx            ← placeholder home
    │   │   ├── robots.ts
    │   │   └── sitemap.ts
    │   ├── components/
    │   │   ├── layout/{Navbar,Footer,WhatsAppButton,Container,Section}.tsx
    │   │   └── ui/{Button,Input,Sheet,...}.tsx (shadcn customized)
    │   ├── config/{site,nav}.ts
    │   ├── lib/{seo,utils}.ts
    │   └── styles/{globals.css,fonts.ts}
    ├── tailwind.config.ts
    ├── next.config.mjs
    ├── tsconfig.json
    ├── package.json
    └── .env.example
```

---

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| shadcn variants drift from design system | Centralize variant overrides in `components/ui/Button.tsx`; document expected output |
| Logo SVG looks generic | Owner reviews 2 logo concepts before sprint end; treat as placeholder if not approved (but ship first concept so layout doesn't block) |
| Vercel deploy fails on first push due to env vars | Pre-set env placeholders in Vercel dashboard before merging |
| WhatsApp number not yet provided by owner | Use placeholder `201000000000`, document the swap location in [CONTENT-EDITING-GUIDE.md](../CONTENT-EDITING-GUIDE.md) (already done) |

---

## Owner inputs needed before sprint starts

- [ ] Confirm WhatsApp number (or accept placeholder, swap later)
- [ ] Confirm domain `alrayan-academy.com` is registered + DNS access available
- [ ] Confirm Vercel + Hostinger/DO accounts exist (or create during sprint)
- [ ] Confirm primary support email: is `info@alrayan-academy.com` correct?
- [ ] Logo direction: is the placeholder geometric+wordmark approach acceptable for Sprint 1, with a polished version later?

---

## What this sprint does NOT deliver

- Real home / about / pricing copy (Sprints 2 + 4)
- Course detail pages (Sprint 3)
- Trial booking form working (Sprint 4)
- Country pages (Sprint 5)
- Admin panel (Sprint 7)

This sprint sets the table. Subsequent sprints fill the plates.
