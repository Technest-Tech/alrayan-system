'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { useIssueCertificate } from '@/hooks/system/useCertificates'
import { CERTIFICATE_TYPE_LABELS, type CertificateType } from '@/types/system/certificate'
import { api } from '@/lib/system/api'
import { useI18n } from '@/lib/system/i18n'

const CERTIFICATE_TYPE_KEYS: Record<CertificateType, string> = {
  course_completion: 'certificates.types.course_completion',
  hifz_milestone:    'certificates.types.hifz_milestone',
  ijazah:            'certificates.types.ijazah',
  other:             'certificates.types.other',
}

export default function NewCertificatePage() {
  const { t } = useI18n()
  const router = useRouter()
  const { mutateAsync, isPending } = useIssueCertificate()
  const [form, setForm] = useState({
    student_id:  '',
    teacher_id:  '',
    course_id:   '',
    type:        'hifz_milestone' as keyof typeof CERTIFICATE_TYPE_LABELS,
    title:       '',
    description: '',
    issued_on:   new Date().toISOString().slice(0, 10),
  })
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewing, setPreviewing] = useState(false)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function preview() {
    setPreviewing(true)
    try {
      const blob = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/system/certificates/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/pdf' },
        body: JSON.stringify({ ...form, student_id: Number(form.student_id) || null }),
        credentials: 'include',
      }).then(r => r.blob())
      setPreviewUrl(URL.createObjectURL(blob))
    } catch {}
    setPreviewing(false)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    await mutateAsync({
      ...form,
      student_id: Number(form.student_id),
      teacher_id: form.teacher_id ? Number(form.teacher_id) : null,
      course_id:  form.course_id  ? Number(form.course_id)  : null,
    })
    router.push('/certificates')
  }

  return (
    <>
      <PageHeader title={t('certificates.new.heading')} description={t('certificates.new.subheading')} />

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('certificates.new.studentId')}</label>
            <input required value={form.student_id} onChange={e => set('student_id', e.target.value)}
              placeholder={t('certificates.new.studentIdPlaceholder')}
              className="w-full rounded-xl border px-3 py-2 text-sm" style={{ borderColor: 'rgb(var(--border-default))' }} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('certificates.fields.type')}</label>
            <div className="space-y-1">
              {(Object.keys(CERTIFICATE_TYPE_LABELS) as Array<keyof typeof CERTIFICATE_TYPE_LABELS>).map(ct => (
                <label key={ct} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="type" value={ct} checked={form.type === ct} onChange={() => set('type', ct)} />
                  {t(CERTIFICATE_TYPE_KEYS[ct])}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('certificates.fields.title')}</label>
            <input required value={form.title} onChange={e => set('title', e.target.value)}
              placeholder={t('certificates.new.titlePlaceholder')}
              className="w-full rounded-xl border px-3 py-2 text-sm" style={{ borderColor: 'rgb(var(--border-default))' }} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('common.notes')}</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
              className="w-full rounded-xl border px-3 py-2 text-sm" style={{ borderColor: 'rgb(var(--border-default))' }} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('certificates.detail.issuedOn')}</label>
            <input type="date" value={form.issued_on} onChange={e => set('issued_on', e.target.value)}
              className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: 'rgb(var(--border-default))' }} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={preview} disabled={previewing}
              className="px-4 py-2 rounded-xl text-sm border" style={{ borderColor: 'rgb(var(--border-default))' }}>
              {previewing ? t('certificates.new.generating') : t('certificates.new.previewPdf')}
            </button>
            <button type="button" onClick={() => router.back()}
              className="px-4 py-2 rounded-xl text-sm border" style={{ borderColor: 'rgb(var(--border-default))' }}>
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={isPending}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white ml-auto"
              style={{ background: 'rgb(var(--accent))' }}>
              {isPending ? t('certificates.new.issuing') : t('certificates.new.issueSave')}
            </button>
          </div>
        </form>

        {/* PDF preview */}
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgb(var(--border-default))', minHeight: '400px', background: 'rgb(var(--surface-card-2))' }}>
          {previewUrl
            ? <iframe src={previewUrl} className="w-full h-full min-h-96" title={t('certificates.new.previewTitle')} />
            : <div className="flex items-center justify-center h-full text-sm opacity-40">{t('certificates.new.previewEmpty')}</div>
          }
        </div>
      </div>
    </>
  )
}
