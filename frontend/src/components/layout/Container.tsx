import { createElement } from 'react'
import { cn } from '@/lib/utils'

type ContainerProps = {
  children: React.ReactNode
  className?: string
  as?: React.ElementType
}

export function Container({
  children,
  className,
  as: Tag = 'div',
}: ContainerProps) {
  return createElement(Tag, { className: cn('container-site', className) }, children)
}
