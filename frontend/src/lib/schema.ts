import { siteConfig } from '@/config/site'

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: siteConfig.name,
    alternateName: siteConfig.nameArabic,
    description: siteConfig.description,
    url: siteConfig.url,
    email: siteConfig.email,
    telephone: siteConfig.phone,
    logo: `${siteConfig.url}/logo/alrayan-full.svg`,
    image: `${siteConfig.url}/og-default.jpg`,
    sameAs: Object.values(siteConfig.social),
    areaServed: 'Worldwide',
    knowsAbout: [
      'Quran Teaching',
      'Tajweed',
      'Hifz',
      'Arabic Language',
      'Islamic Studies',
      'Ijazah',
    ],
  }
}

export function breadcrumbSchema(
  items: Array<{ name: string; href: string }>,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${siteConfig.url}${item.href}`,
    })),
  }
}

export function faqSchema(faqs: Array<{ q: string; a: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a },
    })),
  }
}
