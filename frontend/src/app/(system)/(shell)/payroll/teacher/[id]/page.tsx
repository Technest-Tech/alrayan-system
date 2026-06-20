'use client'
import { useState } from 'react'
import Link from 'next/link'
import { use } from 'react'
import { ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { SalaryHistoryTable } from '@/components/system/teacher/SalaryHistoryTable'
import { PayrollDetailPanel } from '@/components/system/payroll/PayrollDetailPanel'
import { usePayrolls } from '@/hooks/system/usePayrolls'
import { useI18n } from '@/lib/system/i18n'
import type { Payroll } from '@/types/system/payroll'

interface Props {
  params: Promise<{ id: string }>
}

function currentPeriod(): { year: number; month: number } {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

export default function TeacherPayrollPage({ params }: Props) {
  const { t } = useI18n()
  const { id } = use(params)
  const teacherId = Number(id)
  const { year, month } = currentPeriod()

  const { data, isLoading, refetch } = usePayrolls({
    teacher_id: teacherId,
    per_page: 24,
  })

  const payrolls = data?.data ?? []

  // default selected = current month or latest
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null)

  const current = payrolls.find(p => p.period_year === year && p.period_month === month)
    ?? payrolls[0]
    ?? null

  const activePayroll = selectedPayroll ?? current

  const teacherName = payrolls[0]?.teacher?.name ?? t('payroll.teacherFallback', { id: String(teacherId) })

  return (
    <>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/payroll" className="hover:text-gray-900 transition-colors">{t('payroll.title')}</Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 font-medium">{teacherName}</span>
      </div>

      <PageHeader title={teacherName} description={t('payroll.teacherPageDescription')} />

      {isLoading ? (
        <div className="py-20 text-center text-sm opacity-40">{t('common.loading')}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: history table */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">{t('payroll.history')}</p>
            <SalaryHistoryTable
              history={payrolls}
              selectedId={activePayroll?.id}
              onSelect={p => setSelectedPayroll(p)}
            />
          </div>

          {/* Right: detail panel */}
          <div>
            {activePayroll ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">{t('payroll.detailHeading')}</p>
                <PayrollDetailPanel
                  payroll={activePayroll}
                  onUpdated={() => refetch()}
                />
              </>
            ) : (
              <p className="text-sm opacity-40 py-10 text-center">{t('payroll.selectPeriodHint')}</p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
