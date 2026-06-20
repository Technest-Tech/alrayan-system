'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { pathToCrumbs } from '@/lib/system/breadcrumbs'
import { useI18n } from '@/lib/system/i18n'

export function Breadcrumbs() {
  const pathname = usePathname()
  const { t } = useI18n()
  const crumbs = pathToCrumbs(pathname)

  if (crumbs.length <= 1) return null

  return (
    <nav className="flex items-center gap-1 text-sm">
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight size={14} className="opacity-30" />}
          {crumb.href ? (
            <Link href={crumb.href} className="opacity-50 hover:opacity-80 transition-opacity">
              {t(crumb.label)}
            </Link>
          ) : (
            <span className="font-medium">{t(crumb.label)}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
