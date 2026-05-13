'use client'
import { use, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { useStudent, useUpdateStudent } from '@/hooks/system/useStudents'
import { StudentStatusBadge } from '@/components/system/students/StudentStatusBadge'
import { StudentLifecycleBar } from '@/components/system/students/StudentLifecycleBar'
import { StudentTimeline } from '@/components/system/students/StudentTimeline'
import { FamilyTabContent } from '@/components/system/students/FamilyTabContent'
import { ParentGuardianFields } from '@/components/system/students/ParentGuardianFields'
import { NotesList } from '@/components/system/notes/NotesList'
import { NoteComposer } from '@/components/system/notes/NoteComposer'
import { EmptyState } from '@/components/system/primitives/EmptyState'
import { ApiError } from '@/lib/system/api'
import { useCourses } from '@/hooks/system/useCourses'
import { useTeachers } from '@/hooks/system/useTeachers'

const TABS = ['Profile', 'Sessions', 'Reports', 'Invoices', 'Wallet', 'Family', 'Timeline', 'Notes'] as const
type Tab = typeof TABS[number]

const profileSchema = z.object({
  name:                 z.string().min(1),
  email:                z.string().email().optional().or(z.literal('')),
  phone:                z.string().optional(),
  whatsapp:             z.string().optional(),
  country:              z.string().min(1),
  timezone:             z.string().min(1),
  course_id:            z.coerce.number().optional(),
  assigned_teacher_id:  z.coerce.number().optional(),
  sessions_per_month:   z.coerce.number().min(1),
  session_duration_min: z.coerce.number().min(1),
  currency:             z.string().min(1),
  monthly_price_minor:  z.coerce.number().min(0),
  custom_discount_pct:  z.coerce.number().min(0).max(100),
  parent_name:          z.string().optional(),
  parent_phone:         z.string().optional(),
  parent_whatsapp:      z.string().optional(),
  parent_email:         z.string().optional(),
})

type ProfileValues = z.infer<typeof profileSchema>

const inputCls   = 'w-full px-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)]'
const inputStyle = { borderColor: 'rgb(var(--border-default, 229 233 240))', background: 'rgb(var(--surface-card, 255 255 255))' }
const DURATIONS  = [30, 45, 60]
const CURRENCIES = ['USD', 'EGP', 'GBP', 'EUR', 'SAR', 'AED']

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [tab, setTab] = useState<Tab>('Profile')

  const { data: student, isLoading } = useStudent(id)
  const update = useUpdateStudent(id)
  const { data: courses = [] } = useCourses()
  const { data: teachersData } = useTeachers()
  const teachers = teachersData?.data ?? []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, control, formState: { isSubmitting } } = useForm<any>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(profileSchema) as any,
    values: student ? {
      name:                 student.name ?? '',
      email:                student.email ?? '',
      phone:                student.phone ?? '',
      whatsapp:             student.whatsapp ?? '',
      country:              student.country ?? '',
      timezone:             student.timezone ?? '',
      course_id:            student.course?.id,
      assigned_teacher_id:  student.assigned_teacher?.id,
      sessions_per_month:   student.sessions_per_month,
      session_duration_min: student.session_duration_min,
      currency:             student.currency,
      monthly_price_minor:  student.monthly_price_minor,
      custom_discount_pct:  student.custom_discount_pct,
      parent_name:          student.parent_name ?? '',
      parent_phone:         student.parent_phone ?? '',
      parent_whatsapp:      student.parent_whatsapp ?? '',
      parent_email:         student.parent_email ?? '',
    } : undefined,
  })

  async function onProfileSave(values: ProfileValues) {
    try {
      await update.mutateAsync(values as Record<string, unknown>)
      toast.success('Profile saved.')
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to save profile.')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-56 rounded-xl animate-pulse" style={{ background: 'rgb(var(--surface-card-2, 248 250 252))' }} />
        <div className="h-24 rounded-2xl animate-pulse" style={{ background: 'rgb(var(--surface-card-2, 248 250 252))' }} />
      </div>
    )
  }

  if (!student) {
    return (
      <EmptyState
        icon="AlertCircle"
        title="Student not found"
        action={<Link href="/students" className="text-sm underline">Back to students</Link>}
      />
    )
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6 text-sm opacity-50">
        <Link href="/students" className="hover:opacity-100 flex items-center gap-1">
          <ChevronLeft size={14} />
          Students
        </Link>
        <span>/</span>
        <span className="opacity-100">{student.name}</span>
      </div>

      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white shrink-0"
            style={{ background: 'rgb(var(--status-info, 30 90 171))' }}
          >
            {student.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold">{student.name}</h1>
              <StudentStatusBadge status={student.status} />
            </div>
            <p className="text-sm opacity-50">{student.course?.name ?? '—'} · {student.country}</p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <StudentLifecycleBar student={student} />
      </div>

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
          </button>
        ))}
      </div>

      <div>
        {tab === 'Profile' && (
          <form
            onSubmit={handleSubmit(onProfileSave)}
            className="space-y-5 max-w-3xl"
          >
            <div
              className="rounded-2xl p-6 space-y-4"
              style={{ background: 'rgb(var(--surface-card, 255 255 255))', border: '1px solid rgb(var(--border-default, 229 233 240))' }}
            >
              <p className="text-sm font-semibold opacity-60 uppercase tracking-wide">Identity</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Name</label>
                  <input className={inputCls} style={inputStyle} {...register('name')} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Email</label>
                  <input type="email" className={inputCls} style={inputStyle} {...register('email')} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Phone</label>
                  <input className={inputCls} style={inputStyle} {...register('phone')} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">WhatsApp</label>
                  <input className={inputCls} style={inputStyle} {...register('whatsapp')} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Country</label>
                  <input className={inputCls} style={inputStyle} {...register('country')} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Timezone</label>
                  <input className={inputCls} style={inputStyle} {...register('timezone')} />
                </div>
              </div>
            </div>

            {student.age_category === 'child' && (
              <div
                className="rounded-2xl p-6"
                style={{ background: 'rgb(var(--surface-card, 255 255 255))', border: '1px solid rgb(var(--border-default, 229 233 240))' }}
              >
                <ParentGuardianFields control={control} />
              </div>
            )}

            <div
              className="rounded-2xl p-6 space-y-4"
              style={{ background: 'rgb(var(--surface-card, 255 255 255))', border: '1px solid rgb(var(--border-default, 229 233 240))' }}
            >
              <p className="text-sm font-semibold opacity-60 uppercase tracking-wide">Enrollment</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Course</label>
                  <select className={inputCls} style={inputStyle} {...register('course_id')}>
                    <option value="">No course</option>
                    {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Teacher</label>
                  <select className={inputCls} style={inputStyle} {...register('assigned_teacher_id')}>
                    <option value="">Unassigned</option>
                    {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Sessions / month</label>
                  <input type="number" min="1" className={inputCls} style={inputStyle} {...register('sessions_per_month')} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Session duration</label>
                  <select className={inputCls} style={inputStyle} {...register('session_duration_min')}>
                    {DURATIONS.map((d) => <option key={d} value={d}>{d} minutes</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div
              className="rounded-2xl p-6 space-y-4"
              style={{ background: 'rgb(var(--surface-card, 255 255 255))', border: '1px solid rgb(var(--border-default, 229 233 240))' }}
            >
              <p className="text-sm font-semibold opacity-60 uppercase tracking-wide">Pricing</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Currency</label>
                  <select className={inputCls} style={inputStyle} {...register('currency')}>
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Monthly price (minor)</label>
                  <input type="number" min="0" className={inputCls} style={inputStyle} {...register('monthly_price_minor')} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Discount (%)</label>
                  <input type="number" min="0" max="100" className={inputCls} style={inputStyle} {...register('custom_discount_pct')} />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: 'rgb(14 124 90)' }}
              >
                {isSubmitting ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        )}

        {tab === 'Sessions' && (
          <EmptyState icon="Video" title="Sessions" description="Session history will appear here." />
        )}

        {tab === 'Reports' && (
          <EmptyState icon="BarChart2" title="Reports" description="Coming soon." />
        )}

        {tab === 'Invoices' && (
          <EmptyState icon="FileText" title="Invoices" description="Coming soon." />
        )}

        {tab === 'Wallet' && (
          <EmptyState icon="Wallet" title="Wallet" description="Coming soon." />
        )}

        {tab === 'Family' && (
          <FamilyTabContent student={student} />
        )}

        {tab === 'Timeline' && (
          <StudentTimeline entries={student.timeline} isLoading={false} />
        )}

        {tab === 'Notes' && (
          <div className="space-y-4 max-w-2xl">
            <NoteComposer context="students" entityId={student.id} />
            <NotesList context="students" entityId={student.id} />
          </div>
        )}
      </div>
    </div>
  )
}
