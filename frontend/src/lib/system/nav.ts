import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Calendar,
  ClipboardCheck, FileText, Award, DollarSign, Wallet, BarChart3,
  Bell, MessageCircle, Settings, ScrollText, UserCheck,
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
    label: 'Operations',
    items: [
      { label: 'Dashboard',        href: '/dashboard',          icon: LayoutDashboard, perm: null },
      { label: 'Leads',            href: '/leads',              icon: UserCheck,       perm: 'leads.view' },
      { label: 'Students',         href: '/students',           icon: Users,           perm: 'students.view' },
      { label: 'Teachers',         href: '/teachers',           icon: GraduationCap,   perm: 'teachers.view' },
      { label: 'Schedule',         href: '/schedule',           icon: Calendar,        perm: 'schedule.view' },
      { label: 'Attendance',       href: '/attendance',         icon: ClipboardCheck,  perm: 'attendance.view' },
      { label: 'Session reports',  href: '/session-reports',    icon: FileText,        perm: 'reports.view' },
      { label: 'Certificates',     href: '/certificates',       icon: Award,           perm: 'certificates.view' },
      { label: 'Courses',          href: '/courses-admin',      icon: BookOpen,        perm: 'courses.view' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Billing',    href: '/billing/invoices',   icon: DollarSign, perm: 'invoices.view' },
      { label: 'Payroll',    href: '/payroll',            icon: Wallet,     perm: 'payroll.view' },
      { label: 'Accounting', href: '/accounting/revenue', icon: BarChart3,  perm: 'accounting.view' },
    ],
  },
  {
    label: 'Communications',
    items: [
      { label: 'Notifications',   href: '/notifications',   icon: Bell,          perm: 'notifications.view' },
      { label: 'WhatsApp groups', href: '/whatsapp-groups', icon: MessageCircle, perm: 'whatsapp.view' },
    ],
  },
  {
    label: 'Admin',
    items: [
      { label: 'Settings',  href: '/settings/academy', icon: Settings,    perm: 'settings.view' },
      { label: 'Audit log', href: '/audit-log',         icon: ScrollText,  perm: 'audit.view' },
    ],
  },
] as const
