export const siteConfig = {
  name: 'Alrayan Academy',
  nameArabic: 'الريان',
  tagline: 'Learn Quran Online — 1-on-1 Classes with Certified Teachers',
  description:
    'Premium online Quran, Arabic language, and Islamic studies academy. 1-on-1 classes with certified teachers from Al-Azhar. Free trial available.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://alrayan-academy.com',
  email: 'info@alrayan-academy.com',
  phone: '+20 100 000 0000',
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP ?? '201000000000',
  whatsappDefaultMessage:
    'Assalamu alaikum, I would like to learn more about your Quran classes.',
  address: 'Online — Serving students worldwide',
  social: {
    facebook: 'https://facebook.com/alrayanacademy',
    instagram: 'https://instagram.com/alrayanacademy',
    youtube: 'https://youtube.com/@alrayanacademy',
    twitter: 'https://twitter.com/alrayanacademy',
  },
} as const

export function whatsappLink(message?: string) {
  const text = message ?? siteConfig.whatsappDefaultMessage
  return `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(text)}`
}
