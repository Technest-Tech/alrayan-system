# Sprint 5 — Country Landing Pages + SEO Sweep  *(OVERVIEW)*

> Detailed plan will be written at the start of Sprint 5.

**Duration:** 2 weeks
**Status:** Overview only

---

## Goal

Geo-targeted landing pages ready for Google Ads spend. Site-wide SEO is locked down: schema everywhere it should be, sitemap complete, Search Console verified, Lighthouse ≥ 95 across the board.

## Pages

- `/countries/usa` — Online Quran Classes USA
- `/countries/uk` — Online Quran Classes UK
- `/countries/canada` — Online Quran Classes Canada
- `/countries/australia` — Online Quran Classes Australia

## Country page anatomy

Each country page (≥ 60% unique content from the others — no duplicate-content penalty):
1. Hero — H1 with `online Quran classes [Country]`, subhead mentioning timezone-friendly scheduling
2. Why families in [Country] choose Alrayan — 3–4 region-specific reasons
3. Schedule that fits [Country] timezones — visual showing class times in local time
4. Prices in local currency (USD primary, with note "≈ £X / C$X / A$X")
5. Region-specific testimonials (3+ per country, real-sounding names + cities like "Sarah, Dearborn MI" / "Yusuf, Manchester")
6. Country-specific FAQ (5+ — e.g. "Is this Hifqi-approved in the UK?", "Do you serve students in Toronto?")
7. Trust badges row (same as home)
8. CTA banner

## Schema.org full sweep

Audit every page, ensure:
- Home + About: `EducationalOrganization` + `Organization` with `sameAs` (social)
- Course pages: `Course` + `FAQPage` + `BreadcrumbList`
- FAQ page: `FAQPage`
- Country pages: `LocalBusiness` (with country-specific address: virtual / city-level), `BreadcrumbList`
- Blog (post-Sprint 6): `BlogPosting`
- All non-home pages: `BreadcrumbList`

Validate every JSON-LD blob via Google Rich Results Test.

## Site-wide SEO tasks

- [ ] Generate `og-default.jpg` (1200×630, navy + gold + Arabic + English wordmark)
- [ ] Generate per-page OG images (option A: static designs in Figma; option B: dynamic via `@vercel/og` — pick one)
- [ ] `sitemap.ts` lists every URL with realistic `priority` + `changefreq`
- [ ] `robots.ts` confirmed: prod = allow, staging = disallow
- [ ] hreflang tags on every page (`en-US` only for v1, with placeholder for `ar`)
- [ ] All `<Image>` have meaningful alt text (audit pass)
- [ ] All internal links use `<Link>` not `<a>`
- [ ] Lighthouse mobile ≥ 95 on home, /pricing, /contact, /courses/tajweed-course, /countries/usa
- [ ] PageSpeed Insights real-URL test on staging — Core Web Vitals all green
- [ ] Google Search Console properties created + sitemap submitted (production only)
- [ ] Bing Webmaster Tools: same
- [ ] GA4 (or Plausible) installed via GTM

## Components built
- `CountryHero`, `CountryWhyUs`, `TimezoneSchedule`, `CurrencyPriceTable`, `CountryFAQ`

## Content
- 4 country pages × ~800 words each = ~3,200 words written
- Country-specific testimonials (12 new ones — 3 per country)
- Currency conversion strings

## Out of scope
- Blog (Sprint 6)
- Admin (Sprint 7)
- Phase 2 Arabic translation (post-launch)

## Definition of Done

- All 4 country pages live
- Every page on the site has correct Schema.org markup (validated)
- `sitemap.xml` returns all expected URLs
- Lighthouse ≥ 95 mobile across the 5 audit pages above
- Search Console: ownership verified for both `https://alrayan-academy.com` and `https://www.alrayan-academy.com` properties
- Sitemap submitted, no coverage errors
- PageSpeed Insights green on Core Web Vitals
