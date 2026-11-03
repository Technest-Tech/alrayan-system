'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ListChecks, Plus } from 'lucide-react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { MoneyDisplay } from '@/components/system/primitives/MoneyDisplay'
import { useSystemUser } from '@/components/system/shell/SystemShell'
import { SelectInput, SimplePager, TextInput } from '@/components/system/treasury/fields'
import { useExpenses, useExpenseCategories } from '@/hooks/system/useExpenses'
import { useTreasuryAccounts } from '@/hooks/system/useTreasury'
import { useI18n } from '@/lib/system/i18n'
import { can } from '@/lib/system/permissions'

export default function ExpensesPage() {
  const { t } = useI18n()
  const user = useSystemUser()
  const canSeeAccounts = !!user && can(user, 'treasury.view')

  const [filters, setFilters] = useState({ q: '', category_id: '', account_id: '', page: 1 })
  const setFilter = (patch: Partial<typeof filters>) => setFilters(f => ({ ...f, page: 1, ...patch }))

  const { data, isLoading } = useExpenses(filters)
  const { data: categories } = useExpenseCategories()
  const { data: overview } = useTreasuryAccounts(canSeeAccounts)

  const expenses = data?.data ?? []

  return (
    <>
      <PageHeader title={t('accounting.expenses.title')} description={t('accounting.expenses.subtitle')}>
        <Link href="/accounting/expenses/items"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border"
          style={{ borderColor: 'rgb(var(--border-default))' }}>
          <ListChecks size={16} />
          {t('accounting.expenseItems.title')}
        </Link>
        <Link href="/accounting/expenses/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
          style={{ background: 'rgb(var(--accent))' }}>
          <Plus size={16} />
          {t('accounting.expenses.addExpense')}
        </Link>
      </PageHeader>

      <div className="flex flex-wrap gap-3 mt-6">
        <TextInput
          type="search"
          className="w-60"
          placeholder={t('accounting.expenses.searchPlaceholder')}
          value={filters.q}
          onChange={e => setFilter({ q: e.target.value })}
        />
        <SelectInput
          className="w-auto"
          aria-label={t('accounting.common.category')}
          value={filters.category_id}
          onChange={e => setFilter({ category_id: e.target.value })}
        >
          <option value="">{t('accounting.expenses.allCategories')}</option>
          {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </SelectInput>
        {canSeeAccounts && (
          <SelectInput
            className="w-auto"
            aria-label={t('accounting.expenses.paidFrom')}
            value={filters.account_id}
            onChange={e => setFilter({ account_id: e.target.value })}
          >
            <option value="">{t('treasury.statement.allAccounts')}</option>
            {overview?.data.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </SelectInput>
        )}
      </div>

      <div className="mt-4 rounded-2xl overflow-x-auto" style={{ border: '1px solid rgb(var(--border-default))' }}>
        <table className="w-full text-sm min-w-[640px]">
          <thead style={{ background: 'rgb(var(--surface-card-2))' }}>
            <tr>
              <th className="px-4 py-3 text-left font-medium">{t('common.date')}</th>
              <th className="px-4 py-3 text-left font-medium">{t('accounting.common.category')}</th>
              <th className="px-4 py-3 text-left font-medium">{t('accounting.common.description')}</th>
              <th className="px-4 py-3 text-left font-medium">{t('accounting.expenses.paidFrom')}</th>
              <th className="px-4 py-3 text-right font-medium">{t('accounting.common.amount')}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} style={{ borderTop: '1px solid rgb(var(--border-default))' }}>
                {[1,2,3,4,5,6].map(j => <td key={j} className="px-4 py-3"><div className="h-4 animate-pulse rounded" style={{ background: 'rgb(var(--surface-card-2))' }} /></td>)}
              </tr>
            ))}
            {expenses.map(exp => (
              <tr key={exp.id} style={{ borderTop: '1px solid rgb(var(--border-default))' }}>
                <td className="px-4 py-3 whitespace-nowrap">{exp.occurred_on}</td>
                <td className="px-4 py-3">{exp.category?.name}</td>
                <td className="px-4 py-3 max-w-xs truncate">{exp.description}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {exp.account
                    ? <Link href={`/treasury/${exp.account.id}`} className="hover:underline">{exp.account.name}</Link>
                    : <span className="opacity-40">—</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  <MoneyDisplay value={exp.amount_minor} currency={exp.currency} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/accounting/expenses/${exp.id}`}
                    className="text-xs opacity-50 hover:opacity-100">{t('common.edit')}</Link>
                </td>
              </tr>
            ))}
            {!isLoading && expenses.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center opacity-40">{t('accounting.expenses.noExpenses')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <SimplePager
        page={data?.meta.current_page ?? 1}
        lastPage={data?.meta.last_page ?? 1}
        onPage={page => setFilters(f => ({ ...f, page }))}
      />
    </>
  )
}
