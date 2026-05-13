'use client'
import { useState } from 'react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { EmptyState } from '@/components/system/primitives/EmptyState'
import { CourseTable } from '@/components/system/courses/CourseTable'
import { CourseToggleSheet } from '@/components/system/courses/CourseToggleSheet'
import { useCourses } from '@/hooks/system/useCourses'
import type { SystemCourse } from '@/types/system/course'

export default function CoursesPage() {
  const { data: courses = [], isLoading } = useCourses()
  const [editing, setEditing] = useState<SystemCourse | null>(null)

  return (
    <>
      <PageHeader
        title="Courses"
        description="Manage the course catalogue and system availability."
      />

      {isLoading ? (
        <div
          className="rounded-xl border overflow-hidden"
          style={{ borderColor: 'rgb(var(--border-default, 229 233 240))', background: 'rgb(var(--surface-card, 255 255 255))' }}
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse border-b"
              style={{ borderColor: 'rgb(var(--border-default, 229 233 240))', background: 'rgb(var(--surface-card-2, 248 250 252))' }}
            />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <EmptyState
          icon="BookOpen"
          title="No courses yet"
          description="Courses added from the backend will appear here."
        />
      ) : (
        <CourseTable courses={courses} onEdit={setEditing} />
      )}

      <CourseToggleSheet course={editing} onClose={() => setEditing(null)} />
    </>
  )
}
