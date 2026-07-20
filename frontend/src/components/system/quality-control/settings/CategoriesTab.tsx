'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, ChevronRight, Check, X } from 'lucide-react'
import { useI18n } from '@/lib/system/i18n'
import {
  useQcCategories,
  useQcSpecialRules,
  useCreateQcCategory,
  useUpdateQcCategory,
  useDeleteQcCategory,
  useCreateQcItem,
  useUpdateQcItem,
  useDeleteQcItem,
} from '@/hooks/system/useQualityControl'
import type { QcCategory, QcCategoryItem, QcSpecialRule } from '@/types/system/qualityControl'

const BORDER = 'rgb(var(--border-default,229 233 240))'
const NAVY   = 'rgb(11 31 58)'
const MUTED  = 'rgb(90 100 112)'
const TEAL   = '#0d9488'

const inp = 'px-2.5 py-1.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-[#0d9488] bg-white'

export function CategoriesTab() {
  const { t } = useI18n()
  const { data: categories = [], isLoading } = useQcCategories()
  const { data: rules = [] } = useQcSpecialRules()
  const createCat = useCreateQcCategory()

  const [name, setName] = useState('')
  const [weight, setWeight] = useState(10)

  async function addCategory() {
    if (!name.trim()) return
    await createCat.mutateAsync({ name: name.trim(), weight: Number(weight) })
    toast.success(t('qualityControl.settingsModal.categoryAdded'))
    setName(''); setWeight(10)
  }

  return (
    <div className="space-y-4">
      {/* Add category */}
      <div className="rounded-xl border p-3" style={{ borderColor: BORDER, background: 'rgba(13,148,136,0.03)' }}>
        <p className="text-xs font-semibold mb-2 text-center" style={{ color: TEAL }}>✦ {t('qualityControl.settingsModal.addCategory')} ✦</p>
        <div className="flex items-center gap-2">
          <input className={`${inp} flex-1`} style={{ borderColor: BORDER }} placeholder={t('qualityControl.settingsModal.categoryName')} value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCategory()} />
          <input type="number" min={0} max={100} className={`${inp} w-16`} style={{ borderColor: BORDER }} value={weight} onChange={e => setWeight(Number(e.target.value))} />
          <button onClick={addCategory} disabled={createCat.isPending || !name.trim()} className="p-2 rounded-lg text-white disabled:opacity-40" style={{ background: '#0B1F3A' }} aria-label={t('qualityControl.settingsModal.addCategory')}>
            <Plus size={15} />
          </button>
        </div>
      </div>

      {/* Category list */}
      <div>
        <p className="text-xs font-semibold mb-2 text-center" style={{ color: TEAL }}>✦ {t('qualityControl.settingsModal.categorySettings')} ✦</p>
        {isLoading ? (
          <p className="py-8 text-center text-sm" style={{ color: MUTED }}>…</p>
        ) : categories.length === 0 ? (
          <p className="py-8 text-center text-sm" style={{ color: MUTED }}>{t('qualityControl.settingsModal.emptyCategories')}</p>
        ) : (
          <div className="space-y-2">
            {categories.map(cat => <CategoryRow key={cat.id} category={cat} rules={rules} />)}
          </div>
        )}
      </div>
    </div>
  )
}

function CategoryRow({ category, rules }: { category: QcCategory; rules: QcSpecialRule[] }) {
  const { t } = useI18n()
  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState(false)
  const [name, setName]       = useState(category.name)
  const [weight, setWeight]   = useState(category.weight)
  const updateCat = useUpdateQcCategory()
  const deleteCat = useDeleteQcCategory()
  const createItem = useCreateQcItem()

  const penaltiesSum = category.penalties_sum ?? category.items.reduce((s, i) => s + i.penalty, 0)

  const [newLabel, setNewLabel]     = useState('')
  const [newPenalty, setNewPenalty] = useState(5)
  const [newRule, setNewRule]       = useState('')

  async function saveCat() {
    await updateCat.mutateAsync({ id: category.id, name: name.trim(), weight: Number(weight) })
    toast.success(t('qualityControl.settingsModal.categoryUpdated')); setEditing(false)
  }
  async function removeCat() {
    if (!window.confirm(t('qualityControl.settingsModal.deleteCategoryConfirm'))) return
    await deleteCat.mutateAsync(category.id)
    toast.success(t('qualityControl.settingsModal.categoryDeleted'))
  }
  async function addItem() {
    if (!newLabel.trim()) return
    await createItem.mutateAsync({ categoryId: category.id, label: newLabel.trim(), penalty: Number(newPenalty), special_rule_key: newRule || null })
    toast.success(t('qualityControl.settingsModal.itemAdded'))
    setNewLabel(''); setNewPenalty(5); setNewRule('')
  }

  return (
    <div className="rounded-xl border" style={{ borderColor: BORDER }}>
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button onClick={() => setOpen(o => !o)} className="shrink-0 transition-transform" style={{ transform: open ? 'rotate(90deg)' : 'none', color: MUTED }}>
          <ChevronRight size={16} />
        </button>
        {editing ? (
          <>
            <input className={`${inp} flex-1`} style={{ borderColor: BORDER }} value={name} onChange={e => setName(e.target.value)} autoFocus />
            <input type="number" min={0} max={100} className={`${inp} w-14`} style={{ borderColor: BORDER }} value={weight} onChange={e => setWeight(Number(e.target.value))} />
            <IconBtn onClick={saveCat} tone="green"><Check size={14} /></IconBtn>
            <IconBtn onClick={() => { setEditing(false); setName(category.name); setWeight(category.weight) }}><X size={14} /></IconBtn>
          </>
        ) : (
          <>
            <span className="flex-1 text-sm font-medium truncate" style={{ color: NAVY }}>{category.name}</span>
            <Chip>{t('qualityControl.settingsModal.penaltiesSum', { value: String(penaltiesSum) })}</Chip>
            <Chip>{t('qualityControl.settingsModal.subItems', { count: String(category.items.length) })}</Chip>
            <IconBtn onClick={() => setEditing(true)}><Pencil size={13} /></IconBtn>
            <IconBtn onClick={removeCat} tone="red"><Trash2 size={13} /></IconBtn>
          </>
        )}
      </div>

      {open && (
        <div className="px-3 pb-3 pt-1 border-t space-y-1.5" style={{ borderColor: BORDER }}>
          {category.items.map(item => <SubItemRow key={item.id} item={item} rules={rules} />)}

          {/* Add sub-item */}
          <div className="flex items-center gap-2 pt-1.5">
            <input className={`${inp} flex-1`} style={{ borderColor: BORDER }} placeholder={t('qualityControl.settingsModal.subItemLabel')} value={newLabel} onChange={e => setNewLabel(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem()} />
            <input type="number" min={0} max={100} className={`${inp} w-14`} style={{ borderColor: BORDER }} value={newPenalty} onChange={e => setNewPenalty(Number(e.target.value))} />
            <RuleSelect rules={rules} value={newRule} onChange={setNewRule} />
            <button onClick={addItem} disabled={!newLabel.trim()} className="p-1.5 rounded-lg text-white disabled:opacity-40" style={{ background: '#0B1F3A' }} aria-label={t('qualityControl.settingsModal.addSubItem')}>
              <Plus size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function SubItemRow({ item, rules }: { item: QcCategoryItem; rules: QcSpecialRule[] }) {
  const { t } = useI18n()
  const [editing, setEditing] = useState(false)
  const [label, setLabel]     = useState(item.label)
  const [penalty, setPenalty] = useState(item.penalty)
  const [rule, setRule]       = useState(item.special_rule_key ?? '')
  const updateItem = useUpdateQcItem()
  const deleteItem = useDeleteQcItem()

  async function save() {
    await updateItem.mutateAsync({ id: item.id, label: label.trim(), penalty: Number(penalty), special_rule_key: rule || null })
    toast.success(t('qualityControl.settingsModal.itemUpdated')); setEditing(false)
  }
  async function remove() {
    if (!window.confirm(t('qualityControl.settingsModal.deleteItemConfirm'))) return
    await deleteItem.mutateAsync(item.id)
    toast.success(t('qualityControl.settingsModal.itemDeleted'))
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input className={`${inp} flex-1`} style={{ borderColor: BORDER }} value={label} onChange={e => setLabel(e.target.value)} autoFocus />
        <input type="number" min={0} max={100} className={`${inp} w-14`} style={{ borderColor: BORDER }} value={penalty} onChange={e => setPenalty(Number(e.target.value))} />
        <RuleSelect rules={rules} value={rule} onChange={setRule} />
        <IconBtn onClick={save} tone="green"><Check size={14} /></IconBtn>
        <IconBtn onClick={() => setEditing(false)}><X size={14} /></IconBtn>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="flex-1 text-sm truncate" style={{ color: NAVY }}>{item.label}</span>
      <span className="shrink-0 inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold" style={{ background: '#FEE2E2', color: '#B91C1C' }}>−{item.penalty}%</span>
      <IconBtn onClick={() => setEditing(true)}><Pencil size={13} /></IconBtn>
      <IconBtn onClick={remove} tone="red"><Trash2 size={13} /></IconBtn>
    </div>
  )
}

function RuleSelect({ rules, value, onChange }: { rules: QcSpecialRule[]; value: string; onChange: (v: string) => void }) {
  const { t } = useI18n()
  return (
    <select className={`${inp} w-24`} style={{ borderColor: BORDER }} value={value} onChange={e => onChange(e.target.value)}>
      <option value="">{t('qualityControl.settingsModal.noRule')}</option>
      {rules.map(r => <option key={r.rule_key} value={r.rule_key}>{r.rule_key}</option>)}
    </select>
  )
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="shrink-0 hidden sm:inline-flex items-center rounded-full px-2 py-0.5 text-[11px]" style={{ background: 'rgba(0,0,0,0.04)', color: MUTED }}>{children}</span>
}

function IconBtn({ children, onClick, tone }: { children: React.ReactNode; onClick: () => void; tone?: 'red' | 'green' }) {
  const color = tone === 'red' ? '#ef4444' : tone === 'green' ? '#0E7C5A' : MUTED
  const hover = tone === 'red' ? 'hover:bg-red-50' : 'hover:bg-black/5'
  return <button onClick={onClick} className={`shrink-0 p-1.5 rounded-md transition-colors ${hover}`} style={{ color }}>{children}</button>
}
