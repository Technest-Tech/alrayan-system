'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/components/system/primitives/ConfirmDialog'
import { useSystemUser } from '@/components/system/shell/SystemShell'
import { Field, SelectInput, TextInput } from '@/components/system/treasury/fields'
import {
  useCreateExpense,
  useDeleteExpense,
  useExpenseCategories,
  useExpenseItems,
  useUpdateExpense,
} from '@/hooks/system/useExpenses'
import { useTreasuryAccounts } from '@/hooks/system/useTreasury'
import { useI18n } from '@/lib/system/i18n'
import { can } from '@/lib/system/permissions'
import { fromMinor, toMinor, todayIso, toastApiError } from '@/lib/system/treasury'
import type { Expense } from '@/types/system/expense'
import { ACCOUNT_CURRENCIES } from '@/types/system/treasury'

const LIST = '/accounting/expenses'

export function ExpenseForm({ expense }: { expense?: Expense }) {
  const { t } = useI18n()
  const router = useRouter()
  const confirm = useConfirm()
  const user = useSystemUser()

  // Paying from an account moves its balance, so that choice needs treasury rights.
  const canUseAccounts = !!user && can(user, 'treasury.view') && can(user, 'treasury.record')
  const { data: overview } = useTreasuryAccounts(canUseAccounts)
  const { data: categories } = useExpenseCategories()
  const { data: itemsData } = useExpenseItems()

  const create = useCreateExpense()
  const update = useUpdateExpense(expense?.id ?? 0)
  const destroy = useDeleteExpense()
  const pending = create.isPending || update.isPending

  const [form, setForm] = useState({
    account_id:  expense?.account ? String(expense.account.id) : '',
    item_id:     expense?.item ? String(expense.item.id) : '',
    category_id: expense ? String(expense.category.id) : '',
    amount:      fromMinor(expense?.amount_minor),
    currency:    expense?.currency ?? 'EGP',
    description: expense?.description ?? '',
    occurred_on: expense?.occurred_on ?? todayIso(),
  })
  const set = (key: keyof typeof form, value: string) => setForm(f => ({ ...f, [key]: value }))

  const accounts = (overview?.data ?? []).filter(a => a.is_active || a.id === expense?.account?.id)
  const items = (itemsData?.data ?? []).filter(i => i.is_active || i.id === expense?.item?.id)
  const fromAccount = form.account_id !== ''

  function chooseAccount(id: string) {
    const account = accounts.find(a => String(a.id) === id)
    setForm(f => {
      // The typed amount was in the old currency, so it can't carry over: 100 USD isn't 100 EGP.
      const currencyChanged = !!account && account.currency !== f.currency
      return {
        ...f,
        account_id: id,
        currency:   account?.currency ?? f.currency,
        amount:     currencyChanged ? '' : f.amount,
      }
    })
  }

  function chooseItem(id: string) {
    const item = items.find(i => String(i.id) === id)
    if (!item) {
      set('item_id', '')
      return
    }

    const account = canUseAccounts && item.default_account?.is_active ? item.default_account : null
    setForm(f => {
      const accountId = account ? String(account.id) : f.account_id
      const currency  = account?.currency ?? (f.account_id ? f.currency : item.currency)
      return {
        ...f,
        item_id:     id,
        category_id: item.category.id ? String(item.category.id) : f.category_id,
        description: f.description || item.name,
        account_id:  accountId,
        currency,
        amount:      item.default_amount_minor && item.currency === currency
          ? fromMinor(item.default_amount_minor)
          : f.amount,
      }
    })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()

    const amount = toMinor(form.amount)
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error(t('treasury.movement.amountRequired'))
      return
    }

    const data: Record<string, unknown> = {
      category_id:  Number(form.category_id),
      amount_minor: amount,
      currency:     form.currency,
      description:  form.description.trim(),
      occurred_on:  form.occurred_on,
    }
    if (canUseAccounts) data.account_id = fromAccount ? Number(form.account_id) : null
    // An unchanged item may have since been retired, which is fine for an old expense.
    if (form.item_id !== (expense?.item ? String(expense.item.id) : '')) {
      data.item_id = form.item_id ? Number(form.item_id) : null
    }

    try {
      if (expense) await update.mutateAsync(data)
      else await create.mutateAsync(data)
      toast.success(t('accounting.expenses.saved'))
      router.push(LIST)
    } catch (err) {
      toastApiError(err, t('treasury.saveError'))
    }
  }

  async function remove() {
    if (!expense) return
    const ok = await confirm({
      title:        t('accounting.expenses.confirmDelete'),
      description:  expense.account ? t('accounting.expenses.confirmDeleteBody', { account: expense.account.name }) : undefined,
      confirmLabel: t('common.delete'),
      variant:      'danger',
    })
    if (!ok) return

    try {
      await destroy.mutateAsync(expense.id)
      router.push(LIST)
    } catch (err) {
      toastApiError(err, t('treasury.saveError'))
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 max-w-lg space-y-4">
      {canUseAccounts && (
        <Field
          label={t('accounting.expenses.paidFrom')}
          hint={t(fromAccount ? 'accounting.expenses.paidFromHint' : 'accounting.expenses.noAccountHint')}
        >
          <SelectInput value={form.account_id} onChange={e => chooseAccount(e.target.value)}>
            <option value="">{t('accounting.expenses.noAccount')}</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
          </SelectInput>
        </Field>
      )}

      {items.length > 0 && (
        <Field label={t('accounting.expenses.item')}>
          <SelectInput value={form.item_id} onChange={e => chooseItem(e.target.value)}>
            <option value="">{t('accounting.expenses.noItem')}</option>
            {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </SelectInput>
        </Field>
      )}

      <Field label={t('accounting.common.category')}>
        <SelectInput required value={form.category_id} onChange={e => set('category_id', e.target.value)}>
          <option value="">{t('accounting.common.selectPlaceholder')}</option>
          {categories?.filter(c => c.is_active || c.id === expense?.category.id).map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </SelectInput>
      </Field>

      <div className="flex gap-3">
        <div className="flex-1">
          <Field label={t('accounting.common.amount')}>
            <TextInput required type="number" min="0.01" step="0.01" inputMode="decimal" value={form.amount} onChange={e => set('amount', e.target.value)} />
          </Field>
        </div>
        <div className="w-28">
          <Field label={t('common.currency')}>
            <SelectInput disabled={fromAccount} value={form.currency} onChange={e => set('currency', e.target.value)}>
              {ACCOUNT_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </SelectInput>
          </Field>
        </div>
      </div>

      <Field label={t('common.date')}>
        <TextInput required type="date" className="w-auto" value={form.occurred_on} onChange={e => set('occurred_on', e.target.value)} />
      </Field>

      <Field label={t('accounting.common.description')}>
        <TextInput required maxLength={255} value={form.description} onChange={e => set('description', e.target.value)} />
      </Field>

      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? t('common.saving') : t(expense ? 'common.save' : 'accounting.expenses.saveExpense')}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>{t('common.cancel')}</Button>
        {expense && (
          <Button type="button" variant="outline" className="text-red-600" disabled={destroy.isPending} onClick={remove}>
            {t('common.delete')}
          </Button>
        )}
      </div>
    </form>
  )
}
