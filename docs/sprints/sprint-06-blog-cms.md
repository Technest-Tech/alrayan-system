# Sprint 6 — Blog + Headless CMS

**Duration:** 2 weeks
**Status:** Detailed, ready to implement.
**Sprint goal:** A fully functional blog ships on staging. Course and teacher data migrates from static TypeScript files to the database API, keeping the frontend working via ISR and a static fallback. Publishing a blog post from the backend triggers Next.js revalidation within 5 seconds.

---

## Definition of Done

- [ ] `/blog` renders with a featured post hero, category filter chips, and a post card grid
- [ ] `/blog/[slug]` renders the full post: hero image, byline, body HTML, table of contents, social share, related posts
- [ ] 3+ starter blog posts visible on staging with real Quran/education content
- [ ] All 11 courses and all teachers are served from `GET /api/v1/courses` and `GET /api/v1/teachers` (seeded from static files)
- [ ] Publishing a `BlogPost` (status → published) via `php artisan tinker` triggers `POST /api/revalidate` to Next.js within 5s
- [ ] All public API endpoints return correct shape and are cached for 1 hour
- [ ] Laravel feature tests pass in CI (`php artisan test`)
- [ ] `pnpm typecheck` and `pnpm lint` pass clean
- [ ] `pnpm build` completes — `/blog` and `/blog/[slug]` listed as static routes
- [ ] Lighthouse mobile ≥ 90 on `/blog` and a sample `/blog/[slug]`
- [ ] `BlogPosting` schema validates on blog post pages
- [ ] Sitemap auto-includes all published blog post URLs

---

## Story Breakdown

### S6-01 — Backend: Migrations *(1 day)*

Five new migrations, numbered sequentially after Sprint 4's migrations.

---

**`2026_05_10_000003_create_blog_categories_table.php`**

```php
Schema::create('blog_categories', function (Blueprint $table) {
    $table->id();
    $table->string('title');
    $table->string('slug')->unique();
    $table->timestamps();
});
```

---

**`2026_05_10_000004_create_blog_posts_table.php`**

```php
Schema::create('blog_posts', function (Blueprint $table) {
    $table->id();
    $table->string('title');
    $table->string('slug')->unique();
    $table->text('excerpt');
    $table->longText('body');          // rich HTML
    $table->string('cover_image')->nullable();
    $table->string('seo_title')->nullable();
    $table->text('seo_description')->nullable();
    $table->enum('status', ['draft', 'published'])->default('draft');
    $table->timestamp('published_at')->nullable();
    $table->unsignedSmallInteger('reading_minutes')->default(5);
    $table->foreignId('author_id')->constrained('users')->cascadeOnDelete();
    $table->timestamps();

    $table->index(['status', 'published_at']);
});
```

---

**`2026_05_10_000005_create_blog_post_category_table.php`**

```php
Schema::create('blog_post_category', function (Blueprint $table) {
    $table->foreignId('blog_post_id')->constrained()->cascadeOnDelete();
    $table->foreignId('blog_category_id')->constrained()->cascadeOnDelete();
    $table->primary(['blog_post_id', 'blog_category_id']);
});
```

---

**`2026_05_10_000006_create_courses_table.php`**

Fields mirror the `Course` TypeScript type from `frontend/src/content/courses.ts`.

```php
Schema::create('courses', function (Blueprint $table) {
    $table->id();
    $table->string('slug')->unique();
    $table->string('title');
    $table->text('short_description');
    $table->text('long_description');
    $table->string('icon');
    $table->string('age_group')->nullable();
    $table->enum('level', ['Beginner', 'Intermediate', 'Advanced', 'All Levels']);
    $table->string('duration_months')->nullable();
    $table->json('features');
    $table->string('seo_title');
    $table->text('seo_description');
    $table->json('outcomes');
    $table->json('curriculum');         // [{ module, topics[] }]
    $table->json('personas');           // [{ title, description }]
    $table->json('faqs');               // [{ q, a }]
    $table->json('related_slugs');
    $table->json('specialty_tags');
    $table->boolean('active')->default(true);
    $table->unsignedSmallInteger('sort_order')->default(0);
    $table->timestamps();
});
```

---

**`2026_05_10_000007_create_teachers_table.php`**

Fields mirror the `Teacher` TypeScript type from `frontend/src/content/teachers.ts`.

```php
Schema::create('teachers', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('role');
    $table->text('bio');
    $table->string('image')->nullable();
    $table->json('specialties');
    $table->json('languages');
    $table->string('experience');
    $table->string('students_taught');
    $table->boolean('featured')->default(false);
    $table->unsignedSmallInteger('sort_order')->default(0);
    $table->timestamps();
});
```

**Acceptance:**
- [ ] `php artisan migrate:fresh` completes without errors
- [ ] All five tables exist in the database

---

### S6-02 — Backend: Models *(0.5 day)*

**`app/Models/BlogCategory.php`**

```php
protected $fillable = ['title', 'slug'];
public function posts(): BelongsToMany { return $this->belongsToMany(BlogPost::class); }
```

---

**`app/Models/BlogPost.php`**

```php
protected $fillable = [
    'title', 'slug', 'excerpt', 'body', 'cover_image',
    'seo_title', 'seo_description', 'status', 'published_at',
    'reading_minutes', 'author_id',
];
protected $casts = [
    'published_at' => 'datetime',
    'reading_minutes' => 'integer',
];

public function categories(): BelongsToMany { return $this->belongsToMany(BlogCategory::class); }
public function author(): BelongsTo { return $this->belongsTo(User::class, 'author_id'); }

public function scopePublished(Builder $query): Builder {
    return $query->where('status', 'published')
                 ->whereNotNull('published_at')
                 ->where('published_at', '<=', now());
}
```

After saving, fire `NextRevalidationService` if post just became published:

```php
protected static function booted(): void
{
    static::saved(function (BlogPost $post) {
        if ($post->wasChanged('status') && $post->status === 'published') {
            app(NextRevalidationService::class)->revalidate([
                '/blog',
                "/blog/{$post->slug}",
            ]);
        }
    });
}
```

---

**`app/Models/Course.php`**

```php
protected $fillable = [
    'slug', 'title', 'short_description', 'long_description',
    'icon', 'age_group', 'level', 'duration_months',
    'features', 'seo_title', 'seo_description',
    'outcomes', 'curriculum', 'personas', 'faqs',
    'related_slugs', 'specialty_tags', 'active', 'sort_order',
];
protected $casts = [
    'features' => 'array', 'outcomes' => 'array', 'curriculum' => 'array',
    'personas' => 'array', 'faqs' => 'array', 'related_slugs' => 'array',
    'specialty_tags' => 'array', 'active' => 'boolean',
];
public function scopeActive(Builder $query): Builder {
    return $query->where('active', true)->orderBy('sort_order');
}
```

After saving, fire revalidation for `['/courses', "/courses/{$course->slug}"]`.

---

**`app/Models/Teacher.php`**

```php
protected $fillable = [
    'name', 'role', 'bio', 'image',
    'specialties', 'languages', 'experience', 'students_taught',
    'featured', 'sort_order',
];
protected $casts = [
    'specialties' => 'array', 'languages' => 'array',
    'featured' => 'boolean',
];
```

**Acceptance:**
- [ ] `BlogPost::published()->get()` returns only published posts with past `published_at`
- [ ] Saving a `BlogPost` with `status = 'published'` calls `NextRevalidationService`
- [ ] `Course::active()->get()` returns active courses sorted by `sort_order`

---

### S6-03 — Backend: API Controllers + Routes *(1 day)*

All public read endpoints live under `/api/v1` with no auth or rate limiting (they are idempotent GET requests).
Responses are cached via `Cache::remember()` for 1 hour. Cache is busted on model save.

---

**`app/Http/Controllers/Api/V1/BlogController.php`**

```php
public function index(Request $request): JsonResponse
{
    $cacheKey = "blog.index.{$request->get('page',1)}.{$request->get('category','')}";
    $data = Cache::remember($cacheKey, 3600, function () use ($request) {
        $query = BlogPost::published()
            ->with(['categories', 'author:id,name'])
            ->latest('published_at');

        if ($cat = $request->get('category')) {
            $query->whereHas('categories', fn($q) => $q->where('slug', $cat));
        }

        return $query->paginate($request->integer('perPage', 10));
    });

    return response()->json($data);
}

public function show(string $slug): JsonResponse
{
    $data = Cache::remember("blog.show.{$slug}", 3600, function () use ($slug) {
        return BlogPost::published()
            ->with(['categories', 'author:id,name'])
            ->where('slug', $slug)
            ->firstOrFail();
    });

    return response()->json($data);
}
```

---

**`app/Http/Controllers/Api/V1/CourseApiController.php`**

```php
public function index(Request $request): JsonResponse
{
    $data = Cache::remember('courses.index', 3600, fn() =>
        Course::active()->get()
    );
    return response()->json(['data' => $data]);
}

public function show(string $slug): JsonResponse
{
    $data = Cache::remember("courses.show.{$slug}", 3600, fn() =>
        Course::active()->where('slug', $slug)->firstOrFail()
    );
    return response()->json($data);
}
```

---

**`app/Http/Controllers/Api/V1/TeacherController.php`**

```php
public function index(): JsonResponse
{
    $data = Cache::remember('teachers.index', 3600, fn() =>
        Teacher::where('featured', true)->orderBy('sort_order')->get()
    );
    return response()->json(['data' => $data]);
}
```

---

**`routes/api.php` additions:**

```php
// Public read-only — no auth, no rate limit, no Turnstile
Route::prefix('v1')->group(function () {
    Route::get('/blog',             [BlogController::class, 'index']);
    Route::get('/blog/{slug}',      [BlogController::class, 'show']);
    Route::get('/courses',          [CourseApiController::class, 'index']);
    Route::get('/courses/{slug}',   [CourseApiController::class, 'show']);
    Route::get('/teachers',         [TeacherController::class, 'index']);
});
```

**Acceptance:**
- [ ] `GET /api/v1/blog` returns `{ data: [...], current_page, total, ... }` (Laravel paginator shape)
- [ ] `GET /api/v1/blog/nonexistent-slug` returns 404
- [ ] `GET /api/v1/courses` returns `{ data: [...] }` with all 11 courses
- [ ] `GET /api/v1/courses/tajweed-course` returns the full course object
- [ ] `GET /api/v1/teachers` returns `{ data: [...] }` with featured teachers
- [ ] Response includes `Cache-Control` header (handled by Laravel's response caching)

---

### S6-04 — Backend: NextRevalidationService + Job *(0.5 day)*

**`app/Services/NextRevalidationService.php`**

```php
namespace App\Services;

use App\Jobs\RevalidateNextPages;
use Illuminate\Support\Facades\Log;

class NextRevalidationService
{
    public function revalidate(array $paths): void
    {
        if (empty($paths) || !config('services.nextjs.revalidate_url')) {
            return;
        }
        RevalidateNextPages::dispatch($paths);
    }
}
```

**`app/Jobs/RevalidateNextPages.php`**

```php
namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RevalidateNextPages implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 10;   // seconds between retries (Laravel doubles each retry)

    public function __construct(private array $paths) {}

    public function handle(): void
    {
        $url    = config('services.nextjs.revalidate_url');
        $secret = config('services.nextjs.revalidate_secret');

        $response = Http::withHeaders(['X-Revalidate-Secret' => $secret])
            ->timeout(10)
            ->post($url, ['paths' => $this->paths]);

        if (!$response->successful()) {
            Log::warning('NextRevalidation failed', [
                'status' => $response->status(),
                'paths'  => $this->paths,
            ]);
            $this->fail("Next.js revalidate returned {$response->status()}");
        }
    }
}
```

**`config/services.php` additions:**

```php
'nextjs' => [
    'revalidate_url'    => env('NEXT_REVALIDATE_URL'),
    'revalidate_secret' => env('NEXT_REVALIDATE_SECRET'),
],
```

**`.env` additions:**

```
NEXT_REVALIDATE_URL=http://localhost:3000/api/revalidate
NEXT_REVALIDATE_SECRET=changeme-dev-secret
```

**Acceptance:**
- [ ] Calling `app(NextRevalidationService::class)->revalidate(['/blog'])` dispatches a job
- [ ] Job retries 3× with backoff on 4xx/5xx from Next.js
- [ ] `NEXT_REVALIDATE_URL` not set → service returns early (no job dispatched)

---

### S6-05 — Backend: Seeders *(0.5 day)*

**`database/seeders/BlogCategorySeeder.php`**

Six categories, covering the blog's content pillars:

| title | slug |
|---|---|
| Quran Learning | quran-learning |
| Tajweed | tajweed |
| Hifz & Memorization | hifz-memorization |
| Arabic Language | arabic-language |
| Islamic Studies | islamic-studies |
| Tips & Guides | tips-guides |

---

**`database/seeders/BlogPostSeeder.php`**

Five starter posts seeded directly (no external file dependency).
Each post is `status = 'published'`, `published_at = now()`, `author_id = 1` (first user — create one via `UserFactory` if needed).

Posts:

1. **"How to Choose a Quran Teacher Online: 7 Things to Look For"**
   - slug: `how-to-choose-quran-teacher-online`
   - category: `tips-guides`
   - reading_minutes: 6
   - excerpt: A practical checklist covering Ijazah credentials, teaching style, trial lessons, and scheduling flexibility.

2. **"The Complete Guide to Tajweed Rules for Beginners"**
   - slug: `complete-guide-tajweed-rules-beginners`
   - category: `tajweed`
   - reading_minutes: 8
   - excerpt: What Tajweed is, why it matters, the six key rules every beginner must know, and how to practice them daily.

3. **"Is Online Quran Learning as Effective as In-Person?"**
   - slug: `online-quran-learning-effectiveness`
   - category: `quran-learning`
   - reading_minutes: 5
   - excerpt: Research, teacher experience, and 10,000+ student outcomes suggest online 1-on-1 classes can outperform group in-person tuition.

4. **"Noorani Qaida vs. Direct Quran Reading: Which Comes First?"**
   - slug: `noorani-qaida-vs-direct-quran-reading`
   - category: `quran-learning`
   - reading_minutes: 4
   - excerpt: Why most scholars recommend Noorani Qaida as the foundation, and which students can skip straight to Quran reading.

5. **"How Long Does It Take to Memorize the Quran (Hifz)?"**
   - slug: `how-long-to-memorize-quran-hifz`
   - category: `hifz-memorization`
   - reading_minutes: 7
   - excerpt: Realistic timelines based on daily hours of study, age, and prior Quran knowledge — from 1 year to 5 years, explained.

---

**`database/seeders/CourseSeeder.php`**

Reads the course data inline (mirrored from `frontend/src/content/courses.ts`).
Uses `Course::updateOrCreate(['slug' => $data['slug']], $data)` so re-running is idempotent.
Sets `sort_order` by position in the array.

---

**`database/seeders/TeacherSeeder.php`**

Same pattern — reads teacher data inline from `frontend/src/content/teachers.ts`, upserts by name.

---

**`database/seeders/DatabaseSeeder.php`** — update `run()`:

```php
$this->call([
    BlogCategorySeeder::class,
    BlogPostSeeder::class,
    CourseSeeder::class,
    TeacherSeeder::class,
]);
```

**Acceptance:**
- [ ] `php artisan db:seed` completes without errors
- [ ] `BlogPost::count()` = 5, `BlogCategory::count()` = 6
- [ ] `Course::count()` = 11
- [ ] Re-running `db:seed` is idempotent (no duplicate rows)

---

### S6-06 — Backend: Feature Tests *(1 day)*

**`tests/Feature/Api/BlogApiTest.php`**

```php
it('lists published posts', function () {
    BlogPost::factory()->published()->count(3)->create();
    BlogPost::factory()->draft()->create();       // should NOT appear

    get('/api/v1/blog')
        ->assertOk()
        ->assertJsonStructure(['data', 'total', 'current_page']);

    expect(response()->json('total'))->toBe(3);
});

it('returns 404 for unknown slug', function () {
    get('/api/v1/blog/no-such-post')->assertNotFound();
});

it('returns a single published post', function () {
    $post = BlogPost::factory()->published()->create(['slug' => 'test-post']);

    get('/api/v1/blog/test-post')
        ->assertOk()
        ->assertJsonPath('slug', 'test-post');
});

it('returns 404 for draft post', function () {
    BlogPost::factory()->draft()->create(['slug' => 'draft-post']);
    get('/api/v1/blog/draft-post')->assertNotFound();
});

it('filters by category slug', function () {
    $cat = BlogCategory::factory()->create(['slug' => 'tajweed']);
    $matching = BlogPost::factory()->published()->create();
    $matching->categories()->attach($cat);
    BlogPost::factory()->published()->create();  // no category match

    get('/api/v1/blog?category=tajweed')
        ->assertOk()
        ->assertJsonPath('total', 1);
});
```

---

**`tests/Feature/Api/CourseApiTest.php`**

```php
it('lists active courses', function () {
    Course::factory()->count(3)->create(['active' => true]);
    Course::factory()->create(['active' => false]);

    get('/api/v1/courses')
        ->assertOk()
        ->assertJsonStructure(['data']);
    expect(count(response()->json('data')))->toBe(3);
});

it('returns a single course by slug', function () {
    Course::factory()->create(['slug' => 'tajweed-course']);
    get('/api/v1/courses/tajweed-course')->assertOk()->assertJsonPath('slug', 'tajweed-course');
});

it('returns 404 for unknown course slug', function () {
    get('/api/v1/courses/nonexistent')->assertNotFound();
});
```

---

**`tests/Feature/Api/TeacherApiTest.php`**

```php
it('lists featured teachers', function () {
    Teacher::factory()->count(3)->create(['featured' => true]);
    Teacher::factory()->create(['featured' => false]);

    get('/api/v1/teachers')
        ->assertOk()
        ->assertJsonStructure(['data']);
    expect(count(response()->json('data')))->toBe(3);
});
```

**Factories required:**
- `BlogPostFactory` (states: `published()`, `draft()`)
- `BlogCategoryFactory`
- `CourseFactory`
- `TeacherFactory`

**Acceptance:**
- [ ] `php artisan test` passes with 0 failures
- [ ] All edge cases covered: unknown slug → 404, draft post hidden, inactive course hidden

---

### S6-07 — Frontend: Blog Types + Content File *(0.5 day)*

**`frontend/src/content/blog.ts`**

```ts
export type BlogCategory = {
  slug: string
  title: string
}

export type BlogPost = {
  slug: string
  title: string
  excerpt: string
  body: string          // rich HTML
  coverImage: string    // URL or /images/blog/... path
  seoTitle?: string
  seoDescription?: string
  publishedAt: string   // ISO date string
  readingMinutes: number
  categories: BlogCategory[]
  author: { name: string }
  relatedSlugs?: string[]
}

export const blogCategories: BlogCategory[] = [
  { slug: 'quran-learning',    title: 'Quran Learning' },
  { slug: 'tajweed',           title: 'Tajweed' },
  { slug: 'hifz-memorization', title: 'Hifz & Memorization' },
  { slug: 'arabic-language',   title: 'Arabic Language' },
  { slug: 'islamic-studies',   title: 'Islamic Studies' },
  { slug: 'tips-guides',       title: 'Tips & Guides' },
]

export const blogPosts: BlogPost[] = [
  // 5 starter posts matching the backend seeders
  // Used as static fallback if API is unreachable at build time
  { ... }  // see S6-05 for titles/slugs
]
```

The `blogPosts` array contains full HTML body content for the 5 starter posts.
The `/blog` and `/blog/[slug]` pages first try `fetch(${API_URL}/api/v1/blog)` and fall back to `blogPosts` if the fetch fails.

**Acceptance:**
- [ ] `BlogPost` type matches the API response shape
- [ ] Static fallback array has 5 posts matching the seeder slugs

---

### S6-08 — Frontend: Blog UI Components *(1 day)*

All components live in `frontend/src/components/blog/`.

---

**`BlogCard.tsx`**

Props: `{ post: BlogPost; priority?: boolean }`

Layout:
```
┌─────────────────────────────────┐
│  Cover image (aspect-video)     │
│  Category chip (top-left badge) │
├─────────────────────────────────┤
│  Title (line-clamp-2)           │
│  Excerpt (line-clamp-3 text-sm) │
│  Reading time · Date            │
└─────────────────────────────────┘
```

- `<Link href={/blog/${post.slug}}>` wraps the whole card
- `next/image` for cover — `sizes="(max-width:768px) 100vw, 33vw"`
- Date formatted as `"12 Jan 2026"` via `Intl.DateTimeFormat`
- Category chip: `bg-secondary/10 text-secondary text-xs rounded-full px-2 py-0.5`

---

**`FeaturedPost.tsx`**

Props: `{ post: BlogPost }`

Hero-style card: full-width, 60vh min-height, cover image as background with `bg-gradient-to-t from-black/70`. Title, excerpt, category chip, and CTA in white text overlaid at the bottom. "Read Article →" gold button.

---

**`CategoryFilter.tsx`**

Props: `{ categories: BlogCategory[]; active: string | null; onChange: (slug: string | null) => void }`

Client component. Renders "All" chip + one chip per category.
Active chip: `bg-primary text-white`. Inactive: `bg-secondary/10 text-secondary hover:bg-secondary/20`.

---

**`Pagination.tsx`**

Props: `{ currentPage: number; totalPages: number; basePath: string }`

Renders `← Prev` / `Next →` links using `<Link>`. Page indicator: `Page 2 of 5`.
Accessible: `aria-label="Pagination"`, current page `aria-current="page"`.

---

**`TableOfContents.tsx`**

Props: `{ html: string }` — client component.

Parses `<h2>` and `<h3>` tags from the HTML string (via `DOMParser` in browser), builds a nested list with anchor links.
Shown only when post has ≥ 3 headings. Sticky on desktop (`sticky top-24`), collapsed on mobile.

---

**`SocialShare.tsx`**

Props: `{ title: string; url: string }`

Four share buttons: X (Twitter), Facebook, WhatsApp, Copy Link.
Copy Link uses `navigator.clipboard.writeText()` — shows "Copied!" toast for 2 seconds.
Icons from lucide-react: `Twitter`, `Facebook`, `Share2`, `Link`.

---

**`RelatedPosts.tsx`**

Props: `{ posts: BlogPost[] }`

Renders up to 3 `BlogCard`s in a `grid-cols-1 sm:grid-cols-3` grid.
H2: "More Articles", eyebrow: "Keep Reading".

---

**Acceptance:**
- [ ] `BlogCard` links to correct slug URL
- [ ] `CategoryFilter` toggles active state; "All" resets filter
- [ ] `TableOfContents` hides when post has < 3 H2/H3 headings
- [ ] `SocialShare` copy button shows "Copied!" confirmation
- [ ] `Pagination` prev/next disabled at boundaries

---

### S6-09 — Frontend: /blog Index Page *(0.75 day)*

**`frontend/src/app/(marketing)/blog/page.tsx`**

Server component + `'use client'` child for category filter.

```ts
export const revalidate = 3600  // ISR — 1 hour

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: 'Blog — Quran Learning Tips & Guides | Alrayan Academy',
    description: 'Articles on Tajweed, Hifz, online Quran learning, and Islamic education from certified teachers at Alrayan Academy.',
    path: '/blog',
  })
}
```

**Page structure:**

```
Hero strip (bg-primary)          ← "Alrayan Blog" H1 + short description
FeaturedPost (latest post)
Category filter + post grid
Pagination
```

Data fetching:

```ts
async function getPosts(page = 1, category = '') {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/blog?page=${page}&perPage=9&category=${category}`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) throw new Error('API error')
    return res.json()
  } catch {
    // fallback to static data
    return { data: blogPosts, total: blogPosts.length, current_page: 1, last_page: 1 }
  }
}
```

The category filter is a client component (`'use client'`) that uses `useRouter` and `useSearchParams` to append `?category=slug` to the URL, which triggers a server-side re-fetch via Next.js `searchParams`.

Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`

JSON-LD: `breadcrumbSchema([{ name: 'Home', href: '/' }, { name: 'Blog', href: '/blog' }])`

**Acceptance:**
- [ ] Page renders with featured post + grid of cards
- [ ] Category filter updates the URL with `?category=slug` and re-renders the grid
- [ ] Fallback renders when API is unreachable
- [ ] Pagination shows when `last_page > 1`

---

### S6-10 — Frontend: /blog/[slug] Detail Page *(0.75 day)*

**`frontend/src/app/(marketing)/blog/[slug]/page.tsx`**

```ts
export const revalidate = 3600
```

`generateStaticParams` pre-renders the 5 starter posts (from `blogPosts` static data). At build time, ISR generates remaining posts on first request.

Page sections:

```
Hero image (full-width, 50vh, cover)
Breadcrumb: Home → Blog → [title]
H1 + byline (author · date · reading time) + category chips
Body (two-column on desktop: article left 2/3, ToC sticky right 1/3)
SocialShare bar (below article body)
RelatedPosts (3 cards)
CtaBanner (bg-primary)
```

Body HTML is rendered via:

```tsx
<div
  className="prose prose-lg max-w-none prose-headings:font-display prose-a:text-primary"
  dangerouslySetInnerHTML={{ __html: post.body }}
/>
```

Schema injected:

```ts
const schemas = [
  blogPostingSchema(post),
  breadcrumbSchema([
    { name: 'Home',  href: '/' },
    { name: 'Blog',  href: '/blog' },
    { name: post.title, href: `/blog/${post.slug}` },
  ]),
]
```

**Acceptance:**
- [ ] `generateStaticParams` returns 5 slugs from static data
- [ ] Unknown slug returns `notFound()` → 404
- [ ] `BlogPosting` JSON-LD present in page source
- [ ] TableOfContents hidden when post body has < 3 headings
- [ ] SocialShare shows correct URL
- [ ] Related posts rendered as card grid

---

### S6-11 — Frontend: Schema + Sitemap *(0.25 day)*

**`frontend/src/lib/schema.ts`** — add `blogPostingSchema`:

```ts
export function blogPostingSchema(post: {
  title: string
  slug: string
  excerpt: string
  publishedAt: string
  readingMinutes: number
  coverImage?: string
  author: { name: string }
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    url: `${siteConfig.url}/blog/${post.slug}`,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    image: post.coverImage ?? `${siteConfig.url}/og-default.jpg`,
    author: {
      '@type': 'Person',
      name: post.author.name,
    },
    publisher: {
      '@type': 'EducationalOrganization',
      name: siteConfig.name,
      url: siteConfig.url,
      logo: { '@type': 'ImageObject', url: `${siteConfig.url}/logo/alrayan-full.svg` },
    },
    timeRequired: `PT${post.readingMinutes}M`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${siteConfig.url}/blog/${post.slug}` },
  }
}
```

---

**`frontend/src/app/sitemap.ts`** — add blog routes:

```ts
import { blogPosts } from '@/content/blog'

const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => ({
  url: `${base}/blog/${post.slug}`,
  lastModified: new Date(post.publishedAt),
  changeFrequency: 'monthly' as const,
  priority: 0.7,
}))

// Add to the return:
return [...staticRoutes, ...courseRoutes, ...countryRoutes, ...blogRoutes]
```

The `/blog` index is already in `staticRoutes` at `priority: 0.6, changeFrequency: 'daily'`.

**Acceptance:**
- [ ] `blogPostingSchema` exported from `schema.ts`
- [ ] `sitemap.xml` at build time includes all 5 blog post URLs

---

### S6-12 — QA *(0.5 day)*

- [ ] `pnpm typecheck` passes clean
- [ ] `pnpm lint` passes clean
- [ ] `pnpm build` completes — `/blog` and `/blog/[slug]` listed as static routes (5 slugs)
- [ ] `php artisan test` passes — 0 failures
- [ ] `php artisan db:seed` runs cleanly on a fresh DB
- [ ] Saving a BlogPost via `php artisan tinker` with `status = 'published'` dispatches a job
- [ ] `/blog` renders with FeaturedPost hero and card grid
- [ ] `/blog/tajweed-rules-for-beginners` (or any seeded slug) renders full post layout
- [ ] Category filter correctly filters posts
- [ ] TableOfContents appears on posts with ≥ 3 headings
- [ ] SocialShare copy button works
- [ ] `BlogPosting` JSON-LD in `/blog/[slug]` page source
- [ ] `BreadcrumbList` JSON-LD in both `/blog` and `/blog/[slug]`
- [ ] Sitemap includes all blog post URLs
- [ ] Lighthouse mobile ≥ 90 on `/blog`
- [ ] Google Rich Results Test passes on `/blog/[slug]` (`BlogPosting`)

---

## Files created / modified in this sprint

```
backend/
├── app/
│   ├── Http/Controllers/Api/V1/
│   │   ├── BlogController.php                ← NEW
│   │   ├── CourseApiController.php           ← NEW
│   │   └── TeacherController.php             ← NEW
│   ├── Jobs/
│   │   └── RevalidateNextPages.php           ← NEW
│   ├── Models/
│   │   ├── BlogCategory.php                  ← NEW
│   │   ├── BlogPost.php                      ← NEW
│   │   ├── Course.php                        ← NEW
│   │   └── Teacher.php                       ← NEW
│   └── Services/
│       └── NextRevalidationService.php       ← NEW
├── config/services.php                       ← MODIFIED
├── database/
│   ├── factories/
│   │   ├── BlogCategoryFactory.php           ← NEW
│   │   ├── BlogPostFactory.php               ← NEW
│   │   ├── CourseFactory.php                 ← NEW
│   │   └── TeacherFactory.php                ← NEW
│   ├── migrations/
│   │   ├── ..._create_blog_categories_table.php  ← NEW
│   │   ├── ..._create_blog_posts_table.php        ← NEW
│   │   ├── ..._create_blog_post_category_table.php ← NEW
│   │   ├── ..._create_courses_table.php            ← NEW
│   │   └── ..._create_teachers_table.php           ← NEW
│   └── seeders/
│       ├── BlogCategorySeeder.php            ← NEW
│       ├── BlogPostSeeder.php                ← NEW
│       ├── CourseSeeder.php                  ← NEW
│       ├── TeacherSeeder.php                 ← NEW
│       └── DatabaseSeeder.php                ← MODIFIED
├── routes/api.php                            ← MODIFIED
└── tests/Feature/Api/
    ├── BlogApiTest.php                       ← NEW
    ├── CourseApiTest.php                     ← NEW
    └── TeacherApiTest.php                    ← NEW

frontend/src/
├── app/(marketing)/
│   └── blog/
│       ├── page.tsx                          ← NEW
│       └── [slug]/
│           └── page.tsx                      ← NEW
├── components/blog/
│   ├── BlogCard.tsx                          ← NEW
│   ├── CategoryFilter.tsx                    ← NEW
│   ├── FeaturedPost.tsx                      ← NEW
│   ├── Pagination.tsx                        ← NEW
│   ├── RelatedPosts.tsx                      ← NEW
│   ├── SocialShare.tsx                       ← NEW
│   └── TableOfContents.tsx                   ← NEW
├── content/
│   └── blog.ts                               ← NEW
├── lib/
│   └── schema.ts                             ← MODIFIED (blogPostingSchema)
└── app/
    └── sitemap.ts                            ← MODIFIED (blog routes)
```

---

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| `dangerouslySetInnerHTML` for blog body | Body HTML is written by us (seeded/tinker) — not user input. For Phase 2 when admin UI exists, sanitize with DOMPurify server-side before storing. |
| API unreachable at Next.js build time | Static fallback in `blogPosts` ensures `pnpm build` always succeeds. |
| Queue not running on staging → revalidation never fires | Use `QUEUE_CONNECTION=sync` in `.env` for staging so jobs run synchronously within the request. |
| `BlogPosting` schema rejected by Rich Results if `author.name` is missing | BlogPostSeeder always sets `author_id` to a real user. |
| TableOfContents using `DOMParser` SSR-side | `TableOfContents` is a client component — `DOMParser` is browser-only, no SSR issue. |

---

## What this sprint does NOT deliver

- Admin UI for blog (Sprint 7)
- Comments or reactions
- Newsletter signup
- Dynamic OG images per blog post (`@vercel/og`)
- Replacing `src/content/courses.ts` reads with live API fetches in course pages (Sprint 7 — API data is seeded and available, frontend migration deferred)
- Arabic blog posts (Phase 2)
- Google Analytics / tag manager install (Sprint 7)
