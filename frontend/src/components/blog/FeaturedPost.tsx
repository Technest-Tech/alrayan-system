import Link from 'next/link'
import { LinkButton } from '@/components/ui/link-button'
import type { BlogPost } from '@/content/blog'

type Props = {
  post: BlogPost
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso))
}

export function FeaturedPost({ post }: Props) {
  const primaryCategory = post.categories[0]

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group relative flex items-end rounded-3xl overflow-hidden min-h-[420px] bg-primary"
      aria-label={`Read: ${post.title}`}
    >
      {/* Background gradient overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10"
        aria-hidden="true"
      />

      {/* Decorative background */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'radial-gradient(circle at 30% 70%, #C9A24B 0%, transparent 60%), radial-gradient(circle at 70% 30%, #0E7C5A 0%, transparent 60%)',
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 p-8 md:p-10 flex flex-col gap-4 w-full">
        <div className="flex items-center gap-3">
          {primaryCategory && (
            <span className="bg-accent/20 text-accent text-xs font-semibold rounded-full px-3 py-1 uppercase tracking-wide">
              {primaryCategory.title}
            </span>
          )}
          <span className="text-white/60 text-sm">
            {post.reading_minutes} min read · {formatDate(post.published_at)}
          </span>
        </div>

        <h2 className="heading-xl font-display text-white leading-tight max-w-3xl group-hover:text-accent transition-colors">
          {post.title}
        </h2>
        <p className="text-white/70 text-lg leading-relaxed max-w-2xl line-clamp-2">
          {post.excerpt}
        </p>

        <div className="mt-2">
          <span className="inline-flex items-center gap-2 text-accent font-semibold text-sm group-hover:gap-3 transition-all">
            Read Article
            <span aria-hidden="true">→</span>
          </span>
        </div>
      </div>
    </Link>
  )
}
