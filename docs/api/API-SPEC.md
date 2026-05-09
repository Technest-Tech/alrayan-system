# API Specification — v1

**Base URL:** `https://api.alrayan-academy.com/api/v1`

**Auth:** Public endpoints (forms) require no auth, just rate-limiting + hCaptcha. Admin endpoints (`/admin/*`) use Sanctum cookie auth (Sprint 7).

**Format:** JSON only. All responses return `Content-Type: application/json`.

**Errors:** standard JSON shape:
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email field is required."]
  }
}
```

**Rate limits:**
- Public form endpoints: 5 requests/min per IP, 20/hour per IP
- Read endpoints (courses, blog): 60/min per IP

---

## Endpoints

### POST `/trial-bookings`  *(Sprint 4)*

Create a free trial class booking.

**Body:**
```json
{
  "name": "Sarah Ahmed",
  "email": "sarah@example.com",
  "country": "GB",                    // ISO 3166-1 alpha-2
  "phone": "+447700900123",           // optional
  "ageGroup": "adult",                // "kid_5_8" | "kid_9_12" | "teen" | "adult"
  "courseInterest": "tajweed-course", // matches Course.slug
  "preferredTime": "evenings",        // "mornings" | "afternoons" | "evenings" | "flexible"
  "timezone": "Europe/London",        // IANA TZ
  "message": "...",                   // optional, max 1000 chars
  "source": "google_ads_uk_tajweed",  // optional UTM-like attribution
  "captchaToken": "..."               // hCaptcha response token
}
```

**Validation (Laravel FormRequest):**
- `name`: required, string, 2–80 chars
- `email`: required, valid email, max 120 chars
- `country`: required, exists in our country list
- `ageGroup`, `preferredTime`: required, in enum
- `courseInterest`: required, exists in `courses` table (or static slug list pre-Sprint 6)
- `captchaToken`: required, valid hCaptcha

**Side effects:**
- Stored in `trial_bookings` table
- Mail to admin (`info@alrayan-academy.com`) — queued
- Confirmation mail to visitor — queued
- Optional: Slack/Telegram webhook fired (admin chooses in env)

**201 response:**
```json
{
  "success": true,
  "data": {
    "reference": "TB-2026-0042",
    "submittedAt": "2026-05-09T18:24:11Z",
    "whatsappLink": "https://wa.me/201000000000?text=Hi%2C%20I%20just%20submitted%20a%20trial%20booking%20%28TB-2026-0042%29..."
  }
}
```

**4xx:**
- `422` — validation failed
- `429` — rate limit hit

---

### POST `/contacts`  *(Sprint 4)*

General contact / inquiry form.

**Body:**
```json
{
  "name": "Ahmed K.",
  "email": "ahmed@example.com",
  "subject": "Question about Ijazah program",
  "message": "...",                   // 10–2000 chars
  "captchaToken": "..."
}
```

**201 response:**
```json
{
  "success": true,
  "data": {
    "reference": "CT-2026-0017",
    "submittedAt": "2026-05-09T18:24:11Z"
  }
}
```

---

### GET `/courses`  *(Sprint 6)*

List published courses. Cached, public.

**Query params:**
- `?level=beginner` (optional)
- `?ageGroup=kid` (optional)

**200 response:**
```json
{
  "data": [
    {
      "id": 1,
      "slug": "tajweed-course",
      "title": "Online Tajweed Course",
      "shortDescription": "...",
      "level": "Beginner to Advanced",
      "durationWeeks": 24,
      "ageGroup": "all",
      "highlighted": true,
      "iconUrl": "https://api.alrayan-academy.com/storage/courses/tajweed.svg",
      "updatedAt": "2026-05-01T12:00:00Z"
    }
  ],
  "meta": { "total": 11 }
}
```

---

### GET `/courses/{slug}`  *(Sprint 6)*

Single course detail (used by Next.js at build time + on revalidation).

---

### GET `/blog`  *(Sprint 6)*

```
?page=1&perPage=10&category=tajweed
```

**200 response:**
```json
{
  "data": [
    {
      "id": 1,
      "slug": "10-tips-for-quran-memorization",
      "title": "10 Practical Tips for Quran Memorization",
      "excerpt": "...",
      "coverUrl": "https://...",
      "publishedAt": "2026-04-15T09:00:00Z",
      "readingMinutes": 6,
      "author": { "name": "Sheikh Omar", "avatarUrl": "https://..." },
      "categories": ["tajweed", "memorization"]
    }
  ],
  "meta": { "total": 24, "page": 1, "perPage": 10, "lastPage": 3 }
}
```

---

### GET `/blog/{slug}`  *(Sprint 6)*

Returns full post body (HTML or MDX-rendered HTML), SEO meta, related posts.

---

### GET `/teachers`  *(Sprint 6)*

```json
{
  "data": [
    {
      "id": 1,
      "slug": "sheikh-ahmed-al-azhari",
      "name": "Sheikh Ahmed Al-Azhari",
      "credentials": ["Al-Azhar graduate", "Ijazah in Hafs", "10+ years teaching"],
      "languages": ["Arabic", "English"],
      "specialties": ["Tajweed", "Hifz", "Ijazah"],
      "gender": "male",
      "bio": "...",
      "avatarUrl": "https://..."
    }
  ]
}
```

---

### GET `/up`

Health check — returns `{"status":"ok","version":"1.0.0"}`. Used by UptimeRobot.

---

## Admin endpoints  *(Sprint 7)*

All require Sanctum cookie auth. Lives under `/admin/*` in Filament — REST endpoints below are for any future custom dashboard.

- `POST /admin/login`
- `POST /admin/logout`
- `GET /admin/trial-bookings?status=new`
- `PATCH /admin/trial-bookings/{id}` — update status
- `GET /admin/contacts`
- `POST /admin/courses` / `PATCH` / `DELETE`
- `POST /admin/blog-posts` / `PATCH` / `DELETE`
- `POST /admin/teachers` / `PATCH` / `DELETE`

---

## Webhooks

### Outbound: Next.js revalidation

Fired by Laravel when content changes. Targets the Next.js endpoint:

```
POST https://alrayan-academy.com/api/revalidate
Headers:
  X-Revalidate-Secret: <REVALIDATE_SECRET>
Body:
  { "paths": ["/blog/the-slug", "/blog"] }
```

Next.js calls `revalidatePath()` for each entry. Returns `204`.

---

## Conventions

- Timestamps: ISO 8601 UTC (`Z` suffix)
- Money: integer USD cents in DB, formatted USD float in response (`30.00`)
- IDs: integer primary keys; slugs are public-facing
- Pagination: cursor-based for blog if it grows past 100 posts; offset is fine for v1
- Versioning: URI prefix `/api/v1`. Breaking changes go to `/api/v2`
