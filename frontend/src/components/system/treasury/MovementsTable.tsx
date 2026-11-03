'use client'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Pencil, Trash2 } from 'lucide-react'
import { useConfirm } from '@/components/system/primitives/ConfirmDialog'
import { useDeleteMovement } from '@/hooks/system/useTreasury'
import { formatMoney } from '@/lib/money'
import { useI18n } from '@/lib/system/i18n'
import { toastApiError } from '@/lib/system/treasury'
import type { TreasuryAccount, TreasuryMovement } from '@/types/system/treasury'

interface MovementsTableProps {
  rows:          TreasuryMovement[]
  loading?:      boolean
  /** Several accounts on one page: say which account each row is on. */
  showAccount?:  boolean
  /** One account's statement: show the balance after each movement. */
  showBalance?:  boolean
  canRecord:     boolean
  onEdit:        (row: TreasuryMovement) => void
  /** Closes the statement with the balance the account started from. */
  openingRow?:   TreasuryAccount | null
}

export function MovementsTable({ rows, loading, showAccount, showBalance, canRecord, onEdit, openingRow }: MovementsTableProps) {
  const { t } = useI18n()
  const confirm = useConfirm()
  const remove = useDeleteMovement()

  async function handleDelete(row: TreasuryMovement) {
    const isTransfer = row.kind === 'transfer'
    const ok = await confirm({
      title:        t(isTransfer ? 'treasury.movement.deleteTransferConfirm' : 'treasury.movement.deleteConfirm'),
      description:  t(isTransfer ? 'treasury.movement.deleteTransferConfirmBody' : 'treasury.movement.deleteConfirmBody'),
      confirmLabel: t('common.delete'),
      variant:      'danger',
    })
    if (!ok) return

    try {
      await remove.mutateAsync(row.id)
      toast.success(t('treasury.movement.deleted'))
    } catch (err) {
      toastApiError(err, t('treasury.saveError'))
    }
  }

  const columns = 4 + (showAccount ? 1 : 0) + (showBalance ? 1 : 0) + (canRecord ? 1 : 0)

  return (
    <div className="rounded-2xl overflow-x-auto" style={{ border: '1px solid rgb(var(--border-default))' }}>
      <table className="w-full text-sm min-w-[640px]">
        <thead style={{ background: 'rgb(var(--surface-card-2))' }}>
          <tr>
            <th className="px-4 py-3 text-left font-medium whitespace-nowrap">{t('common.date')}</th>
            <th className="px-4 py-3 text-left font-medium">{t('accounting.common.description')}</th>
            {showAccount && <th className="px-4 py-3 text-left font-medium">{t('treasury.movement.account')}</th>}
            <th className="px-4 py-3 text-right font-medium">{t('treasury.statement.in')}</th>
            <th className="px-4 py-3 text-right font-medium">{t('treasury.statement.out')}</th>
            {showBalance && <th className="px-4 py-3 text-right font-medium">{t('treasury.balance')}</th>}
            {canRecord && <th className="px-4 py-3" />}
          </tr>
        </thead>
        <tbody>
          {loading && rows.length === 0 && Array.from({ length: 4 }).map((_, i) => (
            <tr key={i} style={{ borderTop: '1px solid rgb(var(--border-default))' }}>
              <td colSpan={columns} className="px-4 py-3">
                <div className="h-4 animate-pulse rounded" style={{ background: 'rgb(var(--surface-card-2))' }} />
              </td>
            </tr>
          ))}

          {rows.map(row => (
            <tr key={row.id} style={{ borderTop: '1px solid rgb(var(--border-default))' }}>
              <td className="px-4 py-3 whitespace-nowrap tabular-nums">{row.occurred_on}</td>
              <td className="px-4 py-3">
                <div className="flex items-start gap-2">
                  <MovementIcon row={row} />
                  <div className="min-w-0">
                    <p className="break-words">{row.description}</p>
                    <p className="text-xs opacity-50">
                      {[row.category ?? t(`treasury.kinds.${row.kind}`), row.counterparty, row.reference].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>
              </td>
              {showAccount && (
                <td className="px-4 py-3 whitespace-nowrap">
                  <Link href={`/treasury/${row.account.id}`} className="hover:underline">{row.account.name}</Link>
                </td>
              )}
              <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums text-emerald-600">
                {row.direction === 'in' ? formatMoney(row.amount_minor, row.account.currency) : ''}
              </td>
              <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums text-red-600">
                {row.direction === 'out' ? formatMoney(row.amount_minor, row.account.currency) : ''}
              </td>
              {showBalance && (
                <td className={`px-4 py-3 text-right whitespace-nowrap tabular-nums font-medium ${(row.balance_after_minor ?? 0) < 0 ? 'text-red-600' : ''}`}>
                  {formatMoney(row.balance_after_minor ?? 0, row.account.currency)}
                </td>
              )}
              {canRecord && (
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <RowActions row={row} onEdit={onEdit} onDelete={handleDelete} />
                </td>
              )}
            </tr>
          ))}

          {!loading && rows.length === 0 && !openingRow && (
            <tr>
              <td colSpan={columns} className="px-4 py-8 text-center opacity-40">{t('treasury.statement.noMovements')}</td>
            </tr>
          )}

          {openingRow && (
            <tr style={{ borderTop: '1px solid rgb(var(--border-default))', background: 'rgb(var(--surface-card-2))' }}>
              <td className="px-4 py-3 whitespace-nowrap tabular-nums">{openingRow.opening_date}</td>
              <td className="px-4 py-3 font-medium" colSpan={3}>{t('treasury.account.openingBalance')}</td>
              <td className={`px-4 py-3 text-right whitespace-nowrap tabular-nums font-medium ${openingRow.opening_balance_minor < 0 ? 'text-red-600' : ''}`}>
                {formatMoney(openingRow.opening_balance_minor, openingRow.currency)}
              </td>
              {canRecord && <td />}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function MovementIcon({ row }: { row: TreasuryMovement }) {
  if (row.kind === 'transfer') return <ArrowLeftRight size={15} className="mt-0.5 shrink-0 opacity-50" />
  return row.direction === 'in'
    ? <ArrowDownLeft size={15} className="mt-0.5 shrink-0 text-emerald-600" />
    : <ArrowUpRight size={15} className="mt-0.5 shrink-0 text-red-600" />
}

function RowActions({ row, onEdit, onDelete }: {
  row:      TreasuryMovement
  onEdit:   (row: TreasuryMovement) => void
  onDelete: (row: TreasuryMovement) => void
}) {
  const { t } = useI18n()

  // An expense's movement belongs to the expense, so that's where it gets changed.
  if (row.kind === 'expense') {
    return row.expense_id ? (
      <Link href={`/accounting/expenses/${row.expense_id}`} className="text-xs opacity-60 hover:opacity-100 underline">
        {t('treasury.movement.openExpense')}
      </Link>
    ) : null
  }

  // Automatic rows follow their package or payroll, so they're changed from there.
  if (row.kind === 'student_payment' || row.kind === 'teacher_salary') {
    return (
      <Link href={row.kind === 'student_payment' ? '/payments' : '/payroll'} className="text-xs opacity-60 hover:opacity-100 underline">
        {t(row.kind === 'student_payment' ? 'treasury.movement.openPayments' : 'treasury.movement.openPayroll')}
      </Link>
    )
  }

  return (
    <div className="inline-flex items-center gap-1">
      {row.kind !== 'transfer' && (
        <button type="button" aria-label={t('common.edit')} title={t('common.edit')} onClick={() => onEdit(row)} className="p-1.5 rounded-lg opacity-50 hover:opacity-100">
          <Pencil size={14} />
        </button>
      )}
      <button type="button" aria-label={t('common.delete')} title={t('common.delete')} onClick={() => onDelete(row)} className="p-1.5 rounded-lg opacity-50 hover:opacity-100 hover:text-red-600">
        <Trash2 size={14} />
      </button>
    </div>
  )
}
