'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'

/**
 * Sticky "Book Free Trial" bar shown on mobile only, after the user has
 * scrolled past the hero. Hidden on lg+ screens (the floating WhatsApp button
 * and inline CTAs handle desktop).
 */
export function StickyMobileCTA() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 600)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      aria-hidden={!visible}
      className={`
        fixed left-3 right-3 z-40 lg:hidden
        transition-all duration-300
        ${visible ? 'bottom-3 opacity-100' : '-bottom-20 opacity-0 pointer-events-none'}
      `}
    >
      <Link
        href="/contact"
        className="flex items-center justify-center gap-2 h-14 w-full rounded-2xl bg-accent text-primary font-semibold shadow-[0_12px_32px_rgba(11,31,58,0.25)] active:scale-[0.98] transition-transform"
      >
        <Sparkles className="size-5" aria-hidden="true" />
        Book Your Free Trial
      </Link>
    </div>
  )
}
