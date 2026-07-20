'use client'
import { ratingColor, ratingFor } from '@/types/system/qualityControl'
import { useI18n } from '@/lib/system/i18n'

/** Score pill + rating label (Excellent / Good / Fair / Poor). */
export function ScoreBadge({ score, showLabel = true }: { score: number; showLabel?: boolean }) {
  const { t } = useI18n()
  const rating = ratingFor(score)
  const color  = ratingColor(rating)

  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums"
        style={{ background: `${color}1a`, color }}
      >
        {Math.round(score)}%
      </span>
      {showLabel && (
        <span className="text-xs" style={{ color }}>{t(`qualityControl.rating.${rating}`)}</span>
      )}
    </span>
  )
}
