'use client'
import { use } from 'react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { useCertificate, useRevokeCertificate } from '@/hooks/system/useCertificates'
import { CERTIFICATE_TYPE_LABELS, type CertificateType } from '@/types/system/certificate'
import { useI18n } from '@/lib/system/i18n'

const CERTIFICATE_TYPE_KEYS: Record<CertificateType, string> = {
  course_completion: 'certificates.types.course_completion',
  hifz_milestone:    'certificates.types.hifz_milestone',
  ijazah:            'certificates.types.ijazah',
  other:             'certificates.types.other',
}

export default function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useI18n()
  const { id } = use(params)
  const { data: cert, isLoading } = useCertificate(id)
  const { mutate: revoke, isPending } = useRevokeCertificate(id)

  if (isLoading) return <p className="mt-8 opacity-40 text-sm">{t('common.loading')}</p>
  if (!cert) return <p className="mt-8 opacity-40 text-sm">{t('certificates.detail.notFound')}</p>

  return (
    <>
      <PageHeader title={cert.title} description={cert.certificate_number} />

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
        {[
          [t('certificates.fields.type'),    t(CERTIFICATE_TYPE_KEYS[cert.type])],
          [t('certificates.detail.student'), cert.student?.name ?? '—'],
          [t('common.teacher'),              cert.teacher?.name ?? '—'],
          [t('common.course'),               cert.course?.name  ?? '—'],
          [t('certificates.detail.issuedOn'), cert.issued_on],
          [t('certificates.detail.issuedBy'), cert.issued_by ?? t('certificates.detail.system')],
          [t('common.status'),               cert.is_revoked ? t('certificates.status.revoked') : t('status.active')],
        ].map(([label, value]) => (
          <div key={label}>
            <div className="text-xs opacity-40 mb-0.5">{label}</div>
            <div className="text-sm">{value}</div>
          </div>
        ))}
      </div>

      {cert.description && (
        <div className="mt-4 max-w-2xl">
          <div className="text-xs opacity-40 mb-0.5">{t('common.notes')}</div>
          <p className="text-sm">{cert.description}</p>
        </div>
      )}

      <div className="flex gap-3 mt-8">
        <a href={`/api/system/certificates/${cert.id}/pdf`} target="_blank" rel="noopener noreferrer"
          className="px-4 py-2 rounded-xl text-sm border" style={{ borderColor: 'rgb(var(--border-default))' }}>
          {t('certificates.builder.downloadPdf')}
        </a>
        {!cert.is_revoked && (
          <button onClick={() => confirm(t('certificates.detail.revokeConfirm')) && revoke()} disabled={isPending}
            className="px-4 py-2 rounded-xl text-sm text-red-600 border border-red-200 hover:bg-red-50 transition-colors">
            {isPending ? t('certificates.detail.revoking') : t('certificates.detail.revoke')}
          </button>
        )}
      </div>
    </>
  )
}
