'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import {
  ChevronDown, ChevronUp, Eye, EyeOff, Pencil, Plus, Search, Star, Trash2,
} from 'lucide-react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { LinkButton } from '@/components/ui/link-button'
import { Input } from '@/components/ui/input'
import {
  useDeleteSiteTeacher,
  usePatchSiteTeacher,
  useReorderSiteTeachers,
  useSiteTeachers,
} from '@/hooks/system/useSiteTeachers'
import type { SiteTeacher } from '@/types/system/siteTeacher'

const CARD_STYLE = {
  background: 'rgb(var(--surface-card))',
  border: '1px solid rgb(var(--border-default))',
}

type Visibility = 'all' | 'live' | 'hidden'

export default function SiteTeachersPage() {
  const { data: teachers, isLoading } = useSiteTeachers()
  const reorder = useReorderSiteTeachers()
  const patch = usePatchSiteTeacher()
  const remove = useDeleteSiteTeacher()

  const [search, setSearch] = useState('')
  const [visibility, setVisibility] = useState<Visibility>('all')

  // The saved order is what the public site renders, so the rows stay in
  // sort_order and searching only narrows which of them are shown.
  const ordered = useMemo(
    () => [...(teachers ?? [])].sort((a, b) => a.sort_order - b.sort_order),
    [teachers],
  )

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return ordered.filter((t) => {
      if (visibility === 'live' && !t.featured) return false
      if (visibility === 'hidden' && t.featured) return false
      if (!term) return true
      return (
        t.name.toLowerCase().includes(term) ||
        t.role.toLowerCase().includes(term) ||
        (t.country ?? '').toLowerCase().includes(term)
      )
    })
  }, [ordered, search, visibility])

  /**
   * Move a teacher one place up or down and save the whole list.
   *
   * Reordering acts on the full saved order, never the filtered view — moving a
   * row while a search is active must not silently reshuffle the rows hidden
   * behind that search.
   */
  async function move(teacher: SiteTeacher, direction: -1 | 1) {
    const index = ordered.findIndex((t) => t.id === teacher.id)
    const target = index + direction
    if (index < 0 || target < 0 || target >= ordered.length) return

    const next = [...ordered]
    ;[next[index], next[target]] = [next[target], next[index]]

    try {
      await reorder.mutateAsync(next.map((t) => t.id))
    } catch {
      toast.error('Could not save the new order')
    }
  }

  async function toggleFeatured(teacher: SiteTeacher) {
    try {
      await patch.mutateAsync({ slug: teacher.slug, featured: !teacher.featured })
      toast.success(teacher.featured ? `${teacher.name} hidden from the site` : `${teacher.name} is now live`)
    } catch {
      toast.error('Could not change visibility')
    }
  }

  async function destroy(teacher: SiteTeacher) {
    if (!confirm(`Delete ${teacher.name} and all their reviews? This cannot be undone.`)) return
    try {
      await remove.mutateAsync(teacher.slug)
      toast.success(`${teacher.name} deleted`)
    } catch {
      toast.error('Could not delete the teacher')
    }
  }

  const liveCount = ordered.filter((t) => t.featured).length

  return (
    <>
      <PageHeader
        title="Site Teachers"
        description="Manage the teachers, photos, profiles and reviews shown on the public website."
      >
        <LinkButton href="/site/teachers/new">
          <Plus className="size-4" /> Add teacher
        </LinkButton>
      </PageHeader>

      {/* ── Filters ── */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 opacity-40" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, role or country…"
            className="w-64 pl-8"
            aria-label="Search teachers"
          />
        </div>

        <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: 'rgb(var(--surface-card-2))' }}>
          {([
            ['all', `All (${ordered.length})`],
            ['live', `Live (${liveCount})`],
            ['hidden', `Hidden (${ordered.length - liveCount})`],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setVisibility(key)}
              aria-pressed={visibility === key}
              className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              style={
                visibility === key
                  ? { background: 'rgb(var(--surface-card))', color: 'rgb(11 31 58)' }
                  : { color: 'rgb(90 100 112)' }
              }
            >
              {label}
            </button>
          ))}
        </div>

        {search && (
          <span className="text-xs opacity-50">Clear the search to reorder teachers.</span>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm opacity-60">Loading…</p>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={CARD_STYLE}>
          <p className="text-sm opacity-60">No teachers match these filters.</p>
        </div>
      ) : (
        <ol className="grid gap-3">
          {visible.map((teacher) => {
            const index = ordered.findIndex((t) => t.id === teacher.id)

            return (
              <li key={teacher.id} className="flex items-center gap-3 rounded-2xl p-4" style={CARD_STYLE}>
                {/* Reordering is disabled while a filter hides part of the list. */}
                <div className="flex shrink-0 flex-col">
                  <button
                    type="button"
                    onClick={() => move(teacher, -1)}
                    disabled={index === 0 || reorder.isPending || !!search || visibility !== 'all'}
                    className="rounded p-0.5 opacity-50 hover:opacity-100 disabled:opacity-20"
                    aria-label={`Move ${teacher.name} up`}
                  >
                    <ChevronUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(teacher, 1)}
                    disabled={index === ordered.length - 1 || reorder.isPending || !!search || visibility !== 'all'}
                    className="rounded p-0.5 opacity-50 hover:opacity-100 disabled:opacity-20"
                    aria-label={`Move ${teacher.name} down`}
                  >
                    <ChevronDown className="size-4" />
                  </button>
                </div>

                <Link href={`/site/teachers/${teacher.slug}`} className="group flex min-w-0 flex-1 items-center gap-4">
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-full" style={{ background: 'rgb(var(--surface-card-2))' }}>
                    {teacher.image ? (
                      <Image src={teacher.image} alt="" fill sizes="48px" className="object-cover" />
                    ) : (
                      <span className="flex h-full items-center justify-center font-semibold opacity-60">
                        {teacher.name.charAt(0)}
                      </span>
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-medium">{teacher.name}</span>
                      {teacher.elite && (
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                          style={{ background: 'rgb(var(--accent)/0.15)', color: 'rgb(var(--accent))' }}
                        >
                          Elite
                        </span>
                      )}
                      {!teacher.featured && (
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{
                            background: 'rgb(var(--status-neutral, 90 100 112)/0.12)',
                            color: 'rgb(var(--status-neutral, 90 100 112))',
                          }}
                        >
                          Hidden
                        </span>
                      )}
                    </span>
                    <span className="block truncate text-sm opacity-60">{teacher.title ?? teacher.role}</span>
                  </span>

                  <span className="hidden items-center gap-1 text-sm sm:flex">
                    <Star className="size-3.5" style={{ color: 'rgb(var(--accent))' }} fill="currentColor" />
                    {Number(teacher.rating).toFixed(1)}
                    <span className="opacity-60">
                      · {teacher.reviews_count_relation ?? teacher.reviews_count} reviews
                    </span>
                  </span>

                  <span className="hidden text-sm font-medium md:block">
                    {teacher.hourly_rate} {teacher.currency}/h
                  </span>

                  <Pencil className="size-4 opacity-0 transition-opacity group-hover:opacity-60" aria-hidden="true" />
                </Link>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toggleFeatured(teacher)}
                    disabled={patch.isPending}
                    className="rounded-lg p-1.5 opacity-60 hover:opacity-100"
                    title={teacher.featured ? 'Hide from the public site' : 'Show on the public site'}
                    aria-label={teacher.featured ? `Hide ${teacher.name}` : `Show ${teacher.name}`}
                  >
                    {teacher.featured ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => destroy(teacher)}
                    disabled={remove.isPending}
                    className="rounded-lg p-1.5 opacity-60 hover:opacity-100"
                    style={{ color: 'rgb(var(--status-danger, 166 39 30))' }}
                    title="Delete"
                    aria-label={`Delete ${teacher.name}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </>
  )
}
