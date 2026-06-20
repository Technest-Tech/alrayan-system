'use client'
import { formatMoney } from '@/lib/money'
import { PayrollStatusBadge } from '@/components/system/payroll/PayrollStatusBadge'
import type { Payroll } from '@/types/system/payroll'
import { useI18n } from '@/lib/system/i18n'

interface SalaryStatementProps {
  payroll: Payroll
}

function periodLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

export function SalaryStatement({ payroll }: SalaryStatementProps) {
  const { t } = useI18n()
  const adjustments = payroll.adjustments ?? []
  const bonuses = adjustments.filter(a => a.type === 'bonus')
  const deductions = adjustments.filter(a => a.type === 'deduction')
  const breakdown = payroll.breakdown_by_duration ?? {}

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b bg-gray-50 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">{t('teachers.salaryStatement')}</p>
          <h3 className="text-base font-semibold">{periodLabel(payroll.period_year, payroll.period_month)}</h3>
        </div>
        <PayrollStatusBadge status={payroll.status} />
      </div>

      <div className="px-5 py-4 divide-y divide-gray-100 text-sm">
        {/* Sessions */}
        <div className="pb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">{t('common.sessions')}</p>
          <div className="space-y-1.5">
            {Object.entries(breakdown).map(([dur, sessions]) => (
              <div key={dur} className="flex justify-between text-gray-700">
                <span>{t('teacher.salary.durationMin', { n: String(dur) })}</span>
                <span className="tabular-nums">{String(sessions)} {sessions !== 1 ? t('teachers.salarySessionPlural') : t('teachers.salarySessionSingular')}</span>
              </div>
            ))}
            <div className="flex justify-between font-medium pt-1 border-t">
              <span>{t('common.total')}</span>
              <span className="tabular-nums">{t('teacher.salary.totalSessionsMinutes', { sessions: String(payroll.total_sessions), minutes: String(payroll.total_minutes) })}</span>
            </div>
          </div>
        </div>

        {/* Base salary */}
        <div className="py-4">
          <div className="flex justify-between font-medium">
            <span>{t('teachers.salaryBase')}</span>
            <span className="tabular-nums">{formatMoney(payroll.base_salary_minor, 'EGP')}</span>
          </div>
        </div>

        {/* Bonuses */}
        {bonuses.length > 0 && (
          <div className="py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">{t('teacher.salary.bonuses')}</p>
            <div className="space-y-1.5">
              {bonuses.map(adj => (
                <div key={adj.id} className="flex justify-between text-green-700">
                  <span>{adj.reason || adj.category}</span>
                  <span className="tabular-nums">+{formatMoney(adj.amount_minor, 'EGP')}</span>
                </div>
              ))}
              <div className="flex justify-between font-medium text-green-700 pt-1 border-t border-green-100">
                <span>{t('teachers.salaryTotalBonuses')}</span>
                <span className="tabular-nums">+{formatMoney(payroll.bonuses_minor, 'EGP')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Deductions */}
        {deductions.length > 0 && (
          <div className="py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">{t('teacher.salary.deductions')}</p>
            <div className="space-y-1.5">
              {deductions.map(adj => (
                <div key={adj.id} className="flex justify-between text-red-600">
                  <span>{adj.reason || adj.category}</span>
                  <span className="tabular-nums">-{formatMoney(adj.amount_minor, 'EGP')}</span>
                </div>
              ))}
              <div className="flex justify-between font-medium text-red-600 pt-1 border-t border-red-100">
                <span>{t('teachers.salaryTotalDeductions')}</span>
                <span className="tabular-nums">-{formatMoney(payroll.deductions_minor, 'EGP')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Net */}
        <div className="pt-4">
          <div className="flex justify-between text-base font-bold">
            <span>{t('teachers.salaryNet')}</span>
            <span className="tabular-nums">{formatMoney(payroll.net_salary_minor, 'EGP')}</span>
          </div>
        </div>
      </div>

      {/* Transfer info */}
      {payroll.transfer_reference && (
        <div className="px-5 py-3 border-t bg-green-50 text-xs text-green-700">
          {t('teachers.salaryTransferRef')}{' '}
          <span className="font-mono font-medium">{payroll.transfer_reference}</span>
          {payroll.transferred_at && (
            <span className="ml-2 text-green-500">
              ({new Date(payroll.transferred_at).toLocaleDateString('en-US', { dateStyle: 'medium' })})
            </span>
          )}
        </div>
      )}
    </div>
  )
}
