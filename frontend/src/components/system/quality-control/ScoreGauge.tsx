'use client'
import { ratingColor, ratingFor } from '@/types/system/qualityControl'

/** Live score gauge shown in the evaluation modal header. */
export function ScoreGauge({ score }: { score: number }) {
  const color   = ratingColor(ratingFor(score))
  const penalty = 100 - score

  return (
    <div className="flex items-center gap-3 min-w-[150px]">
      <div className="flex-1">
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${score}%`, background: color }}
          />
        </div>
        <p className="text-[11px] mt-1 tabular-nums" style={{ color: 'rgb(90 100 112)' }}>
          −{penalty}%
        </p>
      </div>
      <div className="text-2xl font-bold tabular-nums" style={{ color }}>
        {Math.round(score)}%
      </div>
    </div>
  )
}
