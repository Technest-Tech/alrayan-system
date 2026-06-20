import type { Metadata } from 'next'
import { Suspense } from 'react'
import { buildMetadata } from '@/lib/seo'
import { breadcrumbSchema } from '@/lib/schema'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { FeaturedPost } from '@/components/blog/FeaturedPost'
import { BlogCard } from '@/components/blog/BlogCard'
import { CategoryFilter } from '@/components/blog/CategoryFilter'
import { Pagination } from '@/components/blog/Pagination'
import { blogCategories, blogPosts } from '@/content/blog'
import type { BlogPost } from '@/content/blog'

export const revalidate = 3600

export const metadata: Metadata = buildMetadata({
  title: 'Blog — Quran Learning Tips & Guides | Azhary',
  description:
    'Articles on Tajweed, Hifz, online Quran learning, and Islamic education from certified teachers at Azhary.',
  path: '/blog',
})

type ApiResponse = {
  data: BlogPost[]
  total: number
  current_page: number
  last_page: number
}

async function getPosts(page: number, category: string): Promise<ApiResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  if (apiUrl) {
    try {
      const params = new URLSearchParams({ page: String(page), perPage: '9' })
      if (category) params.set('category', category)
      const res = await fetch(`${apiUrl}/api/v1/blog?${params.toString()}`, {
        next: { revalidate: 3600 },
      })
      if (res.ok) return res.json() as Promise<ApiResponse>
    } catch {
      // fall through to static data
    }
  }

  // Static fallback
  const filtered = category
    ? blogPosts.filter((p) => p.categories.some((c) => c.slug === category))
    : blogPosts
  const perPage = 9
  const total = filtered.length
  const lastPage = Math.max(1, Math.ceil(total / perPage))
  const slice = filtered.slice((page - 1) * perPage, page * perPage)
  return { data: slice, total, current_page: page, last_page: lastPage }
}

type Props = {
  searchParams: Promise<{ page?: string; category?: string }>
}

export default async function BlogPage({ searchParams }: Props) {
  const { page: pageParam, category: categoryParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10))
  const category = categoryParam ?? ''

  const { data: posts, current_page, last_page } = await getPosts(page, category)
  const featured = posts[0]
  const grid = posts.slice(1)

  const schema = breadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: 'Blog', href: '/blog' },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      {/* Hero strip */}
      <section className="bg-primary pt-40 pb-16 overflow-hidden relative">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 80%, #C9A24B 0%, transparent 50%), radial-gradient(circle at 80% 20%, #0E7C5A 0%, transparent 50%)',
          }}
          aria-hidden="true"
        />
        <Container className="relative text-center">
          <p className="text-accent text-sm font-semibold uppercase tracking-widest mb-4">
            Azhary
          </p>
          <h1 className="heading-display font-display text-white mb-4">Blog</h1>
          <p className="text-white/70 text-xl max-w-2xl mx-auto">
            Quran learning tips, Tajweed guides, and Islamic education insights from our
            certified teachers.
          </p>
        </Container>
      </section>

      {/* Featured post */}
      {featured && (
        <Section bg="white">
          <Container>
            <FeaturedPost post={featured} />
          </Container>
        </Section>
      )}

      {/* Category filter + grid */}
      <Section bg="cream">
        <Container>
          <div className="mb-8">
            <Suspense fallback={<div className="h-10" />}>
              <CategoryFilter categories={blogCategories} active={category || null} />
            </Suspense>
          </div>

          {grid.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {grid.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          ) : (
            <p className="text-muted-text text-center py-12">
              No articles in this category yet.
            </p>
          )}

          <Pagination
            currentPage={current_page}
            totalPages={last_page}
            basePath="/blog"
            category={category || null}
          />
        </Container>
      </Section>
    </>
  )
}
