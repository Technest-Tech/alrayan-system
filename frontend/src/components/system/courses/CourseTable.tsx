'use client'
import { Settings } from 'lucide-react'
import type { SystemCourse } from '@/types/system/course'

interface CourseTableProps {
  courses: SystemCourse[]
  onEdit: (course: SystemCourse) => void
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
          className="flex items-center justify-between px-5 py-4 hover:bg-black/[0.02] transition-colors"
          style={idx < courses.length - 1 ? { borderBottom: '1px solid rgb(var(--border-default, 229 233 240))' } : {}}
        >
          <div className="flex items-center gap-4 min-w-0">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{
                background: course.is_active_for_system
                  ? 'rgb(var(--status-success, 14 124 90))'
                  : 'rgb(var(--status-neutral, 90 100 112))',
              }}
            />
            <div className="min-w-0">
              <p className="font-medium truncate">{course.name}</p>
              {course.description && (
                <p className="text-xs opacity-50 truncate mt-0.5">{course.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6 shrink-0 ml-4">
            <div className="text-right">
              <p className="text-sm font-semibold tabular-nums">{course.active_student_count}</p>
              <p className="text-xs opacity-40">students</p>
            </div>

            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
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

            <button
              onClick={() => onEdit(course)}
              className="p-1.5 rounded-lg hover:bg-black/10 transition-colors opacity-50 hover:opacity-100"
              title="Edit course"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>
      ))}

      {courses.length === 0 && (
        <div className="py-16 text-center text-sm opacity-40">No courses found.</div>
      )}
    </div>
  )
}
