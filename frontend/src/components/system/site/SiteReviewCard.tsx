'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import { Check, Pencil, Star, Trash2, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useDeleteSiteReview, useUpdateSiteReview } from '@/hooks/system/useSiteReviews'
import type { SiteReviewRow as Review } from '@/types/system/siteReview'

const CARD_STYLE = {
  background: 'rgb(var(--surface-card))',
  border: '1px solid rgb(var(--border-default))',
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex" aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className="size-3.5"
          style={{ color: 'rgb(var(--accent))' }}
          fill={i < rating ? 'currentColor' : 'none'}
          aria-hidden="true"
        />
      ))}
    </span>
  )
}

export function SiteReviewCard({
  review, selected, onSelect,
}: {
  review: Review
  selected: boolean
  onSelect: (id: number, selected: boolean) => void
}) {
  const update = useUpdateSiteReview()
  const remove = useDeleteSiteReview()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({
    author: review.author,
    rating: review.rating,
    text: review.text,
    text_fr: review.text_fr ?? '',
  })

  async function save() {
    try {
      await update.mutateAsync({ id: review.id, ...draft })
      setEditing(false)
      toast.success('Review updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save the review')
    }
  }

  async function setApproved(approved: boolean) {
    try {
      await update.mutateAsync({ id: review.id, approved })
    } catch {
      toast.error('Could not change the review status')
    }
  }

  async function destroy() {
    if (!confirm(`Delete the review by ${review.author}? This cannot be undone.`)) return
    try {
      await remove.mutateAsync(review.id)
      toast.success('Review deleted')
    } catch {
      toast.error('Could not delete the review')
    }
  }

  return (
    <li className="rounded-2xl p-4" style={CARD_STYLE}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onSelect(review.id, e.target.checked)}
          className="mt-1 size-4 accent-secondary"
          aria-label={`Select the review by ${review.author}`}
        />

        {/* Which teacher this review is about */}
        {review.teacher && (
          <Link
            href={`/site/teachers/${review.teacher.slug}`}
            className="flex shrink-0 items-center gap-2"
            title={`Open ${review.teacher.name}`}
          >
            <span className="relative size-8 overflow-hidden rounded-full" style={{ background: 'rgb(var(--surface-card-2))' }}>
              {review.teacher.image ? (
                <Image src={review.teacher.image} alt="" fill sizes="32px" className="object-cover" />
              ) : (
                <span className="flex h-full items-center justify-center text-xs font-semibold opacity-60">
                  {review.teacher.name.charAt(0)}
                </span>
              )}
            </span>
          </Link>
        )}

        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="space-y-2">
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <Input
                  value={draft.author}
                  onChange={(e) => setDraft((p) => ({ ...p, author: e.target.value }))}
                  aria-label="Author"
                />
                <select
                  value={draft.rating}
                  onChange={(e) => setDraft((p) => ({ ...p, rating: Number(e.target.value) }))}
                  className="h-9 rounded-md px-2 text-sm"
                  style={CARD_STYLE}
                  aria-label="Rating"
                >
                  {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}
                </select>
              </div>
              <Textarea
                rows={2}
                value={draft.text}
                onChange={(e) => setDraft((p) => ({ ...p, text: e.target.value }))}
                aria-label="Review text"
              />
              <Textarea
                rows={2}
                placeholder="Review (French) — optional 🇫🇷"
                value={draft.text_fr}
                onChange={(e) => setDraft((p) => ({ ...p, text_fr: e.target.value }))}
                aria-label="Review text in French"
              />
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={save} disabled={update.isPending}>
                  <Check className="size-4" /> Save
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-sm font-medium">{review.author}</span>
                <Stars rating={review.rating} />
                {review.teacher && (
                  <span className="text-xs opacity-50">on {review.teacher.name}</span>
                )}
                {!review.approved && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
                    style={{
                      background: 'rgb(var(--status-warning, 154 113 23)/0.12)',
                      color: 'rgb(var(--status-warning, 154 113 23))',
                    }}
                  >
                    Pending
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm opacity-80">{review.text}</p>
              {review.text_fr && (
                <p className="mt-1 text-sm opacity-60">🇫🇷 {review.text_fr}</p>
              )}
            </>
          )}
        </div>

        {!editing && (
          <div className="flex shrink-0 items-center gap-1">
            {review.approved ? (
              <button
                type="button"
                onClick={() => setApproved(false)}
                disabled={update.isPending}
                className="rounded-lg p-1.5 opacity-60 hover:opacity-100"
                title="Unapprove — hides it from the public site"
              >
                <Undo2 className="size-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setApproved(true)}
                disabled={update.isPending}
                className="rounded-lg p-1.5"
                style={{ color: 'rgb(var(--status-success, 14 124 90))' }}
                title="Approve — shows it on the public site"
              >
                <Check className="size-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-lg p-1.5 opacity-60 hover:opacity-100"
              title="Edit"
            >
              <Pencil className="size-4" />
            </button>
            <button
              type="button"
              onClick={destroy}
              disabled={remove.isPending}
              className="rounded-lg p-1.5 opacity-60 hover:opacity-100"
              style={{ color: 'rgb(var(--status-danger, 166 39 30))' }}
              title="Delete"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        )}
      </div>
    </li>
  )
}
