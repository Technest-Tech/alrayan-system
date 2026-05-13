# SYS-02 — Authentication, RBAC & Dashboard Shell

**Duration:** 2 weeks
**Status:** Implemented 2026-05-10. Pending DB migration + staging smoke pass.
**Sprint goal:** real users can log in, log out, recover passwords, and land on a role-appropriate dashboard with a working alerts panel and notification bell. Admin can create supervisors and teachers and configure granular permissions.

> **Prereqs** — SYS-01 has shipped. The system shell, design tokens, primitives, and the Spatie tables are in place.

---

## Definition of Done

- [ ] An admin user (seeded from `.env`) can log in at `app.alrayan-academy.com/login`
- [ ] Successful login sets a Sanctum session cookie scoped to `.alrayan-academy.com`; the user is redirected to `/dashboard`
- [ ] Logout clears the session cookie and redirects to `/login`
- [ ] "Forgot password" sends a Resend-delivered email with a tokenized reset link; clicking it lets the user set a new password
- [ ] Session inactivity expires after 8 hours (configurable in `config/system.php`)
- [ ] Admin can navigate to **Settings → Users** and:
  - Invite a new supervisor with a chosen email + name + permission set
  - Invite a new teacher (creates a user + a `sys_teachers` placeholder row pointing back at the user)
  - Edit permissions on an existing supervisor (granular permission checkboxes from `PermissionRegistry`)
  - Deactivate / reactivate any user (cannot deactivate self)
- [ ] Granular permissions are enforced server-side: an unauthorized request returns 403 + writes an audit log entry
- [ ] Granular permissions are enforced client-side: nav items the user can't access are hidden; protected pages route to a 403 page
- [ ] Login lockout: 10 failed attempts in 10 minutes locks the account for 15 minutes (configurable)
- [ ] Audit log writes for: login success, login failure, logout, password reset request, password reset, role change, permission change, user invite, user deactivation
- [ ] `/dashboard` renders for admin/supervisor: 8 KPI cards (with placeholder values that will be wired up sprint by sprint), an alerts panel (also placeholder), 4 quick-action buttons, a "Recent activity" feed
- [ ] `/dashboard` for teacher renders the **teacher dashboard** placeholder (Today's sessions empty state) — fully populated in SYS-04
- [ ] Notification bell shows unread count from `sys_notifications`; clicking opens a dropdown list, "Mark all read" works
- [ ] Empty `sys_notifications` shows a friendly empty state in the bell dropdown
- [ ] All 9 acceptance flows below pass in Playwright
- [ ] All listed feature tests pass; coverage on `AuthController`, `UserController`, `PermissionRegistry` ≥ 90%
- [ ] Lighthouse on `/login` and `/dashboard` (logged-in screenshot via authenticated test) ≥ 95 accessibility
- [ ] `scripts/check-system-isolation.sh` still passes
- [ ] Demo recording reviewed by owner

### Acceptance flows (Playwright)

1. **Happy path login** — visit `/login`, enter admin creds, land on `/dashboard`.
2. **Bad password** — wrong password 3 times → toast "Invalid credentials"; 10 times → "Account temporarily locked, try in 15 minutes".
3. **Logout** — user menu → Sign out → returns to `/login`; cookie cleared.
4. **Forgot/reset** — email arrives (mocked), token link works once, second use invalidates.
5. **Supervisor with limited perms** — invited supervisor sees only the modules in their permission set; nav items hidden; direct URL hits return 403.
6. **Teacher dashboard** — teacher logs in → sees teacher dashboard, not admin one; cannot reach `/students`.
7. **Self-deactivation prevented** — admin tries to deactivate own account → button disabled + server returns 422.
8. **Notification bell** — seed 3 notifications via Tinker → bell shows badge `3` → open → mark all read → badge `0`.
9. **Audit log** — perform login + permission change → both entries appear in `sys_audit_logs` with correct actor + diff.

---

## Story breakdown

### S2-01 — `PermissionRegistry` and seed roles  *(0.5 day)*

The single source of truth for permission strings. Hardcoded constants make typos impossible and let the UI iterate over groups.

**File:** `backend/app/Support/System/Permissions/PermissionRegistry.php`

```php
<?php
namespace App\Support\System\Permissions;

class PermissionRegistry
{
    public const GROUPS = [
        'leads'         => ['view', 'create', 'edit', 'delete', 'convert'],
        'students'      => ['view', 'create', 'edit', 'delete', 'change_status'],
        'teachers'      => ['view', 'create', 'edit', 'delete', 'approve_leave'],
        'courses'       => ['view', 'edit'],
        'schedule'      => ['view', 'edit', 'reschedule'],
        'attendance'    => ['view', 'edit'],
        'reports'       => ['view', 'edit'],
        'quality'       => ['view', 'review'],
        'invoices'      => ['view', 'create', 'edit', 'void', 'record_payment'],
        'wallet'        => ['view', 'adjust'],
        'payroll'       => ['view', 'approve', 'mark_transferred'],
        'expenses'      => ['view', 'create', 'edit', 'delete'],
        'accounting'    => ['view', 'export'],
        'notifications' => ['view', 'edit_templates'],
        'whatsapp'      => ['view', 'edit'],
        'certificates'  => ['view', 'issue'],
        'settings'      => ['view', 'edit'],
        'users'         => ['view', 'invite', 'edit', 'deactivate'],
        'audit'         => ['view'],
    ];

    public static function all(): array
    {
        $out = [];
        foreach (self::GROUPS as $group => $actions) {
            foreach ($actions as $action) $out[] = "$group.$action";
        }
        return $out;
    }
}
```

**File:** `backend/app/Support/System/Permissions/DefaultRoles.php`

```php
<?php
namespace App\Support\System\Permissions;

class DefaultRoles
{
    /**
     * Permissions automatically granted to a brand-new supervisor.
     * Admin gets ALL permissions; teachers get NONE (their access is policy-scoped).
     */
    public const SUPERVISOR_DEFAULTS = [
        'leads.view', 'leads.create', 'leads.edit', 'leads.convert',
        'students.view', 'students.create', 'students.edit', 'students.change_status',
        'teachers.view',
        'courses.view',
        'schedule.view', 'schedule.edit', 'schedule.reschedule',
        'attendance.view', 'attendance.edit',
        'reports.view',
        'invoices.view', 'invoices.create', 'invoices.record_payment',
        'notifications.view',
        'whatsapp.view',
        'certificates.view',
    ];
}
```

**File:** `backend/database/seeders/System/RolePermissionSeeder.php`

```php
public function run(): void
{
    foreach (PermissionRegistry::all() as $perm) {
        Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
    }

    $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    $admin->syncPermissions(PermissionRegistry::all());

    Role::firstOrCreate(['name' => 'supervisor', 'guard_name' => 'web'])
        ->syncPermissions(DefaultRoles::SUPERVISOR_DEFAULTS);

    Role::firstOrCreate(['name' => 'teacher', 'guard_name' => 'web']);
}
```

Wire into `database/seeders/DatabaseSeeder.php` and run on every fresh migrate. Idempotent.

#### Frontend mirror

**File:** `frontend/src/lib/system/permissions.ts`

```ts
// Generated from a JSON dump endpoint at /api/system/auth/me
// Mirrors PermissionRegistry::all() — keeps frontend type-safe.
export type Permission =
  | 'leads.view' | 'leads.create' | 'leads.edit' | 'leads.delete' | 'leads.convert'
  | 'students.view' | …
  | 'audit.view'

export function can(user: { permissions: Permission[]; role: 'admin' | 'supervisor' | 'teacher' }, perm: Permission) {
  if (user.role === 'admin') return true
  return user.permissions.includes(perm)
}
```

A `pnpm gen:perms` script reads the PHP enum (via `php artisan system:perms:export`) and writes the TS union. Keeps the two in sync without hand-editing.

---

### S2-02 — Login + logout endpoints  *(1 day)*

**File:** `backend/app/Http/Controllers/System/AuthController.php`

```php
public function login(LoginRequest $request)
{
    $rateKey = 'login:' . $request->ip() . ':' . Str::lower($request->input('email'));

    if (RateLimiter::tooManyAttempts($rateKey, 10)) {
        $seconds = RateLimiter::availableIn($rateKey);
        return response()->json([
            'message' => "Account temporarily locked. Try again in {$seconds}s.",
        ], 429);
    }

    if (!Auth::attempt($request->only('email', 'password'), remember: true)) {
        RateLimiter::hit($rateKey, decaySeconds: 600); // 10 min window
        AuditLog::record('auth.login_failed', null, ['email' => $request->input('email')]);
        return response()->json(['message' => 'Invalid credentials'], 401);
    }

    $user = Auth::user();
    if (!$user->is_active) {
        Auth::logout();
        return response()->json(['message' => 'Account inactive'], 403);
    }

    RateLimiter::clear($rateKey);
    $user->update(['last_login_at' => now()]);
    $request->session()->regenerate();

    AuditLog::record('auth.login_success', $user);
    return response()->json($this->profile($user));
}

public function logout(Request $request)
{
    AuditLog::record('auth.logout', $request->user());
    Auth::guard('web')->logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();
    return response()->json(['message' => 'Signed out']);
}

public function me(Request $request)
{
    return response()->json($this->profile($request->user()));
}

private function profile(User $user): array
{
    return [
        'id'          => $user->id,
        'name'        => $user->name,
        'email'       => $user->email,
        'role'        => $user->role,                          // admin/supervisor/teacher
        'permissions' => $user->getAllPermissions()->pluck('name'),
        'is_active'   => $user->is_active,
    ];
}
```

`LoginRequest` validates: `email` (required|email), `password` (required|string|min:8).

#### Frontend

**File:** `frontend/src/components/system/auth/LoginForm.tsx`

```tsx
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api, ApiError } from '@/lib/system/api'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Button, Input, Label } from '@/components/ui'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  async function onSubmit(values: z.infer<typeof schema>) {
    try {
      await api('/auth/login', { method: 'POST', body: JSON.stringify(values) })
      router.push(params.get('from') ?? '/dashboard')
    } catch (e) {
      if (e instanceof ApiError) {
        toast.error(e.status === 429 ? e.message : 'Invalid credentials')
      } else {
        toast.error('Something went wrong')
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" {...register('email')} />
        {errors.email && <p className="text-status-danger text-xs mt-1">{errors.email.message}</p>}
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" autoComplete="current-password" {...register('password')} />
        <a href="/forgot-password" className="text-xs text-secondary mt-1 inline-block">Forgot?</a>
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  )
}
```

The `useUser()` hook (next story) handles loading the profile and broadcasting it across the shell.

---

### S2-03 — `useUser` hook + auth guard at the shell layer  *(0.5 day)*

**File:** `frontend/src/lib/system/auth.ts`

```ts
'use client'
import { useQuery } from '@tanstack/react-query'
import { api } from './api'

export interface AuthUser {
  id: number
  name: string
  email: string
  role: 'admin' | 'supervisor' | 'teacher'
  permissions: string[]
  is_active: boolean
}

export function useUser() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => api<AuthUser>('/auth/me'),
    staleTime: 60_000,
    retry: false,
  })
}

export async function logout() {
  await api('/auth/logout', { method: 'POST' })
  window.location.href = '/login'
}
```

**Wire `SystemShell.tsx`:**

```tsx
const { data: user, isLoading, error } = useUser()
const isAuthRoute = pathname === '/login' || pathname.startsWith('/forgot-password') || pathname.startsWith('/reset-password')

useEffect(() => {
  if (!isAuthRoute && error) {
    router.push('/login?from=' + encodeURIComponent(pathname))
  }
}, [error, isAuthRoute])

if (isAuthRoute) return <>{children}</>
if (isLoading || !user) return <FullPageSpinner />

// Render shell with user context
return (
  <UserContext.Provider value={user}>
    <Sidebar … nav={navForRole(user)} />
    <Topbar user={user} … />
    <main>{children}</main>
  </UserContext.Provider>
)
```

`navForRole` filters `SYSTEM_NAV` (from SYS-01) by `can(user, item.perm)` so a supervisor without `payroll.view` never sees the Payroll item.

---

### S2-04 — Forgot / reset password flow  *(1 day)*

We use Laravel's built-in password broker, but with our own controller (no Blade views — Next.js renders the pages).

#### Backend

**`AuthController::forgotPassword`**

```php
public function forgotPassword(ForgotPasswordRequest $request)
{
    $status = Password::sendResetLink($request->only('email'), function ($user, $token) {
        $url = config('system.frontend_url') . '/reset-password/' . $token . '?email=' . urlencode($user->email);
        $user->notify(new SystemPasswordResetNotification($url));
    });

    AuditLog::record('auth.password_reset_request', null, ['email' => $request->input('email')]);
    // Always return 200 even if email not found — prevents enumeration.
    return response()->json(['message' => 'If that account exists, a reset link is on its way.']);
}
```

**`AuthController::resetPassword`**

```php
public function resetPassword(ResetPasswordRequest $request)
{
    $status = Password::reset(
        $request->only('email', 'password', 'password_confirmation', 'token'),
        function ($user, $password) {
            $user->forceFill(['password' => Hash::make($password)])->save();
            event(new PasswordReset($user));
        }
    );

    if ($status !== Password::PASSWORD_RESET) {
        return response()->json(['message' => 'Invalid or expired token'], 422);
    }
    AuditLog::record('auth.password_reset', User::where('email', $request->input('email'))->first());
    return response()->json(['message' => 'Password updated.']);
}
```

`SystemPasswordResetNotification` extends `Notification`, uses Resend, branded with academy logo. Subject: "Reset your Alrayan Academy account password". 60-minute expiry (Laravel default).

#### Frontend

- `/forgot-password/page.tsx` — email field, submit, success state ("Check your inbox").
- `/reset-password/[token]/page.tsx` — new password + confirm, submit, success state ("Sign in now").
- Both wire to api endpoints with the same form pattern as Login.

---

### S2-05 — User management UI (Settings → Users)  *(2 days)*

**Backend endpoints (`UserController`):**

- `GET    /api/system/users`               — paginated list (admin-only, perm `users.view`)
- `POST   /api/system/users/invite`        — create user, set role + perms, send invite email (perm `users.invite`)
- `PATCH  /api/system/users/{id}`          — update name, role, permissions (perm `users.edit`)
- `POST   /api/system/users/{id}/activate`
- `POST   /api/system/users/{id}/deactivate`

`UserController::invite` flow:

1. Validate (name, email unique, role enum, permissions array).
2. Create user with random password (never sent to anyone).
3. Assign role + sync permissions.
4. If role = `teacher`: also create `sys_teachers` row with FK to user; this row is later filled in by SYS-03's teacher form.
5. Send invitation email (Resend) with a one-time setup link (a password-reset token with 7-day expiry).
6. Audit log the action.

```php
public function invite(InviteUserRequest $request)
{
    $perms = $request->validated('permissions', []);
    $role  = $request->validated('role');
    abort_unless(in_array($role, ['admin', 'supervisor', 'teacher'], true), 422);

    $user = User::create([
        'name'      => $request->validated('name'),
        'email'     => $request->validated('email'),
        'password'  => Hash::make(Str::random(40)),
        'role'      => $role,
        'is_active' => true,
    ]);
    $user->syncRoles([$role]);
    $user->syncPermissions($perms);

    if ($role === 'teacher') {
        Teacher::create(['user_id' => $user->id, 'is_active' => true]);
    }

    $token = Password::createToken($user);
    $url   = config('system.frontend_url') . '/reset-password/' . $token . '?email=' . urlencode($user->email);
    $user->notify(new SystemUserInvitedNotification($url, auth()->user()));

    AuditLog::record('users.invited', $user, ['role' => $role, 'permissions' => $perms]);
    return new UserResource($user->load('permissions'));
}
```

`InviteUserRequest` validates each permission string against `PermissionRegistry::all()`.

**Frontend:** `/settings/users/page.tsx`

```
┌──────────────────────────────────────────────────────────────────┐
│ Users                                          [ + Invite user ] │
│ Admins, supervisors, and teacher accounts.                       │
├──────────────────────────────────────────────────────────────────┤
│ ☐ Name              Role         Permissions   Status   Actions  │
│ ☐ Sarah Ahmed       Admin        All           Active   [⋯]      │
│ ☐ Omar Khaled       Supervisor   8 of 60       Active   [⋯]      │
│ ☐ Sh. Hassan        Teacher      —             Inactive [⋯]      │
└──────────────────────────────────────────────────────────────────┘
```

**Invite Sheet** opens on `+ Invite user`:

- Name, Email, Role (radio: admin/supervisor/teacher).
- If supervisor: Permissions section appears — categories from `PermissionRegistry::GROUPS`, each row a checkbox grid.
- Default permissions for supervisor pre-checked from `DefaultRoles::SUPERVISOR_DEFAULTS`.
- Admin role: shows "Admins automatically have every permission."
- Teacher role: shows "Teacher access is scoped automatically. Detailed teacher profile is set up after invite."

**Edit user** uses the same Sheet, prefilled.

**Row actions menu**: Edit · Resend invite · Deactivate / Activate (with confirm dialog).

**Self-deactivation guard**: server returns 422 if `auth()->id() === $userId`. Frontend disables the menu item too.

---

### S2-06 — Permission middleware + audit log on denial  *(0.5 day)*

**File:** `app/Http/Middleware/System/EnsurePermission.php`

```php
public function handle(Request $request, Closure $next, string $permission): Response
{
    $user = $request->user();

    if ($user->role === 'admin') return $next($request);
    if (!$user->can($permission)) {
        AuditLog::record('auth.permission_denied', $user, ['permission' => $permission, 'route' => $request->path()]);
        return response()->json(['message' => 'Forbidden', 'permission' => $permission], 403);
    }
    return $next($request);
}
```

Registered as `can:` alias replacement (`system.can:perm.name`). Used like:

```php
Route::middleware('system.can:students.view')->get('/students', [StudentController::class, 'index']);
```

**Frontend** — when a request returns 403, the API client throws `ApiError(403, …)` and the page renders a `<ForbiddenState>` component instead.

---

### S2-07 — Audit log infrastructure  *(0.5 day)*

**Migration:** `2026_06_15_000001_create_sys_audit_logs_table.php`

```php
Schema::create('sys_audit_logs', function (Blueprint $t) {
    $t->id();
    $t->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
    $t->string('action');                                  // dotted: students.created, auth.login_success
    $t->string('target_type')->nullable();                 // App\Models\System\Student
    $t->unsignedBigInteger('target_id')->nullable();
    $t->json('payload')->nullable();                       // {old:{…}, new:{…}, …}
    $t->ipAddress('ip')->nullable();
    $t->string('user_agent', 512)->nullable();
    $t->timestamps();
    $t->index(['actor_user_id', 'created_at']);
    $t->index(['target_type', 'target_id', 'created_at']);
    $t->index(['action', 'created_at']);
});
```

**Helper:** `App\Services\System\AuditLog::record(string $action, ?Model $target = null, array $payload = [])` — picks up actor + IP + UA from the current request, writes a row, returns the row.

We additionally install `spatie/laravel-activitylog` for automatic model-change tracking. Two sources of truth (custom + Spatie) seems redundant but each does a different job:

- `sys_audit_logs` records *intent + actor* (e.g. "user X tried to do Y, denied"; "login succeeded").
- `sys_activity_log` (Spatie's table, renamed) records *model state changes* with diffs (created/updated/deleted on every system model).

Module 21 (Audit log UI in SYS-08) merges both into a single timeline.

---

### S2-08 — Dashboard shell with placeholder data  *(2 days)*

**Layout (admin/supervisor):**

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Dashboard                                       [ + Add student  ▼ ]     │
│ A snapshot of your academy.                                              │
├──────────────────────────────────────────────────────────────────────────┤
│ ┌────────┬────────┬────────┬────────┐  ┌────────┬────────┬────────┬─────┐│
│ │ Active │ Trial  │ Paused │ Susp.  │  │ Today  │ Reven. │ Outst. │ Conv││
│ │ 124    │ 18     │ 3      │ 2      │  │ 14     │ $4,250 │ $1,200 │ 38% ││
│ │ +6 mo. │ +12 wk.│ —      │ +1 wk. │  │ ses.   │ this mo│ overdue│ MoM ││
│ └────────┴────────┴────────┴────────┘  └────────┴────────┴────────┴─────┘│
│                                                                          │
│ ┌──────────────────────────────────┐  ┌──────────────────────────────┐  │
│ │ Alerts (7)               [View all]│  │ Quick actions                │  │
│ │  • 4 unpaid invoices overdue       │  │  [+ Add student]             │  │
│ │  • 2 missing session reports       │  │  [+ Add lead]                │  │
│ │  • 1 student without WhatsApp grp  │  │  [Open today's schedule]     │  │
│ │  …                                 │  │  [Create advance invoice]    │  │
│ └──────────────────────────────────┘  └──────────────────────────────┘  │
│                                                                          │
│ ┌──────────────────────────────────────────────────────────────────────┐│
│ │ Recent activity                                                      ││
│ │  Sarah enrolled Yusuf Khan — 2h ago                                  ││
│ │  Sh. Hassan submitted report for Aisha Rahman — 4h ago               ││
│ │  Invoice INV-2026-0042 paid (Sh.) — 6h ago                           ││
│ └──────────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────┘
```

KPI numbers and alert items are wired to a single endpoint:

`GET /api/system/dashboard` → returns

```json
{
  "kpis": {
    "active_students": 124,    "active_students_delta": 6,
    "trial_students":  18,     "trial_students_delta": 12,
    "paused_students":  3,     "suspended_students": 2,
    "today_sessions":  14,
    "month_revenue":   { "EGP": 0, "USD": 4250_00, … },
    "outstanding":     { "USD": 1200_00, … },
    "conversion_rate": 0.38
  },
  "alerts": [
    { "kind": "invoice.overdue",      "count": 4, "href": "/billing/overdue" },
    { "kind": "report.missing",       "count": 2, "href": "/session-reports?missing=1" },
    { "kind": "student.no_whatsapp",  "count": 1, "href": "/students?no_whatsapp=1" }
  ],
  "recent_activity": [
    { "icon": "user-plus", "text": "Sarah enrolled Yusuf Khan",        "at": "2026-06-14T10:31Z" },
    …
  ]
}
```

In SYS-02 the controller returns *real* counts where possible (active students = 0, trial = 0 since no data yet) and fixed empty arrays for alerts / recent activity. As later sprints land, this controller is extended — never replaced. Each KPI has an associated permission and is omitted from the response for users without it.

**Frontend:** `dashboard/page.tsx` calls `useDashboard()` hook → renders `KpiCard` + `AlertsPanel` + `QuickActions` + `RecentActivity`.

**Charts** are not part of SYS-02 — they ship in SYS-08 with real time-series data.

#### Teacher dashboard

Teachers see a different page entirely:

```
┌──────────────────────────────────────────────────┐
│ Welcome, Sh. Hassan                              │
│ Today is Friday, June 14, 2026                   │
├──────────────────────────────────────────────────┤
│ Today's sessions (0)                             │
│   ✦ No sessions scheduled.                       │
│                                                  │
│ Pending session reports (0)                      │
│   You're all caught up.                          │
│                                                  │
│ Salary statement                          [View] │
│   Current month not yet calculated.              │
└──────────────────────────────────────────────────┘
```

`/dashboard/page.tsx` branches on `user.role`. The teacher view stays minimal here; it gets fleshed out in SYS-04 (today/upcoming sessions) and SYS-06 (salary statement).

---

### S2-09 — Notification bell + `sys_notifications` plumbing  *(1 day)*

**Migration:** `2026_06_15_000010_create_sys_notifications_table.php`

```php
Schema::create('sys_notifications', function (Blueprint $t) {
    $t->id();
    $t->foreignId('user_id')->constrained()->cascadeOnDelete();
    $t->string('type', 80);                  // e.g. 'invoice.overdue', 'lead.created'
    $t->string('title', 200);
    $t->string('body', 500)->nullable();
    $t->string('link')->nullable();
    $t->json('payload')->nullable();
    $t->timestamp('read_at')->nullable();
    $t->timestamps();
    $t->index(['user_id', 'read_at']);
    $t->index(['user_id', 'created_at']);
});
```

**Endpoints (`NotificationController`):**

- `GET    /api/system/notifications`             — paginated, perm `notifications.view`
- `GET    /api/system/notifications/unread-count`
- `POST   /api/system/notifications/{id}/read`
- `POST   /api/system/notifications/read-all`

**Service:** `App\Services\System\NotificationService::push(User $u, string $type, string $title, ?string $body, ?string $link, ?array $payload)`. Used in later sprints. Nothing publishes to it in SYS-02 — but the bell + endpoint + page are all fully working.

**Frontend `NotificationBell.tsx`:**

- Polls `/notifications/unread-count` every 60s (TanStack Query refetch).
- Badge shows count when > 0; pulses on new arrivals.
- Click → dropdown with last 10 notifications, "Mark all read" link.
- Empty state: "🔔 You're all caught up."
- Each item shows time-ago, title, body, navigates to `link`.

---

### S2-10 — Tests  *(1.5 days)*

#### Feature tests (PHPUnit)

`tests/Feature/System/Auth/`:

- `LoginTest.php` — happy path, wrong password (3x → 401), wrong password (10x → 429), inactive user (403).
- `LogoutTest.php` — clears session, audit-logs.
- `PasswordResetTest.php` — sends email, valid token works once, invalid/expired returns 422.
- `MeTest.php` — returns profile with permissions; 401 when not auth'd.

`tests/Feature/System/Users/`:

- `InviteUserTest.php` — admin invites supervisor; teacher row auto-created when role=teacher; duplicate email returns 422.
- `EditPermissionsTest.php` — admin updates permissions; supervisor without `users.edit` returns 403.
- `DeactivateTest.php` — admin deactivates user; cannot deactivate self (422); deactivated user immediately gets 403 on next request.

`tests/Feature/System/Permissions/`:

- `MiddlewareTest.php` — admin always passes; supervisor with perm passes; supervisor without perm gets 403 + audit row.

`tests/Feature/System/Notifications/`:

- `BellTest.php` — push notification → unread-count returns 1; mark-read → returns 0.

#### Unit tests

`tests/Unit/System/PermissionRegistryTest.php` — every permission in `DefaultRoles::SUPERVISOR_DEFAULTS` exists in registry; no duplicates; no typos.

#### Playwright (E2E)

`frontend/e2e/system/auth.spec.ts` — the 9 acceptance flows above.

---

### S2-11 — Deploy + smoke pass  *(0.5 day)*

- Run `php artisan db:seed --class=System\\RolePermissionSeeder` on staging.
- Manually create the academy admin user via `php artisan tinker` (or env-driven seed).
- Owner walks through:
  - Log in with admin creds.
  - Invite a supervisor → switch to private window → log in with reset link → see only the modules the supervisor was given.
  - Try to visit `/payroll` as that supervisor → 403 page.
  - Invite a teacher → log in as teacher → see teacher dashboard.
  - From admin: update supervisor's permissions → supervisor refreshes → new modules appear.
  - Forgot password from login → email arrives → resetting works.
- Confirm `sys_audit_logs` has rows for every step.

---

## File deliverables checklist

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/System/
│   │   │   ├── AuthController.php                              (FILLED IN)
│   │   │   ├── UserController.php                              (NEW)
│   │   │   └── NotificationController.php                      (NEW)
│   │   ├── Middleware/System/
│   │   │   └── EnsurePermission.php                            (NEW)
│   │   ├── Requests/System/Auth/
│   │   │   ├── LoginRequest.php
│   │   │   ├── ForgotPasswordRequest.php
│   │   │   └── ResetPasswordRequest.php                        (NEW)
│   │   ├── Requests/System/Users/
│   │   │   ├── InviteUserRequest.php
│   │   │   └── UpdateUserRequest.php                           (NEW)
│   │   └── Resources/System/UserResource.php                   (NEW)
│   ├── Models/System/
│   │   ├── AuditLog.php                                        (NEW)
│   │   └── Notification.php                                    (NEW)
│   ├── Notifications/System/
│   │   ├── SystemPasswordResetNotification.php                 (NEW)
│   │   └── SystemUserInvitedNotification.php                   (NEW)
│   ├── Services/System/
│   │   ├── AuditLog.php                                        (NEW)
│   │   └── NotificationService.php                             (NEW)
│   └── Support/System/Permissions/
│       ├── PermissionRegistry.php                              (NEW)
│       └── DefaultRoles.php                                    (NEW)
├── database/
│   ├── migrations/
│   │   ├── 2026_06_15_000001_create_sys_audit_logs_table.php
│   │   ├── 2026_06_15_000002_create_sys_activity_log_table.php (Spatie rename)
│   │   └── 2026_06_15_000010_create_sys_notifications_table.php
│   └── seeders/System/
│       └── RolePermissionSeeder.php                            (NEW)
└── routes/system.php                                           (UPDATED)

frontend/
├── src/
│   ├── app/(system)/
│   │   ├── login/page.tsx                                      (FILLED IN)
│   │   ├── forgot-password/page.tsx                            (FILLED IN)
│   │   ├── reset-password/[token]/page.tsx                     (FILLED IN)
│   │   ├── dashboard/page.tsx                                  (FILLED IN)
│   │   └── settings/users/page.tsx                             (FILLED IN)
│   ├── components/system/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx                                   (FILLED IN)
│   │   │   ├── ForgotPasswordForm.tsx                          (NEW)
│   │   │   ├── ResetPasswordForm.tsx                           (NEW)
│   │   │   └── RoleGuard.tsx                                   (NEW)
│   │   ├── dashboard/
│   │   │   ├── KpiCard.tsx                                     (NEW)
│   │   │   ├── AlertsPanel.tsx                                 (NEW)
│   │   │   ├── QuickActions.tsx                                (NEW)
│   │   │   └── RecentActivity.tsx                              (NEW)
│   │   ├── settings/users/
│   │   │   ├── InviteUserSheet.tsx                             (NEW)
│   │   │   ├── EditUserSheet.tsx                               (NEW)
│   │   │   ├── PermissionMatrix.tsx                            (NEW)
│   │   │   └── UserTable.tsx                                   (NEW)
│   │   └── shell/NotificationBell.tsx                          (FILLED IN)
│   ├── hooks/system/
│   │   ├── useDashboard.ts                                     (NEW)
│   │   ├── useUsers.ts                                         (NEW)
│   │   └── useNotifications.ts                                 (NEW)
│   ├── lib/system/
│   │   ├── auth.ts                                             (NEW)
│   │   └── permissions.ts                                      (NEW + generated)
│   └── types/system/
│       ├── auth.ts                                             (NEW)
│       └── notification.ts                                     (NEW)

scripts/check-system-isolation.sh                               (still passes)
docs/system/sprints/sys-02-auth-rbac-dashboard.md               (THIS FILE)
```

---

## Risks & open questions

- **Permission cache coherence.** Spatie caches permissions for 24h by default. After admin updates a supervisor's permissions, the supervisor must refresh to see the new nav. Either (a) call `Cache::forget('spatie.permission.cache')` on every permission write (already standard) and (b) `queryClient.invalidateQueries(['me'])` from the admin's window can't reach the supervisor's window — the supervisor sees the change on next page load. Document in the user-management UI: "Changes apply on the user's next page load."
- **Invite link expiry vs reset link expiry.** Reset broker has a fixed 60-min token; invite emails need a longer window. Solution: separate `password_resets` rows aren't enough — we add a `sys_user_invites` table OR override Laravel's `Password::expires` runtime config when sending the invite. Decision: separate `sys_user_invites` table, 7-day token, distinct endpoint. Track in the sprint kickoff to confirm before implementation.
- **2FA is NOT in this sprint.** Listed as a SYS-08 / launch nice-to-have. Filament 2FA plugin exists but we're not using Filament here. If the owner wants 2FA at v1, add 2 days to SYS-08.
- **Email deliverability.** Resend is wired in site Sprint 4. Verify the domain DKIM/SPF before SYS-02 lands — tested by sending invite emails to the owner's personal address on staging.

---

## Sprint review demo script

(~12 minutes)

1. Open `app.alrayan-academy.com/login`, sign in with admin creds.
2. Land on dashboard — show KPI cards (zeros), alerts (empty state), quick actions.
3. Open Settings → Users. Show the user table with just admin.
4. Click "+ Invite user". Pick "Supervisor", uncheck several permissions (e.g. uncheck `payroll.view`, `accounting.view`), enter name + email, send invite.
5. Open the email (mailtrap on staging) — show the branded invite mail.
6. Click reset link, set password.
7. Sign in as supervisor — sidebar shows fewer items. Try to visit `/payroll` directly → 403 page.
8. As admin, deactivate the supervisor. Refresh supervisor's session — gets bounced back to login with "Account inactive" toast.
9. As admin, sign out → back to login.
10. Use "Forgot password" — email arrives, link works.
11. Open `sys_audit_logs` (via Tinker) — show entries for every step.
12. Lighthouse on `/login` — show ≥ 95 across the board.
13. Show notification bell with `0` badge, then push a notification via Tinker, see badge increment, click "Mark all read", badge clears.

---

*Last updated: May 10, 2026*
