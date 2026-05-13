import { siteConfig } from '@/config/site'
import type { Teacher } from '@/content/teachers'
import type { Course } from '@/content/courses'
import type { BlogPost } from '@/content/blog'

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

export function courseSchema(course: Course) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.longDescription,
    provider: {
      '@type': 'EducationalOrganization',
      name: siteConfig.name,
      url: siteConfig.url,
    },
    url: `${siteConfig.url}/courses/${course.slug}`,
    educationalLevel: course.level,
    ...(course.ageGroup && { typicalAgeRange: course.ageGroup }),
    offers: {
      '@type': 'Offer',
      url: `${siteConfig.url}/pricing`,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'Online',
      instructor: {
        '@type': 'EducationalOrganization',
        name: siteConfig.name,
      },
    },
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

export function blogPostingSchema(post: BlogPost) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    url: `${siteConfig.url}/blog/${post.slug}`,
    datePublished: post.published_at,
    dateModified: post.published_at,
    image: post.cover_image ?? `${siteConfig.url}/og-default.jpg`,
    author: {
      '@type': 'Person',
      name: post.author.name,
    },
    publisher: {
      '@type': 'EducationalOrganization',
      name: siteConfig.name,
      url: siteConfig.url,
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url}/logo/alrayan-full.svg`,
      },
    },
    timeRequired: `PT${post.reading_minutes}M`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteConfig.url}/blog/${post.slug}`,
    },
  }
}

export function localBusinessSchema(country: {
  slug: string
  name: string
  schema: { addressLocality: string; addressCountry: string }
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${siteConfig.url}/countries/${country.slug}`,
    name: siteConfig.name,
    description: `Online Quran and Arabic classes for students in ${country.name}. Certified Al-Azhar teachers, free first class.`,
    url: `${siteConfig.url}/countries/${country.slug}`,
    telephone: siteConfig.phone,
    email: siteConfig.email,
    address: {
      '@type': 'PostalAddress',
      addressLocality: country.schema.addressLocality,
      addressCountry: country.schema.addressCountry,
    },
    areaServed: country.name,
    priceRange: '$30–$70/month',
    openingHours: 'Mo-Su 00:00-23:59',
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Quran Classes',
      itemListElement: [
        {
          '@type': 'Offer',
          name: 'Free Trial Class',
          price: '0',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        },
        {
          '@type': 'Offer',
          name: 'Starter Plan',
          price: '30',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        },
      ],
    },
    sameAs: Object.values(siteConfig.social),
  }
}
