import type { LucideIcon } from 'lucide-react'
import * as Icons from 'lucide-react'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: string | LucideIcon
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  let IconComponent: LucideIcon | null = null

  if (typeof icon === 'string') {
    // @ts-expect-error dynamic icon lookup
    IconComponent = Icons[icon] ?? null
  } else if (icon) {
    IconComponent = icon
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {IconComponent && (
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'rgb(var(--surface-card-2, 248 250 252))' }}
        >
          <IconComponent size={24} className="opacity-40" />
        </div>
      )}
      <p className="font-semibold">{title}</p>
      {description && (
        <p className="mt-1 text-sm opacity-50 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
