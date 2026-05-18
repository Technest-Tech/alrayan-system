'use client'
import { useState } from 'react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { EmptyState } from '@/components/system/primitives/EmptyState'
import { CourseGrid } from '@/components/system/courses/CourseGrid'
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
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div
              key={i}
              className="h-44 rounded-2xl animate-pulse"
              style={{ background: 'rgb(var(--surface-card-2, 248 250 252))', border: '1px solid rgb(var(--border-default, 229 233 240))' }}
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
        <CourseGrid courses={courses} onEdit={setEditing} />
      )}

      <CourseToggleSheet course={editing} onClose={() => setEditing(null)} />
    </>
  )
}
