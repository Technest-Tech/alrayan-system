import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { buildMetadata } from '@/lib/seo'
import { breadcrumbSchema, blogPostingSchema } from '@/lib/schema'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { LinkButton } from '@/components/ui/link-button'
import { TableOfContents } from '@/components/blog/TableOfContents'
import { SocialShare } from '@/components/blog/SocialShare'
import { RelatedPosts } from '@/components/blog/RelatedPosts'
import { blogPosts } from '@/content/blog'
import { siteConfig, whatsappLink } from '@/config/site'
import type { BlogPost } from '@/content/blog'

export const revalidate = 3600

type Props = { params: Promise<{ slug: string }> }

async function getPost(slug: string): Promise<BlogPost | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  if (apiUrl) {
    try {
      const res = await fetch(`${apiUrl}/api/v1/blog/${slug}`, {
        next: { revalidate: 3600 },
      })
      if (res.ok) return res.json()
    } catch {
      // fall through to static data
    }
  }
  return blogPosts.find((p) => p.slug === slug) ?? null
}

export function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return {}
  return buildMetadata({
    title: post.seo_title ?? post.title,
    description: post.seo_description ?? post.excerpt,
    path: `/blog/${slug}`,
    type: 'article',
  })
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso))
}

function addHeadingIds(html: string): string {
  return html.replace(/<(h[23])[^>]*>(.*?)<\/h[23]>/gi, (_, tag, content) => {
    const id = content
      .replace(/<[^>]+>/g, '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    return `<${tag} id="${id}">${content}</${tag}>`
  })
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  const relatedPosts = blogPosts
    .filter((p) => p.slug !== post.slug)
    .filter((p) =>
      p.categories.some((c) =>
        post.categories.map((pc) => pc.slug).includes(c.slug),
      ),
    )
    .slice(0, 3)

  const bodyWithIds = addHeadingIds(post.body)
  const postUrl = `${siteConfig.url}/blog/${post.slug}`

  const schemas = [
    blogPostingSchema(post),
    breadcrumbSchema([
      { name: 'Home', href: '/' },
      { name: 'Blog', href: '/blog' },
      { name: post.title, href: `/blog/${post.slug}` },
    ]),
  ]

  return (
    <>
      {schemas.map((s, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }}
        />
      ))}

      {/* Hero */}
      <section className="bg-primary pt-40 pb-16 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 80%, #C9A24B 0%, transparent 50%), radial-gradient(circle at 80% 20%, #0E7C5A 0%, transparent 50%)',
          }}
          aria-hidden="true"
        />
        <Container className="relative max-w-4xl">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-white/60 text-sm mb-6" aria-label="Breadcrumb">
            <a href="/" className="hover:text-white transition-colors">Home</a>
            <span aria-hidden="true">/</span>
            <a href="/blog" className="hover:text-white transition-colors">Blog</a>
            <span aria-hidden="true">/</span>
            <span className="text-white/40 line-clamp-1">{post.title}</span>
          </nav>

          {/* Categories */}
          {post.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.categories.map((c) => (
                <span
                  key={c.slug}
                  className="bg-secondary/20 text-accent text-xs font-semibold rounded-full px-3 py-1 uppercase tracking-wide"
                >
                  {c.title}
                </span>
              ))}
            </div>
          )}

          <h1 className="heading-display font-display text-white mb-6">{post.title}</h1>

          {/* Byline */}
          <div className="flex flex-wrap items-center gap-3 text-white/60 text-sm">
            <span>{post.author.name}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
            <span aria-hidden="true">·</span>
            <span>{post.reading_minutes} min read</span>
          </div>
        </Container>
      </section>

      {/* Article body + ToC */}
      <Section bg="white">
        <Container>
          <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-12 max-w-5xl mx-auto">
            {/* Article */}
            <article>
              <div
                className="prose prose-lg max-w-none prose-headings:font-display prose-headings:text-primary prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-li:text-foreground prose-p:text-foreground prose-strong:text-primary"
                dangerouslySetInnerHTML={{ __html: bodyWithIds }}
              />

              <SocialShare title={post.title} url={postUrl} />

              {relatedPosts.length > 0 && <RelatedPosts posts={relatedPosts} />}
            </article>

            {/* Table of Contents — sticky sidebar */}
            <aside className="hidden lg:block">
              <TableOfContents html={post.body} />
            </aside>
          </div>
        </Container>
      </Section>

      {/* CTA Banner */}
      <Section bg="primary">
        <Container>
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-accent text-sm font-semibold uppercase tracking-widest mb-4">
              Start Learning
            </p>
            <h2 className="heading-xl font-display text-white mb-4">
              Ready to Begin Your Quran Journey?
            </h2>
            <p className="text-white/70 text-lg mb-10">
              Book a free first class with a certified teacher — no payment, no commitment.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <LinkButton href="/contact" size="lg" variant="gold">
                Book Free Trial
              </LinkButton>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 h-14 px-7 rounded-xl border border-white/30 text-white font-medium hover:border-accent hover:text-accent transition-colors"
              >
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </Container>
      </Section>
    </>
  )
}
