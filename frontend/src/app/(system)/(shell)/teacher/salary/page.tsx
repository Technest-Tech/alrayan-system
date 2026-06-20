'use client'
import { useState } from 'react'
import { Download } from 'lucide-react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { SalaryStatement } from '@/components/system/teacher/SalaryStatement'
import { SalaryHistoryTable } from '@/components/system/teacher/SalaryHistoryTable'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/system/api'
import { useI18n } from '@/lib/system/i18n'
import type { SalaryStatement as SalaryStatementType } from '@/types/system/payroll'
import type { Payroll } from '@/types/system/payroll'

function useMySalaryStatement(year?: number, month?: number) {
  const params = new URLSearchParams()
  if (year) params.set('year', String(year))
  if (month) params.set('month', String(month))
  const qs = params.toString()

  return useQuery({
    queryKey: ['system', 'my-salary', year, month],
    queryFn: () =>
      api<SalaryStatementType>(`/teachers/me/salary-statement${qs ? '?' + qs : ''}`),
  })
}

export default function TeacherSalaryPage() {
  const { t } = useI18n()
  const { data, isLoading, error } = useMySalaryStatement()
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null)

  const current = data?.current ?? null
  const history = data?.history ?? []

  const displayPayroll = selectedPayroll ?? current

  return (
    <>
      <PageHeader
        title={t('teacher.salary.title')}
        description={t('teacher.salary.description')}
        actions={
          displayPayroll && (
            <a
              href={`/api/system/payrolls/${displayPayroll.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <Download size={14} />
              {t('teacher.salary.downloadPdf')}
            </a>
          )
        }
      />

      {isLoading ? (
        <div className="py-20 text-center text-sm opacity-40">{t('common.loading')}</div>
      ) : error ? (
        <div className="py-10 text-center text-sm text-red-500">{(error as Error).message}</div>
      ) : !current && history.length === 0 ? (
        <div className="py-20 text-center text-sm opacity-40">
          {t('teacher.salary.noData')}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current statement */}
          <div>
            {displayPayroll ? (
              <SalaryStatement payroll={displayPayroll} />
            ) : (
              <p className="text-sm opacity-40 py-10 text-center">
                {t('teacher.salary.noCurrentPayroll')}
              </p>
            )}
          </div>

          {/* History */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">{t('teacher.salary.history')}</p>
            <SalaryHistoryTable
              history={history}
              selectedId={displayPayroll?.id}
              onSelect={p => setSelectedPayroll(p)}
            />
          </div>
        </div>
      )}
    </>
  )
}
