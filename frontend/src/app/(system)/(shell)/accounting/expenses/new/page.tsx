'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { useCreateExpense, useExpenseCategories } from '@/hooks/system/useExpenses'
import { useI18n } from '@/lib/system/i18n'

export default function NewExpensePage() {
  const { t } = useI18n()
  const router = useRouter()
  const { data: categories } = useExpenseCategories()
  const { mutateAsync, isPending } = useCreateExpense()
  const [form, setForm] = useState({
    category_id:  '',
    amount_minor: '',
    currency:     'EGP',
    description:  '',
    occurred_on:  new Date().toISOString().slice(0, 10),
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    await mutateAsync({
      ...form,
      category_id:  Number(form.category_id),
      amount_minor: Math.round(Number(form.amount_minor) * 100),
    })
    router.push('/accounting/expenses')
  }

  return (
    <>
      <PageHeader title={t('accounting.expenses.addExpense')} description={t('accounting.expenses.newSubtitle')} />

      <form onSubmit={submit} className="mt-6 max-w-lg space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t('accounting.common.category')}</label>
          <select required value={form.category_id} onChange={e => set('category_id', e.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm" style={{ borderColor: 'rgb(var(--border-default))' }}>
            <option value="">{t('accounting.common.selectPlaceholder')}</option>
            {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">{t('accounting.common.amount')}</label>
            <input required type="number" min="0.01" step="0.01" value={form.amount_minor}
              onChange={e => set('amount_minor', e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm" style={{ borderColor: 'rgb(var(--border-default))' }} />
          </div>
          <div className="w-28">
            <label className="block text-sm font-medium mb-1">{t('common.currency')}</label>
            <select value={form.currency} onChange={e => set('currency', e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm" style={{ borderColor: 'rgb(var(--border-default))' }}>
              {['EGP', 'USD', 'EUR', 'GBP'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('common.date')}</label>
          <input required type="date" value={form.occurred_on} onChange={e => set('occurred_on', e.target.value)}
            className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: 'rgb(var(--border-default))' }} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('accounting.common.description')}</label>
          <input required value={form.description} onChange={e => set('description', e.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm" style={{ borderColor: 'rgb(var(--border-default))' }} />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()}
            className="px-5 py-2 rounded-xl text-sm border" style={{ borderColor: 'rgb(var(--border-default))' }}>
            {t('common.cancel')}
          </button>
          <button type="submit" disabled={isPending}
            className="px-5 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: 'rgb(var(--accent))' }}>
            {isPending ? t('common.saving') : t('accounting.expenses.saveExpense')}
          </button>
        </div>
      </form>
    </>
  )
}
