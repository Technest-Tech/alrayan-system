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

const REASONS = [
  { value: 'price', label: 'Price' },
  { value: 'schedule', label: 'Schedule' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'no_response', label: 'No response' },
  { value: 'personal', label: 'Personal' },
  { value: 'quality', label: 'Quality' },
  { value: 'other', label: 'Other' },
]

interface Props { open: boolean; onClose: () => void; leadId: number }

export function MarkLostDialog({ open, onClose, leadId }: Props) {
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const markLost = useMarkLeadLost(leadId)
  const router = useRouter()

  const handleSave = async () => {
    if (!reason) return
    await markLost.mutateAsync({ lost_reason: reason, lost_notes: notes || undefined })
    toast.success('Lead marked as lost.')
    onClose()
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Mark lead as lost</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Reason *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue placeholder="Select a reason…" /></SelectTrigger>
              <SelectContent>
                {REASONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Notes (optional)</Label>
            <Textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={handleSave} disabled={!reason || markLost.isPending}>
            {markLost.isPending ? 'Saving…' : 'Mark lost'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
