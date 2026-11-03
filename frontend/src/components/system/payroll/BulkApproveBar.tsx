'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { ApiError } from '@/lib/system/api'
import { useBulkApprove, useBulkTransfer } from '@/hooks/system/usePayrollActions'
import { useI18n } from '@/lib/system/i18n'

interface BulkApproveBarProps {
  selectedIds: number[]
  onClear: () => void
}

export function BulkApproveBar({ selectedIds, onClear }: BulkApproveBarProps) {
  const { t } = useI18n()
  const bulkApprove = useBulkApprove()
  const bulkTransfer = useBulkTransfer()
  const [reference, setReference] = useState('')

  if (selectedIds.length === 0) return null

  async function handleApprove() {
    await bulkApprove.mutateAsync(selectedIds)
    onClear()
  }

  async function handleTransfer() {
    try {
      await bulkTransfer.mutateAsync({ ids: selectedIds, transfer_reference: reference.trim() })
      setReference('')
      onClear()
    } catch (e) {
      // All or nothing: one payroll that isn't approved yet rejects the whole batch.
      toast.error(e instanceof ApiError ? e.message : t('treasury.saveError'))
    }
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gray-800 text-white rounded-xl text-sm shadow-lg">
      <span className="font-medium">{t('payroll.selectedCount', { count: String(selectedIds.length) })}</span>
      <div className="flex-1" />
      <button
        onClick={handleApprove}
        disabled={bulkApprove.isPending}
        className="px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 font-medium transition-colors disabled:opacity-50"
      >
        {bulkApprove.isPending ? `${t('common.approve')}...` : t('payroll.approveAll')}
      </button>
      <input
        value={reference}
        onChange={e => setReference(e.target.value)}
        maxLength={200}
        aria-label={t('payroll.transferReference')}
        placeholder={t('payroll.transferReference')}
        className="w-44 px-3 py-1.5 rounded-lg bg-gray-700 text-white placeholder:text-gray-400 outline-none"
      />
      <button
        onClick={handleTransfer}
        disabled={bulkTransfer.isPending || !reference.trim()}
        className="px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 font-medium transition-colors disabled:opacity-50"
      >
        {bulkTransfer.isPending ? `${t('common.submitting')}...` : t('payroll.markTransferred')}
      </button>
      <button
        onClick={onClear}
        className="px-3 py-1.5 rounded-lg bg-gray-600 hover:bg-gray-500 font-medium transition-colors"
      >
        {t('payroll.clear')}
      </button>
    </div>
  )
}
