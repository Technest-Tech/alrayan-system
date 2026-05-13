'use client'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import type { SystemCourse } from '@/types/system/course'
import { useToggleCourseActive } from '@/hooks/system/useCourses'
import { ApiError } from '@/lib/system/api'

interface CourseToggleSheetProps {
  course: SystemCourse | null
  onClose: () => void
}

export function CourseToggleSheet({ course, onClose }: CourseToggleSheetProps) {
  const toggle = useToggleCourseActive()

  if (!course) return null

  async function handleToggle() {
    if (!course) return
    try {
      await toggle.mutateAsync({ id: course.id, is_active_for_system: !course.is_active_for_system })
      toast.success(
        course.is_active_for_system
          ? `"${course.name}" deactivated.`
          : `"${course.name}" activated.`
      )
      onClose()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Something went wrong.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div
        className="relative ml-auto h-full w-full max-w-sm flex flex-col shadow-xl"
        style={{ background: 'rgb(var(--surface-bg, 244 246 250))' }}
      >
        <div
          className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{ background: 'rgb(var(--surface-card, 255 255 255))', borderColor: 'rgb(var(--border-default, 229 233 240))' }}
        >
          <h2 className="font-semibold">Course settings</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/5 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 p-6 space-y-6">
          <div
            className="rounded-xl p-5"
            style={{ background: 'rgb(var(--surface-card, 255 255 255))', border: '1px solid rgb(var(--border-default, 229 233 240))' }}
          >
            <p className="font-semibold text-base">{course.name}</p>
            {course.description && (
              <p className="mt-1 text-sm opacity-60">{course.description}</p>
            )}
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="opacity-50">Students:</span>
              <span className="font-medium tabular-nums">{course.active_student_count}</span>
            </div>
          </div>

          <div
            className="rounded-xl p-5"
            style={{ background: 'rgb(var(--surface-card, 255 255 255))', border: '1px solid rgb(var(--border-default, 229 233 240))' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Active for system</p>
                <p className="text-xs opacity-50 mt-0.5">
                  When inactive, teachers cannot be assigned to this course.
                </p>
              </div>
              <button
                role="switch"
                aria-checked={course.is_active_for_system}
                onClick={handleToggle}
                disabled={toggle.isPending}
                className="relative w-11 h-6 rounded-full transition-colors duration-200 disabled:opacity-50 shrink-0"
                style={{
                  background: course.is_active_for_system
                    ? 'rgb(var(--status-success, 14 124 90))'
                    : 'rgb(var(--status-neutral, 90 100 112) / 0.3)',
                }}
              >
                <span
                  className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
                  style={{ transform: course.is_active_for_system ? 'translateX(20px)' : 'translateX(0)' }}
                />
              </button>
            </div>
          </div>
        </div>

        <div
          className="shrink-0 px-6 py-4 border-t flex justify-end"
          style={{ borderColor: 'rgb(var(--border-default, 229 233 240))', background: 'rgb(var(--surface-card, 255 255 255))' }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium border hover:bg-black/5 transition-colors"
            style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
