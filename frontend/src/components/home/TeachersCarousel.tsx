'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { TeacherCard } from '@/components/teachers/TeacherCard'
import type { Teacher } from '@/content/teachers'
import type { Locale } from '@/i18n/config'
import { useT } from '@/i18n/MarketingI18nProvider'

const AUTOPLAY_DELAY = 4000

export function TeachersCarousel({
  teachers,
  locale,
}: {
  teachers: Teacher[]
  locale: Locale
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)
  const [canScroll, setCanScroll] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const { t } = useT()

  const syncOverflow = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    setCanScroll(track.scrollWidth > track.clientWidth + 4)
  }, [])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncMotionPreference = () => setPrefersReducedMotion(motionQuery.matches)
    const resizeObserver = new ResizeObserver(syncOverflow)

    syncMotionPreference()
    syncOverflow()
    resizeObserver.observe(track)
    motionQuery.addEventListener('change', syncMotionPreference)

    return () => {
      resizeObserver.disconnect()
      motionQuery.removeEventListener('change', syncMotionPreference)
    }
  }, [syncOverflow])

  const move = useCallback((direction: 'left' | 'right') => {
    const track = trackRef.current
    if (!track) return

    const firstCard = track.querySelector<HTMLElement>('[data-teacher-card]')
    const step = firstCard ? firstCard.offsetWidth + 20 : 320
    const maxScroll = track.scrollWidth - track.clientWidth
    const atStart = track.scrollLeft <= 4
    const atEnd = track.scrollLeft >= maxScroll - 4
    const behavior = prefersReducedMotion ? 'auto' : 'smooth'

    if (direction === 'right' && atEnd) {
      track.scrollTo({ left: 0, behavior })
      return
    }

    if (direction === 'left' && atStart) {
      track.scrollTo({ left: maxScroll, behavior })
      return
    }

    track.scrollBy({
      left: direction === 'right' ? step : -step,
      behavior,
    })
  }, [prefersReducedMotion])

  useEffect(() => {
    if (!canScroll || paused || prefersReducedMotion) return

    const autoplay = window.setInterval(() => move('right'), AUTOPLAY_DELAY)
    return () => window.clearInterval(autoplay)
  }, [canScroll, move, paused, prefersReducedMotion])

  function pauseForFocus() {
    setPaused(true)
  }

  function resumeAfterFocus(event: React.FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setPaused(false)
    }
  }

  return (
    <div
      role="region"
      aria-label={t('teachersSection.carouselLabel')}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={pauseForFocus}
      onBlurCapture={resumeAfterFocus}
    >
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {teachers.map((teacher, index) => (
          <div
            key={teacher.id || `${teacher.name}-${index}`}
            data-teacher-card
            className="min-w-[86%] snap-start sm:min-w-[calc(50%-10px)] lg:min-w-[calc(33.333%-14px)] [&>a]:h-full"
          >
            <TeacherCard t={teacher} locale={locale} />
          </div>
        ))}
      </div>

      {canScroll && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => move('left')}
            aria-label={t('common.scrollLeft')}
            className="flex size-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.05] text-white transition-all hover:border-accent/50 hover:bg-accent hover:text-primary"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <span className="h-px w-12 bg-gradient-to-r from-transparent via-accent/60 to-transparent" aria-hidden="true" />
          <button
            type="button"
            onClick={() => move('right')}
            aria-label={t('common.scrollRight')}
            className="flex size-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.05] text-white transition-all hover:border-accent/50 hover:bg-accent hover:text-primary"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  )
}
