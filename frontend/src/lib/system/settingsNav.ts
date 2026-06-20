// Tabs shown across the top of the Settings area. Each tab is its own route
// under /settings/* and renders inside settings/layout.tsx.
export interface SettingsTab {
  label: string
  href: string
}

export const SETTINGS_TABS: readonly SettingsTab[] = [
  { label: 'Subjects',         href: '/settings/subjects' },
  { label: 'General Settings', href: '/settings/academy' },
  // Other sections removed for now — restore by adding them back here:
  // { label: 'Lesson Subjects',    href: '/settings/lesson-subjects' },
  // { label: 'Lesson Evaluations', href: '/settings/lesson-evaluations' },
  // { label: 'Pricing',            href: '/settings/pricing' },
  // { label: 'Billing',            href: '/settings/billing' },
  // { label: 'Expense Categories', href: '/settings/expense-categories' },
  // { label: 'FX Rates',           href: '/settings/fx-rates' },
  // { label: 'Users',              href: '/settings/users' },
  // { label: 'Notifications',      href: '/settings/notifications' },
  // { label: 'Integrations',       href: '/settings/integrations' },
  // { label: 'Backups',            href: '/settings/backups' },
] as const
