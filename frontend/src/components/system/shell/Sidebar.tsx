'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { NavSection } from '@/lib/system/nav'
import Image from 'next/image'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  nav: NavSection[]
  mobileOpen: boolean
  onMobileClose: () => void
}

export function Sidebar({ collapsed, onToggle, nav, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  // Show labels when desktop-expanded OR when mobile drawer is open
  const showLabels = !collapsed || mobileOpen

  return (
    <>
      {/* Mobile backdrop — fades in/out behind the drawer */}
      <div
        aria-hidden="true"
        className={`lg:hidden fixed inset-0 bg-black/50 z-30 transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onMobileClose}
      />

      <aside
        className={[
          'fixed top-0 left-0 h-full z-40 flex flex-col transition-all duration-300',
          // Mobile: always 260px wide; desktop: narrows to 72px when collapsed
          collapsed ? 'w-[260px] lg:w-[72px]' : 'w-[260px]',
          // Mobile: slides in/out; desktop: always visible
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
        style={{ background: 'rgb(var(--surface-sidebar, 11 31 58))' }}
      >
        {/* Logo */}
        <div className="flex items-center h-[60px] px-4 border-b border-white/10 shrink-0">
          {showLabels ? (
            <Image
              src="/logo/alrayan-white.svg"
              alt="Alrayan Academy"
              width={120}
              height={32}
              className="shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-sm">A</span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
          {nav.map((section) => (
            <div key={section.label}>
              {showLabels && (
                <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-white/40">
                  {section.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon   = item.icon
                  const active = pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        title={!showLabels ? item.label : undefined}
                        onClick={onMobileClose}
                        className={[
                          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                          active
                            ? 'text-white'
                            : 'text-white/60 hover:text-white hover:bg-white/8',
                        ].join(' ')}
                        style={active ? { background: 'rgb(var(--surface-sidebar-active, 14 124 90))' } : {}}
                      >
                        {/* Icon — with dot badge when collapsed */}
                        <span className="relative shrink-0">
                          <Icon size={18} />
                          {!showLabels && item.badge ? (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2"
                                  style={{ borderColor: 'rgb(var(--surface-sidebar, 11 31 58))' }} />
                          ) : null}
                        </span>
                        {showLabels && (
                          <>
                            <span className="flex-1 truncate">{item.label}</span>
                            {item.badge ? (
                              <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold px-1 shrink-0">
                                {item.badge > 99 ? '99+' : item.badge}
                              </span>
                            ) : null}
                          </>
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Collapse toggle — desktop only */}
        <div className="hidden lg:block shrink-0 px-2 pb-4">
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/8 transition-colors text-sm"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : (
              <>
                <ChevronLeft size={16} />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  )
}
