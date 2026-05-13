'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { MoneyDisplay } from '@/components/system/primitives/MoneyDisplay'
import { useExpenses, useExpenseCategories, useDeleteExpense } from '@/hooks/system/useExpenses'

export default function ExpensesPage() {
  const [filters, setFilters] = useState({ q: '' })
  const { data, isLoading } = useExpenses(filters)
  const { data: categories } = useExpenseCategories()
  const { mutate: deleteExpense } = useDeleteExpense()

  const expenses = data?.data ?? []

  return (
    <>
      <PageHeader title="Expenses" description="Track and categorize all academy expenses.">
        <Link href="/accounting/expenses/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
          style={{ background: 'rgb(var(--accent))' }}>
          <Plus size={16} />
          Add expense
        </Link>
      </PageHeader>

      <div className="flex gap-3 mt-6">
        <input
          type="text"
          placeholder="Search…"
          value={filters.q}
          onChange={e => setFilters(f => ({ ...f, q: e.target.value }))}
          className="rounded-xl border px-3 py-2 text-sm w-60"
          style={{ borderColor: 'rgb(var(--border-default))' }}
        />
        <select
          onChange={e => setFilters(f => ({ ...f, category_id: e.target.value || undefined } as typeof f))}
          className="rounded-xl border px-3 py-2 text-sm"
          style={{ borderColor: 'rgb(var(--border-default))' }}>
          <option value="">All categories</option>
          {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="mt-4 rounded-2xl overflow-hidden" style={{ border: '1px solid rgb(var(--border-default))' }}>
        <table className="w-full text-sm">
          <thead style={{ background: 'rgb(var(--surface-card-2))' }}>
            <tr>
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3 text-left font-medium">Category</th>
              <th className="px-4 py-3 text-left font-medium">Description</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} style={{ borderTop: '1px solid rgb(var(--border-default))' }}>
                {[1,2,3,4,5].map(j => <td key={j} className="px-4 py-3"><div className="h-4 animate-pulse rounded" style={{ background: 'rgb(var(--surface-card-2))' }} /></td>)}
              </tr>
            ))}
            {expenses.map(exp => (
              <tr key={exp.id} style={{ borderTop: '1px solid rgb(var(--border-default))' }}>
                <td className="px-4 py-3 whitespace-nowrap">{exp.occurred_on}</td>
                <td className="px-4 py-3">{exp.category?.name}</td>
                <td className="px-4 py-3 max-w-xs truncate">{exp.description}</td>
                <td className="px-4 py-3 text-right">
                  <MoneyDisplay value={exp.amount_minor} currency={exp.currency} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/accounting/expenses/${exp.id}`}
                    className="text-xs opacity-50 hover:opacity-100">Edit</Link>
                </td>
              </tr>
            ))}
            {!isLoading && expenses.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center opacity-40">No expenses found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
