'use client'
import { formatDistanceToNow } from 'date-fns'
import { CalendarClock, Check, X, User } from 'lucide-react'
import {
  taskTypeMeta, TASK_PRIORITY_COLORS, type Task, type TaskPriority,
} from '@/types/system/task'
import { useI18n } from '@/lib/system/i18n'
import { taskFields, taskTypeKey, TASK_PRIORITY_KEYS, TASK_ROLE_KEYS } from './taskFields'

interface Props {
  task: Task
  dragging?: boolean
  canDecide?: boolean
  deciding?: boolean
  onClick?: () => void
  onApprove?: () => void
  onReject?: () => void
}

export function TaskCard({ task, dragging, canDecide, deciding, onClick, onApprove, onReject }: Props) {
  const { t } = useI18n()
  const meta = taskTypeMeta(task.type)
  const Icon = meta.icon
  const typeKey = taskTypeKey(task.type)
  const typeLabel = typeKey ? t(typeKey) : meta.label
  const fields = taskFields(task).slice(0, 4)
  const priority = TASK_PRIORITY_COLORS[task.priority as TaskPriority] ?? TASK_PRIORITY_COLORS.medium
  const showActions = canDecide && task.actionable && !task.decision

  return (
    <div
      onClick={onClick}
      className="rounded-xl border bg-white overflow-hidden transition-all hover:shadow-md"
      style={{
        borderColor: 'rgb(229 233 240)',
        borderLeft: `3px solid ${meta.accent}`,
        opacity: dragging ? 0.4 : 1,
        boxShadow: '0 1px 3px rgb(11 31 58 / 0.05)',
      }}
    >
      {/* Type strip */}
      <div
        className="flex items-center gap-1.5 px-3 py-1.5"
        style={{ background: `${meta.accent}0F` }}
      >
        <Icon size={12} style={{ color: meta.accent }} />
        <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: meta.accent }}>
          {typeLabel}
        </span>
        {task.decision && (
          <span
            className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
            style={task.decision === 'approved'
              ? { background: 'rgb(14 124 90 / 0.14)', color: 'rgb(14 124 90)' }
              : { background: 'rgb(220 60 40 / 0.14)', color: 'rgb(180 40 20)' }}
          >
            {t(task.decision === 'approved' ? 'status.approved' : 'status.rejected')}
          </span>
        )}
      </div>

      <div className="px-3 py-2.5">
        <p className="text-sm font-semibold leading-tight truncate" style={{ color: 'rgb(11 31 58)' }}>
          {task.title}
        </p>

        {/* Fields */}
        {fields.length > 0 && (
          <div className="mt-1.5 space-y-0.5">
            {fields.map(f => (
              <div key={f.labelKey} className="flex items-center gap-1.5 text-[11px]" style={{ color: 'rgb(90 100 112)' }}>
                <span className="opacity-70">{t(f.labelKey)}:</span>
                <span className="font-medium truncate" style={{ color: 'rgb(40 50 65)' }}>{f.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Footer: priority + due */}
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={priority}>
            {TASK_PRIORITY_KEYS[task.priority as TaskPriority] ? t(TASK_PRIORITY_KEYS[task.priority as TaskPriority]) : task.priority}
          </span>
          {task.due_at && (
            <span className="inline-flex items-center gap-1 text-[10px]" style={{ color: 'rgb(90 100 112)' }}>
              <CalendarClock size={10} />
              {formatDistanceToNow(new Date(task.due_at), { addSuffix: true })}
            </span>
          )}
        </div>

        {task.assignee_role && (
          <div className="mt-1.5 inline-flex items-center gap-1 text-[10px]" style={{ color: 'rgb(120 130 142)' }}>
            <User size={9} />
            <span className="uppercase tracking-wide">
              {TASK_ROLE_KEYS[task.assignee_role] ? t(TASK_ROLE_KEYS[task.assignee_role]) : task.assignee_role}
            </span>
          </div>
        )}

        {/* Inline approve / reject */}
        {showActions && (
          <div className="mt-2.5 flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <button
              onClick={onApprove}
              disabled={deciding}
              className="flex-1 inline-flex items-center justify-center gap-1 text-[11px] font-semibold py-1.5 rounded-lg border transition-colors disabled:opacity-50"
              style={{ borderColor: 'rgb(14 124 90 / 0.3)', color: 'rgb(14 124 90)', background: 'rgb(14 124 90 / 0.06)' }}
            >
              <Check size={11} /> {t('common.approve')}
            </button>
            <button
              onClick={onReject}
              disabled={deciding}
              className="flex-1 inline-flex items-center justify-center gap-1 text-[11px] font-semibold py-1.5 rounded-lg border transition-colors disabled:opacity-50"
              style={{ borderColor: 'rgb(220 60 40 / 0.3)', color: 'rgb(180 40 20)', background: 'rgb(220 60 40 / 0.05)' }}
            >
              <X size={11} /> {t('common.reject')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
