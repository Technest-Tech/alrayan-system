'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/components/system/primitives/ConfirmDialog'
import { Field, SelectInput, TextAreaInput, TextInput } from '@/components/system/treasury/fields'
import { useDeleteExpenseItem, useExpenseCategories, useSaveExpenseItem } from '@/hooks/system/useExpenses'
import { useI18n } from '@/lib/system/i18n'
import { fromMinor, toMinor, toastApiError } from '@/lib/system/treasury'
import type { ExpenseItem, ExpenseItemType } from '@/types/system/expense'
import { ACCOUNT_CURRENCIES, type TreasuryAccount } from '@/types/system/treasury'

interface ExpenseItemSheetProps {
  open:     boolean
  onClose:  () => void
  item?:    ExpenseItem | null
  accounts: TreasuryAccount[]
}

export function ExpenseItemSheet({ open, onClose, item, accounts }: ExpenseItemSheetProps) {
  const { t } = useI18n()
  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t(item ? 'accounting.expenseItems.editItem' : 'accounting.expenseItems.newItem')}</SheetTitle>
        </SheetHeader>
        {open && <ItemForm item={item} accounts={accounts} onClose={onClose} />}
      </SheetContent>
    </Sheet>
  )
}

function ItemForm({ item, accounts, onClose }: Omit<ExpenseItemSheetProps, 'open'>) {
  const { t } = useI18n()
  const confirm = useConfirm()
  const { data: categories } = useExpenseCategories()
  const save = useSaveExpenseItem()
  const destroy = useDeleteExpenseItem()

  const [form, setForm] = useState({
    name:        item?.name ?? '',
    type:        (item?.type ?? 'fixed') as ExpenseItemType,
    category_id: item?.category.id ? String(item.category.id) : '',
    amount:      fromMinor(item?.default_amount_minor),
    currency:    item?.currency ?? 'EGP',
    account_id:  item?.default_account ? String(item.default_account.id) : '',
    due_day:     item?.due_day ? String(item.due_day) : '',
    auto_record: item?.auto_record ?? false,
    notes:       item?.notes ?? '',
    is_active:   item?.is_active ?? true,
  })
  const set = (key: 'name' | 'category_id' | 'amount' | 'currency' | 'due_day' | 'notes', value: string) =>
    setForm(f => ({ ...f, [key]: value }))

  const isFixed = form.type === 'fixed'
  const selectable = accounts.filter(a => a.is_active || String(a.id) === form.account_id)

  function chooseAccount(id: string) {
    const account = accounts.find(a => String(a.id) === id)
    setForm(f => {
      // A fixed amount typed in another currency doesn't carry over: 100 USD isn't 100 EGP.
      const currencyChanged = !!account && account.currency !== f.currency
      return {
        ...f,
        account_id: id,
        currency:   account?.currency ?? f.currency,
        amount:     currencyChanged ? '' : f.amount,
      }
    })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()

    const amount = isFixed ? toMinor(form.amount) : null
    if (isFixed && (Number.isNaN(amount) || (amount ?? 0) <= 0)) {
      toast.error(t('treasury.movement.amountRequired'))
      return
    }

    try {
      await save.mutateAsync({
        id: item?.id,
        data: {
          name:                 form.name.trim(),
          type:                 form.type,
          category_id:          Number(form.category_id),
          default_amount_minor: amount,
          currency:             form.currency,
          default_account_id:   form.account_id ? Number(form.account_id) : null,
          due_day:              isFixed && form.due_day ? Number(form.due_day) : null,
          auto_record:          isFixed && !!form.account_id && form.auto_record,
          notes:                form.notes.trim() || null,
          is_active:            form.is_active,
        },
      })
      toast.success(t('accounting.expenseItems.saved'))
      onClose()
    } catch (err) {
      toastApiError(err, t('treasury.saveError'))
    }
  }

  async function remove() {
    if (!item) return
    const ok = await confirm({
      title:        t('accounting.expenseItems.deleteConfirm', { name: item.name }),
      description:  t('accounting.expenseItems.deleteConfirmBody'),
      confirmLabel: t('common.delete'),
      variant:      'danger',
    })
    if (!ok) return

    try {
      await destroy.mutateAsync(item.id)
      toast.success(t('accounting.expenseItems.deleted'))
      onClose()
    } catch (err) {
      toastApiError(err, t('treasury.saveError'))
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 px-4 py-2">
      <Field label={t('accounting.expenseItems.name')}>
        <TextInput required maxLength={150} value={form.name} placeholder={t('accounting.expenseItems.namePlaceholder')} onChange={e => set('name', e.target.value)} />
      </Field>

      <div>
        <span className="block text-sm font-medium mb-1">{t('accounting.expenseItems.type')}</span>
        <div className="grid grid-cols-2 gap-2">
          {(['fixed', 'variable'] as ExpenseItemType[]).map(type => (
            <button
              key={type}
              type="button"
              aria-pressed={form.type === type}
              onClick={() => setForm(f => ({ ...f, type }))}
              className={`rounded-xl border px-3 py-2 text-start transition-colors ${form.type === type ? 'border-secondary bg-black/5' : 'border-black/10'}`}
            >
              <span className="block text-sm font-medium">{t(`accounting.expenseItems.${type}`)}</span>
              <span className="block text-xs opacity-50 mt-0.5">{t(`accounting.expenseItems.${type}Hint`)}</span>
            </button>
          ))}
        </div>
      </div>

      <Field label={t('accounting.common.category')}>
        <SelectInput required value={form.category_id} onChange={e => set('category_id', e.target.value)}>
          <option value="">{t('common.selectPlaceholder')}</option>
          {categories?.filter(c => c.is_active || String(c.id) === form.category_id).map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </SelectInput>
      </Field>

      <Field label={t('accounting.expenseItems.defaultAccount')} hint={t('accounting.expenseItems.defaultAccountHint')}>
        <SelectInput value={form.account_id} onChange={e => chooseAccount(e.target.value)}>
          <option value="">{t('accounting.expenseItems.noDefaultAccount')}</option>
          {selectable.map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
        </SelectInput>
      </Field>

      <div className="flex gap-3">
        {isFixed && (
          <div className="flex-1">
            <Field label={t('accounting.expenseItems.monthlyAmount')}>
              <TextInput required type="number" min="0.01" step="0.01" inputMode="decimal" value={form.amount} onChange={e => set('amount', e.target.value)} />
            </Field>
          </div>
        )}
        <div className={isFixed ? 'w-28' : 'flex-1'}>
          <Field label={t('common.currency')}>
            <SelectInput disabled={!!form.account_id} value={form.currency} onChange={e => set('currency', e.target.value)}>
              {ACCOUNT_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </SelectInput>
          </Field>
        </div>
      </div>

      {isFixed && (
        <Field label={t('accounting.expenseItems.dueDay')} hint={t('accounting.expenseItems.dueDayHint')}>
          <TextInput type="number" min="1" max="31" step="1" value={form.due_day} onChange={e => set('due_day', e.target.value)} />
        </Field>
      )}

      {isFixed && (
        <label className={`flex items-start gap-2 rounded-xl border border-black/10 p-3 text-sm ${form.account_id ? 'cursor-pointer' : 'opacity-60'}`}>
          <input
            type="checkbox"
            className="mt-0.5"
            disabled={!form.account_id}
            checked={form.auto_record && !!form.account_id}
            onChange={e => setForm(f => ({ ...f, auto_record: e.target.checked }))}
          />
          <span>
            <span className="block font-medium">{t('accounting.expenseItems.autoRecord')}</span>
            <span className="block text-xs opacity-60 mt-0.5">
              {t(form.account_id ? 'accounting.expenseItems.autoRecordHint' : 'accounting.expenseItems.autoRecordNeedsAccount')}
            </span>
          </span>
        </label>
      )}

      <Field label={t('common.notes')}>
        <TextAreaInput rows={2} maxLength={2000} value={form.notes} onChange={e => set('notes', e.target.value)} />
      </Field>

      {item && (
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
          {t('accounting.expenseItems.active')}
        </label>
      )}

      <SheetFooter className="px-0">
        <Button type="submit" disabled={save.isPending}>{save.isPending ? t('common.saving') : t('common.save')}</Button>
        <Button type="button" variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
        {item && (
          <Button type="button" variant="outline" className="text-red-600" disabled={destroy.isPending} onClick={remove}>
            {t('common.delete')}
          </Button>
        )}
      </SheetFooter>
    </form>
  )
}
