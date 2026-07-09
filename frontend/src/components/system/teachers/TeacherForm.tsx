'use client'
import { useForm, Controller } from 'react-hook-form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, CreditCard, BookOpen } from 'lucide-react'
import type { Teacher } from '@/types/system/teacher'
import { useCourses } from '@/hooks/system/useCourses'
import { WhatsAppInput } from '@/components/system/students/WhatsAppInput'
import { useI18n } from '@/lib/system/i18n'

const schema = z.object({
  name:                    z.string().min(1, 'Name is required'),
  email:                   z.string().email('Valid email required').optional().or(z.literal('')),
  whatsapp:                z.string().optional(),
  cv_url:                  z.string().url('Must be a valid URL').optional().or(z.literal('')),
  teachable_course_ids:    z.array(z.number()).min(1, 'Select at least one course'),
  payment_method:          z.enum(['vodafone_cash', 'instapay', 'wallet_other']),
  payment_account_details: z.string().optional(),
  hourly_rate:             z.coerce.number().min(0, 'Rate must be 0 or more'),
  password:                z.string().min(8, 'password-min').or(z.literal('')).optional(),
})

export type TeacherFormValues = z.infer<typeof schema>

/** On create the password is mandatory: a new teacher signs in with it, there is no invite email. */
const createSchema = schema.superRefine((values, ctx) => {
  if (!values.password || values.password.length < 8) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['password'], message: 'password-min' })
  }
})

interface TeacherFormProps {
  defaultValues?: Partial<Teacher>
  onSubmit: (data: TeacherFormValues) => void
  isLoading: boolean
  isEdit?: boolean
}

const PAYMENT_METHODS = [
  { value: 'vodafone_cash', label: 'Vodafone Cash' },
  { value: 'instapay',      label: 'InstaPay' },
  { value: 'wallet_other',  label: 'Other Wallet' },
] as const

const inputCls   = 'w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)] transition-shadow'
const inputStyle = { borderColor: 'rgb(var(--border-default, 229 233 240))', background: 'rgb(var(--surface-card, 255 255 255))' }

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2.5 pb-3 border-b" style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}>
      <span className="flex items-center justify-center w-7 h-7 rounded-lg" style={{ background: 'rgb(14 124 90 / 0.1)' }}>
        <Icon size={14} style={{ color: 'rgb(14 124 90)' }} />
      </span>
      <h3 className="text-sm font-semibold" style={{ color: 'rgb(var(--text-primary, 15 23 42))' }}>{title}</h3>
    </div>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-red-500 text-xs mt-1">{message}</p>
}

export function TeacherForm({ defaultValues, onSubmit, isLoading, isEdit }: TeacherFormProps) {
  const { t } = useI18n()
  const { data: courses = [] } = useCourses()

  const form = useForm({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(isEdit ? schema : createSchema) as any,
    defaultValues: {
      name:                    defaultValues?.name ?? '',
      email:                   defaultValues?.email ?? '',
      whatsapp:                defaultValues?.whatsapp ?? '+20',
      cv_url:                  defaultValues?.cv_url ?? '',
      teachable_course_ids:    defaultValues?.teachable_course_ids ?? [],
      payment_method:          defaultValues?.payment_method ?? 'vodafone_cash',
      payment_account_details: defaultValues?.payment_account_details ?? '',
      hourly_rate:             defaultValues?.hourly_rate ?? 0,
      password:                '',
    },
  })
  const { register, handleSubmit, control, formState: { errors } } = form

  return (
    <form onSubmit={handleSubmit(onSubmit as Parameters<typeof handleSubmit>[0])} className="space-y-6">

      {/* ── Identity ───────────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeader icon={User} title={t('teachers.sectionIdentity')} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1.5 opacity-60 uppercase tracking-wide">{t('common.name')} *</label>
            <input className={inputCls} style={inputStyle} placeholder={t('teachers.nameExample')} {...register('name')} />
            <FieldError message={errors.name?.message} />
          </div>

          {!isEdit && (
            <div>
              <label className="block text-xs font-medium mb-1.5 opacity-60 uppercase tracking-wide">{t('common.email')} *</label>
              <input type="email" className={inputCls} style={inputStyle} placeholder="teacher@example.com" {...register('email')} />
              <FieldError message={errors.email?.message} />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium mb-1.5 opacity-60 uppercase tracking-wide">{t('users.setPasswordLabel')}</label>
            <input type="password" autoComplete="new-password" className={inputCls} style={inputStyle} placeholder="••••••••" {...register('password')} />
            {errors.password?.message
              ? <FieldError message={t('users.errorPasswordMin')} />
              : <p className="text-[11px] opacity-50 mt-1">{isEdit ? t('users.setPasswordHint') : t('users.setPasswordHintInvite')}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5 opacity-60 uppercase tracking-wide">{t('common.whatsapp')}</label>
            <Controller
              name="whatsapp"
              control={control}
              render={({ field }) => (
                <WhatsAppInput
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  syncDialCode="+20"
                  inputStyle={inputStyle}
                />
              )}
            />
          </div>
        </div>
      </section>

      {/* ── Teachable Courses ──────────────────────────── */}
      <section className="space-y-4">
        <SectionHeader icon={BookOpen} title={t('teachers.sectionTeachableCourses')} />
        <Controller
          name="teachable_course_ids"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {courses.map((course) => {
                const checked = field.value.includes(course.id)
                return (
                  <label
                    key={course.id}
                    className="flex items-center gap-2.5 text-sm cursor-pointer px-3 py-2.5 rounded-xl border transition-all"
                    style={{
                      borderColor: checked ? 'rgb(14 124 90)' : 'rgb(var(--border-default, 229 233 240))',
                      background:  checked ? 'rgb(14 124 90 / 0.08)' : 'rgb(var(--surface-card, 255 255 255))',
                      color:       checked ? 'rgb(14 124 90)' : undefined,
                      fontWeight:  checked ? 500 : 400,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          field.onChange([...field.value, course.id])
                        } else {
                          field.onChange(field.value.filter((id: number) => id !== course.id))
                        }
                      }}
                      className="accent-[rgb(14,124,90)]"
                    />
                    {course.name}
                  </label>
                )
              })}
            </div>
          )}
        />
        <FieldError message={errors.teachable_course_ids?.message} />
      </section>

      {/* ── Payment & Rate ─────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeader icon={CreditCard} title={t('teachers.sectionPaymentRate')} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1.5 opacity-60 uppercase tracking-wide">{t('teachers.paymentMethod')}</label>
            <Controller name="payment_method" control={control} render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full h-10 rounded-xl text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            )} />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5 opacity-60 uppercase tracking-wide">{t('teachers.accountDetails')}</label>
            <input className={inputCls} style={inputStyle} placeholder={t('teachers.accountDetailsPlaceholder')} {...register('payment_account_details')} />
          </div>
        </div>

        <div className="max-w-xs">
          <label className="block text-xs font-medium mb-1.5 opacity-60 uppercase tracking-wide">{t('teachers.hourlyRate')}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium opacity-50 pointer-events-none">EGP</span>
            <input
              type="number"
              step="1"
              min="0"
              className={inputCls + ' pl-11'}
              style={inputStyle}
              placeholder="0"
              {...register('hourly_rate')}
            />
          </div>
          <FieldError message={errors.hourly_rate?.message} />
        </div>
      </section>

      {/* ── Submit ─────────────────────────────────────── */}
      <div className="flex justify-end pt-2 border-t" style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-opacity"
          style={{ background: 'rgb(14 124 90)' }}
        >
          {isLoading ? t('common.saving') : isEdit ? 'Save changes' : t('teachers.createTeacher')}
        </button>
      </div>
    </form>
  )
}
