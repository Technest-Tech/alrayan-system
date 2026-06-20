'use client'
import { formatDistanceToNow } from 'date-fns'
import {
  taskTypeMeta, TASK_PRIORITY_COLORS,
  type Task, type TaskPriority, type TaskStatus,
} from '@/types/system/task'
import { useI18n } from '@/lib/system/i18n'
import { taskTypeKey, TASK_STATUS_KEYS, TASK_PRIORITY_KEYS, TASK_ROLE_KEYS } from './taskFields'

interface Props {
  tasks: Task[]
  isLoading: boolean
  onSelect: (id: number) => void
}

export function TaskList({ tasks, isLoading, onSelect }: Props) {
  const { t } = useI18n()
  if (isLoading) {
    return <div className="rounded-xl border p-8 text-center text-sm bg-white" style={{ borderColor: 'rgb(229 233 240)', color: 'rgb(160 168 178)' }}>{t('common.loading')}</div>
  }
  if (tasks.length === 0) {
    return <div className="rounded-xl border p-12 text-center text-sm bg-white" style={{ borderColor: 'rgb(229 233 240)', color: 'rgb(160 168 178)' }}>{t('tasks.emptyFiltered')}</div>
  }

  return (
    <div className="rounded-xl border overflow-hidden bg-white" style={{ borderColor: 'rgb(229 233 240)' }}>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-wide" style={{ color: 'rgb(90 100 112)', background: 'rgb(248 250 252)' }}>
            <th className="px-4 py-2.5 font-semibold">{t('tasks.columnType')}</th>
            <th className="px-4 py-2.5 font-semibold">{t('tasks.columnTitle')}</th>
            <th className="px-4 py-2.5 font-semibold">{t('common.status')}</th>
            <th className="px-4 py-2.5 font-semibold">{t('tasks.columnPriority')}</th>
            <th className="px-4 py-2.5 font-semibold">{t('common.role')}</th>
            <th className="px-4 py-2.5 font-semibold">{t('tasks.columnDue')}</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map(task => {
            const meta = taskTypeMeta(task.type)
            const Icon = meta.icon
            const typeKey = taskTypeKey(task.type)
            const pr = TASK_PRIORITY_COLORS[task.priority as TaskPriority] ?? TASK_PRIORITY_COLORS.medium
            return (
              <tr
                key={task.id}
                onClick={() => onSelect(task.id)}
                className="border-t cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ borderColor: 'rgb(237 240 245)' }}
              >
                <td className="px-4 py-2.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: meta.accent }}>
                    <Icon size={13} /> {typeKey ? t(typeKey) : meta.label}
                  </span>
                </td>
                <td className="px-4 py-2.5 font-medium" style={{ color: 'rgb(11 31 58)' }}>{task.title}</td>
                <td className="px-4 py-2.5 text-xs" style={{ color: 'rgb(90 100 112)' }}>{t(TASK_STATUS_KEYS[task.status as TaskStatus])}</td>
                <td className="px-4 py-2.5">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={pr}>
                    {TASK_PRIORITY_KEYS[task.priority as TaskPriority] ? t(TASK_PRIORITY_KEYS[task.priority as TaskPriority]) : task.priority}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-xs uppercase" style={{ color: 'rgb(120 130 142)' }}>
                  {task.assignee_role ? (TASK_ROLE_KEYS[task.assignee_role] ? t(TASK_ROLE_KEYS[task.assignee_role]) : task.assignee_role) : '—'}
                </td>
                <td className="px-4 py-2.5 text-xs" style={{ color: 'rgb(90 100 112)' }}>
                  {task.due_at ? formatDistanceToNow(new Date(task.due_at), { addSuffix: true }) : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
