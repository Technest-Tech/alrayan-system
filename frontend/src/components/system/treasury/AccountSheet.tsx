'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/components/system/primitives/ConfirmDialog'
import { useDeleteTreasuryAccount, useSaveTreasuryAccount } from '@/hooks/system/useTreasury'
import { useI18n } from '@/lib/system/i18n'
import { fromMinor, toMinor, todayIso, toastApiError } from '@/lib/system/treasury'
import { ACCOUNT_CURRENCIES, ACCOUNT_TYPES, type TreasuryAccount } from '@/types/system/treasury'
import { Field, SelectInput, TextAreaInput, TextInput } from './fields'

interface AccountSheetProps {
  open:     boolean
  onClose:  () => void
  account?: TreasuryAccount | null
  /** Called after the account stops existing, so a page showing it can leave. */
  onDeleted?: () => void
}

export function AccountSheet({ open, onClose, account, onDeleted }: AccountSheetProps) {
  const { t } = useI18n()
  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t(account ? 'treasury.account.editTitle' : 'treasury.account.newTitle')}</SheetTitle>
        </SheetHeader>
        {open && <AccountForm account={account} onClose={onClose} onDeleted={onDeleted} />}
      </SheetContent>
    </Sheet>
  )
}

function AccountForm({ account, onClose, onDeleted }: Omit<AccountSheetProps, 'open'>) {
  const { t } = useI18n()
  const confirm = useConfirm()
  const save = useSaveTreasuryAccount()
  const destroy = useDeleteTreasuryAccount()

  const [form, setForm] = useState({
    name:         account?.name ?? '',
    type:         account?.type ?? 'bank',
    currency:     account?.currency ?? 'EGP',
    opening:      account ? fromMinor(account.opening_balance_minor) : '',
    opening_date: account?.opening_date ?? todayIso(),
    identifier:   account?.identifier ?? '',
    notes:        account?.notes ?? '',
  })
  const set = (key: keyof typeof form, value: string) => setForm(f => ({ ...f, [key]: value }))

  // The currency can't change under existing amounts — the server refuses it too.
  const currencyLocked = (account?.transactions_count ?? 0) > 0

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const opening = form.opening.trim() === '' ? 0 : toMinor(form.opening)
    if (Number.isNaN(opening)) return

    try {
      await save.mutateAsync({
        id: account?.id,
        data: {
          name:                  form.name.trim(),
          type:                  form.type,
          currency:              form.currency,
          opening_balance_minor: opening,
          opening_date:          form.opening_date,
          identifier:            form.identifier.trim() || null,
          notes:                 form.notes.trim() || null,
        },
      })
      toast.success(t('treasury.account.saved'))
      onClose()
    } catch (err) {
      toastApiError(err, t('treasury.saveError'))
    }
  }

  async function setActive(active: boolean) {
    if (!account) return
    if (!active) {
      const ok = await confirm({
        title:        t('treasury.account.archiveConfirm'),
        description:  t('treasury.account.archiveConfirmBody'),
        confirmLabel: t('treasury.account.archive'),
      })
      if (!ok) return
    }

    try {
      await save.mutateAsync({ id: account.id, data: { is_active: active } })
      toast.success(t('treasury.account.saved'))
      onClose()
    } catch (err) {
      toastApiError(err, t('treasury.saveError'))
    }
  }

  async function remove() {
    if (!account) return
    const ok = await confirm({
      title:        t('treasury.account.deleteConfirm', { name: account.name }),
      description:  t('treasury.account.deleteConfirmBody'),
      confirmLabel: t('common.delete'),
      variant:      'danger',
    })
    if (!ok) return

    try {
      await destroy.mutateAsync(account.id)
      toast.success(t('treasury.account.deleted'))
      onClose()
      onDeleted?.()
    } catch (err) {
      toastApiError(err, t('treasury.saveError'))
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 px-4 py-2">
      <Field label={t('treasury.account.name')}>
        <TextInput
          required
          maxLength={120}
          value={form.name}
          placeholder={t('treasury.account.namePlaceholder')}
          onChange={e => set('name', e.target.value)}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t('treasury.account.type')}>
          <SelectInput value={form.type} onChange={e => set('type', e.target.value)}>
            {ACCOUNT_TYPES.map(type => <option key={type} value={type}>{t(`treasury.types.${type}`)}</option>)}
          </SelectInput>
        </Field>
        <Field label={t('common.currency')} hint={currencyLocked ? t('treasury.account.currencyLocked') : undefined}>
          <SelectInput disabled={currencyLocked} value={form.currency} onChange={e => set('currency', e.target.value)}>
            {ACCOUNT_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </SelectInput>
        </Field>
      </div>

      <Field label={t('treasury.account.openingBalance')} hint={t('treasury.account.openingBalanceHint')}>
        <TextInput
          type="number"
          step="0.01"
          inputMode="decimal"
          value={form.opening}
          placeholder="0.00"
          onChange={e => set('opening', e.target.value)}
        />
      </Field>

      <Field label={t('treasury.account.openingDate')} hint={t('treasury.account.openingDateHint')}>
        <TextInput required type="date" value={form.opening_date} onChange={e => set('opening_date', e.target.value)} />
      </Field>

      <Field label={t('treasury.account.identifier')}>
        <TextInput
          maxLength={190}
          value={form.identifier}
          placeholder={t('treasury.account.identifierPlaceholder')}
          onChange={e => set('identifier', e.target.value)}
        />
      </Field>

      <Field label={t('common.notes')}>
        <TextAreaInput rows={2} maxLength={2000} value={form.notes} onChange={e => set('notes', e.target.value)} />
      </Field>

      <SheetFooter className="px-0">
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? t('common.saving') : t('common.save')}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>{t('common.cancel')}</Button>

        {account && account.transactions_count === 0 && (
          <Button type="button" variant="outline" className="text-red-600" disabled={destroy.isPending} onClick={remove}>
            {t('common.delete')}
          </Button>
        )}
        {account && account.is_active && (account.transactions_count ?? 0) > 0 && (
          <Button type="button" variant="outline" disabled={save.isPending} onClick={() => setActive(false)}>
            {t('treasury.account.archive')}
          </Button>
        )}
        {account && !account.is_active && (
          <Button type="button" variant="outline" disabled={save.isPending} onClick={() => setActive(true)}>
            {t('treasury.account.reactivate')}
          </Button>
        )}
      </SheetFooter>
    </form>
  )
}
