'use client'
import Link from 'next/link'
import { UserPlus, UserCheck, CalendarDays, Receipt } from 'lucide-react'
import { useI18n } from '@/lib/system/i18n'

const ACTION_DEFS = [
  { key: 'dashboard.addStudent',   href: '/students?action=new',         icon: UserPlus },
  { key: 'dashboard.addLead',      href: '/leads?action=new',            icon: UserCheck },
  { key: 'dashboard.openSchedule', href: '/schedule',                    icon: CalendarDays },
  { key: 'dashboard.createInvoice',href: '/billing/invoices?action=new', icon: Receipt },
]

export function QuickActions() {
  const { t } = useI18n()

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: 'rgb(var(--surface-card, 255 255 255))', border: '1px solid rgb(var(--border-default, 229 233 240))' }}
    >
      <p className="font-semibold text-sm mb-3">{t('dashboard.quickActions')}</p>
      <div className="space-y-2">
        {ACTION_DEFS.map((a) => {
          const Icon = a.icon
          return (
            <Link
              key={a.href}
              href={a.href}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-black/5"
            >
              <Icon size={15} className="opacity-60 shrink-0" />
              {t(a.key)}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
