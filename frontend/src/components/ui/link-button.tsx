import Link from 'next/link'
import { cn } from '@/lib/utils'
import { buttonVariants } from './button'
import type { VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'

type LinkButtonProps = {
  href: string
  children: React.ReactNode
  className?: string
  external?: boolean
  onClick?: ComponentProps<'a'>['onClick']
} & VariantProps<typeof buttonVariants>

export function LinkButton({
  href,
  children,
  className,
  variant = 'default',
  size = 'default',
  external = false,
  onClick,
}: LinkButtonProps) {
  const cls = cn(buttonVariants({ variant, size }), className)
  if (external) {
    return (
      <a href={href} className={cls} target="_blank" rel="noopener noreferrer" onClick={onClick}>
        {children}
      </a>
    )
  }
  return (
    <Link href={href} className={cls} onClick={onClick}>
      {children}
    </Link>
  )
}
