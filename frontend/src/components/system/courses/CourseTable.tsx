'use client'
import { Settings } from 'lucide-react'
import type { SystemCourse } from '@/types/system/course'

interface CourseTableProps {
  courses: SystemCourse[]
  onEdit: (course: SystemCourse) => void
}

interface StatChipProps {
  value: number
  label: string
  color: 'green' | 'amber' | 'slate' | 'blue'
}

function StatChip({ value, label, color }: StatChipProps) {
  const styles: Record<string, { bg: string; text: string }> = {
    green: { bg: 'rgb(var(--status-success, 14 124 90) / 0.10)', text: 'rgb(var(--status-success, 14 124 90))' },
    amber: { bg: 'rgb(220 138 0 / 0.10)',                         text: 'rgb(180 110 0)' },
    slate: { bg: 'rgb(var(--status-neutral, 90 100 112) / 0.10)', text: 'rgb(var(--status-neutral, 90 100 112))' },
    blue:  { bg: 'rgb(59 130 246 / 0.10)',                        text: 'rgb(37 99 235)' },
  }
  const s = styles[color]
  return (
    <div
      className="flex flex-col items-center px-3 py-1.5 rounded-lg min-w-[56px]"
      style={{ background: s.bg }}
    >
      <span className="text-sm font-semibold tabular-nums leading-none" style={{ color: s.text }}>{value}</span>
      <span className="text-[10px] mt-0.5 opacity-60 leading-none whitespace-nowrap">{label}</span>
    </div>
  )
}

export function CourseTable({ courses, onEdit }: CourseTableProps) {
  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: 'rgb(var(--border-default, 229 233 240))', background: 'rgb(var(--surface-card, 255 255 255))' }}
    >
      {courses.map((course, idx) => (
        <div
          key={course.id}
          className="flex items-center gap-4 px-5 py-4 hover:bg-black/[0.02] transition-colors"
          style={idx < courses.length - 1 ? { borderBottom: '1px solid rgb(var(--border-default, 229 233 240))' } : {}}
        >
          {/* Status dot */}
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{
              background: course.is_active_for_system
                ? 'rgb(var(--status-success, 14 124 90))'
                : 'rgb(var(--status-neutral, 90 100 112))',
            }}
          />

          {/* Name + description */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">{course.name}</p>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                style={{
                  background: course.is_active_for_system
                    ? 'rgb(var(--status-success, 14 124 90) / 0.12)'
                    : 'rgb(var(--status-neutral, 90 100 112) / 0.12)',
                  color: course.is_active_for_system
                    ? 'rgb(var(--status-success, 14 124 90))'
                    : 'rgb(var(--status-neutral, 90 100 112))',
                }}
              >
                {course.is_active_for_system ? 'Active' : 'Inactive'}
              </span>
            </div>
            {course.description && (
              <p className="text-xs opacity-50 truncate mt-0.5">{course.description}</p>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-2 shrink-0">
            <StatChip value={course.active_student_count} label="active"   color="green" />
            <StatChip value={course.paused_student_count} label="paused"   color="amber" />
            <StatChip value={course.total_student_count}  label="total"    color="slate" />
            <StatChip value={course.teacher_count}        label="teachers" color="blue"  />
          </div>

          {/* Edit */}
          <button
            onClick={() => onEdit(course)}
            className="p-1.5 rounded-lg hover:bg-black/10 transition-colors opacity-50 hover:opacity-100 shrink-0"
            title="Edit course"
          >
            <Settings size={16} />
          </button>
        </div>
      ))}

      {courses.length === 0 && (
        <div className="py-16 text-center text-sm opacity-40">No courses found.</div>
      )}
    </div>
  )
}
