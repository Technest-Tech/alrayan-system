'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { useCreateExpense, useExpenseCategories } from '@/hooks/system/useExpenses'

export default function NewExpensePage() {
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
      <PageHeader title="Add expense" description="Record a new academy expense." />

      <form onSubmit={submit} className="mt-6 max-w-lg space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select required value={form.category_id} onChange={e => set('category_id', e.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm" style={{ borderColor: 'rgb(var(--border-default))' }}>
            <option value="">Select…</option>
            {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Amount</label>
            <input required type="number" min="0.01" step="0.01" value={form.amount_minor}
              onChange={e => set('amount_minor', e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm" style={{ borderColor: 'rgb(var(--border-default))' }} />
          </div>
          <div className="w-28">
            <label className="block text-sm font-medium mb-1">Currency</label>
            <select value={form.currency} onChange={e => set('currency', e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm" style={{ borderColor: 'rgb(var(--border-default))' }}>
              {['EGP', 'USD', 'EUR', 'GBP'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <input required type="date" value={form.occurred_on} onChange={e => set('occurred_on', e.target.value)}
            className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: 'rgb(var(--border-default))' }} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <input required value={form.description} onChange={e => set('description', e.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm" style={{ borderColor: 'rgb(var(--border-default))' }} />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()}
            className="px-5 py-2 rounded-xl text-sm border" style={{ borderColor: 'rgb(var(--border-default))' }}>
            Cancel
          </button>
          <button type="submit" disabled={isPending}
            className="px-5 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: 'rgb(var(--accent))' }}>
            {isPending ? 'Saving…' : 'Save expense'}
          </button>
        </div>
      </form>
    </>
  )
}
