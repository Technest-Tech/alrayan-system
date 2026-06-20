'use client'
import { Settings2, Users, UserCheck, BookOpen, PauseCircle, GraduationCap } from 'lucide-react'
import type { SystemCourse } from '@/types/system/course'
import { useI18n } from '@/lib/system/i18n'

/* ─── level → accent colour ──────────────────────────────────────── */
const LEVEL_ACCENT: Record<string, { from: string; to: string; tint: string; text: string }> = {
  beginner:     { from: 'rgb(16 185 129)', to: 'rgb(5 150 105)',   tint: 'rgb(16 185 129 / 0.10)', text: 'rgb(5 122 85)' },
  intermediate: { from: 'rgb(245 158 11)', to: 'rgb(217 119 6)',   tint: 'rgb(245 158 11 / 0.10)', text: 'rgb(180 95 6)' },
  advanced:     { from: 'rgb(59 130 246)', to: 'rgb(37 99 235)',   tint: 'rgb(59 130 246 / 0.10)', text: 'rgb(29 78 216)' },
  'all levels': { from: 'rgb(139 92 246)', to: 'rgb(124 58 237)',  tint: 'rgb(139 92 246 / 0.10)', text: 'rgb(109 40 217)' },
}
const DEFAULT_ACCENT = { from: 'rgb(100 116 139)', to: 'rgb(71 85 105)', tint: 'rgb(100 116 139 / 0.10)', text: 'rgb(71 85 105)' }

function accentFor(level: string | null) {
  return LEVEL_ACCENT[(level ?? '').toLowerCase()] ?? DEFAULT_ACCENT
}

/* ─── single stat cell ────────────────────────────────────────────── */
interface StatCellProps {
  icon: React.ReactNode
  value: number
  label: string
  color: string
}
function StatCell({ icon, value, label, color }: StatCellProps) {
  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <div className="flex items-center gap-1.5" style={{ color }}>
        {icon}
        <span className="text-sm font-bold tabular-nums leading-none">{value}</span>
      </div>
      <span className="text-[10px] font-medium uppercase tracking-wide opacity-45 leading-none">{label}</span>
    </div>
  )
}

/* ─── subject card ────────────────────────────────────────────────── */
interface CourseCardProps {
  course: SystemCourse
  onEdit: (course: SystemCourse) => void
}
function CourseCard({ course, onEdit }: CourseCardProps) {
  const { t } = useI18n()
  const accent = accentFor(course.level)
  const active = course.is_active_for_system

  return (
    <article
      className="group relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={{
        background: 'rgb(var(--surface-card, 255 255 255))',
        border: '1px solid rgb(var(--border-default, 229 233 240))',
        boxShadow: '0 1px 2px rgb(11 31 58 / 0.04)',
      }}
    >
      {/* gradient accent strip */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${accent.from}, ${accent.to})` }} />

      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          {/* icon avatar */}
          <div
            className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0"
            style={{ background: accent.tint, color: accent.text }}
          >
            <BookOpen size={20} strokeWidth={2.2} />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={{
                background: active ? 'rgb(16 185 129 / 0.12)' : 'rgb(100 116 139 / 0.10)',
                color: active ? 'rgb(5 122 85)' : 'rgb(100 116 139)',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: active ? 'rgb(16 185 129)' : 'rgb(148 163 184)' }}
              />
              {active ? t('status.active') : t('status.inactive')}
            </span>

            <button
              onClick={() => onEdit(course)}
              className="p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 hover:bg-black/[0.06]"
              style={{ color: 'rgb(100 116 139)' }}
              title={t('courses.subjectSettings')}
            >
              <Settings2 size={16} />
            </button>
          </div>
        </div>

        {/* Name */}
        <h3 className="font-semibold text-[15px] leading-snug mt-4 mb-1.5" style={{ color: 'rgb(15 23 42)' }}>
          {course.name}
        </h3>

        {/* Description */}
        <p
          className="text-xs leading-relaxed min-h-[2rem]"
          style={{
            color: 'rgb(100 116 139)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {course.description ?? t('courses.noDescription')}
        </p>

        {/* badges */}
        {(course.level || course.age_group) && (
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            {course.level && (
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wide"
                style={{ background: accent.tint, color: accent.text }}
              >
                {course.level}
              </span>
            )}
            {course.age_group && (
              <span
                className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md"
                style={{ background: 'rgb(241 245 249)', color: 'rgb(100 116 139)' }}
              >
                <GraduationCap size={11} />
                {course.age_group}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Stats footer */}
      <div
        className="mt-auto flex items-center px-4 py-3.5 gap-1"
        style={{
          borderTop: '1px solid rgb(var(--border-default, 229 233 240))',
          background: 'rgb(var(--surface-card-2, 248 250 252))',
        }}
      >
        <StatCell icon={<UserCheck size={13} />}   value={course.active_student_count} label={t('courses.statActive')}   color="rgb(5 122 85)" />
        <div className="w-px h-7 shrink-0" style={{ background: 'rgb(var(--border-default, 229 233 240))' }} />
        <StatCell icon={<PauseCircle size={13} />} value={course.paused_student_count} label={t('courses.statPaused')}   color="rgb(180 95 6)" />
        <div className="w-px h-7 shrink-0" style={{ background: 'rgb(var(--border-default, 229 233 240))' }} />
        <StatCell icon={<Users size={13} />}       value={course.total_student_count}  label={t('common.total')}         color="rgb(71 85 105)" />
        <div className="w-px h-7 shrink-0" style={{ background: 'rgb(var(--border-default, 229 233 240))' }} />
        <StatCell icon={<BookOpen size={13} />}    value={course.teacher_count}        label={t('courses.statTeachers')} color="rgb(29 78 216)" />
      </div>
    </article>
  )
}

/* ─── grid ────────────────────────────────────────────────────────── */
interface CourseGridProps {
  courses: SystemCourse[]
  onEdit: (course: SystemCourse) => void
}

export function CourseGrid({ courses, onEdit }: CourseGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {courses.map(course => (
        <CourseCard key={course.id} course={course} onEdit={onEdit} />
      ))}
    </div>
  )
}
