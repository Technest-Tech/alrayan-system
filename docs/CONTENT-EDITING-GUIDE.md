# Content Editing Guide

This guide is written for the **owner** (or anyone non-technical). It tells you exactly which file to open to change a piece of content, plus how to push the change live.

> **Important:** all edits go through Git. If you don't use Git, ask a developer to make the change in a branch and create a pull request — Vercel will build a preview link you can review before merging.

---

## The "edit cheat sheet"

| What you want to change | File | Notes |
|---|---|---|
| WhatsApp number | `frontend/src/config/site.ts` → `whatsapp` | Format: international, no `+` or spaces. e.g. `201000000000` |
| Public email | `frontend/src/config/site.ts` → `email` | Used in footer, contact page |
| Phone number | `frontend/src/config/site.ts` → `phone` | Optional |
| Pricing tiers (price, features, label) | `frontend/src/content/pricing.ts` | Object per tier |
| Course descriptions | `frontend/src/content/courses.ts` | Until Sprint 6, then admin panel |
| Teacher names + bios | `frontend/src/content/teachers.ts` | Until Sprint 6 |
| Testimonials | `frontend/src/content/testimonials.ts` | Add to the array |
| Stats counters (10,000 students etc.) | `frontend/src/content/stats.ts` | Numbers + labels |
| FAQ items | `frontend/src/content/faq.ts` | One object per Q/A; can group by category |
| Country page copy | `frontend/src/content/countries.ts` | One object per country (USA/UK/CA/AU) |
| Header / footer links | `frontend/src/config/nav.ts` | Add/remove menu items |
| Social links | `frontend/src/config/site.ts` → `social` | Facebook, Instagram, YouTube, X |
| Hero headline / subheadline | `frontend/src/content/home.ts` | Home page copy |
| About page copy | `frontend/src/content/about.ts` | Story, mission, vision |
| Default OG / share image | `frontend/public/og-default.jpg` | 1200×630 PNG/JPG |
| Logo | `frontend/public/logo/alrayan-full.svg` | Replace file with same dimensions |
| Favicon | `frontend/public/favicon.ico` (and 32px / apple-touch versions) | Use [realfavicongenerator.net](https://realfavicongenerator.net) |

---

## Changing the WhatsApp number

The WhatsApp number powers:
- The floating WhatsApp button (every page)
- The "Chat on WhatsApp" CTAs after form submission
- The footer phone link

### Step 1 — open the file

`frontend/src/config/site.ts`

### Step 2 — find the line

```ts
export const siteConfig = {
  // ...
  whatsapp: '201000000000', // <-- change THIS, international format, no '+' or spaces
  // ...
}
```

### Step 3 — commit + push

```bash
git checkout -b update-whatsapp
git add frontend/src/config/site.ts
git commit -m "Update WhatsApp number"
git push origin update-whatsapp
```

Open a PR on GitHub → Vercel posts a preview link → confirm the link works (`https://wa.me/201000000000` should open WhatsApp) → merge.

---

## Changing prices

`frontend/src/content/pricing.ts`:

```ts
export const pricingTiers = [
  {
    id: 'starter',
    name: 'Starter',
    pricePerMonth: 30,            // <-- in USD
    classesPerMonth: 8,
    features: ['1-on-1 classes', 'Free trial', 'Flexible schedule'],
    ctaLabel: 'Start free trial',
    highlighted: false,
  },
  {
    id: 'growth',
    name: 'Growth',
    pricePerMonth: 50,
    classesPerMonth: 16,
    features: [/* ... */],
    highlighted: true,            // <-- this tier shows the gold "Most Popular" ribbon
  },
  // ...
]
```

After Sprint 6, prices can be edited in the admin panel without redeploy.

---

## Adding a testimonial

`frontend/src/content/testimonials.ts`:

```ts
export const testimonials = [
  // ... existing
  {
    name: 'Aisha M.',
    location: 'Birmingham, UK',
    course: 'Tajweed for Adults',
    quote: 'My recitation has improved beyond what I imagined in just three months...',
    rating: 5,                  // 1-5
    avatar: null,               // optional path to image; null shows initials
  },
]
```

---

## Adding / editing a course

**Sprint 1–5 (static):** edit `frontend/src/content/courses.ts`

```ts
{
  slug: 'tajweed-course',                      // becomes /courses/tajweed-course
  title: 'Online Tajweed Course',
  shortDescription: 'Master the rules of...',
  longDescription: '...',
  level: 'Beginner to Advanced',
  durationWeeks: 24,
  classesPerWeek: '2-4',
  ageGroup: 'All ages',
  primaryKeyword: 'online Tajweed course',
  seoTitle: 'Online Tajweed Course — ...',
  seoDescription: '...',
  curriculum: [
    { module: 'Foundations of Tajweed', topics: [/* ... */] },
    // ...
  ],
  faqs: [
    { q: '...', a: '...' },
  ],
  highlighted: true,
}
```

**Sprint 6+ (dynamic):** add via admin panel at `/admin/courses` (no code, no redeploy).

---

## Adding a blog post (after Sprint 6)

1. Log into `https://api.alrayan-academy.com/admin` with your admin credentials
2. **Blog Posts** → **New**
3. Fill: title, slug (auto-generated), excerpt, body (rich text), cover image, SEO title, SEO description
4. **Publish** → site updates within 5 seconds

---

## What CAN'T be edited from a single file (yet)

These are spread across multiple components — ask a developer:
- Page layout and section order
- Color palette (locked design system)
- Typography
- Animations and interactions
- Contact form fields

Layout/design changes are intentionally *not* easy edits — they protect the brand consistency the site was built for.

---

## Emergency content fix

If a typo is on a live page and you can't wait for a PR review:

1. GitHub → navigate to the file (e.g., `frontend/src/content/courses.ts`)
2. Click the pencil icon (edit)
3. Make the fix → "Commit directly to `main`" → write commit message → commit
4. Vercel auto-deploys in ~60 seconds

⚠️ Only do this for **typos and wording fixes**. Anything structural goes through a PR.
