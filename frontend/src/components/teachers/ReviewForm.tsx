'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Star, CheckCircle2, AlertCircle } from 'lucide-react'
import { useT } from '@/i18n/MarketingI18nProvider'
import { TurnstileWidget } from '@/components/conversion/TurnstileWidget'

// Cloudflare Turnstile is optional: the captcha only appears (and is required)
// when a site key is configured. Without one the form submits without it and
// the backend skips verification too.
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
const CAPTCHA_ENABLED = Boolean(SITE_KEY)
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

type Status = 'idle' | 'loading' | 'success' | 'error'

/**
 * Review submission on a teacher's page.
 *
 * The review is published the moment it is accepted — there is no approval
 * step — so on success the page is refreshed and the student's own words are
 * already in the list above. That refresh is the point: without it the form
 * would claim success while the list still showed the old reviews.
 */
export function ReviewForm({
  teacherName,
  teacherSlug,
}: {
  teacherName: string
  teacherSlug: string
}) {
  const { t } = useT()
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [name, setName] = useState('')
  const [comment, setComment] = useState('')
  const [token, setToken] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleTurnstileSuccess = useCallback((value: string) => setToken(value), [])

  const complete =
    rating > 0 && name.trim().length > 0 && comment.trim().length > 0 && (!CAPTCHA_ENABLED || !!token)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!complete || status === 'loading') return

    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch(`${API_URL}/api/v1/teachers/${teacherSlug}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          author: name.trim(),
          rating,
          text: comment.trim(),
          ...(token ? { turnstileToken: token } : {}),
        }),
      })

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string }
        throw new Error(body.message ?? t('reviewForm.errorGeneric'))
      }

      setStatus('success')
      // Pull the teacher page's server components again so the new review is
      // rendered in the list — it is live already, the page just has not seen it.
      router.refresh()
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : t('reviewForm.errorGeneric'))
    }
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-secondary/30 bg-secondary/10 px-6 py-10 text-center">
        <CheckCircle2 className="size-10 text-emerald-400" aria-hidden="true" />
        <h4 className="font-heading text-lg font-bold text-white">{t('reviewForm.thanksTitle')}</h4>
        <p className="max-w-sm text-sm text-white/60">{t('reviewForm.thanksBody')}</p>
      </div>
    )
  }

  const active = hover || rating
  const busy = status === 'loading'

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* Rating */}
      <div>
        <label className="mb-2 block text-sm text-white/70">{t('reviewForm.ratingLabel')}</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              aria-label={n > 1 ? t('reviewForm.starsAria', { n }) : t('reviewForm.starAria', { n })}
              aria-pressed={n === rating}
              className="p-0.5 transition-transform hover:scale-110"
            >
              <Star className={`size-7 ${n <= active ? 'fill-accent text-accent' : 'text-white/25'}`} />
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div>
        <label htmlFor="rv-name" className="mb-2 block text-sm text-white/70">{t('reviewForm.authorLabel')}</label>
        <input
          id="rv-name"
          type="text"
          value={name}
          maxLength={120}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('reviewForm.authorPlaceholder')}
          className="w-full rounded-xl border border-white/15 bg-primary/40 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-accent/60"
        />
      </div>

      {/* Comment */}
      <div>
        <label htmlFor="rv-comment" className="mb-2 block text-sm text-white/70">{t('reviewForm.textLabel')}</label>
        <textarea
          id="rv-comment"
          value={comment}
          maxLength={1000}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          placeholder={t('reviewForm.textPlaceholder', { name: teacherName })}
          className="w-full resize-none rounded-xl border border-white/15 bg-primary/40 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-accent/60"
        />
      </div>

      {CAPTCHA_ENABLED && (
        <TurnstileWidget siteKey={SITE_KEY!} onSuccess={handleTurnstileSuccess} onExpire={() => setToken('')} />
      )}

      {status === 'error' && (
        <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={!complete || busy}
        className="inline-flex items-center gap-2 rounded-xl bg-secondary px-6 py-3 font-semibold text-white transition-colors hover:bg-[#0a6849] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? t('reviewForm.submitting') : t('reviewForm.submit')}
      </button>
    </form>
  )
}
