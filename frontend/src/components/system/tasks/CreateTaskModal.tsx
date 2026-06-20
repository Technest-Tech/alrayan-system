'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import { useCreateTask } from '@/hooks/system/useTasks'
import { type TaskPriority } from '@/types/system/task'
import { useI18n } from '@/lib/system/i18n'
import { TASK_PRIORITY_KEYS, TASK_ROLE_KEYS } from './taskFields'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
}

const ROLE_OPTIONS = ['supervisor', 'quality', 'accountant', 'admin']

export function CreateTaskModal({ open, onOpenChange }: Props) {
  const { t } = useI18n()
  const create = useCreateTask()
  const [title, setTitle]       = useState('')
  const [body, setBody]         = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [dueAt, setDueAt]       = useState('')
  const [role, setRole]         = useState('')

  if (!open) return null

  function reset() {
    setTitle(''); setBody(''); setPriority('medium'); setDueAt(''); setRole('')
  }

  function submit() {
    if (!title.trim()) { toast.error(t('tasks.toastTitleRequired')); return }
    create.mutate(
      {
        type: 'manual_task',
        title: title.trim(),
        body: body.trim() || null,
        priority,
        due_at: dueAt || null,
        assignee_role: role || null,
      },
      {
        onSuccess: () => { toast.success(t('tasks.toastCreated')); reset(); onOpenChange(false) },
        onError:   () => toast.error(t('tasks.toastCreateFailed')),
      },
    )
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-[#0B1F3A]/40 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, #C9A24B, transparent)' }} />
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgb(229 233 240)' }}>
          <h2 className="text-lg font-bold" style={{ color: 'rgb(11 31 58)' }}>{t('tasks.createTask')}</h2>
          <button onClick={() => onOpenChange(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <Field label={t('tasks.fieldTitleRequired')}>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-[#0E7C5A]/20"
              style={{ borderColor: 'rgb(229 233 240)' }}
              autoFocus
            />
          </Field>

          <Field label={t('tasks.fieldDescription')}>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-[#0E7C5A]/20 resize-y"
              style={{ borderColor: 'rgb(229 233 240)' }}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('tasks.fieldPriority')}>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none cursor-pointer"
                style={{ borderColor: 'rgb(229 233 240)' }}
              >
                {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map(p => (
                  <option key={p} value={p}>{t(TASK_PRIORITY_KEYS[p])}</option>
                ))}
              </select>
            </Field>
            <Field label={t('tasks.fieldDueDate')}>
              <input
                type="date"
                value={dueAt}
                onChange={e => setDueAt(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none cursor-pointer"
                style={{ borderColor: 'rgb(229 233 240)' }}
              />
            </Field>
          </div>

          <Field label={t('tasks.fieldAssignTo')}>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none cursor-pointer"
              style={{ borderColor: 'rgb(229 233 240)' }}
            >
              <option value="">{t('tasks.selectRole')}</option>
              {ROLE_OPTIONS.map(r => <option key={r} value={r}>{TASK_ROLE_KEYS[r] ? t(TASK_ROLE_KEYS[r]) : r}</option>)}
            </select>
          </Field>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t" style={{ borderColor: 'rgb(229 233 240)' }}>
          <button onClick={() => onOpenChange(false)} className="px-4 py-2 rounded-lg text-sm font-medium border" style={{ borderColor: 'rgb(229 233 240)', color: 'rgb(90 100 112)' }}>
            {t('common.cancel')}
          </button>
          <button
            onClick={submit}
            disabled={create.isPending}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: '#0B1F3A' }}
          >
            {create.isPending ? t('common.creating') : t('tasks.createTask')}
          </button>
        </div>
      </div>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: 'rgb(90 100 112)' }}>{label}</label>
      {children}
    </div>
  )
}
