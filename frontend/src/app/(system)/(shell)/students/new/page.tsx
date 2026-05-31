'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { ParentGuardianFields } from '@/components/system/students/ParentGuardianFields'
import { CountryCombobox } from '@/components/system/students/CountryCombobox'
import { WhatsAppInput } from '@/components/system/students/WhatsAppInput'
import { useCreateStudent } from '@/hooks/system/useStudents'
import { useCourses } from '@/hooks/system/useCourses'
import { useTeachers } from '@/hooks/system/useTeachers'
import { ApiError } from '@/lib/system/api'

const schema = z.object({
  name:                  z.string().min(1, 'Name is required'),
  whatsapp:              z.string().optional(),
  country:               z.string().min(1, 'Country is required'),
  timezone:              z.string().min(1, 'Timezone is required'),
  student_type:          z.enum(['child', 'adult']),
  guardian_id:           z.number().optional(),
  guardian_name:         z.string().optional(),
  guardian_whatsapp:     z.string().optional(),
  course_id:             z.coerce.number().optional(),
  assigned_teacher_id:   z.coerce.number().optional(),
  sessions_per_month:    z.coerce.number().min(1),
  session_duration_min:  z.coerce.number().min(1),
  currency:              z.string().min(1),
  monthly_price_minor:   z.coerce.number().min(0),
  custom_discount_pct:   z.coerce.number().min(0).max(100),
  whatsapp_group_link:   z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.student_type === 'child' && !data.guardian_id && !data.guardian_name) {
    ctx.addIssue({ code: 'custom', message: 'Parent name is required', path: ['guardian_name'] })
  }
  if (data.student_type === 'child' && !data.guardian_id && !data.guardian_whatsapp) {
    ctx.addIssue({ code: 'custom', message: 'Parent WhatsApp is required', path: ['guardian_whatsapp'] })
  }
})

type FormValues = z.infer<typeof schema>

const inputCls   = 'w-full px-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)]'
const inputStyle = { borderColor: 'rgb(var(--border-default, 229 233 240))', background: 'rgb(var(--surface-card, 255 255 255))' }

const SECTION_CLS   = 'rounded-2xl p-6 space-y-4'
const SECTION_STYLE = { background: 'rgb(var(--surface-card, 255 255 255))', border: '1px solid rgb(var(--border-default, 229 233 240))' }
const SECTION_TITLE = 'text-sm font-semibold opacity-60 uppercase tracking-wide mb-4'

const CURRENCIES = ['USD', 'EGP', 'GBP', 'EUR', 'SAR', 'AED']
const DURATIONS  = [30, 45, 60]

export default function NewStudentPage() {
  const router  = useRouter()
  const create  = useCreateStudent()
  const { data: courses = [] }  = useCourses()
  const { data: teachersData }  = useTeachers()
  const teachers = teachersData?.data ?? []

  const [waDialCode, setWaDialCode] = useState<string | undefined>(undefined)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, control, watch, setValue, formState: { errors, isSubmitting } } = useForm<any>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      student_type:         'adult',
      sessions_per_month:   4,
      session_duration_min: 60,
      currency:             'USD',
      custom_discount_pct:  0,
    },
  })

  const studentType = watch('student_type')

  async function onSubmit(values: FormValues) {
    try {
      const student = await create.mutateAsync(values as Record<string, unknown>)
      toast.success('Student created.')
      router.push(`/students/${student.id}`)
    } catch (e) {
      if (e instanceof ApiError && e.errors) {
        Object.values(e.errors).flat().forEach((m) => toast.error(m))
      } else {
        toast.error(e instanceof ApiError ? e.message : 'Failed to create student.')
      }
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-6 text-sm opacity-50">
        <Link href="/students" className="hover:opacity-100 flex items-center gap-1">
          <ChevronLeft size={14} />
          Students
        </Link>
        <span>/</span>
        <span className="opacity-100">New student</span>
      </div>

      <PageHeader title="New student" description="Fill in the details to enrol a student." />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-3xl">
        <div className={SECTION_CLS} style={SECTION_STYLE}>
          <p className={SECTION_TITLE}>Identity</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Full name *</label>
              <input className={inputCls} style={inputStyle} {...register('name')} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{String(errors.name.message)}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Student type *</label>
              <div className="flex gap-4 pt-1.5">
                {(['adult', 'child'] as const).map((v) => (
                  <label key={v} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" value={v} {...register('student_type')} className="accent-[rgb(14,124,90)]" />
                    {v === 'adult' ? 'Adult (self)' : 'Child (has parent)'}
                  </label>
                ))}
              </div>
            </div>

            {studentType === 'adult' && (
              <div>
                <label className="block text-sm font-medium mb-1.5">WhatsApp</label>
                <Controller
                  name="whatsapp"
                  control={control}
                  render={({ field }) => (
                    <WhatsAppInput
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      syncDialCode={waDialCode}
                      inputStyle={inputStyle}
                    />
                  )}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5">Country *</label>
              <Controller
                name="country"
                control={control}
                render={({ field }) => (
                  <CountryCombobox
                    value={field.value ?? ''}
                    onChange={(code, timezone, dialCode) => {
                      field.onChange(code)
                      setValue('timezone', timezone, { shouldValidate: true })
                      setWaDialCode(dialCode)
                    }}
                  />
                )}
              />
              {errors.country && <p className="text-red-500 text-xs mt-1">{String(errors.country.message)}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Timezone *</label>
              <Controller
                name="timezone"
                control={control}
                render={({ field }) => (
                  <input
                    className={inputCls}
                    style={inputStyle}
                    placeholder="e.g. Africa/Cairo"
                    {...field}
                    value={field.value ?? ''}
                  />
                )}
              />
              {errors.timezone && <p className="text-red-500 text-xs mt-1">{String(errors.timezone.message)}</p>}
            </div>

          </div>
        </div>

        {studentType === 'child' && (
          <div className={SECTION_CLS} style={SECTION_STYLE}>
            <ParentGuardianFields control={control} setValue={setValue} syncDialCode={waDialCode} />
          </div>
        )}

        <div className={SECTION_CLS} style={SECTION_STYLE}>
          <p className={SECTION_TITLE}>Enrollment</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Course</label>
              <select className={inputCls} style={inputStyle} {...register('course_id')}>
                <option value="">Select course…</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Teacher</label>
              <select className={inputCls} style={inputStyle} {...register('assigned_teacher_id')}>
                <option value="">Assign later</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Sessions / month *</label>
              <input type="number" min="1" className={inputCls} style={inputStyle} {...register('sessions_per_month')} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Session duration *</label>
              <select className={inputCls} style={inputStyle} {...register('session_duration_min')}>
                {DURATIONS.map((d) => <option key={d} value={d}>{d} minutes</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className={SECTION_CLS} style={SECTION_STYLE}>
          <p className={SECTION_TITLE}>Pricing</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Currency</label>
              <select className={inputCls} style={inputStyle} {...register('currency')}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Monthly price (minor units)</label>
              <input type="number" min="0" className={inputCls} style={inputStyle} {...register('monthly_price_minor')} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Discount (%)</label>
              <input type="number" min="0" max="100" className={inputCls} style={inputStyle} {...register('custom_discount_pct')} />
            </div>
          </div>
        </div>

        <div className={SECTION_CLS} style={SECTION_STYLE}>
          <p className={SECTION_TITLE}>WhatsApp group</p>
          <div>
            <label className="block text-sm font-medium mb-1.5">Group link</label>
            <input className={inputCls} style={inputStyle} placeholder="https://chat.whatsapp.com/…" {...register('whatsapp_group_link')} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 py-2">
          <Link
            href="/students"
            className="px-4 py-2 rounded-xl text-sm font-medium border hover:bg-black/5 transition-colors"
            style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-opacity"
            style={{ background: 'rgb(14 124 90)' }}
          >
            {isSubmitting ? 'Creating…' : 'Create student'}
          </button>
        </div>
      </form>
    </>
  )
}
