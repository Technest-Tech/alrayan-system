# SYS-04 — Scheduling, Sessions, Attendance & Reports

**Modules covered:** 7 (Scheduling), 8 (Attendance), 9 (Session Reports), 19 (Teacher Dashboard — initial)
**Duration:** 2 weeks
**Status:** In progress — implemented 2026-05-10.
**Sprint goal:** every active student has a recurring weekly schedule. Each session has a real Zoom link. Conflicts are detected before they happen. Teachers see Today / Upcoming / Students / Reports on their dashboard, mark attendance, and submit session reports. Admins see a calendar of everything. Makeup sessions follow an approval flow. Teacher leaves auto-flag affected sessions.

> **Prereqs** — SYS-03 has shipped. Students, teachers, courses, and the lifecycle state machine are live. Teacher availability is captured. Teacher leave events are firing.

> **Out of scope** — billing impact of attendance (e.g. did absent sessions count toward sessions/month? — handled in SYS-05). Payroll calculation from attended minutes — handled in SYS-06. WhatsApp / email reminders — handled in SYS-07. Quality scoring from report submission rate — handled in SYS-06.

---

## Definition of Done

### Backend
- [x] Four `sys_*` tables created: `sys_schedule_patterns`, `sys_sessions`, `sys_session_reports`, `sys_makeup_requests`
- [ ] All four tables have factories + the `SystemDemoSeeder` extends to seed: 90 days of past sessions (mixed status), the next 14 days of upcoming sessions, ~25 session reports, 2 pending makeup requests
- [x] Models: `SchedulePattern`, `Session`, `SessionReport`, `MakeupRequest` — each with ActivityLog watched fields
- [x] Policies: `SessionPolicy`, `SessionReportPolicy`, `SchedulePatternPolicy`, `MakeupRequestPolicy` (teachers see only their own; supervisors are perm-gated)
- [x] Zoom Server-to-Server integration via `ZoomClient` service: `createMeeting`, `updateMeeting`, `deleteMeeting` — covered by mocked feature tests; no real network in CI
- [x] `SessionMaterializer` service generates concrete sessions from patterns 14 days ahead (rolling), idempotent
- [x] `ScheduleConflictDetector` service is pure, unit-tested, and the only place conflict logic lives
- [x] Cron entries: materialize sessions nightly (`0 2 * * *`), check missing reports every 15 min, auto-flag sessions on `TeacherLeaveApproved`
- [x] 22 endpoints under `/api/system/` (full table in [#endpoints](#endpoints))
- [x] `TeacherLeaveApproved` listener flips affected `sys_sessions` to status `pending_substitute` and writes a notification to the admin queue
- [x] Internal notification fires when a session report is overdue (>X hours, X from `sys_settings` default 24)
- [x] Every state-change writes audit log + activity log entries (consistent with SYS-03 pattern)

### Frontend
- [x] `/schedule` — full calendar with day / week / month views, filter by status, color by status, SessionDrawer on click
- [x] `/schedule/conflicts` — list of currently-detected conflicts (teacher double-booked OR teacher unavailable for student session)
- [ ] `/students/[id]` Sessions tab — table of past sessions + scheduled next 4 weeks; "Edit schedule" button opens the recurring-pattern builder
- [ ] `/students/[id]` Schedule tab — visual weekly grid of the student's recurring pattern with timezone displayed
- [ ] `/students/[id]` Reports tab — chronological list of session reports, latest first
- [ ] `/teachers/[id]` Schedule tab — teacher's calendar (read-only for non-admins)
- [x] `/attendance` — list view of sessions with bulk-attendance marking
- [x] `/session-reports` — admin-facing list, filters by teacher / student / date / missing
- [x] `/session-reports/[id]` — read-only detail placeholder
- [x] **Teacher dashboard** routes wired up:
  - `/teacher/today` — today's sessions, mark attendance, "Submit report" inline
  - `/teacher/upcoming` — week-ahead view
  - `/teacher/students` — own students table (read-only mostly)
  - `/teacher/reports` — own report history
  - `/teacher/salary` — placeholder, gated to SYS-06
- [x] Calendar component (`<CalendarView>`) is the single canonical component — used in schedule and teacher upcoming views
- [x] Recurring-pattern builder (`<RecurringPatternBuilder>`) supports: pick days of week, time per day, duration, valid-from, live preview of next 4 weeks
- [x] Reschedule sheet shows conflicts inline if any, blocks save unless overridden
- [x] Attendance marker has attended/absent/cancelled states
- [x] Session report form: covered, performance (3-radio), homework, next-session notes; autosave drafts to `localStorage`, submit clears
- [x] Empty states: no sessions today, no conflicts, no reports
- [ ] Mobile QA at 375px: calendar collapses to a single-day list, teacher dashboard works one-handed
- [ ] Lighthouse on `/schedule` and `/teacher/today` ≥ 90 perf, ≥ 95 a11y
- [ ] `scripts/check-system-isolation.sh` still passes

### Quality
- [ ] Feature tests for every endpoint (success, validation, permission denial, conflict detection)
- [ ] Unit tests for `ScheduleConflictDetector`, `SessionMaterializer`, `TimezoneResolver`, `RecurrenceCalculator`
- [ ] Mocked feature tests for `ZoomClient` (no live HTTP)
- [ ] Playwright covers the 8 acceptance flows below
- [ ] Coverage on services / models in this sprint ≥ 90%

### Acceptance flows (Playwright)

1. **Set student schedule** — admin opens student profile → Schedule tab → builds Tue+Thu 18:00 60min Africa/Cairo → save → 14 days of sessions appear in calendar with Zoom links; the student's profile shows the next 4 weeks.
2. **Detect conflict at save time** — admin builds pattern that overlaps another student's session for the same teacher → save shows conflict modal listing the conflicting session → admin can either pick a different time or "save anyway with override" (audit-logged).
3. **Reschedule a single session** — admin clicks a session on the calendar → drawer opens → change time → conflict-free save updates the session + Zoom meeting.
4. **Mark attendance** — teacher opens `/teacher/today` → marks first session "Attended" → second session "Cancelled (student)" → both reflect on `/attendance` immediately.
5. **Submit session report** — teacher clicks "Submit report" on an attended session → fills form → submit → row flips from "report missing" to "submitted"; admin's `/session-reports` list reflects it within a refresh.
6. **Missing-report alert** — Tinker-fast-forward 25h after an attended session with no report → cron runs → admin sees an internal notification, teacher sees a missing-report banner on `/teacher/today`.
7. **Teacher leave auto-flag** — teacher submits leave covering a future session → admin approves → that session's status flips to `pending_substitute` on the calendar (orange) → admin reschedules, status returns to `scheduled`.
8. **Makeup request** — student session was cancelled; teacher requests a makeup with proposed time → admin reviews → approves → a new makeup session row is created with `original_session_id` linked back; both visible on the timeline.

---

## Story breakdown

### S4-01 — Migrations  *(0.5 day)*

Four new migrations, dated `2026_07_13_*` (sprint 5 of system).

**`2026_07_13_000001_create_sys_schedule_patterns_table.php`**

```php
Schema::create('sys_schedule_patterns', function (Blueprint $t) {
    $t->id();
    $t->foreignId('student_id')->constrained('sys_students')->cascadeOnDelete();
    $t->unsignedTinyInteger('day_of_week');                // 0=Sun … 6=Sat
    $t->time('start_time');                                // local time in $timezone
    $t->unsignedSmallInteger('duration_min');              // 30 / 45 / 60
    $t->string('timezone', 64);                            // student's tz at the time of pattern creation
    $t->date('valid_from');                                // inclusive
    $t->date('valid_to')->nullable();                      // inclusive, NULL = open-ended
    $t->foreignId('teacher_id')->nullable()->constrained('sys_teachers')->nullOnDelete();
    $t->softDeletes();
    $t->timestamps();
    $t->index(['student_id', 'valid_from', 'valid_to']);
    $t->index(['teacher_id', 'valid_from', 'valid_to']);
});
```

> **Why store the teacher on the pattern, not just on the student?** Students can transfer mid-term. Patterns from before a transfer keep the old teacher (so the historical schedule stays correct). New patterns reflect the new teacher. The student's `assigned_teacher_id` is the *current* teacher; the pattern's `teacher_id` is what was true when the pattern was authored.

**`2026_07_13_000002_create_sys_sessions_table.php`**

```php
Schema::create('sys_sessions', function (Blueprint $t) {
    $t->id();
    $t->foreignId('student_id')->constrained('sys_students')->cascadeOnDelete();
    $t->foreignId('teacher_id')->constrained('sys_teachers')->cascadeOnDelete();
    $t->foreignId('schedule_pattern_id')->nullable()->constrained('sys_schedule_patterns')->nullOnDelete();
    $t->foreignId('original_session_id')->nullable()->constrained('sys_sessions')->nullOnDelete();
    $t->timestamp('scheduled_start');                      // UTC
    $t->timestamp('scheduled_end');                        // UTC
    $t->unsignedSmallInteger('duration_min');              // denormalized for fast queries
    $t->enum('status', [
        'scheduled',           // future, no action yet
        'attended',            // teacher marked attended
        'absent',              // student didn't show up
        'cancelled',           // explicitly cancelled
        'rescheduled',         // moved → see replaced_by_session_id (TODO future) OR drop in favor of editing in place
        'pending_substitute',  // affected by approved teacher leave; admin must reassign
    ])->default('scheduled');
    $t->enum('cancelled_by', ['student','teacher','admin','system'])->nullable();
    $t->string('cancellation_reason')->nullable();
    $t->string('zoom_meeting_id', 64)->nullable();
    $t->string('zoom_join_url', 500)->nullable();          // sent to student
    $t->string('zoom_start_url', 800)->nullable();         // sent to teacher only — long token
    $t->timestamp('attended_marked_at')->nullable();
    $t->foreignId('attended_marked_by_user_id')->nullable()->constrained('users')->nullOnDelete();
    $t->softDeletes();
    $t->timestamps();
    $t->index(['scheduled_start']);
    $t->index(['teacher_id', 'scheduled_start']);
    $t->index(['student_id', 'scheduled_start']);
    $t->index(['status']);
    $t->index(['status', 'scheduled_start']);              // dashboard queries
});
```

> **No separate `replaced_by_session_id`.** A reschedule mutates the session in place — start/end change, audit log captures the diff. We don't model "rescheduled" as a separate row because the operations interface treats it as "the same session, moved." If a session is *cancelled and a new one created later*, that's the makeup flow (separate row, FK back via `original_session_id`).

**`2026_07_13_000003_create_sys_session_reports_table.php`**

```php
Schema::create('sys_session_reports', function (Blueprint $t) {
    $t->id();
    $t->foreignId('session_id')->unique()->constrained('sys_sessions')->cascadeOnDelete();
    $t->foreignId('teacher_id')->constrained('sys_teachers')->cascadeOnDelete();
    $t->foreignId('student_id')->constrained('sys_students')->cascadeOnDelete();  // denormalized for fast lookup
    $t->text('covered_text');
    $t->enum('performance', ['excellent', 'good', 'needs_improvement']);
    $t->text('homework_text')->nullable();
    $t->text('next_session_notes')->nullable();
    $t->timestamp('submitted_at');
    $t->softDeletes();
    $t->timestamps();
    $t->index(['teacher_id', 'submitted_at']);
    $t->index(['student_id', 'submitted_at']);
});
```

**`2026_07_13_000004_create_sys_makeup_requests_table.php`**

```php
Schema::create('sys_makeup_requests', function (Blueprint $t) {
    $t->id();
    $t->foreignId('original_session_id')->constrained('sys_sessions')->cascadeOnDelete();
    $t->foreignId('requested_by_user_id')->constrained('users')->cascadeOnDelete();
    $t->timestamp('proposed_start_at');                    // UTC
    $t->unsignedSmallInteger('proposed_duration_min');
    $t->text('reason')->nullable();
    $t->enum('status', ['pending', 'approved', 'denied'])->default('pending');
    $t->foreignId('reviewed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
    $t->text('review_note')->nullable();
    $t->timestamp('reviewed_at')->nullable();
    $t->foreignId('makeup_session_id')->nullable()->constrained('sys_sessions')->nullOnDelete();
    $t->timestamps();
    $t->index(['status', 'created_at']);
    $t->index(['original_session_id']);
});
```

#### `sys_settings` keys added

```php
'session_reminder_offset_minutes' => 60,                  // SYS-07 reads this; default 60 min before
'report_overdue_after_hours'      => 24,
'session_materialization_window_days' => 14,
'attendance_absence_threshold'    => 3,                   // alert after this many absences in a row
```

#### New permissions

Append to `PermissionRegistry::GROUPS`:

```php
'sessions' => ['view', 'create', 'edit', 'reschedule', 'cancel'],
// 'attendance' already exists from SYS-02; reuse 'attendance.edit' for marking
// 'reports' already exists; subdivide:
'reports'  => ['view', 'view_any', 'submit', 'edit_own', 'edit_any', 'delete_any'],
'makeups'  => ['view', 'request', 'approve'],
```

(In SYS-02 we listed `reports` permissions vaguely — the registry now firms them up.)

---

### S4-02 — Models, factories, policies  *(1 day)*

#### Models

**`Session`** (`App\Models\System\Session` — note: this name shadows nothing because we live under a namespace; if you grep for `Session::` you'll always find the right one.):

```php
class Session extends Model
{
    use SoftDeletes, LogsActivity;
    protected $table = 'sys_sessions';
    protected $guarded = [];
    protected $casts = [
        'scheduled_start'    => 'datetime',
        'scheduled_end'      => 'datetime',
        'attended_marked_at' => 'datetime',
    ];

    public function student()        { return $this->belongsTo(Student::class); }
    public function teacher()        { return $this->belongsTo(Teacher::class); }
    public function pattern()        { return $this->belongsTo(SchedulePattern::class, 'schedule_pattern_id'); }
    public function originalSession(){ return $this->belongsTo(Session::class, 'original_session_id'); }
    public function makeups()        { return $this->hasMany(Session::class, 'original_session_id'); }
    public function report()         { return $this->hasOne(SessionReport::class); }

    public function getActivitylogOptions(): LogOptions {
        return LogOptions::defaults()
            ->logOnly(['scheduled_start','scheduled_end','status','teacher_id','cancelled_by','cancellation_reason'])
            ->logOnlyDirty();
    }

    public function scopeUpcoming($q)  { return $q->where('scheduled_start', '>', now())->where('status', 'scheduled'); }
    public function scopeToday($q, $tz)
    {
        $start = now($tz)->startOfDay()->utc();
        $end   = now($tz)->endOfDay()->utc();
        return $q->whereBetween('scheduled_start', [$start, $end]);
    }
}
```

`SchedulePattern`, `SessionReport`, `MakeupRequest` follow the established shape.

#### Policies

`SessionPolicy`:

```php
public function view(User $u, Session $s)
{
    if ($u->role === 'admin') return true;
    if ($u->role === 'teacher') return $s->teacher_id === $u->teacher?->id;
    return $u->can('schedule.view') || $u->can('attendance.view') || $u->can('reports.view');
}
public function update(User $u, Session $s)
{
    if ($u->role === 'admin') return true;
    return $u->can('schedule.edit') && $this->view($u, $s);
}
public function reschedule(User $u, Session $s)
{
    return $u->role === 'admin' || $u->can('schedule.reschedule');
}
public function markAttendance(User $u, Session $s)
{
    if ($u->role === 'admin') return true;
    if ($u->role === 'teacher') return $s->teacher_id === $u->teacher?->id;
    return $u->can('attendance.edit');
}
```

`SessionReportPolicy`:

```php
public function viewAny(User $u) { return $u->can('reports.view_any'); }
public function view(User $u, SessionReport $r)
{
    if ($u->role === 'admin') return true;
    if ($u->role === 'teacher') return $r->teacher_id === $u->teacher?->id;
    return $u->can('reports.view_any') || $u->can('reports.view');
}
public function submit(User $u, Session $s)
{
    return $u->role === 'teacher' && $s->teacher_id === $u->teacher?->id && $s->status === 'attended';
}
public function update(User $u, SessionReport $r)
{
    if ($u->can('reports.edit_any')) return true;
    return $u->role === 'teacher' && $r->teacher_id === $u->teacher?->id && $u->can('reports.edit_own');
}
```

`MakeupRequestPolicy` allows: teachers create requests for their sessions; admins approve. Students don't have system access in v1 — admins request on a student's behalf.

#### Factories

Realistic defaults for each. The interesting one is `SessionFactory`: `scheduled_start` faker uses a random business hour, `duration_min` matches the related pattern (or random 30/45/60), `status` defaults to `scheduled` but `state` methods include `attended()`, `absent()`, `cancelled()`, `pendingSubstitute()`.

`SystemDemoSeeder` is extended:

- For each active student, generate a `SchedulePattern` (e.g. 2 days/week 18:00-19:00 Africa/Cairo).
- Run `SessionMaterializer` for the past 90 days + next 14 days.
- Mark the past sessions: 80% attended, 10% absent, 7% cancelled, 3% rescheduled (status preserved).
- For 25 attended past sessions, attach `SessionReport`s. The remainder represent "missing reports" for testing the alert.
- Two pending makeup requests, one approved, one denied.

---

### S4-03 — Zoom integration  *(1 day)*

#### Service

`App\Services\Integrations\Zoom\ZoomClient` — uses Server-to-Server OAuth with `firebase/php-jwt` (already in tech stack).

```php
class ZoomClient
{
    public function __construct(
        private string $accountId,
        private string $clientId,
        private string $clientSecret,
        private HttpClient $http,
        private CacheRepository $cache,
    ) {}

    public function createMeeting(MeetingRequest $req): MeetingResponse
    {
        $token = $this->bearerToken();   // cached 50 min
        $res = $this->http->withToken($token)->post('https://api.zoom.us/v2/users/me/meetings', [
            'topic'       => $req->topic,
            'type'        => 2,                          // scheduled
            'start_time'  => $req->startUtc->toIso8601String(),
            'duration'    => $req->durationMinutes,
            'timezone'    => 'UTC',
            'settings'    => [
                'host_video'        => true,
                'participant_video' => true,
                'mute_upon_entry'   => true,
                'waiting_room'      => true,
                'auto_recording'    => 'none',
            ],
        ])->throw()->json();

        return new MeetingResponse(
            meetingId: (string) $res['id'],
            joinUrl:   $res['join_url'],
            startUrl:  $res['start_url'],
        );
    }
    public function updateMeeting(string $meetingId, MeetingRequest $req): void { /* PATCH */ }
    public function deleteMeeting(string $meetingId): void                       { /* DELETE */ }
    private function bearerToken(): string                                       { /* OAuth cached */ }
}
```

A `FakeZoomClient` (used in tests + `APP_ENV=local` when `ZOOM_ENABLED=false`) returns deterministic data without hitting the API.

Bound in `AppServiceProvider`:

```php
$this->app->bind(ZoomClient::class, fn ($app) =>
    config('system.features.zoom')
        ? new ZoomClient(env('ZOOM_ACCOUNT_ID'), env('ZOOM_CLIENT_ID'), env('ZOOM_CLIENT_SECRET'), $app->make(HttpClient::class), $app->make(CacheRepository::class))
        : new FakeZoomClient
);
```

#### Job

`App\Jobs\System\CreateSessionZoomMeeting` — dispatched on `Session@created` via the `SessionObserver`. Calls `ZoomClient::createMeeting`, persists `zoom_meeting_id`, `zoom_join_url`, `zoom_start_url` on the session. Retries 3 times on failure; alerts admin on final failure (the session keeps its row but with null URLs and a flagged warning in the UI).

`UpdateSessionZoomMeeting` — dispatched on session reschedule.

`DeleteSessionZoomMeeting` — dispatched on session cancel + session soft-delete.

All three jobs run on the `default` queue (not `notifications`).

#### Settings panel link

Settings → Integrations (built fully in SYS-08) needs to show the Zoom config status. In SYS-04 we add a minimal "Zoom integration" widget there — connected / disconnected / last error. That widget reads `sys_settings` keys `zoom.account_id`, `zoom.last_success_at`, `zoom.last_error`. The `ZoomClient` writes those keys on success / failure.

---

### S4-04 — Recurring schedule pattern builder  *(1.5 days)*

#### Service: `SchedulePatternService`

```php
class SchedulePatternService
{
    public function __construct(
        private ScheduleConflictDetector $conflicts,
        private SessionMaterializer $materializer,
        private TeacherAvailabilityResolver $availability,
    ) {}

    /**
     * Replace a student's active patterns from a future date onward.
     * Past sessions are NEVER modified by pattern changes.
     */
    public function replaceForward(Student $s, Carbon $effectiveDate, array $patterns): SchedulePatternChange
    {
        $teacher = $s->assignedTeacher ?? abort(422, 'Student has no assigned teacher.');
        DB::transaction(function () use ($s, $effectiveDate, $patterns, $teacher) {
            // 1. Close out current patterns: set valid_to = effectiveDate - 1 day for any open-ended ones.
            SchedulePattern::where('student_id', $s->id)
                ->whereNull('valid_to')
                ->update(['valid_to' => $effectiveDate->copy()->subDay()]);
            SchedulePattern::where('student_id', $s->id)
                ->whereDate('valid_to', '>=', $effectiveDate)
                ->update(['valid_to' => $effectiveDate->copy()->subDay()]);

            // 2. Insert the new patterns.
            foreach ($patterns as $p) {
                SchedulePattern::create([
                    'student_id'   => $s->id,
                    'teacher_id'   => $teacher->id,
                    'day_of_week'  => $p['day_of_week'],
                    'start_time'   => $p['start_time'],
                    'duration_min' => $p['duration_min'],
                    'timezone'     => $s->timezone,
                    'valid_from'   => $effectiveDate,
                    'valid_to'     => $p['valid_to'] ?? null,
                ]);
            }

            // 3. Delete future scheduled sessions tied to closed patterns.
            Session::where('student_id', $s->id)
                ->where('scheduled_start', '>=', $effectiveDate)
                ->where('status', 'scheduled')
                ->each(fn ($s) => DeleteSessionZoomMeeting::dispatch($s) && $s->delete());

            // 4. Materialize forward.
            $this->materializer->materialize($s, days: config('system.session_materialization_window_days', 14));
        });
        return new SchedulePatternChange(/* … */);
    }
}
```

#### Endpoints

```
GET    /api/system/students/{id}/schedule-patterns
PUT    /api/system/students/{id}/schedule-patterns        body: { effective_date, patterns: [...] }
```

`PUT` validates: every pattern's `(day_of_week, start_time, duration_min)` is valid; the count matches the student's `sessions_per_month` divided by 4 (within ±1 to allow for partial weeks); duration matches `student.session_duration_min`. Mismatch returns 422 with a clear error.

#### UI: `<RecurringPatternBuilder>`

Lives on the student profile **Schedule** tab.

```
┌──────────────────────────────────────────────────────────────────┐
│ Sarah Ahmed — schedule                                           │
│ 8 sessions/month × 30 min · USD 25/mo · America/New_York         │
├──────────────────────────────────────────────────────────────────┤
│ Effective from:  [Mon, Jul 13, 2026 ▾]                           │
│                                                                  │
│ Day of week     Time            Add                              │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
│  │ Sun  │ │ Mon  │ │ Tue  │ │ Wed  │ │ Thu  │ │ Fri  │ │ Sat  │  │
│  └──────┘ └──────┘ └─🟢───┘ └──────┘ └─🟢───┘ └──────┘ └──────┘  │
│                                                                  │
│ Tuesday    18:00 – 18:30 (30 min) America/New_York   [×]         │
│ Thursday   18:00 – 18:30 (30 min) America/New_York   [×]         │
│                                                                  │
│ Total: 2/week × 4 weeks = 8 sessions/month ✓                     │
│                                                                  │
│ Live preview — next 4 weeks                                      │
│ ┌──────────────────────────────────────────────────────────────┐│
│ │ Tue Jul 14  18:00–18:30 ET (15:00 UTC)         Sh. Hassan    ││
│ │ Thu Jul 16  18:00–18:30 ET                     Sh. Hassan    ││
│ │ Tue Jul 21  18:00–18:30 ET                     Sh. Hassan    ││
│ │ … (8 more)                                                   ││
│ └──────────────────────────────────────────────────────────────┘│
│ ⚠ One conflict found. [Show conflicts]                           │
│                                                                  │
│                                  [Cancel]   [Save schedule]     │
└──────────────────────────────────────────────────────────────────┘
```

Behavior:

- Click a day chip → adds a row with a 18:00 default; row has time + "remove" button.
- Time picker is a 5-minute-grid select (00, 05, 10 …).
- Total counter validates against `sessions_per_month / 4` and shows a green check or red mismatch.
- Live preview hits a debounced `POST /api/system/students/{id}/schedule-patterns/preview` (a non-mutating endpoint that just returns the materialized list + conflicts) every 600ms while editing.
- Save calls the real `PUT` endpoint. If conflicts exist, the modal expands to show them; admin can either fix or hit "Save anyway with override" (which writes to audit log with `force_save_with_conflicts=true`).

---

### S4-05 — Session materialization  *(1 day)*

`App\Services\System\SessionMaterializer` is the heart of scheduling.

```php
class SessionMaterializer
{
    public function __construct(private RecurrenceCalculator $rec) {}

    /**
     * Idempotent. For each active pattern of $student that intersects
     * [today, today+$days], emit a sys_sessions row if not already present.
     * Returns the list of newly-created Session models (so callers can dispatch Zoom jobs).
     */
    public function materialize(Student $student, int $days = 14): Collection
    {
        $now = now();
        $end = $now->copy()->addDays($days);
        $created = collect();

        foreach (SchedulePattern::active()->where('student_id', $student->id)->get() as $p) {
            foreach ($this->rec->expand($p, $now, $end) as $occurrence) {
                $exists = Session::where('schedule_pattern_id', $p->id)
                    ->where('scheduled_start', $occurrence->startUtc)->exists();
                if ($exists) continue;
                $session = Session::create([
                    'student_id'           => $student->id,
                    'teacher_id'           => $p->teacher_id,
                    'schedule_pattern_id'  => $p->id,
                    'scheduled_start'      => $occurrence->startUtc,
                    'scheduled_end'        => $occurrence->endUtc,
                    'duration_min'         => $p->duration_min,
                    'status'               => 'scheduled',
                ]);
                $created->push($session);
            }
        }
        return $created;
    }
}
```

`RecurrenceCalculator::expand(pattern, from, to)` — pure function that returns concrete UTC start/end for each occurrence inside the window. Handles DST shifts (April Sunday in New York jumps clocks forward — the 18:00 NY session moves from 22:00 UTC to 21:00 UTC on the right day).

**Cron:** `app/Console/Commands/System/MaterializeUpcomingSessions.php` runs nightly (`schedule()->daily()->at('02:00')`):

```php
public function handle(SessionMaterializer $m, ZoomClient $zoom): int
{
    foreach (Student::where('status', 'active')->cursor() as $student) {
        $created = $m->materialize($student);
        foreach ($created as $session) {
            CreateSessionZoomMeeting::dispatch($session);
        }
    }
    return self::SUCCESS;
}
```

Manual run: `php artisan system:sessions:materialize --student=42 --days=30`.

---

### S4-06 — Conflict detection  *(0.5 day)*

`App\Services\System\ScheduleConflictDetector` is pure, deterministic, fully unit-tested.

```php
class ScheduleConflictDetector
{
    /**
     * Returns array<Conflict> for (teacher, start, end) considering existing scheduled sessions
     * and approved teacher leave. Optionally excludes a session id (for reschedule preview).
     */
    public function check(int $teacherId, Carbon $startUtc, Carbon $endUtc, ?int $excludeSessionId = null): array
    {
        $out = [];

        // 1. Teacher double-booking.
        $clash = Session::where('teacher_id', $teacherId)
            ->where('status', 'scheduled')
            ->when($excludeSessionId, fn ($q) => $q->where('id', '!=', $excludeSessionId))
            ->where(function ($q) use ($startUtc, $endUtc) {
                $q->whereBetween('scheduled_start', [$startUtc, $endUtc->copy()->subSecond()])
                  ->orWhereBetween('scheduled_end',   [$startUtc->copy()->addSecond(), $endUtc])
                  ->orWhere(function ($q) use ($startUtc, $endUtc) {
                      $q->where('scheduled_start', '<=', $startUtc)
                        ->where('scheduled_end',   '>=', $endUtc);
                  });
            })->get();
        foreach ($clash as $c) {
            $out[] = new Conflict('teacher_double_booking', $c);
        }

        // 2. Teacher on approved leave.
        $leave = TeacherLeave::where('teacher_id', $teacherId)
            ->where('status', 'approved')
            ->whereDate('start_date', '<=', $startUtc->toDateString())
            ->whereDate('end_date', '>=', $endUtc->toDateString())
            ->first();
        if ($leave) $out[] = new Conflict('teacher_on_leave', $leave);

        // 3. Outside availability.
        if (!app(TeacherAvailabilityResolver::class)->isAvailable($teacherId, $startUtc, $endUtc->diffInMinutes($startUtc))) {
            $out[] = new Conflict('teacher_unavailable', null);
        }
        return $out;
    }
}
```

Used in three places:

1. `SchedulePatternService::replaceForward` — over each materialized occurrence.
2. Reschedule endpoint — over the proposed new time.
3. `/schedule/conflicts` page — runs over all upcoming scheduled sessions and shows what's currently broken.

The "save anyway with override" option only suppresses #1 and #3; #2 (teacher on leave) is hard-blocked — admin must reschedule the leave or the session, not both.

---

### S4-07 — Calendar view  *(1.5 days)*

`<CalendarView>` is a thin React wrapper around FullCalendar v6 (already in tech stack).

**Props:**

```ts
interface CalendarViewProps {
  scope: 'all' | { teacherId: number } | { studentId: number }
  initialView?: 'timeGridDay' | 'timeGridWeek' | 'dayGridMonth'
  onEventClick?: (session: Session) => void
  editable?: boolean        // admin can drag → reschedule
  showLeaves?: boolean      // overlay teacher leave blocks
}
```

Events come from `GET /api/system/sessions?from=…&to=…&teacher_id=…&student_id=…`. Each event renders with:

- Color by status:
  - `scheduled` → green primary
  - `attended` → green strong
  - `absent` → red
  - `cancelled` → muted gray
  - `pending_substitute` → orange warning
  - `rescheduled` → not rendered (only the new time counts)
- Title: student name + course
- Subtitle: teacher initial
- Click → `<SessionDrawer>` slides in from the right with details (S4-08).

**`/schedule/page.tsx`:**

```
┌────────────────────────────────────────────────────────────────────────┐
│ Schedule                                              [ + Add session ]│
│ Today's view · all teachers                                            │
├────────────────────────────────────────────────────────────────────────┤
│ [Day] [Week] [Month]   Teacher: [All ▾]  Student: [—]    [Conflicts: 0]│
├────────────────────────────────────────────────────────────────────────┤
│   Mon Jul 13   Tue Jul 14   Wed Jul 15   Thu Jul 16   Fri Jul 17        │
│   ─────────   ─────────    ─────────    ─────────    ─────────          │
│ 6 │           │            │            │            │           │      │
│ 7 │           │            │            │            │           │      │
│ … │  Sarah    │ Yusuf      │            │ Sarah      │           │      │
│   │  Sh.Hass. │ Sh.Aisha   │            │ Sh.Hass.   │           │      │
│   │  18:00    │ 17:00      │            │ 18:00      │           │      │
└────────────────────────────────────────────────────────────────────────┘
```

Drag-to-reschedule: only enabled for admin. A drop calls `PATCH /api/system/sessions/{id}/reschedule` with the new start. If conflicts → modal opens (instead of silently saving), letting admin abort or override.

The "+ Add session" button creates an **ad-hoc session** (not pattern-driven). Used for makeup sessions when admin approves them, and for one-off sessions outside the recurring schedule (rare).

---

### S4-08 — Session detail drawer + reschedule  *(1 day)*

Clicking a session anywhere (calendar, attendance list, profile sessions tab) opens `<SessionDrawer>` (right-side, 720px).

```
┌────────────────────────────────────────────────────┐
│ Tue Jul 14, 2026 · 18:00–18:30 EDT                 │
│ Sarah Ahmed (Tajweed) with Sh. Hassan              │
│ ───────────────────────────────────────────────────│
│ Status: ● Scheduled                                │
│ Zoom: https://zoom.us/j/...                        │
│   [ Copy join link ]                               │
│                                                    │
│ Quick actions                                      │
│  [ Mark attended ]  [ Mark absent ]                │
│  [ Cancel session ]  [ Reschedule ]                │
│                                                    │
│ Attendance history (this student, last 8 sessions) │
│  ✓ Jul 7 attended   ✓ Jun 30 attended              │
│  ✗ Jun 23 absent    ✓ Jun 16 attended              │
│  …                                                 │
│                                                    │
│ Session report                                     │
│   Not yet submitted — [ Submit report ] (teacher)  │
│                                                    │
│ Activity log                                       │
│  Created Jul 13 02:00 (cron) · Sh. Hassan          │
└────────────────────────────────────────────────────┘
```

**Reschedule** opens an inner sheet:

- Date + time picker
- Duration locked to the student's session_duration_min
- Live conflict check (`POST /api/system/sessions/{id}/reschedule/preview`)
- Reason (free text, optional, audit-logged)
- Save updates `scheduled_start`/`scheduled_end`, dispatches `UpdateSessionZoomMeeting`, and shows a toast ("Rescheduled to Tue Jul 14, 19:00 EDT").

**Cancel** opens a small dialog:

- Cancelled by: `student` / `teacher` / `admin` (radio)
- Reason (free text, required when cancelled_by = `admin`)
- Confirm → status → `cancelled`, `cancelled_by`, `cancellation_reason` saved, Zoom meeting deleted, audit-logged.
- A dropdown offers "Request makeup" — opens the makeup request flow (S4-11).

---

### S4-09 — Attendance marking  *(1 day)*

#### Endpoints

```
POST /api/system/sessions/{id}/attendance     body: { status: 'attended'|'absent'|'cancelled', cancelled_by?, cancellation_reason? }
POST /api/system/sessions/bulk-attendance     body: [{ session_id, status, … }]
```

Permission: `attendance.edit` OR teacher-self via policy.

When marking `attended`:
- Sets `status`, `attended_marked_at`, `attended_marked_by_user_id`.
- Emits event `SessionAttended` (subscribed by SYS-06 for payroll calc + SYS-07 for "missing report" cron).
- Doesn't auto-open the report form, but the UI shows a "Submit report" CTA inline.

When marking `absent`:
- Sets `status` only.
- Emits event `SessionAbsent`.
- Triggers an "absence streak" check — if the student now has ≥ `attendance_absence_threshold` absences in a row, an admin notification fires.

When marking `cancelled` from this endpoint:
- Same flow as the cancel button on the drawer.

#### `/attendance/page.tsx`

A dedicated list view useful for end-of-day operations:

```
┌──────────────────────────────────────────────────────────────────────┐
│ Attendance                                                           │
│ Mark and review session outcomes.                                    │
├──────────────────────────────────────────────────────────────────────┤
│ Date: [Today ▾] [▣ Last 7 days] [Custom range]   Teacher: [All ▾]    │
├──────────────────────────────────────────────────────────────────────┤
│ ☐ Time     Student       Teacher       Status      Mark              │
│ ☐ 18:00    Sarah Ahmed   Sh. Hassan    Scheduled   [✓][✗][⊘]         │
│ ☐ 19:00    Yusuf Khan    Sh. Aisha     Attended    ✓                 │
│ …                                                                    │
└──────────────────────────────────────────────────────────────────────┘
[ Bulk-mark selected as Attended ]
```

Bulk-mark applies the same status to all selected rows in one transactional call.

The **teacher dashboard** (`/teacher/today`) shows the same controls inline next to each session — no extra page navigation needed.

---

### S4-10 — Session reports  *(1.5 days)*

#### Endpoints

```
GET    /api/system/session-reports              perm: reports.view_any    (filterable)
GET    /api/system/sessions/{id}/report         perm: policy.view
POST   /api/system/sessions/{id}/report         perm: reports.submit (teacher of session, status=attended)
PATCH  /api/system/session-reports/{id}         perm: policy.update
GET    /api/system/students/{id}/reports        perm: students.view (returns own student's reports)
GET    /api/system/teachers/{id}/reports        perm: reports.view_any OR self
```

#### Submission form

`<SessionReportForm>` is reused on the teacher dashboard (`/teacher/today`) and on the session drawer.

```
┌──────────────────────────────────────────────────────────────────┐
│ Submit report — Sarah Ahmed · Tue Jul 14, 18:00 (Tajweed, 30m)   │
├──────────────────────────────────────────────────────────────────┤
│ What was covered (required)                                      │
│ ┌──────────────────────────────────────────────────────────────┐│
│ │ Reviewed Surah Al-Fatihah, focus on madd…                    ││
│ └──────────────────────────────────────────────────────────────┘│
│ 84 / 800 chars · auto-saving every 5s                            │
│                                                                  │
│ Performance                                                      │
│  ( ) Excellent   (●) Good   ( ) Needs improvement                │
│                                                                  │
│ Homework / assignment (optional)                                 │
│ ┌──────────────────────────────────────────────────────────────┐│
│ │ Practice madd letters daily for 10 minutes.                  ││
│ └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│ Notes for next session (optional)                                │
│ ┌──────────────────────────────────────────────────────────────┐│
│ │ Continue with Surah Al-Baqarah, ayat 1–10.                   ││
│ └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│                              [ Save draft ]   [ Submit report ] │
└──────────────────────────────────────────────────────────────────┘
```

Behavior:

- Form is pre-populated on first load if a draft exists in `localStorage` keyed by session id.
- "Save draft" stores in `localStorage` only (no server hit).
- "Submit report" hits the server, clears the local draft, shows toast "Report submitted".
- Once submitted, the form switches to read-only mode with an "Edit" button (subject to `reports.edit_own` policy).

#### Admin review list

`/session-reports/page.tsx`:

```
┌──────────────────────────────────────────────────────────────────────┐
│ Session reports                                                      │
│ 87 submitted · 12 missing                                            │
├──────────────────────────────────────────────────────────────────────┤
│ Date: [Last 30 days ▾]   Teacher: [All ▾]   [ ▢ Missing only ]       │
├──────────────────────────────────────────────────────────────────────┤
│ Submitted   Student        Teacher        Performance   Status       │
│ Jul 14      Sarah Ahmed    Sh. Hassan     Good          Submitted    │
│ Jul 13      Yusuf Khan     Sh. Aisha      —             Missing 23h  │
│ …                                                                    │
└──────────────────────────────────────────────────────────────────────┘
```

Click a row → `/session-reports/[id]` (read-only) for submitted reports, or jump to the session drawer for missing reports.

#### Missing-report cron

`app/Console/Commands/System/CheckMissingReports.php` runs every 15 min:

```php
public function handle(): int
{
    $threshold = (int) Setting::get('report_overdue_after_hours', 24);
    $cutoff = now()->subHours($threshold);

    $sessions = Session::query()
        ->where('status', 'attended')
        ->where('scheduled_end', '<', $cutoff)
        ->whereDoesntHave('report')
        ->whereDoesntHave('staleReportAlertNotifications')   // dedupe
        ->limit(200)->get();

    foreach ($sessions as $s) {
        // Notify admins.
        foreach (User::role(['admin','supervisor'])->cursor() as $u) {
            NotificationService::push($u, 'report.overdue', "Missing report: {$s->student->name} · {$s->scheduled_start->format('M j H:i')}", null, "/sessions/{$s->id}");
        }
        // Mark on session so the teacher's dashboard shows a banner.
        $s->update(['report_overdue_at' => now()]);
        // SYS-07 will hook this same event for wassender.
    }
    return self::SUCCESS;
}
```

(The `report_overdue_at` column is added in `2026_07_13_000005_add_report_overdue_at_to_sys_sessions.php` — a small follow-up migration.)

---

### S4-11 — Makeup sessions  *(1 day)*

A makeup is a regular `sys_sessions` row with `original_session_id` set. The approval flow lives in `sys_makeup_requests`.

#### Endpoints

```
GET    /api/system/makeup-requests          perm: makeups.view (admin sees all; teacher sees own)
POST   /api/system/makeup-requests          body: { original_session_id, proposed_start_at, proposed_duration_min, reason }
POST   /api/system/makeup-requests/{id}/approve   perm: makeups.approve
POST   /api/system/makeup-requests/{id}/deny      perm: makeups.approve
```

`approve` flow:

1. Validate the proposed time is conflict-free (uses `ScheduleConflictDetector`).
2. Create a new `Session` row with `original_session_id` pointing back, status `scheduled`.
3. Dispatch `CreateSessionZoomMeeting`.
4. Update `sys_makeup_requests.status = 'approved'`, set `makeup_session_id`.
5. Push internal notification to the requesting teacher.
6. Audit-log.

`deny` flow: just status → `denied`, optional review note, notify teacher.

#### UI

A "Request makeup" button appears on cancelled / absent sessions in the drawer. Opens a small sheet:

```
Request makeup — Sarah Ahmed (originally Tue Jul 14, cancelled by student)
─────────────────────────────────────────────────────
Proposed time:  [Sat Jul 18 ▾] [10:00 ▾]   30 min
Reason:         [ Student travel … ]
                                                    [Cancel]  [Submit]
```

Admin sees pending requests in the dashboard alerts panel and on `/schedule/conflicts` (the latter is a misnomer here — we'll add a small banner with a count).

> **Decision deferred:** a dedicated `/makeup-requests` page is overkill for v1 — admin reviews from the dashboard alerts panel. If volume grows we add the page in a future sprint.

---

### S4-12 — Teacher dashboard wiring  *(1 day)*

The teacher dashboard route group already exists from SYS-01. SYS-04 fills it in.

#### Layout

`/teacher/page.tsx` (entry) — redirects to `/teacher/today`.

`/teacher/today/page.tsx`:

```
┌──────────────────────────────────────────────────────────────────┐
│ Today                                              Tue Jul 14    │
│ Welcome back, Sh. Hassan                                         │
├──────────────────────────────────────────────────────────────────┤
│ ⚠ 1 missing session report from yesterday   [View]               │
├──────────────────────────────────────────────────────────────────┤
│ 18:00 — Sarah Ahmed (Tajweed, 30 min) · America/New_York         │
│   [ Open Zoom ]                                                  │
│   Status: Scheduled                                              │
│   [ Mark attended ] [ Mark absent ] [ Cancel ]                   │
│                                                                  │
│ 19:00 — Yusuf Khan (Hifz, 60 min) · America/Toronto              │
│   [ Open Zoom ]                                                  │
│   Status: Attended ✓                                             │
│   📝 Report not submitted yet — [ Submit report ]                │
│                                                                  │
│ 20:30 — Maryam Hassan (Tajweed, 45 min) · UK                     │
│   …                                                              │
└──────────────────────────────────────────────────────────────────┘
```

`/teacher/upcoming/page.tsx` — same calendar component used by admins, scoped to the teacher.

`/teacher/students/page.tsx` — read-only DataTable of own students (subset of admin's `/students` columns; no bulk actions, no edit links).

`/teacher/reports/page.tsx` — own report history.

`/teacher/leave/page.tsx` — already from SYS-03; `RequestLeaveSheet` button surfaces here.

`/teacher/salary/page.tsx` — empty state, "Calculated monthly. First statement available in SYS-06." Permission gate ensures non-teachers can't reach it.

#### Sidebar in teacher mode

When `user.role === 'teacher'`, the sidebar swaps to a teacher-specific nav:

```
Today
Upcoming
My students
Reports
Leave
Salary
```

Implemented by `navForRole(user)` (introduced in SYS-02). Admin mode keeps its full nav.

---

### S4-13 — Auto-flag sessions on teacher leave  *(0.5 day)*

`App\Listeners\System\FlagSessionsOnTeacherLeaveApproved`:

```php
public function handle(TeacherLeaveApproved $event): void
{
    $sessions = Session::where('teacher_id', $event->leave->teacher_id)
        ->where('status', 'scheduled')
        ->whereBetween('scheduled_start', [
            $event->leave->start_date->startOfDay(),
            $event->leave->end_date->endOfDay(),
        ])->get();

    foreach ($sessions as $s) {
        $s->update(['status' => 'pending_substitute']);
        // Dispatch deletion of Zoom meeting (no host available).
        DeleteSessionZoomMeeting::dispatch($s);
    }

    if ($sessions->isNotEmpty()) {
        foreach (User::role(['admin','supervisor'])->cursor() as $u) {
            NotificationService::push($u, 'sessions.pending_substitute',
                "{$sessions->count()} sessions need a substitute (teacher: {$event->leave->teacher->user->name})",
                null, "/schedule?status=pending_substitute");
        }
    }
}
```

Reschedule from `pending_substitute` to `scheduled` flips status back and recreates the Zoom meeting (via `CreateSessionZoomMeeting`).

Filter on `/schedule?status=pending_substitute` lists exactly these sessions.

---

### S4-14 — Endpoints  *(housekeeping)*

#### Recap — added in this sprint

```
GET    /api/system/sessions                                 list (with filters)
GET    /api/system/sessions/{id}
POST   /api/system/sessions                                 ad-hoc create
PATCH  /api/system/sessions/{id}/reschedule
POST   /api/system/sessions/{id}/reschedule/preview
POST   /api/system/sessions/{id}/cancel
POST   /api/system/sessions/{id}/attendance
POST   /api/system/sessions/bulk-attendance

GET    /api/system/students/{id}/schedule-patterns
PUT    /api/system/students/{id}/schedule-patterns
POST   /api/system/students/{id}/schedule-patterns/preview

GET    /api/system/students/{id}/sessions                   (covered by sessions index w/ filter, but convenience)
GET    /api/system/teachers/{id}/sessions                   (same)

GET    /api/system/session-reports
GET    /api/system/sessions/{id}/report
POST   /api/system/sessions/{id}/report
PATCH  /api/system/session-reports/{id}
GET    /api/system/students/{id}/reports
GET    /api/system/teachers/{id}/reports

GET    /api/system/makeup-requests
POST   /api/system/makeup-requests
POST   /api/system/makeup-requests/{id}/approve
POST   /api/system/makeup-requests/{id}/deny
```

22 distinct routes across 5 controllers (`SessionController`, `SessionReportController`, `SchedulePatternController`, `MakeupRequestController`, plus extensions to `StudentController` / `TeacherController`).

---

### S4-15 — Tests  *(2 days)*

#### Unit

- `RecurrenceCalculatorTest` — DST forward/back transitions, week boundaries, valid_from/valid_to clipping.
- `ScheduleConflictDetectorTest` — overlapping cases (start-inside, end-inside, contains, contained), exclude-self, leave-window, availability gap.
- `SessionMaterializerTest` — idempotency (re-running creates no dupes), partial-window patterns, deactivation mid-window.
- `TimezoneResolverTest` — student vs teacher vs operator views.

#### Feature

- `SchedulePatternEndpointTest` — replace-forward, mismatched session count, overlapping with another student, override-with-conflict.
- `SessionRescheduleTest` — conflict path, success, Zoom job dispatched, audit log written.
- `AttendanceTest` — happy path, bulk, absence-streak alert.
- `SessionReportTest` — submit, edit own, edit any (admin), denial paths.
- `MakeupRequestTest` — request → approve → session created → Zoom job; deny path; conflict on approval.
- `LeaveAutoFlagTest` — approve leave → sessions flip to pending_substitute → Zoom delete dispatched → admin notification.
- `MissingReportCronTest` — fast-forward time, ensure notification + dedupe.

#### Integration with `FakeZoomClient`

`ZoomIntegrationTest` — full end-to-end: create student schedule → cron runs → sessions created → fake Zoom IDs persisted → reschedule → fake Zoom updated → cancel → fake Zoom deleted.

#### Playwright

`frontend/e2e/system/scheduling.spec.ts` — 8 acceptance flows.

---

### S4-16 — Deploy + smoke  *(0.5 day)*

- Run migrations on staging.
- Run `php artisan system:sessions:materialize --all` to seed the next 14 days.
- Owner walks through:
  1. Open `/schedule` — see week of demo sessions with Zoom links.
  2. Click into a session → reschedule by 30 min → confirm Zoom URL changes.
  3. Open `/students/[id]` Schedule tab → modify pattern (Tue 18:00 → Wed 19:00) → confirm next 14 days regenerate.
  4. As Sh. Hassan (impersonate), open `/teacher/today` → mark first session attended → submit report → confirm admin sees report on `/session-reports`.
  5. Forget to submit a report on the second attended session → fast-forward time via Tinker → cron runs → admin notification appears, teacher banner appears.
  6. As Sh. Hassan, request leave for next week (already SYS-03 flow). As admin, approve. Confirm 2 sessions flip to `pending_substitute` (orange) on the calendar.
  7. As admin, request a makeup for a cancelled past session. Approve. Confirm new session row with original_session_id linked.
  8. Lighthouse ≥ 90 on `/schedule` and `/teacher/today`.

---

## Endpoints {#endpoints}

| Method | Path | Permission |
|---|---|---|
| GET    | `/api/system/sessions`                                              | `schedule.view` |
| GET    | `/api/system/sessions/{id}`                                         | policy |
| POST   | `/api/system/sessions`                                              | `schedule.edit` |
| PATCH  | `/api/system/sessions/{id}/reschedule`                              | `schedule.reschedule` |
| POST   | `/api/system/sessions/{id}/reschedule/preview`                      | policy |
| POST   | `/api/system/sessions/{id}/cancel`                                  | `sessions.cancel` |
| POST   | `/api/system/sessions/{id}/attendance`                              | policy |
| POST   | `/api/system/sessions/bulk-attendance`                              | `attendance.edit` |
| GET    | `/api/system/students/{id}/schedule-patterns`                       | `students.view` |
| PUT    | `/api/system/students/{id}/schedule-patterns`                       | `schedule.edit` |
| POST   | `/api/system/students/{id}/schedule-patterns/preview`               | `schedule.view` |
| GET    | `/api/system/students/{id}/sessions`                                | policy |
| GET    | `/api/system/teachers/{id}/sessions`                                | policy |
| GET    | `/api/system/session-reports`                                       | `reports.view_any` |
| GET    | `/api/system/sessions/{id}/report`                                  | policy |
| POST   | `/api/system/sessions/{id}/report`                                  | `reports.submit` |
| PATCH  | `/api/system/session-reports/{id}`                                  | policy |
| GET    | `/api/system/students/{id}/reports`                                 | `students.view` |
| GET    | `/api/system/teachers/{id}/reports`                                 | policy |
| GET    | `/api/system/makeup-requests`                                       | `makeups.view` |
| POST   | `/api/system/makeup-requests`                                       | `makeups.request` |
| POST   | `/api/system/makeup-requests/{id}/approve`                          | `makeups.approve` |
| POST   | `/api/system/makeup-requests/{id}/deny`                             | `makeups.approve` |

---

## File deliverables checklist

```
backend/
├── app/
│   ├── Console/Commands/System/
│   │   ├── MaterializeUpcomingSessions.php               (NEW)
│   │   └── CheckMissingReports.php                       (NEW)
│   ├── Http/Controllers/System/
│   │   ├── SessionController.php                         (NEW)
│   │   ├── SessionReportController.php                   (NEW)
│   │   ├── SchedulePatternController.php                 (NEW)
│   │   └── MakeupRequestController.php                   (NEW)
│   ├── Http/Requests/System/
│   │   ├── Session/{Reschedule,Cancel,BulkAttendance}Request.php
│   │   ├── SchedulePattern/ReplaceRequest.php
│   │   ├── SessionReport/{Store,Update}Request.php
│   │   └── Makeup/{Store,Review}Request.php
│   ├── Http/Resources/System/
│   │   ├── SessionResource.php / SessionDetailResource.php
│   │   ├── SchedulePatternResource.php
│   │   ├── SessionReportResource.php
│   │   └── MakeupRequestResource.php
│   ├── Models/System/
│   │   ├── Session.php
│   │   ├── SchedulePattern.php
│   │   ├── SessionReport.php
│   │   └── MakeupRequest.php
│   ├── Observers/System/
│   │   └── SessionObserver.php                           (NEW — dispatches Zoom jobs)
│   ├── Policies/System/
│   │   ├── SessionPolicy.php
│   │   ├── SessionReportPolicy.php
│   │   ├── SchedulePatternPolicy.php
│   │   └── MakeupRequestPolicy.php
│   ├── Jobs/System/
│   │   ├── CreateSessionZoomMeeting.php                  (NEW)
│   │   ├── UpdateSessionZoomMeeting.php                  (NEW)
│   │   └── DeleteSessionZoomMeeting.php                  (NEW)
│   ├── Listeners/System/
│   │   ├── FlagSessionsOnTeacherLeaveApproved.php        (NEW)
│   │   └── NotifyAdminOnAbsenceStreak.php                (NEW)
│   ├── Events/System/
│   │   ├── SessionAttended.php                           (NEW)
│   │   ├── SessionAbsent.php                             (NEW)
│   │   └── SessionRescheduled.php                        (NEW)
│   ├── Services/System/
│   │   ├── SchedulePatternService.php                    (NEW)
│   │   ├── SessionMaterializer.php                       (NEW)
│   │   ├── RecurrenceCalculator.php                      (NEW)
│   │   ├── ScheduleConflictDetector.php                  (NEW)
│   │   ├── TimezoneResolver.php                          (NEW)
│   │   └── ReportSubmissionMonitor.php                   (NEW — orchestrates the cron)
│   └── Services/Integrations/Zoom/
│       ├── ZoomClient.php                                (NEW)
│       ├── FakeZoomClient.php                            (NEW)
│       ├── MeetingRequest.php / MeetingResponse.php
│       └── ZoomServiceProvider.php
├── database/migrations/
│   ├── 2026_07_13_000001_create_sys_schedule_patterns_table.php
│   ├── 2026_07_13_000002_create_sys_sessions_table.php
│   ├── 2026_07_13_000003_create_sys_session_reports_table.php
│   ├── 2026_07_13_000004_create_sys_makeup_requests_table.php
│   └── 2026_07_13_000005_add_report_overdue_at_to_sys_sessions.php
├── database/factories/System/
│   ├── SchedulePatternFactory.php
│   ├── SessionFactory.php
│   ├── SessionReportFactory.php
│   └── MakeupRequestFactory.php
├── config/integrations.php                               (UPDATED — zoom section)
└── routes/system.php                                     (UPDATED)

frontend/
├── src/app/(system)/
│   ├── schedule/
│   │   ├── page.tsx                                      (NEW)
│   │   └── conflicts/page.tsx                            (NEW)
│   ├── attendance/page.tsx                               (NEW)
│   ├── session-reports/
│   │   ├── page.tsx                                      (NEW)
│   │   └── [id]/page.tsx                                 (NEW)
│   ├── students/[id]/page.tsx                            (UPDATED — Sessions/Schedule/Reports tabs)
│   ├── teachers/[id]/page.tsx                            (UPDATED — Schedule/Reports tabs)
│   └── teacher/
│       ├── today/page.tsx                                (FILLED IN)
│       ├── upcoming/page.tsx                             (FILLED IN)
│       ├── students/page.tsx                             (FILLED IN)
│       ├── reports/page.tsx                              (FILLED IN)
│       └── salary/page.tsx                               (placeholder, gated)
├── src/components/system/
│   ├── schedule/
│   │   ├── CalendarView.tsx                              (NEW — FullCalendar wrapper)
│   │   ├── RecurringPatternBuilder.tsx                   (NEW)
│   │   ├── PatternPreview.tsx                            (NEW)
│   │   ├── ConflictBanner.tsx                            (NEW)
│   │   ├── ConflictsTable.tsx                            (NEW)
│   │   ├── SessionDrawer.tsx                             (NEW)
│   │   ├── RescheduleSheet.tsx                           (NEW)
│   │   └── CancelSessionDialog.tsx                       (NEW)
│   ├── attendance/
│   │   ├── AttendanceTable.tsx                           (NEW)
│   │   └── AttendanceMarker.tsx                          (NEW)
│   ├── session-reports/
│   │   ├── SessionReportForm.tsx                         (NEW)
│   │   ├── SessionReportList.tsx                         (NEW)
│   │   └── ReportTimeline.tsx                            (NEW — used on student profile)
│   ├── makeup/
│   │   ├── MakeupRequestSheet.tsx                        (NEW)
│   │   └── MakeupReviewSheet.tsx                         (NEW)
│   └── teacher/
│       ├── TodaySessionsList.tsx                         (NEW)
│       ├── UpcomingCalendar.tsx                          (NEW)
│       └── MissingReportsBanner.tsx                      (NEW)
├── src/hooks/system/
│   ├── useSessions.ts
│   ├── useSession.ts
│   ├── useSchedulePatterns.ts
│   ├── useReschedulePreview.ts
│   ├── useAttendance.ts
│   ├── useSessionReports.ts
│   ├── useSessionReport.ts
│   ├── useMakeupRequests.ts
│   └── useTeacherToday.ts
├── src/lib/system/
│   ├── timezone.ts                                       (NEW — utility wrappers)
│   └── recurrence.ts                                     (NEW — preview-side helpers)
└── src/types/system/
    ├── session.ts
    ├── schedulePattern.ts
    ├── sessionReport.ts
    └── makeup.ts

docs/system/sprints/sys-04-scheduling-sessions-attendance-reports.md  (THIS FILE)
```

---

## Risks & open questions

- **DST and timezone math.** Recurring patterns store `(day_of_week, start_time, timezone)`. When materializing, the calculator converts each occurrence's local time to UTC — so a 18:00 ET session on the Sunday DST falls forward will be 22:00 UTC the day before and 21:00 UTC the day after. Unit tests cover both transitions. The pattern row is **not** rewritten on DST; it stays the same.
- **Student timezone change vs. existing patterns.** If a student moves countries and their `timezone` field changes, future sessions stay scheduled at their old wall-clock time (because patterns store their own TZ snapshot). UI shows a banner: "This student's timezone changed on Jul 1. Future sessions still follow their previous timezone — edit the pattern to update."
- **Zoom failures.** The Zoom API can fail (rate limits, account suspension). On failure the session keeps its row with null URLs and a yellow flag. The teacher dashboard displays a "Zoom unavailable — contact admin" warning. Admin can manually retry from the session drawer (calls `CreateSessionZoomMeeting::dispatch` again). Pattern: don't block scheduling on a Zoom outage.
- **Pattern changes affecting paid sessions.** Module 6 says session reductions take effect next month, increases not allowed mid-month. SYS-04 doesn't enforce this constraint at the pattern level — that's SYS-05's job (it'll add a guard that blocks pattern changes which conflict with the current month's billing). For now, the pattern PUT endpoint accepts any change; SYS-05 layers the guard on top.
- **Missing-report dedupe.** The `staleReportAlertNotifications` relationship needs a corresponding column or a polymorphic notification on `sys_notifications`. Decision: store a row in `sys_notifications` with `type='report.overdue'` and `payload={session_id}`; the cron checks for an existing notification on the same session before creating another. Documented; implemented in `ReportSubmissionMonitor`.
- **Bulk attendance race conditions.** If two operators bulk-mark the same session simultaneously, the second wins. Acceptable — `attended_marked_at`/`attended_marked_by_user_id` records who actually applied the final state. Audit log captures both attempts.
- **Calendar performance at scale.** A school with 200 active students × 8 sessions/month = 1,600 sessions/month. FullCalendar handles this fine for week/day views; the month view paginates events automatically. Verified during the smoke pass; tune lazy-loading if it becomes sluggish.

---

## Sprint review demo script

(~15 minutes — most complex sprint so far, takes the longest)

1. Open `/schedule` — see seeded sessions for the week with Zoom links and color-coded statuses.
2. Click a session → drawer opens, copy Zoom link, show "Mark attended" / "Mark absent" / "Cancel" / "Reschedule" actions.
3. Reschedule the session by 30 minutes → conflict-free → save → Zoom URL updates (verify via the Zoom dashboard if owner has access; otherwise show the FakeZoom log).
4. Build a new pattern: open a different student's Schedule tab → set Wed + Fri 18:00 ET → preview shows next 4 weeks with no conflicts → save → confirm new sessions appear on `/schedule` immediately (without waiting for the cron).
5. Force a conflict: try to set the same student to Tue 18:00 (which is already taken by their teacher) → modal lists the conflicting session → cancel and pick a different time.
6. Switch to teacher impersonation (Sh. Hassan). Open `/teacher/today` — see today's 3 sessions. Mark first attended, second absent, third cancelled (student).
7. Submit a report on the attended session — show character counter, autosave indicator, submit toast.
8. Skip submitting a report on a second attended session. Use Tinker to fast-forward `now()` by 25 hours. Run `php artisan system:reports:check`. Observe: admin notification bell increments; refresh `/teacher/today` → "1 missing report" banner.
9. As admin, approve a teacher leave covering tomorrow. Switch to `/schedule` → tomorrow's sessions for that teacher are orange (`pending_substitute`). Click one → drawer offers reassignment.
10. Request a makeup for an absent session → approve → confirm new session row created with `original_session_id` linked.
11. Lighthouse on `/schedule` and `/teacher/today` → ≥ 90 perf, ≥ 95 a11y.
12. Public site at `alrayan-academy.com` still works, marketing pages unchanged.

---

*Last updated: May 10, 2026*
