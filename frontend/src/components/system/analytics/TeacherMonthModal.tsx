'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TrendingDown, TrendingUp, DollarSign } from 'lucide-react'
import { useTeacherMonth } from '@/hooks/system/useAnalytics'
import { formatMoney } from '@/lib/money'
import { useI18n } from '@/lib/system/i18n'
import type { TeacherAdjustment } from '@/types/system/analytics'

function AdjustmentList({
  items, currency, emptyLabel, positive,
}: { items: TeacherAdjustment[]; currency: string; emptyLabel: string; positive?: boolean }) {
  if (items.length === 0) {
    return <p className="text-sm opacity-40 text-center py-4">{emptyLabel}</p>
  }
  return (
    <ul className="space-y-2">
      {items.map(a => (
        <li key={a.id} className="flex items-center justify-between gap-3 text-sm">
          <div className="min-w-0">
            <div className="font-medium capitalize">{a.category.replace(/_/g, ' ')}</div>
            {a.reason && <div className="text-xs opacity-50 truncate">{a.reason}</div>}
          </div>
          <span className="tabular-nums font-semibold shrink-0" style={{ color: positive ? '#0E7C5A' : '#A6271E' }}>
            {positive ? '+' : '−'}{formatMoney(a.amount_minor, currency)}
          </span>
        </li>
      ))}
    </ul>
  )
}

export function TeacherMonthModal({
  teacherId, month, open, onClose,
}: { teacherId: number | null; month: string; open: boolean; onClose: () => void }) {
  const { t } = useI18n()
  const { data, isLoading } = useTeacherMonth(open ? teacherId : null, month)
  const currency = data?.currency ?? 'EUR'

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign size={18} style={{ color: '#0E7C5A' }} />
            {data ? `${data.teacher.name} — ${data.month}` : t('analytics.teacherBreakdown')}
          </DialogTitle>
        </DialogHeader>

        {isLoading || !data ? (
          <div className="space-y-3 py-2">
            {[0, 1, 2].map(i => <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'rgb(var(--surface-card-2))' }} />)}
          </div>
        ) : (
          <div className="space-y-3 py-1">
            {/* Revenue */}
            <div className="rounded-xl p-4" style={{ background: 'rgb(var(--surface-card-2))', border: '1px solid rgb(var(--border-default))' }}>
              <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#0E7C5A' }}>
                <DollarSign size={13} /> {t('analytics.revenue')}
              </div>
              <div className="text-3xl font-bold tabular-nums mt-1">{formatMoney(data.revenue_minor, currency)}</div>
              <div className="text-[11px] opacity-40 mt-0.5">{data.month}</div>
            </div>

            {/* Deductions */}
            <div className="rounded-xl p-4" style={{ background: 'rgb(var(--surface-card))', border: '1px solid rgb(var(--border-default))' }}>
              <div className="flex items-center gap-1.5 text-xs font-semibold mb-2" style={{ color: '#A6271E' }}>
                <TrendingDown size={13} /> {t('analytics.deductions')} ({data.deductions.length})
              </div>
              <AdjustmentList items={data.deductions} currency={currency} emptyLabel={t('analytics.noDeductions')} />
            </div>

            {/* Recompenses */}
            <div className="rounded-xl p-4" style={{ background: 'rgb(var(--surface-card))', border: '1px solid rgb(var(--border-default))' }}>
              <div className="flex items-center gap-1.5 text-xs font-semibold mb-2" style={{ color: '#0E7C5A' }}>
                <TrendingUp size={13} /> {t('analytics.recompenses')} ({data.recompenses.length})
              </div>
              <AdjustmentList items={data.recompenses} currency={currency} emptyLabel={t('analytics.noRecompenses')} positive />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
