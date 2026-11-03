'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useSaveTreasuryRouting, useTreasuryRouting } from '@/hooks/system/useTreasury'
import { useI18n } from '@/lib/system/i18n'
import { toastApiError } from '@/lib/system/treasury'
import type { TreasuryAccount, TreasuryRouting } from '@/types/system/treasury'
import { Field, SelectInput } from './fields'

type Audience = keyof TreasuryRouting['data']
type Draft = Record<Audience, Record<string, string>>

interface AutoPostingSheetProps {
  open:     boolean
  onClose:  () => void
  accounts: TreasuryAccount[]
}

export function AutoPostingSheet({ open, onClose, accounts }: AutoPostingSheetProps) {
  const { t } = useI18n()
  const { data } = useTreasuryRouting(open)

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t('treasury.autoPosting.title')}</SheetTitle>
        </SheetHeader>
        {open && data && <RoutingForm routing={data} accounts={accounts} onClose={onClose} />}
      </SheetContent>
    </Sheet>
  )
}

function asDraft(map: Record<string, number>): Record<string, string> {
  return Object.fromEntries(Object.entries(map).map(([currency, id]) => [currency, String(id)]))
}

function RoutingForm({ routing, accounts, onClose }: { routing: TreasuryRouting; accounts: TreasuryAccount[]; onClose: () => void }) {
  const { t } = useI18n()
  const save = useSaveTreasuryRouting()
  const [draft, setDraft] = useState<Draft>({
    students: asDraft(routing.data.students),
    teachers: asDraft(routing.data.teachers),
  })

  function choose(audience: Audience, currency: string, id: string) {
    setDraft(d => ({ ...d, [audience]: { ...d[audience], [currency]: id } }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()

    const payload = (audience: Audience) => Object.fromEntries(
      Object.entries(draft[audience]).map(([currency, id]) => [currency, id ? Number(id) : null]),
    )

    try {
      await save.mutateAsync({ students: payload('students'), teachers: payload('teachers') })
      toast.success(t('treasury.autoPosting.saved'))
      onClose()
    } catch (err) {
      toastApiError(err, t('treasury.saveError'))
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6 px-4 py-2">
      {(['students', 'teachers'] as Audience[]).map(audience => (
        <section key={audience} className="flex flex-col gap-3">
          <div>
            <h3 className="text-sm font-semibold">{t(`treasury.autoPosting.${audience}`)}</h3>
            <p className="text-xs opacity-50 mt-0.5">{t(`treasury.autoPosting.${audience}Hint`)}</p>
          </div>

          {/* Accounts' currencies too, so the first student in a new currency is already covered. */}
          {[...new Set([...routing.currencies[audience], ...accounts.filter(a => a.is_active).map(a => a.currency)])].sort().map(currency => {
            const options = accounts.filter(a => a.is_active && a.currency === currency)
            return (
              <Field
                key={currency}
                label={currency}
                hint={options.length === 0 ? t('treasury.autoPosting.noAccountInCurrency', { currency }) : undefined}
              >
                <SelectInput
                  disabled={options.length === 0}
                  value={draft[audience][currency] ?? ''}
                  onChange={e => choose(audience, currency, e.target.value)}
                >
                  <option value="">{t('treasury.autoPosting.off')}</option>
                  {options.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </SelectInput>
              </Field>
            )
          })}
        </section>
      ))}

      <p className="text-xs opacity-60">{t('treasury.autoPosting.fromNowOn')}</p>

      <SheetFooter className="px-0">
        <Button type="submit" disabled={save.isPending}>{save.isPending ? t('common.saving') : t('common.save')}</Button>
        <Button type="button" variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
      </SheetFooter>
    </form>
  )
}
