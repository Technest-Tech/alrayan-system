'use client'
import { useState } from 'react'
import { use } from 'react'
import Link from 'next/link'
import { ChevronRight, Plus } from 'lucide-react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { QualityScoreBadge } from '@/components/system/quality/QualityScoreBadge'
import { BonusRecommendationBanner } from '@/components/system/quality/BonusRecommendationBanner'
import { ManualReviewSheet } from '@/components/system/quality/ManualReviewSheet'
import { useQualityTeacher } from '@/hooks/system/useQualityTeacher'
import { useI18n } from '@/lib/system/i18n'
import type { QualityReview } from '@/types/system/quality'

interface Props {
  params: Promise<{ teacherId: string }>
}

const MONTH_KEYS = [
  'schedule.months.january', 'schedule.months.february', 'schedule.months.march',
  'schedule.months.april', 'schedule.months.may', 'schedule.months.june',
  'schedule.months.july', 'schedule.months.august', 'schedule.months.september',
  'schedule.months.october', 'schedule.months.november', 'schedule.months.december',
]

function ScoreCard({ label, score }: { label: string; score: number }) {
  return (
    <div className="rounded-lg border bg-white px-4 py-3 flex items-center justify-between gap-3">
      <span className="text-sm text-gray-600">{label}</span>
      <QualityScoreBadge score={score} />
    </div>
  )
}

export default function QualityTeacherPage({ params }: Props) {
  const { t } = useI18n()
  const { teacherId } = use(params)
  const { data, isLoading, error, refetch } = useQualityTeacher(teacherId)
  const [reviewSheetOpen, setReviewSheetOpen] = useState(false)

  const periodLabel = (year: number, month: number) =>
    `${t(MONTH_KEYS[month - 1])} ${year}`

  const reviews: QualityReview[] = data?.data ?? []
  const latest = reviews[0] ?? null

  const teacherName = t('quality.teacherFallback', { id: String(teacherId) })

  return (
    <>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/quality" className="hover:text-gray-900 transition-colors">{t('quality.title')}</Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 font-medium">{teacherName}</span>
      </div>

      <PageHeader
        title={teacherName}
        description={t('quality.reviewHistoryDescription')}
        actions={
          <button
            onClick={() => setReviewSheetOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'rgb(14 124 90)' }}
          >
            <Plus size={14} />
            {t('quality.submitManualReview')}
          </button>
        }
      />

      {isLoading ? (
        <div className="py-20 text-center text-sm opacity-40">{t('common.loading')}</div>
      ) : error ? (
        <div className="py-10 text-center text-sm text-red-500">{(error as Error).message}</div>
      ) : (
        <div className="space-y-6">
          {/* Current score card */}
          {latest && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
                {t('quality.latestScore')} — {periodLabel(latest.period_year, latest.period_month)}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <ScoreCard label={t('quality.metrics.attendance')} score={latest.attendance_score} />
                <ScoreCard label={t('quality.metrics.reports')} score={latest.reports_score} />
                <ScoreCard label={t('quality.metrics.retention')} score={latest.retention_score} />
                <ScoreCard label={t('quality.metrics.punctuality')} score={latest.punctuality_score} />
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-gray-50 border px-4 py-3">
                <span className="text-sm font-medium text-gray-700">{t('quality.metrics.overall')}</span>
                <QualityScoreBadge score={latest.overall_score} />
                <span className="text-xs text-gray-400 ml-auto">
                  {t(latest.source === 'manual' ? 'quality.source.manualReview' : 'quality.source.autoReview')}
                </span>
              </div>
            </div>
          )}

          {/* Bonus recommendation banner */}
          {latest && latest.bonus_recommendation_minor > 0 && (
            <BonusRecommendationBanner
              review={latest}
              teacherId={teacherId}
              onApplied={() => refetch()}
            />
          )}

          {/* Review history */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">{t('quality.reviewHistory')}</p>
            {reviews.length === 0 ? (
              <p className="py-8 text-center text-sm opacity-40">{t('quality.noReviews')}</p>
            ) : (
              <div className="rounded-xl border overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{t('quality.period')}</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">{t('quality.sourceLabel')}</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">{t('quality.metrics.overall')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{t('common.notes')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {reviews.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium">
                          {periodLabel(r.period_year, r.period_month)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${r.source === 'manual' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                            {t(r.source === 'manual' ? 'quality.source.manual' : 'quality.source.auto')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <QualityScoreBadge score={r.overall_score} />
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">
                          {r.notes ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      <ManualReviewSheet
        teacherId={teacherId}
        open={reviewSheetOpen}
        onClose={() => setReviewSheetOpen(false)}
        onSuccess={() => refetch()}
      />
    </>
  )
}
