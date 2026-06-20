'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, RotateCcw, Users, GraduationCap, Clock, PauseCircle } from 'lucide-react'
import { StudentTable } from '@/components/system/students/StudentTable'
import { AddStudentDialog } from '@/components/system/students/AddStudentDialog'
import { SavedViewsDropdown } from '@/components/system/primitives/SavedViewsDropdown'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useStudents } from '@/hooks/system/useStudents'
import { useCourses } from '@/hooks/system/useCourses'
import { useTeachers } from '@/hooks/system/useTeachers'
import { useUrlFilters } from '@/lib/system/filters'
import { useI18n } from '@/lib/system/i18n'
import type { Student } from '@/types/system/student'

const STATUS_PILLS = [
  { value: '',          key: 'common.all' },
  { value: 'trial',     key: 'status.trial' },
  { value: 'active',    key: 'status.active' },
  { value: 'paused',    key: 'status.paused' },
  { value: 'suspended', key: 'status.suspended' },
  { value: 'cancelled', key: 'status.cancelled' },
]

// sentinel keeps empty-string "all" out of the Select value prop
const ALL = '_all_'
function toFilter(v: string) { return v === ALL ? '' : v }
function toSelect(v: string) { return v || ALL }

const selStyle = { borderColor: 'rgb(var(--border-default,229 233 240))', background: '#fff' }

export default function StudentsPage() {
  const router  = useRouter()
  const { t }   = useI18n()
  const [dialogOpen, setDialogOpen] = useState(false)
  const { filters, setFilter, resetFilters } = useUrlFilters(['q', 'status', 'course_id', 'assigned_teacher_id', 'country', 'student_type'])

  const { data, isLoading } = useStudents({
    q:                   filters.q || undefined,
    status:              filters.status || undefined,
    course_id:           filters.course_id || undefined,
    assigned_teacher_id: filters.assigned_teacher_id || undefined,
    country:             filters.country || undefined,
    student_type:        filters.student_type || undefined,
  })

  const { data: courses = [] }  = useCourses()
  const { data: teachersData }  = useTeachers()
  const teachers = teachersData?.data ?? []

  const students: Student[] = data?.data ?? []
  const hasFilters = Object.values(filters).some(Boolean)

  const stats = useMemo(() => {
    const list = data?.data ?? []
    return {
      total:  list.length,
      active: list.filter(s => s.status === 'active').length,
      trial:  list.filter(s => s.status === 'trial').length,
      paused: list.filter(s => s.status === 'paused' || s.status === 'suspended').length,
    }
  }, [data])

  return (
    <>
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'rgb(11 31 58)' }}>{t('students.title')}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgb(90 100 112)' }}>{t('students.subtitle')}</p>
        </div>
        <button
          onClick={() => setDialogOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
          style={{ background: 'rgb(14 124 90)' }}
        >
          <Plus size={15} />
          {t('students.addStudent')}
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <StatCard icon={<Users size={15} />}       label={t('common.total')}         value={stats.total}    accent="#0B1F3A" />
        <StatCard icon={<GraduationCap size={15} />} label={t('status.active')}        value={stats.active}   accent="rgb(14 124 90)" />
        <StatCard icon={<Clock size={15} />}         label={t('status.trial')}         value={stats.trial}    accent="rgb(30 90 171)" />
        <StatCard icon={<PauseCircle size={15} />}   label={t('status.paused')}        value={stats.paused}   accent="rgb(154 113 23)" />
      </div>

      {/* ── Filters card ── */}
      <div
        className="rounded-xl border mb-4 overflow-hidden"
        style={{ borderColor: 'rgb(var(--border-default,229 233 240))', background: '#fff' }}
      >
        {/* Status pills row */}
        <div
          className="flex items-center gap-1.5 px-4 py-3 border-b overflow-x-auto"
          style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}
        >
          {STATUS_PILLS.map((p) => {
            const active = filters.status === p.value
            return (
              <button
                key={p.value}
                onClick={() => setFilter('status', p.value)}
                className="px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all"
                style={active ? {
                  background: 'rgb(14 124 90)',
                  color: '#fff',
                  boxShadow: '0 1px 4px rgb(14 124 90 / 0.3)',
                } : {
                  background: 'transparent',
                  color: 'rgb(90 100 112)',
                  border: '1px solid rgb(var(--border-default,229 233 240))',
                }}
              >
                {t(p.key)}
              </button>
            )
          })}
        </div>

        {/* Other filters row */}
        <div className="flex flex-wrap items-center gap-3 px-4 py-3">
          <div className="relative flex-1 min-w-44 max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
            <input
              value={filters.q}
              onChange={(e) => setFilter('q', e.target.value)}
              placeholder={t('students.search')}
              className="w-full pl-8 pr-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)] transition-shadow"
              style={selStyle}
            />
          </div>

          <Select value={toSelect(filters.course_id)} onValueChange={v => setFilter('course_id', toFilter(v))}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t('students.filterAllCourses')}</SelectItem>
              {courses.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={toSelect(filters.assigned_teacher_id)} onValueChange={v => setFilter('assigned_teacher_id', toFilter(v))}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t('students.filterAllTeachers')}</SelectItem>
              {teachers.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={toSelect(filters.student_type)} onValueChange={v => setFilter('student_type', toFilter(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t('students.filterAllTypes')}</SelectItem>
              <SelectItem value="child">{t('students.typeChild')}</SelectItem>
              <SelectItem value="adult">{t('students.typeAdult')}</SelectItem>
            </SelectContent>
          </Select>

          <SavedViewsDropdown context="students" onApply={(p) => router.push('?' + p, { scroll: false })} />

          {hasFilters && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border hover:bg-black/5 transition-colors opacity-60 hover:opacity-100"
              style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}
            >
              <RotateCcw size={12} />
              {t('common.reset')}
            </button>
          )}
        </div>
      </div>

      <StudentTable
        data={students}
        isLoading={isLoading}
        onRowClick={(s) => router.push(`/students/${s.id}`)}
      />

      <AddStudentDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  )
}

/* ─── Stat card ────────────────────────────────── */
function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent: string }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3.5 rounded-xl border"
      style={{ background: '#fff', borderColor: 'rgb(var(--border-default,229 233 240))' }}
    >
      <div
        className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
        style={{ background: `color-mix(in srgb, ${accent} 10%, transparent)`, color: accent }}
      >
        {icon}
      </div>
      <div>
        <p className="text-xl font-semibold leading-none" style={{ color: 'rgb(11 31 58)' }}>{value}</p>
        <p className="text-xs mt-0.5" style={{ color: 'rgb(90 100 112)' }}>{label}</p>
      </div>
    </div>
  )
}
