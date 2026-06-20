'use client'
import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { useExpenses, useUpdateExpense, useDeleteExpense, useExpenseCategories } from '@/hooks/system/useExpenses'
import { useI18n } from '@/lib/system/i18n'

export default function ExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useI18n()
  const { id } = use(params)
  const router = useRouter()
  const { data: listData } = useExpenses({ per_page: 1000 })
  const expense = listData?.data.find(e => String(e.id) === id)
  const { data: categories } = useExpenseCategories()
  const { mutateAsync: update, isPending } = useUpdateExpense(Number(id))
  const { mutateAsync: destroy } = useDeleteExpense()

  const [form, setForm] = useState<Record<string, string>>({})
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  if (!expense) return <p className="mt-8 opacity-40 text-sm">{t('common.loading')}</p>

  const current = { ...expense, ...form }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    await update(Object.keys(form).length ? {
      ...form,
      amount_minor: form.amount_minor ? Math.round(Number(form.amount_minor) * 100) : undefined,
      category_id:  form.category_id ? Number(form.category_id) : undefined,
    } : {})
    router.push('/accounting/expenses')
  }

  async function del() {
    if (!confirm(t('accounting.expenses.confirmDelete'))) return
    await destroy(Number(id))
    router.push('/accounting/expenses')
  }

  return (
    <>
      <PageHeader title={t('accounting.expenses.editExpense')} description={`#${expense.id} · ${expense.occurred_on}`} />

      <form onSubmit={save} className="mt-6 max-w-lg space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t('accounting.common.category')}</label>
          <select value={form.category_id ?? expense.category?.id} onChange={e => set('category_id', e.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm" style={{ borderColor: 'rgb(var(--border-default))' }}>
            {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('accounting.common.description')}</label>
          <input value={form.description ?? expense.description} onChange={e => set('description', e.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm" style={{ borderColor: 'rgb(var(--border-default))' }} />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={isPending}
            className="px-5 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: 'rgb(var(--accent))' }}>
            {isPending ? t('common.saving') : t('common.save')}
          </button>
          <button type="button" onClick={del}
            className="px-5 py-2 rounded-xl text-sm text-red-600 border border-red-200 hover:bg-red-50 transition-colors">
            {t('common.delete')}
          </button>
        </div>
      </form>
    </>
  )
}
