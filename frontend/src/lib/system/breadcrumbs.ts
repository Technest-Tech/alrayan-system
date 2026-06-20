export interface Crumb {
  label: string
  href?: string
}

const PATH_KEYS: Record<string, string> = {
  dashboard:           'breadcrumbs.dashboard',
  students:            'breadcrumbs.students',
  teachers:            'breadcrumbs.teachers',
  leads:               'breadcrumbs.leads',
  courses:             'breadcrumbs.courses',
  'courses-admin':     'breadcrumbs.coursesAdmin',
  tasks:               'breadcrumbs.tasks',
  calendar:            'breadcrumbs.calendar',
  quality:             'breadcrumbs.quality',
  billing:             'breadcrumbs.billing',
  invoices:            'breadcrumbs.invoices',
  payments:            'breadcrumbs.payments',
  overdue:             'breadcrumbs.overdue',
  payroll:             'breadcrumbs.payroll',
  accounting:          'breadcrumbs.accounting',
  revenue:             'breadcrumbs.revenue',
  expenses:            'breadcrumbs.expenses',
  'profit-loss':       'breadcrumbs.profitLoss',
  collection:          'breadcrumbs.collection',
  cancellations:       'breadcrumbs.cancellations',
  trials:              'breadcrumbs.trials',
  'monthly-report':    'breadcrumbs.monthlyReport',
  notifications:       'breadcrumbs.notifications',
  'delivery-log':      'breadcrumbs.deliveryLog',
  templates:           'breadcrumbs.templates',
  'whatsapp-groups':   'breadcrumbs.whatsappGroups',
  certificates:        'breadcrumbs.certificates',
  teacher:             'breadcrumbs.teacherPortal',
  settings:            'breadcrumbs.settings',
  academy:             'breadcrumbs.academy',
  pricing:             'breadcrumbs.pricing',
  integrations:        'breadcrumbs.integrations',
  'expense-categories':'breadcrumbs.expenseCategories',
  users:               'breadcrumbs.users',
  'audit-log':         'breadcrumbs.auditLog',
  new:                 'breadcrumbs.new',
  edit:                'breadcrumbs.edit',
}

export function pathToCrumbs(pathname: string): Crumb[] {
  const segments = pathname.split('/').filter(Boolean)
  const crumbs: Crumb[] = [{ label: 'breadcrumbs.home', href: '/dashboard' }]

  let accumulated = ''
  for (const seg of segments) {
    accumulated += `/${seg}`
    const label = PATH_KEYS[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1)
    crumbs.push({ label, href: accumulated })
  }

  // Last crumb has no href (current page)
  if (crumbs.length > 1) {
    crumbs[crumbs.length - 1] = { label: crumbs[crumbs.length - 1].label }
  }

  return crumbs
}
