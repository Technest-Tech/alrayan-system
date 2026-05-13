import { BlogCard } from './BlogCard'
import type { BlogPost } from '@/content/blog'

type Props = {
  posts: BlogPost[]
}

export function RelatedPosts({ posts }: Props) {
  if (posts.length === 0) return null

  return (
    <section className="mt-16 pt-12 border-t border-border-soft">
      <p className="text-secondary text-sm font-semibold uppercase tracking-widest mb-2">
        Keep Reading
      </p>
      <h2 className="heading-xl font-display text-primary mb-8">More Articles</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.slice(0, 3).map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>
    </section>
  )
}
