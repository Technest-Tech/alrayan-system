'use client'
import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { api } from '@/lib/system/api'

interface BackupStatus {
  last_backup_at: string | null
  size_bytes: number | null
  file: string | null
}

export default function BackupsPage() {
  const [ran, setRan] = useState(false)
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['system', 'backups'],
    queryFn: () => api<{ data: BackupStatus }>('/backups').then(r => r.data),
    staleTime: 30_000,
  })
  const { mutate: runBackup, isPending } = useMutation({
    mutationFn: () => api('/backups', { method: 'POST' }),
    onSuccess: () => {
      setRan(true)
      setTimeout(() => { setRan(false); refetch() }, 5000)
    },
  })

  const formatBytes = (b: number) =>
    b > 1_000_000 ? `${(b / 1_000_000).toFixed(1)} MB` : `${(b / 1_000).toFixed(0)} KB`

  return (
    <>
      <PageHeader title="Backups" description="Database backup management." />

      <div className="mt-6 max-w-md rounded-2xl p-6 space-y-4"
        style={{ background: 'rgb(var(--surface-card))', border: '1px solid rgb(var(--border-default))' }}>

        {isLoading ? (
          <div className="h-4 w-48 animate-pulse rounded" style={{ background: 'rgb(var(--surface-card-2))' }} />
        ) : (
          <>
            <div>
              <div className="text-xs opacity-40 mb-0.5">Last backup</div>
              <div className="text-sm font-medium">
                {data?.last_backup_at
                  ? new Date(data.last_backup_at).toLocaleString()
                  : <span className="opacity-40">Never</span>
                }
              </div>
            </div>
            {data?.size_bytes != null && (
              <div>
                <div className="text-xs opacity-40 mb-0.5">Size</div>
                <div className="text-sm">{formatBytes(data.size_bytes)}</div>
              </div>
            )}
            {data?.file && (
              <div>
                <div className="text-xs opacity-40 mb-0.5">File</div>
                <div className="text-sm font-mono text-xs opacity-60 break-all">{data.file}</div>
              </div>
            )}
          </>
        )}

        <div className="pt-2 flex items-center gap-3">
          <button onClick={() => runBackup()} disabled={isPending || ran}
            className="px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-40"
            style={{ background: 'rgb(var(--accent))' }}>
            {isPending ? 'Starting…' : ran ? 'Backup queued' : 'Run backup now'}
          </button>
          {ran && <span className="text-xs text-green-600">Backup queued — this may take a minute.</span>}
        </div>
      </div>
    </>
  )
}
