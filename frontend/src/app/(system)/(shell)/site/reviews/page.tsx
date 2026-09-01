'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Check, Search, Star, Trash2, Undo2 } from 'lucide-react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SiteReviewCard } from '@/components/system/site/SiteReviewCard'
import {
  useBulkSiteReviews,
  useSiteReviewStats,
  useSiteReviews,
} from '@/hooks/system/useSiteReviews'
import { useSiteTeachers } from '@/hooks/system/useSiteTeachers'
import type { SiteReviewBulkAction, SiteReviewFilters } from '@/types/system/siteReview'

const CARD_STYLE = {
  background: 'rgb(var(--surface-card))',
  border: '1px solid rgb(var(--border-default))',
}

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl p-4" style={CARD_STYLE}>
      <p className="text-xs font-medium uppercase tracking-wide opacity-60">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold tabular">{value}</p>
      {hint && <p className="mt-0.5 text-xs opacity-50">{hint}</p>}
    </div>
  )
}

export default function SiteReviewsPage() {
  const [filters, setFilters] = useState<SiteReviewFilters>({ page: 1 })
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<number[]>([])

  const { data: page, isLoading } = useSiteReviews(filters)
  const { data: stats } = useSiteReviewStats()
  const { data: teachers } = useSiteTeachers()
  const bulk = useBulkSiteReviews()

  const reviews = page?.data ?? []
  const allSelected = reviews.length > 0 && selected.length === reviews.length

  /** Changing any filter resets to page 1 and drops the stale selection. */
  function setFilter(patch: Partial<SiteReviewFilters>) {
    setFilters((prev) => ({ ...prev, ...patch, page: 1 }))
    setSelected([])
  }

  function toggleOne(id: number, isSelected: boolean) {
    setSelected((prev) => (isSelected ? [...prev, id] : prev.filter((x) => x !== id)))
  }

  async function runBulk(action: SiteReviewBulkAction) {
    if (selected.length === 0) return
    if (action === 'delete' && !confirm(`Delete ${selected.length} review(s)? This cannot be undone.`)) {
      return
    }

    try {
      const { affected } = await bulk.mutateAsync({ action, ids: selected })
      setSelected([])
      toast.success(`${affected} review(s) ${action === 'delete' ? 'deleted' : `${action}d`}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bulk action failed')
    }
  }

  return (
    <>
      <PageHeader
        title="Reviews"
        description="Approve, edit and remove the reviews shown on the public teacher profiles."
      />

      {stats && (
        <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile label="Total" value={String(stats.total)} />
          <StatTile label="Awaiting approval" value={String(stats.pending)} hint="Hidden from the site until approved" />
          <StatTile label="Live on the site" value={String(stats.approved)} />
          <StatTile
            label="Average rating"
            value={stats.average_rating.toFixed(2)}
            hint={`${stats.by_rating['5'] ?? 0} five-star`}
          />
        </div>
      )}

      {/* ── Filters ── */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <form
          className="relative"
          onSubmit={(e) => { e.preventDefault(); setFilter({ search: search || null }) }}
        >
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 opacity-40" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search author or text…"
            className="w-56 pl-8"
            aria-label="Search reviews"
          />
        </form>

        <select
          value={filters.status ?? ''}
          onChange={(e) => setFilter({ status: (e.target.value || null) as SiteReviewFilters['status'] })}
          className="h-9 rounded-md px-2 text-sm"
          style={CARD_STYLE}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="pending">Awaiting approval</option>
          <option value="approved">Approved</option>
        </select>

        <select
          value={filters.rating ?? ''}
          onChange={(e) => setFilter({ rating: e.target.value ? Number(e.target.value) : null })}
          className="h-9 rounded-md px-2 text-sm"
          style={CARD_STYLE}
          aria-label="Filter by rating"
        >
          <option value="">All ratings</option>
          {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}
        </select>

        <select
          value={filters.teacher_id ?? ''}
          onChange={(e) => setFilter({ teacher_id: e.target.value ? Number(e.target.value) : null })}
          className="h-9 rounded-md px-2 text-sm"
          style={CARD_STYLE}
          aria-label="Filter by teacher"
        >
          <option value="">All teachers</option>
          {teachers?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {/* ── Bulk bar — only once something is selected ── */}
      {selected.length > 0 && (
        <div
          className="mb-3 flex flex-wrap items-center gap-2 rounded-xl p-3"
          style={{ background: 'rgb(var(--surface-card-2))' }}
        >
          <span className="text-sm font-medium">{selected.length} selected</span>
          <Button type="button" size="sm" variant="outline" onClick={() => runBulk('approve')} disabled={bulk.isPending}>
            <Check className="size-4" /> Approve
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => runBulk('unapprove')} disabled={bulk.isPending}>
            <Undo2 className="size-4" /> Unapprove
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => runBulk('delete')} disabled={bulk.isPending}>
            <Trash2 className="size-4" /> Delete
          </Button>
          <button type="button" onClick={() => setSelected([])} className="ml-auto text-xs opacity-60 hover:opacity-100">
            Clear selection
          </button>
        </div>
      )}

      {reviews.length > 0 && (
        <label className="mb-2 flex items-center gap-2 text-xs opacity-60">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(e) => setSelected(e.target.checked ? reviews.map((r) => r.id) : [])}
            className="size-4 accent-secondary"
          />
          Select everything on this page
        </label>
      )}

      {isLoading && !page ? (
        <p className="text-sm opacity-60">Loading…</p>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={CARD_STYLE}>
          <Star className="mx-auto size-6 opacity-30" aria-hidden="true" />
          <p className="mt-2 text-sm opacity-60">No reviews match these filters.</p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {reviews.map((review) => (
            <SiteReviewCard
              key={review.id}
              review={review}
              selected={selected.includes(review.id)}
              onSelect={toggleOne}
            />
          ))}
        </ul>
      )}

      {/* ── Pagination ── */}
      {page && page.last_page > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="opacity-60">
            Page {page.current_page} of {page.last_page} · {page.total} reviews
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={page.current_page <= 1}
              onClick={() => { setFilters((p) => ({ ...p, page: (p.page ?? 1) - 1 })); setSelected([]) }}
            >
              Previous
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={page.current_page >= page.last_page}
              onClick={() => { setFilters((p) => ({ ...p, page: (p.page ?? 1) + 1 })); setSelected([]) }}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
