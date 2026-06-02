'use client'
import { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useUser } from '@/lib/system/auth'
import { ApiError } from '@/lib/system/api'
import { can } from '@/lib/system/permissions'
import { SYSTEM_NAV } from '@/lib/system/nav'
import { useSessions } from '@/hooks/system/useSessions'
import type { AuthUser } from '@/types/system/auth'
import type { NavSection } from '@/lib/system/nav'
import type { Session } from '@/types/system/session'

const UserContext = createContext<AuthUser | null>(null)
export const useSystemUser = () => useContext(UserContext)

function FullPageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'rgb(var(--surface-bg, 244 246 250))' }}>
      <div className="w-8 h-8 rounded-full border-4 border-[rgb(14,124,90)] border-t-transparent animate-spin" />
    </div>
  )
}

function FullPageError({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : 'Unexpected error'
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'rgb(var(--surface-bg, 244 246 250))' }}>
      <div className="text-center space-y-3">
        <p className="text-sm font-medium opacity-70">Failed to load session</p>
        <p className="text-xs opacity-40">{message}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-xs px-4 py-2 rounded-lg border opacity-60 hover:opacity-100 transition-opacity"
        >
          Retry
        </button>
      </div>
    </div>
  )
}

function navForUser(user: AuthUser): NavSection[] {
  return SYSTEM_NAV.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      if (!item.perm) return true
      return can(user, item.perm as Parameters<typeof can>[1])
    }),
  })).filter((section) => section.items.length > 0)
}


export function SystemShell({ children }: { children: React.ReactNode }) {
  const [collapsed,   setCollapsed]   = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [mounted,     setMounted]     = useState(false)
  const pathname = usePathname()
  const router   = useRouter()

  const { data: user, isLoading, error } = useUser()

  useEffect(() => {
    const stored = localStorage.getItem('system:sidebar:collapsed')
    if (stored) setCollapsed(stored === '1')
    setMounted(true)
  }, [])

  // Close mobile drawer on navigation
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Lock body scroll while mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const isUnauthorized = error instanceof ApiError && error.status === 401

  useEffect(() => {
    if (!isLoading && isUnauthorized) {
      router.push('/login?from=' + encodeURIComponent(pathname))
    }
  }, [isUnauthorized, isLoading, pathname, router])

  function toggle() {
    setCollapsed((c) => {
      localStorage.setItem('system:sidebar:collapsed', !c ? '1' : '0')
      return !c
    })
  }

  // Today's pending attendance count for sidebar badge
  const todayStr = new Date().toISOString().split('T')[0]
  const { data: todayData } = useSessions({
    from:     `${todayStr}T00:00:00Z`,
    to:       `${todayStr}T23:59:59Z`,
    per_page: 200,
  })
  const pendingCount = useMemo(() => {
    const list = (todayData as { data?: Session[] } | undefined)?.data ?? []
    return list.filter(s => s.status === 'scheduled' || s.status === 'pending_substitute').length
  }, [todayData])

  if (!mounted) return null
  if (isLoading) return <FullPageSpinner />
  if (!user) return isUnauthorized ? <FullPageSpinner /> : <FullPageError error={error} />

  const baseNav = navForUser(user)
  const nav: NavSection[] = pendingCount > 0
    ? baseNav.map(section => ({
        ...section,
        items: section.items.map(item =>
          item.href === '/attendance' ? { ...item, badge: pendingCount } : item
        ),
      }))
    : baseNav

  return (
    <UserContext.Provider value={user}>
      <div data-system-root="true" className="min-h-screen flex">
        <Sidebar
          collapsed={collapsed}
          onToggle={toggle}
          nav={nav}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
        {/* On mobile: no margin (sidebar is an overlay). On desktop: margin matches sidebar width. */}
        <div
          className={`flex-1 min-w-0 flex flex-col transition-all duration-300 ${
            collapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]'
          }`}
        >
          <Topbar onToggleSidebar={() => setMobileOpen(true)} />
          <main className="flex-1 min-w-0 px-4 py-4 lg:px-6 lg:py-6 overflow-x-hidden">
            <div className="max-w-[1600px] mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </UserContext.Provider>
  )
}
