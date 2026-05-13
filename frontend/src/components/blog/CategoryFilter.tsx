'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import type { BlogCategory } from '@/content/blog'

type Props = {
  categories: BlogCategory[]
  active: string | null
}

export function CategoryFilter({ categories, active }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function setCategory(slug: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (slug) {
      params.set('category', slug)
    } else {
      params.delete('category')
    }
    params.delete('page')
    router.push(`/blog?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
      <button
        onClick={() => setCategory(null)}
        className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
          active === null
            ? 'bg-primary text-white'
            : 'bg-secondary/10 text-secondary hover:bg-secondary/20'
        }`}
        aria-pressed={active === null}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.slug}
          onClick={() => setCategory(cat.slug)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            active === cat.slug
              ? 'bg-primary text-white'
              : 'bg-secondary/10 text-secondary hover:bg-secondary/20'
          }`}
          aria-pressed={active === cat.slug}
        >
          {cat.title}
        </button>
      ))}
    </div>
  )
}
