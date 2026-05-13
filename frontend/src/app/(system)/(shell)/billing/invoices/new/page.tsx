'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { useCreateInvoice } from '@/hooks/system/useCreateInvoice'

export default function NewInvoicePage() {
  const router = useRouter()
  const { mutateAsync, isPending } = useCreateInvoice()
  const [studentId, setStudentId] = useState('')
  const [type, setType] = useState<'advance' | 'reactivation'>('advance')
  const [effectiveFrom, setEffectiveFrom] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!studentId) return setError('Student ID is required.')
    setError(null)
    try {
      const invoice = await mutateAsync({
        student_id: parseInt(studentId, 10),
        type,
        effective_from: effectiveFrom || undefined,
      })
      router.push(`/billing/invoices/${invoice.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create invoice.')
    }
  }

  return (
    <>
      <PageHeader
        title="New Invoice"
        description="Create an advance or reactivation invoice for a student."
      />
      <div className="max-w-lg space-y-6">
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
          <input
            value={studentId}
            onChange={e => setStudentId(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2"
            placeholder="Enter student ID"
            style={{ focusRingColor: 'rgb(14 124 90)' }}
          />
          <p className="mt-1 text-xs text-gray-400">
            You can find the student ID on the student detail page.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Invoice type</label>
          <select
            value={type}
            onChange={e => setType(e.target.value as 'advance' | 'reactivation')}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="advance">Advance — pro-rata for remaining days this month</option>
            <option value="reactivation">Reactivation — outstanding balance + pro-rata</option>
          </select>
        </div>

        {type === 'advance' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Effective from (optional)
            </label>
            <input
              type="date"
              value={effectiveFrom}
              onChange={e => setEffectiveFrom(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-gray-400">
              Defaults to today if left blank.
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={isPending}
            className="px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
            style={{ background: 'rgb(14 124 90)' }}
          >
            {isPending ? 'Creating…' : 'Create invoice'}
          </button>
        </div>
      </div>
    </>
  )
}
