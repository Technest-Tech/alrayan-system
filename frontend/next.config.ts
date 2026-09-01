import type { NextConfig } from 'next'

/**
 * The backend host that serves uploaded media, derived from the API URL so the
 * allow-list follows the environment instead of being hard-coded.
 *
 * Teacher photos are uploaded through the admin panel and served from the
 * backend's public storage, so `next/image` has to be told that host is
 * permitted — otherwise the optimiser answers 400 and every uploaded photo on
 * the public site fails to render.
 */
function uploadsPattern() {
  const url = process.env.NEXT_PUBLIC_API_URL
  if (!url) return []

  try {
    const { protocol, hostname, port } = new URL(url)
    return [
      {
        protocol: protocol.replace(':', '') as 'http' | 'https',
        hostname,
        port,
        // Scoped to the storage path: the whole host must not become an
        // open image proxy.
        pathname: '/storage/**',
      },
    ]
  } catch {
    return []
  }
}

const config: NextConfig = {
  images: {
    remotePatterns: [
      // Demo/placeholder course thumbnails pulled from the web.
      // Swap these out for real branded thumbnails when available.
      { protocol: 'https', hostname: 'loremflickr.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      // Uploaded media from the backend — localhost covers local development,
      // the derived pattern covers staging and production.
      { protocol: 'http', hostname: 'localhost', pathname: '/storage/**' },
      { protocol: 'http', hostname: '127.0.0.1', pathname: '/storage/**' },
      ...uploadsPattern(),
    ],
  },
}

export default config
