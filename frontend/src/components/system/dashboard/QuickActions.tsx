import Link from 'next/link'
import { UserPlus, UserCheck, CalendarDays, Receipt } from 'lucide-react'

const ACTIONS = [
  { label: '+ Add student',          href: '/students?action=new',          icon: UserPlus },
  { label: '+ Add lead',             href: '/leads?action=new',             icon: UserCheck },
  { label: "Open today's schedule",  href: '/schedule',                     icon: CalendarDays },
  { label: 'Create advance invoice', href: '/billing/invoices?action=new',  icon: Receipt },
]

export function QuickActions() {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: 'rgb(var(--surface-card, 255 255 255))', border: '1px solid rgb(var(--border-default, 229 233 240))' }}
    >
      <p className="font-semibold text-sm mb-3">Quick actions</p>
      <div className="space-y-2">
        {ACTIONS.map((a) => {
          const Icon = a.icon
          return (
            <Link
              key={a.href}
              href={a.href}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-black/5"
            >
              <Icon size={15} className="opacity-60 shrink-0" />
              {a.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
