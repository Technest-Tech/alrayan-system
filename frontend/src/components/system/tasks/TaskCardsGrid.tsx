'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/system/api'
import type { Task } from '@/types/system/task'
import { useI18n } from '@/lib/system/i18n'
import { TaskCard } from './TaskCard'

interface Props {
  tasks: Task[]
  isLoading: boolean
  canDecide: boolean
  onSelect: (id: number) => void
}

export function TaskCardsGrid({ tasks, isLoading, canDecide, onSelect }: Props) {
  const { t } = useI18n()
  const qc = useQueryClient()
  const decide = useMutation({
    mutationFn: ({ id, action }: { id: number; action: 'approve' | 'reject' }) =>
      api(`/tasks/${id}/${action}`, { method: 'POST', body: JSON.stringify({}) }),
    onSuccess: (_d, v) => { toast.success(t(v.action === 'approve' ? 'tasks.toastApproved' : 'tasks.toastRejected')); qc.invalidateQueries({ queryKey: ['system', 'tasks'] }) },
    onError:   () => toast.error(t('tasks.toastActionFailed')),
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="rounded-xl border p-4 h-32 animate-pulse bg-gray-50" style={{ borderColor: 'rgb(229 233 240)' }} />
        ))}
      </div>
    )
  }

  if (tasks.length === 0) {
    return <div className="text-center text-sm py-16" style={{ color: 'rgb(160 168 178)' }}>{t('tasks.emptyFiltered')}</div>
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {tasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          canDecide={canDecide}
          deciding={decide.isPending}
          onClick={() => onSelect(task.id)}
          onApprove={() => decide.mutate({ id: task.id, action: 'approve' })}
          onReject={() => decide.mutate({ id: task.id, action: 'reject' })}
        />
      ))}
    </div>
  )
}
