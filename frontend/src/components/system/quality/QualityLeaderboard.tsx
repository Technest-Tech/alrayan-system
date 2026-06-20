'use client'
import Link from 'next/link'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { QualityScoreBadge } from './QualityScoreBadge'
import { useI18n } from '@/lib/system/i18n'
import type { QualityLeaderboardEntry } from '@/types/system/quality'

interface QualityLeaderboardProps {
  entries: QualityLeaderboardEntry[]
}

function TrendIcon({ trend }: { trend: number[] }) {
  if (trend.length < 2) return <Minus size={14} className="text-gray-400" />
  const last = trend[trend.length - 1]
  const prev = trend[trend.length - 2]
  if (last > prev) return <TrendingUp size={14} className="text-green-600" />
  if (last < prev) return <TrendingDown size={14} className="text-red-500" />
  return <Minus size={14} className="text-gray-400" />
}

export function QualityLeaderboard({ entries }: QualityLeaderboardProps) {
  const { t } = useI18n()

  if (entries.length === 0) {
    return <p className="py-10 text-center text-sm opacity-40">{t('quality.leaderboard.empty')}</p>
  }

  return (
    <div className="rounded-xl border overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">#</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{t('common.teacher')}</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">{t('quality.metrics.attendance')}</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">{t('quality.metrics.reports')}</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">{t('quality.metrics.retention')}</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">{t('quality.metrics.punctuality')}</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">{t('quality.metrics.overall')}</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">{t('quality.leaderboard.trend')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {entries.map((entry, idx) => {
            const review = entry.latest_review
            return (
              <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-400 tabular-nums">{idx + 1}</td>
                <td className="px-4 py-3 font-medium">
                  <Link
                    href={`/quality/${entry.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {entry.user.name ?? entry.name ?? t('quality.teacherFallback', { id: String(entry.id) })}
                  </Link>
                </td>
                <td className="px-4 py-3 text-center">
                  {review ? <QualityScoreBadge score={review.attendance_score} /> : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  {review ? <QualityScoreBadge score={review.reports_score} /> : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  {review ? <QualityScoreBadge score={review.retention_score} /> : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  {review ? <QualityScoreBadge score={review.punctuality_score} /> : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  {review ? <QualityScoreBadge score={review.overall_score} /> : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  <TrendIcon trend={entry.trend} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
