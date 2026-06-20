'use client'
import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { QualityLeaderboard } from '@/components/system/quality/QualityLeaderboard'
import { useQualityLeaderboard } from '@/hooks/system/useQualityLeaderboard'
import { api } from '@/lib/system/api'
import { useI18n } from '@/lib/system/i18n'
import { useQueryClient } from '@tanstack/react-query'

export default function QualityPage() {
  const { t } = useI18n()
  const { data: entries, isLoading, error } = useQualityLeaderboard()
  const qc = useQueryClient()
  const [recomputing, setRecomputing] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  async function handleRecompute() {
    setRecomputing(true)
    try {
      await api<{ message: string }>('/quality/recompute', { method: 'POST' })
      await qc.invalidateQueries({ queryKey: ['system', 'quality'] })
      setToast(t('quality.recomputeSuccess'))
    } catch {
      setToast(t('quality.recomputeError'))
    } finally {
      setRecomputing(false)
      setTimeout(() => setToast(null), 3000)
    }
  }

  return (
    <>
      <PageHeader
        title={t('quality.title')}
        description={t('quality.description')}
        actions={
          <button
            onClick={handleRecompute}
            disabled={recomputing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={recomputing ? 'animate-spin' : ''} />
            {t('quality.recompute')}
          </button>
        }
      />

      {toast && (
        <div className="mb-4 rounded-lg bg-gray-800 text-white text-sm px-4 py-2.5 shadow-lg">
          {toast}
        </div>
      )}

      {isLoading ? (
        <div className="py-20 text-center text-sm opacity-40">{t('common.loading')}</div>
      ) : error ? (
        <div className="py-10 text-center text-sm text-red-500">{(error as Error).message}</div>
      ) : (
        <QualityLeaderboard entries={entries ?? []} />
      )}
    </>
  )
}
