'use client'
import { useMemo, useState } from 'react'
import { BookOpen, Search, Users, Plus, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/system/primitives/EmptyState'
import { useConfirm } from '@/components/system/primitives/ConfirmDialog'
import {
  useCourses,
  useToggleCourseActive,
  useCreateCourse,
  useDeleteCourse,
} from '@/hooks/system/useCourses'
import { ApiError } from '@/lib/system/api'
import { useI18n } from '@/lib/system/i18n'
import type { SystemCourse } from '@/types/system/course'

const ACCENT = 'rgb(var(--accent))'
const BORDER = 'rgb(var(--border-default, 229 233 240))'
const CARD = 'rgb(var(--surface-card, 255 255 255))'

const LEVELS = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'] as const

/* ─── single subject row — name, level, students, toggle, delete ─── */
function SubjectRow({
  course,
  first,
  onDelete,
}: {
  course: SystemCourse
  first?: boolean
  onDelete: (course: SystemCourse) => void
}) {
  const { t } = useI18n()
  const toggle = useToggleCourseActive()
  const active = course.is_active_for_system

  async function onToggle() {
    try {
      await toggle.mutateAsync({ id: course.id, is_active_for_system: !active })
      toast.success(
        active
          ? t('courses.toggle.deactivated', { name: course.name })
          : t('courses.toggle.activated', { name: course.name }),
      )
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t('courses.toggle.error'))
    }
  }

  return (
    <div
      className="flex items-center gap-4 px-5 py-3.5"
      style={first ? undefined : { borderTop: `1px solid ${BORDER}` }}
    >
      <div
        className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
        style={{ background: 'rgb(var(--accent) / 0.10)', color: ACCENT }}
      >
        <BookOpen size={18} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm truncate" style={{ color: 'rgb(15 23 42)' }}>
            {course.name}
          </p>
          {course.level && (
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wide capitalize"
              style={{ background: 'rgb(241 245 249)', color: 'rgb(100 116 139)' }}
            >
              {course.level}
            </span>
          )}
        </div>
        {course.description && (
          <p className="text-xs mt-0.5 truncate" style={{ color: 'rgb(100 116 139)' }}>
            {course.description}
          </p>
        )}
      </div>

      <div
        className="hidden sm:flex items-center gap-1.5 text-xs shrink-0"
        style={{ color: 'rgb(100 116 139)' }}
        title={t('courses.statStudents')}
      >
        <Users size={14} />
        <span className="tabular-nums font-medium">{course.total_student_count}</span>
      </div>

      <button
        role="switch"
        aria-checked={active}
        onClick={onToggle}
        disabled={toggle.isPending}
        className="relative w-11 h-6 rounded-full transition-colors duration-200 disabled:opacity-50 shrink-0"
        style={{ background: active ? 'rgb(var(--status-success, 14 124 90))' : 'rgb(148 163 184 / 0.4)' }}
        title={active ? t('status.active') : t('status.inactive')}
      >
        <span
          className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
          style={{ transform: active ? 'translateX(20px)' : 'translateX(0)' }}
        />
      </button>

      <button
        onClick={() => onDelete(course)}
        className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
        title={t('courses.manage.deleteAction')}
        aria-label={t('courses.manage.deleteAction')}
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}

/* ─── inline "add subject" form ─── */
function AddSubjectForm({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()
  const create = useCreateCourse()
  const [name, setName] = useState('')
  const [level, setLevel] = useState<string>('All Levels')
  const [description, setDescription] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    try {
      await create.mutateAsync({ name: trimmed, level, description: description.trim() || null })
      toast.success(t('courses.manage.created', { name: trimmed }))
      onClose()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t('courses.manage.createError'))
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl p-5"
      style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: '0 1px 2px rgb(11 31 58 / 0.04)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm" style={{ color: 'rgb(15 23 42)' }}>
          {t('courses.manage.addTitle')}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="opacity-40 hover:opacity-70 transition-opacity"
          aria-label={t('courses.manage.cancel')}
        >
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">
            {t('courses.manage.nameLabel')}
            <span className="text-red-500"> *</span>
          </label>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={t('courses.manage.namePlaceholder')}
            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] transition-shadow"
            style={{ borderColor: BORDER, background: CARD }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">{t('courses.manage.levelLabel')}</label>
          <select
            value={level}
            onChange={e => setLevel(e.target.value)}
            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] transition-shadow"
            style={{ borderColor: BORDER, background: CARD }}
          >
            {LEVELS.map(l => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1.5">{t('courses.manage.descriptionLabel')}</label>
          <input
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={t('courses.manage.descriptionPlaceholder')}
            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] transition-shadow"
            style={{ borderColor: BORDER, background: CARD }}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 mt-5">
        <button
          type="submit"
          disabled={create.isPending || !name.trim()}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-opacity"
          style={{ background: ACCENT }}
        >
          {create.isPending ? t('courses.manage.creating') : t('courses.manage.create')}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 rounded-xl text-sm font-medium border transition-colors hover:bg-black/5"
          style={{ borderColor: BORDER }}
        >
          {t('courses.manage.cancel')}
        </button>
      </div>
    </form>
  )
}

export function SubjectsSection() {
  const { t } = useI18n()
  const confirm = useConfirm()
  const { data: courses = [], isLoading } = useCourses()
  const remove = useDeleteCourse()
  const [query, setQuery] = useState('')
  const [adding, setAdding] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return courses
    return courses.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        (c.description ?? '').toLowerCase().includes(q) ||
        (c.level ?? '').toLowerCase().includes(q),
    )
  }, [courses, query])

  const activeCount = useMemo(() => courses.filter(c => c.is_active_for_system).length, [courses])

  async function onDelete(course: SystemCourse) {
    const ok = await confirm({
      title: t('courses.manage.deleteTitle'),
      description: t('courses.manage.deleteConfirm', { name: course.name }),
      confirmLabel: t('courses.manage.deleteAction'),
      variant: 'danger',
    })
    if (!ok) return
    try {
      await remove.mutateAsync(course.id)
      toast.success(t('courses.manage.deleted', { name: course.name }))
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t('courses.manage.deleteError'))
    }
  }

  return (
    <div className="space-y-4">
      {/* Compact toolbar — active count + search + add */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h2 className="text-lg font-bold" style={{ color: 'rgb(15 23 42)' }}>
            {t('courses.pageTitle')}
          </h2>
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full tabular-nums"
            style={{ background: 'rgb(var(--accent) / 0.10)', color: ACCENT }}
          >
            {activeCount} / {courses.length} {t('status.active').toLowerCase()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-60">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t('courses.searchPlaceholder')}
              className="w-full rounded-xl border pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] transition-shadow"
              style={{ borderColor: BORDER, background: CARD }}
            />
          </div>
          <button
            onClick={() => setAdding(a => !a)}
            className="flex items-center gap-1.5 whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ background: ACCENT }}
            disabled={adding}
          >
            <Plus size={16} />
            <span className="hidden sm:inline">{t('courses.manage.addSubject')}</span>
          </button>
        </div>
      </div>

      {/* Add form */}
      {adding && <AddSubjectForm onClose={() => setAdding(false)} />}

      {/* Subject list */}
      {isLoading ? (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: CARD, border: `1px solid ${BORDER}` }}
        >
          {[1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className="flex items-center gap-4 px-5 py-3.5"
              style={i === 1 ? undefined : { borderTop: `1px solid ${BORDER}` }}
            >
              <div className="w-10 h-10 rounded-xl animate-pulse" style={{ background: 'rgb(241 245 249)' }} />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/3 rounded animate-pulse" style={{ background: 'rgb(241 245 249)' }} />
                <div className="h-2.5 w-1/2 rounded animate-pulse" style={{ background: 'rgb(241 245 249)' }} />
              </div>
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <EmptyState icon="BookOpen" title={t('courses.emptyTitle')} description={t('courses.emptyDescription')} />
      ) : filtered.length === 0 ? (
        <div className="py-14 text-center">
          <p className="text-sm font-medium" style={{ color: 'rgb(15 23 42)' }}>
            {t('courses.noFilterMatch')}
          </p>
          <button onClick={() => setQuery('')} className="mt-2 text-sm font-semibold" style={{ color: ACCENT }}>
            {t('courses.clearFilters')}
          </button>
        </div>
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: CARD, border: `1px solid ${BORDER}` }}
        >
          {filtered.map((course, i) => (
            <SubjectRow key={course.id} course={course} first={i === 0} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
