'use client'
import { Sparkles } from 'lucide-react'
import { formatMoney } from '@/lib/money'
import { useApplyBonus } from '@/hooks/system/useQualityTeacher'
import type { QualityReview } from '@/types/system/quality'

interface BonusRecommendationBannerProps {
  review: QualityReview
  teacherId: number | string
  onApplied?: () => void
}

export function BonusRecommendationBanner({
  review,
  teacherId,
  onApplied,
}: BonusRecommendationBannerProps) {
  const applyBonus = useApplyBonus()

  if (review.bonus_recommendation_minor <= 0) return null

  async function handleApply() {
    await applyBonus.mutateAsync({ reviewId: review.id, teacherId })
    onApplied?.()
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3">
      <Sparkles size={16} className="text-yellow-600 shrink-0" />
      <p className="flex-1 text-sm text-yellow-800">
        Recommended bonus:{' '}
        <strong>{formatMoney(review.bonus_recommendation_minor, 'EGP')}</strong>
      </p>
      <button
        onClick={handleApply}
        disabled={applyBonus.isPending}
        className="shrink-0 px-3 py-1.5 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-semibold transition-colors disabled:opacity-50"
      >
        {applyBonus.isPending ? 'Applying...' : 'Apply to payroll'}
      </button>
    </div>
  )
}
