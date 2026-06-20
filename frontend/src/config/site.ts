export const siteConfig = {
  name: 'Azhary',
  nameArabic: 'أزهري',
  tagline: 'Learn Quran Online — 1-on-1 Classes with Certified Teachers',
  description:
    'Premium online Quran, Arabic language, and Islamic studies academy. 1-on-1 classes with certified teachers from Al-Azhar. Free trial available.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://alrayan-academy.com',
  email: 'alrayanacadmy@gmail.com',
  phone: '+20 127 919 3105',
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP ?? '201279193105',
  whatsappDefaultMessage:
    'Assalamu alaikum, I would like to learn more about your Quran classes.',
  address: 'Online — Serving students worldwide',
  social: {
    facebook: 'https://www.facebook.com/alrayanaquran/',
    instagram: 'https://www.instagram.com/rayan_academyy/',
    youtube: 'https://youtube.com/@alrayanacademy',
    twitter: 'https://twitter.com/alrayanacademy',
  },
} as const

export function whatsappLink(message?: string) {
  const text = message ?? siteConfig.whatsappDefaultMessage
  return `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(text)}`
}
