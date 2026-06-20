'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight, Languages } from 'lucide-react'
import type { NavSection } from '@/lib/system/nav'
import { useI18n } from '@/lib/system/i18n'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  nav: NavSection[]
  mobileOpen: boolean
  onMobileClose: () => void
}

export function Sidebar({ collapsed, onToggle, nav, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const showLabels = !collapsed || mobileOpen
  const { locale, setLocale, t } = useI18n()

  return (
    <>
      {/* Mobile backdrop */}
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
          collapsed ? 'w-[260px] lg:w-[72px]' : 'w-[260px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
        style={{ background: 'rgb(var(--surface-sidebar, 11 31 58))' }}
      >
        {/* Logo — links to dashboard */}
        <Link
          href="/dashboard"
          onClick={onMobileClose}
          className="flex items-center justify-center h-[64px] px-4 border-b border-white/10 shrink-0 hover:bg-white/5 transition-colors"
          aria-label="Go to dashboard"
        >
          {showLabels ? (
            <div className="flex flex-col leading-none text-center">
              <span className="font-display text-[1.6rem] font-semibold tracking-tight text-white">
                Azhary
              </span>
              <span className="text-[0.6rem] font-semibold uppercase tracking-[0.22em] mt-0.5" style={{ color: '#C9A24B' }}>
                Quran Academy
              </span>
            </div>
          ) : (
            <span className="font-display text-[1.4rem] font-bold text-white leading-none">A</span>
          )}
        </Link>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
          {nav.map((section) => (
            <div key={section.label}>
              {showLabels && (
                <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-white/40">
                  {t(section.label)}
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
                        title={!showLabels ? t(item.label) : undefined}
                        onClick={onMobileClose}
                        className={[
                          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                          active
                            ? 'text-white'
                            : 'text-white/60 hover:text-white hover:bg-white/8',
                        ].join(' ')}
                        style={active ? { background: 'rgb(var(--surface-sidebar-active, 14 124 90))' } : {}}
                      >
                        <Icon size={18} className="shrink-0" />
                        {showLabels && <span className="truncate">{t(item.label)}</span>}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Language switcher */}
        <div className="shrink-0 border-t border-white/10 px-2 py-3">
          {showLabels ? (
            <div className="flex items-center gap-2 px-3">
              <Languages size={15} className="shrink-0 text-white/40" />
              <span className="flex-1 text-xs text-white/40">{t('sidebar.language')}</span>
              <button
                onClick={() => setLocale('en')}
                className={`text-xs font-semibold transition-colors ${
                  locale === 'en' ? 'text-white' : 'text-white/40 hover:text-white/70'
                }`}
              >
                EN
              </button>
              <span className="text-white/20 text-xs select-none">|</span>
              <button
                onClick={() => setLocale('fr')}
                className={`text-xs font-semibold transition-colors ${
                  locale === 'fr' ? 'text-white' : 'text-white/40 hover:text-white/70'
                }`}
              >
                FR
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-0.5">
              <button
                onClick={() => setLocale('en')}
                className={`text-[10px] font-bold leading-5 transition-colors ${
                  locale === 'en' ? 'text-white' : 'text-white/40 hover:text-white/70'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLocale('fr')}
                className={`text-[10px] font-bold leading-5 transition-colors ${
                  locale === 'fr' ? 'text-white' : 'text-white/40 hover:text-white/70'
                }`}
              >
                FR
              </button>
            </div>
          )}
        </div>

        {/* Collapse toggle — floating edge tab, desktop only */}
        <button
          onClick={onToggle}
          aria-label={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
          className="hidden lg:flex absolute -right-3 top-[76px] w-6 h-6 items-center justify-center rounded-full border border-white/20 text-white/60 hover:text-white hover:border-white/50 transition-all duration-200 shadow-lg z-50"
          style={{ background: 'rgb(var(--surface-sidebar, 11 31 58))' }}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>
    </>
  )
}
