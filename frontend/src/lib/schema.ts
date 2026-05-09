import { siteConfig } from '@/config/site'
import type { Teacher } from '@/content/teachers'

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

export function aboutPageSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: `About ${siteConfig.name}`,
    url: `${siteConfig.url}/about`,
    description: 'Learn about Alrayan Academy — our mission, story, teaching approach, and certified teachers.',
    publisher: {
      '@type': 'EducationalOrganization',
      name: siteConfig.name,
      url: siteConfig.url,
    },
  }
}

export function personSchema(teacher: Teacher) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: teacher.name,
    jobTitle: teacher.role,
    worksFor: { '@type': 'EducationalOrganization', name: siteConfig.name },
    knowsLanguage: teacher.languages,
    description: teacher.bio,
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
