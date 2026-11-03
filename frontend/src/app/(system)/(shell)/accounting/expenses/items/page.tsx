'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ListChecks, Pencil, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ExpenseItemSheet } from '@/components/system/expenses/ExpenseItemSheet'
import { RecordItemSheet } from '@/components/system/expenses/RecordItemSheet'
import { MonthPicker } from '@/components/system/payroll/MonthPicker'
import { EmptyState } from '@/components/system/primitives/EmptyState'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { useSystemUser } from '@/components/system/shell/SystemShell'
import { useExpenseItems } from '@/hooks/system/useExpenses'
import { useTreasuryAccounts } from '@/hooks/system/useTreasury'
import { formatMoney } from '@/lib/money'
import { useI18n } from '@/lib/system/i18n'
import { can } from '@/lib/system/permissions'
import { currentMonth } from '@/lib/system/treasury'
import type { ExpenseItem, MoneyTotal } from '@/types/system/expense'

const border = { borderTop: '1px solid rgb(var(--border-default))' }

function moneyList(totals: MoneyTotal[]): string {
  return totals.map(x => formatMoney(x.total_minor, x.currency)).join(' · ')
}

export default function ExpenseItemsPage() {
  const { t } = useI18n()
  const user = useSystemUser()
  const canManage = !!user && can(user, 'expenses.manage_categories')
  const canRecord = !!user && can(user, 'expenses.create')
  const canSeeAccounts = !!user && can(user, 'treasury.view')
  const canUseAccounts = canSeeAccounts && !!user && can(user, 'treasury.record')

  const [month, setMonth] = useState(currentMonth())
  const [showInactive, setShowInactive] = useState(false)
  const [itemSheet, setItemSheet] = useState<{ open: boolean; item?: ExpenseItem | null }>({ open: false })
  const [recording, setRecording] = useState<ExpenseItem | null>(null)

  const { data, isLoading } = useExpenseItems(month)
  const { data: overview } = useTreasuryAccounts(canSeeAccounts)
  const accounts = overview?.data ?? []

  const items = data?.data ?? []
  const inactiveCount = items.filter(i => !i.is_active).length
  const shown = items.filter(i => i.is_active || showInactive)
  const fixed = shown.filter(i => i.type === 'fixed')
  const variable = shown.filter(i => i.type === 'variable')
  const summary = data?.summary

  const sectionProps = {
    canManage,
    canRecord,
    onRecord: setRecording,
    onEdit:   (item: ExpenseItem) => setItemSheet({ open: true, item }),
  }

  return (
    <>
      <Link href="/accounting/expenses" className="inline-flex items-center gap-1 text-sm opacity-60 hover:opacity-100 mb-3">
        <ArrowLeft size={14} /> {t('accounting.expenses.title')}
      </Link>

      <PageHeader title={t('accounting.expenseItems.title')} description={t('accounting.expenseItems.subtitle')}>
        <MonthPicker value={month} onChange={setMonth} />
        {canManage && (
          <Button onClick={() => setItemSheet({ open: true })}>
            <Plus size={16} /> {t('accounting.expenseItems.newItem')}
          </Button>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <TotalsTile label={t('accounting.expenseItems.expected')} totals={summary?.fixed_expected} />
        <TotalsTile label={t('accounting.expenseItems.stillDue')} totals={summary?.fixed_outstanding} />
        <TotalsTile label={t('accounting.expenseItems.recordedTotal')} totals={summary?.recorded} />
        <TotalsTile label={t('accounting.expenseItems.oneOff')} totals={summary?.one_off} />
      </div>

      {!isLoading && items.length === 0 && (
        <EmptyState
          icon={ListChecks}
          title={t('accounting.expenseItems.noItems')}
          description={t('accounting.expenseItems.noItemsHint')}
        />
      )}

      <ItemsSection title={t('accounting.expenseItems.fixedSection')} items={fixed} {...sectionProps} />
      <ItemsSection title={t('accounting.expenseItems.variableSection')} items={variable} {...sectionProps} />

      <div className="mt-4 flex flex-wrap gap-4 text-xs">
        {inactiveCount > 0 && (
          <button type="button" onClick={() => setShowInactive(v => !v)} className="opacity-60 hover:opacity-100 underline">
            {showInactive
              ? t('accounting.expenseItems.hideInactive')
              : t('accounting.expenseItems.showInactive', { count: String(inactiveCount) })}
          </button>
        )}
        {canManage && (
          <Link href="/settings/expense-categories" className="opacity-60 hover:opacity-100 underline">
            {t('accounting.expenseItems.manageCategories')}
          </Link>
        )}
      </div>

      <ExpenseItemSheet
        open={itemSheet.open}
        item={itemSheet.item}
        accounts={accounts}
        onClose={() => setItemSheet({ open: false })}
      />
      <RecordItemSheet
        item={recording}
        month={month}
        accounts={accounts}
        canUseAccounts={canUseAccounts}
        onClose={() => setRecording(null)}
      />
    </>
  )
}

function TotalsTile({ label, totals }: { label: string; totals?: MoneyTotal[] }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: 'rgb(var(--surface-card, 255 255 255))', border: '1px solid rgb(var(--border-default))' }}
    >
      <p className="text-xs font-medium opacity-50 uppercase tracking-wide">{label}</p>
      {!totals && <div className="mt-2 h-7 w-20 rounded-lg bg-black/5 animate-pulse" />}
      {totals?.length === 0 && <p className="mt-1 text-xl font-bold opacity-30">—</p>}
      {totals?.map(total => (
        <p key={total.currency} className="mt-1 text-xl font-bold tabular-nums">
          {formatMoney(total.total_minor, total.currency)}
        </p>
      ))}
    </div>
  )
}

interface ItemsSectionProps {
  title:     string
  items:     ExpenseItem[]
  canManage: boolean
  canRecord: boolean
  onRecord:  (item: ExpenseItem) => void
  onEdit:    (item: ExpenseItem) => void
}

function ItemsSection({ title, items, canManage, canRecord, onRecord, onEdit }: ItemsSectionProps) {
  const { t } = useI18n()
  if (items.length === 0) return null

  return (
    <section className="mt-6">
      <h2 className="mb-2 text-base font-semibold">{title}</h2>
      <div className="rounded-2xl overflow-x-auto" style={{ border: '1px solid rgb(var(--border-default))' }}>
        <table className="w-full text-sm min-w-[720px]">
          <thead style={{ background: 'rgb(var(--surface-card-2))' }}>
            <tr>
              <th className="px-4 py-3 text-left font-medium">{t('accounting.expenseItems.name')}</th>
              <th className="px-4 py-3 text-left font-medium">{t('accounting.expenses.paidFrom')}</th>
              <th className="px-4 py-3 text-right font-medium">{t('accounting.expenseItems.monthlyAmount')}</th>
              <th className="px-4 py-3 text-left font-medium">{t('common.status')}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {items.map(item => {
              const fixedAndPaid = item.type === 'fixed' && item.is_recorded
              return (
                <tr key={item.id} style={border} className={item.is_active ? '' : 'opacity-50'}>
                  <td className="px-4 py-3">
                    <p className="font-medium">
                      {item.name}
                      {item.auto_record && (
                        <span className="ms-2 inline-block rounded-md bg-black/5 px-1.5 py-0.5 text-[11px] font-medium opacity-70">
                          {t('accounting.expenseItems.auto')}
                        </span>
                      )}
                    </p>
                    <p className="text-xs opacity-50">{item.category.name}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {item.default_account?.name ?? <span className="opacity-40">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums">
                    {item.default_amount_minor
                      ? formatMoney(item.default_amount_minor, item.currency)
                      : <span className="opacity-40">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <ItemStatus item={item} />
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      {canRecord && item.is_active && !fixedAndPaid && (
                        <Button size="sm" variant="outline" onClick={() => onRecord(item)}>
                          {t('accounting.expenseItems.record')}
                        </Button>
                      )}
                      {canManage && (
                        <button
                          type="button"
                          aria-label={t('common.edit')}
                          title={t('common.edit')}
                          onClick={() => onEdit(item)}
                          className="p-1.5 rounded-lg opacity-50 hover:opacity-100"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function ItemStatus({ item }: { item: ExpenseItem }) {
  const { t } = useI18n()

  if (item.is_recorded) {
    return (
      <div className="text-xs">
        <p className={`font-medium tabular-nums ${item.type === 'fixed' ? 'text-emerald-600' : ''}`}>
          {item.type === 'fixed' ? `${t('accounting.expenseItems.paid')} · ` : ''}{moneyList(item.recorded)}
        </p>
        <p className="mt-0.5 flex flex-wrap gap-x-2">
          {item.expenses.map(expense => (
            <Link key={expense.id} href={`/accounting/expenses/${expense.id}`} className="opacity-60 hover:opacity-100 underline tabular-nums">
              {expense.occurred_on}
            </Link>
          ))}
        </p>
      </div>
    )
  }

  if (item.type === 'variable' || !item.is_expected) return <span className="text-xs opacity-40">—</span>

  if (item.is_overdue) {
    return <span className="text-xs font-medium text-red-600">{t('accounting.expenseItems.overdue', { date: item.due_on ?? '' })}</span>
  }

  return (
    <span className="text-xs opacity-70">
      {item.due_on ? t('accounting.expenseItems.dueOn', { date: item.due_on }) : t('accounting.expenseItems.due')}
    </span>
  )
}
