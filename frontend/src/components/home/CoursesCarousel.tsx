'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { courseImage } from '@/content/courseImages'
import type { Course } from '@/content/courses'
import type { Locale } from '@/i18n/config'
import { useT } from '@/i18n/MarketingI18nProvider'
import { localizedHref } from '@/i18n/href'

const AUTOPLAY_DELAY = 4000

export function CoursesCarousel({
  courses,
  locale,
}: {
  courses: Course[]
  locale: Locale
}) {
  const { t } = useT()
  const trackRef = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)
  const [canScroll, setCanScroll] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

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

    const firstCard = track.querySelector<HTMLElement>('[data-course-card]')
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

  function resumeAfterFocus(event: React.FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setPaused(false)
    }
  }

  return (
    <div
      role="region"
      aria-label={t('coursesGrid.carouselLabel')}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={resumeAfterFocus}
    >
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {courses.map((course) => (
          <div
            key={course.slug}
            data-course-card
            className="min-w-[86%] snap-start sm:min-w-[calc(50%-10px)] lg:min-w-[calc(33.333%-14px)]"
          >
            <Link
              href={localizedHref(`/courses/${course.slug}`, locale)}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-all duration-200 hover:-translate-y-1 hover:border-accent/40 hover:shadow-[0_18px_40px_rgba(0,0,0,0.45)]"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={courseImage(course.slug)}
                  alt={course.title}
                  fill
                  sizes="(max-width: 640px) 86vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"
                  aria-hidden="true"
                />
                <span
                  className="absolute right-0 top-0 border-l-[38px] border-t-[38px] border-l-transparent border-t-accent"
                  aria-hidden="true"
                />
                <div className="absolute inset-x-3 bottom-3 flex flex-wrap gap-1.5">
                  {course.specialtyTags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-heading text-lg font-bold leading-snug text-white transition-colors group-hover:text-accent">
                  {course.title}
                </h3>
                <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-white/55">
                  {course.shortDescription}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-300">
                  {t('coursesGrid.discover')}
                  <ArrowRight
                    className="size-3.5 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </div>
            </Link>
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
          <span
            className="h-px w-12 bg-gradient-to-r from-transparent via-accent/60 to-transparent"
            aria-hidden="true"
          />
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
