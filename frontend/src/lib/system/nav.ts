import {
  LayoutDashboard, UsersRound, CalendarDays,
  Award, DollarSign, Wallet, BarChart3, TrendingUp,
  Bell, Settings, ScrollText, UserCheck, CreditCard, ListChecks,
  GraduationCap, MessageSquare, ClipboardCheck,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  perm: string | null
}

export interface NavSection {
  label: string
  items: readonly NavItem[]
}

export const SYSTEM_NAV: readonly NavSection[] = [
  {
    label: 'nav.sections.operations',
    items: [
      { label: 'nav.dashboard',    href: '/dashboard',          icon: LayoutDashboard, perm: null },
      { label: 'nav.users',        href: '/users',              icon: UsersRound,      perm: 'users.view_directory' },
      { label: 'nav.leads',        href: '/leads',              icon: UserCheck,       perm: 'leads.view' },
      { label: 'nav.tasks',        href: '/tasks',              icon: ListChecks,      perm: 'tasks.view' },
      { label: 'nav.calendar',     href: '/calendar',           icon: CalendarDays,    perm: 'lessons.view' },
      { label: 'nav.quality',      href: '/quality',            icon: ClipboardCheck,  perm: 'qc.view' },
      { label: 'nav.certificates', href: '/certificates',       icon: Award,           perm: 'certificates.view' },
    ],
  },
  {
    label: 'nav.sections.finance',
    items: [
      { label: 'nav.payments',   href: '/payments',           icon: CreditCard, perm: 'lessons.view'  },
      { label: 'nav.billing',    href: '/billing/invoices',   icon: DollarSign, perm: 'invoices.view' },
      { label: 'nav.payroll',    href: '/payroll',            icon: Wallet,     perm: 'payroll.view' },
      { label: 'nav.accounting', href: '/accounting/revenue', icon: BarChart3,  perm: 'accounting.view' },
      { label: 'nav.analytics',  href: '/analytics',          icon: TrendingUp, perm: 'payroll.view_any' },
    ],
  },
  {
    label: 'nav.sections.communications',
    items: [
      { label: 'nav.notifications', href: '/notifications', icon: Bell, perm: 'notifications.view' },
      { label: 'nav.whatsappLogs', href: '/whatsapp/logs', icon: MessageSquare, perm: 'notifications.view_delivery_log' },
    ],
  },
  {
    label: 'nav.sections.admin',
    items: [
      { label: 'nav.settings', href: '/settings',          icon: Settings,   perm: 'settings.view' },
      { label: 'nav.auditLog', href: '/audit-log',         icon: ScrollText, perm: 'audit.view' },
    ],
  },
] as const

/**
 * Teachers are subjects, not operators: they have (almost) no permissions, so
 * the permission-filtered SYSTEM_NAV would leave them with an empty menu. They
 * get their own fixed, role-based menu instead (see navForUser in SystemShell).
 * All items are perm:null — visibility is by role, and every backing endpoint is
 * scoped to the authenticated teacher server-side.
 */
export const TEACHER_NAV: readonly NavSection[] = [
  {
    label: 'nav.sections.main',
    items: [
      { label: 'nav.dashboard',  href: '/dashboard',        icon: LayoutDashboard, perm: null },
      { label: 'nav.myStudents', href: '/teacher/students', icon: GraduationCap,   perm: null },
      { label: 'nav.calendar',   href: '/calendar',         icon: CalendarDays,    perm: null },
    ],
  },
  {
    label: 'nav.sections.admin',
    items: [
      { label: 'nav.settings', href: '/settings', icon: Settings, perm: null },
    ],
  },
] as const
