'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useUser } from '@/lib/system/auth'
import { can } from '@/lib/system/permissions'
import { SYSTEM_NAV } from '@/lib/system/nav'
import type { AuthUser } from '@/types/system/auth'
import type { NavSection } from '@/lib/system/nav'

const UserContext = createContext<AuthUser | null>(null)
export const useSystemUser = () => useContext(UserContext)

function FullPageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'rgb(var(--surface-bg, 244 246 250))' }}>
      <div className="w-8 h-8 rounded-full border-4 border-[rgb(14,124,90)] border-t-transparent animate-spin" />
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

const AUTH_PATHS = ['/login', '/forgot-password', '/reset-password']

export function SystemShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mounted,   setMounted]   = useState(false)
  const pathname = usePathname()
  const router   = useRouter()

  const isAuthRoute = AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))

  const { data: user, isLoading, error } = useUser()

  useEffect(() => {
    const stored = localStorage.getItem('system:sidebar:collapsed')
    if (stored) setCollapsed(stored === '1')
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isAuthRoute && error) {
      router.push('/login?from=' + encodeURIComponent(pathname))
    }
  }, [error, isAuthRoute, pathname, router])

  function toggle() {
    setCollapsed((c) => {
      localStorage.setItem('system:sidebar:collapsed', !c ? '1' : '0')
      return !c
    })
  }

  if (!mounted) return null
  if (isAuthRoute) return <>{children}</>
  if (isLoading || !user) return <FullPageSpinner />

  const nav = navForUser(user)

  return (
    <UserContext.Provider value={user}>
      <div data-system-root="true" className="min-h-screen flex">
        <Sidebar collapsed={collapsed} onToggle={toggle} nav={nav} />
        <div
          className="flex-1 flex flex-col transition-all duration-200"
          style={{ marginLeft: collapsed ? '72px' : '260px' }}
        >
          <Topbar onToggleSidebar={toggle} />
          <main className="flex-1 px-6 py-6">
            <div className="max-w-[1600px] mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </UserContext.Provider>
  )
}
