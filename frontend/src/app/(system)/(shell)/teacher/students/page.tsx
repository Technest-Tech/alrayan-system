'use client'
import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { TeacherStudentCards } from '@/components/system/teachers/TeacherStudentCards'
import { useMyStudents } from '@/hooks/system/useMyStudents'
import { useI18n } from '@/lib/system/i18n'
import type { Student, StudentStatus } from '@/types/system/student'

type TabKey = 'all' | StudentStatus

const TABS: { key: TabKey; label: string; color: string }[] = [
  { key: 'all',       label: 'common.total',      color: 'rgb(11 31 58)'    },
  { key: 'active',    label: 'status.active',      color: 'rgb(14 124 90)'   },
  { key: 'trial',     label: 'status.trial',       color: 'rgb(30 90 171)'   },
  { key: 'paused',    label: 'status.paused',      color: 'rgb(154 113 23)'  },
  { key: 'cancelled', label: 'status.cancelled',   color: 'rgb(107 114 128)' },
]

export default function TeacherStudentsPage() {
  const { t } = useI18n()
  const { data: students = [], isLoading } = useMyStudents()
  const [tab, setTab] = useState<TabKey>('all')
  const [q, setQ] = useState('')

  const counts = useMemo(() => {
    const by = (s: StudentStatus) => students.filter(x => x.status === s).length
    return { all: students.length, active: by('active'), trial: by('trial'), paused: by('paused') + by('suspended'), cancelled: by('cancelled') } as Record<TabKey, number>
  }, [students])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return students.filter((s: Student) => {
      const matchesTab =
        tab === 'all' ? true
        : tab === 'paused' ? (s.status === 'paused' || s.status === 'suspended')
        : s.status === tab
      const matchesQ = !needle || s.name.toLowerCase().includes(needle) || (s.email ?? '').toLowerCase().includes(needle)
      return matchesTab && matchesQ
    })
  }, [students, tab, q])

  const selStyle = {
    background: 'rgb(var(--surface-card, 255 255 255))',
    borderColor: 'rgb(var(--border-default, 229 233 240))',
  } as const

  return (
    <>
      <PageHeader title={t('users.teacherMyStudents')} description={t('users.teacherMyStudentsDescription')} />

      {/* Filter tabs + search */}
      <div className="rounded-xl border mb-5 overflow-hidden" style={selStyle}>
        <div className="flex flex-wrap items-center gap-1.5 px-3 py-3 border-b" style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}>
          {TABS.map(({ key, label, color }) => {
            const active = tab === key
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={active
                  ? { background: color, color: '#fff' }
                  : { color: 'rgb(90 100 112)', background: 'rgb(var(--surface-card-2, 248 250 252))' }}
              >
                {t(label)}
                <span className="tabular-nums opacity-80">{counts[key] ?? 0}</span>
              </button>
            )
          })}
        </div>
        <div className="px-3 py-3">
          <div className="relative max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('teacher.students.searchPlaceholder')}
              className="w-full pl-8 pr-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)] transition-shadow"
              style={selStyle}
            />
          </div>
        </div>
      </div>

      <TeacherStudentCards students={filtered} isLoading={isLoading} showStats={false} />
    </>
  )
}
