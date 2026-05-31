'use client'
import { use, useState } from 'react'
import { MoreHorizontal, ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useTeacher, useUpdateTeacher, useActivateTeacher, useDeactivateTeacher } from '@/hooks/system/useTeachers'
import { useStudents } from '@/hooks/system/useStudents'
import { StatusBadge } from '@/components/system/primitives/StatusBadge'
import { EmptyState } from '@/components/system/primitives/EmptyState'
import { TeacherForm, type TeacherFormValues } from '@/components/system/teachers/TeacherForm'
import { AvailabilityPicker } from '@/components/system/teachers/AvailabilityPicker'
import { TeacherScheduleView } from '@/components/system/teachers/TeacherScheduleView'
import { TeacherStudentCards } from '@/components/system/teachers/TeacherStudentCards'
import { TeacherReportsTab } from '@/components/system/teachers/TeacherReportsTab'
import { NotesList } from '@/components/system/notes/NotesList'
import { NoteComposer } from '@/components/system/notes/NoteComposer'
import { ApiError } from '@/lib/system/api'

const TABS = ['Profile', 'Availability', 'Students', 'Schedule', 'Reports', 'Salary', 'Notes'] as const
type Tab = typeof TABS[number]

export default function TeacherDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [tab, setTab]           = useState<Tab>('Profile')
  const [menuOpen, setMenuOpen] = useState(false)

  const { data: teacher, isLoading } = useTeacher(id)
  const updateTeacher  = useUpdateTeacher(id)
  const activateTeacher   = useActivateTeacher()
  const deactivateTeacher = useDeactivateTeacher()

  const { data: studentsData, isLoading: studentsLoading } = useStudents({
    assigned_teacher_id: id,
  })
  const students = studentsData?.data ?? []

  async function handleProfileSave(data: TeacherFormValues) {
    try {
      await updateTeacher.mutateAsync(data)
      toast.success('Teacher profile saved.')
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to save profile.')
    }
  }

  async function handleDeactivate() {
    if (!teacher) return
    setMenuOpen(false)
    try {
      await deactivateTeacher.mutateAsync(teacher.id)
      toast.success(`${teacher.name} deactivated.`)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed.')
    }
  }

  async function handleActivate() {
    if (!teacher) return
    setMenuOpen(false)
    try {
      await activateTeacher.mutateAsync(teacher.id)
      toast.success(`${teacher.name} activated.`)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed.')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded-xl animate-pulse" style={{ background: 'rgb(var(--surface-card-2, 248 250 252))' }} />
        <div className="h-40 rounded-2xl animate-pulse" style={{ background: 'rgb(var(--surface-card-2, 248 250 252))' }} />
      </div>
    )
  }

  if (!teacher) {
    return <EmptyState icon="AlertCircle" title="Teacher not found" action={<Link href="/teachers" className="text-sm underline">Back to teachers</Link>} />
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6 text-sm opacity-50">
        <Link href="/teachers" className="hover:opacity-100 flex items-center gap-1">
          <ChevronLeft size={14} />
          Teachers
        </Link>
        <span>/</span>
        <span className="opacity-100">{teacher.name}</span>
      </div>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white shrink-0"
            style={{ background: 'rgb(var(--status-success, 14 124 90))' }}
          >
            {teacher.name?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{teacher.name}</h1>
              <StatusBadge value={teacher.is_active ? 'active' : 'inactive'} />
            </div>
            <p className="text-sm opacity-50">{teacher.email}</p>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="p-2 rounded-xl border hover:bg-black/5 transition-colors"
            style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}
          >
            <MoreHorizontal size={18} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div
                className="absolute right-0 top-full mt-1 w-44 rounded-xl shadow-lg border z-20 py-1 text-sm"
                style={{ background: 'rgb(var(--surface-card, 255 255 255))', borderColor: 'rgb(var(--border-default, 229 233 240))' }}
              >
                {teacher.invite_pending && (
                  <button className="w-full text-left px-3 py-2 hover:bg-black/5 transition-colors">
                    Resend invite
                  </button>
                )}
                {teacher.is_active ? (
                  <button onClick={handleDeactivate} className="w-full text-left px-3 py-2 hover:bg-black/5 transition-colors text-red-600">
                    Deactivate
                  </button>
                ) : (
                  <button onClick={handleActivate} className="w-full text-left px-3 py-2 hover:bg-black/5 transition-colors text-green-700">
                    Activate
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div
        className="flex gap-1 border-b mb-6 overflow-x-auto"
        style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}
      >
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors"
            style={{
              borderBottomColor: tab === t ? 'rgb(var(--status-success, 14 124 90))' : 'transparent',
              color: tab === t ? 'rgb(var(--status-success, 14 124 90))' : undefined,
            }}
          >
            {t}
            {t === 'Students' && students.length > 0 && (
              <span
                className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                style={tab === t
                  ? { background: 'rgb(14 124 90)', color: '#fff' }
                  : { background: 'rgb(var(--border-default, 229 233 240))', color: 'rgb(90 100 112)' }
                }
              >
                {students.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div>
        {tab === 'Profile' && (
          <div
            className="rounded-2xl p-6"
            style={{ background: 'rgb(var(--surface-card, 255 255 255))', border: '1px solid rgb(var(--border-default, 229 233 240))' }}
          >
            <TeacherForm
              defaultValues={teacher}
              onSubmit={handleProfileSave}
              isLoading={updateTeacher.isPending}
              isEdit
            />
          </div>
        )}

        {tab === 'Availability' && (
          <AvailabilityPicker
            teacherId={teacher.id}
            initialSlots={teacher.availability}
            timezone={teacher.availability[0]?.timezone ?? 'UTC'}
          />
        )}

        {tab === 'Students' && (
          <TeacherStudentCards students={students} isLoading={studentsLoading} />
        )}

        {tab === 'Schedule' && (
          <TeacherScheduleView
            teacherId={teacher.id}
            availability={teacher.availability}
          />
        )}

        {tab === 'Reports' && (
          <TeacherReportsTab teacherId={teacher.id} />
        )}

        {tab === 'Salary' && (
          <EmptyState icon="DollarSign" title="Salary" description="Coming soon." />
        )}

        {tab === 'Notes' && (
          <div className="space-y-4">
            <NoteComposer context="teachers" entityId={teacher.id} />
            <NotesList context="teachers" entityId={teacher.id} />
          </div>
        )}
      </div>
    </div>
  )
}
