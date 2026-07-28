'use client'
import { useI18n } from '@/lib/system/i18n'

/**
 * The ladder is one sequence, so tiers are shaded by depth of the same brand
 * green rather than by seven unrelated hues — level 1 is the palest, the top
 * tier the strongest.
 */
export function tierTint(index: number, total = 7): number {
  return 0.12 + (index / Math.max(total - 1, 1)) * 0.68
}

export function TierBadge({ index, total = 7, label, size = 'md' }: {
  index: number
  total?: number
  label?: string
  size?: 'sm' | 'md'
}) {
  const { t } = useI18n()
  const alpha = tierTint(index, total)
  const dark  = alpha > 0.45

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold whitespace-nowrap ${
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      }`}
      style={{
        background: `rgb(14 124 90 / ${alpha})`,
        color: dark ? 'white' : 'rgb(11 60 45)',
      }}
    >
      {label ?? t('salaryTiers.levelN', { n: String(index + 1) })}
    </span>
  )
}
