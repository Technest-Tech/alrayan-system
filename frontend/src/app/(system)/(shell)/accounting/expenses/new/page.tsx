'use client'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { ExpenseForm } from '@/components/system/expenses/ExpenseForm'
import { useI18n } from '@/lib/system/i18n'

export default function NewExpensePage() {
  const { t } = useI18n()

  return (
    <>
      <PageHeader title={t('accounting.expenses.addExpense')} description={t('accounting.expenses.newSubtitle')} />
      <ExpenseForm />
    </>
  )
}
