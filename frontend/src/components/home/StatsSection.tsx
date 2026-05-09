'use client'

import { useCountUp } from '@/hooks/useCountUp'
import { Container } from '@/components/layout/Container'
import type { Stat } from '@/content/stats'

function parseStat(value: string): { num: number; suffix: string; decimals: number } {
  // e.g. '10,000+' → { num: 10000, suffix: '+', decimals: 0 }
  //      '4.9★'   → { num: 4.9,   suffix: '★', decimals: 1 }
  const digits = value.replace(/,/g, '').match(/[\d.]+/)
  const num = digits ? parseFloat(digits[0]) : 0
  const suffix = value.replace(/[\d,.]/g, '')
  const decimals = num % 1 !== 0 ? String(num).split('.')[1]?.length ?? 0 : 0
  return { num, suffix, decimals }
}

function StatItem({ value, label }: Stat) {
  const { num, suffix, decimals } = parseStat(value)
  const { count, elementRef } = useCountUp(num, { decimals })

  const display =
    decimals > 0
      ? count.toFixed(decimals)
      : count.toLocaleString()

  return (
    <div ref={elementRef as React.RefObject<HTMLDivElement>}>
      <dt
        className="heading-xl font-display text-secondary mb-2"
        aria-label={value}
      >
        <span aria-hidden="true">{display}{suffix}</span>
      </dt>
      <dd className="text-muted-text text-sm font-medium uppercase tracking-wide">{label}</dd>
    </div>
  )
}

export function StatsSection({ stats }: { stats: Stat[] }) {
  return (
    <section className="section bg-white">
      <Container>
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat) => (
            <StatItem key={stat.label} {...stat} />
          ))}
        </dl>
      </Container>
    </section>
  )
}
