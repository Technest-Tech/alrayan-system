'use client'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  Upload, Trash2, Plus, X, User, FileText, Users as UsersIcon, CreditCard, ShieldCheck, Loader2,
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { useMyProfile, useUpdateMyProfile, type MyProfileUpdate, type Relative } from '@/hooks/system/useMyProfile'
import { uploadFile } from '@/lib/system/upload'
import { useI18n } from '@/lib/system/i18n'

const BORDER = 'rgb(var(--border-default, 229 233 240))'
const CARD = 'rgb(var(--surface-card, 255 255 255))'
const TEAL = 'rgb(14 124 90)'
const NAVY = 'rgb(11 31 58)'
const MUTED = 'rgb(90 100 112)'

const DOC_SLOTS = [
  { key: 'graduation_certificate', labelKey: 'teacher.settings.docGraduation' },
  { key: 'id_card_front',          labelKey: 'teacher.settings.docIdFront' },
  { key: 'id_card_back',           labelKey: 'teacher.settings.docIdBack' },
] as const

const PAYMENT_METHODS = [
  { value: 'vodafone_cash', label: 'Vodafone Cash' },
  { value: 'instapay',      label: 'InstaPay' },
  { value: 'wallet_other',  label: 'Other Wallet' },
] as const

const inputCls = 'w-full h-10 px-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)] transition-shadow'
const inputStyle = { background: CARD, borderColor: BORDER } as const

const initials = (n: string) => n.split(' ').slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('')

interface FormState {
  name: string
  phone: string
  whatsapp: string
  birthday: string
  gender: '' | 'male' | 'female'
  language: string
  photo_url: string
  documents: Record<string, string>
  relatives: Relative[]
  payment_method: string
  payment_account_details: string
}

export function TeacherSettings() {
  const { t, locale } = useI18n()
  const { data: profile, isLoading } = useMyProfile()
  const update = useUpdateMyProfile()

  const [form, setForm] = useState<FormState | null>(null)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [docBusy, setDocBusy] = useState<string | null>(null)
  const photoInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!profile) return
    setForm({
      name: profile.name ?? '',
      phone: profile.phone ?? '',
      whatsapp: profile.whatsapp ?? '',
      birthday: profile.birthday ?? '',
      gender: (profile.gender ?? '') as FormState['gender'],
      language: profile.language ?? '',
      photo_url: profile.photo_url ?? '',
      documents: { ...(profile.documents ?? {}) },
      relatives: [...(profile.relatives ?? [])],
      payment_method: profile.payment_method ?? 'vodafone_cash',
      payment_account_details: profile.payment_account_details ?? '',
    })
  }, [profile])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm(f => (f ? { ...f, [key]: value } : f))

  async function onPhotoPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoBusy(true)
    try {
      const url = await uploadFile(file, 'photos')
      set('photo_url', url)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('teacher.settings.uploadFailed'))
    } finally {
      setPhotoBusy(false)
      if (photoInput.current) photoInput.current.value = ''
    }
  }

  async function onDocPick(key: string, file: File | undefined) {
    if (!file) return
    setDocBusy(key)
    try {
      const url = await uploadFile(file, 'documents')
      setForm(f => (f ? { ...f, documents: { ...f.documents, [key]: url } } : f))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('teacher.settings.uploadFailed'))
    } finally {
      setDocBusy(null)
    }
  }

  function addRelative() {
    setForm(f => (f ? { ...f, relatives: [...f.relatives, { name: '', relation: '', phone: '' }] } : f))
  }
  function setRelative(i: number, patch: Partial<Relative>) {
    setForm(f => (f ? { ...f, relatives: f.relatives.map((r, idx) => (idx === i ? { ...r, ...patch } : r)) } : f))
  }
  function removeRelative(i: number) {
    setForm(f => (f ? { ...f, relatives: f.relatives.filter((_, idx) => idx !== i) } : f))
  }

  async function onSave() {
    if (!form) return
    const payload: MyProfileUpdate = {
      name: form.name,
      phone: form.phone || null,
      whatsapp: form.whatsapp || null,
      birthday: form.birthday || null,
      gender: form.gender || null,
      language: form.language || null,
      photo_url: form.photo_url || null,
      documents: form.documents,
      relatives: form.relatives.filter(r => r.name.trim()),
      payment_method: form.payment_method,
      payment_account_details: form.payment_account_details || null,
    }
    try {
      await update.mutateAsync(payload)
      toast.success(t('teacher.settings.saved'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('teacher.settings.saveFailed'))
    }
  }

  if (isLoading || !form) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin" style={{ color: TEAL }} />
      </div>
    )
  }

  const memberSince = profile?.member_since
    ? new Date(profile.member_since).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—'

  return (
    <div>
      <PageHeader
        title={t('teacher.settings.title')}
        description={t('teacher.settings.description')}
        actions={
          <button
            onClick={onSave}
            disabled={update.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: NAVY }}
          >
            {update.isPending && <Loader2 size={14} className="animate-spin" />}
            {t('teacher.settings.save')}
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5">
        {/* LEFT: photo + account info */}
        <div className="space-y-5">
          <Card>
            <CardTitle icon={<User size={16} />}>{t('teacher.settings.profilePicture')}</CardTitle>
            <div className="flex flex-col items-center gap-4 pt-2">
              {form.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.photo_url} alt={form.name} className="w-28 h-28 rounded-full object-cover" style={{ border: `3px solid ${TEAL}` }} />
              ) : (
                <div className="w-28 h-28 rounded-full flex items-center justify-center text-3xl font-bold" style={{ background: 'rgb(14 124 90 / 0.12)', color: TEAL, border: `3px solid ${TEAL}` }}>
                  {initials(form.name || '?')}
                </div>
              )}
              <input ref={photoInput} type="file" accept="image/*" hidden onChange={onPhotoPick} />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => photoInput.current?.click()}
                  disabled={photoBusy}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors hover:bg-black/5 disabled:opacity-50"
                  style={{ borderColor: BORDER, color: NAVY }}
                >
                  {photoBusy ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                  {t('teacher.settings.uploadPhoto')}
                </button>
                {form.photo_url && (
                  <button
                    onClick={() => set('photo_url', '')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors hover:bg-red-50"
                    style={{ borderColor: BORDER, color: 'rgb(220 38 38)' }}
                  >
                    <Trash2 size={13} /> {t('teacher.settings.deletePhoto')}
                  </button>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <CardTitle icon={<ShieldCheck size={16} />}>{t('teacher.settings.accountInfo')}</CardTitle>
            <dl className="space-y-3 text-sm">
              <Row label={t('teacher.settings.accountStatus')}>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgb(14 124 90 / 0.10)', color: TEAL }}>
                  {profile?.status ?? '—'}
                </span>
              </Row>
              <Row label={t('teacher.settings.role')}>
                <span className="font-medium capitalize" style={{ color: NAVY }}>{profile?.role ?? '—'}</span>
              </Row>
              <Row label={t('teacher.settings.memberSince')}>
                <span className="font-medium" style={{ color: NAVY }}>{memberSince}</span>
              </Row>
            </dl>
          </Card>
        </div>

        {/* RIGHT: forms */}
        <div className="space-y-5">
          {/* Personal information */}
          <Card>
            <CardTitle icon={<User size={16} />}>{t('teacher.settings.personalInfo')}</CardTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t('teacher.settings.fullName')}>
                <input className={inputCls} style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} />
              </Field>
              <Field label={t('teacher.settings.email')} hint={t('teacher.settings.emailReadonly')}>
                <input className={inputCls} style={{ ...inputStyle, opacity: 0.6 }} value={profile?.email ?? ''} readOnly disabled />
              </Field>
              <Field label={t('teacher.settings.phone')}>
                <input className={inputCls} style={inputStyle} value={form.phone} onChange={e => set('phone', e.target.value)} />
              </Field>
              <Field label={t('teacher.settings.whatsapp')}>
                <input className={inputCls} style={inputStyle} value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} />
              </Field>
              <Field label={t('teacher.settings.birthday')}>
                <input type="date" className={inputCls} style={inputStyle} value={form.birthday} onChange={e => set('birthday', e.target.value)} />
              </Field>
              <Field label={t('teacher.settings.gender')}>
                <Select value={form.gender || 'none'} onValueChange={v => set('gender', (v === 'none' ? '' : v) as FormState['gender'])}>
                  <SelectTrigger className="w-full h-10 rounded-xl text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    <SelectItem value="male">{t('teacher.settings.genderMale')}</SelectItem>
                    <SelectItem value="female">{t('teacher.settings.genderFemale')}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t('teacher.settings.language')}>
                <Select value={form.language || 'none'} onValueChange={v => set('language', v === 'none' ? '' : v)}>
                  <SelectTrigger className="w-full h-10 rounded-xl text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </Card>

          {/* Documents */}
          <Card>
            <CardTitle icon={<FileText size={16} />}>{t('teacher.settings.documents')}</CardTitle>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {DOC_SLOTS.map(slot => {
                const url = form.documents[slot.key]
                return (
                  <div key={slot.key} className="rounded-xl border p-3 flex flex-col gap-2" style={{ borderColor: BORDER }}>
                    <span className="text-xs font-medium" style={{ color: MUTED }}>{t(slot.labelKey)}</span>
                    {url ? (
                      <div className="flex items-center justify-between gap-2">
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold truncate" style={{ color: TEAL }}>
                          {t('teacher.settings.viewFile')}
                        </a>
                        <button onClick={() => setForm(f => (f ? { ...f, documents: { ...f.documents, [slot.key]: '' } } : f))} className="shrink-0" style={{ color: 'rgb(220 38 38)' }}>
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold border cursor-pointer transition-colors hover:bg-black/5" style={{ borderColor: BORDER, color: NAVY }}>
                        {docBusy === slot.key ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                        {t('teacher.settings.upload')}
                        <input type="file" hidden onChange={e => onDocPick(slot.key, e.target.files?.[0])} />
                      </label>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Relatives */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <CardTitle icon={<UsersIcon size={16} />} noMargin>{t('teacher.settings.relatives')}</CardTitle>
              <button onClick={addRelative} className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: TEAL }}>
                <Plus size={14} /> {t('teacher.settings.addRelative')}
              </button>
            </div>
            {form.relatives.length === 0 ? (
              <p className="text-xs" style={{ color: MUTED }}>{t('teacher.settings.noRelatives')}</p>
            ) : (
              <div className="space-y-2">
                {form.relatives.map((r, i) => (
                  <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                    <input className={inputCls} style={inputStyle} placeholder={t('teacher.settings.relativeName')} value={r.name} onChange={e => setRelative(i, { name: e.target.value })} />
                    <input className={inputCls} style={inputStyle} placeholder={t('teacher.settings.relativeRelation')} value={r.relation ?? ''} onChange={e => setRelative(i, { relation: e.target.value })} />
                    <input className={inputCls} style={inputStyle} placeholder={t('teacher.settings.relativePhone')} value={r.phone ?? ''} onChange={e => setRelative(i, { phone: e.target.value })} />
                    <button onClick={() => removeRelative(i)} className="p-2 rounded-lg hover:bg-red-50 justify-self-start" style={{ color: 'rgb(220 38 38)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Payment information */}
          <Card>
            <CardTitle icon={<CreditCard size={16} />}>{t('teacher.settings.payment')}</CardTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t('teacher.settings.paymentMethod')}>
                <Select value={form.payment_method} onValueChange={v => set('payment_method', v)}>
                  <SelectTrigger className="w-full h-10 rounded-xl text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t('teacher.settings.paymentDetails')}>
                <input className={inputCls} style={inputStyle} value={form.payment_account_details} onChange={e => set('payment_account_details', e.target.value)} />
              </Field>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border p-5" style={{ background: CARD, borderColor: BORDER }}>{children}</div>
}

function CardTitle({ icon, children, noMargin }: { icon: React.ReactNode; children: React.ReactNode; noMargin?: boolean }) {
  return (
    <h3 className={`inline-flex items-center gap-2 text-sm font-bold ${noMargin ? '' : 'mb-4'}`} style={{ color: NAVY }}>
      <span style={{ color: TEAL }}>{icon}</span> {children}
    </h3>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium" style={{ color: MUTED }}>{label}{hint && <span className="opacity-60"> · {hint}</span>}</span>
      {children}
    </label>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <dt style={{ color: MUTED }}>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}
