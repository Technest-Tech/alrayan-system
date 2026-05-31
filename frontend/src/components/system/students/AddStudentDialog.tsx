'use client'
import { useState } from 'react'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { X, UserPlus, Baby, User, Plus, Minus } from 'lucide-react'
import { ParentGuardianFields } from './ParentGuardianFields'
import { CountryCombobox } from './CountryCombobox'
import { TimezoneCombobox } from './TimezoneCombobox'
import { WhatsAppInput } from './WhatsAppInput'
import { useCreateStudent } from '@/hooks/system/useStudents'
import { ApiError } from '@/lib/system/api'

/* ─── Schema ───────────────────────────────────────── */
const schema = z.object({
  student_type:      z.enum(['child', 'adult']),
  // Adult-only
  name:              z.string().optional(),
  whatsapp:          z.string().optional(),
  country:           z.string().optional(),
  timezone:          z.string().optional(),
  // Child-only (individual name length validated in superRefine per student_type)
  children:          z.array(z.object({ name: z.string() })).optional(),
  // Guardian (child-only)
  guardian_id:       z.number().optional(),
  guardian_name:     z.string().optional(),
  guardian_whatsapp: z.string().optional(),
  guardian_country:  z.string().optional(),
  guardian_timezone: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.student_type === 'adult') {
    if (!data.name?.trim()) ctx.addIssue({ code: 'custom', message: 'Name is required', path: ['name'] })
    if (!data.country)      ctx.addIssue({ code: 'custom', message: 'Country is required', path: ['country'] })
    if (!data.timezone)     ctx.addIssue({ code: 'custom', message: 'Timezone is required', path: ['timezone'] })
  }
  if (data.student_type === 'child') {
    const children = data.children ?? []
    children.forEach((child, i) => {
      if (!child.name?.trim()) ctx.addIssue({ code: 'custom', message: 'Name is required', path: ['children', i, 'name'] })
    })
    if (!data.guardian_id && !data.guardian_name?.trim()) {
      ctx.addIssue({ code: 'custom', message: 'Parent name is required', path: ['guardian_name'] })
    }
    if (!data.guardian_id && !data.guardian_whatsapp) {
      ctx.addIssue({ code: 'custom', message: 'Parent WhatsApp is required', path: ['guardian_whatsapp'] })
    }
    if (!data.guardian_country)  ctx.addIssue({ code: 'custom', message: 'Country is required', path: ['guardian_country'] })
    if (!data.guardian_timezone) ctx.addIssue({ code: 'custom', message: 'Timezone is required', path: ['guardian_timezone'] })
  }
})

type FormValues = z.infer<typeof schema>

const inp      = 'w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)] transition-shadow'
const inpStyle = { borderColor: 'rgb(var(--border-default,229 233 240))', background: '#fff' }

interface AddStudentDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
}

export function AddStudentDialog({ open, onOpenChange }: AddStudentDialogProps) {
  const create = useCreateStudent()
  const [adultDialCode, setAdultDialCode]   = useState<string | undefined>(undefined)
  const [parentDialCode, setParentDialCode] = useState<string | undefined>(undefined)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, control, watch, reset, setValue, formState: { errors, isSubmitting } } = useForm<any>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { student_type: 'adult', children: [{ name: '' }] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'children' })

  // eslint-disable-next-line react-hooks/incompatible-library
  const [studentType, countryCode, guardianCountryCode] = watch(['student_type', 'country', 'guardian_country'])

  async function onSubmit(values: FormValues) {
    try {
      if (values.student_type === 'child') {
        const children = values.children ?? [{ name: '' }]
        for (const child of children) {
          await create.mutateAsync({
            name:              child.name,
            student_type:      'child',
            guardian_id:       values.guardian_id,
            guardian_name:     values.guardian_name,
            guardian_whatsapp: values.guardian_whatsapp,
            country:           values.guardian_country,
            timezone:          values.guardian_timezone,
          } as Record<string, unknown>)
        }
        toast.success(
          children.length === 1
            ? 'Student enrolled successfully.'
            : `${children.length} students enrolled successfully.`
        )
      } else {
        await create.mutateAsync(values as Record<string, unknown>)
        toast.success('Student enrolled successfully.')
      }
      reset()
      setAdultDialCode(undefined)
      setParentDialCode(undefined)
      onOpenChange(false)
    } catch (e) {
      if (e instanceof ApiError && e.errors) {
        Object.values(e.errors).flat().forEach((m) => toast.error(String(m)))
      } else {
        toast.error(e instanceof ApiError ? e.message : 'Failed to create student.')
      }
    }
  }

  const childrenCount = fields.length
  const buttonLabel = isSubmitting
    ? 'Adding…'
    : studentType === 'child' && childrenCount > 1
      ? `Add ${childrenCount} Trial Students`
      : 'Add Trial Student'

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className="fixed inset-0 z-50 bg-[rgb(11,31,58)]/40 backdrop-blur-sm
            data-open:animate-in data-open:fade-in-0
            data-closed:animate-out data-closed:fade-out-0 duration-200"
        />
        <DialogPrimitive.Popup
          className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          style={{ outline: 'none' }}
        >
          <div
            className="relative pointer-events-auto w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden
              data-open:animate-in data-open:fade-in-0 data-open:zoom-in-[0.97]
              data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-[0.97] duration-200"
            style={{ background: 'rgb(var(--surface-bg,244 246 250))' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-6 py-4 border-b shrink-0"
              style={{ background: '#fff', borderColor: 'rgb(var(--border-default,229 233 240))' }}
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: 'rgb(14 124 90 / 0.1)' }}>
                <UserPlus size={16} style={{ color: 'rgb(14 124 90)' }} />
              </div>
              <div>
                <DialogPrimitive.Title className="font-semibold text-[rgb(11,31,58)] leading-none">
                  Enrol New Student
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="text-xs mt-0.5" style={{ color: 'rgb(90 100 112)' }}>
                  Add basic info to start the trial. Enrollment details are set on activation.
                </DialogPrimitive.Description>
              </div>
              <DialogPrimitive.Close
                className="ml-auto p-1.5 rounded-lg hover:bg-black/5 transition-colors opacity-50 hover:opacity-100"
                aria-label="Close"
              >
                <X size={16} />
              </DialogPrimitive.Close>
            </div>

            {/* Scrollable body */}
            <form
              id="add-student-form"
              onSubmit={handleSubmit(onSubmit)}
              className="flex-1 overflow-y-auto px-6 py-5 space-y-4"
            >
              {/* ── Student type ── */}
              <div className="grid grid-cols-2 gap-3">
                {(['adult', 'child'] as const).map((v) => {
                  const active = studentType === v
                  return (
                    <label
                      key={v}
                      className="flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all"
                      style={{
                        borderColor: active ? 'rgb(14 124 90)' : 'rgb(var(--border-default,229 233 240))',
                        background:  active ? 'rgb(14 124 90 / 0.05)' : '#fff',
                      }}
                    >
                      <input type="radio" value={v} {...register('student_type')} className="sr-only" />
                      <div
                        className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
                        style={{ background: active ? 'rgb(14 124 90 / 0.12)' : 'rgb(var(--border-default,229 233 240) / 0.6)' }}
                      >
                        {v === 'adult'
                          ? <User size={15} style={{ color: active ? 'rgb(14 124 90)' : 'rgb(90 100 112)' }} />
                          : <Baby size={15} style={{ color: active ? 'rgb(14 124 90)' : 'rgb(90 100 112)' }} />
                        }
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: active ? 'rgb(14 124 90)' : 'rgb(11 31 58)' }}>
                          {v === 'adult' ? 'Adult' : 'Child'}
                        </p>
                        <p className="text-[11px] opacity-50 leading-tight mt-0.5">
                          {v === 'adult' ? 'Learning for themselves' : 'Parent registers for child'}
                        </p>
                      </div>
                    </label>
                  )
                })}
              </div>

              {/* ── Adult: Identity (with country + timezone) ── */}
              {studentType === 'adult' && (
                <Section title="Identity">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Full name" required error={errors.name}>
                      <input className={inp} style={inpStyle} {...register('name')} />
                    </Field>
                    <Field label="WhatsApp">
                      <Controller
                        name="whatsapp"
                        control={control}
                        render={({ field }) => (
                          <WhatsAppInput
                            value={field.value ?? ''}
                            onChange={field.onChange}
                            syncDialCode={adultDialCode}
                            inputStyle={inpStyle}
                          />
                        )}
                      />
                    </Field>
                    <Field label="Country" required error={errors.country}>
                      <Controller
                        name="country"
                        control={control}
                        render={({ field }) => (
                          <CountryCombobox
                            value={field.value ?? ''}
                            onChange={(code, _tz, dialCode) => {
                              field.onChange(code)
                              setAdultDialCode(dialCode)
                            }}
                          />
                        )}
                      />
                    </Field>
                    <Field label="Timezone" required error={errors.timezone}>
                      <Controller
                        name="timezone"
                        control={control}
                        render={({ field }) => (
                          <TimezoneCombobox
                            value={field.value ?? ''}
                            onChange={(tz) => field.onChange(tz)}
                            countryCode={countryCode ?? ''}
                          />
                        )}
                      />
                    </Field>
                  </div>
                </Section>
              )}

              {/* ── Child: Children list ── */}
              {studentType === 'child' && (
                <Section title="Children">
                  <div className="space-y-2">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-end gap-2">
                        <div className="flex-1">
                          <Field
                            label={fields.length === 1 ? 'Child name' : `Child ${index + 1}`}
                            required
                            error={errors.children?.[index]?.name}
                          >
                            <input
                              className={inp}
                              style={inpStyle}
                              placeholder="Full name"
                              {...register(`children.${index}.name`)}
                            />
                          </Field>
                        </div>
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="mb-0.5 flex items-center justify-center w-9 h-9 rounded-lg border hover:bg-red-50 hover:border-red-200 transition-colors shrink-0"
                            style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}
                            aria-label="Remove child"
                          >
                            <Minus size={14} className="text-red-400" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => append({ name: '' })}
                      className="flex items-center gap-2 text-xs font-medium mt-1 px-3 py-2 rounded-lg border border-dashed hover:bg-black/5 transition-colors w-full justify-center"
                      style={{ borderColor: 'rgb(14 124 90 / 0.4)', color: 'rgb(14 124 90)' }}
                    >
                      <Plus size={13} />
                      Add another child
                    </button>
                  </div>
                </Section>
              )}

              {/* ── Child: Parent / Guardian (with country + timezone) ── */}
              {studentType === 'child' && (
                <Section title="Parent / Guardian">
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="Country" required error={errors.guardian_country}>
                        <Controller
                          name="guardian_country"
                          control={control}
                          render={({ field }) => (
                            <CountryCombobox
                              value={field.value ?? ''}
                              onChange={(code, _tz, dialCode) => {
                                field.onChange(code)
                                setParentDialCode(dialCode)
                              }}
                            />
                          )}
                        />
                      </Field>
                      <Field label="Timezone" required error={errors.guardian_timezone}>
                        <Controller
                          name="guardian_timezone"
                          control={control}
                          render={({ field }) => (
                            <TimezoneCombobox
                              value={field.value ?? ''}
                              onChange={(tz) => field.onChange(tz)}
                              countryCode={guardianCountryCode ?? ''}
                            />
                          )}
                        />
                      </Field>
                    </div>
                    <ParentGuardianFields control={control} setValue={setValue} syncDialCode={parentDialCode} />
                  </div>
                </Section>
              )}
            </form>

            {/* Footer */}
            <div
              className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t"
              style={{ background: '#fff', borderColor: 'rgb(var(--border-default,229 233 240))' }}
            >
              <DialogPrimitive.Close
                className="px-4 py-2 rounded-lg text-sm font-medium border hover:bg-black/5 transition-colors"
                style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}
              >
                Cancel
              </DialogPrimitive.Close>
              <button
                type="submit"
                form="add-student-form"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60 transition-opacity hover:opacity-90"
                style={{ background: 'rgb(14 124 90)' }}
              >
                {buttonLabel}
              </button>
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

/* ─── helpers ──────────────────────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{ background: '#fff', border: '1px solid rgb(var(--border-default,229 233 240))' }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-widest opacity-40">{title}</p>
      {children}
    </div>
  )
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: { message?: string }
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5 opacity-70">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error?.message && <p className="text-red-500 text-[11px] mt-1">{String(error.message)}</p>}
    </div>
  )
}
