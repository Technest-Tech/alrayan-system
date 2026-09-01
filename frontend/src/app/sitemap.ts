import type { MetadataRoute } from 'next'
import { siteConfig } from '@/config/site'
import { blogPosts } from '@/content/blog'
import { courseSlugs } from '@/config/nav'

const base = siteConfig.url
const now = new Date()

type Entry = {
  path: string
  lastModified: Date
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>
  priority: number
}

const entries: Entry[] = [
  { path: '', lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
  { path: '/courses', lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
  { path: '/pricing', lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
  { path: '/contact', lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
  { path: '/faq', lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  { path: '/blog', lastModified: now, changeFrequency: 'daily', priority: 0.6 },
  ...courseSlugs.map((slug) => ({
    path: `/courses/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.9,
  })),
  ...['usa', 'uk', 'canada', 'australia'].map((country) => ({
    path: `/countries/${country}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.85,
  })),
  ...blogPosts.map((post) => ({
    path: `/blog/${post.slug}`,
    lastModified: new Date(post.published_at),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  })),
]

/**
 * Every route is published twice — English at `/path` and French at `/fr/path` —
 * each carrying hreflang alternates pointing at the other.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return entries.flatMap(({ path, lastModified, changeFrequency, priority }) => {
    const en = `${base}${path}`
    const fr = `${base}/fr${path}`
    const languages = { en, fr }
    return [
      { url: en, lastModified, changeFrequency, priority, alternates: { languages } },
      { url: fr, lastModified, changeFrequency, priority, alternates: { languages } },
    ]
  })
}
