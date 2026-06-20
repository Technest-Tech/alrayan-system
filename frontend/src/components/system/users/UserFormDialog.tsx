'use client'
import { useState, useEffect, useRef, type ReactNode } from 'react'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { toast } from 'sonner'
import { X, Plus, Star, Upload, Trash2, Loader2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCourses } from '@/hooks/system/useCourses'
import { useTeachers } from '@/hooks/system/useTeachers'
import { useGuardians } from '@/hooks/system/useGuardians'
import { useCreateUser, useUpdateUser } from '@/hooks/system/useUserDirectory'
import { uploadFile } from '@/lib/system/upload'
import { ApiError } from '@/lib/system/api'
import { useI18n } from '@/lib/system/i18n'
import {
  USER_ROLES, USER_STATUSES, LOGIN_ROLES,
  type DirectoryUser, type UserRole, type StudentProfile, type TeacherProfile,
} from '@/types/system/user-directory'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  user?: DirectoryUser | null   // present → edit mode
}

const TEAL = 'rgb(14 124 90)'
const NAVY = 'rgb(11 31 58)'
const MINT = 'rgb(234 246 240)'
const CARD_BORDER = 'rgb(14 124 90 / 0.18)'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'EGP', 'SAR', 'AED', 'MAD']
const SOURCES = [
  { value: 'manual', label: 'Manual' },
  { value: 'lead', label: 'Lead' },
  { value: 'referral', label: 'Referral' },
  { value: 'trial_booking', label: 'Trial Booking' },
]
type FamilyMode = 'none' | 'new' | 'existing'

interface Relative { name: string; relationship: string; whatsapp: string }

interface FormState {
  role: UserRole | ''
  name: string
  emails: string[]
  primaryEmail: number
  phones: string[]
  primaryPhone: number
  password: string
  birthday: string
  gender: string
  language: string
  status: string
  notes: string
  photo_url: string
  documents: { graduation_certificate: string; id_front: string; id_back: string }
  relatives: Relative[]
  // student
  country: string
  timezone: string
  course_id: string
  assigned_teacher_id: string
  sessions_per_month: string
  session_duration_min: string
  currency: string
  tariff: string          // package price, major units
  teacher_tariff: string  // money / hour, major units
  package_hours: string
  source: string
  family_mode: FamilyMode
  guardian_id: string
  guardian_name: string
  guardian_whatsapp: string
  // teacher
  payment_method: string
  hourly_rate: string
  qualifications: string
  teacher_currency: string
  accepts_new_students: boolean
  teacher_course_ids: string[]
}

function blank(): FormState {
  return {
    role: '', name: '', emails: [''], primaryEmail: 0, phones: [''], primaryPhone: 0, password: '',
    birthday: '', gender: '', language: 'en', status: 'active', notes: '',
    photo_url: '', documents: { graduation_certificate: '', id_front: '', id_back: '' }, relatives: [],
    country: '', timezone: '', course_id: '', assigned_teacher_id: '',
    sessions_per_month: '', session_duration_min: '30', currency: 'USD',
    tariff: '', teacher_tariff: '', package_hours: '', source: 'manual',
    family_mode: 'none', guardian_id: '', guardian_name: '', guardian_whatsapp: '',
    payment_method: 'instapay', hourly_rate: '', qualifications: '',
    teacher_currency: 'EUR', accepts_new_students: true, teacher_course_ids: [],
  }
}

function fromUser(u: DirectoryUser): FormState {
  const f = blank()
  f.role = u.role
  f.name = u.name
  f.emails = u.emails?.length ? u.emails.map((e) => e.email) : (u.email ? [u.email] : [''])
  f.primaryEmail = Math.max(0, u.emails?.findIndex((e) => e.is_primary) ?? 0)
  f.phones = u.phones?.length ? u.phones.map((p) => p.phone) : (u.whatsapp ? [u.whatsapp] : [''])
  f.primaryPhone = Math.max(0, u.phones?.findIndex((p) => p.is_primary) ?? 0)
  f.birthday = u.birthday ?? ''
  f.gender = u.gender ?? ''
  f.language = u.language ?? 'en'
  f.status = u.status
  f.notes = u.notes ?? ''
  f.photo_url = u.photo_url ?? ''
  f.documents = {
    graduation_certificate: u.documents?.graduation_certificate ?? '',
    id_front: u.documents?.id_front ?? '',
    id_back: u.documents?.id_back ?? '',
  }
  if (u.role === 'student' && u.profile) {
    const p = u.profile as StudentProfile
    f.country = p.country ?? ''
    f.timezone = p.timezone ?? ''
    f.course_id = p.course ? String(p.course.id) : ''
    f.assigned_teacher_id = p.assigned_teacher ? String(p.assigned_teacher.id) : ''
    f.sessions_per_month = String(p.sessions_per_month ?? '')
    f.session_duration_min = String(p.session_duration_min ?? 30)
    f.currency = p.currency ?? 'USD'
    f.tariff = p.monthly_price_minor ? String(p.monthly_price_minor / 100) : ''
    f.teacher_tariff = p.hourly_rate_minor ? String(p.hourly_rate_minor / 100) : ''
    f.package_hours = p.package_hours_default ? String(p.package_hours_default) : ''
    f.source = p.source ?? 'manual'
    if (p.student_type === 'child' && p.guardian) {
      f.family_mode = 'existing'
      f.guardian_id = String(p.guardian.id)
      f.guardian_name = p.guardian.name
      f.guardian_whatsapp = p.guardian.whatsapp ?? ''
    }
  }
  if (u.role === 'teacher' && u.profile) {
    const p = u.profile as TeacherProfile
    f.payment_method = p.payment_method ?? 'instapay'
    f.hourly_rate = String(p.hourly_rate ?? '')
    f.qualifications = p.qualifications ?? ''
    f.teacher_currency = p.currency ?? 'EUR'
    f.accepts_new_students = p.accepts_new_students ?? true
    f.teacher_course_ids = (p.teachable_course_ids ?? []).map(String)
  }
  return f
}

const inp = 'w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)] transition-shadow bg-white'
const inpStyle = { borderColor: 'rgb(var(--border-default,229 233 240))' }
const trigCls = 'w-full bg-white'

export function UserFormDialog({ open, onOpenChange, user }: Props) {
  const isEdit = !!user
  const { t } = useI18n()
  const [form, setForm] = useState<FormState>(blank())
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState<string | null>(null)
  const create = useCreateUser()
  const update = useUpdateUser()
  const { data: courses = [] } = useCourses()
  const { data: teachersData } = useTeachers()
  const teachers = teachersData?.data ?? []
  const pending = create.isPending || update.isPending

  const role = form.role
  const isStudent = role === 'student'
  const isTeacher = role === 'teacher'
  const isChild = isStudent && form.family_mode !== 'none'

  const { data: guardians = [] } = useGuardians(isStudent && form.family_mode === 'existing')

  const photoRef = useRef<HTMLInputElement>(null)
  const gradRef = useRef<HTMLInputElement>(null)
  const idFrontRef = useRef<HTMLInputElement>(null)
  const idBackRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setForm(user ? fromUser(user) : blank())
      setErrors({})
      setUploading(null)
    }
  }, [open, user])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }))

  async function handleUpload(file: File | undefined, folder: 'photos' | 'documents', slot: string, apply: (url: string) => void) {
    if (!file) return
    setUploading(slot)
    try { apply(await uploadFile(file, folder)) }
    catch { toast.error('Upload failed') }
    finally { setUploading(null) }
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!form.role) e.role = 'Role is required'
    if (!form.name.trim()) e.name = 'Name is required'
    const emails = form.emails.map((x) => x.trim()).filter(Boolean)
    if (role && LOGIN_ROLES.includes(role) && emails.length === 0) e.email = 'At least one email is required'
    if (isStudent) {
      if (!form.country.trim()) e.country = 'Country is required'
      if (!form.timezone.trim()) e.timezone = 'Timezone is required'
      if (form.family_mode === 'new' && !form.guardian_name.trim()) e.guardian_name = 'Guardian name is required'
      if (form.family_mode === 'existing' && !form.guardian_id) e.guardian_id = 'Select a parent'
    }
    if (isTeacher) {
      if (!form.payment_method) e.payment_method = 'Payment method is required'
      if (!form.hourly_rate) e.hourly_rate = 'Hourly rate is required'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function buildPayload(): Record<string, unknown> {
    const emails = form.emails.map((x) => x.trim()).filter(Boolean)
    const phones = form.phones.map((x) => x.trim()).filter(Boolean)
    const primaryEmail = emails[form.primaryEmail] ?? emails[0] ?? null
    const primaryPhone = phones[form.primaryPhone] ?? phones[0] ?? null
    const documents = Object.fromEntries(Object.entries(form.documents).filter(([, v]) => v))
    const toMinor = (v: string) => (v ? Math.round(Number(v) * 100) : null)

    const payload: Record<string, unknown> = {
      role: form.role,
      name: form.name,
      email: primaryEmail,
      emails: emails.filter((x) => x !== primaryEmail),
      whatsapp: primaryPhone,
      phones: phones.filter((x) => x !== primaryPhone),
      birthday: form.birthday || null,
      gender: form.gender || null,
      language: form.language || null,
      status: form.status,
      notes: form.notes || null,
      photo_url: form.photo_url || null,
      documents: Object.keys(documents).length ? documents : null,
    }
    if (!isEdit && form.password) payload.password = form.password

    if (isStudent) {
      Object.assign(payload, {
        student_type: form.family_mode === 'none' ? 'adult' : 'child',
        country: form.country,
        timezone: form.timezone,
        course_id: form.course_id ? Number(form.course_id) : null,
        assigned_teacher_id: form.assigned_teacher_id ? Number(form.assigned_teacher_id) : null,
        sessions_per_month: form.sessions_per_month ? Number(form.sessions_per_month) : null,
        session_duration_min: Number(form.session_duration_min),
        currency: form.currency,
        monthly_price_minor: toMinor(form.tariff),
        hourly_rate_minor: toMinor(form.teacher_tariff),
        package_hours_default: form.package_hours ? Number(form.package_hours) : null,
        source: form.source || undefined,
        guardian_id: form.family_mode === 'existing' && form.guardian_id ? Number(form.guardian_id) : undefined,
        guardian_name: form.family_mode === 'new' ? form.guardian_name : undefined,
        guardian_whatsapp: form.family_mode === 'new' ? form.guardian_whatsapp : undefined,
      })
    }
    if (isTeacher) {
      Object.assign(payload, {
        payment_method: form.payment_method,
        hourly_rate: form.hourly_rate ? Number(form.hourly_rate) : null,
        qualifications: form.qualifications || null,
        currency: form.teacher_currency || null,
        accepts_new_students: form.accepts_new_students,
        teachable_course_ids: form.teacher_course_ids.map(Number),
      })
    }
    return payload
  }

  async function onSubmit() {
    if (!validate()) return
    try {
      if (isEdit && user) {
        await update.mutateAsync({ id: user.id, data: buildPayload() })
        toast.success('User updated')
      } else {
        await create.mutateAsync(buildPayload())
        toast.success('User created')
      }
      onOpenChange(false)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.errors) {
          const flat: Record<string, string> = {}
          Object.entries(err.errors).forEach(([k, v]) => { flat[k] = v[0] })
          setErrors(flat)
        }
        toast.error(err.message || 'Something went wrong')
      } else {
        toast.error('Something went wrong')
      }
    }
  }

  const updEmail = (i: number, v: string) => set('emails', form.emails.map((x, idx) => (idx === i ? v : x)))
  const updPhone = (i: number, v: string) => set('phones', form.phones.map((x, idx) => (idx === i ? v : x)))

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-[rgb(11,31,58)]/40 backdrop-blur-sm" />
        <DialogPrimitive.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-3xl max-h-[94vh] flex flex-col rounded-2xl shadow-2xl bg-white">
            {/* Header */}
            <div className="flex items-start justify-between px-7 pt-6 pb-4 border-b shrink-0" style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
              <div>
                <DialogPrimitive.Title className="text-lg font-semibold" style={{ color: NAVY }}>
                  {isEdit ? t('users.editUser') : t('users.createNewUser')}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="text-xs mt-1 opacity-50">
                  {isEdit ? t('users.editDescription') : t('users.createDescription')}
                </DialogPrimitive.Description>
              </div>
              <DialogPrimitive.Close className="p-1.5 rounded-lg hover:bg-black/5"><X size={18} /></DialogPrimitive.Close>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-7 py-5 space-y-5">
              {/* Decoy fields absorb the browser's autofill of the logged-in
                  account so it never lands in the real email/password inputs. */}
              <input type="text" name="username" autoComplete="username" tabIndex={-1} aria-hidden="true" className="absolute opacity-0 w-0 h-0 -z-10 pointer-events-none" />
              <input type="password" name="password" autoComplete="new-password" tabIndex={-1} aria-hidden="true" className="absolute opacity-0 w-0 h-0 -z-10 pointer-events-none" />
              {/* ── Personal Information ── */}
              <SectionCard title={t('users.sectionPersonalInfo')}>
                <div className="flex justify-center">
                  <button type="button" onClick={() => photoRef.current?.click()} className="w-36 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 py-5 px-3 bg-white hover:bg-[rgb(14,124,90)]/[0.03] transition-colors" style={{ borderColor: 'rgb(14 124 90 / 0.3)' }}>
                    {uploading === 'photo' ? <Loader2 size={20} className="animate-spin" style={{ color: TEAL }} />
                      : form.photo_url ? <img src={form.photo_url} alt="" className="w-16 h-16 rounded-full object-cover" />
                      : <Upload size={20} style={{ color: TEAL }} />}
                    <span className="text-sm font-medium" style={{ color: NAVY }}>{t('users.uploadPhoto')}</span>
                    <span className="text-[10px] leading-tight opacity-50 text-center">{t('users.dragAndDropHint')}<br />{t('users.photoFormats')}</span>
                  </button>
                  <input ref={photoRef} type="file" accept="image/*" hidden onChange={(e) => handleUpload(e.target.files?.[0], 'photos', 'photo', (u) => set('photo_url', u))} />
                </div>

                <Field label={t('common.name')} required error={errors.name}>
                  <input className={inp} style={inpStyle} placeholder="John Doe" value={form.name} onChange={(e) => set('name', e.target.value)} />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ContactColumn label={t('users.emailAddresses')} required addLabel={t('users.addEmail')} placeholder="john@example.com" helper={t('users.emailPrimaryHint')}
                    items={form.emails} primary={form.primaryEmail} error={errors.email}
                    onChange={updEmail} onAdd={() => set('emails', [...form.emails, ''])}
                    onRemove={(i) => { const next = form.emails.filter((_, idx) => idx !== i); set('emails', next.length ? next : ['']) }}
                    onPrimary={(i) => set('primaryEmail', i)} />
                  <ContactColumn label={t('users.phoneNumbers')} addLabel={t('users.addPhone')} placeholder="+1 555-123-4567"
                    items={form.phones} primary={form.primaryPhone}
                    onChange={updPhone} onAdd={() => set('phones', [...form.phones, ''])}
                    onRemove={(i) => { const next = form.phones.filter((_, idx) => idx !== i); set('phones', next.length ? next : ['']) }}
                    onPrimary={(i) => set('primaryPhone', i)} />
                </div>

                <Field label={isEdit ? t('users.passwordNote') : t('common.password')} required={!isEdit}>
                  <input type="password" autoComplete="new-password" data-1p-ignore data-lpignore="true" className={inp} style={inpStyle} placeholder="••••••••" value={form.password} onChange={(e) => set('password', e.target.value)} />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label={t('users.birthday')}>
                    <input type="date" className={inp} style={inpStyle} value={form.birthday} onChange={(e) => set('birthday', e.target.value)} />
                  </Field>
                  <Field label={t('users.gender')}>
                    <Select value={form.gender || '_none_'} onValueChange={(v) => set('gender', v === '_none_' ? '' : v)}>
                      <SelectTrigger className={trigCls}><SelectValue placeholder={t('users.gender')} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none_">{t('users.gender')}</SelectItem>
                        <SelectItem value="male">{t('users.male')}</SelectItem>
                        <SelectItem value="female">{t('users.female')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <Field label={t('common.notes')}>
                  <textarea className={inp} style={inpStyle} rows={2} placeholder={t('users.notesPlaceholder')} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
                </Field>
              </SectionCard>

              {/* ── Documents & Additional Info ── */}
              <SectionCard title={t('users.sectionDocuments')}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <UploadField label={t('users.graduationCertificate')} uploadedLabel={t('users.uploadedReplace')} value={form.documents.graduation_certificate} loading={uploading === 'grad'} onClick={() => gradRef.current?.click()} />
                  <UploadField label={t('users.idFront')} uploadedLabel={t('users.uploadedReplace')} value={form.documents.id_front} loading={uploading === 'idf'} onClick={() => idFrontRef.current?.click()} />
                </div>
                <UploadField label={t('users.idBack')} uploadedLabel={t('users.uploadedReplace')} value={form.documents.id_back} loading={uploading === 'idb'} onClick={() => idBackRef.current?.click()} />
                <input ref={gradRef} type="file" hidden accept="image/*,application/pdf" onChange={(e) => handleUpload(e.target.files?.[0], 'documents', 'grad', (u) => set('documents', { ...form.documents, graduation_certificate: u }))} />
                <input ref={idFrontRef} type="file" hidden accept="image/*,application/pdf" onChange={(e) => handleUpload(e.target.files?.[0], 'documents', 'idf', (u) => set('documents', { ...form.documents, id_front: u }))} />
                <input ref={idBackRef} type="file" hidden accept="image/*,application/pdf" onChange={(e) => handleUpload(e.target.files?.[0], 'documents', 'idb', (u) => set('documents', { ...form.documents, id_back: u }))} />

                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium opacity-70">{t('users.relatives')}</label>
                    <button type="button" onClick={() => set('relatives', [...form.relatives, { name: '', relationship: '', whatsapp: '' }])} className="text-xs font-medium flex items-center gap-1" style={{ color: TEAL }}>
                      <Plus size={11} /> {t('users.addRelative')}
                    </button>
                  </div>
                  {form.relatives.length === 0 ? (
                    <p className="text-[11px] opacity-40">{t('users.relativesHint')}</p>
                  ) : (
                    <div className="space-y-2">
                      {form.relatives.map((r, i) => (
                        <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                          <input className={inp} style={inpStyle} placeholder={t('common.name')} value={r.name} onChange={(e) => set('relatives', form.relatives.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} />
                          <input className={inp} style={inpStyle} placeholder={t('users.relationship')} value={r.relationship} onChange={(e) => set('relatives', form.relatives.map((x, idx) => idx === i ? { ...x, relationship: e.target.value } : x))} />
                          <input className={inp} style={inpStyle} placeholder={t('common.whatsapp')} value={r.whatsapp} onChange={(e) => set('relatives', form.relatives.map((x, idx) => idx === i ? { ...x, whatsapp: e.target.value } : x))} />
                          <button type="button" onClick={() => set('relatives', form.relatives.filter((_, idx) => idx !== i))} className="p-2 rounded-lg hover:bg-red-50" aria-label={t('users.removeRelative')}><Trash2 size={14} className="text-red-500" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </SectionCard>

              {/* ── Account Settings ── */}
              <SectionCard title={t('users.sectionAccountSettings')}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label={t('common.role')} required error={errors.role}>
                    <Select value={form.role || '_none_'} onValueChange={(v) => set('role', (v === '_none_' ? '' : v) as UserRole | '')}>
                      <SelectTrigger className={trigCls}><SelectValue placeholder={t('users.selectRole')} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none_">{t('users.selectRole')}</SelectItem>
                        {USER_ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label={t('common.status')}>
                    <Select value={form.status} onValueChange={(v) => set('status', v)}>
                      <SelectTrigger className={trigCls}><SelectValue /></SelectTrigger>
                      <SelectContent>{USER_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label={t('users.language')}>
                    <Select value={form.language} onValueChange={(v) => set('language', v)}>
                      <SelectTrigger className={trigCls}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">{t('users.langEnglish')}</SelectItem>
                        <SelectItem value="ar">العربية</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </SectionCard>

              {/* ── Student Information ── */}
              {isStudent && (
                <SectionCard title={t('users.sectionStudentInfo')}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label={t('common.teacher')}>
                      <Select value={form.assigned_teacher_id || '_none_'} onValueChange={(v) => set('assigned_teacher_id', v === '_none_' ? '' : v)}>
                        <SelectTrigger className={trigCls}><SelectValue placeholder={t('users.selectTeacher')} /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none_">{t('users.selectTeacher')}</SelectItem>
                          {teachers.map((tchr) => <SelectItem key={tchr.id} value={String(tchr.id)}>{tchr.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label={t('users.packagePrice')}>
                      <input type="number" min={0} className={inp} style={inpStyle} placeholder="40" value={form.tariff} onChange={(e) => set('tariff', e.target.value)} />
                    </Field>

                    <Field label={t('common.currency')}>
                      <Select value={form.currency} onValueChange={(v) => set('currency', v)}>
                        <SelectTrigger className={trigCls}><SelectValue /></SelectTrigger>
                        <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </Field>
                    <Field label={t('users.teacherTariff')}>
                      <input type="number" min={0} step="0.01" className={inp} style={inpStyle} placeholder="15.00" value={form.teacher_tariff} onChange={(e) => set('teacher_tariff', e.target.value)} />
                    </Field>

                    <Field label={t('users.packageSessions')}>
                      <input type="number" min={0} className={inp} style={inpStyle} placeholder="8" value={form.sessions_per_month} onChange={(e) => set('sessions_per_month', e.target.value)} />
                    </Field>
                    <Field label={t('users.packageHours')}>
                      <input type="number" min={0} className={inp} style={inpStyle} placeholder="4" value={form.package_hours} onChange={(e) => set('package_hours', e.target.value)} />
                    </Field>

                    <Field label={t('users.source')}>
                      <Select value={form.source} onValueChange={(v) => set('source', v)}>
                        <SelectTrigger className={trigCls}><SelectValue /></SelectTrigger>
                        <SelectContent>{SOURCES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </Field>
                    <Field label={t('users.subjects')}>
                      <Select value={form.course_id || '_none_'} onValueChange={(v) => set('course_id', v === '_none_' ? '' : v)}>
                        <SelectTrigger className={trigCls}><SelectValue placeholder={t('users.selectSubject')} /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none_">{t('users.selectSubject')}</SelectItem>
                          {courses.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field label={t('common.country')} required error={errors.country}>
                      <input className={inp} style={inpStyle} placeholder="EG" maxLength={2} value={form.country} onChange={(e) => set('country', e.target.value.toUpperCase())} />
                    </Field>
                    <Field label={t('common.timezone')} required error={errors.timezone}>
                      <input className={inp} style={inpStyle} placeholder="Africa/Cairo" value={form.timezone} onChange={(e) => set('timezone', e.target.value)} />
                    </Field>
                  </div>

                  {/* Parent / Family */}
                  <div className="pt-3 mt-1 border-t" style={{ borderColor: 'rgb(14 124 90 / 0.15)' }}>
                    <p className="text-xs font-semibold mb-2" style={{ color: NAVY }}>{t('users.sectionParentFamily')}</p>
                    <div className="space-y-1.5">
                      {([
                        ['none', t('users.noParent')],
                        ['new', t('users.createNewFamily')],
                        ['existing', t('users.selectExistingParent')],
                      ] as [FamilyMode, string][]).map(([mode, label]) => (
                        <label key={mode} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="radio" name="family_mode" checked={form.family_mode === mode} onChange={() => set('family_mode', mode)} style={{ accentColor: TEAL }} />
                          {label}
                        </label>
                      ))}
                    </div>

                    {form.family_mode === 'new' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                        <Field label={t('users.guardianName')} required error={errors.guardian_name}>
                          <input className={inp} style={inpStyle} value={form.guardian_name} onChange={(e) => set('guardian_name', e.target.value)} />
                        </Field>
                        <Field label={t('users.guardianWhatsApp')}>
                          <input className={inp} style={inpStyle} value={form.guardian_whatsapp} onChange={(e) => set('guardian_whatsapp', e.target.value)} />
                        </Field>
                      </div>
                    )}
                    {form.family_mode === 'existing' && (
                      <div className="mt-3">
                        <Field label={t('users.existingParent')} required error={errors.guardian_id}>
                          <Select value={form.guardian_id || '_none_'} onValueChange={(v) => set('guardian_id', v === '_none_' ? '' : v)}>
                            <SelectTrigger className={trigCls}><SelectValue placeholder={t('users.selectParent')} /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="_none_">{t('users.selectParent')}</SelectItem>
                              {guardians.map((g) => <SelectItem key={g.id} value={String(g.id)}>{g.name}{g.whatsapp ? ` · ${g.whatsapp}` : ''}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </Field>
                      </div>
                    )}
                  </div>
                </SectionCard>
              )}

              {/* ── Teacher Information ── */}
              {isTeacher && (
                <SectionCard title={t('users.sectionTeacherInfo')}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Field label={t('teachers.hourlyRate')} required error={errors.hourly_rate}>
                      <input type="number" min={0} className={inp} style={inpStyle} value={form.hourly_rate} onChange={(e) => set('hourly_rate', e.target.value)} />
                    </Field>
                    <Field label={t('common.currency')}>
                      <Select value={form.teacher_currency} onValueChange={(v) => set('teacher_currency', v)}>
                        <SelectTrigger className={trigCls}><SelectValue /></SelectTrigger>
                        <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </Field>
                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                        <input type="checkbox" checked={form.accepts_new_students} onChange={(e) => set('accepts_new_students', e.target.checked)} style={{ accentColor: TEAL, width: 16, height: 16 }} />
                        <span style={{ color: NAVY }}>{t('users.acceptsNewStudents')}</span>
                      </label>
                    </div>
                  </div>

                  <Field label="Payment Method" required error={errors.payment_method}>
                    <Select value={form.payment_method} onValueChange={(v) => set('payment_method', v)}>
                      <SelectTrigger className={trigCls}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instapay">{t('users.instapay')}</SelectItem>
                        <SelectItem value="vodafone_cash">{t('users.vodafoneCash')}</SelectItem>
                        <SelectItem value="wallet_other">{t('users.walletOther')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field label={t('users.subjects')} hint={courses.length ? undefined : t('users.noSubjectsAvailable')}>
                    {courses.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {courses.map((c) => {
                          const id = String(c.id)
                          const on = form.teacher_course_ids.includes(id)
                          return (
                            <button key={c.id} type="button"
                              onClick={() => set('teacher_course_ids', on ? form.teacher_course_ids.filter((x) => x !== id) : [...form.teacher_course_ids, id])}
                              className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
                              style={on
                                ? { background: TEAL, color: '#fff', borderColor: TEAL }
                                : { background: '#fff', color: NAVY, borderColor: 'rgb(var(--border-default,229 233 240))' }}>
                              {c.name}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </Field>

                  <Field label={t('users.qualifications')}>
                    <textarea className={inp} style={inpStyle} rows={2} value={form.qualifications} onChange={(e) => set('qualifications', e.target.value)} />
                  </Field>
                </SectionCard>
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 flex items-center justify-center gap-3 px-7 py-4 border-t" style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
              <DialogPrimitive.Close className="px-6 py-2 rounded-lg text-sm font-medium border hover:bg-black/5" style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
                {t('common.cancel')}
              </DialogPrimitive.Close>
              <button type="button" onClick={onSubmit} disabled={pending} className="px-7 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ background: NAVY }}>
                {pending ? t('common.saving') : isEdit ? t('users.updateUser') : t('users.createUser')}
              </button>
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

/* ─── helpers ─────────────────────────── */
function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="relative rounded-2xl px-5 pt-7 pb-5" style={{ background: MINT, border: `1px solid ${CARD_BORDER}` }}>
      <span className="absolute left-3 top-3 w-2 h-2 rotate-45" style={{ border: `1.5px solid rgb(14 124 90 / 0.45)` }} />
      <span className="absolute right-3 top-3 w-2 h-2 rotate-45" style={{ border: `1.5px solid rgb(14 124 90 / 0.45)` }} />
      <div className="flex items-center justify-center gap-2 mb-5">
        <span className="w-1.5 h-1.5 rotate-45" style={{ background: TEAL }} />
        <Plus size={11} style={{ color: TEAL }} />
        <span className="text-sm font-semibold tracking-wide" style={{ color: NAVY }}>{title}</span>
        <Plus size={11} style={{ color: TEAL }} />
        <span className="w-1.5 h-1.5 rotate-45" style={{ background: TEAL }} />
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, required, error, hint, children }: { label: string; required?: boolean; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5 opacity-70">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-[11px] mt-1 opacity-40">{hint}</p>}
      {error && <p className="text-red-500 text-[11px] mt-1">{error}</p>}
    </div>
  )
}

function ContactColumn({ label, required, addLabel, placeholder, helper, items, primary, error, onChange, onAdd, onRemove, onPrimary }: {
  label: string; required?: boolean; addLabel: string; placeholder: string; helper?: string
  items: string[]; primary: number; error?: string
  onChange: (i: number, v: string) => void; onAdd: () => void; onRemove: (i: number) => void; onPrimary: (i: number) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-medium opacity-70">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
        <button type="button" onClick={onAdd} className="text-xs font-medium flex items-center gap-1" style={{ color: TEAL }}>
          <Plus size={11} /> {addLabel}
        </button>
      </div>
      <div className="space-y-2">
        {items.map((v, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <input className={inp} style={inpStyle} placeholder={placeholder} value={v} onChange={(e) => onChange(i, e.target.value)} autoComplete="off" data-1p-ignore data-lpignore="true" />
            {primary === i && <span className="text-[10px] font-medium shrink-0" style={{ color: TEAL }}>Primary</span>}
            <button type="button" onClick={() => onPrimary(i)} title="Set as primary" aria-label={`Set ${label} ${i + 1} as primary`}>
              <Star size={15} fill={primary === i ? '#eab308' : 'none'} style={{ color: primary === i ? '#eab308' : 'rgb(180 190 200)' }} />
            </button>
            <button type="button" onClick={() => onRemove(i)} aria-label={`Remove ${label} ${i + 1}`}>
              <X size={15} className="text-red-500" />
            </button>
          </div>
        ))}
      </div>
      {helper && !error && <p className="text-[11px] mt-1 opacity-40">{helper}</p>}
      {error && <p className="text-red-500 text-[11px] mt-1">{error}</p>}
    </div>
  )
}

function UploadField({ label, uploadedLabel, value, loading, onClick }: { label: string; uploadedLabel?: string; value: string; loading?: boolean; onClick: () => void }) {
  return (
    <Field label={label}>
      <button type="button" onClick={onClick} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border bg-white text-sm text-left" style={inpStyle}>
        {loading ? <Loader2 size={14} className="animate-spin" style={{ color: TEAL }} /> : <Upload size={14} className="opacity-50" />}
        <span className={value ? 'truncate' : 'opacity-40'} style={value ? { color: TEAL } : undefined}>
          {value ? (uploadedLabel ?? 'Uploaded ✓ — replace') : `Upload ${label}`}
        </span>
      </button>
    </Field>
  )
}
