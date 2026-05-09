'use client'

import { useEffect, useRef, useState } from 'react'

type Options = {
  duration?: number
  decimals?: number
}

export function useCountUp(target: number, { duration = 1500, decimals = 0 }: Options = {}) {
  const [count, setCount] = useState(0)
  const elementRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = elementRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          setCount(target)
          return
        }

        const start = performance.now()
        const tick = (now: number) => {
          const progress = Math.min((now - start) / duration, 1)
          // ease-out cubic
          const eased = 1 - Math.pow(1 - progress, 3)
          const raw = eased * target
          setCount(decimals > 0 ? parseFloat(raw.toFixed(decimals)) : Math.floor(raw))
          if (progress < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      },
      { threshold: 0.3 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [target, duration, decimals])

  return { count, elementRef }
}
