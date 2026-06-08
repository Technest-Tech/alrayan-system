import type { MetadataRoute } from 'next'
import { siteConfig } from '@/config/site'

export default function robots(): MetadataRoute.Robots {
  const isProd = process.env.NODE_ENV === 'production'
  const allowIndexing = process.env.NEXT_PUBLIC_ALLOW_INDEXING !== 'false'
  if (!isProd || !allowIndexing) {
    return { rules: [{ userAgent: '*', disallow: '/' }] }
  }
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/admin/'] }],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  }
}
