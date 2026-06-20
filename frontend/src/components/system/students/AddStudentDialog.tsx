'use client'
import { useState } from 'react'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { X, UserPlus, Baby, User, PlusCircle, Trash2 } from 'lucide-react'
import { ParentGuardianFields } from './ParentGuardianFields'
import { CountryCombobox } from './CountryCombobox'
import { WhatsAppInput } from './WhatsAppInput'
import { useCreateStudent } from '@/hooks/system/useStudents'
import { ApiError } from '@/lib/system/api'
import { useI18n } from '@/lib/system/i18n'

/* ─── Schema ───────────────────────────────────────── */
const schema = z.object({
  name:              z.string().optional(),
  whatsapp:          z.string().optional(),
  country:           z.string().min(1, 'Country is required'),
  timezone:          z.string().min(1, 'Timezone is required'),
  student_type:      z.enum(['child', 'adult']),
  guardian_id:       z.number().optional(),
  guardian_name:     z.string().optional(),
  guardian_whatsapp: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.student_type === 'adult' && !data.name?.trim()) {
    ctx.addIssue({ code: 'custom', message: 'Name is required', path: ['name'] })
  }
  if (data.student_type === 'child' && !data.guardian_id && !data.guardian_name) {
    ctx.addIssue({ code: 'custom', message: 'Parent name is required', path: ['guardian_name'] })
  }
  if (data.student_type === 'child' && !data.guardian_id && !data.guardian_whatsapp) {
    ctx.addIssue({ code: 'custom', message: 'Parent WhatsApp is required', path: ['guardian_whatsapp'] })
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
  const { t } = useI18n()
  const create = useCreateStudent()
  const [waDialCode, setWaDialCode]     = useState<string | undefined>(undefined)
  const [children, setChildren]         = useState([{ name: '' }])
  const [childErrors, setChildErrors]   = useState<string[]>([])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, control, watch, reset, setValue, formState: { errors, isSubmitting } } = useForm<any>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { student_type: 'adult' },
  })

  // eslint-disable-next-line react-hooks/incompatible-library
  const studentType = watch('student_type')

  function addChild() {
    setChildren(prev => [...prev, { name: '' }])
    setChildErrors(prev => [...prev, ''])
  }

  function removeChild(i: number) {
    setChildren(prev => prev.filter((_, j) => j !== i))
    setChildErrors(prev => prev.filter((_, j) => j !== i))
  }

  function updateChild(i: number, name: string) {
    setChildren(prev => prev.map((c, j) => j === i ? { name } : c))
    if (name.trim()) {
      setChildErrors(prev => prev.map((e, j) => j === i ? '' : e))
    }
  }

  async function onSubmit(values: FormValues) {
    try {
      if (studentType === 'child') {
        const errs = children.map(c => c.name.trim() ? '' : 'Name is required')
        if (errs.some(Boolean)) {
          setChildErrors(errs)
          return
        }
        for (const child of children) {
          await create.mutateAsync({
            name:              child.name.trim(),
            country:           values.country,
            timezone:          values.timezone,
            student_type:      'child',
            guardian_id:       values.guardian_id,
            guardian_name:     values.guardian_name,
            guardian_whatsapp: values.guardian_whatsapp,
          } as Record<string, unknown>)
        }
        const label = children.length > 1 ? `${children.length} students enrolled successfully.` : 'Student enrolled successfully.'
        toast.success(label)
      } else {
        await create.mutateAsync(values as Record<string, unknown>)
        toast.success('Student enrolled successfully.')
      }
      reset()
      setChildren([{ name: '' }])
      setChildErrors([])
      setWaDialCode(undefined)
      onOpenChange(false)
    } catch (e) {
      if (e instanceof ApiError && e.errors) {
        Object.values(e.errors).flat().forEach((m) => toast.error(String(m)))
      } else {
        toast.error(e instanceof ApiError ? e.message : 'Failed to create student.')
      }
    }
  }

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
                  {t('students.enrollNew')}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="text-xs mt-0.5" style={{ color: 'rgb(90 100 112)' }}>
                  {t('students.enrollNewDescription')}
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
              {/* ── Student type — top of form ── */}
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
                          {v === 'adult' ? t('students.typeAdultLabel') : t('students.typeChildLabel')}
                        </p>
                        <p className="text-[11px] opacity-50 leading-tight mt-0.5">
                          {v === 'adult' ? t('students.typeAdultHint') : t('students.typeChildHint')}
                        </p>
                      </div>
                    </label>
                  )
                })}
              </div>

              {/* ── Identity (adult) ── */}
              {studentType === 'adult' && (
                <Section title={t('students.sectionIdentity')}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label={t('common.name')} required error={errors.name}>
                      <input className={inp} style={inpStyle} {...register('name')} />
                    </Field>

                    <Field label={t('common.whatsapp')}>
                      <Controller
                        name="whatsapp"
                        control={control}
                        render={({ field }) => (
                          <WhatsAppInput
                            value={field.value ?? ''}
                            onChange={field.onChange}
                            syncDialCode={waDialCode}
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
                            onChange={(code, timezone, dialCode) => {
                              field.onChange(code)
                              setValue('timezone', timezone, { shouldValidate: true })
                              setWaDialCode(dialCode)
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
                          <input
                            className={inp}
                            style={inpStyle}
                            placeholder="e.g. Africa/Cairo"
                            {...field}
                            value={field.value ?? ''}
                          />
                        )}
                      />
                    </Field>
                  </div>
                </Section>
              )}

              {/* ── Children list (child mode) ── */}
              {studentType === 'child' && (
                <Section title={t('students.childrenSection')}>
                  <div className="space-y-2">
                    {children.map((child, i) => (
                      <div key={i}>
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            {children.length > 1 && (
                              <label className="block text-xs font-medium mb-1.5 opacity-70">
                                {t('students.childName')} {i + 1} <span className="text-red-500">*</span>
                              </label>
                            )}
                            {children.length === 1 && (
                              <label className="block text-xs font-medium mb-1.5 opacity-70">
                                {t('students.childName')} <span className="text-red-500">*</span>
                              </label>
                            )}
                            <input
                              className={inp}
                              style={inpStyle}
                              placeholder="Full name"
                              value={child.name}
                              onChange={e => updateChild(i, e.target.value)}
                            />
                          </div>
                          {children.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeChild(i)}
                              className="mb-px p-2 rounded-lg hover:bg-red-50 transition-colors opacity-40 hover:opacity-100"
                              style={{ color: 'rgb(220 38 38)' }}
                              aria-label="Remove child"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                        {childErrors[i] && (
                          <p className="text-red-500 text-[11px] mt-1">{childErrors[i]}</p>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addChild}
                      className="flex items-center gap-1.5 text-xs font-semibold mt-1 px-2 py-1.5 rounded-lg hover:bg-black/5 transition-colors"
                      style={{ color: 'rgb(14 124 90)' }}
                    >
                      <PlusCircle size={13} />
                      {t('students.addAnotherChild')}
                    </button>
                  </div>
                </Section>
              )}

              {/* ── Parent / Guardian (children only) — includes country & timezone ── */}
              {studentType === 'child' && (
                <Section title={t('students.sectionParentGuardian')}>
                  <ParentGuardianFields control={control} setValue={setValue} syncDialCode={waDialCode} />

                  {/* Country / Timezone moved here for child mode */}
                  <div
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 mt-1 border-t"
                    style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}
                  >
                    <Field label="Country" required error={errors.country}>
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
                    </Field>

                    <Field label="Timezone" required error={errors.timezone}>
                      <Controller
                        name="timezone"
                        control={control}
                        render={({ field }) => (
                          <input
                            className={inp}
                            style={inpStyle}
                            placeholder="e.g. Africa/Cairo"
                            {...field}
                            value={field.value ?? ''}
                          />
                        )}
                      />
                    </Field>
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
                {t('common.cancel')}
              </DialogPrimitive.Close>
              <button
                type="submit"
                form="add-student-form"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60 transition-opacity hover:opacity-90"
                style={{ background: 'rgb(14 124 90)' }}
              >
                {isSubmitting
                  ? t('common.adding')
                  : studentType === 'child' && children.length > 1
                    ? `${t('students.addTrialStudents')} (${children.length})`
                    : t('students.addTrialStudent')
                }
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
