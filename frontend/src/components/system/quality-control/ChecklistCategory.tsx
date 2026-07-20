'use client'
import { Check } from 'lucide-react'
import type { QcCategory } from '@/types/system/qualityControl'
import { useI18n } from '@/lib/system/i18n'

const BORDER = 'rgb(var(--border-default,229 233 240))'
const NAVY   = 'rgb(11 31 58)'
const MUTED  = 'rgb(90 100 112)'
const GREEN  = '#0E7C5A'

export function ChecklistCategory({
  category,
  checkedIds,
  onToggle,
  onSetAll,
  readOnly = false,
}: {
  category: QcCategory
  checkedIds: Set<number>
  onToggle: (itemId: number) => void
  onSetAll: (itemIds: number[], checked: boolean) => void
  readOnly?: boolean
}) {
  const { t } = useI18n()
  const items = category.items
  const allChecked = items.every(i => checkedIds.has(i.id))
  const uncheckedPenalty = items.reduce((sum, i) => (checkedIds.has(i.id) ? sum : sum + i.penalty), 0)
  const ids = items.map(i => i.id)

  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: BORDER, background: '#fff' }}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <h4 className="text-sm font-semibold truncate" style={{ color: NAVY }}>{category.name}</h4>
          {uncheckedPenalty > 0 && (
            <span className="shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: '#FEE2E2', color: '#B91C1C' }}>
              −{uncheckedPenalty}%
            </span>
          )}
        </div>
        {!readOnly && (
          <button
            type="button"
            onClick={() => onSetAll(ids, !allChecked)}
            className="shrink-0 text-xs font-medium hover:underline"
            style={{ color: MUTED }}
          >
            {allChecked ? t('qualityControl.modal.uncheckAll') : t('qualityControl.modal.checkAll')}
          </button>
        )}
      </div>

      <ul className="space-y-1.5">
        {items.map(item => {
          const checked = checkedIds.has(item.id)
          return (
            <li key={item.id}>
              <button
                type="button"
                disabled={readOnly}
                onClick={() => onToggle(item.id)}
                className="w-full flex items-start gap-2.5 text-left rounded-lg px-1.5 py-1 transition-colors disabled:cursor-default"
                style={!checked ? { background: 'rgba(185,28,28,0.04)' } : undefined}
              >
                <span
                  className="mt-0.5 shrink-0 grid place-items-center rounded-[5px] transition-colors"
                  style={{
                    width: 16, height: 16,
                    background: checked ? GREEN : '#fff',
                    border: checked ? `1px solid ${GREEN}` : `1px solid ${BORDER}`,
                  }}
                >
                  {checked && <Check size={11} color="#fff" strokeWidth={3} />}
                </span>
                <span
                  className="flex-1 text-[13px] leading-snug"
                  style={{ color: checked ? NAVY : MUTED, textDecoration: checked ? 'none' : 'line-through' }}
                >
                  {item.label}
                </span>
                {!checked && item.penalty > 0 && (
                  <span className="shrink-0 inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold" style={{ background: '#FEE2E2', color: '#B91C1C' }}>
                    −{item.penalty}%
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
