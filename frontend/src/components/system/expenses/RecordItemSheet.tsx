'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Field, SelectInput, TextInput } from '@/components/system/treasury/fields'
import { useRecordExpenseItem } from '@/hooks/system/useExpenses'
import { useI18n } from '@/lib/system/i18n'
import { fromMinor, toMinor, todayIso, toastApiError } from '@/lib/system/treasury'
import type { ExpenseItem } from '@/types/system/expense'
import type { TreasuryAccount } from '@/types/system/treasury'

interface RecordItemSheetProps {
  item:     ExpenseItem | null
  month:    string
  accounts: TreasuryAccount[]
  /** Without treasury rights the expense is recorded without touching any account. */
  canUseAccounts: boolean
  onClose:  () => void
}

export function RecordItemSheet({ item, month, accounts, canUseAccounts, onClose }: RecordItemSheetProps) {
  const { t } = useI18n()
  return (
    <Sheet open={!!item} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{item ? t('accounting.expenseItems.recordTitle', { name: item.name, month }) : ''}</SheetTitle>
        </SheetHeader>
        {item && (
          <RecordForm key={item.id} item={item} month={month} accounts={accounts} canUseAccounts={canUseAccounts} onClose={onClose} />
        )}
      </SheetContent>
    </Sheet>
  )
}

function RecordForm({ item, month, accounts, canUseAccounts, onClose }: Omit<RecordItemSheetProps, 'item'> & { item: ExpenseItem }) {
  const { t } = useI18n()
  const record = useRecordExpenseItem()

  const active = accounts.filter(a => a.is_active)
  const defaultAccount = canUseAccounts && item.default_account?.is_active
    ? String(item.default_account.id)
    : ''

  const [accountId, setAccountId] = useState(defaultAccount)
  const [occurredOn, setOccurredOn] = useState(todayIso())
  const [description, setDescription] = useState(item.name)
  const [amount, setAmount] = useState(fromMinor(item.default_amount_minor))

  const account = active.find(a => String(a.id) === accountId)
  const currency = account?.currency ?? item.currency

  function chooseAccount(id: string) {
    const next = active.find(a => String(a.id) === id)
    const nextCurrency = next?.currency ?? item.currency
    // The item's amount is in its own currency: from another one it has to be typed in.
    if (nextCurrency !== currency) {
      setAmount(nextCurrency === item.currency ? fromMinor(item.default_amount_minor) : '')
    }
    setAccountId(id)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()

    const minor = toMinor(amount)
    if (Number.isNaN(minor) || minor <= 0) {
      toast.error(t('treasury.movement.amountRequired'))
      return
    }

    try {
      await record.mutateAsync({
        id: item.id,
        data: {
          month,
          occurred_on:  occurredOn,
          amount_minor: minor,
          account_id:   accountId ? Number(accountId) : null,
          description:  description.trim() || item.name,
        },
      })
      toast.success(t('accounting.expenseItems.recorded'))
      onClose()
    } catch (err) {
      toastApiError(err, t('treasury.saveError'))
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 px-4 py-2">
      {canUseAccounts && (
        <Field
          label={t('accounting.expenses.paidFrom')}
          hint={t(accountId ? 'accounting.expenses.paidFromHint' : 'accounting.expenses.noAccountHint')}
        >
          <SelectInput value={accountId} onChange={e => chooseAccount(e.target.value)}>
            <option value="">{t('accounting.expenses.noAccount')}</option>
            {active.map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
          </SelectInput>
        </Field>
      )}

      <Field
        label={`${t('accounting.common.amount')} (${currency})`}
        hint={currency !== item.currency && item.default_amount_minor
          ? t('accounting.expenseItems.otherCurrencyHint', { amount: `${fromMinor(item.default_amount_minor)} ${item.currency}`, currency })
          : undefined}
      >
        <TextInput required type="number" min="0.01" step="0.01" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} />
      </Field>

      <Field label={t('accounting.expenseItems.paidOn')}>
        <TextInput required type="date" value={occurredOn} onChange={e => setOccurredOn(e.target.value)} />
      </Field>

      <Field label={t('accounting.common.description')}>
        <TextInput maxLength={255} value={description} onChange={e => setDescription(e.target.value)} />
      </Field>

      <SheetFooter className="px-0">
        <Button type="submit" disabled={record.isPending}>
          {record.isPending ? t('common.saving') : t('accounting.expenseItems.record')}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
      </SheetFooter>
    </form>
  )
}
