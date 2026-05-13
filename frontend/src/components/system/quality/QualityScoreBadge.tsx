interface QualityScoreBadgeProps {
  score: number
}

function scoreClass(score: number): string {
  if (score >= 90) return 'bg-green-100 text-green-700'
  if (score >= 70) return 'bg-yellow-100 text-yellow-700'
  return 'bg-red-100 text-red-700'
}

export function QualityScoreBadge({ score }: QualityScoreBadgeProps) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${scoreClass(score)}`}>
      {score.toFixed(0)}
    </span>
  )
}
