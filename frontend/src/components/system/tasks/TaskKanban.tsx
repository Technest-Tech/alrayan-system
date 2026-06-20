'use client'
import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/system/api'
import { TASK_STATUSES, TASK_STATUS_DOT, type Task, type TaskStatus } from '@/types/system/task'
import { useI18n } from '@/lib/system/i18n'
import { TaskCard } from './TaskCard'
import { TASK_STATUS_KEYS } from './taskFields'

function SkeletonCard() {
  return (
    <div className="rounded-xl border p-3 space-y-2.5 bg-white" style={{ borderColor: 'rgb(229 233 240)' }}>
      <div className="h-3 w-3/4 rounded animate-pulse bg-gray-100" />
      <div className="h-2.5 w-1/2 rounded animate-pulse bg-gray-100" />
    </div>
  )
}

interface Props {
  tasks: Task[]
  isLoading: boolean
  canDecide: boolean
  onSelect: (id: number) => void
}

export function TaskKanban({ tasks, isLoading, canDecide, onSelect }: Props) {
  const { t } = useI18n()
  const qc = useQueryClient()
  const [dragId, setDragId]   = useState<number | null>(null)
  const [overCol, setOverCol] = useState<TaskStatus | null>(null)
  const fromStatus = useRef<TaskStatus | null>(null)

  const move = useMutation({
    mutationFn: ({ id, status }: { id: number; status: TaskStatus }) =>
      api(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'tasks'] }),
    onError:   () => toast.error(t('tasks.toastMoveFailed')),
  })

  const decide = useMutation({
    mutationFn: ({ id, action }: { id: number; action: 'approve' | 'reject' }) =>
      api(`/tasks/${id}/${action}`, { method: 'POST', body: JSON.stringify({}) }),
    onSuccess: (_d, v) => { toast.success(t(v.action === 'approve' ? 'tasks.toastApproved' : 'tasks.toastRejected')); qc.invalidateQueries({ queryKey: ['system', 'tasks'] }) },
    onError:   () => toast.error(t('tasks.toastActionFailed')),
  })

  function onDrop(status: TaskStatus) {
    const id = dragId
    setDragId(null); setOverCol(null)
    if (id !== null && fromStatus.current !== status) move.mutate({ id, status })
  }

  const grouped: Record<string, Task[]> = Object.fromEntries(TASK_STATUSES.map(s => [s, []]))
  tasks.forEach(task => { (grouped[task.status] ??= []).push(task) })

  return (
    <div className="overflow-x-auto pb-4" style={{ scrollbarWidth: 'thin' }}>
      <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
        {TASK_STATUSES.map(status => {
          const isOver = overCol === status
          const colTasks = grouped[status] ?? []
          const dot = TASK_STATUS_DOT[status]
          return (
            <div
              key={status}
              className="flex flex-col"
              style={{ width: 270 }}
              onDragOver={e => { e.preventDefault(); if (overCol !== status) setOverCol(status) }}
              onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverCol(null) }}
              onDrop={e => { e.preventDefault(); onDrop(status) }}
            >
              <div
                className="rounded-xl mb-2.5 px-3 py-2.5 flex items-center justify-between transition-all"
                style={{ background: `${dot}12`, border: `1.5px solid ${isOver ? dot + '55' : 'transparent'}` }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: dot }} />
                  <span className="text-xs font-semibold" style={{ color: '#0B1F3A' }}>{t(TASK_STATUS_KEYS[status])}</span>
                </div>
                <span className="text-xs font-bold tabular-nums px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.85)', color: dot }}>
                  {colTasks.length}
                </span>
              </div>

              <div
                className="flex-1 space-y-2 rounded-xl transition-all"
                style={{
                  minHeight: 64,
                  padding: isOver ? '6px' : '2px',
                  background: isOver ? `${dot}08` : 'transparent',
                  outline: isOver ? `2px dashed ${dot}55` : 'none',
                  outlineOffset: -2,
                }}
              >
                {isLoading ? (
                  <><SkeletonCard /><SkeletonCard /></>
                ) : colTasks.length === 0 ? (
                  <div className="h-16 rounded-xl flex items-center justify-center text-[11px]" style={{ border: '1.5px dashed rgb(229 233 240)', color: 'rgb(203 211 222)' }}>
                    {isOver ? t('tasks.releaseToMove') : t('tasks.noTasks')}
                  </div>
                ) : (
                  colTasks.map(task => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={e => { setDragId(task.id); fromStatus.current = task.status; e.dataTransfer.effectAllowed = 'move' }}
                      onDragEnd={() => { setDragId(null); setOverCol(null) }}
                      className="cursor-grab active:cursor-grabbing"
                    >
                      <TaskCard
                        task={task}
                        dragging={dragId === task.id}
                        canDecide={canDecide}
                        deciding={decide.isPending}
                        onClick={() => onSelect(task.id)}
                        onApprove={() => decide.mutate({ id: task.id, action: 'approve' })}
                        onReject={() => decide.mutate({ id: task.id, action: 'reject' })}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
