'use client'
import { useMemo, useState } from 'react'
import { BookOpen, Search, CheckCircle2, Users, GraduationCap } from 'lucide-react'
// Section header lives in settings/layout.tsx; this page renders the Subjects content.
import { EmptyState } from '@/components/system/primitives/EmptyState'
import { CourseGrid } from '@/components/system/courses/CourseGrid'
import { CourseToggleSheet } from '@/components/system/courses/CourseToggleSheet'
import { useCourses } from '@/hooks/system/useCourses'
import { useI18n } from '@/lib/system/i18n'
import type { SystemCourse } from '@/types/system/course'

const BORDER = 'rgb(var(--border-default, 229 233 240))'

/* ─── summary stat card ───────────────────────────────────────────── */
function SummaryCard({
  icon, value, label, from, to,
}: { icon: React.ReactNode; value: number; label: string; from: string; to: string }) {
  return (
    <div
      className="flex items-center gap-3.5 rounded-2xl px-4 py-3.5"
      style={{ background: 'rgb(var(--surface-card, 255 255 255))', border: `1px solid ${BORDER}`, boxShadow: '0 1px 2px rgb(11 31 58 / 0.04)' }}
    >
      <div
        className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0 text-white"
        style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold tabular-nums leading-none" style={{ color: 'rgb(15 23 42)' }}>{value}</p>
        <p className="text-xs font-medium mt-1 opacity-50">{label}</p>
      </div>
    </div>
  )
}

export default function SubjectsPage() {
  const { t } = useI18n()
  const { data: courses = [], isLoading } = useCourses()
  const [editing, setEditing] = useState<SystemCourse | null>(null)
  const [query, setQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState<string>('all')

  const levels = useMemo(
    () => Array.from(new Set(courses.map(c => c.level).filter(Boolean) as string[])),
    [courses],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return courses.filter(c => {
      const matchesQuery = !q
        || c.name.toLowerCase().includes(q)
        || (c.description ?? '').toLowerCase().includes(q)
      const matchesLevel = levelFilter === 'all' || c.level === levelFilter
      return matchesQuery && matchesLevel
    })
  }, [courses, query, levelFilter])

  const stats = useMemo(() => ({
    total:    courses.length,
    active:   courses.filter(c => c.is_active_for_system).length,
    students: courses.reduce((sum, c) => sum + c.total_student_count, 0),
    teachers: courses.reduce((sum, c) => sum + c.teacher_count, 0),
  }), [courses])

  return (
    <div className="space-y-6">
      {/* Section heading */}
      <div>
        <h2 className="text-lg font-bold" style={{ color: 'rgb(15 23 42)' }}>{t('courses.pageTitle')}</h2>
        <p className="mt-0.5 text-sm opacity-55">{t('courses.pageSubtitle')}</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard icon={<BookOpen size={20} />}     value={stats.total}    label={t('courses.statTotalSubjects')} from="rgb(99 102 241)" to="rgb(79 70 229)" />
        <SummaryCard icon={<CheckCircle2 size={20} />} value={stats.active}   label={t('status.active')}             from="rgb(16 185 129)" to="rgb(5 150 105)" />
        <SummaryCard icon={<Users size={20} />}        value={stats.students} label={t('courses.statStudents')}      from="rgb(59 130 246)" to="rgb(37 99 235)" />
        <SummaryCard icon={<GraduationCap size={20} />} value={stats.teachers} label={t('courses.statTeachers')}     from="rgb(245 158 11)" to="rgb(217 119 6)" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('courses.searchPlaceholder')}
            className="w-full rounded-xl border pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] transition-shadow"
            style={{ borderColor: BORDER, background: 'rgb(var(--surface-card, 255 255 255))' }}
          />
        </div>

        {levels.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {['all', ...levels].map(lvl => {
              const active = levelFilter === lvl
              return (
                <button
                  key={lvl}
                  onClick={() => setLevelFilter(lvl)}
                  className="whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-semibold capitalize transition-colors"
                  style={{
                    background: active ? 'rgb(var(--accent))' : 'rgb(var(--surface-card, 255 255 255))',
                    color: active ? '#fff' : 'rgb(100 116 139)',
                    border: `1px solid ${active ? 'rgb(var(--accent))' : BORDER}`,
                  }}
                >
                  {lvl === 'all' ? t('courses.allLevels') : lvl}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div
              key={i}
              className="h-52 rounded-2xl animate-pulse"
              style={{ background: 'rgb(var(--surface-card-2, 248 250 252))', border: `1px solid ${BORDER}` }}
            />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <EmptyState
          icon="BookOpen"
          title={t('courses.emptyTitle')}
          description={t('courses.emptyDescription')}
        />
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm font-medium" style={{ color: 'rgb(15 23 42)' }}>{t('courses.noFilterMatch')}</p>
          <button
            onClick={() => { setQuery(''); setLevelFilter('all') }}
            className="mt-2 text-sm font-semibold"
            style={{ color: 'rgb(var(--accent))' }}
          >
            {t('courses.clearFilters')}
          </button>
        </div>
      ) : (
        <CourseGrid courses={filtered} onEdit={setEditing} />
      )}

      <CourseToggleSheet course={editing} onClose={() => setEditing(null)} />
    </div>
  )
}
