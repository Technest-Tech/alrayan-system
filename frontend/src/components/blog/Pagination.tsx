import Link from 'next/link'

type Props = {
  currentPage: number
  totalPages: number
  basePath: string
  category?: string | null
}

function buildHref(basePath: string, page: number, category?: string | null): string {
  const params = new URLSearchParams()
  params.set('page', String(page))
  if (category) params.set('category', category)
  return `${basePath}?${params.toString()}`
}

export function Pagination({ currentPage, totalPages, basePath, category }: Props) {
  if (totalPages <= 1) return null

  const hasPrev = currentPage > 1
  const hasNext = currentPage < totalPages

  return (
    <nav className="flex items-center justify-center gap-4 pt-8" aria-label="Pagination">
      {hasPrev ? (
        <Link
          href={buildHref(basePath, currentPage - 1, category)}
          className="flex items-center gap-2 rounded-xl border border-border-soft px-5 py-2.5 text-sm font-medium text-primary hover:border-primary transition-colors"
        >
          ← Previous
        </Link>
      ) : (
        <span className="flex items-center gap-2 rounded-xl border border-border-soft px-5 py-2.5 text-sm font-medium text-muted-text cursor-not-allowed opacity-50">
          ← Previous
        </span>
      )}

      <span className="text-sm text-muted-text" aria-current="page">
        Page {currentPage} of {totalPages}
      </span>

      {hasNext ? (
        <Link
          href={buildHref(basePath, currentPage + 1, category)}
          className="flex items-center gap-2 rounded-xl border border-border-soft px-5 py-2.5 text-sm font-medium text-primary hover:border-primary transition-colors"
        >
          Next →
        </Link>
      ) : (
        <span className="flex items-center gap-2 rounded-xl border border-border-soft px-5 py-2.5 text-sm font-medium text-muted-text cursor-not-allowed opacity-50">
          Next →
        </span>
      )}
    </nav>
  )
}
