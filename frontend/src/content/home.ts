import type { Locale } from '@/i18n/config'

export const homeContent = {
  hero: {
    arabicVerse: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    arabicVerseLabel: 'In the name of Allah, the Most Gracious, the Most Merciful',
    headingStart: 'Learn',
    headingEmphasis: 'Arabic & Quran',
    headingEnd: 'with Certified Teachers',
    subheading:
      'Premium 1-on-1 classes in Quran, Tajweed, Hifz, Arabic, and Islamic Studies. Certified teachers from Al-Azhar. Students in 50+ countries.',
    ctaPrimary: 'Book Free Trial Class',
    ctaSecondary: 'Chat on WhatsApp',
    microcopy: '✓ Free first class · ✓ No credit card required · ✓ Cancel anytime',
  },

  trustBadges: [
    { icon: 'Users',         label: '1-on-1 Classes' },
    { icon: 'ShieldCheck',   label: 'Free First Class' },
    { icon: 'Heart',         label: 'Female Teachers Available' },
    { icon: 'Globe',         label: 'Native Arab Tutors' },
    { icon: 'GraduationCap', label: 'Ijazah-Certified' },
  ],

  whyUs: {
    eyebrow: 'Why Azhary',
    heading: 'Scholars, Not Just Teachers',
    body: "Every teacher at Azhary holds an authenticated Ijazah — a chain of transmission going back to the Prophet ﷺ. We don't hire tutors; we partner with certified scholars.",
    items: [
      {
        icon: 'BookOpen',
        title: 'Qualified Teachers',
        desc: 'All teachers hold Ijazah and are graduates of Al-Azhar or equivalent Islamic universities.',
      },
      {
        icon: 'Clock',
        title: 'Flexible Scheduling',
        desc: 'Classes 7 days a week across all timezones — mornings, afternoons, or evenings.',
      },
      {
        icon: 'ShieldCheck',
        title: 'Risk-Free Trial',
        desc: 'Book your first class completely free. No credit card, no commitment.',
      },
    ],
    decorativeVerse: 'اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ',
    decorativeVerseTranslation: '"Read in the name of your Lord who created." — Al-Alaq 96:1',
  },

  cta: {
    arabicHadith: 'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ',
    hadithTranslation:
      '"The best of you are those who learn the Quran and teach it." — Prophet Muhammad ﷺ',
    heading: 'Begin Your Quran Journey Today',
    subheading: 'Join 10,000+ students from 50+ countries. Your first class is completely free.',
    ctaPrimary: 'Book Free Trial Class',
    ctaSecondary: 'Chat on WhatsApp',
  },
}

export const homeContentFr: typeof homeContent = {
  hero: {
    arabicVerse: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    arabicVerseLabel: 'Au nom d’Allah, le Tout Miséricordieux, le Très Miséricordieux',
    headingStart: 'Apprenez',
    headingEmphasis: 'l’arabe et le Coran',
    headingEnd: 'avec des enseignants certifiés',
    subheading:
      'Cours particuliers haut de gamme de Coran, Tajwid, Hifz, arabe et sciences islamiques. Enseignants certifiés d’Al-Azhar. Des élèves dans plus de 50 pays.',
    ctaPrimary: 'Réserver un cours d’essai gratuit',
    ctaSecondary: 'Discuter sur WhatsApp',
    microcopy: '✓ Premier cours gratuit · ✓ Sans carte bancaire · ✓ Annulation à tout moment',
  },

  trustBadges: [
    { icon: 'Users',         label: 'Cours particuliers' },
    { icon: 'ShieldCheck',   label: 'Premier cours gratuit' },
    { icon: 'Heart',         label: 'Enseignantes disponibles' },
    { icon: 'Globe',         label: 'Tuteurs arabophones natifs' },
    { icon: 'GraduationCap', label: 'Certifiés par Ijazah' },
  ],

  whyUs: {
    eyebrow: 'Pourquoi Azhary',
    heading: 'Des savants, pas de simples enseignants',
    body: 'Chaque enseignant de Azhary détient une Ijazah authentifiée — une chaîne de transmission (sanad) remontant jusqu’au Prophète ﷺ. Nous ne recrutons pas des tuteurs ; nous collaborons avec des savants certifiés.',
    items: [
      {
        icon: 'BookOpen',
        title: 'Enseignants qualifiés',
        desc: 'Tous nos enseignants détiennent une Ijazah et sont diplômés d’Al-Azhar ou d’universités islamiques équivalentes.',
      },
      {
        icon: 'Clock',
        title: 'Horaires flexibles',
        desc: 'Des cours 7 jours sur 7 dans tous les fuseaux horaires — le matin, l’après-midi ou le soir.',
      },
      {
        icon: 'ShieldCheck',
        title: 'Essai sans risque',
        desc: 'Réservez votre premier cours entièrement gratuit. Sans carte bancaire, sans engagement.',
      },
    ],
    decorativeVerse: 'اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ',
    decorativeVerseTranslation: '« Lis, au nom de ton Seigneur qui a créé. » — Al-Alaq 96:1',
  },

  cta: {
    arabicHadith: 'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ',
    hadithTranslation:
      '« Les meilleurs d’entre vous sont ceux qui apprennent le Coran et l’enseignent. » — le Prophète Muhammad ﷺ',
    heading: 'Commencez votre parcours coranique dès aujourd’hui',
    subheading:
      'Rejoignez plus de 10 000 élèves issus de plus de 50 pays. Votre premier cours est entièrement gratuit.',
    ctaPrimary: 'Réserver un cours d’essai gratuit',
    ctaSecondary: 'Discuter sur WhatsApp',
  },
}

export function getHomeContent(locale: Locale) {
  return locale === 'fr' ? homeContentFr : homeContent
}
