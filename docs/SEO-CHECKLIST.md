# SEO Checklist

The site will run paid Google Ads + Meta Ads. Every landing page must be technically perfect or we waste ad spend.

---

## Built-in (handled in code)

These ship from Sprint 1 onward — verified in code review, not by the owner.

- [ ] Unique `<title>` per page, ≤ 60 chars
- [ ] Unique meta description per page, ≤ 160 chars
- [ ] Canonical `<link rel="canonical">` on every page
- [ ] Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `og:site_name`, `og:locale`)
- [ ] Twitter card tags (`summary_large_image`)
- [ ] `hreflang` tags ready for Phase 2 Arabic
- [ ] Schema.org JSON-LD:
  - `EducationalOrganization` on home + about
  - `Course` on every `/courses/[slug]` page
  - `FAQPage` on `/faq` and on each course page (FAQ sections)
  - `BreadcrumbList` on all non-home pages
  - `LocalBusiness` on country landing pages (with address per region)
  - `Organization` with `sameAs` (social profiles) on home
- [ ] `sitemap.xml` (Next.js `app/sitemap.ts`) listing every page with `lastmod`
- [ ] `robots.txt` (Next.js `app/robots.ts`) — allow all in prod, disallow all in staging
- [ ] Semantic HTML5: `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`
- [ ] Exactly one `<h1>` per page, with the primary keyword
- [ ] All images have meaningful `alt` text (or `alt=""` for purely decorative)
- [ ] All images use Next `<Image>` with explicit `width`/`height` — no CLS
- [ ] Lazy loading on below-the-fold images
- [ ] Self-hosted Google Fonts via `next/font` (no render-blocking)
- [ ] No mixed content (HTTP assets on HTTPS page)
- [ ] HTTP → HTTPS 301 (Vercel + Cloudflare handle this)
- [ ] `www` → apex (or vice versa) 301 — pick one canonical, stick with it
- [ ] Mobile viewport meta tag set
- [ ] Lighthouse mobile **Performance ≥ 90, SEO = 100, Accessibility ≥ 95**

---

## Pre-launch (do once)

- [ ] Buy domain (`alrayan-academy.com` already chosen — verify it's owned)
- [ ] Set up Google Search Console — add both `https://alrayan-academy.com` and `https://www.alrayan-academy.com` properties
- [ ] Submit sitemap in Search Console
- [ ] Set up Bing Webmaster Tools — submit sitemap
- [ ] Set up Google Analytics 4 (or Plausible if owner prefers privacy-first)
- [ ] Set up Google Tag Manager (cleaner than direct GA4 install)
- [ ] Set up Google Business Profile (helps for local SEO especially in country pages)
- [ ] Create / claim social profiles (Facebook, Instagram, YouTube, X) — link from footer
- [ ] Set up Meta Pixel for retargeting Meta Ads
- [ ] Privacy policy page (`/privacy`) + terms (`/terms`) — required for Meta Ads + EU GDPR
- [ ] Cookie consent banner — only if using GA4/Meta Pixel; not needed for Plausible

---

## Per-page targets (primary keywords)

| Page | Primary KW | Search intent |
|---|---|---|
| `/` | online Quran academy | brand + general |
| `/courses/quran-classes-for-kids` | online Quran classes for kids | high-intent commercial |
| `/courses/quran-classes-for-adults` | learn Quran online for adults | high-intent commercial |
| `/courses/tajweed-course` | online Tajweed course | commercial |
| `/courses/hifz-memorization` | online Quran memorization | commercial |
| `/courses/arabic-for-non-arabs` | learn Arabic online for non-Arabs | commercial |
| `/courses/ijazah-program` | online Ijazah program | commercial, lower volume but high value |
| `/courses/female-quran-teachers` | female Quran teacher online | commercial, very high CTR |
| `/courses/noorani-qaida` | Noorani Qaida online | commercial |
| `/courses/tafseer-course` | online Tafseer course | informational/commercial |
| `/courses/ten-qiraat` | Ten Qiraat online course | niche, low volume, high authority |
| `/courses/islamic-studies` | online Islamic studies | informational |
| `/countries/usa` | online Quran classes USA | geo-commercial (Google Ads target) |
| `/countries/uk` | online Quran classes UK | geo-commercial |
| `/countries/canada` | online Quran classes Canada | geo-commercial |
| `/countries/australia` | online Quran classes Australia | geo-commercial |

Each page targets **one primary keyword** and 3–5 supporting LSI keywords (covered in copy, headings, alt text).

---

## Content quality (manual writing checks)

- [ ] No keyword stuffing — natural sentences only
- [ ] H1 contains primary keyword once
- [ ] First 100 words of body include primary keyword
- [ ] At least one internal link per page to a related course or pricing
- [ ] At least one outbound link to a credible source (e.g., Al-Azhar, IJMA standards) where natural
- [ ] CTA in the first viewport on every commercial page

---

## Performance targets (Core Web Vitals)

| Metric | Target | Where measured |
|---|---|---|
| LCP | < 2.0s | PageSpeed Insights, mobile |
| INP | < 200ms | PageSpeed Insights, mobile |
| CLS | < 0.1 | PageSpeed Insights, mobile |
| TTFB | < 600ms | Vercel + WebPageTest |

---

## Post-launch monitoring (weekly first month, then monthly)

- [ ] Search Console — coverage errors, indexing, top queries, CTR by page
- [ ] Position tracking — Ahrefs / SEranking / free Google Search Console rankings
- [ ] Lighthouse CI on home + 3 high-traffic pages (alert if score drops > 5 points)
- [ ] Broken link check (Ahrefs Site Audit or `linkinator`)
- [ ] 404 monitoring in Vercel logs
- [ ] Page speed regression — Vercel Speed Insights tracks Real-User Monitoring

---

## Common pitfalls to avoid

- **Duplicate content** between country pages — each must have at least 60% unique copy (different testimonials, locale-specific FAQs, mention of timezone, common student demographics)
- **Thin pricing page** — Google ranks comparison/long-form pricing better; include FAQ + comparison table + benefits
- **Slow video embeds** — never autoplay, use lazy embed for any YouTube/Vimeo
- **Blog post URLs with dates** — use `/blog/[slug]`, not `/blog/2026/05/[slug]` (dated URLs lose authority over time)
- **`noindex` left on after staging launch** — staging environment must `noindex`; production must NOT. Verify on day 1.
