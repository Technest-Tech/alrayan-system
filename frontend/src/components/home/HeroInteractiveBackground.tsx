'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

const FLOATING_SYMBOLS = [
  { symbol: '✦', left: '8%', top: '24%', size: 18, duration: 11, delay: -2, color: '#C0A854' },
  { symbol: '✧', left: '28%', top: '72%', size: 22, duration: 14, delay: -8, color: '#E3C875' },
  { symbol: '◆', left: '45%', top: '16%', size: 10, duration: 13, delay: -4, color: '#58B896' },
  { symbol: '✦', left: '57%', top: '78%', size: 16, duration: 12, delay: -7, color: '#C0A854' },
  { symbol: '✧', left: '72%', top: '28%', size: 24, duration: 15, delay: -11, color: '#E3C875' },
  { symbol: '◆', left: '86%', top: '65%', size: 9, duration: 10, delay: -5, color: '#58B896' },
  { symbol: '✦', left: '94%', top: '18%', size: 14, duration: 13, delay: -9, color: '#C0A854' },
] as const

const BURST_COLORS = ['#C0A854', '#F3D98B', '#58B896', '#FFFFFF'] as const
const PARTICLE_COUNT = 12

const SHOOTING_ACCENTS = [
  { top: '20%', width: 112, duration: 9, delay: -1 },
  { top: '48%', width: 150, duration: 12, delay: -7 },
  { top: '82%', width: 96, duration: 10, delay: -4 },
] as const

type Burst = {
  id: number
  x: number
  y: number
}

type AnimatedStyle = CSSProperties & Record<`--${string}`, string>

export function HeroInteractiveBackground() {
  const layerRef = useRef<HTMLDivElement>(null)
  const nextIdRef = useRef(0)
  const timersRef = useRef<number[]>([])
  const [bursts, setBursts] = useState<Burst[]>([])

  useEffect(() => {
    const layer = layerRef.current
    const hero = layer?.closest<HTMLElement>('section')
    if (!hero) return
    const heroElement: HTMLElement = hero

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    function celebrate(event: PointerEvent) {
      if (motionQuery.matches || (event.pointerType === 'mouse' && event.button !== 0)) return

      const bounds = heroElement.getBoundingClientRect()
      const burst = {
        id: nextIdRef.current++,
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      }

      setBursts((current) => [...current.slice(-4), burst])
      const timer = window.setTimeout(() => {
        setBursts((current) => current.filter(({ id }) => id !== burst.id))
      }, 1100)
      timersRef.current.push(timer)
    }

    heroElement.addEventListener('pointerdown', celebrate)
    const activeTimers = timersRef.current

    return () => {
      heroElement.removeEventListener('pointerdown', celebrate)
      activeTimers.forEach(window.clearTimeout)
    }
  }, [])

  return (
    <div
      ref={layerRef}
      className="pointer-events-none absolute inset-0 z-[2] overflow-hidden"
      aria-hidden="true"
    >
      {FLOATING_SYMBOLS.map((item, index) => (
        <span
          key={`${item.left}-${item.top}`}
          className="hero-floating-symbol absolute select-none"
          style={{
            left: item.left,
            top: item.top,
            color: item.color,
            fontSize: item.size,
            '--float-duration': `${item.duration}s`,
            '--float-delay': `${item.delay}s`,
            '--float-drift': `${index % 2 === 0 ? 26 : -22}px`,
            '--float-drift-soft': `${index % 2 === 0 ? 12 : -10}px`,
          } as AnimatedStyle}
        >
          {item.symbol}
        </span>
      ))}

      {SHOOTING_ACCENTS.map((accent) => (
        <span
          key={accent.top}
          className="hero-shooting-accent absolute left-0"
          style={{
            top: accent.top,
            width: accent.width,
            '--shoot-duration': `${accent.duration}s`,
            '--shoot-delay': `${accent.delay}s`,
          } as AnimatedStyle}
        >
          <span className="hero-shooting-line absolute inset-y-0 left-0 w-full" />
          <span className="hero-shooting-tip absolute right-0 top-1/2 size-3" />
        </span>
      ))}

      {bursts.map((burst) => (
        <span
          key={burst.id}
          className="absolute"
          style={{ left: burst.x, top: burst.y }}
        >
          <span className="hero-burst-ring absolute" />
          {Array.from({ length: PARTICLE_COUNT }, (_, index) => {
            const angle = (Math.PI * 2 * index) / PARTICLE_COUNT
            const distance = 38 + (index % 3) * 14
            const size = 4 + (index % 3) * 2

            return (
              <span
                key={index}
                className="hero-burst-particle absolute rounded-full"
                style={{
                  width: size,
                  height: size,
                  backgroundColor: BURST_COLORS[index % BURST_COLORS.length],
                  color: BURST_COLORS[index % BURST_COLORS.length],
                  '--burst-x': `${Math.cos(angle) * distance}px`,
                  '--burst-y': `${Math.sin(angle) * distance}px`,
                  '--burst-delay': `${(index % 3) * 24}ms`,
                } as AnimatedStyle}
              />
            )
          })}
        </span>
      ))}
    </div>
  )
}
