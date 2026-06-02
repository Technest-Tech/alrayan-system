'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Play } from 'lucide-react'
import { youtubeEmbedUrl, youtubeThumbUrl } from '@/config/media'

type Props = {
  /** Any YouTube URL or 11-char video id. */
  url: string
  /** Optional custom poster — falls back to YouTube's hqdefault. */
  poster?: string
  /** Accessible label for the play button. */
  label?: string
  /** Aspect ratio class — defaults to 16/9. */
  aspectClassName?: string
  className?: string
  /** Rounded corners (default 'rounded-3xl'). */
  roundedClassName?: string
}

/**
 * Lite YouTube embed — shows a poster image with a play button, and only
 * mounts the iframe after the user clicks. Avoids loading the YouTube player
 * (and its trackers) on initial page render.
 */
export function YouTubeEmbed({
  url,
  poster,
  label = 'Play video',
  aspectClassName = 'aspect-video',
  className = '',
  roundedClassName = 'rounded-3xl',
}: Props) {
  const [active, setActive] = useState(false)
  const embedUrl = youtubeEmbedUrl(url)
  const thumb = poster || youtubeThumbUrl(url) || ''

  if (!embedUrl) return null

  return (
    <div className={`relative ${aspectClassName} overflow-hidden ${roundedClassName} bg-primary shadow-[0_20px_56px_rgba(0,0,0,0.45)] ${className}`}>
      {active ? (
        <iframe
          src={`${embedUrl}&autoplay=1`}
          title={label}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setActive(true)}
          aria-label={label}
          className="absolute inset-0 w-full h-full group cursor-pointer"
        >
          {thumb ? (
            <Image
              src={thumb}
              alt=""
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="absolute inset-0 bg-primary" />
          )}
          {/* Soft overlay for contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 transition-opacity group-hover:opacity-80" aria-hidden="true" />
          {/* Play button */}
          <span
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center size-20 rounded-full bg-accent text-primary shadow-[0_10px_30px_rgba(0,0,0,0.45)] transition-transform group-hover:scale-110"
            aria-hidden="true"
          >
            <Play className="size-9 ml-1 fill-current" />
          </span>
        </button>
      )}
    </div>
  )
}
