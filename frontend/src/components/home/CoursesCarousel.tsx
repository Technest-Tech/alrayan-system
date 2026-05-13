'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Star,
  Mic,
  Brain,
  Award,
  Globe,
  Lightbulb,
  BookMarked,
  Layers,
  Heart,
  ArrowRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { LinkButton } from '@/components/ui/link-button'
import type { Course } from '@/content/courses'

const iconMap: Record<string, LucideIcon> = {
  BookOpen, Star, Mic, Brain, Award, Globe, Lightbulb, BookMarked, Layers, Heart,
}

const levelBadge: Record<Course['level'], string> = {
  'Beginner':     'bg-secondary/10 text-secondary',
  'Intermediate': 'bg-accent/15 text-[#A07830]',
  'Advanced':     'bg-primary/10 text-primary',
  'All Levels':   'bg-border-soft text-muted-text',
}

const iconAccent: Record<string, string> = {
  'Beginner':     'bg-secondary/10 text-secondary',
  'Intermediate': 'bg-accent/10 text-accent',
  'Advanced':     'bg-primary/10 text-primary',
  'All Levels':   'bg-secondary/10 text-secondary',
}

export function CoursesCarousel({ courses }: { courses: Course[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft]   = useState(false)
  const [canRight, setCanRight] = useState(true)

  const sync = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 4)
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }, [])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    sync()
    el.addEventListener('scroll', sync, { passive: true })
    window.addEventListener('resize', sync)
    return () => {
      el.removeEventListener('scroll', sync)
      window.removeEventListener('resize', sync)
    }
  }, [sync])

  function nudge(dir: 'left' | 'right') {
    const el = trackRef.current
    if (!el) return
    const card = el.querySelector<HTMLElement>('[data-card]')
    const step = card ? card.offsetWidth + 24 : 320
    el.scrollBy({ left: dir === 'right' ? step : -step, behavior: 'smooth' })
  }

  return (
    <div>
      {/* ── Header row ── */}
      <div className="flex items-end justify-between mb-8 gap-4">
        <div>
          <p className="text-secondary text-sm font-semibold uppercase tracking-wider mb-2">
            Our Courses
          </p>
          <h2 className="heading-xl font-heading text-primary">
            What Would You Like to Learn?
          </h2>
        </div>
        {/* Nav arrows */}
        <div className="flex gap-2 shrink-0 pb-1">
          <button
            onClick={() => nudge('left')}
            disabled={!canLeft}
            aria-label="Scroll left"
            className="size-10 rounded-full border border-border-soft bg-white shadow-sm flex items-center justify-center text-primary hover:border-secondary/50 hover:text-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => nudge('right')}
            disabled={!canRight}
            aria-label="Scroll right"
            className="size-10 rounded-full border border-border-soft bg-white shadow-sm flex items-center justify-center text-primary hover:border-secondary/50 hover:text-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* ── Scrollable track ── */}
      <div
        ref={trackRef}
        className="flex gap-6 overflow-x-auto pb-3 [&::-webkit-scrollbar]:hidden"
        style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}
      >
        {courses.map((course) => {
          const Icon   = iconMap[course.icon] ?? BookOpen
          const iconCls = iconAccent[course.level]
          const badgeCls = levelBadge[course.level]
          return (
            <a
              key={course.slug}
              href={`/courses/${course.slug}`}
              data-card
              className="group shrink-0 w-[272px] md:w-[300px] bg-white rounded-2xl p-6 border border-border-soft shadow-soft hover:shadow-md hover:border-secondary/30 transition-all duration-200 flex flex-col"
              style={{ scrollSnapAlign: 'start' }}
            >
              {/* Icon + level */}
              <div className="flex items-start justify-between mb-5">
                <div className={`size-11 rounded-xl flex items-center justify-center ${iconCls}`}>
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${badgeCls}`}>
                  {course.level}
                </span>
              </div>

              {/* Title */}
              <h3 className="font-heading font-semibold text-primary text-base mb-2 group-hover:text-secondary transition-colors leading-snug">
                {course.title}
              </h3>

              {/* Description */}
              <p className="text-muted-text text-sm leading-relaxed flex-1 mb-5">
                {course.shortDescription}
              </p>

              {/* Meta */}
              {(course.ageGroup ?? course.durationMonths) && (
                <p className="text-[11px] text-muted-text mb-3 font-medium">
                  {course.ageGroup ?? `~${course.durationMonths} months`}
                </p>
              )}

              {/* CTA */}
              <span className="flex items-center gap-1.5 text-secondary text-sm font-semibold mt-auto">
                Learn more
                <ArrowRight
                  className="size-3.5 group-hover:translate-x-0.5 transition-transform"
                  aria-hidden="true"
                />
              </span>
            </a>
          )
        })}
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between mt-6">
        <p className="text-muted-text text-sm">{courses.length} courses available</p>
        <LinkButton href="/courses" variant="outline" size="sm">
          View All Courses
        </LinkButton>
      </div>
    </div>
  )
}
