'use client'
import { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { SearchableSelect } from '@/components/system/lessons/SearchableSelect'
import { useMarkLeadLost } from '@/hooks/system/useLeads'
import { useI18n } from '@/lib/system/i18n'

/* ── Design tokens (create-lesson form style) ───── */
const BORDER  = 'rgb(var(--border-default,229 233 240))'
const NAVY    = 'rgb(11 31 58)'
const MUTED   = 'rgb(90 100 112)'
const RED_50  = '#FEF2F2'
const RED_600 = '#DC2626'

const inp      = 'w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[#DC2626] transition-shadow bg-white'
const inpStyle = { borderColor: BORDER }

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

  if (!open) return null

  const handleSave = async () => {
    if (!reason) return
    await markLost.mutateAsync({ lost_reason: reason, lost_notes: notes || undefined })
    toast.success(t('leads.toastMarkedLost'))
    onClose()
    router.refresh()
  }

  return (
    <>
      {/* Backdrop */}
      <div aria-hidden="true" className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
        <div
          className="w-full max-w-md rounded-2xl overflow-hidden"
          style={{ background: '#fff', boxShadow: '0 20px 60px rgb(0 0 0 / 0.18)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-white" style={{ borderColor: BORDER }}>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: RED_50 }}>
                <AlertTriangle size={14} style={{ color: RED_600 }} />
              </div>
              <h2 className="text-base font-semibold" style={{ color: NAVY }}>{t('leads.markLostTitle')}</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors" aria-label={t('common.dismiss')}>
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: MUTED }}>
                {t('common.reason')}<span className="text-red-500 ml-0.5">*</span>
              </label>
              <SearchableSelect
                options={REASONS.map(r => ({ value: r.value, label: t(r.key) }))}
                value={reason}
                onChange={setReason}
                placeholder={t('leads.selectReasonPlaceholder')}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: MUTED }}>
                {t('common.notes')} ({t('common.optional')})
              </label>
              <textarea rows={3} className={inp} style={inpStyle} value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-white" style={{ borderColor: BORDER }}>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-medium border hover:bg-black/5 transition-colors"
              style={{ borderColor: BORDER, color: NAVY }}
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!reason || markLost.isPending}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
              style={{ background: RED_600 }}
            >
              {markLost.isPending ? t('common.saving') : t('leads.markLostButton')}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
