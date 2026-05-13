'use client'
import { use } from 'react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { useCertificate, useRevokeCertificate } from '@/hooks/system/useCertificates'
import { CERTIFICATE_TYPE_LABELS } from '@/types/system/certificate'

export default function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: cert, isLoading } = useCertificate(id)
  const { mutate: revoke, isPending } = useRevokeCertificate(id)

  if (isLoading) return <p className="mt-8 opacity-40 text-sm">Loading…</p>
  if (!cert) return <p className="mt-8 opacity-40 text-sm">Not found.</p>

  return (
    <>
      <PageHeader title={cert.title} description={cert.certificate_number} />

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
        {[
          ['Type',      CERTIFICATE_TYPE_LABELS[cert.type]],
          ['Student',   cert.student?.name ?? '—'],
          ['Teacher',   cert.teacher?.name ?? '—'],
          ['Course',    cert.course?.name  ?? '—'],
          ['Issued on', cert.issued_on],
          ['Issued by', cert.issued_by ?? 'System'],
          ['Status',    cert.is_revoked ? 'Revoked' : 'Active'],
        ].map(([label, value]) => (
          <div key={label}>
            <div className="text-xs opacity-40 mb-0.5">{label}</div>
            <div className="text-sm">{value}</div>
          </div>
        ))}
      </div>

      {cert.description && (
        <div className="mt-4 max-w-2xl">
          <div className="text-xs opacity-40 mb-0.5">Description</div>
          <p className="text-sm">{cert.description}</p>
        </div>
      )}

      <div className="flex gap-3 mt-8">
        <a href={`/api/system/certificates/${cert.id}/pdf`} target="_blank" rel="noopener noreferrer"
          className="px-4 py-2 rounded-xl text-sm border" style={{ borderColor: 'rgb(var(--border-default))' }}>
          Download PDF
        </a>
        {!cert.is_revoked && (
          <button onClick={() => confirm('Revoke this certificate?') && revoke()} disabled={isPending}
            className="px-4 py-2 rounded-xl text-sm text-red-600 border border-red-200 hover:bg-red-50 transition-colors">
            {isPending ? 'Revoking…' : 'Revoke'}
          </button>
        )}
      </div>
    </>
  )
}
