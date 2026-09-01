import type { Locale } from '@/i18n/config'

export type Stat = {
  value: string
  label: string
  description?: string
}

export const stats: Stat[] = [
  { value: '10,000+', label: 'Students Taught', description: 'Across 50+ countries worldwide' },
  { value: '50+', label: 'Countries Served', description: 'From USA to Malaysia' },
  { value: '100+', label: 'Certified Teachers', description: 'Al-Azhar & Ijazah certified' },
  { value: '4.9★', label: 'Average Rating', description: 'From 2,000+ verified reviews' },
]

export const statsFr: Stat[] = [
  { value: '10 000+', label: 'Élèves formés', description: 'Dans plus de 50 pays à travers le monde' },
  { value: '50+', label: 'Pays desservis', description: 'Des États-Unis à la Malaisie' },
  { value: '100+', label: 'Enseignants certifiés', description: 'Certifiés Al-Azhar et Ijazah' },
  { value: '4,9★', label: 'Note moyenne', description: 'Sur plus de 2 000 avis vérifiés' },
]

export function getStats(locale: Locale): Stat[] {
  return locale === 'fr' ? statsFr : stats
}
