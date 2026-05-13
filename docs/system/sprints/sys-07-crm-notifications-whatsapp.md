# SYS-07 — Leads/CRM, Notifications & WhatsApp

**Modules covered:** 2 (Leads / CRM), 15 (Notifications & Reminders), 16 (WhatsApp Groups Management)
**Duration:** 2 weeks
**Status:** Backend + frontend core implemented (2026-05-11). Tests, mobile QA, Lighthouse, and dashboard alert panel pending.
**Sprint goal:** the academy stops missing leads or reminders. Every external touch goes through wassender. Every prior sprint's queued event finally has a wire. The lead pipeline is the supervisor's daily home — they see every new public-site trial booking, drag it through the funnel, and convert to a student in two clicks.

> **Prereqs** — SYS-06 has shipped. Sessions exist (SYS-04), invoices exist (SYS-05), payrolls exist (SYS-06). All have been firing events that no one was listening to — this sprint hooks the listeners.

> **Out of scope** — auto WhatsApp group creation via wassender API (manual creation stays in v1, deferred). SMS / email fallback channel (WhatsApp only for v1). Broadcast messages (deferred).

---

## Definition of Done

### Backend
- [x] Five `sys_*` tables created: `sys_leads`, `sys_lead_follow_ups`, `sys_whatsapp_groups`, `sys_message_templates`, `sys_wassender_logs`
- [x] One FK column added to `sys_students.whatsapp_group_id` and `sys_teachers.whatsapp_group_id` (placeholder columns from SYS-03 get their FK constraint installed now)
- [x] Models: `Lead`, `LeadFollowUp`, `WhatsAppGroup`, `MessageTemplate`, `WassenderLog` — ActivityLog watched fields
- [x] Policies: `LeadPolicy` (supervisor-scoped when assigned, admin all), `WhatsAppGroupPolicy`, `MessageTemplatePolicy`
- [x] Wassender integration: `WassenderClient` (send message to group, send media), `FakeWassenderClient` for tests/dev, idempotent on `external_message_id`
- [x] Pure services: `MessageTemplateRenderer` (variable substitution + safe-HTML escape), `LeadPipelineService` (state-machine guards), `ConversionAnalytics` (lead→trial→enrolled metrics)
- [x] Compound services: `LeadFromTrialBookingConverter`, `LeadToStudentConverter`, `WassenderDispatcher` (the single fanout point for internal + external)
- [x] 28 endpoints under `/api/system/` (full table in [#endpoints](#endpoints))
- [x] Crons:
  - Every minute — dispatch session reminders for sessions inside the configured window
  - Every 5 minutes — dispatch payment reminders for invoices hitting the configured offsets
  - Every 15 minutes — dispatch report reminders (was scaffolded in SYS-04; now actually sends via wassender)
  - Every minute — sweep `sys_lead_follow_ups` with `due_at` past and fire internal notifications
- [x] Listeners wired (all queue-based, `notifications` queue):
  - `OnInvoiceCreated` → send WhatsApp payment link to student group
  - `OnInvoicePaid` → push internal notification to admins + payment-received WhatsApp to the student group
  - `OnStudentStatusChanged` (paused/suspended) → notify teacher group + admin
  - `OnTeacherLeaveApproved` → notify admins (already partially from SYS-03; now also goes to the teacher's group)
  - `OnTrialBookingCreated` (public-site Sprint 4 event) → creates `sys_leads` row + admin notification
  - `OnStudentEnrolled` (status flips from Trial → Active first time) → welcome message
- [x] Every external send writes a `sys_wassender_logs` row with status / error / payload; failures retry 3x then dead-letter
- [x] All 12 internal notification types (per Module 15 spec) emit `sys_notifications` rows with the right recipients + dedupe windows

### Frontend
- [x] `/leads` — Kanban board with 6 columns (New / Contacted / Trial Booked / Trial Completed / Enrolled / Lost), drag to move; alternate "Table view" toggle
- [x] `/leads/new` — admin manually creates a lead (most leads come from the public-site trial form, but manual entry is needed for WhatsApp inbound)
- [x] `/leads/[id]` — full-page detail: contact info, source, follow-ups timeline, internal notes, "Convert to student" CTA, "Mark lost" CTA with reason picker
- [ ] **Convert to student** sheet pre-fills the SYS-03 student form with lead data; on save it back-fills `sys_students.lead_id` *(deferred — ConvertToStudentSheet.tsx not yet built)*
- [x] **Mark lost** dialog requires a reason (Price · Schedule · Teacher · No response · Personal · Other) + optional notes
- [x] **Follow-up scheduler** on lead detail: pick date + action + optional note; appears in dashboard alerts on due date
- [x] `/leads/analytics` — conversion funnel chart, per-source breakdown, per-supervisor conversion rate, trends over time
- [x] `/whatsapp-groups` — table of all groups, status filter, "+ Register group" sheet, link out to student/teacher
- [ ] **Inline group field on student profile** (already from SYS-03 as text) — upgraded to a real `<WhatsAppGroupPicker>` that creates or links to a `sys_whatsapp_groups` row *(deferred)*
- [x] `/notifications` — internal notifications inbox: full history, mark read/unread per row, mark-all-read
- [x] `/notifications/delivery-log` — wassender delivery log: filter by template key + status; click row → drawer with rendered message, retry button
- [x] `/notifications/templates` — list of all message templates, edit each with live variable-preview panel (TemplateEditor + VariableChip)
- [x] Settings → per-role notification preferences panel (PreferenceMatrix, grouped by category, mute/unmute types)
- [x] Settings → Integrations → wassender — API key, instance ID, enabled toggle, test-connection button
- [ ] Dashboard alerts panel populated with real counts from `sys_notifications` *(deferred — dashboard widget not yet wired)*
- [ ] Mobile QA at 375px: Kanban becomes a stacked single-column view; lead detail readable
- [ ] Lighthouse on `/leads` and `/notifications` ≥ 90 perf, ≥ 95 a11y
- [ ] `scripts/check-system-isolation.sh` still passes

### Quality
- [ ] Unit tests for `MessageTemplateRenderer`, `LeadPipelineService`, `ConversionAnalytics`, `LeadFromTrialBookingConverter`
- [ ] Mocked feature tests for `WassenderClient` (no live HTTP)
- [ ] Feature tests for every endpoint
- [ ] Listener integration tests: trigger source event → verify queued job → verify wassender log + internal notification
- [ ] Cron tests with `Carbon::setTestNow()`
- [ ] Playwright covers the 9 acceptance flows below
- [ ] Coverage on services in this sprint ≥ 90%

### Acceptance flows (Playwright)

1. **Trial booking → lead** — submit a trial booking on the public site (or via `trial_bookings` factory) → background job runs → `sys_leads` row appears as `New` → admin notification fires → admin sees on `/dashboard` alerts panel and on `/leads`.
2. **Drag through pipeline** — drag the lead from New → Contacted → Trial Booked → Trial Completed → Enrolled; each move logs an audit entry; lost-only transition blocked from Enrolled.
3. **Convert to student** — open the lead → "Convert to student" → form pre-filled → save → `sys_students` row created, `sys_leads.status='enrolled'`, `sys_students.lead_id` set.
4. **Mark lost** — open the lead → "Mark lost" → pick reason "Price" → save → status flips, reason recorded, lead disappears from active pipeline.
5. **Follow-up reminder fires** — schedule a follow-up for now + 1 minute → wait → admin notification appears on the bell and on `/dashboard` alerts.
6. **Session reminder sent** — Tinker-create a session 60 minutes from now (matches reminder offset) → cron runs → wassender log shows two outbound messages (student group + teacher group) → rendered with template variables.
7. **Payment reminder sent** — invoice with due_at = tomorrow → cron runs → wassender log shows reminder sent to student's group; second-day-after-due reminder also fires on the right schedule.
8. **Template edit** — change "session_reminder" template body → save → next scheduled send uses the new body (verified via the rendered message in the wassender log).
9. **No-WhatsApp-group alert** — active student with `whatsapp_group_id=null` → dashboard alerts panel shows count + link → click → see filtered students list.

---

## Story breakdown

### S7-01 — Migrations  *(1 day)*

Six migrations dated `2026_08_24_*`.

**`2026_08_24_000001_create_sys_whatsapp_groups_table.php`**

```php
Schema::create('sys_whatsapp_groups', function (Blueprint $t) {
    $t->id();
    $t->enum('type', ['student', 'teacher']);
    $t->string('invite_link', 500);
    $t->enum('status', ['active', 'stopped'])->default('active');
    $t->string('external_group_id', 100)->nullable();    // wassender's chat ID if available
    $t->foreignId('linked_student_id')->nullable()->constrained('sys_students')->nullOnDelete();
    $t->foreignId('linked_teacher_id')->nullable()->constrained('sys_teachers')->nullOnDelete();
    $t->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
    $t->softDeletes();
    $t->timestamps();
    $t->index(['status', 'type']);
    $t->index(['linked_student_id']);
    $t->index(['linked_teacher_id']);
});
```

**`2026_08_24_000002_add_whatsapp_group_fks_to_students_and_teachers.php`** — installs the actual FK on the placeholder columns from SYS-03:

```php
Schema::table('sys_students', function (Blueprint $t) {
    $t->foreign('whatsapp_group_id')->references('id')->on('sys_whatsapp_groups')->nullOnDelete();
});
Schema::table('sys_teachers', function (Blueprint $t) {
    $t->foreign('whatsapp_group_id')->references('id')->on('sys_whatsapp_groups')->nullOnDelete();
});
```

(`whatsapp_group_link` and `whatsapp_group_status` columns from SYS-03's compromise solution are migrated into proper `sys_whatsapp_groups` rows by a data migration in step 7 below.)

**`2026_08_24_000003_create_sys_leads_table.php`**

```php
Schema::create('sys_leads', function (Blueprint $t) {
    $t->id();
    $t->string('name');
    $t->string('email')->nullable();
    $t->string('phone', 32)->nullable();
    $t->string('whatsapp', 32)->nullable();
    $t->string('country', 2)->nullable();
    $t->foreignId('course_interest_id')->nullable()->constrained('courses')->nullOnDelete();
    $t->enum('source', [
        'google_ads', 'facebook_ads', 'instagram_ads', 'whatsapp_direct',
        'student_referral', 'website_form', 'manual_entry',
    ]);
    $t->string('source_detail')->nullable();             // campaign ID, referrer name, etc.
    $t->enum('status', ['new', 'contacted', 'trial_booked', 'trial_completed', 'enrolled', 'lost'])->default('new');
    $t->enum('lost_reason', ['price','schedule','teacher','no_response','personal','quality','other'])->nullable();
    $t->text('lost_notes')->nullable();
    $t->foreignId('assigned_supervisor_id')->nullable()->constrained('users')->nullOnDelete();
    $t->foreignId('trial_booking_id')->nullable()->constrained('trial_bookings')->nullOnDelete();
    $t->foreignId('converted_to_student_id')->nullable()->constrained('sys_students')->nullOnDelete();
    $t->json('payload')->nullable();                     // raw form / referral data
    $t->softDeletes();
    $t->timestamps();
    $t->index(['status']);
    $t->index(['assigned_supervisor_id', 'status']);
    $t->index(['source']);
    $t->fullText(['name', 'email', 'phone', 'whatsapp']);
});
```

**`2026_08_24_000004_create_sys_lead_follow_ups_table.php`**

```php
Schema::create('sys_lead_follow_ups', function (Blueprint $t) {
    $t->id();
    $t->foreignId('lead_id')->constrained('sys_leads')->cascadeOnDelete();
    $t->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
    $t->timestamp('due_at');
    $t->string('action', 200);                           // "Call back", "Send WhatsApp", "Follow up trial"
    $t->text('notes')->nullable();
    $t->timestamp('completed_at')->nullable();
    $t->text('completion_notes')->nullable();
    $t->timestamps();
    $t->index(['lead_id', 'due_at']);
    $t->index(['due_at', 'completed_at']);               // for the due-soon cron
});
```

**`2026_08_24_000005_create_sys_message_templates_table.php`**

```php
Schema::create('sys_message_templates', function (Blueprint $t) {
    $t->id();
    $t->string('key', 80)->unique();                     // 'session_reminder', 'payment_due', 'welcome'
    $t->enum('channel', ['whatsapp', 'email']);          // email mostly for parity; v1 uses whatsapp for all of these
    $t->string('label', 120);                            // human-readable
    $t->string('subject', 200)->nullable();              // email-only
    $t->text('body');                                    // with {variables}
    $t->json('available_variables');                     // array of supported {var} names per template
    $t->boolean('is_active')->default(true);
    $t->timestamps();
});
```

**`2026_08_24_000006_create_sys_wassender_logs_table.php`**

```php
Schema::create('sys_wassender_logs', function (Blueprint $t) {
    $t->id();
    $t->string('template_key', 80)->nullable();
    $t->foreignId('whatsapp_group_id')->nullable()->constrained('sys_whatsapp_groups')->nullOnDelete();
    $t->string('recipient_phone', 32)->nullable();       // if not group-targeted
    $t->text('rendered_message');
    $t->enum('status', ['queued', 'sending', 'sent', 'failed', 'dead'])->default('queued');
    $t->string('external_message_id', 120)->nullable()->unique();
    $t->unsignedTinyInteger('attempt_count')->default(0);
    $t->string('error', 500)->nullable();
    $t->json('payload')->nullable();
    $t->timestamp('sent_at')->nullable();
    $t->timestamps();
    $t->index(['template_key', 'sent_at']);
    $t->index(['status', 'created_at']);
});
```

**`2026_08_24_000007_migrate_whatsapp_links_to_groups.php`** — data migration that takes SYS-03's text `whatsapp_group_link` + `whatsapp_group_status` columns on students/teachers, creates corresponding `sys_whatsapp_groups` rows, sets the FK, then drops the old columns.

#### `sys_settings` keys added

```php
'wassender.api_key'          => '',
'wassender.instance_id'      => '',
'wassender.webhook_url'      => '/api/system/webhooks/wassender',
'reminders.session.before_minutes'     => 60,
'reminders.payment.before_due_days'    => [3, 1],         // multiple offsets
'reminders.payment.on_due'             => true,
'reminders.payment.after_due_days'     => [1, 3, 7],
'reminders.report.after_hours'         => 24,
'reminders.lead_followup_before_min'   => 0,              // notify on the dot
'notifications.dedupe.window_hours'    => 24,             // generic dedupe window
```

#### Permissions

The `notifications.*`, `whatsapp.*`, and `leads.*` permission groups from SYS-02 are refined:

```php
'leads'         => ['view', 'view_any', 'create', 'edit', 'assign', 'delete', 'convert', 'mark_lost'],
'lead_followups'=> ['view', 'create', 'edit', 'complete', 'delete'],
'whatsapp'      => ['view', 'register_group', 'edit_group', 'stop_group'],
'notifications' => ['view', 'edit_templates', 'view_delivery_log', 'edit_preferences'],
```

---

### S7-02 — Models, factories, policies  *(0.5 day)*

#### Models

**`Lead`**:

```php
class Lead extends Model
{
    use SoftDeletes, LogsActivity;
    protected $table = 'sys_leads';
    protected $guarded = [];
    protected $casts = ['payload' => 'array'];

    public function followUps()          { return $this->hasMany(LeadFollowUp::class)->latest('due_at'); }
    public function trialBooking()       { return $this->belongsTo(\App\Models\TrialBooking::class); }
    public function convertedToStudent() { return $this->belongsTo(Student::class, 'converted_to_student_id'); }
    public function supervisor()         { return $this->belongsTo(User::class, 'assigned_supervisor_id'); }
    public function courseInterest()     { return $this->belongsTo(Course::class); }

    public function scopeActive($q)  { return $q->whereNotIn('status', ['enrolled','lost']); }

    public function getActivitylogOptions(): LogOptions {
        return LogOptions::defaults()
            ->logOnly(['status','lost_reason','assigned_supervisor_id','converted_to_student_id'])
            ->logOnlyDirty();
    }
}
```

`LeadFollowUp`, `WhatsAppGroup`, `MessageTemplate`, `WassenderLog` follow the standard pattern. `MessageTemplate` has a helper `render(array $variables)` that delegates to `MessageTemplateRenderer`.

#### Policies

`LeadPolicy`:

```php
public function viewAny(User $u) { return $u->can('leads.view') || $u->can('leads.view_any'); }
public function view(User $u, Lead $l)
{
    if ($u->role === 'admin') return true;
    if ($u->can('leads.view_any')) return true;
    return $l->assigned_supervisor_id === $u->id && $u->can('leads.view');
}
public function update(User $u, Lead $l)
{
    return ($u->role === 'admin' || $l->assigned_supervisor_id === $u->id) && $u->can('leads.edit');
}
public function convert(User $u, Lead $l)
{
    return $this->view($u, $l) && $u->can('leads.convert');
}
public function markLost(User $u, Lead $l)
{
    return $this->view($u, $l) && $u->can('leads.mark_lost');
}
public function assign(User $u, Lead $l)
{
    return $u->can('leads.assign');                       // typically admin only
}
```

`WhatsAppGroupPolicy` — anyone with `whatsapp.view` can read; mutations require `whatsapp.register_group` / `whatsapp.edit_group` / `whatsapp.stop_group`.

`MessageTemplatePolicy` — read for anyone with `notifications.view`; edit only `notifications.edit_templates`.

#### Factories

`LeadFactory` with states: `new()`, `contacted()`, `trialBooked()`, `enrolled()`, `lost()`. `LeadFollowUpFactory`. `WhatsAppGroupFactory` (student or teacher type). `MessageTemplateFactory` — and a *seeder* (`MessageTemplateSeeder`, idempotent, runs in baseline migration) that creates one row per known key:

| Key | Label | Channel |
|---|---|---|
| `welcome_student` | Welcome message to new student | whatsapp |
| `session_reminder_student` | Session reminder — student group | whatsapp |
| `session_reminder_teacher` | Session reminder — teacher group | whatsapp |
| `payment_due_soon` | Payment due in N days | whatsapp |
| `payment_due_today` | Payment due today | whatsapp |
| `payment_overdue` | Payment overdue | whatsapp |
| `payment_received` | Payment confirmation | whatsapp |
| `report_overdue_teacher` | Submit session report reminder | whatsapp |
| `student_paused_teacher` | Student paused — sessions on hold | whatsapp |
| `student_suspended_teacher` | Student suspended | whatsapp |
| `teacher_leave_admin` | Teacher leave needs review | whatsapp |
| `lead_followup_internal` | Internal lead follow-up reminder | (internal only, no wassender) |

Each row's `body` contains a sensible default — see [Templates section](#default-templates).

`SystemDemoSeeder` extends to seed:

- 8 leads in various pipeline stages
- 2–3 follow-ups per lead, mix of past/future/completed
- WhatsApp groups for every existing demo student + teacher
- 30 days of wassender logs (mostly `sent`, a few `failed`)

---

### S7-03 — Wassender integration  *(1.5 days)*

#### Service: `App\Services\Integrations\Wassender\WassenderClient`

```php
class WassenderClient
{
    public function __construct(
        private string $apiKey,
        private string $instanceId,
        private HttpClient $http,
    ) {}

    public function sendToGroup(WhatsAppGroup $group, string $message): WassenderSendResult
    {
        $res = $this->http
            ->withToken($this->apiKey)
            ->retry(3, 1500, throw: false)
            ->post("https://api.wassender.com/v1/instances/{$this->instanceId}/messages", [
                'type'          => 'text',
                'group_invite'  => $group->invite_link,        // wassender accepts either group id or invite link
                'message'       => $message,
            ]);
        if (!$res->successful()) {
            return WassenderSendResult::failed($res->status(), $res->body());
        }
        $body = $res->json();
        return WassenderSendResult::sent(externalId: $body['message_id'] ?? null);
    }

    public function sendToPhone(string $phone, string $message): WassenderSendResult { /* direct number */ }
}
```

`FakeWassenderClient` — used in CI and when `WASSENDER_ENABLED=false`. Returns a synthetic `external_message_id` and logs the would-be send to `sys_wassender_logs` as `sent`. The fake never delays; the real client always queues.

The actual wassender API spec differs slightly per provider — `WassenderClient` is the single integration boundary, so a different provider is a one-file swap (akin to the SYS-04 `ZoomClient` and SYS-05 `PaymobClient` patterns).

#### Service: `App\Services\System\WassenderDispatcher`

The single fanout point. Every outbound message goes through here.

```php
class WassenderDispatcher
{
    public function __construct(
        private WassenderClient $client,
        private MessageTemplateRenderer $renderer,
    ) {}

    public function sendTemplate(string $templateKey, WhatsAppGroup $group, array $variables): WassenderLog
    {
        $template = MessageTemplate::where('key', $templateKey)->where('is_active', true)->firstOrFail();
        $rendered = $this->renderer->render($template, $variables);

        $log = WassenderLog::create([
            'template_key'     => $templateKey,
            'whatsapp_group_id'=> $group->id,
            'rendered_message' => $rendered,
            'status'           => 'queued',
            'payload'          => ['variables' => $variables],
        ]);
        SendWassenderMessage::dispatch($log->id)->onQueue('notifications');
        return $log;
    }
}
```

#### Job: `SendWassenderMessage`

Loads the log, marks `sending`, calls the client, marks `sent` or `failed`, retries on transient errors (up to 3 attempts via Laravel's `tries`), dead-letters after that with `status=dead`.

#### Settings panel

`/settings/integrations/wassender/page.tsx` — same shape as the Paymob panel in SYS-05: API key, instance id, webhook URL, test-connection button (sends a "Test ✓ Alrayan Academy" message to a chosen group).

---

### S7-04 — Message templates  *(1 day)*

#### Pure renderer

`App\Services\System\MessageTemplateRenderer`:

```php
class MessageTemplateRenderer
{
    public function render(MessageTemplate $t, array $variables): string
    {
        $allowed = $t->available_variables ?? [];
        $out = $t->body;
        foreach ($allowed as $name) {
            $value = $this->safe($variables[$name] ?? '');
            $out = str_replace('{' . $name . '}', $value, $out);
        }
        // Strip any remaining {tokens} so users never see them
        $out = preg_replace('/\{[a-z_]+\}/i', '', $out);
        return trim($out);
    }

    private function safe(string $v): string
    {
        // wassender accepts plain text; we strip control chars and trim
        return preg_replace('/[\x00-\x1F\x7F]/u', '', $v);
    }
}
```

Unit-tested for: every supported variable, missing variable → empty, unknown variable left in body → stripped, special chars escaped.

#### Available variables per template

Embedded in the migration seed (and editable via Settings → Templates). Examples:

| Key | Variables |
|---|---|
| `session_reminder_student` | `{student_name}, {teacher_name}, {session_time_local}, {course_name}, {zoom_join_url}` |
| `session_reminder_teacher` | `{teacher_name}, {student_name}, {session_time_local}, {course_name}, {zoom_start_url}, {duration_min}` |
| `payment_due_soon` | `{student_name}, {invoice_number}, {amount_with_currency}, {due_date}, {payment_link}` |
| `welcome_student` | `{student_name}, {academy_name}, {assigned_teacher}, {first_session_time}` |
| `report_overdue_teacher` | `{teacher_name}, {student_name}, {session_time_local}` |
| `teacher_leave_admin` | `{teacher_name}, {start_date}, {end_date}, {affected_sessions_count}` |

#### Template editor UI

`/notifications/templates/page.tsx` lists templates; click → editor:

```
┌──────────────────────────────────────────────────────────────────────┐
│ session_reminder_student                                             │
│ Session reminder — student group                                     │
├──────────────────────────────────────────────────────────────────────┤
│ Available variables                                                  │
│   {student_name}   {teacher_name}   {session_time_local}             │
│   {course_name}    {zoom_join_url}                                   │
│                                                                      │
│ Body                                                                 │
│ ┌──────────────────────────────────────────────────────────────────┐│
│ │ Assalamu alaikum {student_name}! Reminder: your {course_name}    ││
│ │ class with {teacher_name} starts at {session_time_local}.        ││
│ │ Join here: {zoom_join_url}                                       ││
│ └──────────────────────────────────────────────────────────────────┘│
│                                                                      │
│ Live preview                                                         │
│ ┌──────────────────────────────────────────────────────────────────┐│
│ │ Assalamu alaikum Sarah Ahmed! Reminder: your Tajweed class with  ││
│ │ Sh. Hassan starts at 18:00 EDT. Join here: https://zoom.us/j/... ││
│ └──────────────────────────────────────────────────────────────────┘│
│                                                                      │
│ Active:  [⬤ ON]                                                      │
│                                              [Cancel]  [Save changes]│
└──────────────────────────────────────────────────────────────────────┘
```

Live preview uses a fixture of dummy variable values stored in the template (`available_variables` is an array of names; a parallel `example_values` JSON column on the template stores realistic samples for preview).

---

### S7-05 — Lead pipeline UI  *(2 days)*

#### Kanban

`/leads/page.tsx` renders 6 columns. Each column is a vertically-scrolling list of lead cards. Drag-and-drop uses `dnd-kit` (already in tech stack).

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Leads                                            View: [Kanban] [Table]  │
│ 12 new · 8 contacted · 5 trial booked · 3 trial completed · 42 enrolled  │
├──────────────────────────────────────────────────────────────────────────┤
│ [Source ▾]  [Supervisor ▾]  [Course ▾]  [ Search…              ⌘K ]      │
├─────────┬──────────┬──────────┬──────────┬──────────┬────────────────────┤
│  NEW    │ CONTACT. │ TRIAL B. │ TRIAL C. │ ENROLLED │   LOST             │
│ ──────  │ ──────   │ ──────   │ ──────   │ ──────   │   ──────           │
│ Sarah   │ Yusuf K. │ Aisha R. │ Omar I.  │ Maryam   │   Hassan A.        │
│ FB Ads  │ WhatsApp │ Site     │ Ref.     │ FB Ads   │   Reason: Price    │
│ 2h ago  │ 1d ago   │ 3d ago   │ 5d ago   │ 1w ago   │   1w ago           │
│         │          │          │          │          │                    │
│ Mohd    │ Yasir    │ Salma    │ …        │ …        │                    │
│ Google  │ Site     │ WhatsApp │          │          │                    │
└─────────┴──────────┴──────────┴──────────┴──────────┴────────────────────┘
```

Each card shows: name, source badge, time since last activity, course-interest chip, follow-up indicator (orange dot if a follow-up is overdue, green if scheduled in the future).

Drag-to-column emits `PATCH /api/system/leads/{id}` with `{status: 'contacted'}`. The `LeadPipelineService` enforces the transition guards:

- Forward transitions always allowed.
- Backward transitions: blocked unless admin (with confirm dialog).
- `enrolled` is locked unless explicitly via the Convert flow.
- `lost` is reachable from any non-enrolled state but requires reason.

Conflict — moving to `enrolled` via drag: redirects to the Convert sheet instead of just flipping the status, since a real student row must be created.

#### Table view

For when there are too many leads to Kanban comfortably. Same DataTable primitive as students — sortable, filterable, with bulk actions (`bulk-assign`, `bulk-mark-lost`).

#### Lead detail page

`/leads/[id]/page.tsx`:

```
[← Leads]  Sarah Ahmed                                  ● Contacted [⋮]
           Facebook Ads · USA · interested in Tajweed
─────────────────────────────────────────────────────────────────────────
[ Profile ] [ Follow-ups (2) ] [ Notes (1) ] [ History ]

  Contact                                Source detail
   Email     sarah@example.com           Campaign  AlrayanFB_USA_July
   Phone     +1-202-555-0142             First seen Jun 12, 2026
   WhatsApp  +1-202-555-0142             Trial booking: TB-2026-0042

  Assignment
   Supervisor:  [Omar Khaled ▾]          [+ Schedule follow-up]
                                          [Convert to student]
                                          [Mark lost]
```

The `Trial booking: TB-2026-0042` line links to the original public-site trial booking record — useful when the supervisor wants to see the raw form submission.

#### Convert to student sheet

Reuses the SYS-03 student form as a sheet/wizard. Lead data pre-fills name, contact, country, course interest. Operator fills in the remaining fields (timezone, sessions/month, duration, price, parent info if child). On submit:

1. Create `sys_students` row.
2. Update `sys_leads`: `status='enrolled'`, `converted_to_student_id`.
3. Audit log + timeline entry on the new student ("Created from lead {id}").
4. Don't auto-create an advance invoice — that's still a deliberate admin step (SYS-05 flow).

---

### S7-06 — Trial booking → lead converter  *(0.5 day)*

The public-site Sprint 4 emits a `TrialBookingCreated` event when a visitor submits the trial form. SYS-07 wires a listener:

```php
// app/Listeners/System/CreateLeadFromTrialBooking.php
public function handle(\App\Events\TrialBookingCreated $event): void
{
    $tb = $event->trialBooking;
    if (Lead::where('trial_booking_id', $tb->id)->exists()) return;

    $lead = Lead::create([
        'name'        => $tb->name,
        'email'       => $tb->email,
        'phone'       => $tb->phone,
        'whatsapp'    => $tb->whatsapp ?? $tb->phone,
        'country'     => $tb->country,
        'source'      => 'website_form',
        'source_detail'=> $tb->meta['utm_source'] ?? null,
        'status'      => 'new',
        'trial_booking_id' => $tb->id,
        'payload'     => $tb->only(['preferred_time','age_group','message','utm_*']),
    ]);

    NotificationService::pushToAdminsAndSupervisors('lead.created',
        "New lead: {$lead->name} from {$lead->source}", null, "/leads/{$lead->id}");
}
```

Subscribed in `App\Providers\EventServiceProvider`. Test: trigger the event with a fixture trial booking → lead row exists → notification fires.

> **Two-way navigation.** The public site's admin (Filament, when SYS-08 lands or already from site Sprint 7) shows `TrialBooking → Lead → Student` linkage so an operator can navigate from any of the three to the others. In v1 we just store the FK; the cross-link UI is in the lead detail page's "Trial booking" badge.

---

### S7-07 — Lead follow-ups  *(1 day)*

#### Endpoints

```
POST   /api/system/leads/{id}/follow-ups            perm: lead_followups.create
PATCH  /api/system/lead-follow-ups/{id}             perm: lead_followups.edit
POST   /api/system/lead-follow-ups/{id}/complete    perm: lead_followups.complete  body: { completion_notes? }
DELETE /api/system/lead-follow-ups/{id}             perm: lead_followups.delete
GET    /api/system/leads/{id}/follow-ups            perm: leads.view
```

#### UI

Lead detail "Follow-ups" tab:

```
┌──────────────────────────────────────────────────────────────────┐
│ Follow-ups                                       [+ Schedule]    │
├──────────────────────────────────────────────────────────────────┤
│ ⏰ Jul 15, 14:00     Call back                                    │
│   Notes: discuss schedule options                                │
│                                            [Complete] [Edit] [×] │
│                                                                  │
│ ✓ Jul 10, 10:00      Sent intro WhatsApp        (done Jul 10)    │
│   Completion: replied positively, scheduling trial               │
└──────────────────────────────────────────────────────────────────┘
```

#### Cron: lead-follow-up reminders

`app/Console/Commands/System/SweepDueLeadFollowUps.php` runs every minute:

```php
public function handle(): int
{
    $now = now();
    $window = $now->copy()->addMinutes((int) Setting::get('reminders.lead_followup_before_min', 0));
    $due = LeadFollowUp::query()
        ->whereNull('completed_at')
        ->where('due_at', '<=', $window)
        ->where('due_at', '>=', $now->copy()->subHour())   // don't spam old missed ones
        ->whereDoesntHave('reminderNotifications')         // dedupe via dedicated query
        ->limit(200)->get();

    foreach ($due as $f) {
        $lead = $f->lead;
        $recipient = $lead->assigned_supervisor_id ? User::find($lead->assigned_supervisor_id) : null;
        if ($recipient) {
            NotificationService::push($recipient, 'lead.followup_due',
                "Follow up with {$lead->name}: {$f->action}",
                null, "/leads/{$lead->id}");
        } else {
            NotificationService::pushToAdmins('lead.followup_due_unassigned',
                "Unassigned lead follow-up due: {$lead->name}", null, "/leads/{$lead->id}");
        }
    }
    return self::SUCCESS;
}
```

Dedupe: `NotificationService::push` checks for an existing unread notification with the same `(user, type, link)` in the configured `notifications.dedupe.window_hours` window before creating a new one.

---

### S7-08 — Conversion analytics  *(1 day)*

`App\Services\System\ConversionAnalytics` — pure service that computes funnel + per-segment rates.

```php
public function funnel(Carbon $from, Carbon $to): FunnelReport
{
    $leads     = Lead::whereBetween('created_at', [$from, $to])->count();
    $contacted = Lead::whereBetween('created_at', [$from, $to])
        ->whereIn('status', ['contacted','trial_booked','trial_completed','enrolled','lost'])->count();
    $trials    = Lead::whereBetween('created_at', [$from, $to])
        ->whereIn('status', ['trial_completed','enrolled'])->count();
    $enrolled  = Lead::whereBetween('created_at', [$from, $to])->where('status','enrolled')->count();
    return new FunnelReport($leads, $contacted, $trials, $enrolled);
}

public function bySource(Carbon $from, Carbon $to): Collection
{
    return Lead::query()
        ->selectRaw('source, count(*) as total, sum(case when status="enrolled" then 1 else 0 end) as enrolled')
        ->whereBetween('created_at', [$from, $to])
        ->groupBy('source')->get();
}

public function bySupervisor(Carbon $from, Carbon $to): Collection { /* ... */ }
public function trendDaily(Carbon $from, Carbon $to): Collection   { /* daily counts: leads, trials, enrolled */ }
```

#### `/leads/analytics/page.tsx`

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Lead analytics                                          [Last 30 days ▾] │
├──────────────────────────────────────────────────────────────────────────┤
│ Funnel                                                                   │
│   Leads     ████████████████████████████████████████  150                │
│   Contacted ████████████████████████████              98   (65%)         │
│   Trials    ███████████████                           45   (30%)         │
│   Enrolled  ██████████                                30   (20%)         │
│                                                                          │
│ By source                                                                │
│   Facebook Ads     60  → 12 enrolled (20%)                               │
│   Google Ads       45  → 10 enrolled (22%)                               │
│   Website form     25  →  6 enrolled (24%)                               │
│   Referrals        15  →  2 enrolled (13%)                               │
│   WhatsApp direct   5  →  0 enrolled (0%)                                │
│                                                                          │
│ By supervisor                                                            │
│   Omar Khaled     80 assigned → 18 enrolled (22%)                        │
│   Sarah Ahmed     70 assigned → 12 enrolled (17%)                        │
│                                                                          │
│ Daily trend                                                              │
│   [Recharts area chart: leads / trials / enrolled per day]               │
└──────────────────────────────────────────────────────────────────────────┘
```

Endpoint: `GET /api/system/leads/analytics?from=YYYY-MM-DD&to=YYYY-MM-DD`. Cached for 5 minutes per range (Redis).

---

### S7-09 — WhatsApp groups CRUD  *(1 day)*

#### Endpoints

```
GET    /api/system/whatsapp-groups                      perm: whatsapp.view
GET    /api/system/whatsapp-groups/{id}                 perm: whatsapp.view
POST   /api/system/whatsapp-groups                      perm: whatsapp.register_group
PATCH  /api/system/whatsapp-groups/{id}                 perm: whatsapp.edit_group
POST   /api/system/whatsapp-groups/{id}/stop            perm: whatsapp.stop_group
POST   /api/system/whatsapp-groups/{id}/reactivate      perm: whatsapp.edit_group
```

#### UI

`/whatsapp-groups/page.tsx`:

```
┌──────────────────────────────────────────────────────────────────────────┐
│ WhatsApp groups                                  [+ Register group]      │
│ 124 active · 6 stopped · 8 active students missing a group               │
├──────────────────────────────────────────────────────────────────────────┤
│ [Type ▾]  [Status ▾]  [ Search by linked name…                   ⌘K ]    │
├──────────────────────────────────────────────────────────────────────────┤
│  Type      Linked to             Status    Invite link             Acts  │
│  Student   Sarah Ahmed           ● Active  wa.me/chat/...    [Open][⋮]   │
│  Student   Yusuf Khan            ● Active  wa.me/chat/...    [Open][⋮]   │
│  Teacher   Sh. Hassan            ● Stopped wa.me/chat/...    [Open][⋮]   │
└──────────────────────────────────────────────────────────────────────────┘
```

The header includes the "8 active students missing a group" link — clicks through to `/students?no_whatsapp=1`.

#### Registration sheet

```
Register WhatsApp group
─────────────────────────────────
Type:                  ( ) Student    (●) Teacher
Linked to:             [Search teacher…             ]
Invite link:           [ https://chat.whatsapp.com/… ]
Status:                (●) Active   ( ) Stopped
                                          [Cancel] [Register]
```

On save, links the FK on the student/teacher row and persists the group. Audit log entry.

#### Inline group picker on student/teacher profile

Replaces the SYS-03 placeholder text fields with a real combobox:

- Existing group: search → pick → link.
- New group: open registration sheet inline.
- Show status badge + "Open WhatsApp" deep link.

---

### S7-10 — Session reminder cron  *(1 day)*

The wassender wire SYS-04 deferred. `app/Console/Commands/System/DispatchSessionReminders.php` runs every minute:

```php
public function handle(WassenderDispatcher $wa): int
{
    $offset = (int) Setting::get('reminders.session.before_minutes', 60);
    $window = now()->addMinutes($offset);

    $sessions = Session::query()
        ->where('status', 'scheduled')
        ->whereBetween('scheduled_start', [$window->copy()->subMinute(), $window->copy()->addMinute()])
        ->with(['student.whatsappGroup', 'teacher.whatsappGroup'])
        ->whereDoesntHave('reminderLogs')
        ->limit(500)->get();

    foreach ($sessions as $s) {
        if (!in_array($s->student->status, ['active','trial'], true)) continue;   // skip paused/suspended

        if ($s->student->whatsapp_group_id) {
            $wa->sendTemplate('session_reminder_student', $s->student->whatsappGroup, [
                'student_name'        => $s->student->name,
                'teacher_name'        => $s->teacher->user->name,
                'session_time_local'  => $s->scheduled_start->setTimezone($s->student->timezone)->format('H:i T'),
                'course_name'         => $s->student->course->name ?? '',
                'zoom_join_url'       => $s->zoom_join_url ?? '',
            ]);
        }
        if ($s->teacher->whatsapp_group_id) {
            $wa->sendTemplate('session_reminder_teacher', $s->teacher->whatsappGroup, [
                'teacher_name'        => $s->teacher->user->name,
                'student_name'        => $s->student->name,
                'session_time_local'  => $s->scheduled_start->setTimezone($s->teacher->user->timezone ?? 'Africa/Cairo')->format('H:i T'),
                'course_name'         => $s->student->course->name ?? '',
                'zoom_start_url'      => $s->zoom_start_url ?? '',
                'duration_min'        => $s->duration_min,
            ]);
        }
    }
    return self::SUCCESS;
}
```

Dedupe: the `reminderLogs` relation on `Session` returns `sys_wassender_logs` where `template_key='session_reminder_*'` and `payload->session_id=this.id`. Sent once per session per template.

Schedule: `$schedule->command('system:reminders:sessions')->everyMinute()->withoutOverlapping();`

---

### S7-11 — Payment reminder cron  *(1 day)*

The wassender wire SYS-05 deferred. Multiple offsets — fires for each invoice that hits any of them.

```php
public function handle(WassenderDispatcher $wa): int
{
    $beforeDays  = Setting::array('reminders.payment.before_due_days', [3, 1]);
    $afterDays   = Setting::array('reminders.payment.after_due_days', [1, 3, 7]);
    $onDue       = Setting::bool('reminders.payment.on_due', true);

    foreach ($beforeDays as $d) {
        $this->fireFor(Invoice::open()->whereDate('due_at', now()->addDays($d)->toDateString())->get(),
                       'payment_due_soon', ['days_until_due' => $d], $wa);
    }
    if ($onDue) {
        $this->fireFor(Invoice::open()->whereDate('due_at', now()->toDateString())->get(),
                       'payment_due_today', [], $wa);
    }
    foreach ($afterDays as $d) {
        $this->fireFor(Invoice::overdue()->whereDate('due_at', now()->subDays($d)->toDateString())->get(),
                       'payment_overdue', ['days_overdue' => $d], $wa);
    }
    return self::SUCCESS;
}

private function fireFor(Collection $invoices, string $tplKey, array $extra, WassenderDispatcher $wa): void
{
    foreach ($invoices as $inv) {
        if (!$inv->student->whatsapp_group_id) continue;
        if (WassenderLog::where('template_key', $tplKey)
                ->where('payload->invoice_id', $inv->id)
                ->whereDate('created_at', today())->exists()) continue;        // one-per-day cap

        $wa->sendTemplate($tplKey, $inv->student->whatsappGroup, array_merge([
            'student_name'         => $inv->student->name,
            'invoice_number'       => $inv->invoice_number,
            'amount_with_currency' => Money::format($inv->total_minor, $inv->currency),
            'due_date'             => $inv->due_at->toDateString(),
            'payment_link'         => optional($inv->paymobLink)->payment_url ?? '',
        ], $extra));
    }
}
```

Runs every 5 minutes (not every minute — daily-level resolution).

#### Invoice-created → send payment link

A separate `OnInvoiceCreated` listener sends the **first** payment-link message immediately on invoice creation (not waiting for the schedule). Uses template `payment_due_soon` (or a dedicated `invoice_created` if owner prefers — easy to add later).

---

### S7-12 — Report reminder cron + report on session-attended  *(0.5 day)*

The SYS-04 cron `CheckMissingReports` already creates *internal* notifications. SYS-07 extends it to fire WhatsApp to the teacher's group:

```php
// inside the existing CheckMissingReports::handle()
if ($s->teacher->whatsapp_group_id) {
    $wa->sendTemplate('report_overdue_teacher', $s->teacher->whatsappGroup, [
        'teacher_name'        => $s->teacher->user->name,
        'student_name'        => $s->student->name,
        'session_time_local'  => $s->scheduled_start->setTimezone($s->teacher->user->timezone ?? 'Africa/Cairo')->format('M j H:i'),
    ]);
}
```

Dedupe: same `WassenderLog` check pattern.

---

### S7-13 — Welcome message + status-change notifications  *(0.5 day)*

#### Welcome message

`OnStudentEnrolled` listener subscribes to the SYS-03 `StudentStatusChanged` event, filtered for `trial → active`:

```php
public function handle(StudentStatusChanged $event): void
{
    if ($event->from !== 'trial' || $event->to !== 'active') return;
    if (!$event->student->whatsapp_group_id) return;

    app(WassenderDispatcher::class)->sendTemplate('welcome_student',
        $event->student->whatsappGroup,
        [
            'student_name'        => $event->student->name,
            'academy_name'        => Setting::get('academy.name', 'Alrayan Academy'),
            'assigned_teacher'    => $event->student->assignedTeacher?->user->name ?? '',
            'first_session_time'  => optional($event->student->sessions()->upcoming()->first())
                                        ?->scheduled_start->setTimezone($event->student->timezone)
                                        ->format('D M j H:i T') ?? 'TBD',
        ]);
}
```

#### Status-change WhatsApp to teacher

Similar listeners on `active → paused` and `active → suspended` send to the teacher's group via `student_paused_teacher` and `student_suspended_teacher` templates.

---

### S7-14 — Internal notifications fanout  *(1 day)*

The Module 15 spec lists 12 internal-notification triggers. Six were partially scaffolded in earlier sprints (notification bell, basic push). SYS-07 finishes the wiring so every trigger actually fires.

#### `App\Services\System\NotificationService` — extended

```php
public function pushToAdmins(string $type, string $title, ?string $body = null, ?string $link = null): void
{
    User::role(['admin'])->each(fn ($u) => $this->push($u, $type, $title, $body, $link));
}

public function pushToAdminsAndSupervisors(string $type, string $title, ?string $body = null, ?string $link = null, ?string $requiredPerm = null): void
{
    User::role(['admin','supervisor'])
        ->when($requiredPerm, fn ($q) => $q->permission($requiredPerm))
        ->each(fn ($u) => $this->push($u, $type, $title, $body, $link));
}

public function push(User $u, string $type, string $title, ?string $body = null, ?string $link = null, ?array $payload = null): ?Notification
{
    if (!$this->respectsPreferences($u, $type)) return null;
    if ($this->isDuplicate($u, $type, $link)) return null;

    return Notification::create([
        'user_id' => $u->id, 'type' => $type, 'title' => $title,
        'body' => $body, 'link' => $link, 'payload' => $payload,
    ]);
}
```

`isDuplicate` checks for an existing unread notification on the same (user, type, link) within `notifications.dedupe.window_hours`. `respectsPreferences` reads the user's preference setting (next story).

#### The 12 notification types — final wire-up

| # | Type | Source event | Listener | Dedupe |
|---|---|---|---|---|
| 1 | `lead.created` | `TrialBookingCreated` | `CreateLeadFromTrialBooking` (S7-06) | (no dedupe — one per lead) |
| 2 | `lead.followup_due` | cron sweep | `SweepDueLeadFollowUps` (S7-07) | 24h per follow-up |
| 3 | `invoice.overdue` | `InvoiceOverdueCron` (SYS-05) | new `NotifyAdminsOnInvoiceOverdue` | 24h per invoice |
| 4 | `report.overdue` | `CheckMissingReports` (SYS-04) | already firing — verify | already 24h per session |
| 5 | `lead.trial_pending` | nightly sweep | new `CheckTrialFollowUpsNeeded` | 48h per lead |
| 6 | `student.absence_streak` | `OnSessionAbsent` (SYS-04) | already firing — verify | 24h per student |
| 7 | `student.auto_suspended` | `AutoSuspendNonPayers` (SYS-05) | already firing — verify | (per occurrence) |
| 8 | `student.no_whatsapp_group` | nightly sweep | new `CheckMissingWhatsAppGroups` | 24h |
| 9 | `teacher.leave_pending` | `OnTeacherLeaveCreated` (SYS-03) | already firing — verify | (per occurrence) |
| 10 | `teacher.leave_needs_reschedule` | `OnTeacherLeaveApproved` (SYS-04) | already firing — verify | (per occurrence) |
| 11 | `payroll.upcoming_due` | cron, last 3 days of month | new `NotifyAdminsOnUpcomingPayroll` | 24h |
| 12 | `payment.received` | `OnInvoicePaid` (SYS-05) | already firing — verify | (per payment) |

The "verify" notes mean: when SYS-07 starts, audit the existing listener and confirm it's actually calling `NotificationService::push`. Earlier sprints may have left `// TODO: SYS-07` markers; this is the sprint that turns them into real calls.

---

### S7-15 — Notification preferences  *(0.5 day)*

Each user can mute notification types they don't want.

#### Backend

`sys_settings` keys per user: `notifications.prefs.{user_id}` → JSON array of muted types.

```
GET /api/system/notifications/preferences        perm: notifications.edit_preferences
PUT /api/system/notifications/preferences        body: { muted_types: [] }
```

`NotificationService::respectsPreferences($user, $type)` returns false if `type` is in the muted list.

#### UI

`/settings/notifications/preferences/page.tsx` (admins also access via `/settings/notifications`):

```
┌──────────────────────────────────────────────────────────────────┐
│ Notification preferences                                         │
│ Choose which alerts you want to receive in the bell.             │
├──────────────────────────────────────────────────────────────────┤
│ Operations                                                       │
│   ☑ New lead received                                            │
│   ☑ Follow-up reminders due                                      │
│   ☑ Trial student needs follow-up                                │
│   ☐ Student absent streak                                        │
│   ☑ Student auto-suspended                                       │
│   ☑ Student without WhatsApp group                               │
│                                                                  │
│ Finance                                                          │
│   ☑ Unpaid invoices overdue                                      │
│   ☑ Payment received                                             │
│   ☑ Upcoming payroll due                                         │
│                                                                  │
│ Operations support                                               │
│   ☑ Missing session report                                       │
│   ☑ Teacher leave pending review                                 │
│   ☑ Teacher leave approved — sessions affected                   │
└──────────────────────────────────────────────────────────────────┘
[Cancel]                                              [Save preferences]
```

Save persists, takes effect immediately on the next notification push.

---

### S7-16 — Delivery log UI  *(0.5 day)*

`/notifications/delivery-log/page.tsx` — admin-facing wassender audit trail:

```
┌──────────────────────────────────────────────────────────────────────────┐
│ WhatsApp delivery log                                                    │
│ 824 sent · 12 failed · 3 dead-lettered                                   │
├──────────────────────────────────────────────────────────────────────────┤
│ [Template ▾]  [Status ▾]  [Group / phone ▾]  [Date range ▾]              │
├──────────────────────────────────────────────────────────────────────────┤
│ Sent at      Template                Recipient              Status       │
│ Jul 15 17:00 session_reminder_student Sarah Ahmed (group)   ● Sent       │
│ Jul 15 17:00 session_reminder_teacher Sh. Hassan (group)    ● Sent       │
│ Jul 15 16:32 payment_due_soon         Yusuf Khan (group)    ● Failed     │
│ …                                                                        │
└──────────────────────────────────────────────────────────────────────────┘
```

Click a row → drawer with:

- Rendered message (the actual text sent)
- Original template
- Variables used
- External message ID
- Attempt count
- Last error
- "Retry" button (admin only) — re-queues if status is `failed` or `dead`

---

### S7-17 — Tests  *(2 days)*

#### Unit

- `MessageTemplateRendererTest` — every variable substituted, missing variable empty, unknown {token} stripped, control chars stripped, edge: very long body.
- `LeadPipelineServiceTest` — every transition matrix entry; lost requires reason; enrolled blocked from drag.
- `ConversionAnalyticsTest` — empty range, fully-converted range, partial range, deterministic with `Carbon::setTestNow`.
- `LeadFromTrialBookingConverterTest` — idempotency (re-run creates no dupe), null fields tolerated.

#### Feature

- `LeadEndpointsTest` — CRUD + drag-transition + convert + mark-lost.
- `LeadAssignmentTest` — supervisor sees only own, admin sees all.
- `FollowUpTest` — schedule, complete, cron sweep, dedupe.
- `WhatsAppGroupTest` — register, stop, link to student, link to teacher, can't link group to two entities.
- `MessageTemplateTest` — read, edit, save, render preview.
- `WassenderClientTest` (mocked HTTP) — happy path, retry on 5xx, dead-letter after final fail.

#### Listener integration

- `TrialBookingToLeadTest` — fire event, assert lead created, notification fired.
- `InvoiceCreatedSendsLinkTest` — fire event, assert wassender log row exists with the template + payload.
- `StudentStatusToTeacherTest` — fire status change, assert teacher group received the right template.

#### Cron

- `SessionReminderCronTest` — Carbon-mock, session 60min out, run cron, assert two wassender logs (student + teacher), second run creates none.
- `PaymentReminderCronTest` — invoice due tomorrow, run, assert log; second run same day → no duplicate.
- `LeadFollowUpCronTest` — due follow-up creates supervisor notification; second sweep within 24h no duplicate.

#### Playwright

`frontend/e2e/system/crm-notifications.spec.ts` — 9 acceptance flows.

---

### S7-18 — Deploy + smoke  *(0.5 day)*

- Run migrations on staging.
- Run `php artisan db:seed --class=System\\SystemDemoSeeder` — adds 8 demo leads + WhatsApp groups + 30 days of wassender logs.
- Configure wassender (sandbox creds) in Settings → Integrations → wassender. Run "Test connection" → confirm a test message arrives in a test group.
- Owner walks through:
  1. Submit a fresh trial booking on the public site → confirm it appears as a `New` lead within seconds + admin notification fires.
  2. Drag the lead through the Kanban → confirm audit log + activity log.
  3. Convert to student → confirm the new student profile + lead status updated.
  4. Schedule a follow-up for now + 1 minute → wait → confirm bell notification.
  5. Manually fast-forward a session to be in the next 60-minute window → run reminder cron → confirm wassender log + actual WhatsApp message arrives (if real wassender hooked up).
  6. Set an invoice due tomorrow → run payment reminder cron → confirm WhatsApp arrives.
  7. Edit `session_reminder_student` template → next reminder cron uses the new body.
  8. Toggle a notification preference → next event of that type does not fire to that user.
  9. Browse `/notifications/delivery-log` — see all the sends, click into one, inspect the rendered message.
  10. Confirm `Lighthouse` on `/leads` and `/notifications` ≥ 90.

---

## Default templates  {#default-templates}

The `MessageTemplateSeeder` seeds these defaults. Owner can edit them anytime via Settings → Notifications → Templates.

| Key | Body |
|---|---|
| `welcome_student` | "Assalamu alaikum {student_name}! Welcome to {academy_name}. Your first session with {assigned_teacher} is at {first_session_time}. We can't wait to begin this journey with you." |
| `session_reminder_student` | "Reminder: your {course_name} session with {teacher_name} starts at {session_time_local}. Join here: {zoom_join_url}" |
| `session_reminder_teacher` | "Reminder: you have a {duration_min}-minute session with {student_name} ({course_name}) at {session_time_local}. Host link: {zoom_start_url}" |
| `payment_due_soon` | "Hello {student_name}, your invoice {invoice_number} for {amount_with_currency} is due on {due_date}. Pay here: {payment_link}" |
| `payment_due_today` | "Reminder: your invoice {invoice_number} for {amount_with_currency} is due today. Pay here: {payment_link}" |
| `payment_overdue` | "Your invoice {invoice_number} for {amount_with_currency} was due on {due_date}. Please complete payment here to avoid suspension: {payment_link}" |
| `payment_received` | "Thank you, {student_name}! We've received your payment for invoice {invoice_number}." |
| `report_overdue_teacher` | "Reminder, {teacher_name}: please submit the session report for {student_name} ({session_time_local})." |
| `student_paused_teacher` | "Heads up: {student_name}'s subscription has been paused. Their upcoming sessions are cancelled. We'll notify you when they reactivate." |
| `student_suspended_teacher` | "{student_name} has been suspended for non-payment. All upcoming sessions are cancelled until further notice." |
| `teacher_leave_admin` | "{teacher_name} requested leave from {start_date} to {end_date}. {affected_sessions_count} sessions will need rescheduling." |

---

## Endpoints {#endpoints}

| Method | Path | Permission |
|---|---|---|
| GET    | `/api/system/leads`                                           | `leads.view_any` or scoped |
| GET    | `/api/system/leads/{id}`                                      | policy |
| POST   | `/api/system/leads`                                           | `leads.create` |
| PATCH  | `/api/system/leads/{id}`                                      | `leads.edit` |
| POST   | `/api/system/leads/{id}/assign`                               | `leads.assign` |
| POST   | `/api/system/leads/{id}/convert`                              | `leads.convert` |
| POST   | `/api/system/leads/{id}/mark-lost`                            | `leads.mark_lost` |
| POST   | `/api/system/leads/bulk-assign`                               | `leads.assign` |
| GET    | `/api/system/leads/analytics`                                 | `leads.view_any` |
| GET    | `/api/system/leads/{id}/follow-ups`                           | `leads.view` |
| POST   | `/api/system/leads/{id}/follow-ups`                           | `lead_followups.create` |
| PATCH  | `/api/system/lead-follow-ups/{id}`                            | `lead_followups.edit` |
| POST   | `/api/system/lead-follow-ups/{id}/complete`                   | `lead_followups.complete` |
| DELETE | `/api/system/lead-follow-ups/{id}`                            | `lead_followups.delete` |
| GET    | `/api/system/whatsapp-groups`                                 | `whatsapp.view` |
| GET    | `/api/system/whatsapp-groups/{id}`                            | `whatsapp.view` |
| POST   | `/api/system/whatsapp-groups`                                 | `whatsapp.register_group` |
| PATCH  | `/api/system/whatsapp-groups/{id}`                            | `whatsapp.edit_group` |
| POST   | `/api/system/whatsapp-groups/{id}/stop`                       | `whatsapp.stop_group` |
| POST   | `/api/system/whatsapp-groups/{id}/reactivate`                 | `whatsapp.edit_group` |
| GET    | `/api/system/message-templates`                               | `notifications.view` |
| GET    | `/api/system/message-templates/{id}`                          | `notifications.view` |
| PATCH  | `/api/system/message-templates/{id}`                          | `notifications.edit_templates` |
| POST   | `/api/system/message-templates/{id}/preview`                  | `notifications.view` |
| GET    | `/api/system/wassender-logs`                                  | `notifications.view_delivery_log` |
| GET    | `/api/system/wassender-logs/{id}`                             | `notifications.view_delivery_log` |
| POST   | `/api/system/wassender-logs/{id}/retry`                       | `notifications.view_delivery_log` |
| GET    | `/api/system/notifications/preferences`                       | `notifications.edit_preferences` |
| PUT    | `/api/system/notifications/preferences`                       | `notifications.edit_preferences` |
| POST   | `/api/system/integrations/wassender/test`                     | `settings.edit` |

---

## File deliverables checklist

```
backend/
├── app/
│   ├── Console/Commands/System/
│   │   ├── DispatchSessionReminders.php
│   │   ├── DispatchPaymentReminders.php
│   │   ├── SweepDueLeadFollowUps.php
│   │   ├── CheckTrialFollowUpsNeeded.php
│   │   ├── CheckMissingWhatsAppGroups.php
│   │   └── NotifyAdminsOnUpcomingPayroll.php
│   ├── Http/Controllers/System/
│   │   ├── LeadController.php
│   │   ├── LeadFollowUpController.php
│   │   ├── LeadAnalyticsController.php
│   │   ├── WhatsAppGroupController.php
│   │   ├── MessageTemplateController.php
│   │   ├── WassenderLogController.php
│   │   ├── WassenderIntegrationController.php
│   │   └── NotificationPreferencesController.php
│   ├── Http/Requests/System/
│   │   ├── Lead/{Store,Update,Assign,Convert,MarkLost,BulkAssign}Request.php
│   │   ├── LeadFollowUp/{Store,Update,Complete}Request.php
│   │   ├── WhatsAppGroup/{Store,Update}Request.php
│   │   ├── MessageTemplate/UpdateRequest.php
│   │   └── NotificationPreferences/UpdateRequest.php
│   ├── Http/Resources/System/{Lead,LeadDetail,LeadFollowUp,WhatsAppGroup,MessageTemplate,WassenderLog}Resource.php
│   ├── Models/System/
│   │   ├── Lead.php
│   │   ├── LeadFollowUp.php
│   │   ├── WhatsAppGroup.php
│   │   ├── MessageTemplate.php
│   │   └── WassenderLog.php
│   ├── Policies/System/
│   │   ├── LeadPolicy.php
│   │   ├── WhatsAppGroupPolicy.php
│   │   └── MessageTemplatePolicy.php
│   ├── Jobs/System/
│   │   └── SendWassenderMessage.php
│   ├── Listeners/System/
│   │   ├── CreateLeadFromTrialBooking.php
│   │   ├── SendInvoiceLinkOnInvoiceCreated.php
│   │   ├── NotifyAdminsOnInvoiceOverdue.php
│   │   ├── SendWelcomeOnStudentEnrolled.php
│   │   ├── NotifyTeacherOnStudentPaused.php
│   │   └── NotifyTeacherOnStudentSuspended.php
│   ├── Services/System/
│   │   ├── MessageTemplateRenderer.php
│   │   ├── WassenderDispatcher.php
│   │   ├── LeadPipelineService.php
│   │   ├── LeadFromTrialBookingConverter.php
│   │   ├── LeadToStudentConverter.php
│   │   └── ConversionAnalytics.php
│   ├── Services/Integrations/Wassender/
│   │   ├── WassenderClient.php
│   │   ├── FakeWassenderClient.php
│   │   ├── WassenderSendResult.php
│   │   └── WassenderServiceProvider.php
│   └── Support/System/
│       └── NotificationTypes.php                       (enum of the 12 internal types)
├── database/migrations/
│   ├── 2026_08_24_000001_create_sys_whatsapp_groups_table.php
│   ├── 2026_08_24_000002_add_whatsapp_group_fks_to_students_and_teachers.php
│   ├── 2026_08_24_000003_create_sys_leads_table.php
│   ├── 2026_08_24_000004_create_sys_lead_follow_ups_table.php
│   ├── 2026_08_24_000005_create_sys_message_templates_table.php
│   ├── 2026_08_24_000006_create_sys_wassender_logs_table.php
│   └── 2026_08_24_000007_migrate_whatsapp_links_to_groups.php
├── database/factories/System/
│   ├── LeadFactory.php / LeadFollowUpFactory.php
│   ├── WhatsAppGroupFactory.php
│   ├── MessageTemplateFactory.php
│   └── WassenderLogFactory.php
├── database/seeders/System/
│   └── MessageTemplateSeeder.php                       (NEW — runs in baseline)
└── routes/system.php                                   (UPDATED — 28 endpoints + webhooks)

frontend/
├── src/app/(system)/
│   ├── leads/
│   │   ├── page.tsx                                    (Kanban + table)
│   │   ├── new/page.tsx
│   │   ├── [id]/page.tsx
│   │   └── analytics/page.tsx
│   ├── whatsapp-groups/page.tsx
│   ├── notifications/
│   │   ├── page.tsx                                    (inbox/history)
│   │   ├── delivery-log/page.tsx
│   │   └── templates/
│   │       ├── page.tsx
│   │       └── [key]/page.tsx
│   └── settings/
│       ├── notifications/
│       │   ├── page.tsx
│       │   └── preferences/page.tsx
│       └── integrations/wassender/page.tsx
├── src/components/system/
│   ├── leads/
│   │   ├── LeadKanban.tsx
│   │   ├── LeadCard.tsx
│   │   ├── LeadTable.tsx
│   │   ├── LeadProfile.tsx
│   │   ├── ConvertToStudentSheet.tsx
│   │   ├── MarkLostDialog.tsx
│   │   ├── FollowUpScheduler.tsx
│   │   ├── FollowUpList.tsx
│   │   ├── LeadSourceBadge.tsx
│   │   └── ConversionFunnelChart.tsx
│   ├── whatsapp/
│   │   ├── WhatsAppGroupTable.tsx
│   │   ├── RegisterGroupSheet.tsx
│   │   └── WhatsAppGroupPicker.tsx
│   ├── notifications/
│   │   ├── NotificationList.tsx
│   │   ├── DeliveryLogTable.tsx
│   │   ├── DeliveryLogDrawer.tsx
│   │   ├── TemplateEditor.tsx
│   │   ├── VariableChip.tsx
│   │   └── PreferenceMatrix.tsx
│   └── settings/
│       └── WassenderSettings.tsx
├── src/hooks/system/
│   ├── useLeads.ts / useLead.ts / useLeadAnalytics.ts
│   ├── useFollowUps.ts
│   ├── useWhatsAppGroups.ts
│   ├── useMessageTemplates.ts
│   ├── useTemplatePreview.ts
│   ├── useWassenderLogs.ts
│   └── useNotificationPreferences.ts
└── src/types/system/
    ├── lead.ts
    ├── whatsappGroup.ts
    ├── messageTemplate.ts
    └── wassenderLog.ts

docs/system/sprints/sys-07-crm-notifications-whatsapp.md   (THIS FILE)
```

---

## Risks & open questions

- **wassender credentials availability.** If owner doesn't have wassender credentials by sprint start, run with `WASSENDER_ENABLED=false` and the `FakeWassenderClient`. All internal notifications still work; outbound WhatsApp messages just log to `sys_wassender_logs` with `status=sent` synthetically. Document the gap so owner knows what's not live.
- **wassender provider variance.** The exact request/response shape differs by wassender provider. We pin to one provider's API in v1; swap to another is a one-file change to `WassenderClient`. The dispatcher contract stays stable.
- **Group invite link expiry.** WhatsApp invite links can expire (admin rotates them). The system has no way to know — if a link expires, sends will fail and dead-letter. UI surfaces this in the delivery log. Owner has to rotate the link in `sys_whatsapp_groups`. Future: a periodic health-check job that pings a known message to detect dead groups.
- **Rate limits.** wassender providers typically cap at 1 msg/sec per instance. The `notifications` queue with a single worker handles this naturally. If we go past 1 msg/sec sustained, we need either more instances or a token-bucket rate limiter in front of the client. Not a v1 concern.
- **Lead pipeline backward transitions.** Spec doesn't address whether a `Lost` lead can be reopened. Decision: admin can edit the lead, set status back to `Contacted`; supervisor cannot. UI shows the move with a confirm dialog.
- **Conversion analytics caching.** 5-min cache is fine for current scale. If owner wants near-realtime, drop to 30s; if performance bites, push to 1h. Configurable via the cache TTL — not in settings UI for v1.
- **Notification preference granularity.** Per-type only, not per-channel (bell vs email). v1 has no email channel for internal notifications; if owner wants email, that's a follow-up.
- **Trial booking event ownership.** Public-site Sprint 4 defines `TrialBookingCreated`. If the event was named differently or doesn't exist yet, SYS-07 adds it (one line in site Sprint 4's `TrialBookingController::store`). Documented as a cross-boundary touch in [DATABASE.md](../DATABASE.md) note.
- **Template safety.** `MessageTemplateRenderer` strips control chars and removes unknown `{tokens}`. It does **not** HTML-escape because WhatsApp messages are plain text. If a future template ends up being used for email (Module 15 allows `channel=email`), we'd need an HTML escape variant. Documented in the renderer's comment.

---

## Sprint review demo script

(~15 minutes)

1. Submit a trial booking on the public site → switch tabs → see new lead `New` on `/leads` within 5s + bell notification fires.
2. Drag the lead through Kanban: New → Contacted → Trial Booked. Show audit log + activity log rows.
3. Open the lead → Schedule a follow-up for now + 1 minute → wait → notification fires on the bell.
4. Click "Convert to student" → form pre-fills → save → new student row + lead status `enrolled`.
5. Open Settings → Notifications → Templates → edit `session_reminder_student` body, save.
6. Tinker-create a session 60min from now for the new student → run `php artisan system:reminders:sessions` → check `/notifications/delivery-log` → 2 messages logged with the edited body.
7. If real wassender connected: confirm a real WhatsApp message arrives. Otherwise show the `sent` status in the fake mode.
8. Set an invoice due tomorrow → run payment reminder cron → confirm log entry + (real or fake) WhatsApp.
9. Toggle a notification preference off → re-fire the same event → confirm no notification for that user.
10. Open `/leads/analytics` → show funnel + per-source + per-supervisor breakdown.
11. Open `/whatsapp-groups` → see all groups, link a missing one for a student, confirm the "active without group" alert count drops.
12. Public site at `alrayan-academy.com` unchanged; admin login unchanged.

---

*Last updated: May 11, 2026 — backend + frontend core implemented. Tests, mobile QA, Lighthouse, ConvertToStudentSheet, WhatsAppGroupPicker, and dashboard alert panel still pending.*
