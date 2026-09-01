import { cn } from '@/lib/utils'

type SectionDividerProps = {
  /** `light` for use on cream/white backgrounds, `dark` for navy/green backgrounds. */
  tone?: 'light' | 'dark'
  className?: string
}

/**
 * Ornamental splitter placed at the top of a section to separate it from the
 * one above. A thin gold-fading rule with a small diamond centrepiece.
 */
export function SectionDivider({ tone = 'light', className }: SectionDividerProps) {
  const line = tone === 'dark' ? 'via-accent/60' : 'via-accent/70'
  const ring = tone === 'dark' ? 'border-accent/50' : 'border-accent/60'

  return (
    <div
      className={cn('flex items-center justify-center gap-4 sm:gap-5 pt-8 sm:pt-10', className)}
      aria-hidden="true"
    >
      <span className={cn('h-0.5 w-20 sm:w-32 rounded-full bg-gradient-to-r from-transparent to-transparent', line)} />
      <span className="relative flex items-center justify-center">
        {/* Outer glow ring */}
        <span className={cn('absolute size-7 sm:size-8 rotate-45 rounded-[3px] border-2', ring)} />
        {/* Solid gold diamond */}
        <span className="size-3.5 sm:size-4 rotate-45 rounded-[2px] bg-accent shadow-[0_0_12px_rgba(201,162,75,0.6)]" />
      </span>
      <span className={cn('h-0.5 w-20 sm:w-32 rounded-full bg-gradient-to-l from-transparent to-transparent', line)} />
    </div>
  )
}
