# SYS-03 — Students, Teachers & Courses

**Modules covered:** 3 (Student Management), 4 (Teacher Management), 5 (Courses)
**Duration:** 2 weeks
**Status:** Implementation complete (2026-05-10). Pending: feature tests, Playwright E2E, staging deploy.
**Sprint goal:** the academy's three core entities exist as fully-featured CRUD modules with profile pages, a working student lifecycle state machine, family/sibling linking, teacher availability + leave management, and internal notes. Every change is audit-logged. Scheduling, attendance, billing, payroll, and reports come in later sprints.

> **Prereqs** — SYS-02 has shipped. Sanctum auth, Spatie roles + permissions, audit log infrastructure, notification bell, and the dashboard shell are all live.

> **Out of scope** — sessions / Zoom (SYS-04), invoicing + pricing math (SYS-05), payroll (SYS-06), CRM lead pipeline (SYS-07). Stubs are left where these will plug in.

---

## Definition of Done

### Backend
- [ ] Eight `sys_*` tables created via migrations: `sys_students`, `sys_student_timeline`, `sys_student_family_links`, `sys_student_notes`, `sys_teachers`, `sys_teacher_availability`, `sys_teacher_leaves`, `sys_teacher_notes`
- [ ] One column added to the shared `courses` table (`is_active_for_system`) via a system migration — does not touch site fields
- [ ] All eight tables have factories + a baseline seeder (`SystemDemoSeeder` extended)
- [ ] Models: `Student`, `Teacher`, `Course` (extension of shared model), `TeacherAvailability`, `TeacherLeave`, `StudentTimelineEntry`, `StudentFamilyLink`, `StudentNote`, `TeacherNote`
- [ ] Each model has a Spatie ActivityLog log option that captures changes to "watched" fields (price, sessions/month, status, teacher, schedule) into `sys_activity_log`
- [ ] Policies registered for `Student`, `Teacher`, `StudentNote`, `TeacherNote`, `TeacherLeave`
- [ ] 14 endpoints total under `/api/system/` (listed in [#endpoints](#endpoints))
- [ ] Every list endpoint supports `filter[*]`, `sort=`, `include=`, `q=` via `spatie/laravel-query-builder`
- [ ] Every state-changing endpoint writes either an `AuditLog` row (deliberate actions) or an `ActivityLog` row (model field changes), never both
- [ ] `StudentLifecycle` service enforces the 5-state machine — invalid transitions return 422
- [ ] Family/sibling discount auto-applied to all linked students whenever the link is created or removed

### Frontend
- [ ] `/courses` — list view of the four marketing courses + per-course active-student count + edit button (admin only)
- [ ] `/teachers` — list, filter, search, sort
- [ ] `/teachers/new` — create sheet (sheet, not full page)
- [ ] `/teachers/[id]` — profile full page with tabs: **Profile · Availability · Leave · Students · Notes** (Schedule, Reports, Salary, and Sessions tabs render placeholder empty states wired up in later sprints)
- [ ] `/teachers/leave` — calendar view of all teacher leaves with approve/reject actions
- [ ] `/students` — list, filter (status, course, teacher, country, age category), search by name/phone/email, density toggle
- [ ] `/students/new` — full-page form (lots of fields, doesn't fit a sheet)
- [ ] `/students/[id]` — profile full page with tabs: **Profile · Timeline · Family · Notes** (Sessions, Reports, Invoices, Wallet tabs render placeholder empty states)
- [ ] Status badge with the 5 states + transition button group on the profile page (only transitions allowed by the state machine are clickable)
- [ ] Family-link picker can attach an existing sibling (search), set a discount %, and remove a link with confirmation
- [ ] WhatsApp-group field (text URL + status select). When a student is `Active` and `whatsapp_group_id` is null, an inline warning appears
- [ ] Internal notes: timeline-style list, "+ Add note" sheet, edit own notes only (admin can edit any), soft-delete
- [ ] Empty states designed for: no students, no teachers, no notes, no timeline yet
- [ ] All tables persist filters in the URL (`?status=active&teacher_id=12&q=sarah`)
- [ ] Saved-view dropdown on the student table — admin can save the current filter combo as a named view (stored in `sys_settings` per user)
- [ ] Mobile QA at 375px: list views collapse to card list; profile tabs scroll horizontally
- [ ] Lighthouse on `/students` (logged-in screenshot via authenticated test) ≥ 90 performance, ≥ 95 accessibility
- [ ] `scripts/check-system-isolation.sh` still passes

### Quality
- [ ] Feature tests for every endpoint (success, validation failure, permission denial)
- [ ] Unit tests for `StudentLifecycle`, `FamilyDiscountResolver`, `TeacherAvailabilityResolver`
- [ ] Playwright covers the 7 acceptance flows below
- [ ] Coverage on services / models in this sprint ≥ 90%

### Acceptance flows (Playwright)

1. **Create teacher** — admin invites teacher (already tested in SYS-02) → fills out qualifications, per-minute rates, availability — appears in teacher list as Active.
2. **Approve teacher leave** — teacher submits leave request → admin sees pending request on `/teachers/leave` → approves → teacher gets internal notification.
3. **Create student manually** — admin fills full form → student lands on list as `Trial`. Required fields validated client + server.
4. **Lifecycle: Trial → Active → Paused → Active** — clicking the disallowed transitions raises a tooltip; allowed clicks open a confirm dialog and advance state. Timeline entries appear for each.
5. **Lifecycle: Active → Cancelled** — must pick a reason; otherwise submit disabled. Cancellation note saved, sessions stay in DB but flagged.
6. **Family link** — open student A → "Add sibling" → search-pick student B → set discount 20% → both profiles now show the link + discount; removing it removes from both.
7. **Filters + URL state** — apply status=Active + teacher=Sh. Hassan + q="sarah" → URL updates → reload → filters preserved → empty state if no match.

---

## Story breakdown

### S3-01 — Migrations  *(1 day)*

Eight new migrations, all dated after SYS-02's `2026_06_15_*` block. Files prefixed `2026_06_29_*` (start of week 5 if SYS-01 ran weeks 1–2 and SYS-02 ran weeks 3–4).

**`2026_06_29_000001_extend_courses_for_system.php`**

```php
Schema::table('courses', function (Blueprint $t) {
    // System-side flag — site keeps using its own visibility logic.
    $t->boolean('is_active_for_system')->default(true)->after('slug');
    $t->index(['is_active_for_system']);
});
```

We don't add price columns to `courses` — pricing is per-student per Module 6. Course descriptions stay site-owned.

**`2026_06_29_000002_create_sys_teachers_table.php`**

```php
Schema::create('sys_teachers', function (Blueprint $t) {
    $t->id();
    $t->foreignId('user_id')->unique()->constrained('users')->restrictOnDelete();
    $t->text('qualifications')->nullable();
    $t->json('teachable_course_ids')->nullable();          // array of course IDs they're approved to teach
    $t->enum('payment_method', ['vodafone_cash', 'instapay', 'wallet_other'])->default('vodafone_cash');
    $t->string('payment_account_details')->nullable();     // ENCRYPTED via cast
    $t->unsignedInteger('per_minute_rate_30')->default(0); // EGP minor (piasters)
    $t->unsignedInteger('per_minute_rate_45')->default(0);
    $t->unsignedInteger('per_minute_rate_60')->default(0);
    $t->foreignId('whatsapp_group_id')->nullable();        // FK added in SYS-07
    $t->boolean('is_active')->default(true);
    $t->softDeletes();
    $t->timestamps();
    $t->index(['is_active']);
});
```

**`2026_06_29_000003_create_sys_teacher_availability_table.php`**

```php
Schema::create('sys_teacher_availability', function (Blueprint $t) {
    $t->id();
    $t->foreignId('teacher_id')->constrained('sys_teachers')->cascadeOnDelete();
    $t->unsignedTinyInteger('day_of_week');                // 0=Sun, 6=Sat
    $t->time('start_time');
    $t->time('end_time');
    $t->string('timezone', 64)->default('Africa/Cairo');
    $t->timestamps();
    $t->index(['teacher_id', 'day_of_week']);
});
```

**`2026_06_29_000004_create_sys_teacher_leaves_table.php`**

```php
Schema::create('sys_teacher_leaves', function (Blueprint $t) {
    $t->id();
    $t->foreignId('teacher_id')->constrained('sys_teachers')->cascadeOnDelete();
    $t->date('start_date');
    $t->date('end_date');
    $t->string('reason', 500);
    $t->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
    $t->foreignId('reviewed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
    $t->text('review_note')->nullable();
    $t->timestamp('reviewed_at')->nullable();
    $t->timestamps();
    $t->index(['teacher_id', 'status']);
    $t->index(['start_date', 'end_date']);
});
```

**`2026_06_29_000005_create_sys_teacher_notes_table.php`**

```php
Schema::create('sys_teacher_notes', function (Blueprint $t) {
    $t->id();
    $t->foreignId('teacher_id')->constrained('sys_teachers')->cascadeOnDelete();
    $t->foreignId('author_user_id')->constrained('users')->restrictOnDelete();
    $t->text('body');
    $t->softDeletes();
    $t->timestamps();
    $t->index(['teacher_id', 'created_at']);
});
```

**`2026_06_29_000006_create_sys_students_table.php`**

The biggest table in the system. Each block of fields maps to an explicit module 3 requirement.

```php
Schema::create('sys_students', function (Blueprint $t) {
    $t->id();
    // Identity
    $t->string('name');
    $t->string('email')->nullable();
    $t->string('phone', 32)->nullable();
    $t->string('whatsapp', 32)->nullable();
    $t->string('country', 2);                                // ISO-3166-1 alpha-2
    $t->string('timezone', 64);
    $t->enum('age_category', ['child', 'adult']);
    // Parent / guardian (kids only)
    $t->string('parent_name')->nullable();
    $t->string('parent_phone', 32)->nullable();
    $t->string('parent_whatsapp', 32)->nullable();
    $t->string('parent_email')->nullable();
    // Course + teacher
    $t->foreignId('course_id')->nullable()->constrained('courses')->nullOnDelete();
    $t->foreignId('assigned_teacher_id')->nullable()->constrained('sys_teachers')->nullOnDelete();
    // Pricing snapshot (final source of truth for a student; details in Module 6 / SYS-05)
    $t->unsignedSmallInteger('sessions_per_month')->default(0);
    $t->unsignedTinyInteger('session_duration_min')->default(30);  // 30 / 45 / 60
    $t->char('currency', 3)->default('USD');
    $t->unsignedInteger('monthly_price_minor')->default(0);
    $t->unsignedTinyInteger('custom_discount_pct')->default(0);
    // Wallet snapshot (real ledger lives in sys_wallet_transactions; SYS-05)
    $t->bigInteger('wallet_balance_minor')->default(0);
    $t->char('wallet_currency', 3)->default('USD');
    // Lifecycle
    $t->enum('status', ['trial', 'active', 'paused', 'suspended', 'cancelled'])->default('trial');
    $t->timestamp('enrolled_at')->nullable();                       // first paid invoice — set in SYS-05
    $t->timestamp('paused_at')->nullable();
    $t->timestamp('suspended_at')->nullable();
    $t->timestamp('cancelled_at')->nullable();
    $t->string('cancellation_reason')->nullable();
    $t->text('cancellation_notes')->nullable();
    // Source attribution (for analytics later)
    $t->enum('source', ['lead', 'manual', 'referral', 'trial_booking'])->default('manual');
    $t->foreignId('lead_id')->nullable();                           // FK added in SYS-07
    $t->foreignId('trial_booking_id')->nullable()->constrained('trial_bookings')->nullOnDelete();
    // Communications
    $t->foreignId('whatsapp_group_id')->nullable();                 // FK added in SYS-07
    $t->softDeletes();
    $t->timestamps();
    // Indexes (cover the common list filters)
    $t->index(['status', 'assigned_teacher_id']);
    $t->index(['status', 'course_id']);
    $t->index(['status', 'country']);
    $t->fullText(['name', 'email', 'phone', 'whatsapp', 'parent_name', 'parent_phone']);
});
```

**`2026_06_29_000007_create_sys_student_timeline_table.php`**

```php
Schema::create('sys_student_timeline', function (Blueprint $t) {
    $t->id();
    $t->foreignId('student_id')->constrained('sys_students')->cascadeOnDelete();
    $t->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
    $t->string('event_type', 60);                          // 'created' / 'status_changed' / 'teacher_changed' / 'price_changed' / 'schedule_changed' / 'note_added'
    $t->json('payload')->nullable();                       // {old:…, new:…, reason:…}
    $t->timestamps();
    $t->index(['student_id', 'created_at']);
});
```

**`2026_06_29_000008_create_sys_student_family_links_table.php`**

```php
Schema::create('sys_student_family_links', function (Blueprint $t) {
    $t->id();
    $t->foreignId('student_id')->constrained('sys_students')->cascadeOnDelete();
    $t->foreignId('sibling_student_id')->constrained('sys_students')->cascadeOnDelete();
    $t->unsignedTinyInteger('discount_pct')->default(0);
    $t->timestamps();
    $t->unique(['student_id', 'sibling_student_id']);
});
```

We store both directions of the link so a SQL query for "siblings of student X" doesn't need a UNION. The `FamilyLinkService` (S3-10) keeps both rows in sync.

**`2026_06_29_000009_create_sys_student_notes_table.php`**

```php
Schema::create('sys_student_notes', function (Blueprint $t) {
    $t->id();
    $t->foreignId('student_id')->constrained('sys_students')->cascadeOnDelete();
    $t->foreignId('author_user_id')->constrained('users')->restrictOnDelete();
    $t->text('body');
    $t->softDeletes();
    $t->timestamps();
    $t->index(['student_id', 'created_at']);
});
```

#### New permissions

Append to `PermissionRegistry::GROUPS`:

```php
'students_notes' => ['view', 'create', 'edit_own', 'edit_any', 'delete_own', 'delete_any'],
'teachers_notes' => ['view', 'create', 'edit_own', 'edit_any', 'delete_own', 'delete_any'],
```

These are needed for the policy (admin can edit any note, supervisors can only edit their own). Run `php artisan system:perms:export` after the change to regenerate the frontend `Permission` type.

---

### S3-02 — Models, factories, policies, resources  *(1 day)*

#### Models

**`app/Models/System/Teacher.php`**

```php
namespace App\Models\System;

use Illuminate\Database\Eloquent\{Model, SoftDeletes, Casts\Attribute};
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Teacher extends Model
{
    use SoftDeletes, LogsActivity;
    protected $table = 'sys_teachers';
    protected $guarded = [];
    protected $casts = [
        'teachable_course_ids'    => 'array',
        'payment_account_details' => 'encrypted',
        'is_active'               => 'boolean',
    ];

    public function user()         { return $this->belongsTo(\App\Models\User::class); }
    public function students()     { return $this->hasMany(Student::class, 'assigned_teacher_id'); }
    public function availability() { return $this->hasMany(TeacherAvailability::class)->orderBy('day_of_week')->orderBy('start_time'); }
    public function leaves()       { return $this->hasMany(TeacherLeave::class); }
    public function notes()        { return $this->hasMany(TeacherNote::class)->latest(); }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['qualifications','payment_method','per_minute_rate_30','per_minute_rate_45','per_minute_rate_60','is_active'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
```

**`app/Models/System/Student.php`** — same shape. `$casts` includes:

```php
'wallet_balance_minor'       => 'integer',
'monthly_price_minor'        => 'integer',
'custom_discount_pct'        => 'integer',
'enrolled_at'                => 'datetime',
'paused_at'                  => 'datetime',
'suspended_at'               => 'datetime',
'cancelled_at'               => 'datetime',
```

Relationships:

```php
public function course()           { return $this->belongsTo(\App\Models\Course::class); }
public function assignedTeacher()  { return $this->belongsTo(Teacher::class, 'assigned_teacher_id'); }
public function timeline()         { return $this->hasMany(StudentTimelineEntry::class)->latest(); }
public function notes()            { return $this->hasMany(StudentNote::class)->latest(); }
public function siblings()
{
    return $this->belongsToMany(Student::class, 'sys_student_family_links', 'student_id', 'sibling_student_id')
                ->withPivot('discount_pct')->withTimestamps();
}
```

ActivityLog watched fields: `name, email, phone, whatsapp, country, timezone, age_category, course_id, assigned_teacher_id, sessions_per_month, session_duration_min, monthly_price_minor, currency, custom_discount_pct, status, whatsapp_group_id`.

#### Factories

`database/factories/System/TeacherFactory.php`, `StudentFactory.php`, `TeacherAvailabilityFactory.php`, `TeacherLeaveFactory.php`. Realistic defaults — e.g. `Student` factory creates an `adult`, `Active` student in USD, 8 sessions/month, 30 min, no discount.

`SystemDemoSeeder` extends what SYS-02 created:

- 4 teachers (one per course), each with availability on weekdays 14:00–22:00 Africa/Cairo.
- 25 students mixed across statuses (15 active, 4 trial, 2 paused, 2 suspended, 2 cancelled), spread across the four courses.
- 3 family-link pairs.
- A few internal notes per teacher and student.
- One pending teacher leave for next week.

#### Policies

`app/Policies/System/StudentPolicy.php`:

```php
public function viewAny(User $user)  { return $user->can('students.view'); }
public function view(User $user, Student $s)
{
    if ($user->role === 'admin') return true;
    if ($user->role === 'teacher') {
        return $s->assigned_teacher_id === $user->teacher?->id;
    }
    return $user->can('students.view');
}
public function create(User $user) { return $user->can('students.create'); }
public function update(User $user, Student $s)
{
    return $user->can('students.edit') && $this->view($user, $s);
}
public function changeStatus(User $user, Student $s)
{
    return $user->can('students.change_status') && $this->view($user, $s);
}
```

`TeacherPolicy` mirrors with teacher-self-view (a teacher can view only own profile). `StudentNotePolicy` and `TeacherNotePolicy` enforce edit_own / edit_any. `TeacherLeavePolicy` allows teachers to create/view own leaves and admins to approve/reject.

Register all in `app/Providers/AuthServiceProvider.php`.

#### Resources (API responses)

`StudentResource` (list-row shape): id, name, country, age_category, course (id+name), assigned_teacher (id+name), status, monthly_price (formatted minor + currency), sessions_per_month, session_duration_min, whatsapp_group_id, has_active_session_today (computed; SYS-04 fills it in).

`StudentDetailResource` extends with: full identity block, parent block, source/lead/trial_booking, wallet, timeline (paginated), notes (paginated), siblings.

`TeacherResource` and `TeacherDetailResource` follow the same split.

`CourseResource` (system view): id, name, slug, description (short), is_active_for_system, active_student_count.

---

### S3-03 — Courses management  *(0.5 day)*

Course content already lives in `courses` (site-owned). The system surface adds a flag + a count + an "Edit" entry that updates only the system flag plus a system-specific `description_for_admins` JSON column (admins want a private note on which teachers can teach which course).

Wait — that JSON column was *not* added in S3-01. Let me note: if we want admin notes per course, we should add a separate `sys_course_meta` table. Decision for v1: skip the per-course admin notes; just use the existing course. If owner needs it later, one-line migration.

**`/courses` page:**

```
┌─────────────────────────────────────────────────────────────────┐
│ Courses                                                         │
│ The catalog students enroll in. Edit course content on the site.│
├─────────────────────────────────────────────────────────────────┤
│  Quran Recitation & Tajweed              42 active   ●  [⚙]    │
│  Quran Memorization (Hifz)               18 active   ●  [⚙]    │
│  Arabic Language                         15 active   ●  [⚙]    │
│  Islamic Studies / Ijazah                 6 active   ●  [⚙]    │
└─────────────────────────────────────────────────────────────────┘
```

`[⚙]` opens a Sheet with one toggle: **Active for new enrollments**. Tooltip: "Hides this course in the new-student form. Existing students keep their course."

Server endpoints: `GET /api/system/courses`, `PATCH /api/system/courses/{id}`. The PATCH only touches `is_active_for_system`; site-owned fields are read-only here.

A single permission `courses.edit` is required for the toggle. `courses.view` for the list.

---

### S3-04 — Teacher list + create + edit + deactivate  *(2 days)*

#### Endpoints

| Method | Path | Permission | Purpose |
|---|---|---|---|
| GET | `/api/system/teachers` | `teachers.view` | Paginated list with `filter[is_active]`, `filter[course]`, `q`, `sort` |
| GET | `/api/system/teachers/{id}` | `teachers.view` (+policy) | Detail |
| POST | `/api/system/teachers` | `users.invite` | Create — same flow as SYS-02 invite + immediately fills out the teacher fields |
| PATCH | `/api/system/teachers/{id}` | `teachers.edit` | Update non-auth fields (qualifications, rates, courses, payment) |
| POST | `/api/system/teachers/{id}/activate` | `teachers.edit` | |
| POST | `/api/system/teachers/{id}/deactivate` | `teachers.edit` | Refuses if any students still assigned (must reassign first) |

Why is "create" gated on `users.invite`? Because creating a teacher in SYS-03 layers two concerns: a new `users` row (auth) and a new `sys_teachers` row (profile). The endpoint reuses `UserController::invite` internally for the user, then upserts the teacher row. UI flow:

- "Add teacher" sheet asks for: name, email, phone, WhatsApp, qualifications, courses they can teach, rates (3 numbers), payment method + account details.
- Submit → backend creates user (sends invite email) + teacher row. Until the teacher resets their password and logs in, their `users.last_login_at` is null.
- Profile page shows a yellow banner: "Invite sent on Jun 14. Awaiting first sign-in." with a "Resend invite" action.

#### Teacher list

`/teachers/page.tsx`

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Teachers                                              [ + Add teacher ]  │
│ 4 active · 1 inactive                                                    │
├──────────────────────────────────────────────────────────────────────────┤
│  Filters: [Status ▾] [Course ▾]  [ Search teachers …          ⌘K ]       │
├──────────────────────────────────────────────────────────────────────────┤
│  Name              Courses                  Students  Rate (60m) Status  │
│  Sh. Hassan        Tajweed, Hifz             18        EGP 300   ● Acti.  │
│  Sh. Omar          Arabic, Islamic Studies   12        EGP 280   ● Acti.  │
│  Sh. Aisha (♀)     Tajweed                    9        EGP 320   ● Acti.  │
│  Sh. Mohammed      Hifz                       3        EGP 250   ● Inact. │
└──────────────────────────────────────────────────────────────────────────┘
```

DataTable wired via `useTeachers({ status, course, q, sort })`. URL-synchronized filters using `nuqs` or a small `useSearchParams` helper.

#### Teacher detail

`/teachers/[id]/page.tsx` is a full-page profile with:

```
[← Teachers]   Sh. Hassan                              ● Active  [⋮ Actions]
                Tajweed, Hifz · Egypt · joined Apr 2026
─────────────────────────────────────────────────────────────────────────
[ Profile ] [ Availability ] [ Leave ] [ Students (18) ] [ Schedule ] [ Reports ] [ Salary ] [ Notes (3) ]
```

- **Profile tab**: editable form (name + contact + qualifications + rates + courses + payment) using react-hook-form. Save persists, audit-logs.
- **Availability tab**: rendered in S3-05.
- **Leave tab**: rendered in S3-06.
- **Students tab**: read-only DataTable of assigned students with link out.
- **Schedule, Reports, Salary tabs**: each renders an `EmptyState` saying "Wired up in SYS-04 / SYS-04 / SYS-06". The tab routes still exist so deep links don't 404 later.
- **Notes tab**: rendered in S3-11.

`[⋮ Actions]` menu: **Resend invite** · **Deactivate** · **Delete** (admin only, requires no assigned students).

---

### S3-05 — Teacher availability  *(1 day)*

Module 4 says "Set availability (weekly recurring)". UX needs to be quick — operators set this once, rarely edit.

**Component:** `<AvailabilityPicker teacher={teacher} />` — a 7×24 grid (rows = days, columns = hours). Click-and-drag to paint a green block. Painted blocks are availability windows; everything else is unavailable.

Internal state is normalized into `(day_of_week, start_time, end_time)` rows on save.

Server endpoint:

```
PUT /api/system/teachers/{id}/availability
body: { availability: [{ day_of_week: 1, start_time: '14:00', end_time: '22:00' }, …], timezone: 'Africa/Cairo' }
```

The handler `replace`s the teacher's availability rows in a single transaction. Audit-logged via `teachers.availability_updated`.

A `TeacherAvailabilityResolver` service (also used by SYS-04 scheduling) returns: "is teacher T available at UTC datetime D for N minutes?". Pure function, unit-tested.

---

### S3-06 — Teacher leave  *(1 day)*

**Endpoints:**

| Method | Path | Permission |
|---|---|---|
| GET | `/api/system/teacher-leaves` | `teachers.view` (returns own leaves for teachers, all for admins/supervisors) |
| POST | `/api/system/teacher-leaves` | self (any teacher) |
| POST | `/api/system/teacher-leaves/{id}/approve` | `teachers.approve_leave` |
| POST | `/api/system/teacher-leaves/{id}/reject` | `teachers.approve_leave` |

When approved, the listener `OnTeacherLeaveApproved` fires the system event `TeacherLeaveApproved`. SYS-04 will subscribe to it and auto-flag affected sessions; SYS-07 will subscribe to it and notify admins. In SYS-03 the listener creates an internal notification for the requesting teacher ("Your leave has been approved.") via `NotificationService::push` from SYS-02.

**`/teachers/leave/page.tsx`** is two views in one: a calendar (FullCalendar — installed in SYS-01 prereqs but actually depended on first here, install during S3-06 if not present) at the top, a table below.

```
┌─────────────────────────────────────────────────────────────────┐
│ Teacher leave                                                   │
│ Approve, reject, and view all teacher time off.                 │
├─────────────────────────────────────────────────────────────────┤
│ [ Calendar ]                                            [ Table ]│
│ ─────────────────────────────                                    │
│ June 2026                                                        │
│ Sun  Mon  Tue  Wed  Thu  Fri  Sat                                │
│              ┌─Sh. Omar─┐                                        │
│              │  Approved│                                        │
│              └──────────┘                                        │
│  ┌─Sh. Hassan─pending─┐                                          │
└─────────────────────────────────────────────────────────────────┘
```

Pending leaves get a banner above the calendar listing them. Clicking a leave opens a Sheet with details + approve/reject buttons + an optional review note.

Teachers' own dashboard (SYS-04+) will surface a "Request leave" button — the `LeaveRequestForm.tsx` component is built here, used in S3-06 (admin-side preview) and re-used in SYS-04's teacher dashboard.

---

### S3-07 — Student list + create + edit  *(2 days)*

#### List endpoint

`GET /api/system/students` supports:

- `filter[status]=active,trial`
- `filter[course_id]=3`
- `filter[assigned_teacher_id]=12`
- `filter[country]=US,GB,CA`
- `filter[age_category]=child`
- `filter[no_whatsapp]=1` (alert support)
- `q=sarah` (full-text on name/email/phone/parent)
- `sort=-enrolled_at` (default `-created_at`)
- `include=course,assignedTeacher,siblings.assignedTeacher`

Implementation uses `spatie/laravel-query-builder`; one trait, no per-controller filter logic.

#### List page

`/students/page.tsx`

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Students                                                  [+ Add student]    │
│ 124 active · 18 trial · 3 paused · 2 suspended · 4 cancelled               │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Status ▾] [Course ▾] [Teacher ▾] [Country ▾] [Age ▾] [Search… ⌘K] [Saved▾] │
├─────────────────────────────────────────────────────────────────────────────┤
│ ☐ Name           Course    Teacher       Sessions  Price       Status       │
│ ☐ Sarah Ahmed    Tajweed   Sh. Hassan    8 × 30m   USD 25/mo   ● Active     │
│ ☐ Yusuf Khan     Hifz      Sh. Aisha     12 × 60m  USD 60/mo   ● Trial      │
│ ☐ Aisha Rahman   Arabic    Sh. Omar      4 × 45m   GBP 30/mo   ● Paused     │
└─────────────────────────────────────────────────────────────────────────────┘
[1–25 of 151]                                            [‹] [1] [2] [3] [›]
```

Bulk actions (when rows selected): **Pause**, **Resume**, **Cancel**, **Export selected**, **Apply note**, **Send WhatsApp message** (Send WhatsApp routes to SYS-07's wassender once available; the button stays disabled with a tooltip until then).

#### Create form

`/students/new/page.tsx` is a full-page form (lots of fields). Sectioned with `<Fieldset>` semantics:

1. **Identity** — name, email, phone, whatsapp, country, timezone, age category. Conditional render: if age = `child`, the **Parent / guardian** section appears.
2. **Parent / guardian** (kids only) — name, phone, whatsapp, email.
3. **Enrollment** — course, assigned teacher (filtered by `teachable_course_ids`), sessions per month, session duration radio (30/45/60), currency, monthly price (input shows "≈ USD 25 = EGP 1,225 at today's rate" via a `RateHint` if currency≠EGP — rate from `sys_settings`, defaults to 0 if not configured).
4. **Custom discount** — number 0–100 (a banner notes "Family discounts apply automatically once a sibling is linked").
5. **WhatsApp group** — invite link (URL field), status select.
6. **Source** — radio: Manual, Referral, Trial booking. Selecting "Trial booking" shows a combobox of recent `trial_bookings` to attach.
7. **Internal note** (optional) — free text; saved as the first `sys_student_notes` row if filled.

Submit → POST `/api/system/students`. The handler:

1. Validates (every field per spec; phone in E.164; email if present uniques against existing students; currency in supported list).
2. Creates the student in transaction.
3. Writes `sys_student_timeline` row `event_type=created`.
4. If a note was provided → creates a `sys_student_notes` row.
5. If source = `trial_booking` → updates `trial_bookings` row to mark "converted" (a column added to `trial_bookings` in this sprint via `2026_06_29_000010_add_converted_to_trial_bookings.php`, also documented as a cross-boundary exception).
6. Returns the new student.

Frontend redirects to `/students/{id}`.

#### Edit

Reuses the same form on `/students/[id]` Profile tab. Submit triggers `PATCH /api/system/students/{id}` with only the changed fields. Watched-field changes go through the timeline service (see S3-08 below) — a price change writes a timeline entry, but a name typo does not.

---

### S3-08 — Student profile page + lifecycle state machine  *(2 days)*

#### Layout

```
[← Students]  Sarah Ahmed                                 ● Active  [⋮ Actions]
              USD 25/mo · 8 × 30m · Tajweed · Sh. Hassan · USA
─────────────────────────────────────────────────────────────────────────────
[ Profile ] [ Sessions ] [ Reports ] [ Invoices ] [ Wallet ] [ Family ] [ Timeline ] [ Notes (2) ]

  ┌───────────────────────────────────────────────────────────────┐
  │ Lifecycle                                                     │
  │   ● Active   →  [Pause]  [Suspend]  [Cancel]                  │
  │   Trial since Mar 12 · Active since Apr 1 · 9 weeks active    │
  └───────────────────────────────────────────────────────────────┘

  (rest of tab content here)
```

The status-control row above the tabs is always visible. Disallowed transitions are hidden, not greyed (less visual noise).

#### State machine

`App\Services\System\StudentLifecycle`:

```php
class StudentLifecycle
{
    public const ALLOWED = [
        'trial'     => ['active', 'cancelled'],
        'active'    => ['paused', 'suspended', 'cancelled'],
        'paused'    => ['active', 'cancelled'],
        'suspended' => ['active', 'cancelled'],
        'cancelled' => [],
    ];

    public function can(Student $s, string $next): bool
    {
        return in_array($next, self::ALLOWED[$s->status] ?? [], true);
    }

    public function transition(Student $s, string $next, array $context = []): Student
    {
        abort_unless($this->can($s, $next), 422, "Invalid transition from {$s->status} to {$next}");
        DB::transaction(function () use ($s, $next, $context) {
            $old = $s->status;
            $s->status = $next;
            $s->{$next.'_at'} ??= now();
            if ($next === 'cancelled') {
                $s->cancellation_reason = $context['reason'] ?? null;
                $s->cancellation_notes  = $context['notes'] ?? null;
            }
            $s->save();
            StudentTimelineEntry::create([
                'student_id'    => $s->id,
                'actor_user_id' => auth()->id(),
                'event_type'    => 'status_changed',
                'payload'       => ['old' => $old, 'new' => $next, 'context' => $context],
            ]);
            event(new StudentStatusChanged($s, $old, $next));
        });
        return $s->fresh();
    }
}
```

Endpoint: `POST /api/system/students/{id}/transition` body `{ to: 'paused', reason?: '…', notes?: '…' }`.

On `cancel`: the form modal **requires** a reason picked from `Module 3` list — Price · Schedule · Teacher · Personal · Quality · Other. "Other" enables a free-text notes field (max 500 chars).

Side effects to keep in mind for later sprints (each writes the side effect itself when it lands):

| Transition | Side effects (where) |
|---|---|
| `trial → active` | Triggered by SYS-05's first-paid-invoice flow, not by direct UI. Sessions only start after payment confirmed (Module 11). |
| `active → paused` | SYS-05 auto-stops billing for next month. SYS-04 marks future sessions as cancelled with reason "student paused". |
| `paused → active` | SYS-05 generates a pro-rata invoice. Status flips to `active` only **after** payment — direct UI on this transition opens a dialog explaining "Generate invoice now? Status will flip when paid." |
| `* → suspended` | Set by the `AutoSuspendNonPayers` cron (SYS-05). Direct manual transition is allowed for admins; UI requires confirm. |
| `* → cancelled` | Locks the student from any further billing/scheduling. |

In SYS-03 the manual UI works for admin testing. The "trigger by invoice" flows are stubs that throw a TODO.

#### Timeline tab

Renders `sys_student_timeline` events with friendly icons + diff:

```
🟢 Status changed                                       Sarah · 2 hours ago
   Active → Paused. Reason: family travel.

✏️ Price changed                                        Sarah · 4 days ago
   USD 25/month → USD 30/month.

👤 Teacher reassigned                                   Sarah · 2 weeks ago
   Sh. Hassan → Sh. Aisha.

🌱 Student created                                      Sarah · Mar 12, 2026
   Source: Manual.
```

Pulls 25 entries at a time, paginated. Service `StudentTimelineRecorder` is called from `StudentLifecycle::transition` and from the `Student@updated` model event, which inspects watched fields and writes appropriate entries.

#### Audit-log integration

Status transitions also write to `sys_audit_logs` (via the `AuditLog` helper). The student timeline = student-facing log (informational), the audit log = admin-facing log (forensic). Same data, different audience. SYS-08's audit log UI cross-links between them.

---

### S3-09 — Family / sibling linking  *(1 day)*

#### Service

`App\Services\System\FamilyLinkService`:

```php
public function link(Student $a, Student $b, int $discountPct): void
{
    abort_if($a->id === $b->id, 422, 'Cannot link a student to themselves.');
    abort_if($a->siblings()->where('sibling_student_id', $b->id)->exists(), 422, 'Already linked.');

    DB::transaction(function () use ($a, $b, $discountPct) {
        StudentFamilyLink::create([
            'student_id' => $a->id, 'sibling_student_id' => $b->id, 'discount_pct' => $discountPct,
        ]);
        StudentFamilyLink::create([
            'student_id' => $b->id, 'sibling_student_id' => $a->id, 'discount_pct' => $discountPct,
        ]);
        // Timeline entries on both
        $this->timelineEntry($a, $b, 'family_linked', ['discount_pct' => $discountPct]);
        $this->timelineEntry($b, $a, 'family_linked', ['discount_pct' => $discountPct]);
    });
}

public function unlink(Student $a, Student $b): void { /* mirror */ }
```

Note: the discount stored on the link is a **policy hint**, not a price override. The actual price math (Module 6, SYS-05) reads it via `FamilyDiscountResolver::for(Student $s)` which returns the highest applicable discount (covers the case of triplets with different individual discounts on each link — usually they're all set to the same value).

#### UI

On the student profile **Family** tab:

```
┌──────────────────────────────────────────────────────────────────┐
│ Family                                       [+ Add sibling]     │
│ Siblings get 20% discount automatically applied to invoices.     │
├──────────────────────────────────────────────────────────────────┤
│ Yusuf Ahmed (Hifz · Sh. Aisha)        20% discount    [Remove]   │
│ Maryam Ahmed (Tajweed · Sh. Hassan)   20% discount    [Remove]   │
└──────────────────────────────────────────────────────────────────┘
```

`+ Add sibling` opens a Sheet:

- Combobox: "Search students by name or phone…" (debounced query, returns top 10 matches; excludes self + already-linked).
- Discount %: number 0–100, default value pulled from `sys_settings` key `family_default_discount_pct`.
- Confirm.

Endpoints:

```
POST   /api/system/students/{id}/siblings  body: { sibling_id, discount_pct }
DELETE /api/system/students/{id}/siblings/{siblingId}
```

Permission: `students.edit`. Audit log + timeline both record the action.

---

### S3-10 — Internal notes  *(0.5 day)*

Generic note system used for both students and teachers. Same shape, same endpoints (different paths and resources).

```
GET    /api/system/students/{id}/notes      perm: students.view
POST   /api/system/students/{id}/notes      perm: students_notes.create
PATCH  /api/system/student-notes/{id}       policy: edit_own / edit_any
DELETE /api/system/student-notes/{id}       policy: delete_own / delete_any
```

Same for teachers under `/teacher-notes`. Authors are visible (avatar + name + role badge). Each note shows time-ago and an edit-history hint if it's been updated.

Notes are **soft-deleted**. An admin can see deleted notes via `?include_trashed=1` (admin only). Useful for forensic review.

The "Notes" tab on each profile uses a simple list view + a "+ Add note" inline composer pinned to the top.

---

### S3-11 — Filters, search, saved views  *(1 day)*

Two reusable primitives added in this sprint and used throughout SYS-04+:

**`<FilterBar>`** — already scaffolded in SYS-01. SYS-03 fills it with concrete filter components: `<StatusFilter>`, `<CourseFilter>`, `<TeacherFilter>`, `<CountryFilter>`, `<AgeCategoryFilter>`. Each binds its value to a URL param via `nuqs`.

**`<SavedViewsDropdown>`** — new in SYS-03.

```
[ Saved views ▾ ]
  ◇ All active students
  ◇ Trial follow-ups
  ◇ Egypt students
  ─────────────────
  [+ Save current view]
  [⚙ Manage views]
```

Saved views are stored per-user in `sys_settings` with key `saved_views.students.{user_id}` (single JSON blob — easier than a dedicated table). Each view records `name`, `params` (URL search-params snapshot). Admins can mark a view as shared (visible to all supervisors) — stored under `saved_views.students.global`.

API:

```
GET  /api/system/saved-views?context=students
POST /api/system/saved-views    body: { context, name, params, shared? }
DELETE /api/system/saved-views/{id}
```

Same primitive is used on the teachers list (context = `teachers`), session-reports list (later), invoices list (later).

---

### S3-12 — Tests  *(1.5 days)*

#### Feature tests

`tests/Feature/System/Students/` — `IndexFilteringTest`, `CreateStudentTest`, `UpdateStudentTest`, `TransitionTest` (one test per transition + invalid transitions), `FamilyLinkTest`, `NotesTest`.

`tests/Feature/System/Teachers/` — `CreateTeacherTest`, `AvailabilityTest`, `LeaveApprovalTest`, `DeactivateWithStudentsTest` (must fail when assigned students > 0).

`tests/Feature/System/Courses/` — `IndexTest`, `ToggleActiveTest`.

`tests/Feature/System/SavedViews/` — `CreateAndListTest`, `SharedViewVisibilityTest`.

#### Unit tests

`tests/Unit/System/StudentLifecycleTest.php` — exhaustively covers the 5×5 transition matrix.

`tests/Unit/System/FamilyDiscountResolverTest.php` — multi-link scenarios.

`tests/Unit/System/TeacherAvailabilityResolverTest.php` — overlapping windows, timezone math, edge of day.

#### Playwright

`frontend/e2e/system/students.spec.ts` covers the 7 acceptance flows above + a smoke test for the timeline rendering and family-link picker.

---

### S3-13 — Deploy + smoke pass  *(0.5 day)*

- Run migrations on staging.
- `php artisan db:seed --class=System\\SystemDemoSeeder` — populates 25 demo students for owner walkthrough.
- Owner walks through:
  - Open `/students` — see 25 students, status counts in header. Filter by `Trial` — 4 rows.
  - Click into Sarah Ahmed → see profile, lifecycle bar, all tabs.
  - Pause Sarah → confirm dialog → status flips, timeline entry appears.
  - Try to "Resume" with the lifecycle button — see the dialog warning that pro-rata invoice will be needed (button disabled with the SYS-05-stub note).
  - Reassign teacher on Sarah → timeline entry records the change.
  - Add a sibling — search for Yusuf, link with 20% discount → both profiles show the link.
  - Open `/teachers` → click into Sh. Hassan → set availability on the grid → save.
  - Open `/teachers/leave` → submit a leave request as Sh. Hassan (impersonate or pre-seeded) → log in as admin → approve.
  - Filter students with `q=Aisha`, save the current view as "Aisha shortcuts".
  - Reload the page — saved view appears. Switch to it. Filters restore.
  - Toggle one course inactive on `/courses` → confirm it disappears from the new-student form's course dropdown.
- Confirm `sys_audit_logs` and `sys_activity_log` rows for every action.

---

## Endpoints {#endpoints}

Quick reference for the 14 new endpoints in this sprint (auth flows came in SYS-02).

| Method | Path | Permission | Notes |
|---|---|---|---|
| GET    | `/api/system/courses`                            | `courses.view` | List with active-student count |
| PATCH  | `/api/system/courses/{id}`                       | `courses.edit` | Toggle `is_active_for_system` |
| GET    | `/api/system/teachers`                           | `teachers.view` | Filtered + paginated |
| GET    | `/api/system/teachers/{id}`                      | `teachers.view` (+policy) | Detail |
| POST   | `/api/system/teachers`                           | `users.invite`+`teachers.create` | Create user + teacher |
| PATCH  | `/api/system/teachers/{id}`                      | `teachers.edit` | Profile fields |
| PUT    | `/api/system/teachers/{id}/availability`         | `teachers.edit` | Replace availability set |
| POST   | `/api/system/teachers/{id}/activate`             | `teachers.edit` | |
| POST   | `/api/system/teachers/{id}/deactivate`           | `teachers.edit` | Refuses if students assigned |
| GET    | `/api/system/teacher-leaves`                     | `teachers.view` | Self-scoped for teachers |
| POST   | `/api/system/teacher-leaves`                     | self | Teacher requests |
| POST   | `/api/system/teacher-leaves/{id}/approve`        | `teachers.approve_leave` | |
| POST   | `/api/system/teacher-leaves/{id}/reject`         | `teachers.approve_leave` | |
| GET    | `/api/system/students`                           | `students.view` | All filters |
| GET    | `/api/system/students/{id}`                      | `students.view`+policy | Detail (with timeline + notes paginated) |
| POST   | `/api/system/students`                           | `students.create` | Manual create |
| PATCH  | `/api/system/students/{id}`                      | `students.edit` | |
| POST   | `/api/system/students/{id}/transition`           | `students.change_status` | Lifecycle move |
| POST   | `/api/system/students/{id}/siblings`             | `students.edit` | Link |
| DELETE | `/api/system/students/{id}/siblings/{sibling}`   | `students.edit` | Unlink |
| GET    | `/api/system/students/{id}/notes`                | `students.view` | |
| POST   | `/api/system/students/{id}/notes`                | `students_notes.create` | |
| PATCH  | `/api/system/student-notes/{id}`                 | policy | Author or admin |
| DELETE | `/api/system/student-notes/{id}`                 | policy | Soft delete |
| GET    | `/api/system/teachers/{id}/notes`                | `teachers.view` | |
| POST   | `/api/system/teachers/{id}/notes`                | `teachers_notes.create` | |
| PATCH  | `/api/system/teacher-notes/{id}`                 | policy | |
| DELETE | `/api/system/teacher-notes/{id}`                 | policy | |
| GET    | `/api/system/saved-views`                        | (any auth) | `?context=students` etc |
| POST   | `/api/system/saved-views`                        | (any auth) | |
| DELETE | `/api/system/saved-views/{id}`                   | (own or admin) | |

(That's 31 endpoints total — the headline "14" counts the parent resources only. Notes and saved-views are sub-resources.)

---

## File deliverables checklist

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/System/
│   │   │   ├── CourseController.php                      (NEW)
│   │   │   ├── TeacherController.php                     (NEW)
│   │   │   ├── TeacherAvailabilityController.php         (NEW)
│   │   │   ├── TeacherLeaveController.php                (NEW)
│   │   │   ├── TeacherNoteController.php                 (NEW)
│   │   │   ├── StudentController.php                     (NEW)
│   │   │   ├── StudentTransitionController.php           (NEW)
│   │   │   ├── StudentFamilyController.php               (NEW)
│   │   │   ├── StudentNoteController.php                 (NEW)
│   │   │   └── SavedViewController.php                   (NEW)
│   │   ├── Requests/System/
│   │   │   ├── Teacher/{Store,Update,Availability}Request.php
│   │   │   ├── TeacherLeave/{Store,Review}Request.php
│   │   │   ├── Student/{Store,Update,Transition,SiblingLink}Request.php
│   │   │   └── Note/{Store,Update}Request.php
│   │   └── Resources/System/
│   │       ├── CourseResource.php
│   │       ├── TeacherResource.php / TeacherDetailResource.php
│   │       ├── StudentResource.php / StudentDetailResource.php
│   │       ├── StudentTimelineEntryResource.php
│   │       ├── StudentNoteResource.php / TeacherNoteResource.php
│   │       └── TeacherLeaveResource.php
│   ├── Models/System/
│   │   ├── Student.php / StudentTimelineEntry.php / StudentFamilyLink.php / StudentNote.php
│   │   └── Teacher.php / TeacherAvailability.php / TeacherLeave.php / TeacherNote.php
│   ├── Policies/System/
│   │   ├── StudentPolicy.php / StudentNotePolicy.php
│   │   └── TeacherPolicy.php / TeacherNotePolicy.php / TeacherLeavePolicy.php
│   ├── Events/System/
│   │   ├── StudentStatusChanged.php
│   │   └── TeacherLeaveApproved.php
│   ├── Listeners/System/
│   │   ├── RecordStudentTimelineEntry.php
│   │   └── NotifyTeacherOnLeaveApproved.php
│   └── Services/System/
│       ├── StudentLifecycle.php                          (NEW)
│       ├── StudentTimelineRecorder.php                   (NEW)
│       ├── FamilyLinkService.php                         (NEW)
│       ├── FamilyDiscountResolver.php                    (NEW)
│       └── TeacherAvailabilityResolver.php               (NEW)
├── database/migrations/
│   ├── 2026_06_29_000001_extend_courses_for_system.php
│   ├── 2026_06_29_000002_create_sys_teachers_table.php
│   ├── 2026_06_29_000003_create_sys_teacher_availability_table.php
│   ├── 2026_06_29_000004_create_sys_teacher_leaves_table.php
│   ├── 2026_06_29_000005_create_sys_teacher_notes_table.php
│   ├── 2026_06_29_000006_create_sys_students_table.php
│   ├── 2026_06_29_000007_create_sys_student_timeline_table.php
│   ├── 2026_06_29_000008_create_sys_student_family_links_table.php
│   ├── 2026_06_29_000009_create_sys_student_notes_table.php
│   └── 2026_06_29_000010_add_converted_to_trial_bookings.php
├── database/factories/System/
│   ├── TeacherFactory.php
│   ├── TeacherAvailabilityFactory.php
│   ├── TeacherLeaveFactory.php
│   ├── StudentFactory.php
│   └── StudentTimelineEntryFactory.php
└── routes/system.php                                     (UPDATED — adds the 14 endpoint groups)

frontend/
├── src/app/(system)/
│   ├── courses/page.tsx                                  (FILLED IN)
│   ├── teachers/
│   │   ├── page.tsx                                      (FILLED IN)
│   │   ├── new/page.tsx                                  (FILLED IN)
│   │   ├── [id]/page.tsx                                 (FILLED IN — tabs)
│   │   └── leave/page.tsx                                (FILLED IN)
│   └── students/
│       ├── page.tsx                                      (FILLED IN)
│       ├── new/page.tsx                                  (FILLED IN)
│       └── [id]/page.tsx                                 (FILLED IN — tabs)
├── src/components/system/
│   ├── courses/
│   │   ├── CourseTable.tsx                               (NEW)
│   │   └── CourseToggleSheet.tsx                         (NEW)
│   ├── teachers/
│   │   ├── TeacherTable.tsx                              (NEW)
│   │   ├── TeacherForm.tsx                               (NEW)
│   │   ├── AvailabilityPicker.tsx                        (NEW)
│   │   ├── TeacherLeaveCalendar.tsx                      (NEW)
│   │   ├── LeaveRequestForm.tsx                          (NEW)
│   │   ├── ReviewLeaveSheet.tsx                          (NEW)
│   │   └── PerMinuteRateInputs.tsx                       (NEW)
│   ├── students/
│   │   ├── StudentTable.tsx                              (NEW)
│   │   ├── StudentForm.tsx                               (NEW)
│   │   ├── StudentLifecycleBar.tsx                       (NEW)
│   │   ├── StudentStatusBadge.tsx                        (NEW)
│   │   ├── StudentTimeline.tsx                           (NEW)
│   │   ├── FamilyLinkPicker.tsx                          (NEW)
│   │   ├── FamilyTabContent.tsx                          (NEW)
│   │   ├── ParentGuardianFields.tsx                      (NEW)
│   │   └── StudentSourceFields.tsx                       (NEW)
│   ├── notes/
│   │   ├── NotesList.tsx                                 (NEW)
│   │   └── NoteComposer.tsx                              (NEW)
│   └── primitives/
│       ├── SavedViewsDropdown.tsx                        (NEW)
│       ├── StatusFilter.tsx                              (NEW)
│       ├── CourseFilter.tsx                              (NEW)
│       ├── TeacherFilter.tsx                             (NEW)
│       ├── CountryFilter.tsx                             (NEW)
│       └── AgeCategoryFilter.tsx                         (NEW)
├── src/hooks/system/
│   ├── useCourses.ts
│   ├── useTeachers.ts
│   ├── useTeacher.ts
│   ├── useTeacherAvailability.ts
│   ├── useTeacherLeaves.ts
│   ├── useStudents.ts
│   ├── useStudent.ts
│   ├── useStudentTimeline.ts
│   ├── useStudentTransition.ts
│   ├── useFamilyLink.ts
│   ├── useNotes.ts
│   └── useSavedViews.ts
├── src/types/system/
│   ├── student.ts
│   ├── teacher.ts
│   ├── course.ts
│   └── note.ts
└── src/lib/system/
    └── filters.ts                                        (URL-state helpers)

docs/system/sprints/sys-03-students-teachers-courses.md   (THIS FILE)
```

---

## Risks & open questions

- **Existing `trial_bookings` schema collision.** Adding the `converted_to_student_id` column to a site-owned table is a documented exception in [DATABASE.md](../DATABASE.md). It is the only system migration that mutates a site table this sprint. Public site tests for the trial booking endpoint must still pass — verified by running the site's test suite in CI before merging.
- **Currency formatting in lists.** A USD-priced student next to an EGP-priced student in the same list creates visual noise. Decision: render every row in its own currency, color-code currency badges if more than one currency appears in the result set. Re-evaluate in SYS-08 when accounting needs cross-currency aggregation.
- **Teacher payment method "wallet_other".** The owner mentioned Vodafone Cash + Instapay specifically. We allow a generic `wallet_other` enum value with a free-text account-details field for any other provider. If owner needs a fixed list later, update the enum + a one-line migration.
- **Reassign teacher mid-term.** Allowed by Module 3 ("Transfer student between teachers"). The transfer creates a timeline entry but doesn't reschedule sessions automatically — that's a SYS-04 concern. UI shows a warning: "Existing scheduled sessions keep their old teacher until you reschedule them."
- **Status `trial → active`.** Spec says this happens after first invoice payment. In SYS-03 we expose a manual override for admin testing only (audit-logged with `admin_manual_override=true` flag). SYS-05 hooks the Paymob webhook to fire the transition properly.
- **Student WhatsApp group field.** Until SYS-07 introduces `sys_whatsapp_groups`, the `whatsapp_group_id` column is unused — we capture the **invite link as a plain string** in a separate column `whatsapp_group_link` for v1 of this sprint, then migrate to the FK in SYS-07. (Update migration `2026_06_29_000006` to add `whatsapp_group_link VARCHAR(500) NULL` and `whatsapp_group_status ENUM('active','stopped','none') DEFAULT 'none'`. The `whatsapp_group_id` FK column stays nullable.)

---

## Sprint review demo script

(~12 minutes)

1. Open `/students` — show 25 demo students with status counters in header.
2. Apply filters: `Status = Trial` + `Country = US` — 2 rows. Save view as "US trials" → reload → filter restored.
3. Click into a trial student. Show profile tabs. Demo the lifecycle bar: hover "Pause" — disabled tooltip "Trial students cannot be paused". Click "Activate" with the admin override → status flips to Active. Check timeline tab — entry recorded.
4. Edit student price from USD 25 to USD 30. Save. Timeline shows the change. Audit log too.
5. Family tab → "+ Add sibling" → search → pick → 20% discount → confirm. Both profiles now linked. Remove the link → confirm → both clear.
6. Open `/teachers` → Sh. Hassan profile. Availability tab — paint a few green blocks, save. Refresh — they persist.
7. As Sh. Hassan (impersonate via Tinker), submit a leave request for next week. Switch back to admin. Open `/teachers/leave` — see pending leave on calendar + table. Approve. Switch back to teacher account — internal notification appears in the bell.
8. Try to deactivate Sh. Hassan from his profile actions menu — server returns 422 because students are assigned. Reassign all his students to Sh. Aisha first, then deactivate works.
9. Open `/courses` — toggle "Islamic Studies / Ijazah" inactive → open `/students/new` → confirm the course no longer appears in the dropdown.
10. Show `sys_student_timeline`, `sys_audit_logs`, `sys_activity_log` rows in Tinker — every action recorded.
11. Lighthouse on `/students` (logged-in screenshot via authenticated test) — show ≥ 90 perf, ≥ 95 a11y.
12. Confirm public site at `alrayan-academy.com` is unchanged.

---

*Last updated: May 10, 2026*
