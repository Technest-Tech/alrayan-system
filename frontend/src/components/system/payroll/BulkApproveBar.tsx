'use client'
import { useBulkApprove, useBulkTransfer } from '@/hooks/system/usePayrollActions'

interface BulkApproveBarProps {
  selectedIds: number[]
  onClear: () => void
}

export function BulkApproveBar({ selectedIds, onClear }: BulkApproveBarProps) {
  const bulkApprove = useBulkApprove()
  const bulkTransfer = useBulkTransfer()

  if (selectedIds.length === 0) return null

  async function handleApprove() {
    await bulkApprove.mutateAsync(selectedIds)
    onClear()
  }

  async function handleTransfer() {
    await bulkTransfer.mutateAsync(selectedIds)
    onClear()
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gray-800 text-white rounded-xl text-sm shadow-lg">
      <span className="font-medium">{selectedIds.length} selected</span>
      <div className="flex-1" />
      <button
        onClick={handleApprove}
        disabled={bulkApprove.isPending}
        className="px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 font-medium transition-colors disabled:opacity-50"
      >
        {bulkApprove.isPending ? 'Approving...' : 'Approve all'}
      </button>
      <button
        onClick={handleTransfer}
        disabled={bulkTransfer.isPending}
        className="px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 font-medium transition-colors disabled:opacity-50"
      >
        {bulkTransfer.isPending ? 'Processing...' : 'Mark transferred'}
      </button>
      <button
        onClick={onClear}
        className="px-3 py-1.5 rounded-lg bg-gray-600 hover:bg-gray-500 font-medium transition-colors"
      >
        Clear
      </button>
    </div>
  )
}
