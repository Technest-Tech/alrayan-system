'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { useI18n } from '@/lib/system/i18n'
import {
  useQcSpecialRules,
  useCreateQcSpecialRule,
  useUpdateQcSpecialRule,
  useDeleteQcSpecialRule,
} from '@/hooks/system/useQualityControl'
import type { QcSpecialRule } from '@/types/system/qualityControl'
import { ApiError } from '@/lib/system/api'

const BORDER = 'rgb(var(--border-default,229 233 240))'
const NAVY   = 'rgb(11 31 58)'
const MUTED  = 'rgb(90 100 112)'
const TEAL   = '#0d9488'

const inp = 'px-2.5 py-1.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-[#0d9488] bg-white'

export function SpecialRulesTab() {
  const { t } = useI18n()
  const { data: rules = [], isLoading } = useQcSpecialRules()
  const create = useCreateQcSpecialRule()
  const update = useUpdateQcSpecialRule()
  const del    = useDeleteQcSpecialRule()

  const [ruleKey, setRuleKey]   = useState('')
  const [label, setLabel]       = useState('')
  const [capValue, setCapValue] = useState(30)

  async function add() {
    if (!ruleKey.trim() || !label.trim()) return
    try {
      await create.mutateAsync({ rule_key: ruleKey.trim(), label: label.trim(), cap_value: Number(capValue) })
      toast.success(t('qualityControl.settingsModal.ruleAdded'))
      setRuleKey(''); setLabel(''); setCapValue(30)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t('qualityControl.settingsModal.saveError'))
    }
  }
  async function toggleActive(r: QcSpecialRule) {
    await update.mutateAsync({ id: r.id, is_active: !r.is_active })
    toast.success(t('qualityControl.settingsModal.ruleUpdated'))
  }
  async function remove(r: QcSpecialRule) {
    if (!window.confirm(t('qualityControl.settingsModal.deleteRuleConfirm'))) return
    await del.mutateAsync(r.id)
    toast.success(t('qualityControl.settingsModal.ruleDeleted'))
  }

  return (
    <div className="space-y-4">
      {/* Add rule */}
      <div className="rounded-xl border p-3" style={{ borderColor: BORDER, background: 'rgba(13,148,136,0.03)' }}>
        <p className="text-xs font-semibold mb-2 text-center" style={{ color: TEAL }}>✦ {t('qualityControl.settingsModal.addSpecialRule')} ✦</p>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-[11px] font-medium" style={{ color: MUTED }}>
            {t('qualityControl.settingsModal.ruleKey')}
            <input className={`${inp} w-full mt-1`} style={{ borderColor: BORDER }} placeholder="camera_cap" value={ruleKey} onChange={e => setRuleKey(e.target.value.replace(/[^a-z0-9_]/g, ''))} />
          </label>
          <label className="text-[11px] font-medium" style={{ color: MUTED }}>
            {t('qualityControl.settingsModal.ruleType')}
            <select className={`${inp} w-full mt-1`} style={{ borderColor: BORDER }} value="score_cap" disabled>
              <option value="score_cap">{t('qualityControl.settingsModal.ruleTypeScoreCap')}</option>
            </select>
          </label>
          <label className="text-[11px] font-medium" style={{ color: MUTED }}>
            {t('qualityControl.settingsModal.ruleLabel')}
            <input className={`${inp} w-full mt-1`} style={{ borderColor: BORDER }} value={label} onChange={e => setLabel(e.target.value)} />
          </label>
          <label className="text-[11px] font-medium" style={{ color: MUTED }}>
            {t('qualityControl.settingsModal.capValue')}
            <input type="number" min={0} max={100} className={`${inp} w-full mt-1`} style={{ borderColor: BORDER }} value={capValue} onChange={e => setCapValue(Number(e.target.value))} />
          </label>
        </div>
        <div className="mt-2 flex justify-end">
          <button onClick={add} disabled={create.isPending || !ruleKey.trim() || !label.trim()} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-sm disabled:opacity-40" style={{ background: '#0B1F3A' }}>
            <Plus size={14} /> {t('qualityControl.settingsModal.add')}
          </button>
        </div>
      </div>

      {/* Rule list */}
      {isLoading ? (
        <p className="py-8 text-center text-sm" style={{ color: MUTED }}>…</p>
      ) : rules.length === 0 ? (
        <p className="py-8 text-center text-sm" style={{ color: MUTED }}>{t('qualityControl.settingsModal.emptyRules')}</p>
      ) : (
        <div className="space-y-2">
          {rules.map(r => (
            <div key={r.id} className="flex items-center gap-3 rounded-xl border px-3 py-2.5" style={{ borderColor: BORDER }}>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate" style={{ color: NAVY }}>
                  {r.label} <span className="font-normal" style={{ color: MUTED }}>({r.rule_key})</span>
                </p>
              </div>
              <span className="shrink-0 text-xs font-semibold tabular-nums" style={{ color: NAVY }}>
                {t('qualityControl.settingsModal.capLabel', { value: String(r.cap_value) })}
              </span>
              <button
                onClick={() => toggleActive(r)}
                className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold transition-colors"
                style={r.is_active ? { background: 'rgba(14,124,90,0.12)', color: '#0E7C5A' } : { background: 'rgba(0,0,0,0.06)', color: MUTED }}
              >
                {r.is_active ? t('qualityControl.settingsModal.active') : t('qualityControl.settingsModal.inactive')}
              </button>
              <button onClick={() => remove(r)} className="shrink-0 p-1.5 rounded-md hover:bg-red-50 text-red-500 transition-colors" aria-label={t('qualityControl.table.delete')}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
