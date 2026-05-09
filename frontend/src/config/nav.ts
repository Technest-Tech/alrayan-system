export type NavItem = {
  label: string
  href: string
  children?: NavItem[]
}

export const mainNav: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  {
    label: 'Courses',
    href: '/courses',
    children: [
      { label: 'Quran for Kids', href: '/courses/quran-classes-for-kids' },
      { label: 'Quran for Adults', href: '/courses/quran-classes-for-adults' },
      { label: 'Tajweed Course', href: '/courses/tajweed-course' },
      { label: 'Hifz / Memorization', href: '/courses/hifz-memorization' },
      { label: 'Noorani Qaida', href: '/courses/noorani-qaida' },
      { label: 'Arabic for Non-Arabs', href: '/courses/arabic-for-non-arabs' },
      { label: 'Islamic Studies', href: '/courses/islamic-studies' },
      { label: 'Ijazah Program', href: '/courses/ijazah-program' },
      { label: 'Tafseer', href: '/courses/tafseer-course' },
      { label: 'Ten Qiraat', href: '/courses/ten-qiraat' },
      { label: 'Female Teachers', href: '/courses/female-quran-teachers' },
    ],
  },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Blog', href: '/blog' },
  { label: 'FAQ', href: '/faq' },
]

export const footerNav = {
  Courses: [
    { label: 'Noorani Qaida', href: '/courses/noorani-qaida' },
    { label: 'Quran for Kids', href: '/courses/quran-classes-for-kids' },
    { label: 'Quran for Adults', href: '/courses/quran-classes-for-adults' },
    { label: 'Tajweed Course', href: '/courses/tajweed-course' },
    { label: 'Hifz / Memorization', href: '/courses/hifz-memorization' },
    { label: 'Tafseer', href: '/courses/tafseer-course' },
    { label: 'Ijazah Program', href: '/courses/ijazah-program' },
    { label: 'Ten Qiraat', href: '/courses/ten-qiraat' },
    { label: 'Arabic for Non-Arabs', href: '/courses/arabic-for-non-arabs' },
    { label: 'Islamic Studies', href: '/courses/islamic-studies' },
    { label: 'Female Teachers', href: '/courses/female-quran-teachers' },
  ],
  Company: [
    { label: 'About Us', href: '/about' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Blog', href: '/blog' },
    { label: 'Contact', href: '/contact' },
  ],
  Regions: [
    { label: 'USA', href: '/countries/usa' },
    { label: 'United Kingdom', href: '/countries/uk' },
    { label: 'Canada', href: '/countries/canada' },
    { label: 'Australia', href: '/countries/australia' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
}
