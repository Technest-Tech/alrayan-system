import type { MetadataRoute } from 'next'
import { siteConfig } from '@/config/site'
import { blogPosts } from '@/content/blog'

const base = siteConfig.url
const now = new Date()

const staticRoutes: MetadataRoute.Sitemap = [
  { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
  { url: `${base}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
  { url: `${base}/courses`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
  { url: `${base}/pricing`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
  { url: `${base}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
  { url: `${base}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  { url: `${base}/blog`, lastModified: now, changeFrequency: 'daily', priority: 0.6 },
]

const courseSlugs = [
  'noorani-qaida',
  'quran-classes-for-kids',
  'quran-classes-for-adults',
  'tajweed-course',
  'hifz-memorization',
  'arabic-for-non-arabs',
  'islamic-studies',
  'ijazah-program',
  'tafseer-course',
  'ten-qiraat',
  'female-quran-teachers',
]

const courseRoutes: MetadataRoute.Sitemap = courseSlugs.map((slug) => ({
  url: `${base}/courses/${slug}`,
  lastModified: now,
  changeFrequency: 'monthly' as const,
  priority: 0.9,
}))

const countryRoutes: MetadataRoute.Sitemap = ['usa', 'uk', 'canada', 'australia'].map(
  (country) => ({
    url: `${base}/countries/${country}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.85,
  }),
)

const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => ({
  url: `${base}/blog/${post.slug}`,
  lastModified: new Date(post.published_at),
  changeFrequency: 'monthly' as const,
  priority: 0.7,
}))

export default function sitemap(): MetadataRoute.Sitemap {
  return [...staticRoutes, ...courseRoutes, ...countryRoutes, ...blogRoutes]
}
