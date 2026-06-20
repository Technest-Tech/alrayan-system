'use client'
import { useFollowUps, useCreateFollowUp, useCompleteFollowUp, useDeleteFollowUp } from '@/hooks/system/useFollowUps'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { format, isPast } from 'date-fns'
import { CheckCircle, Clock, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useI18n } from '@/lib/system/i18n'

interface Props { leadId: number }

export function FollowUpList({ leadId }: Props) {
  const { t } = useI18n()
  const { data: followUps, isLoading } = useFollowUps(leadId)
  const create = useCreateFollowUp(leadId)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ due_at: '', action: '', notes: '' })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await create.mutateAsync(form)
    setForm({ due_at: '', action: '', notes: '' })
    setShowNew(false)
    toast.success(t('leads.toastFollowUpScheduled'))
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={() => setShowNew(p => !p)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> {t('leads.scheduleFollowUp')}
        </Button>
      </div>

      {showNew && (
        <form onSubmit={handleCreate} className="border rounded p-4 space-y-3 bg-secondary/20">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{t('leads.fieldDueAt')} *</Label>
              <Input type="datetime-local" required value={form.due_at} onChange={e => setForm(p => ({ ...p, due_at: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>{t('leads.fieldAction')} *</Label>
              <Input required placeholder={t('leads.actionPlaceholder')} value={form.action} onChange={e => setForm(p => ({ ...p, action: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>{t('common.notes')}</Label>
            <Input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowNew(false)}>{t('common.cancel')}</Button>
            <Button type="submit" size="sm" disabled={create.isPending}>{t('common.save')}</Button>
          </div>
        </form>
      )}

      {isLoading && <div className="text-sm text-muted-foreground">{t('common.loading')}</div>}
      {followUps?.map(f => (
        <FollowUpRow key={f.id} followUp={f} />
      ))}
      {!isLoading && (followUps?.length ?? 0) === 0 && !showNew && (
        <div className="text-sm text-muted-foreground">{t('leads.noFollowUps')}</div>
      )}
    </div>
  )
}

function FollowUpRow({ followUp }: { followUp: ReturnType<typeof useFollowUps>['data'] extends (infer T)[] | undefined ? T : never }) {
  const { t } = useI18n()
  const complete = useCompleteFollowUp(followUp!.id)
  const del = useDeleteFollowUp(followUp!.id)
  if (!followUp) return null

  const isDone = !!followUp.completed_at
  const isOverdue = !isDone && isPast(new Date(followUp.due_at))

  return (
    <div className={`border rounded p-3 ${isDone ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {isDone ? <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> : <Clock className={`h-4 w-4 shrink-0 ${isOverdue ? 'text-orange-500' : 'text-muted-foreground'}`} />}
          <div>
            <p className="text-sm font-medium">{followUp.action}</p>
            <p className="text-xs text-muted-foreground">{format(new Date(followUp.due_at), 'MMM d, HH:mm')}{isDone ? ` · ${t('leads.doneOn', { date: format(new Date(followUp.completed_at!), 'MMM d') })}` : ''}</p>
            {followUp.notes && <p className="text-xs text-muted-foreground">{followUp.notes}</p>}
            {followUp.completion_notes && <p className="text-xs italic text-muted-foreground">{followUp.completion_notes}</p>}
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          {!isDone && (
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => complete.mutate(undefined)}>
              <CheckCircle className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => del.mutate()}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
