'use client'

import { useMemo, useState } from 'react'
import {
  Award,
  BookMarked,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock3,
  Filter,
  Globe,
  Heart,
  Layers,
  Lightbulb,
  Mic,
  Search,
  SlidersHorizontal,
  Star,
  Users,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Course } from '@/content/courses'

const iconMap: Record<string, LucideIcon> = {
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
}

const levelBadge: Record<Course['level'], string> = {
  'Beginner':     'bg-secondary/10 text-secondary ring-secondary/15',
  'Intermediate': 'bg-accent/15 text-[#8A6824] ring-accent/20',
  'Advanced':     'bg-primary/8 text-primary ring-primary/15',
  'All Levels':   'bg-[#EEF3F7] text-[#36566F] ring-[#36566F]/15',
}

const categoryAccent: Record<string, string> = {
  Quran:          'bg-secondary/10 text-secondary ring-secondary/15',
  Kids:           'bg-[#F4E8F1] text-[#8B4D78] ring-[#8B4D78]/15',
  Arabic:         'bg-[#EEF3F7] text-[#36566F] ring-[#36566F]/15',
  Memorization:   'bg-primary/8 text-primary ring-primary/15',
  Certification:  'bg-accent/15 text-[#8A6824] ring-accent/20',
  'Islamic Studies': 'bg-[#F4EFE4] text-[#80613B] ring-[#80613B]/15',
}

const levels: Array<Course['level'] | 'All'> = ['All', 'Beginner', 'Intermediate', 'Advanced', 'All Levels']
const audiences = ['All', 'Kids', 'Adults', 'Families']

function courseCategory(course: Course) {
  const text = `${course.title} ${course.shortDescription} ${course.specialtyTags.join(' ')}`.toLowerCase()
  if (text.includes('kid') || text.includes('children')) return 'Kids'
  if (text.includes('arabic')) return 'Arabic'
  if (text.includes('hifz') || text.includes('memorization')) return 'Memorization'
  if (text.includes('ijazah') || text.includes('qiraat') || text.includes('certificate')) return 'Certification'
  if (text.includes('islamic')) return 'Islamic Studies'
  return 'Quran'
}

function courseAudience(course: Course) {
  const text = `${course.title} ${course.ageGroup ?? ''} ${course.shortDescription}`.toLowerCase()
  if (text.includes('kid') || text.includes('children') || text.includes('ages')) return 'Kids'
  if (text.includes('adult') || text.includes('18+')) return 'Adults'
  return 'Families'
}

type CourseCatalogProps = {
  courses: Course[]
}

export function CourseCatalog({ courses }: CourseCatalogProps) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [level, setLevel] = useState<Course['level'] | 'All'>('All')
  const [audience, setAudience] = useState('All')

  const enriched = useMemo(
    () => courses.map((course) => ({
      ...course,
      category: courseCategory(course),
      audience: courseAudience(course),
    })),
    [courses],
  )

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(enriched.map((course) => course.category)))],
    [enriched],
  )

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return enriched.filter((course) => {
      const searchable = [
        course.title,
        course.shortDescription,
        course.level,
        course.ageGroup,
        course.features.join(' '),
        course.specialtyTags.join(' '),
      ].join(' ').toLowerCase()

      return (
        (!needle || searchable.includes(needle)) &&
        (category === 'All' || course.category === category) &&
        (level === 'All' || course.level === level) &&
        (audience === 'All' || course.audience === audience)
      )
    })
  }, [audience, category, enriched, level, query])

  const hasFilters = Boolean(query || category !== 'All' || level !== 'All' || audience !== 'All')

  function clearFilters() {
    setQuery('')
    setCategory('All')
    setLevel('All')
    setAudience('All')
  }

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-border-soft bg-white p-4 shadow-soft md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-white">
              <SlidersHorizontal className="size-4" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-primary">Filter programs</h3>
              <p className="text-sm text-muted-text">{filtered.length} of {courses.length} programs shown</p>
            </div>
          </div>

          <label className="relative block w-full lg:max-w-sm">
            <span className="sr-only">Search programs</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-text" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by course, goal, or skill"
              className="h-12 w-full rounded-lg border border-border-soft bg-cream/45 pl-10 pr-3 text-sm text-primary outline-none transition focus:border-secondary focus:bg-white focus:ring-2 focus:ring-secondary/15"
            />
          </label>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <FilterGroup icon={Filter} label="Category">
            {categories.map((item) => (
              <FilterChip
                key={item}
                active={category === item}
                onClick={() => setCategory(item)}
                className={item === 'All' ? undefined : categoryAccent[item]}
              >
                {item}
              </FilterChip>
            ))}
          </FilterGroup>

          <FilterGroup icon={Award} label="Level">
            {levels.map((item) => (
              <FilterChip key={item} active={level === item} onClick={() => setLevel(item)}>
                {item}
              </FilterChip>
            ))}
          </FilterGroup>

          <FilterGroup icon={Users} label="Audience">
            {audiences.map((item) => (
              <FilterChip key={item} active={audience === item} onClick={() => setAudience(item)}>
                {item}
              </FilterChip>
            ))}
          </FilterGroup>
        </div>

        {hasFilters && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border-soft pt-4">
            <p className="text-sm text-muted-text">Refine the list or reset to compare every program.</p>
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border-soft bg-white px-3 text-sm font-medium text-primary transition hover:border-secondary/40 hover:text-secondary"
            >
              <X className="size-3.5" aria-hidden="true" />
              Clear filters
            </button>
          </div>
        )}
      </div>

      {filtered.length > 0 ? (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" role="list">
          {filtered.map((course) => (
            <CourseCard key={course.slug} course={course} />
          ))}
        </ul>
      ) : (
        <div className="rounded-lg border border-dashed border-border-soft bg-white px-6 py-14 text-center">
          <p className="font-heading text-2xl font-semibold text-primary">No matching programs</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-text">
            Try a broader search or reset filters to see all available courses.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-secondary px-5 text-sm font-semibold text-white transition hover:bg-[#0a6849]"
          >
            Show all programs
          </button>
        </div>
      )}
    </div>
  )
}

function FilterGroup({
  children,
  icon: Icon,
  label,
}: {
  children: React.ReactNode
  icon: LucideIcon
  label: string
}) {
  return (
    <div className="rounded-lg border border-border-soft bg-[#FBFAF7] p-3">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase text-muted-text">
        <Icon className="size-3.5" aria-hidden="true" />
        {label}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

function FilterChip({
  active,
  children,
  className,
  onClick,
}: {
  active: boolean
  children: React.ReactNode
  className?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-md border border-border-soft bg-white px-3 py-1.5 text-xs font-semibold text-primary transition hover:border-secondary/40 hover:text-secondary',
        className,
        active && 'border-secondary bg-secondary text-white ring-0 hover:text-white',
      )}
    >
      {children}
    </button>
  )
}

function CourseCard({ course }: { course: Course & { category: string; audience: string } }) {
  const Icon = iconMap[course.icon] ?? BookOpen

  return (
    <li>
      <a
        href={`/courses/${course.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-lg border border-border-soft bg-white shadow-soft transition-all duration-200 hover:-translate-y-1 hover:border-secondary/30 hover:shadow-lg"
      >
        <div className="flex items-start justify-between gap-4 p-5 pb-4">
          <div className="flex gap-3">
            <div className={cn('flex size-12 shrink-0 items-center justify-center rounded-lg ring-1', categoryAccent[course.category] ?? 'bg-secondary/10 text-secondary ring-secondary/15')}>
              <Icon className="size-5" aria-hidden="true" />
            </div>
            <div>
              <span className={cn('inline-flex rounded-md px-2 py-1 text-[11px] font-semibold ring-1', categoryAccent[course.category])}>
                {course.category}
              </span>
              <h3 className="mt-3 font-heading text-lg font-semibold leading-snug text-primary transition group-hover:text-secondary">
                {course.title}
              </h3>
            </div>
          </div>
          <span className={cn('shrink-0 rounded-md px-2.5 py-1 text-[11px] font-semibold ring-1', levelBadge[course.level])}>
            {course.level}
          </span>
        </div>

        <div className="flex flex-1 flex-col px-5 pb-5">
          <p className="text-sm leading-relaxed text-muted-text">{course.shortDescription}</p>

          <div className="my-5 flex flex-wrap gap-2">
            {course.ageGroup && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-cream px-2.5 py-1 text-[11px] font-medium text-primary">
                <Users className="size-3" aria-hidden="true" />
                {course.ageGroup}
              </span>
            )}
            {course.durationMonths && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-[#EEF3F7] px-2.5 py-1 text-[11px] font-medium text-[#36566F]">
                <Clock3 className="size-3" aria-hidden="true" />
                {course.durationMonths} months
              </span>
            )}
          </div>

          <ul className="mt-auto space-y-2" aria-label={`${course.title} highlights`}>
            {course.features.slice(0, 3).map((feature) => (
              <li key={feature} className="flex gap-2 text-xs leading-relaxed text-muted-text">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-secondary" aria-hidden="true" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-between border-t border-border-soft bg-[#FBFAF7] px-5 py-4 text-sm font-semibold text-secondary">
          View program
          <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">-&gt;</span>
        </div>
      </a>
    </li>
  )
}
