'use client'
import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { X, Check, Clock, Send } from 'lucide-react'
import { useTask, useUpdateTask, useDecideTask, usePostponeTask, useAddTaskNote } from '@/hooks/system/useTasks'
import {
  taskTypeMeta, TASK_STATUSES, TASK_PRIORITY_COLORS,
  type TaskPriority, type TaskStatus,
} from '@/types/system/task'
import { useI18n } from '@/lib/system/i18n'
import { taskFields, taskTypeKey, TASK_STATUS_KEYS, TASK_PRIORITY_KEYS, TASK_ROLE_KEYS } from './taskFields'

interface Props {
  taskId: number | null
  canDecide?: boolean
  onClose: () => void
}

export function TaskDetailPanel({ taskId, canDecide, onClose }: Props) {
  const { t } = useI18n()
  const { data: task, isLoading } = useTask(taskId)
  const update   = useUpdateTask(taskId ?? 0)
  const decide   = useDecideTask(taskId ?? 0)
  const postpone = usePostponeTask(taskId ?? 0)
  const addNote  = useAddTaskNote(taskId ?? 0)
  const [noteDraft, setNoteDraft] = useState('')

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    if (taskId) {
      document.addEventListener('keydown', onKey)
      return () => document.removeEventListener('keydown', onKey)
    }
  }, [taskId, onClose])

  if (!taskId) return null

  const meta      = task ? taskTypeMeta(task.type) : null
  const Icon      = meta?.icon
  const typeKey   = task ? taskTypeKey(task.type) : null
  const typeLabel = typeKey ? t(typeKey) : meta?.label
  const priority = task ? (TASK_PRIORITY_COLORS[task.priority as TaskPriority] ?? TASK_PRIORITY_COLORS.medium) : null
  const fields   = task ? taskFields(task) : []
  const canAct   = canDecide && task?.actionable && !task?.decision

  function changeStatus(status: string) {
    update.mutate({ status }, { onError: () => toast.error(t('tasks.toastStatusFailed')) })
  }
  function changePriority(p: string) {
    update.mutate({ priority: p }, { onError: () => toast.error(t('tasks.toastPriorityFailed')) })
  }
  function runDecision(decision: 'approve' | 'reject') {
    decide.mutate({ decision, notes: noteDraft || undefined }, {
      onSuccess: () => { toast.success(t(decision === 'approve' ? 'tasks.toastApproved' : 'tasks.toastRejected')); setNoteDraft('') },
      onError:   () => toast.error(t(decision === 'approve' ? 'tasks.toastApproveFailed' : 'tasks.toastRejectFailed')),
    })
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-[#0B1F3A]/40 backdrop-blur-sm" onClick={onClose} />

      <div
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 flex flex-col rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: 'rgb(244 246 250)', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="shrink-0" style={{ background: 'linear-gradient(135deg, #0d2548 0%, #0B1F3A 65%, #071528 100%)' }}>
          <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, #C9A24B, transparent)' }} />
          <div className="px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                {meta && Icon && (
                  <div className="inline-flex items-center gap-1.5 mb-1.5 px-2 py-0.5 rounded-md" style={{ background: `${meta.accent}22` }}>
                    <Icon size={11} style={{ color: '#fff' }} />
                    <span className="text-[10px] font-bold uppercase tracking-wide text-white/90">{typeLabel}</span>
                  </div>
                )}
                <h2 className="font-bold text-white leading-tight truncate" style={{ fontSize: '1.1rem' }}>
                  {isLoading ? t('common.loading') : task?.title}
                </h2>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg shrink-0" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
                <X size={15} />
              </button>
            </div>

            {task && (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <select
                  value={task.status}
                  onChange={e => changeStatus(e.target.value)}
                  className="text-xs font-semibold px-2.5 py-1 rounded-full border outline-none cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }}
                >
                  {TASK_STATUSES.map(s => (
                    <option key={s} value={s} style={{ color: '#000' }}>{t(TASK_STATUS_KEYS[s as TaskStatus])}</option>
                  ))}
                </select>
                {priority && (
                  <select
                    value={task.priority}
                    onChange={e => changePriority(e.target.value)}
                    className="text-xs font-semibold px-2.5 py-1 rounded-full outline-none cursor-pointer border-0"
                    style={priority}
                  >
                    {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map(pr => (
                      <option key={pr} value={pr}>{t(TASK_PRIORITY_KEYS[pr])}</option>
                    ))}
                  </select>
                )}
                {task.decision && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase"
                    style={task.decision === 'approved'
                      ? { background: 'rgb(14 124 90 / 0.3)', color: '#fff' }
                      : { background: 'rgb(220 60 40 / 0.3)', color: '#fff' }}>
                    {t(task.decision === 'approved' ? 'status.approved' : 'status.rejected')}
                  </span>
                )}
              </div>
            )}
          </div>
          <div style={{ height: 1.5, background: 'linear-gradient(90deg, transparent, #C9A24B66, transparent)' }} />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading || !task ? (
            <div className="rounded-xl border bg-white p-4 space-y-3" style={{ borderColor: 'rgb(229 233 240)' }}>
              <div className="h-3 w-1/3 rounded animate-pulse bg-gray-100" />
              <div className="h-3 w-2/3 rounded animate-pulse bg-gray-100" />
              <div className="h-3 w-1/2 rounded animate-pulse bg-gray-100" />
            </div>
          ) : (
            <>
              {/* Details */}
              <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: 'rgb(229 233 240)' }}>
                <div style={{ height: 1.5, background: 'linear-gradient(90deg, transparent, #C9A24B44, transparent)' }} />
                <div className="p-4">
                  {task.student_name && <Row label={t('tasks.rowStudent')} value={task.student_name} />}
                  {task.teacher_name && <Row label={t('common.teacher')} value={task.teacher_name} />}
                  {fields.map(f => <Row key={f.labelKey} label={t(f.labelKey)} value={f.value} />)}
                  {task.assignee_role && <Row label={t('tasks.rowAssignedRole')} value={TASK_ROLE_KEYS[task.assignee_role] ? t(TASK_ROLE_KEYS[task.assignee_role]) : task.assignee_role.toUpperCase()} />}
                  {task.created_by_name && <Row label={t('tasks.rowCreatedBy')} value={task.created_by_name} />}
                  <Row label={t('tasks.rowCreated')} value={formatDistanceToNow(new Date(task.created_at), { addSuffix: true })} />
                  {task.decided_by_name && (
                    <Row label={t('tasks.rowDecidedBy')} value={`${task.decided_by_name}${task.decided_at ? ' · ' + formatDistanceToNow(new Date(task.decided_at), { addSuffix: true }) : ''}`} />
                  )}
                  {task.decision_notes && <Row label={t('tasks.rowDecisionNotes')} value={task.decision_notes} />}
                </div>
              </div>

              {/* Body text */}
              {task.body && task.type === 'manual_task' && (
                <div className="rounded-xl border bg-white p-4 text-sm" style={{ borderColor: 'rgb(229 233 240)', color: 'rgb(11 31 58)' }}>
                  {task.body}
                </div>
              )}

              {/* Notes thread */}
              <div className="rounded-xl border bg-white p-4" style={{ borderColor: 'rgb(229 233 240)' }}>
                <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'rgb(90 100 112)' }}>{t('common.notes')}</p>
                {task.notes && task.notes.length > 0 ? (
                  <div className="space-y-2 mb-3">
                    {task.notes.map(n => (
                      <div key={n.id} className="text-xs" style={{ color: 'rgb(40 50 65)' }}>
                        <span className="font-semibold">{n.actor_name ?? t('tasks.someone')}</span>
                        <span className="opacity-60"> · {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</span>
                        <p className="mt-0.5">{n.body}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs mb-3" style={{ color: 'rgb(160 168 178)' }}>{t('tasks.noNotesYet')}</p>
                )}
                <div className="flex items-center gap-2">
                  <input
                    value={noteDraft}
                    onChange={e => setNoteDraft(e.target.value)}
                    placeholder={t('tasks.addNotePlaceholder')}
                    className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border outline-none focus:ring-2 focus:ring-[#0E7C5A]/20"
                    style={{ borderColor: 'rgb(229 233 240)' }}
                  />
                  <button
                    onClick={() => { if (noteDraft.trim()) addNote.mutate(noteDraft.trim(), { onSuccess: () => setNoteDraft('') }) }}
                    disabled={!noteDraft.trim() || addNote.isPending}
                    className="p-1.5 rounded-lg disabled:opacity-40"
                    style={{ background: 'rgb(14 124 90 / 0.1)', color: 'rgb(14 124 90)' }}
                  >
                    <Send size={13} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer actions */}
        {task && !isLoading && (
          <div className="shrink-0 border-t bg-white px-4 py-3 flex items-center gap-2" style={{ borderColor: 'rgb(229 233 240)' }}>
            <button
              onClick={() => postpone.mutate({}, { onSuccess: () => toast.success(t('tasks.toastPostponed')) })}
              disabled={postpone.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-50"
              style={{ borderColor: 'rgb(229 233 240)', color: 'rgb(90 100 112)' }}
            >
              <Clock size={13} /> {t('tasks.postpone')}
            </button>
            <div className="flex-1" />
            {canAct ? (
              <>
                <button
                  onClick={() => runDecision('reject')}
                  disabled={decide.isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white transition-colors disabled:opacity-50"
                  style={{ background: 'rgb(192 57 43)' }}
                >
                  <X size={13} /> {t('common.reject')}
                </button>
                <button
                  onClick={() => runDecision('approve')}
                  disabled={decide.isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white transition-colors disabled:opacity-50"
                  style={{ background: 'rgb(14 124 90)' }}
                >
                  <Check size={13} /> {t('common.approve')}
                </button>
              </>
            ) : (
              <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs font-semibold text-white" style={{ background: '#0B1F3A' }}>
                {t('tasks.close')}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b last:border-0" style={{ borderColor: 'rgb(229 233 240)' }}>
      <p className="text-[10px] uppercase tracking-wide font-medium w-28 shrink-0 pt-0.5" style={{ color: 'rgb(90 100 112)' }}>{label}</p>
      <p className="text-sm font-medium leading-snug flex-1" style={{ color: 'rgb(11 31 58)' }}>{value}</p>
    </div>
  )
}
