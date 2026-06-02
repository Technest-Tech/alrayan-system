'use client'

import { useEffect, useRef, useState } from 'react'
import { Play, Pause } from 'lucide-react'

type Props = {
  src: string
  /** Short label, e.g. "Surah Al-Fatiha" */
  label?: string
  className?: string
}

/** Compact play/pause button with linear progress for teacher recitation samples. */
export function AudioPlayer({ src, label, className = '' }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    function onTime() {
      if (!a || !a.duration) return
      setProgress((a.currentTime / a.duration) * 100)
    }
    function onEnd() {
      setPlaying(false)
      setProgress(0)
    }
    a.addEventListener('timeupdate', onTime)
    a.addEventListener('ended', onEnd)
    return () => {
      a.removeEventListener('timeupdate', onTime)
      a.removeEventListener('ended', onEnd)
    }
  }, [])

  function toggle() {
    const a = audioRef.current
    if (!a) return
    if (playing) {
      a.pause()
      setPlaying(false)
    } else {
      a.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
    }
  }

  if (!src) return null

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <audio ref={audioRef} src={src} preload="none" />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? 'Pause recitation' : 'Play recitation'}
        className="shrink-0 size-10 rounded-full bg-accent text-primary flex items-center justify-center hover:scale-105 transition-transform shadow-md cursor-pointer"
      >
        {playing
          ? <Pause className="size-4 fill-current" aria-hidden="true" />
          : <Play  className="size-4 ml-0.5 fill-current" aria-hidden="true" />
        }
      </button>
      <div className="flex-1 min-w-0">
        {label && (
          <p className="text-xs text-muted-text mb-1 font-medium truncate">{label}</p>
        )}
        <div className="h-1.5 w-full rounded-full bg-border-soft overflow-hidden">
          <div
            className="h-full bg-accent transition-[width] duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
