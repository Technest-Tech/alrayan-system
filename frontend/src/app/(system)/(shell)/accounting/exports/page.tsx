'use client'
import { useState } from 'react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { useExportKinds, useQueueExport } from '@/hooks/system/useExports'
import { useI18n } from '@/lib/system/i18n'

export default function ExportsPage() {
  const { t } = useI18n()
  const { data: kinds, isLoading } = useExportKinds()
  const { mutate: queue, isPending } = useQueueExport()
  const [queued, setQueued] = useState<Set<string>>(new Set())

  function request(kind: string) {
    queue({ kind }, {
      onSuccess: () => setQueued(prev => new Set([...prev, kind])),
    })
  }

  return (
    <>
      <PageHeader
        title={t('accounting.exports.title')}
        description={t('accounting.exports.subtitle')}
      />

      <div className="mt-6 max-w-lg space-y-2">
        {isLoading && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-2xl" style={{ background: 'rgb(var(--surface-card-2))' }} />
        ))}

        {kinds?.map(k => (
          <div key={k.kind}
            className="flex items-center justify-between rounded-2xl px-5 py-4"
            style={{ background: 'rgb(var(--surface-card))', border: '1px solid rgb(var(--border-default))' }}>
            <span className="text-sm font-medium">{k.label}</span>
            {queued.has(k.kind) ? (
              <span className="text-xs text-green-600">{t('accounting.exports.queued')}</span>
            ) : (
              <button
                onClick={() => request(k.kind)}
                disabled={isPending}
                className="px-3 py-1.5 text-sm rounded-lg border disabled:opacity-40"
                style={{ borderColor: 'rgb(var(--border-default))' }}>
                {t('accounting.exports.export')}
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
