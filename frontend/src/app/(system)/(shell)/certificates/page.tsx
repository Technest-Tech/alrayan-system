'use client'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { useCertificates } from '@/hooks/system/useCertificates'
import { CERTIFICATE_TYPE_LABELS } from '@/types/system/certificate'

export default function CertificatesPage() {
  const { data, isLoading } = useCertificates()
  const certs = data?.data ?? []

  return (
    <>
      <PageHeader title="Certificates" description="Issue and manage student certificates.">
        <Link href="/certificates/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
          style={{ background: 'rgb(var(--accent))' }}>
          <Plus size={16} />
          Issue certificate
        </Link>
      </PageHeader>

      <div className="mt-6 rounded-2xl overflow-hidden" style={{ border: '1px solid rgb(var(--border-default))' }}>
        <table className="w-full text-sm">
          <thead style={{ background: 'rgb(var(--surface-card-2))' }}>
            <tr>
              <th className="px-4 py-3 text-left font-medium">Number</th>
              <th className="px-4 py-3 text-left font-medium">Student</th>
              <th className="px-4 py-3 text-left font-medium">Type</th>
              <th className="px-4 py-3 text-left font-medium">Title</th>
              <th className="px-4 py-3 text-left font-medium">Issued</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} style={{ borderTop: '1px solid rgb(var(--border-default))' }}>
                {[1,2,3,4,5,6].map(j => <td key={j} className="px-4 py-3"><div className="h-4 animate-pulse rounded" style={{ background: 'rgb(var(--surface-card-2))' }} /></td>)}
              </tr>
            ))}
            {certs.map(c => (
              <tr key={c.id} className="cursor-pointer hover:bg-black/[0.02]" style={{ borderTop: '1px solid rgb(var(--border-default))' }}>
                <td className="px-4 py-3">
                  <Link href={`/certificates/${c.id}`} className="font-mono text-xs">{c.certificate_number}</Link>
                </td>
                <td className="px-4 py-3">{c.student?.name ?? '—'}</td>
                <td className="px-4 py-3">{CERTIFICATE_TYPE_LABELS[c.type]}</td>
                <td className="px-4 py-3 max-w-xs truncate">{c.title}</td>
                <td className="px-4 py-3 whitespace-nowrap">{c.issued_on}</td>
                <td className="px-4 py-3">
                  {c.is_revoked
                    ? <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">Revoked</span>
                    : <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">Active</span>}
                </td>
              </tr>
            ))}
            {!isLoading && certs.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center opacity-40">No certificates issued yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
