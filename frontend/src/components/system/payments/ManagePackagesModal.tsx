'use client'
import { useState } from 'react'
import { X, Pencil, Trash2, Check, CheckCircle2, RotateCcw, Package } from 'lucide-react'
import { toast } from 'sonner'
import {
  useStudentPackagesList, useUpdatePackage, useConfirmPackage, useDeletePackage,
} from '@/hooks/system/usePayments'
import { SearchableSelect } from '@/components/system/lessons/SearchableSelect'
import { ApiError } from '@/lib/system/api'
import { useI18n } from '@/lib/system/i18n'
import type { PackageRow, PackageStatus } from '@/types/system/payment'

/* ── Design tokens ─────────────────────────────────────── */
const BORDER   = 'rgb(var(--border-default,229 233 240))'
const NAVY     = 'rgb(11 31 58)'
const MUTED    = 'rgb(90 100 112)'
const TEAL_50  = '#F0FDFA'
const TEAL_100 = '#CCFBF1'
const TEAL_600 = '#0d9488'

const STATUS_OPTIONS: { value: PackageStatus; key: string }[] = [
  { value: 'pending',   key: 'status.pending'      },
  { value: 'paid',      key: 'payments.activePaid' },
  { value: 'suspended', key: 'status.suspended'    },
]

const STATUS_STYLE: Record<PackageStatus, { bg: string; color: string; key: string }> = {
  pending:   { bg: '#FEF2F2', color: '#B91C1C',  key: 'status.pending'      },
  paid:      { bg: '#111827', color: '#ffffff',  key: 'payments.activePaid' },
  suspended: { bg: '#F3F4F6', color: '#6B7280',  key: 'status.suspended'    },
}

function StatusPill({ status }: { status: PackageStatus }) {
  const { t } = useI18n()
  const s = STATUS_STYLE[status]
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ background: s.bg, color: s.color }}
    >
      {t(s.key)}
    </span>
  )
}

function fmt(minor: number, currency: string) {
  return `${currency} ${(minor / 100).toFixed(2)}`
}

/* ── Editable row ──────────────────────────────────────── */
interface EditState {
  package_hours: string
  tariff_at_time: string
  status: PackageStatus
  notes: string
}

function PackageRow({ pkg, onSaved }: { pkg: PackageRow; onSaved: () => void }) {
  const { t } = useI18n()
  const [editing, setEditing] = useState(false)
  const [edit, setEdit]       = useState<EditState>({
    package_hours:  String(pkg.package_hours),
    tariff_at_time: String(pkg.tariff_at_time / 100),
    status:         pkg.status,
    notes:          pkg.notes ?? '',
  })

  const update     = useUpdatePackage()
  const confirmPkg = useConfirmPackage()
  const del        = useDeletePackage()

  function startEdit() {
    setEdit({
      package_hours:  String(pkg.package_hours),
      tariff_at_time: String(pkg.tariff_at_time / 100),
      status:         pkg.status,
      notes:          pkg.notes ?? '',
    })
    setEditing(true)
  }

  async function save() {
    const hours  = parseInt(edit.package_hours, 10)
    const tariff = Math.round(parseFloat(edit.tariff_at_time) * 100)
    if (isNaN(hours) || hours < 1) { toast.error(t('payments.errHoursMin')); return }
    if (isNaN(tariff) || tariff < 0) { toast.error(t('payments.errInvalidAmount')); return }

    try {
      await update.mutateAsync({
        id:             pkg.id,
        package_hours:  hours,
        tariff_at_time: tariff,
        status:         edit.status,
        notes:          edit.notes || undefined,
      })
      toast.success(t('payments.toastUpdated'))
      setEditing(false)
      onSaved()
    } catch {
      toast.error(t('payments.errSaveFailed'))
    }
  }

  async function handleConfirm() {
    try {
      await confirmPkg.mutateAsync(pkg.id)
      toast.success(t('payments.toastMarkedPaid'))
      onSaved()
    } catch {
      toast.error(t('payments.errConfirmFailed'))
    }
  }

  async function handleDelete() {
    if (!window.confirm(t('payments.confirmDelete', { number: String(pkg.package_number) }))) return
    try {
      const result = await del.mutateAsync(pkg.id)
      // Still holds lessons → the engine rebuilt it; say so instead of claiming success.
      if (result.restored) toast.error(result.message)
      else toast.success(t('payments.toastDeleted'))
      onSaved()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t('payments.errDeleteFailed'))
    }
  }

  async function handleReset() {
    if (!window.confirm(t('payments.confirmReset'))) return
    try {
      await update.mutateAsync({ id: pkg.id, status: 'pending', needs_reconfirmation: false })
      toast.success(t('payments.toastReset'))
      onSaved()
    } catch {
      toast.error(t('payments.errResetFailed'))
    }
  }

  const isLoading = update.isPending || confirmPkg.isPending || del.isPending

  if (editing) {
    return (
      <tr style={{ background: TEAL_50 }}>
        {/* Package # */}
        <td className="px-3 py-2.5 text-sm font-semibold" style={{ color: NAVY }}>
          {pkg.package_number === 0 ? t('users.downPayment') : `#${pkg.package_number}`}
        </td>
        {/* Hours */}
        <td className="px-3 py-2.5">
          <input
            type="number"
            min={1}
            value={edit.package_hours}
            onChange={e => setEdit(p => ({ ...p, package_hours: e.target.value }))}
            className="w-16 px-2 py-1.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-[#0d9488] bg-white"
            style={{ borderColor: TEAL_100 }}
          />
        </td>
        {/* Amount */}
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium" style={{ color: MUTED }}>{pkg.currency}</span>
            <input
              type="number"
              min={0}
              step={0.01}
              value={edit.tariff_at_time}
              onChange={e => setEdit(p => ({ ...p, tariff_at_time: e.target.value }))}
              className="w-20 px-2 py-1.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-[#0d9488] bg-white"
              style={{ borderColor: TEAL_100 }}
            />
          </div>
        </td>
        {/* Status */}
        <td className="px-3 py-2.5">
          <SearchableSelect
            options={STATUS_OPTIONS.map(o => ({ value: o.value, label: t(o.key) }))}
            value={edit.status}
            onChange={v => setEdit(p => ({ ...p, status: v as PackageStatus }))}
            className="w-36"
          />
        </td>
        {/* Paid At */}
        <td className="px-3 py-2.5 text-sm" style={{ color: MUTED }}>
          {pkg.paid_at ?? '—'}
        </td>
        {/* Notes */}
        <td className="px-3 py-2.5">
          <input
            type="text"
            value={edit.notes}
            onChange={e => setEdit(p => ({ ...p, notes: e.target.value }))}
            placeholder={t('payments.notePlaceholder')}
            className="w-full px-2 py-1.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-[#0d9488] bg-white"
            style={{ borderColor: TEAL_100 }}
          />
        </td>
        {/* Actions */}
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-2">
            <button
              onClick={save}
              disabled={isLoading}
              className="p-1.5 rounded-lg transition-colors hover:bg-teal-100/60"
              aria-label={t('common.save')}
            >
              <Check size={15} style={{ color: TEAL_600 }} />
            </button>
            <button
              onClick={() => setEditing(false)}
              className="p-1.5 rounded-lg transition-colors hover:bg-red-50"
              aria-label={t('common.cancel')}
            >
              <X size={15} style={{ color: '#DC2626' }} />
            </button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className="hover:bg-black/[0.015] transition-colors" style={{ borderTop: `1px solid ${BORDER}` }}>
      <td className="px-3 py-3 text-sm font-semibold" style={{ color: NAVY }}>{pkg.package_number === 0 ? t('users.downPayment') : `#${pkg.package_number}`}</td>
      <td className="px-3 py-3 text-sm" style={{ color: NAVY }}>{pkg.package_hours}h</td>
      <td className="px-3 py-3 text-sm" style={{ color: NAVY }}>{fmt(pkg.tariff_at_time, pkg.currency)}</td>
      <td className="px-3 py-3"><StatusPill status={pkg.status} /></td>
      <td className="px-3 py-3 text-sm" style={{ color: MUTED }}>{pkg.paid_at ?? '—'}</td>
      <td className="px-3 py-3 text-sm max-w-[180px]">
        <span className="truncate block" style={{ color: MUTED }}>{pkg.notes ?? '—'}</span>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5">
          {pkg.status === 'pending' && (
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="p-1.5 rounded-lg transition-colors hover:bg-teal-50 group"
              aria-label={t('payments.markAsPaid')}
              title={t('payments.markAsPaid')}
            >
              <CheckCircle2 size={15} style={{ color: TEAL_600 }} />
            </button>
          )}
          {pkg.status === 'paid' && (
            <button
              onClick={handleReset}
              disabled={isLoading}
              className="p-1.5 rounded-lg transition-colors hover:bg-red-50"
              aria-label={t('payments.resetToPending')}
              title={t('payments.resetToPending')}
            >
              <RotateCcw size={15} style={{ color: '#DC2626' }} />
            </button>
          )}
          <button
            onClick={startEdit}
            className="p-1.5 rounded-lg transition-colors hover:bg-black/5"
            aria-label={t('payments.editPackage')}
          >
            <Pencil size={14} style={{ color: MUTED }} />
          </button>
          {/* Any bill can be deleted now, paid included. */}
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="p-1.5 rounded-lg transition-colors hover:bg-red-50"
            aria-label={t('payments.deletePackage')}
            title={t('payments.deletePackage')}
          >
            <Trash2 size={15} style={{ color: '#DC2626' }} />
          </button>
        </div>
      </td>
    </tr>
  )
}

/* ── Modal ─────────────────────────────────────────────── */
interface Props {
  studentId:   number | null
  studentName: string
  open:        boolean
  onClose:     () => void
}

export function ManagePackagesModal({ studentId, studentName, open, onClose }: Props) {
  const { t } = useI18n()
  const { data: packages = [], refetch } = useStudentPackagesList(studentId)
  const update = useUpdatePackage()

  const [noteText, setNoteText] = useState('')

  async function saveNote() {
    if (!noteText.trim() || !packages.length) return
    const latest = packages[packages.length - 1]
    try {
      await update.mutateAsync({ id: latest.id, notes: noteText.trim() })
      toast.success(t('payments.toastNoteSaved'))
      setNoteText('')
      refetch()
    } catch {
      toast.error(t('payments.errNoteFailed'))
    }
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div aria-hidden="true" className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-3xl max-h-[88vh] overflow-y-auto rounded-2xl"
          style={{ background: '#fff', boxShadow: '0 24px 64px rgb(0 0 0 / 0.2)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white z-10"
            style={{ borderColor: BORDER }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: TEAL_50 }}>
                <Package size={14} style={{ color: TEAL_600 }} />
              </div>
              <div>
                <h2 className="text-base font-semibold" style={{ color: NAVY }}>{t('payments.managePackages')}</h2>
                {studentName && (
                  <p className="text-xs mt-0.5" style={{ color: MUTED }}>{studentName}</p>
                )}
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors" aria-label={t('common.dismiss')}>
              <X size={18} />
            </button>
          </div>

          {/* Packages table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: `1px solid ${BORDER}` }}>
                  {[
                    t('payments.colPackageNo'),
                    t('payments.colHours'),
                    t('payments.colAmount'),
                    t('common.status'),
                    t('payments.colPaidAt'),
                    t('common.notes'),
                    t('common.actions'),
                  ].map(h => (
                    <th
                      key={h}
                      className="px-3 py-2.5 text-left text-xs font-semibold whitespace-nowrap"
                      style={{ color: MUTED }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {packages.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm" style={{ color: MUTED }}>
                      {t('payments.noPackages')}
                    </td>
                  </tr>
                ) : (
                  packages.map(pkg => (
                    <PackageRow key={pkg.id} pkg={pkg} onSaved={() => refetch()} />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Add Note footer */}
          <div className="px-5 py-4 border-t" style={{ borderColor: BORDER }}>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveNote()}
                  placeholder={t('payments.addNotePlaceholder')}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[#0d9488] transition-shadow"
                  style={{ borderColor: BORDER }}
                />
              </div>
              <button
                onClick={saveNote}
                disabled={!noteText.trim() || update.isPending}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-40 transition-opacity hover:opacity-90"
                style={{ background: TEAL_600 }}
              >
                {t('payments.saveNote')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
