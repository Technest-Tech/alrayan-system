'use client'
import { Settings, Users, UserCheck, BookOpen, PauseCircle } from 'lucide-react'
import type { SystemCourse } from '@/types/system/course'

/* ─── level → accent colour ──────────────────────────────────────── */
const LEVEL_ACCENT: Record<string, { border: string; badge: string; text: string }> = {
  beginner:     { border: 'rgb(14 124 90)',    badge: 'rgb(14 124 90 / 0.10)',    text: 'rgb(14 124 90)' },
  intermediate: { border: 'rgb(154 113 23)',   badge: 'rgb(154 113 23 / 0.10)',   text: 'rgb(154 113 23)' },
  advanced:     { border: 'rgb(30 90 171)',    badge: 'rgb(30 90 171 / 0.10)',    text: 'rgb(30 90 171)' },
  'all levels': { border: 'rgb(101 56 182)',   badge: 'rgb(101 56 182 / 0.10)',   text: 'rgb(101 56 182)' },
}
const DEFAULT_ACCENT = { border: 'rgb(90 100 112)', badge: 'rgb(90 100 112 / 0.10)', text: 'rgb(90 100 112)' }

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
    <div className="flex flex-col items-center gap-0.5 flex-1">
      <div className="flex items-center gap-1" style={{ color }}>
        {icon}
        <span className="text-sm font-semibold tabular-nums leading-none">{value}</span>
      </div>
      <span className="text-[10px] opacity-50 leading-none">{label}</span>
    </div>
  )
}

/* ─── course card ─────────────────────────────────────────────────── */
interface CourseCardProps {
  course: SystemCourse
  onEdit: (course: SystemCourse) => void
}
function CourseCard({ course, onEdit }: CourseCardProps) {
  const accent = accentFor(course.level)

  return (
    <div
      className="relative flex flex-col rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
      style={{
        background: 'rgb(var(--surface-card, 255 255 255))',
        border: '1px solid rgb(var(--border-default, 229 233 240))',
        boxShadow: '0 1px 4px rgb(11 31 58 / 0.06)',
        borderTop: `3px solid ${accent.border}`,
      }}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
            {course.level && (
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
                style={{ background: accent.badge, color: accent.text }}
              >
                {course.level}
              </span>
            )}
            {course.age_group && (
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{
                  background: 'rgb(var(--border-default, 229 233 240))',
                  color: 'rgb(var(--status-neutral, 90 100 112))',
                }}
              >
                {course.age_group}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{
                background: course.is_active_for_system
                  ? 'rgb(14 124 90 / 0.10)'
                  : 'rgb(90 100 112 / 0.10)',
                color: course.is_active_for_system
                  ? 'rgb(14 124 90)'
                  : 'rgb(90 100 112)',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: course.is_active_for_system
                    ? 'rgb(14 124 90)'
                    : 'rgb(90 100 112)',
                }}
              />
              {course.is_active_for_system ? 'Active' : 'Inactive'}
            </span>

            <button
              onClick={() => onEdit(course)}
              className="p-1.5 rounded-lg hover:bg-black/8 transition-colors opacity-40 hover:opacity-80"
              title="Course settings"
            >
              <Settings size={14} />
            </button>
          </div>
        </div>

        {/* Name */}
        <h3 className="font-semibold text-base leading-snug mb-1.5" style={{ color: 'rgb(11 31 58)' }}>
          {course.name}
        </h3>

        {/* Description */}
        <p
          className="text-xs leading-relaxed"
          style={{
            color: 'rgb(90 100 112)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {course.description ?? 'No description.'}
        </p>
      </div>

      {/* Stats footer */}
      <div
        className="mt-auto flex items-center px-4 py-3 gap-1"
        style={{
          borderTop: '1px solid rgb(var(--border-default, 229 233 240))',
          background: 'rgb(var(--surface-card-2, 248 250 252))',
        }}
      >
        <StatCell
          icon={<UserCheck size={11} />}
          value={course.active_student_count}
          label="active"
          color="rgb(14 124 90)"
        />
        <div className="w-px h-6 shrink-0" style={{ background: 'rgb(var(--border-default, 229 233 240))' }} />
        <StatCell
          icon={<PauseCircle size={11} />}
          value={course.paused_student_count}
          label="paused"
          color="rgb(154 113 23)"
        />
        <div className="w-px h-6 shrink-0" style={{ background: 'rgb(var(--border-default, 229 233 240))' }} />
        <StatCell
          icon={<Users size={11} />}
          value={course.total_student_count}
          label="total"
          color="rgb(90 100 112)"
        />
        <div className="w-px h-6 shrink-0" style={{ background: 'rgb(var(--border-default, 229 233 240))' }} />
        <StatCell
          icon={<BookOpen size={11} />}
          value={course.teacher_count}
          label="teachers"
          color="rgb(30 90 171)"
        />
      </div>
    </div>
  )
}

/* ─── grid ────────────────────────────────────────────────────────── */
interface CourseGridProps {
  courses: SystemCourse[]
  onEdit: (course: SystemCourse) => void
}

export function CourseGrid({ courses, onEdit }: CourseGridProps) {
  if (courses.length === 0) {
    return <div className="py-16 text-center text-sm opacity-40">No courses found.</div>
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {courses.map(course => (
        <CourseCard key={course.id} course={course} onEdit={onEdit} />
      ))}
    </div>
  )
}
