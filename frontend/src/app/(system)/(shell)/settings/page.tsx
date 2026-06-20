'use client'
import { useState } from 'react'
import { SlidersHorizontal, BookOpen, Building2 } from 'lucide-react'
import { SubjectsSection } from '@/components/system/settings/SubjectsSection'
import { GeneralSettingsSection } from '@/components/system/settings/GeneralSettingsSection'

const ACCENT = 'rgb(var(--accent))'
const BORDER = 'rgb(var(--border-default, 229 233 240))'
const CARD = 'rgb(var(--surface-card, 255 255 255))'

const TABS = [
  { id: 'subjects', label: 'Subjects', hint: 'Subjects offered by the academy', icon: BookOpen },
  { id: 'general', label: 'General', hint: 'Identity, contact & localization', icon: Building2 },
] as const

type TabId = (typeof TABS)[number]['id']

export default function SettingsPage() {
  const [tab, setTab] = useState<TabId>('subjects')

  return (
    <div className="space-y-7">
      {/* Hero header */}
      <div
        className="relative overflow-hidden rounded-3xl px-7 py-8 sm:px-9"
        style={{ background: 'linear-gradient(120deg, rgb(15 23 42), rgb(30 41 59))' }}
      >
        <div
          className="absolute -right-12 -top-12 w-56 h-56 rounded-full opacity-25 blur-2xl"
          style={{ background: ACCENT }}
        />
        <div className="relative flex items-center gap-5">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm shrink-0 ring-1 ring-white/15">
            <SlidersHorizontal size={26} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight tracking-tight">Settings</h1>
            <p className="mt-1 text-sm text-white/60">Manage your academy configuration in one place.</p>
          </div>
        </div>
      </div>

      {/* Two-column: tab rail + active section */}
      <div className="grid gap-6 lg:grid-cols-[228px_1fr]">
        {/* Tab rail — vertical on desktop, horizontal scroll on mobile */}
        <nav
          className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible lg:sticky lg:top-6 lg:self-start"
        >
          {TABS.map(t => {
            const active = tab === t.id
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`group flex items-center gap-3 whitespace-nowrap lg:whitespace-normal rounded-xl px-3.5 py-3 text-left transition-all duration-200 ${active ? '' : 'hover:bg-black/[0.04]'}`}
                style={
                  active
                    ? { background: CARD, border: `1px solid ${BORDER}`, boxShadow: '0 2px 8px rgb(11 31 58 / 0.06)' }
                    : { border: '1px solid transparent' }
                }
              >
                <span
                  className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0 transition-colors"
                  style={
                    active
                      ? { background: ACCENT, color: '#fff' }
                      : { background: 'rgb(var(--accent) / 0.08)', color: ACCENT }
                  }
                >
                  <Icon size={17} />
                </span>
                <span className="min-w-0">
                  <span
                    className="block text-sm font-semibold leading-tight"
                    style={{ color: active ? 'rgb(15 23 42)' : 'rgb(51 65 85)' }}
                  >
                    {t.label}
                  </span>
                  <span className="hidden lg:block text-xs mt-0.5 opacity-50 leading-snug">{t.hint}</span>
                </span>
              </button>
            )
          })}
        </nav>

        {/* Active section */}
        <div className="min-w-0">{tab === 'subjects' ? <SubjectsSection /> : <GeneralSettingsSection />}</div>
      </div>
    </div>
  )
}
