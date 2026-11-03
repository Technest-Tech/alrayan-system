'use client'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useSystemUser } from '@/components/system/shell/SystemShell'
import { useCreateExpense, useExpenseCategories } from '@/hooks/system/useExpenses'
import { useCreateTransfer, useSaveMovement } from '@/hooks/system/useTreasury'
import { useI18n } from '@/lib/system/i18n'
import { can } from '@/lib/system/permissions'
import { fromMinor, toMinor, todayIso, toastApiError } from '@/lib/system/treasury'
import type { MovementKind, TreasuryAccount, TreasuryMovement } from '@/types/system/treasury'
import { Field, SelectInput, TextInput } from './fields'

type Tab = 'in' | 'out' | 'transfer'

const IN_KINDS:  MovementKind[] = ['income', 'deposit', 'adjustment']
const OUT_KINDS: MovementKind[] = ['expense', 'withdrawal', 'adjustment']

interface MovementSheetProps {
  open:              boolean
  onClose:           () => void
  accounts:          TreasuryAccount[]
  defaultAccountId?: number
  /** A hand-entered movement to edit. Expenses and transfers aren't edited from here. */
  editing?:          TreasuryMovement | null
}

export function MovementSheet({ open, onClose, accounts, defaultAccountId, editing }: MovementSheetProps) {
  const { t } = useI18n()
  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t(editing ? 'treasury.movement.editTitle' : 'treasury.movement.addTitle')}</SheetTitle>
        </SheetHeader>
        {open && (
          <MovementForm accounts={accounts} defaultAccountId={defaultAccountId} editing={editing} onClose={onClose} />
        )}
      </SheetContent>
    </Sheet>
  )
}

function MovementForm({ accounts, defaultAccountId, editing, onClose }: Omit<MovementSheetProps, 'open'>) {
  const { t } = useI18n()
  const user = useSystemUser()
  const canExpense = !editing && !!user && can(user, 'expenses.create')

  const active = useMemo(() => accounts.filter(a => a.is_active), [accounts])
  const outKinds = canExpense ? OUT_KINDS : OUT_KINDS.filter(k => k !== 'expense')

  const [tab, setTab] = useState<Tab>(editing?.direction ?? 'in')
  const [form, setForm] = useState({
    account_id:    String(editing?.account.id ?? defaultAccountId ?? active[0]?.id ?? ''),
    to_account_id: '',
    kind:          (editing?.kind ?? 'income') as MovementKind,
    category_id:   '',
    amount:        fromMinor(editing?.amount_minor),
    received:      '',
    occurred_on:   editing?.occurred_on ?? todayIso(),
    description:   editing?.description ?? '',
    counterparty:  editing?.counterparty ?? '',
    reference:     editing?.reference ?? '',
  })
  const set = (key: keyof typeof form, value: string) => setForm(f => ({ ...f, [key]: value }))

  const { data: categories } = useExpenseCategories()
  const saveMovement = useSaveMovement()
  const createExpense = useCreateExpense()
  const createTransfer = useCreateTransfer()
  const pending = saveMovement.isPending || createExpense.isPending || createTransfer.isPending

  const account   = accounts.find(a => String(a.id) === form.account_id)
  const toAccount = accounts.find(a => String(a.id) === form.to_account_id)
  const crossCurrency = tab === 'transfer' && !!account && !!toAccount && account.currency !== toAccount.currency
  const isExpense = tab === 'out' && form.kind === 'expense'
  const kinds = tab === 'in' ? IN_KINDS : outKinds

  function switchTab(next: Tab) {
    setTab(next)
    setForm(f => ({ ...f, kind: next === 'out' ? outKinds[0] : 'income' }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()

    const amount = toMinor(form.amount)
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error(t('treasury.movement.amountRequired'))
      return
    }

    const common = {
      amount_minor: amount,
      occurred_on:  form.occurred_on,
      description:  form.description.trim(),
    }

    try {
      if (editing) {
        await saveMovement.mutateAsync({
          id: editing.id,
          data: {
            ...common,
            kind:         form.kind,
            counterparty: form.counterparty.trim() || null,
            reference:    form.reference.trim() || null,
          },
        })
      } else if (tab === 'transfer') {
        const received = crossCurrency ? toMinor(form.received) : null
        if (crossCurrency && (Number.isNaN(received) || (received ?? 0) <= 0)) {
          toast.error(t('treasury.movement.receivedRequired', { currency: toAccount?.currency ?? '' }))
          return
        }
        await createTransfer.mutateAsync({
          ...common,
          description:           common.description || `${account?.name} → ${toAccount?.name}`,
          from_account_id:       Number(form.account_id),
          to_account_id:         Number(form.to_account_id),
          received_amount_minor: received,
          reference:             form.reference.trim() || null,
        })
      } else if (isExpense) {
        await createExpense.mutateAsync({
          ...common,
          account_id:  Number(form.account_id),
          category_id: Number(form.category_id),
        })
      } else {
        await saveMovement.mutateAsync({
          data: {
            ...common,
            account_id:   Number(form.account_id),
            direction:    tab,
            kind:         form.kind,
            counterparty: form.counterparty.trim() || null,
            reference:    form.reference.trim() || null,
          },
        })
      }

      toast.success(t('treasury.movement.saved'))
      onClose()
    } catch (err) {
      toastApiError(err, t('treasury.saveError'))
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 px-4 py-2">
      {!editing && (
        <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-black/5">
          {(['in', 'out', 'transfer'] as Tab[]).map(option => (
            <button
              key={option}
              type="button"
              onClick={() => switchTab(option)}
              aria-pressed={tab === option}
              className={`py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === option ? 'bg-secondary text-white' : 'opacity-60 hover:opacity-100'}`}
            >
              {t(`treasury.movement.tabs.${option}`)}
            </button>
          ))}
        </div>
      )}

      <Field label={t(tab === 'transfer' ? 'treasury.movement.fromAccount' : 'treasury.movement.account')}>
        <SelectInput required disabled={!!editing} value={form.account_id} onChange={e => set('account_id', e.target.value)}>
          <option value="">{t('common.selectPlaceholder')}</option>
          {(editing ? accounts : active).map(a => (
            <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>
          ))}
        </SelectInput>
      </Field>

      {tab === 'transfer' && (
        <Field label={t('treasury.movement.toAccount')}>
          <SelectInput required value={form.to_account_id} onChange={e => set('to_account_id', e.target.value)}>
            <option value="">{t('common.selectPlaceholder')}</option>
            {active.filter(a => String(a.id) !== form.account_id).map(a => (
              <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>
            ))}
          </SelectInput>
        </Field>
      )}

      {tab !== 'transfer' && (
        <Field label={t('treasury.movement.kind')} hint={t(`treasury.kindHints.${form.kind}`)}>
          <SelectInput value={form.kind} onChange={e => set('kind', e.target.value)}>
            {kinds.map(kind => <option key={kind} value={kind}>{t(`treasury.kinds.${kind}`)}</option>)}
          </SelectInput>
        </Field>
      )}

      {isExpense && (
        <Field label={t('accounting.common.category')}>
          <SelectInput required value={form.category_id} onChange={e => set('category_id', e.target.value)}>
            <option value="">{t('common.selectPlaceholder')}</option>
            {categories?.filter(c => c.is_active).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </SelectInput>
        </Field>
      )}

      <div className={crossCurrency ? 'grid grid-cols-2 gap-3' : ''}>
        <Field label={`${t(tab === 'transfer' ? 'treasury.movement.amountSent' : 'accounting.common.amount')}${account ? ` (${account.currency})` : ''}`}>
          <TextInput required type="number" min="0.01" step="0.01" inputMode="decimal" value={form.amount} onChange={e => set('amount', e.target.value)} />
        </Field>
        {crossCurrency && (
          <Field label={`${t('treasury.movement.amountReceived')} (${toAccount?.currency})`}>
            <TextInput required type="number" min="0.01" step="0.01" inputMode="decimal" value={form.received} onChange={e => set('received', e.target.value)} />
          </Field>
        )}
      </div>
      {crossCurrency && <p className="-mt-2 text-xs opacity-50">{t('treasury.movement.crossCurrencyHint')}</p>}

      <Field label={t('common.date')}>
        <TextInput required type="date" value={form.occurred_on} onChange={e => set('occurred_on', e.target.value)} />
      </Field>

      <Field label={t('accounting.common.description')}>
        <TextInput
          required={tab !== 'transfer'}
          maxLength={isExpense ? 255 : 500}
          value={form.description}
          placeholder={t(tab === 'transfer' ? 'treasury.movement.transferDescriptionPlaceholder' : 'treasury.movement.descriptionPlaceholder')}
          onChange={e => set('description', e.target.value)}
        />
      </Field>

      {!isExpense && tab !== 'transfer' && (
        <Field label={t('treasury.movement.counterparty')}>
          <TextInput maxLength={190} value={form.counterparty} placeholder={t('treasury.movement.counterpartyPlaceholder')} onChange={e => set('counterparty', e.target.value)} />
        </Field>
      )}

      {!isExpense && (
        <Field label={t('treasury.movement.reference')}>
          <TextInput maxLength={190} value={form.reference} placeholder={t('treasury.movement.referencePlaceholder')} onChange={e => set('reference', e.target.value)} />
        </Field>
      )}

      <SheetFooter className="px-0">
        <Button type="submit" disabled={pending}>{pending ? t('common.saving') : t('common.save')}</Button>
        <Button type="button" variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
      </SheetFooter>
    </form>
  )
}
