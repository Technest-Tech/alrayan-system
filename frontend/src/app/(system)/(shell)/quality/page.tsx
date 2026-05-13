'use client'
import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { QualityLeaderboard } from '@/components/system/quality/QualityLeaderboard'
import { useQualityLeaderboard } from '@/hooks/system/useQualityLeaderboard'
import { api } from '@/lib/system/api'
import { useQueryClient } from '@tanstack/react-query'

export default function QualityPage() {
  const { data: entries, isLoading, error } = useQualityLeaderboard()
  const qc = useQueryClient()
  const [recomputing, setRecomputing] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  async function handleRecompute() {
    setRecomputing(true)
    try {
      await api<{ message: string }>('/quality/recompute', { method: 'POST' })
      await qc.invalidateQueries({ queryKey: ['system', 'quality'] })
      setToast('Quality scores recomputed successfully.')
    } catch {
      setToast('Failed to recompute. Please try again.')
    } finally {
      setRecomputing(false)
      setTimeout(() => setToast(null), 3000)
    }
  }

  return (
    <>
      <PageHeader
        title="Quality"
        description="Teacher quality scores and performance reviews."
        actions={
          <button
            onClick={handleRecompute}
            disabled={recomputing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={recomputing ? 'animate-spin' : ''} />
            Recompute scores
          </button>
        }
      />

      {toast && (
        <div className="mb-4 rounded-lg bg-gray-800 text-white text-sm px-4 py-2.5 shadow-lg">
          {toast}
        </div>
      )}

      {isLoading ? (
        <div className="py-20 text-center text-sm opacity-40">Loading...</div>
      ) : error ? (
        <div className="py-10 text-center text-sm text-red-500">{(error as Error).message}</div>
      ) : (
        <QualityLeaderboard entries={entries ?? []} />
      )}
    </>
  )
}
