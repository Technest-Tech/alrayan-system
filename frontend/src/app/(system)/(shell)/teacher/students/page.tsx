'use client'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { useStudents } from '@/hooks/system/useStudents'

export default function TeacherStudentsPage() {
  const { data: result, isLoading } = useStudents({ per_page: 50 })
  const students = (result as any)?.data ?? []

  return (
    <>
      <PageHeader title="My students" description="Students assigned to you." />

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : students.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          No students assigned yet.
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="py-2 px-3 text-left">Name</th>
                <th className="py-2 px-3 text-left">Course</th>
                <th className="py-2 px-3 text-left">Timezone</th>
                <th className="py-2 px-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s: any) => (
                <tr key={s.id} className="border-t hover:bg-muted/30">
                  <td className="py-2 px-3 font-medium">{s.name}</td>
                  <td className="py-2 px-3 text-muted-foreground">{s.course?.name ?? '—'}</td>
                  <td className="py-2 px-3 text-muted-foreground">{s.timezone ?? '—'}</td>
                  <td className="py-2 px-3">
                    <span className="text-xs capitalize px-2 py-0.5 rounded-full bg-muted">{s.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
