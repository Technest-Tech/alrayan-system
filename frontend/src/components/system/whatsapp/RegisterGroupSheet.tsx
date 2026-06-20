'use client'
import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateWhatsAppGroup } from '@/hooks/system/useWhatsAppGroups'
import { toast } from 'sonner'
import { useI18n } from '@/lib/system/i18n'

interface Props { open: boolean; onClose: () => void }

export function RegisterGroupSheet({ open, onClose }: Props) {
  const { t } = useI18n()
  const create = useCreateWhatsAppGroup()
  const [form, setForm] = useState({ type: 'student', invite_link: '', linked_student_id: '', linked_teacher_id: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload: Record<string, unknown> = { type: form.type, invite_link: form.invite_link }
    if (form.type === 'student' && form.linked_student_id) payload.linked_student_id = Number(form.linked_student_id)
    if (form.type === 'teacher' && form.linked_teacher_id) payload.linked_teacher_id = Number(form.linked_teacher_id)
    await create.mutateAsync(payload)
    toast.success(t('whatsappGroups.toastRegistered'))
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader><SheetTitle>{t('whatsappGroups.registerGroup')}</SheetTitle></SheetHeader>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1">
            <Label>{t('whatsappGroups.typeRequired')}</Label>
            <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="student">{t('whatsappGroups.typeStudent')}</SelectItem>
                <SelectItem value="teacher">{t('whatsappGroups.typeTeacher')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>{t('whatsappGroups.inviteLinkRequired')}</Label>
            <Input required type="url" placeholder="https://chat.whatsapp.com/…" value={form.invite_link} onChange={e => setForm(p => ({ ...p, invite_link: e.target.value }))} />
          </div>
          {form.type === 'student' && (
            <div className="space-y-1">
              <Label>{t('whatsappGroups.studentId')}</Label>
              <Input type="number" value={form.linked_student_id} onChange={e => setForm(p => ({ ...p, linked_student_id: e.target.value }))} />
            </div>
          )}
          {form.type === 'teacher' && (
            <div className="space-y-1">
              <Label>{t('whatsappGroups.teacherId')}</Label>
              <Input type="number" value={form.linked_teacher_id} onChange={e => setForm(p => ({ ...p, linked_teacher_id: e.target.value }))} />
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? t('whatsappGroups.registering') : t('whatsappGroups.register')}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
