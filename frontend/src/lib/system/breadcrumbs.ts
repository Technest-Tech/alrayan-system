export interface Crumb {
  label: string
  href?: string
}

const PATH_LABELS: Record<string, string> = {
  dashboard:        'Dashboard',
  students:         'Students',
  teachers:         'Teachers',
  leads:            'Leads',
  courses:          'Courses',
  schedule:         'Schedule',
  attendance:       'Attendance',
  'session-reports':'Session Reports',
  quality:          'Quality',
  billing:          'Billing',
  invoices:         'Invoices',
  payments:         'Payments',
  overdue:          'Overdue',
  payroll:          'Payroll',
  accounting:       'Accounting',
  revenue:          'Revenue',
  expenses:         'Expenses',
  'profit-loss':    'Profit & Loss',
  collection:       'Collection',
  cancellations:    'Cancellations',
  trials:           'Trials',
  'monthly-report': 'Monthly Report',
  notifications:    'Notifications',
  'delivery-log':   'Delivery Log',
  templates:        'Templates',
  'whatsapp-groups':'WhatsApp Groups',
  certificates:     'Certificates',
  teacher:          'Teacher Portal',
  settings:         'Settings',
  academy:          'Academy',
  pricing:          'Pricing',
  integrations:     'Integrations',
  'expense-categories': 'Expense Categories',
  users:            'Users',
  'audit-log':      'Audit Log',
  new:              'New',
  edit:             'Edit',
}

export function pathToCrumbs(pathname: string): Crumb[] {
  const segments = pathname.split('/').filter(Boolean)
  const crumbs: Crumb[] = [{ label: 'Home', href: '/dashboard' }]

  let accumulated = ''
  for (const seg of segments) {
    accumulated += `/${seg}`
    const label = PATH_LABELS[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1)
    crumbs.push({ label, href: accumulated })
  }

  // Last crumb has no href (current page)
  if (crumbs.length > 1) {
    crumbs[crumbs.length - 1] = { label: crumbs[crumbs.length - 1].label }
  }

  return crumbs
}
