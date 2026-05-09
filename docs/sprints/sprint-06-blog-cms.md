# Sprint 6 — Blog + Headless CMS  *(OVERVIEW)*

> Detailed plan will be written at the start of Sprint 6.

**Duration:** 2 weeks
**Status:** Overview only

---

## Goal

Owner can publish blog content from a backend admin without redeploying. Course + teacher data migrates from static files to the database (without breaking the frontend).

## Backend deliverables

### Models + migrations
- `BlogPost` — title, slug, excerpt, body (rich HTML), cover_image, seo_title, seo_description, status (`draft`/`published`), published_at, reading_minutes, author_id
- `BlogCategory` — title, slug
- `blog_post_category` pivot
- `Course` — fields matching `frontend/src/content/courses.ts` schema
- `Teacher` — fields matching `frontend/src/content/teachers.ts` schema
- Optional: `Author` for blog post bylines (or reuse `User`)

### Public endpoints
- `GET /api/v1/courses` — list (with filters: level, age_group)
- `GET /api/v1/courses/{slug}` — detail
- `GET /api/v1/teachers`
- `GET /api/v1/blog?page=1&perPage=10&category=tajweed`
- `GET /api/v1/blog/{slug}`
- All cached with `Cache::remember()` for 1 hour, busted on content update

### Outbound webhook
- `NextRevalidationService` fires `POST /api/revalidate` to Next.js whenever a course / blog post / teacher publishes or updates
- Authenticated by shared `REVALIDATE_SECRET`
- Job retried 3x with exponential backoff if Next.js doesn't respond

### Seeders
- `CourseSeeder` reads from `frontend/src/content/courses.ts` (or its JSON dump) — one-time migration
- `TeacherSeeder` same
- 3–5 starter blog posts with real content

### Tests
- Each public endpoint: 200 + correct shape, 404 for unknown slug, cache headers correct
- Revalidation webhook: fires when course saves, payload correct

## Frontend deliverables

### `/blog` index
- Featured post hero (latest published)
- Category filter chips
- Grid of post cards (3 cols desktop, 1 mobile) — cover, title, excerpt, date, reading time, category tag
- Pagination
- ISR: revalidate every 1 hour

### `/blog/[slug]`
- Full post layout: hero image, H1, byline + date + reading time, body content, related posts
- Table of contents for posts > 800 words (auto-generated from H2/H3)
- Social share buttons (X, Facebook, WhatsApp, copy link)
- `BlogPosting` schema
- ISR: revalidate every 1 hour + on-demand from Laravel webhook

### `/api/revalidate` route
- Verify `X-Revalidate-Secret` header
- Loop `paths`, call `revalidatePath()` for each
- Return 204

### Course pages migration
- Replace `src/content/courses.ts` reads with `await fetch(${API_URL}/courses/${slug})` in server components
- Keep `src/content/courses.ts` as fallback (in case API down at build time)
- Static generation still works — fetched at build, ISR'd at runtime

## Components built
- `BlogIndex`, `BlogCard`, `FeaturedPost`, `BlogPost` (full post layout), `TableOfContents`, `SocialShare`, `RelatedPosts`, `CategoryFilter`, `Pagination`

## Out of scope
- Admin UI (Sprint 7) — for now, content created via tinker / seeders / direct DB
- Comments
- Newsletter signup (post-launch)

## Definition of Done

- 3+ starter blog posts live on staging
- All 11 courses + all teachers served from API instead of static files
- Publishing a blog post via tinker triggers Next.js revalidation within 5s
- Lighthouse ≥ 90 mobile on /blog and a sample /blog/[slug]
- Schema validates on blog posts
- API tests pass in CI
- Sitemap auto-includes new blog URLs
