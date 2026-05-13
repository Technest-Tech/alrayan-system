'use client'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Teacher } from '@/types/system/teacher'
import { useCourses } from '@/hooks/system/useCourses'

const schema = z.object({
  name:                    z.string().min(1, 'Name is required'),
  email:                   z.string().email('Valid email required').optional().or(z.literal('')),
  phone:                   z.string().optional(),
  whatsapp:                z.string().optional(),
  qualifications:          z.string().optional(),
  teachable_course_ids:    z.array(z.number()).min(1, 'Select at least one course'),
  payment_method:          z.enum(['vodafone_cash', 'instapay', 'wallet_other']),
  payment_account_details: z.string().optional(),
  per_minute_rate_30:      z.coerce.number().min(0),
  per_minute_rate_45:      z.coerce.number().min(0),
  per_minute_rate_60:      z.coerce.number().min(0),
})

export type TeacherFormValues = z.infer<typeof schema>

interface TeacherFormProps {
  defaultValues?: Partial<Teacher>
  onSubmit: (data: TeacherFormValues) => void
  isLoading: boolean
  isEdit?: boolean
}

const inputCls   = 'w-full px-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)]'
const inputStyle = { borderColor: 'rgb(var(--border-default, 229 233 240))', background: 'rgb(var(--surface-card, 255 255 255))' }

const PAYMENT_METHODS = [
  { value: 'vodafone_cash', label: 'Vodafone Cash' },
  { value: 'instapay',      label: 'InstaPay' },
  { value: 'wallet_other',  label: 'Other Wallet' },
] as const

export function TeacherForm({ defaultValues, onSubmit, isLoading, isEdit }: TeacherFormProps) {
  const { data: courses = [] } = useCourses()

  const form = useForm({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name:                    defaultValues?.name ?? '',
      email:                   defaultValues?.email ?? '',
      phone:                   defaultValues?.phone ?? '',
      whatsapp:                defaultValues?.whatsapp ?? '',
      qualifications:          defaultValues?.qualifications ?? '',
      teachable_course_ids:    defaultValues?.teachable_course_ids ?? [],
      payment_method:          defaultValues?.payment_method ?? 'vodafone_cash',
      payment_account_details: '',
      per_minute_rate_30:      defaultValues?.per_minute_rate_30 ?? 0,
      per_minute_rate_45:      defaultValues?.per_minute_rate_45 ?? 0,
      per_minute_rate_60:      defaultValues?.per_minute_rate_60 ?? 0,
    },
  })
  const { register, handleSubmit, control, formState: { errors } } = form

  return (
    <form onSubmit={handleSubmit(onSubmit as Parameters<typeof handleSubmit>[0])} className="space-y-6">
      <section className="space-y-4">
        <h3 className="text-sm font-semibold opacity-60 uppercase tracking-wide">Identity</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Name</label>
            <input className={inputCls} style={inputStyle} {...register('name')} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          {!isEdit && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input type="email" className={inputCls} style={inputStyle} {...register('email')} />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5">Phone</label>
            <input className={inputCls} style={inputStyle} {...register('phone')} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">WhatsApp</label>
            <input className={inputCls} style={inputStyle} {...register('whatsapp')} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Qualifications</label>
          <textarea
            rows={3}
            className={inputCls}
            style={inputStyle}
            {...register('qualifications')}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold opacity-60 uppercase tracking-wide">Teachable courses</h3>
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
                    className="flex items-center gap-2.5 text-sm cursor-pointer px-3 py-2 rounded-xl border transition-colors"
                    style={{
                      borderColor: checked ? 'rgb(var(--status-success, 14 124 90))' : 'rgb(var(--border-default, 229 233 240))',
                      background: checked ? 'rgb(var(--status-success, 14 124 90) / 0.08)' : 'rgb(var(--surface-card, 255 255 255))',
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
        {errors.teachable_course_ids && (
          <p className="text-red-500 text-xs">{errors.teachable_course_ids.message}</p>
        )}
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold opacity-60 uppercase tracking-wide">Payment</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Payment method</label>
            <select className={inputCls} style={inputStyle} {...register('payment_method')}>
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Account details</label>
            <input className={inputCls} style={inputStyle} {...register('payment_account_details')} placeholder="Phone / account number" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {(['30', '45', '60'] as const).map((dur) => {
            const field = `per_minute_rate_${dur}` as const
            return (
              <div key={dur}>
                <label className="block text-sm font-medium mb-1.5">Rate / min ({dur}-min session)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs opacity-50">EGP</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={inputCls + ' pl-10'}
                    style={inputStyle}
                    {...register(field)}
                  />
                </div>
                {errors[field] && <p className="text-red-500 text-xs mt-1">{errors[field]?.message}</p>}
              </div>
            )
          })}
        </div>
      </section>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-opacity"
          style={{ background: 'rgb(14 124 90)' }}
        >
          {isLoading ? 'Saving…' : isEdit ? 'Save changes' : 'Create teacher'}
        </button>
      </div>
    </form>
  )
}
