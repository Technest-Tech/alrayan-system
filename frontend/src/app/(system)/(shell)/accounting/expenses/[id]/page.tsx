'use client'
import { use } from 'react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { ExpenseForm } from '@/components/system/expenses/ExpenseForm'
import { useExpense } from '@/hooks/system/useExpenses'
import { useI18n } from '@/lib/system/i18n'

export default function ExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useI18n()
  const { id } = use(params)
  const { data: expense, isError } = useExpense(Number(id))

  if (isError) return <p className="mt-8 opacity-40 text-sm">{t('accounting.expenses.noExpenses')}</p>
  if (!expense) return <p className="mt-8 opacity-40 text-sm">{t('common.loading')}</p>

  return (
    <>
      <PageHeader title={t('accounting.expenses.editExpense')} description={`#${expense.id} · ${expense.occurred_on}`} />
      <ExpenseForm key={expense.id} expense={expense} />
    </>
  )
}
