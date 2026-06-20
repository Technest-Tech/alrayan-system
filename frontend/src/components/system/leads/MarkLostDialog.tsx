'use client'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useMarkLeadLost } from '@/hooks/system/useLeads'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useI18n } from '@/lib/system/i18n'

const REASONS = [
  { value: 'price', key: 'leads.lostReasonPrice' },
  { value: 'schedule', key: 'leads.lostReasonSchedule' },
  { value: 'teacher', key: 'leads.lostReasonTeacher' },
  { value: 'no_response', key: 'leads.lostReasonNoResponse' },
  { value: 'personal', key: 'leads.lostReasonPersonal' },
  { value: 'quality', key: 'leads.lostReasonQuality' },
  { value: 'other', key: 'leads.lostReasonOther' },
] as const

interface Props { open: boolean; onClose: () => void; leadId: number }

export function MarkLostDialog({ open, onClose, leadId }: Props) {
  const { t } = useI18n()
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const markLost = useMarkLeadLost(leadId)
  const router = useRouter()

  const handleSave = async () => {
    if (!reason) return
    await markLost.mutateAsync({ lost_reason: reason, lost_notes: notes || undefined })
    toast.success(t('leads.toastMarkedLost'))
    onClose()
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>{t('leads.markLostTitle')}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>{t('common.reason')} *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue placeholder={t('leads.selectReasonPlaceholder')} /></SelectTrigger>
              <SelectContent>
                {REASONS.map(r => <SelectItem key={r.value} value={r.value}>{t(r.key)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>{t('common.notes')} ({t('common.optional')})</Label>
            <Textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="destructive" onClick={handleSave} disabled={!reason || markLost.isPending}>
            {markLost.isPending ? t('common.saving') : t('leads.markLostButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
