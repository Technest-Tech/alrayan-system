// Navigation structure. Labels are dictionary KEYS (resolved via the i18n
// translator), not literal strings, so the same structure serves EN and FR.
// hrefs are the un-prefixed (English) paths; components add the `/fr` prefix
// for French via localizedHref().

export type NavItem = {
  labelKey: string
  href: string
  children?: NavItem[]
}

// Every course page, in display order — drives the sitemap. Labels come from
// `courseLinks.<slug>`.
export const courseSlugs = [
  'quran',
  'arabic',
  'arabic-and-quran',
  'quran-classes-for-kids',
  'quran-classes-for-adults',
  'tajweed-course',
  'hifz-memorization',
  'noorani-qaida',
  'arabic-for-non-arabs',
  'islamic-studies',
  'ijazah-program',
  'tafseer-course',
  'ten-qiraat',
  'female-quran-teachers',
] as const

// The four courses the academy actually offers. Only these appear in the header
// dropdown, the footer and the trial-booking form; the specialised pages
// (Tajweed, Hifz, Ijazah and the rest) stay reachable from the /courses
// catalogue, where they earn their search traffic.
export const navCourseSlugs = ['quran', 'arabic', 'arabic-and-quran', 'islamic-studies'] as const

const courseChildren: NavItem[] = navCourseSlugs.map((slug) => ({
  labelKey: `courseLinks.${slug}`,
  href: `/courses/${slug}`,
}))

export const mainNav: NavItem[] = [
  { labelKey: 'nav.home', href: '/' },
  { labelKey: 'nav.teachers', href: '/#teachers' },
  { labelKey: 'nav.courses', href: '/courses', children: courseChildren },
  { labelKey: 'nav.pricing', href: '/pricing' },
  { labelKey: 'nav.blog', href: '/blog' },
  { labelKey: 'nav.faq', href: '/faq' },
]

export type FooterGroup = {
  headingKey: string
  items: NavItem[]
}

export const footerNav: Record<'courses' | 'company' | 'legal', FooterGroup> = {
  courses: {
    headingKey: 'footer.coursesHeading',
    items: courseChildren,
  },
  company: {
    headingKey: 'footer.companyHeading',
    items: [
      { labelKey: 'footer.pricing', href: '/pricing' },
      { labelKey: 'footer.faq', href: '/faq' },
      { labelKey: 'footer.blog', href: '/blog' },
      { labelKey: 'footer.contact', href: '/contact' },
    ],
  },
  legal: {
    headingKey: 'footer.legalHeading',
    items: [
      { labelKey: 'footer.privacy', href: '/privacy' },
      { labelKey: 'footer.terms', href: '/terms' },
    ],
  },
}
