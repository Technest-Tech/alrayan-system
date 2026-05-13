'use client'

import { useCountUp } from '@/hooks/useCountUp'
import { Container } from '@/components/layout/Container'
import type { Stat } from '@/content/stats'

function parseStat(value: string): { num: number; suffix: string; decimals: number } {
  const digits = value.replace(/,/g, '').match(/[\d.]+/)
  const num = digits ? parseFloat(digits[0]) : 0
  const suffix = value.replace(/[\d,.]/g, '')
  const decimals = num % 1 !== 0 ? String(num).split('.')[1]?.length ?? 0 : 0
  return { num, suffix, decimals }
}

function StatItem({ value, label, description }: Stat) {
  const { num, suffix, decimals } = parseStat(value)
  const { count, elementRef } = useCountUp(num, { decimals })

  const display =
    decimals > 0
      ? count.toFixed(decimals)
      : count.toLocaleString()

  return (
    <div
      ref={elementRef as React.RefObject<HTMLDivElement>}
      className="text-center px-8 py-12"
    >
      <dt
        className="font-display font-semibold text-accent mb-2"
        style={{ fontSize: 'clamp(2.4rem, 3.8vw, 3.4rem)', lineHeight: 1.05 }}
        aria-label={value}
      >
        <span aria-hidden="true">{display}{suffix}</span>
      </dt>
      <dd>
        <p className="text-white font-semibold text-sm mb-1">{label}</p>
        {description && (
          <p className="text-white/45 text-xs leading-snug">{description}</p>
        )}
      </dd>
    </div>
  )
}

export function StatsSection({ stats }: { stats: Stat[] }) {
  return (
    <section className="relative bg-secondary overflow-hidden">
      {/* Subtle geometric pattern */}
      <div className="absolute inset-0 opacity-[0.04]" aria-hidden="true">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="stats-geo" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
              <circle cx="40" cy="40" r="22" fill="none" stroke="#F8F4ED" strokeWidth="0.6" />
              <circle cx="0"  cy="0"  r="3" fill="#F8F4ED" opacity="0.5" />
              <circle cx="80" cy="0"  r="3" fill="#F8F4ED" opacity="0.5" />
              <circle cx="0"  cy="80" r="3" fill="#F8F4ED" opacity="0.5" />
              <circle cx="80" cy="80" r="3" fill="#F8F4ED" opacity="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#stats-geo)" />
        </svg>
      </div>

      <Container className="relative">
        <dl className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-white/10">
          {stats.map((stat) => (
            <div key={stat.label} className="flex-1">
              <StatItem {...stat} />
            </div>
          ))}
        </dl>
      </Container>

    </section>
  )
}
