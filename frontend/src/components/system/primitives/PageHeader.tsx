import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: ReactNode
  actions?: ReactNode
  children?: ReactNode
}

export function PageHeader({ title, description, actions, children }: PageHeaderProps) {
  const slot = actions ?? children
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-xl font-semibold leading-tight">{title}</h1>
        {description && <p className="mt-1 text-sm opacity-60">{description}</p>}
      </div>
      {slot && <div className="flex items-center gap-2 shrink-0">{slot}</div>}
    </div>
  )
}
