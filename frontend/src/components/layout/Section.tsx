import { cn } from '@/lib/utils'

type SectionProps = {
  children: React.ReactNode
  className?: string
  bg?: 'white' | 'cream' | 'primary'
  id?: string
  as?: React.ElementType
}

export function Section({
  children,
  className,
  bg = 'white',
  id,
  as: Tag = 'section',
}: SectionProps) {
  const bgClass =
    bg === 'cream'
      ? 'bg-cream'
      : bg === 'primary'
        ? 'bg-primary text-white'
        : 'bg-white'

  return (
    <Tag id={id} className={cn('section', bgClass, className)}>
      {children}
    </Tag>
  )
}
