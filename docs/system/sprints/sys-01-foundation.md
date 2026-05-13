# SYS-01 — Foundation, Subdomain & Design System

**Duration:** 2 weeks
**Status:** In progress — implementation started 2026-05-10.
**Sprint goal:** the system shell loads at `app.alrayan-academy.com`, looks like a polished modern admin tool, is fully isolated from the public site, and is wired to a Laravel app that knows about a `system` guard. Empty pages are clickable; nothing functional yet.

> **Prereqs** — site Sprint 4 (Conversion + Backend) has shipped. Laravel has Sanctum, queues, and Resend wired up. The frontend Tailwind config and design tokens are locked.

---

## Definition of Done

- [x] `app.localhost:3000` (local) and `app-staging.alrayan-academy.com` (staging) both serve the `(system)` route group
- [x] Visiting `alrayan-academy.com/students` returns 404 (system routes hidden from public host) — middleware implemented
- [x] Visiting `app.alrayan-academy.com/about` returns 404 (marketing routes hidden from system host) — middleware implemented
- [x] System layout renders: sidebar (collapsible 260↔72px), topbar (60px), page header, content area with cream/navy backgrounds
- [x] Sidebar uses navy `--color-primary` background; active item is green `--color-secondary`; collapse persists in localStorage
- [x] Topbar shows: search input (no behavior yet), command-palette trigger (`⌘K` opens an empty palette), notification bell, user menu (placeholder "Admin" + sign out)
- [x] Light/dark mode toggle works; preference persists across reloads; respects OS default on first load
- [x] All admin primitives are wired: `DataTable`, `PageHeader`, `EmptyState`, `ConfirmDialog`, `MoneyDisplay`, `MoneyInput`, `StatusBadge`, `FilterBar`, `DateRangePicker`, `CountrySelect`, `TimezoneSelect`, `PhoneInput`, `Sonner` toasts
- [x] `GET /api/system/health` route returns `200 {"status":"ok","version":"1.0.0"}`
- [x] `GET /api/system/me` returns `401 Unauthenticated` without a session cookie
- [x] `scripts/check-system-isolation.sh` created and executable
- [ ] Vercel deploys `app.alrayan-academy.com` (prod) and `app-staging.alrayan-academy.com` (staging) successfully — needs DNS/Vercel setup (S1-01)
- [ ] Lighthouse on staging `/login` (the only public system page): Performance ≥ 85, Accessibility ≥ 95, Best Practices = 100
- [ ] Mobile QA: sidebar collapses to a Sheet on `<lg` breakpoint — needs Playwright test (S1-12)
- [ ] Demo recording reviewed by owner

---

## Story breakdown

### S1-01 — DNS, Vercel, and environment plumbing  *(0.5 day)*

**Goal:** the subdomain exists and serves the same Next.js app.

- [ ] Add `app.alrayan-academy.com` and `app-staging.alrayan-academy.com` to the Vercel project as additional domains
- [ ] Create CNAMEs in Cloudflare:
  - `app` → `cname.vercel-dns.com`
  - `app-staging` → `cname.vercel-dns.com`
- [ ] In Vercel project settings, leave both pointing to the existing Next.js deployment (one app, two host bindings)
- [ ] Add `127.0.0.1 app.localhost` to `/etc/hosts` for any contributor on macOS/Linux that doesn't already alias `*.localhost`
- [ ] Document the local URL in [../README.md](../README.md) (already done — verify it matches)

**Env vars (Next.js, Vercel project):**

```
NEXT_PUBLIC_SITE_HOST=alrayan-academy.com
NEXT_PUBLIC_APP_HOST=app.alrayan-academy.com
NEXT_PUBLIC_API_URL=https://api.alrayan-academy.com
NEXT_PUBLIC_SYSTEM_API_PREFIX=/api/system
```

For local: `NEXT_PUBLIC_APP_HOST=app.localhost:3000` and `NEXT_PUBLIC_API_URL=http://localhost:8000`.

**Env vars (Laravel):**

```
APP_URL=https://api.alrayan-academy.com
SESSION_DOMAIN=.alrayan-academy.com
SANCTUM_STATEFUL_DOMAINS=alrayan-academy.com,app.alrayan-academy.com,staging.alrayan-academy.com,app-staging.alrayan-academy.com,localhost:3000,app.localhost:3000
SYSTEM_FRONTEND_URL=https://app.alrayan-academy.com
SYSTEM_FRONTEND_URL_STAGING=https://app-staging.alrayan-academy.com
```

---

### S1-02 ✅ — Next.js middleware: host-based routing  *(0.5 day)*

**Goal:** requests to `app.*` resolve into the `(system)` route group; requests to the bare domain resolve into `(marketing)`. Neither leaks into the other.

**File:** `frontend/src/middleware.ts`

```ts
import { NextResponse, type NextRequest } from 'next/server'

const APP_HOST = process.env.NEXT_PUBLIC_APP_HOST!         // app.alrayan-academy.com OR app.localhost:3000
const SITE_HOST = process.env.NEXT_PUBLIC_SITE_HOST!       // alrayan-academy.com OR localhost:3000

function isAppHost(host: string) {
  return host === APP_HOST || host === `app-staging.${SITE_HOST}` || host.startsWith('app.localhost')
}

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? ''
  const url = req.nextUrl.clone()

  // /api/* and /_next/* always pass through
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/')) {
    return NextResponse.next()
  }

  if (isAppHost(host)) {
    // System host — rewrite to /(system) group
    if (!url.pathname.startsWith('/(system)') && !url.pathname.startsWith('/login') && !url.pathname.startsWith('/forgot-password') && !url.pathname.startsWith('/reset-password')) {
      // Group routing in App Router is implicit: /(system)/dashboard is reachable as /dashboard
      // We only need to BLOCK marketing paths from this host.
      const marketingPaths = ['/about', '/courses', '/pricing', '/faq', '/contact', '/blog', '/countries']
      if (marketingPaths.some(p => url.pathname.startsWith(p))) {
        return NextResponse.rewrite(new URL('/not-found', req.url))
      }
    }
    return NextResponse.next()
  }

  // Site host — block any system path
  const systemPaths = ['/dashboard', '/students', '/teachers', '/leads', '/courses-admin', '/schedule', '/billing', '/payroll', '/accounting', '/certificates', '/notifications', '/whatsapp-groups', '/settings', '/audit-log', '/teacher']
  if (systemPaths.some(p => url.pathname.startsWith(p))) {
    return NextResponse.rewrite(new URL('/not-found', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|logo).*)'],
}
```

> **Why rewrite, not redirect to a 404 page?** Rewrite returns the right HTTP status from the matched route. We render the existing `app/not-found.tsx`.

> **App Router note:** route groups (`(system)`, `(marketing)`) don't appear in URLs. The middleware just refuses to serve cross-surface paths.

**Tests** — Playwright (added in S1-12):

- `https://alrayan-academy.com/students` → 404
- `https://app.alrayan-academy.com/about` → 404
- `https://app.alrayan-academy.com/login` → 200 + login UI
- `https://alrayan-academy.com/` → 200 + marketing home

---

### S1-03 ✅ — System route group skeleton  *(0.5 day)*

**Goal:** the `(system)` folder exists with placeholder pages so the layout can render.

Create directories and stub files matching [FILE-STRUCTURE.md](../FILE-STRUCTURE.md):

```bash
mkdir -p frontend/src/app/\(system\)/{login,forgot-password,dashboard,students,teachers,leads,courses,schedule,attendance,session-reports,quality,billing/invoices,billing/payments,billing/overdue,payroll,accounting/{revenue,expenses,profit-loss,collection,cancellations,trials,monthly-report},notifications,notifications/delivery-log,notifications/templates,whatsapp-groups,certificates,teacher,settings/{pricing,billing,notifications,integrations,academy,expense-categories,users},audit-log}
```

Each page is a 4-line placeholder until SYS-02+ fills it in. Example:

**File:** `frontend/src/app/(system)/dashboard/page.tsx`

```tsx
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { EmptyState } from '@/components/system/primitives/EmptyState'

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" description="An overview of your academy." />
      <EmptyState
        icon="LayoutDashboard"
        title="Dashboard coming together"
        description="KPIs and alerts will appear here in SYS-02."
      />
    </>
  )
}
```

**File:** `frontend/src/app/(system)/layout.tsx`

```tsx
import { SystemShell } from '@/components/system/shell/SystemShell'
import { ThemeProvider } from 'next-themes'
import { QueryProvider } from '@/lib/system/query-client'
import { Toaster } from 'sonner'

export default function SystemLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
      <QueryProvider>
        <SystemShell>{children}</SystemShell>
        <Toaster position="top-right" richColors closeButton />
      </QueryProvider>
    </ThemeProvider>
  )
}
```

`SystemShell` wraps everything in the sidebar + topbar layout.

---

### S1-04 ✅ — Design tokens: system overrides  *(0.5 day)*

**Goal:** load admin-specific tokens without disturbing site-wide tokens.

**File:** `frontend/src/styles/system.css`

```css
@layer base {
  [data-theme='light'] [data-system-root='true'],
  [data-system-root='true']:not([data-theme]) {
    --surface-bg: 244 246 250;
    --surface-card: 255 255 255;
    --surface-card-2: 248 250 252;
    --surface-sidebar: 11 31 58;
    --surface-sidebar-active: 14 124 90;
    --surface-topbar: 255 255 255;
    --border-default: 229 233 240;
    --border-strong: 203 211 222;

    --status-success: 14 124 90;
    --status-warning: 154 113 23;
    --status-danger: 166 39 30;
    --status-info: 30 90 171;
    --status-neutral: 90 100 112;
  }

  [data-theme='dark'] [data-system-root='true'] {
    --surface-bg: 11 18 32;
    --surface-card: 16 26 44;
    --surface-card-2: 15 25 41;
    --surface-sidebar: 7 14 27;
    --surface-sidebar-active: 14 124 90;
    --surface-topbar: 15 25 41;
    --border-default: 31 42 63;
    --border-strong: 44 58 82;
  }

  [data-system-root='true'] {
    background: rgb(var(--surface-bg));
    color: rgb(var(--color-primary));
    font-family: var(--font-body);
    font-size: 0.875rem;       /* 14px base for the system surface */
    line-height: 1.55;
  }

  [data-system-root='true'] .tabular {
    font-variant-numeric: tabular-nums;
  }
}
```

**Update:** `frontend/tailwind.config.ts` — extend with system tokens (without removing existing site colors):

```ts
extend: {
  colors: {
    // ...existing site colors stay...
    surface: {
      bg:       'rgb(var(--surface-bg) / <alpha-value>)',
      card:     'rgb(var(--surface-card) / <alpha-value>)',
      'card-2': 'rgb(var(--surface-card-2) / <alpha-value>)',
      sidebar:  'rgb(var(--surface-sidebar) / <alpha-value>)',
      'sidebar-active': 'rgb(var(--surface-sidebar-active) / <alpha-value>)',
      topbar:   'rgb(var(--surface-topbar) / <alpha-value>)',
    },
    border: {
      DEFAULT: 'rgb(var(--border-default) / <alpha-value>)',
      strong:  'rgb(var(--border-strong) / <alpha-value>)',
    },
    status: {
      success: 'rgb(var(--status-success) / <alpha-value>)',
      warning: 'rgb(var(--status-warning) / <alpha-value>)',
      danger:  'rgb(var(--status-danger) / <alpha-value>)',
      info:    'rgb(var(--status-info) / <alpha-value>)',
      neutral: 'rgb(var(--status-neutral) / <alpha-value>)',
    },
  },
  spacing: {
    'sidebar-w': '260px',
    'sidebar-w-collapsed': '72px',
    'topbar-h': '60px',
  },
},
```

Import the new stylesheet in the system layout:

```tsx
// frontend/src/app/(system)/layout.tsx
import '@/styles/system.css'
```

---

### S1-05 ✅ — System app shell: Sidebar + Topbar  *(2 days)*

**Goal:** the chrome users live inside.

**File:** `frontend/src/components/system/shell/SystemShell.tsx`

```tsx
'use client'
import { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function SystemShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('system:sidebar:collapsed')
    if (stored) setCollapsed(stored === '1')
  }, [])

  function toggle() {
    setCollapsed(c => {
      localStorage.setItem('system:sidebar:collapsed', !c ? '1' : '0')
      return !c
    })
  }

  return (
    <div data-system-root="true" className="min-h-screen flex">
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <div
        className="flex-1 flex flex-col"
        style={{ marginLeft: collapsed ? '72px' : '260px' }}
      >
        <Topbar onToggleSidebar={toggle} />
        <main className="flex-1 px-6 py-6">
          <div className="max-w-[1600px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
```

**File:** `frontend/src/lib/system/nav.ts`

```ts
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Calendar,
  ClipboardCheck, FileText, Award, DollarSign, Wallet, BarChart3,
  Bell, MessageCircle, Settings, ScrollText, UserCheck,
} from 'lucide-react'

export const SYSTEM_NAV = [
  {
    label: 'Operations',
    items: [
      { label: 'Dashboard',       href: '/dashboard',         icon: LayoutDashboard, perm: null },
      { label: 'Leads',           href: '/leads',             icon: UserCheck,       perm: 'leads.view' },
      { label: 'Students',        href: '/students',          icon: Users,           perm: 'students.view' },
      { label: 'Teachers',        href: '/teachers',          icon: GraduationCap,   perm: 'teachers.view' },
      { label: 'Courses',         href: '/courses',           icon: BookOpen,        perm: 'courses.view' },
      { label: 'Schedule',        href: '/schedule',          icon: Calendar,        perm: 'schedule.view' },
      { label: 'Attendance',      href: '/attendance',        icon: ClipboardCheck,  perm: 'attendance.view' },
      { label: 'Session reports', href: '/session-reports',   icon: FileText,        perm: 'reports.view' },
      { label: 'Certificates',    href: '/certificates',      icon: Award,           perm: 'certificates.view' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Billing',         href: '/billing/invoices',  icon: DollarSign,      perm: 'invoices.view' },
      { label: 'Payroll',         href: '/payroll',           icon: Wallet,          perm: 'payroll.view' },
      { label: 'Accounting',      href: '/accounting/revenue', icon: BarChart3,      perm: 'accounting.view' },
    ],
  },
  {
    label: 'Communications',
    items: [
      { label: 'Notifications',   href: '/notifications',     icon: Bell,            perm: 'notifications.view' },
      { label: 'WhatsApp groups', href: '/whatsapp-groups',   icon: MessageCircle,   perm: 'whatsapp.view' },
    ],
  },
  {
    label: 'Admin',
    items: [
      { label: 'Settings',        href: '/settings/academy',  icon: Settings,        perm: 'settings.view' },
      { label: 'Audit log',       href: '/audit-log',         icon: ScrollText,      perm: 'audit.view' },
    ],
  },
] as const
```

**Sidebar.tsx** renders sections, items, and the collapse toggle. Active item logic: `pathname.startsWith(item.href)`. Tooltip on hover shows the label when collapsed.

**Topbar.tsx** has:
- Hamburger toggle (mobile)
- Breadcrumbs (auto from `pathname` via `lib/system/breadcrumbs.ts`)
- Search shell (`<input>` + `⌘K` hint, opens `CommandPalette`)
- Notification bell (button + badge — fetches from `/api/system/notifications/unread-count` later)
- Density toggle (compact / default / comfortable)
- Theme toggle (next-themes)
- User menu (avatar → "Signed in as …", "Profile", "Sign out")

Detailed component code for these is provided as scaffolding; final visual polish is a paired exercise during the sprint.

**Mobile** — sidebar becomes a `Sheet` on `<lg`. Tested at 375px (iPhone SE).

---

### S1-06 ✅ — Admin primitives: DataTable, PageHeader, EmptyState, etc.  *(2 days)*

**Goal:** the design system is real, not theoretical. Every later screen reuses these.

**Files added (`frontend/src/components/system/primitives/`):**

| File | Purpose | Key API |
|---|---|---|
| `PageHeader.tsx` | Title, description, primary + secondary actions | `<PageHeader title description actions />` |
| `EmptyState.tsx` | Illustration + headline + description + CTA | `<EmptyState icon title description action />` |
| `DataTable.tsx` | TanStack Table v8 wrapper. Sort, filter, pagination, column visibility, row selection | `<DataTable data columns toolbar onRowClick … />` |
| `FilterBar.tsx` | Reusable filter container with date range, status pills, search | `<FilterBar><DateRangeFilter/><StatusFilter/></FilterBar>` |
| `ConfirmDialog.tsx` | "Are you sure?" modal | `await confirm({ title, description, variant: 'danger' })` |
| `MoneyInput.tsx` | Currency-aware number input | `<MoneyInput currency="USD" value onChange />` |
| `MoneyDisplay.tsx` | Read-only money formatter | `<MoneyDisplay value={1250_00} currency="USD" />` |
| `PhoneInput.tsx` | Country-flag + E.164 validation | `<PhoneInput value onChange defaultCountry="US" />` |
| `CountrySelect.tsx` | Combobox of ISO countries | `<CountrySelect value onChange />` |
| `TimezoneSelect.tsx` | Combobox of IANA timezones | `<TimezoneSelect value onChange />` |
| `DateRangePicker.tsx` | react-day-picker range mode | `<DateRangePicker value onChange />` |
| `StatusBadge.tsx` | Color-coded pill | `<StatusBadge value="paid" />` |

`DataTable` is the most-used primitive. Reference shape:

```tsx
import {
  ColumnDef, useReactTable, getCoreRowModel, getSortedRowModel,
  getPaginationRowModel, getFilteredRowModel,
} from '@tanstack/react-table'

interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  toolbar?: React.ReactNode
  onRowClick?: (row: T) => void
  isLoading?: boolean
  emptyState?: React.ReactNode
  density?: 'compact' | 'default' | 'comfortable'
}

export function DataTable<T>({ data, columns, ... }: DataTableProps<T>) {
  // table setup …
  return (
    <div className="rounded-xl border bg-surface-card">
      {toolbar}
      <Table>
        <TableHeader>{ /* sortable, sticky */ }</TableHeader>
        <TableBody>
          {isLoading ? <SkeletonRows /> :
           rows.length === 0 ? <EmptyRow>{emptyState}</EmptyRow> :
           rows.map(...)}
        </TableBody>
      </Table>
      <Pagination />
    </div>
  )
}
```

The full implementation lands in this sprint and is reused everywhere afterward — no per-page table code from SYS-02 onward.

---

### S1-07 ✅ — TanStack Query + typed API client  *(0.5 day)*

**Goal:** every system page gets server-state caching and typed responses for free.

**File:** `frontend/src/lib/system/query-client.tsx`

```tsx
'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }))
  return (
    <QueryClientProvider client={client}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools position="bottom-right" />}
    </QueryClientProvider>
  )
}
```

**File:** `frontend/src/lib/system/api.ts`

```ts
const BASE = process.env.NEXT_PUBLIC_API_URL!
const PREFIX = process.env.NEXT_PUBLIC_SYSTEM_API_PREFIX!

let csrfFetched = false

async function ensureCsrf() {
  if (csrfFetched) return
  await fetch(`${BASE}/sanctum/csrf-cookie`, { credentials: 'include' })
  csrfFetched = true
}

function readCookie(name: string) {
  return document.cookie.split('; ').find(r => r.startsWith(name + '='))?.split('=')[1]
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const isMutating = !!init?.method && init.method !== 'GET'
  if (isMutating) await ensureCsrf()

  const headers = new Headers(init?.headers)
  headers.set('Accept', 'application/json')
  headers.set('Content-Type', 'application/json')
  if (isMutating) {
    const token = decodeURIComponent(readCookie('XSRF-TOKEN') ?? '')
    if (token) headers.set('X-XSRF-TOKEN', token)
  }

  const res = await fetch(`${BASE}${PREFIX}${path}`, {
    ...init,
    credentials: 'include',
    headers,
  })

  if (res.status === 401) {
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login?from=' + encodeURIComponent(window.location.pathname)
    }
    throw new ApiError(401, 'Unauthenticated')
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body.message ?? res.statusText, body.errors)
  }
  return res.json() as Promise<T>
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public errors?: Record<string, string[]>) {
    super(message)
  }
}
```

Usage downstream:

```ts
// frontend/src/hooks/system/useStudents.ts
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/system/api'
import type { Student } from '@/types/system/student'

export function useStudents(params: { status?: string; q?: string } = {}) {
  return useQuery({
    queryKey: ['students', params],
    queryFn: () => api<Paginated<Student>>('/students?' + new URLSearchParams(params)),
  })
}
```

---

### S1-08 ✅ — Laravel: system guard, routes, middleware  *(1 day)*

**Goal:** the backend understands the `system` surface and refuses to mix it with the public API.

#### Sanctum config update

`config/sanctum.php`:

```php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', ...)),
```

`config/cors.php`:

```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_origins' => [
    env('FRONTEND_URL'),                 // alrayan-academy.com
    env('FRONTEND_URL_STAGING'),         // staging.alrayan-academy.com
    env('SYSTEM_FRONTEND_URL'),          // app.alrayan-academy.com
    env('SYSTEM_FRONTEND_URL_STAGING'),  // app-staging.alrayan-academy.com
    'http://localhost:3000',
    'http://app.localhost:3000',
],
'supports_credentials' => true,
```

#### `auth.php`: add the `system` guard

```php
'guards' => [
    'web' => ['driver' => 'session', 'provider' => 'users'],
    'system' => ['driver' => 'sanctum', 'provider' => 'users'], // alias for clarity
],
```

We use the same `users` provider — role-based access is layered via Spatie, not a separate guard. The named guard exists to make it obvious in middleware.

#### `routes/system.php`

```php
<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\System;

Route::prefix('system')->name('system.')->group(function () {
    // Health (no auth)
    Route::get('/health', [System\HealthController::class, 'show'])->name('health');

    // Public auth endpoints (no auth required)
    Route::post('/auth/login',           [System\AuthController::class, 'login'])->name('auth.login');
    Route::post('/auth/forgot-password', [System\AuthController::class, 'forgotPassword'])->name('auth.forgot');
    Route::post('/auth/reset-password',  [System\AuthController::class, 'resetPassword'])->name('auth.reset');

    // Authenticated
    Route::middleware(['auth:sanctum', 'system.active'])->group(function () {
        Route::get('/me',           [System\AuthController::class, 'me'])->name('auth.me');
        Route::post('/auth/logout', [System\AuthController::class, 'logout'])->name('auth.logout');
        // …all other system routes get added in later sprints…
    });
});
```

Register this route file in `app/Providers/RouteServiceProvider.php`:

```php
public function boot(): void
{
    $this->routes(function () {
        Route::middleware('api')->prefix('api')->group(base_path('routes/api.php'));
        Route::middleware('api')->prefix('api')->group(base_path('routes/system.php'));
        Route::middleware('web')->group(base_path('routes/web.php'));
    });
}
```

#### Middleware

**`app/Http/Middleware/System/EnsureSystemActive.php`** — checks `users.is_active = true`. Returns 403 if not.

```php
public function handle(Request $request, Closure $next)
{
    $user = $request->user();
    if (!$user || !$user->is_active) {
        return response()->json(['message' => 'Account inactive'], 403);
    }
    return $next($request);
}
```

Registered as `system.active` in `app/Http/Kernel.php`.

#### Health controller (placeholder)

```php
// app/Http/Controllers/System/HealthController.php
public function show()
{
    return response()->json([
        'status'  => 'ok',
        'version' => config('system.version', '1.0.0'),
        'time'    => now()->toIso8601String(),
    ]);
}
```

#### `config/system.php` (new)

```php
return [
    'version' => '1.0.0',
    'frontend_url' => env('SYSTEM_FRONTEND_URL', 'https://app.alrayan-academy.com'),
    'default_timezone' => env('SYSTEM_DEFAULT_TZ', 'Africa/Cairo'),
    'default_currency' => env('SYSTEM_DEFAULT_CURRENCY', 'USD'),
    'default_base_currency' => 'EGP',
    'features' => [
        'paymob'    => env('PAYMOB_ENABLED', false),
        'zoom'      => env('ZOOM_ENABLED', false),
        'wassender' => env('WASSENDER_ENABLED', false),
    ],
];
```

---

### S1-09 ✅ — Database: Spatie Permission migration  *(0.5 day)*

The system needs the Spatie tables before SYS-02 can seed roles. We install the package and migrate now (no roles seeded yet).

```bash
cd backend
composer require spatie/laravel-permission:^6
php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"
php artisan migrate
```

This creates `roles`, `permissions`, `model_has_roles`, `model_has_permissions`, `role_has_permissions` — the file naming and structure follow Spatie's conventions, not `sys_` prefix (these tables come from a third party). Documented exception in [DATABASE.md](../DATABASE.md).

`config/permission.php` — set `'cache.expiration_time'` to 24h, leave defaults otherwise.

`User` model:

```php
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasRoles;
    // …existing trait imports…
}
```

Add nullable system columns to the existing `users` table via a new migration:

```php
// database/migrations/2026_06_01_000000_add_system_columns_to_users_table.php
Schema::table('users', function (Blueprint $table) {
    $table->enum('role', ['admin','supervisor','teacher'])->nullable()->after('email');
    $table->string('phone', 32)->nullable()->after('role');
    $table->string('whatsapp', 32)->nullable()->after('phone');
    $table->boolean('is_active')->default(true)->after('whatsapp');
    $table->timestamp('last_login_at')->nullable()->after('is_active');
    $table->index(['role', 'is_active']);
});
```

> The `role` column is informational + indexed. Authoritative source for permissions stays the Spatie tables.

---

### S1-10 ✅ — Frontend: login + forgot/reset placeholder pages  *(0.5 day)*

These pages render the design but the form just toasts "SYS-02 wires this up".

**File:** `frontend/src/app/(system)/login/page.tsx`

```tsx
import { LoginForm } from '@/components/system/auth/LoginForm'
import Image from 'next/image'

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex items-center justify-center bg-primary text-cream p-16">
        <div className="max-w-md">
          <Image src="/logo/alrayan-white.svg" alt="" width={140} height={48} priority />
          <h1 className="font-heading text-3xl mt-12">Operations console</h1>
          <p className="opacity-70 mt-4">
            Manage students, teachers, schedules, billing and more — all in one place.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 bg-surface-bg">
        <div className="w-full max-w-sm">
          <h2 className="font-heading text-2xl">Sign in</h2>
          <p className="text-muted text-sm mt-1">Use your academy account.</p>
          <div className="mt-8"><LoginForm /></div>
        </div>
      </div>
    </div>
  )
}
```

`LoginForm` is a placeholder card with email + password + submit. Submit currently calls a stub action that toasts "Coming in SYS-02".

---

### S1-11 ✅ — Conflict-prevention CI script  *(0.5 day)*

**File:** `scripts/check-system-isolation.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

fail=0

# 1. No marketing component imports anything under /system
if rg -n "from ['\"]@/components/system" frontend/src/app/\(marketing\) frontend/src/components/{home,course,layout,pricing,seo,forms} 2>/dev/null \
   | grep -v "components/system/primitives/.*shared" || false ; then
  echo "❌ Marketing code imports system component"
  fail=1
fi

# 2. No marketing component imports lib/system
if rg -n "from ['\"]@/lib/system" frontend/src/app/\(marketing\) frontend/src/components/{home,course,layout,pricing,seo,forms} 2>/dev/null ; then
  echo "❌ Marketing code imports lib/system"
  fail=1
fi

# 3. No public API controller references System namespace
if rg -n "use App\\\\Http\\\\Controllers\\\\System" backend/app/Http/Controllers/Api 2>/dev/null ; then
  echo "❌ Public API controller imports System namespace"
  fail=1
fi

# 4. Every model file under app/Models/System uses System namespace
miss=$(find backend/app/Models/System -name '*.php' -exec grep -L "namespace App\\\\Models\\\\System" {} \;)
if [[ -n "$miss" ]]; then
  echo "❌ Files under Models/System without correct namespace:"
  echo "$miss"
  fail=1
fi

# 5. Every system migration creates a table starting with sys_ (with documented exceptions)
ALLOW_NON_SYS='create_permission_tables|add_system_columns_to_users_table|seed_system_baseline|create_activity_log_table'
for f in $(ls backend/database/migrations/2026_06_*); do
  if ! grep -qE "Schema::create\\('sys_" "$f"; then
    if ! echo "$f" | grep -Eq "$ALLOW_NON_SYS"; then
      echo "❌ System migration without sys_ prefix: $f"
      fail=1
    fi
  fi
done

# 6. routes/system.php must not import anything from Controllers/Api
if rg -n "App\\\\Http\\\\Controllers\\\\Api" backend/routes/system.php 2>/dev/null ; then
  echo "❌ system.php imports Api controllers"
  fail=1
fi

[[ "$fail" == "0" ]] && echo "✓ System isolation checks passed"
exit $fail
```

Add to `.github/workflows/frontend-ci.yml` and `backend-deploy.yml`:

```yaml
- name: System isolation
  run: bash scripts/check-system-isolation.sh
```

---

### S1-12 — Tests  *(1 day)*

**Frontend (Playwright):**

`frontend/e2e/system/host-routing.spec.ts` —

- ✅ `app.localhost:3000/login` returns 200, shows "Sign in"
- ✅ `localhost:3000/login` returns 404
- ✅ `app.localhost:3000/about` returns 404
- ✅ `localhost:3000/about` returns 200

`frontend/e2e/system/shell.spec.ts` —

- ✅ Sidebar collapse persists across reloads
- ✅ Theme toggle persists across reloads
- ✅ Command palette opens on `⌘K` and closes on `Esc`

**Backend (PHPUnit):**

`tests/Feature/System/HealthTest.php` —

- ✅ `GET /api/system/health` returns 200 + `{status: ok}`
- ✅ `GET /api/system/me` without auth returns 401
- ✅ `GET /api/system/me` with auth + inactive user returns 403

`tests/Feature/System/RoutingTest.php` —

- ✅ `routes/system.php` controllers all live under `App\Http\Controllers\System`
- ✅ Hitting an `/api/v1/students` (the public surface) returns 404, not 401

---

### S1-13 — Deploy + smoke pass  *(0.5 day)*

- [ ] Push branch → CI passes (typecheck, lint, isolation script, tests)
- [ ] Vercel preview attaches `app-preview-*.vercel.app` and `preview-*.vercel.app` (both hosts)
- [ ] After merge → staging cuts over: `app-staging.alrayan-academy.com` reachable
- [ ] Production cutover with owner approval
- [ ] Lighthouse CLI on `/login` (the only public page) — capture baseline scores in PR description
- [ ] Owner walks through: visit `/login`, see the design; check responsive at 375px; check dark mode; confirm marketing site is unchanged

---

## File deliverables checklist

A high-level inventory so reviewers can verify nothing was missed.

```
frontend/
├── middleware.ts                                       (NEW)
├── src/
│   ├── app/
│   │   ├── (system)/
│   │   │   ├── layout.tsx                              (NEW)
│   │   │   ├── login/page.tsx                          (NEW)
│   │   │   ├── forgot-password/page.tsx                (NEW placeholder)
│   │   │   ├── reset-password/[token]/page.tsx         (NEW placeholder)
│   │   │   └── …all module folders w/ placeholder page.tsx
│   │   └── not-found.tsx                               (UPDATED to handle both surfaces)
│   ├── components/
│   │   └── system/
│   │       ├── shell/SystemShell.tsx                   (NEW)
│   │       ├── shell/Sidebar.tsx                       (NEW)
│   │       ├── shell/Topbar.tsx                        (NEW)
│   │       ├── shell/CommandPalette.tsx                (NEW stub)
│   │       ├── shell/UserMenu.tsx                      (NEW)
│   │       ├── shell/NotificationBell.tsx              (NEW)
│   │       ├── shell/Breadcrumbs.tsx                   (NEW)
│   │       ├── auth/LoginForm.tsx                      (NEW placeholder)
│   │       └── primitives/{12 files}                   (NEW)
│   ├── lib/
│   │   └── system/
│   │       ├── api.ts                                  (NEW)
│   │       ├── query-client.tsx                        (NEW)
│   │       ├── nav.ts                                  (NEW)
│   │       └── routes.ts                               (NEW)
│   ├── styles/system.css                               (NEW)
│   └── types/system/index.ts                           (NEW barrel)
└── tailwind.config.ts                                  (UPDATED extends)

backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/System/HealthController.php     (NEW)
│   │   ├── Controllers/System/AuthController.php       (NEW skeleton)
│   │   └── Middleware/System/EnsureSystemActive.php    (NEW)
│   └── Providers/RouteServiceProvider.php              (UPDATED)
├── config/
│   ├── sanctum.php                                     (UPDATED)
│   ├── cors.php                                        (UPDATED)
│   ├── permission.php                                  (NEW from Spatie publish)
│   └── system.php                                      (NEW)
├── database/migrations/
│   ├── 2026_06_01_000000_add_system_columns_to_users_table.php  (NEW)
│   └── 2026_06_01_000001_create_permission_tables.php  (Spatie)
└── routes/
    └── system.php                                      (NEW)

scripts/check-system-isolation.sh                       (NEW)
.github/workflows/                                      (UPDATED)
docs/system/sprints/sys-01-foundation.md                (THIS FILE)
```

---

## Risks & open questions

- **Cross-subdomain cookies in development.** Cookies set on `localhost:8000` are not automatically read by `app.localhost:3000`. Workaround documented: contributors run Laravel via `php artisan serve --host=api.localhost --port=8000` and set `SESSION_DOMAIN=.localhost`. Tested in S1-12.
- **Vercel single project, two domains.** Confirmed supported; both domains route to the same Next.js build. Edge cases (preview deployments, branch deployments) need review during Vercel setup.
- **TanStack Query devtools in production.** Gated by `NODE_ENV` — verify no leak into prod bundle.
- **Command palette content.** Empty in SYS-01 — will populate as routes go live in subsequent sprints. Tracked in [../../TODO.md](../../../TODO.md).
- **Logo for system shell.** Reuse `alrayan-white.svg` on the navy sidebar. If owner wants a system-specific mark, that's a 1-day extra in this sprint.

---

## Sprint review demo script

Walk the owner through (~10 minutes):

1. Open `alrayan-academy.com` — site looks unchanged.
2. Open `app.alrayan-academy.com` — redirects to `/login`. Notice the navy left rail and the sign-in card.
3. Try visiting `app.alrayan-academy.com/about` — 404. Try `alrayan-academy.com/students` — 404. The two are isolated.
4. Stub a login by editing local cookie (or shell into Tinker and create a session) — see the dashboard placeholder.
5. Click the sidebar collapse toggle — sidebar narrows. Reload — stays narrow.
6. Toggle dark mode — every surface flips.
7. Hit `⌘K` — command palette opens (empty for now). Hit `Esc`.
8. Resize to 375px — sidebar becomes a Sheet on hamburger click.
9. Show CI run with `check-system-isolation.sh` passing. Show one breaking commit (intentionally importing a system component into a marketing page) failing the check.

---

*Last updated: May 10, 2026*
