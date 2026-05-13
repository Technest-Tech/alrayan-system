import Link from 'next/link'
import type { BlogPost } from '@/content/blog'

type Props = {
  post: BlogPost
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

export function BlogCard({ post }: Props) {
  const primaryCategory = post.categories[0]

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col rounded-2xl border border-border-soft bg-white overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Cover placeholder */}
      <div className="aspect-video bg-primary/10 flex items-center justify-center relative">
        {primaryCategory && (
          <span className="absolute top-3 left-3 bg-secondary/10 text-secondary text-xs font-medium rounded-full px-2.5 py-1">
            {primaryCategory.title}
          </span>
        )}
        <span className="text-4xl opacity-20 select-none">📖</span>
      </div>

      <div className="flex flex-col flex-1 p-5 gap-3">
        <h3 className="font-display font-semibold text-primary leading-snug line-clamp-2 group-hover:text-secondary transition-colors">
          {post.title}
        </h3>
        <p className="text-muted-text text-sm leading-relaxed line-clamp-3 flex-1">
          {post.excerpt}
        </p>
        <div className="flex items-center gap-3 text-xs text-muted-text pt-1 border-t border-border-soft">
          <span>{post.reading_minutes} min read</span>
          <span aria-hidden="true">·</span>
          <span>{formatDate(post.published_at)}</span>
        </div>
      </div>
    </Link>
  )
}
