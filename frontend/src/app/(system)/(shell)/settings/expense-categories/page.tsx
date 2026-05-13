'use client'
import { useState } from 'react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { useExpenseCategories, useCreateExpenseCategory, useDeactivateExpenseCategory } from '@/hooks/system/useExpenses'

export default function ExpenseCategoriesPage() {
  const { data: categories, isLoading } = useExpenseCategories()
  const { mutateAsync: create, isPending: creating } = useCreateExpenseCategory()
  const { mutate: deactivate } = useDeactivateExpenseCategory()
  const [name, setName] = useState('')

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    await create({ name: name.trim() })
    setName('')
  }

  return (
    <>
      <PageHeader title="Expense Categories" description="Manage expense types." />

      <form onSubmit={add} className="mt-6 flex gap-3 max-w-md">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="New category name…"
          className="flex-1 rounded-xl border px-3 py-2 text-sm"
          style={{ borderColor: 'rgb(var(--border-default))' }}
        />
        <button type="submit" disabled={creating || !name.trim()}
          className="px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-40"
          style={{ background: 'rgb(var(--accent))' }}>
          {creating ? 'Adding…' : 'Add'}
        </button>
      </form>

      <div className="mt-4 rounded-2xl overflow-hidden max-w-md" style={{ border: '1px solid rgb(var(--border-default))' }}>
        <table className="w-full text-sm">
          <thead style={{ background: 'rgb(var(--surface-card-2))' }}>
            <tr>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading && Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} style={{ borderTop: '1px solid rgb(var(--border-default))' }}>
                {[1, 2, 3].map(j => (
                  <td key={j} className="px-4 py-3">
                    <div className="h-4 animate-pulse rounded" style={{ background: 'rgb(var(--surface-card-2))' }} />
                  </td>
                ))}
              </tr>
            ))}
            {categories?.map(c => (
              <tr key={c.id} style={{ borderTop: '1px solid rgb(var(--border-default))' }}>
                <td className="px-4 py-3">{c.name}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {c.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {c.is_active && !c.is_default && (
                    <button
                      onClick={() => confirm('Deactivate this category?') && deactivate(c.id)}
                      className="text-xs text-red-500 hover:underline">
                      Deactivate
                    </button>
                  )}
                  {c.is_default && <span className="text-xs opacity-30">default</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
