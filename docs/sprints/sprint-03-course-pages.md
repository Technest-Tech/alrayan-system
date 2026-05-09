# Sprint 3 — Course Pages  *(OVERVIEW)*

> Detailed plan will be written at the start of Sprint 3.

**Duration:** 2 weeks
**Status:** Overview only

---

## Goal

Every course gets a fully SEO-optimized landing page strong enough to be the destination of a Google Ads campaign.

## Pages

- `/courses` — index of all courses
- `/courses/[slug]` — dynamic, generated for all 11 courses at build time

### The 11 courses

1. `noorani-qaida` — Noorani Qaida
2. `quran-classes-for-kids` — Quran Classes for Kids
3. `quran-classes-for-adults` — Quran Classes for Adults
4. `tajweed-course` — Tajweed Course
5. `hifz-memorization` — Hifz / Quran Memorization
6. `arabic-for-non-arabs` — Arabic for Non-Arabs
7. `islamic-studies` — Islamic Studies
8. `ijazah-program` — Ijazah Program
9. `tafseer-course` — Tafseer Course
10. `ten-qiraat` — Ten Qiraat
11. `female-quran-teachers` — Female Quran Teachers

## Page anatomy

Each course page:
1. Hero — H1 with primary keyword, supportive subhead, two CTAs, course meta-bar (level / duration / age group / class size)
2. What you'll learn — 4–6 outcome bullets with icons
3. Curriculum modules — accordion with module → topic list
4. Who this is for — 2–3 personas
5. Sample lesson preview — embedded YouTube placeholder OR text-based "What a class looks like"
6. Teachers for this course — strip of 3–4 teacher cards filtered by specialty
7. Pricing teaser — link to `/pricing`
8. FAQ — course-specific accordion (≥ 5 Q/A)
9. Related courses — 3 cards
10. Sticky bottom-bar CTA on scroll past hero (mobile-first)

## SEO

- `Course` schema per page (with provider, instructor, hasCourseInstance, offers)
- `FAQPage` schema injected from each course's FAQ section
- `BreadcrumbList`
- Each page targets one primary keyword (see [SEO-CHECKLIST.md](../SEO-CHECKLIST.md#per-page-targets-primary-keywords))
- Sitemap updated to include all course routes

## Content writing

Real, useful copy — no lorem ipsum. Each course needs:
- 60+ word short description
- 200+ word long description
- 5+ curriculum modules (3+ topics each)
- 5+ FAQ items
- SEO title ≤ 60 chars
- SEO description ≤ 160 chars

Total content: ~6,000 words written this sprint. **This is the bulk of the work.** Budget time accordingly.

## Components built

- `CourseHero`, `CourseOutcomes`, `CourseCurriculum`, `CoursePersonas`, `CourseFAQ`, `CourseTeachersStrip`, `RelatedCourses`, `StickyCourseCta`

## Out of scope

- Country pages (Sprint 5)
- Backend `/api/v1/courses` (Sprint 6) — content stays in `frontend/src/content/courses.ts` for now

## Definition of Done

- All 11 course pages live on staging
- Lighthouse ≥ 90 mobile on every course page
- All schema validated in [Schema.org validator](https://validator.schema.org/)
- Sitemap includes 11 course URLs + index
- Owner spot-checks 3 random course pages and approves copy
