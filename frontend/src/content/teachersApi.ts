import type {
  Teacher,
  SpecialtyDetail,
  TeacherExperience,
  TeacherCertification,
  RatingBreakdown,
  DaySchedule,
} from './teachers'
import type { Locale } from '@/i18n/config'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8001'

type ApiReview = { id: number; author: string; rating: number; text: string }

type ApiTeacher = {
  id: number
  slug: string
  name: string
  name_arabic: string | null
  role: string
  title: string | null
  country: string | null
  bio: string
  image: string | null
  specialties: string[] | null
  languages: string[] | null
  tags: string[] | null
  credentials: string | null
  is_female: boolean
  years_experience: number
  students_count: number
  rating: number
  reviews_count: number
  hourly_rate: number
  currency: string
  elite: boolean
  for_children: boolean
  free_trial: boolean
  courses_given: number
  teaching_hours: number
  quote: string | null
  about: string | null
  teaching_style: string | null
  strengths: string | null
  reviews?: ApiReview[]
}

const SPECIALTY_DESC: Record<Locale, Record<string, string>> = {
  en: {
    'Tajweed': 'Mastery of the rules of Tajweed for correct and fluent recitation of the Quran.',
    'Hifz': 'A structured method to memorize the Holy Quran and retain it for life.',
    'Hifz / Memorization': 'A structured method to memorize the Holy Quran and retain it for life.',
    'Ijazah': 'Certification with an authentic, unbroken chain of transmission (sanad).',
    'Ten Qiraat': 'The ten canonical modes of Quranic recitation, taught with precision.',
    'Quran for Kids': 'A playful and caring approach to teaching children the Quran and Arabic.',
    'Noorani Qaida': 'The foundational primer for reading Arabic letters and Quranic script.',
    'Arabic for Non-Arabs': 'Arabic from the alphabet to conversation, built for non-native speakers.',
    'Arabic': 'Arabic from the alphabet to conversation, built for non-native speakers.',
    'Quranic Arabic': 'Understand the language of the Quran — grammar, vocabulary and meaning.',
    'Islamic Studies': 'Introduction to Islamic sciences: fiqh, seerah, aqeedah and Muslim character.',
    'Islamic Studies for Kids': 'Islamic manners and stories, taught in a way children love.',
    'Tafseer': 'Deep study of the meanings and wisdom behind the verses of the Quran.',
    'Seerah': 'The life of the Prophet ﷺ and the lessons it holds for us today.',
    'Aqeedah': 'The foundations of Islamic belief, taught clearly and authentically.',
    'Quran for Adults': 'Start or restart your Quran journey with patience and no judgment.',
    'Revision Techniques': "Proven techniques to review and cement what you've memorized.",
  },
  fr: {
    'Tajweed': 'Maîtrise des règles du Tajwid pour une récitation correcte et fluide du Coran.',
    'Hifz': 'Une méthode structurée pour mémoriser le Saint Coran et le retenir à vie.',
    'Hifz / Memorization': 'Une méthode structurée pour mémoriser le Saint Coran et le retenir à vie.',
    'Ijazah': 'Une certification avec une chaîne de transmission authentique et ininterrompue (sanad).',
    'Ten Qiraat': 'Les dix modes canoniques de récitation coranique, enseignés avec précision.',
    'Quran for Kids': 'Une approche ludique et bienveillante pour enseigner le Coran et l’arabe aux enfants.',
    'Noorani Qaida': 'Le manuel fondamental pour apprendre à lire les lettres arabes et l’écriture coranique.',
    'Arabic for Non-Arabs': 'L’arabe, de l’alphabet à la conversation, conçu pour les non-arabophones.',
    'Arabic': 'L’arabe, de l’alphabet à la conversation, conçu pour les non-arabophones.',
    'Quranic Arabic': 'Comprendre la langue du Coran — grammaire, vocabulaire et sens.',
    'Islamic Studies': 'Introduction aux sciences islamiques : fiqh, sîra, aqida et comportement du musulman.',
    'Islamic Studies for Kids': 'Le savoir-vivre islamique et des récits, enseignés d’une façon que les enfants adorent.',
    'Tafseer': 'Étude approfondie des sens et de la sagesse des versets du Coran.',
    'Seerah': 'La vie du Prophète ﷺ et les enseignements qu’elle nous offre aujourd’hui.',
    'Aqeedah': 'Les fondements de la croyance islamique, enseignés clairement et avec authenticité.',
    'Quran for Adults': 'Commencez ou reprenez votre parcours coranique avec patience et sans jugement.',
    'Revision Techniques': 'Des techniques éprouvées pour réviser et ancrer ce que vous avez mémorisé.',
  },
}

const SPECIALTY_FALLBACK: Record<Locale, string> = {
  en: 'Taught with care, authenticity and a personalised approach.',
  fr: 'Enseigné avec soin, authenticité et une approche personnalisée.',
}

const DAY_NAMES: Record<Locale, string[]> = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  fr: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
}

const DAY_SLOTS: (string | null)[] = [
  null,
  '09:00–12:00, 16:00–20:00',
  '09:00–12:00, 16:00–20:00',
  '09:00–12:00, 16:00–20:00',
  '09:00–12:00, 16:00–20:00',
  '16:00–20:00',
  '09:00–12:00, 16:00–20:00',
]

function availability(locale: Locale): DaySchedule[] {
  return DAY_NAMES[locale].map((day, i) => ({ day, slots: DAY_SLOTS[i] }))
}

function firstName(name: string): string {
  return name.replace(/^(Sheikh|Sister|Dr\.?|Cheikh|Sœur)\s+/i, '').split(' ')[0]
}

function specialtyDetails(specialties: string[], locale: Locale): SpecialtyDetail[] {
  return specialties.map((s) => ({
    title: s,
    desc: SPECIALTY_DESC[locale][s] ?? SPECIALTY_FALLBACK[locale],
  }))
}

function journey(role: string, primary: string, locale: Locale): TeacherExperience[] {
  if (locale === 'fr') {
    return [
      {
        role,
        org: 'Azhary Academy',
        period: '2023 – Aujourd’hui · En ligne',
        location: 'En ligne',
        desc: `Cours particuliers de ${primary} en ligne pour des élèves du monde entier, enfants et adultes, du niveau débutant au niveau avancé.`,
      },
      {
        role: 'Enseignant de Coran et d’arabe',
        org: 'Institut islamique',
        period: '2016 – 2023 · Le Caire, Égypte',
        location: 'Le Caire, Égypte',
        desc: 'A enseigné le Coran, le Tajwid et l’arabe à des élèves de tous âges, en présentiel et en ligne.',
      },
    ]
  }
  return [
    {
      role,
      org: 'Azhary Academy',
      period: '2023 – Present · Online',
      location: 'Online',
      desc: `Private online ${primary} instruction for students worldwide, children and adults, from beginner to advanced level.`,
    },
    {
      role: 'Quran & Arabic Teacher',
      org: 'Islamic Institute',
      period: '2016 – 2023 · Cairo, Egypt',
      location: 'Cairo, Egypt',
      desc: 'Taught Quran, Tajweed and Arabic to students of all ages, in person and online.',
    },
  ]
}

function certifications(credentials: string, locale: Locale): TeacherCertification[] {
  const fallbackDegree = locale === 'fr' ? 'Diplôme en sciences coraniques' : 'Quranic Sciences degree'
  const fallbackOrg = locale === 'fr' ? 'Université Al-Azhar' : 'Al-Azhar University'
  const first = credentials ? credentials.split('.')[0].trim() : fallbackDegree
  const org = credentials ? credentials.split('—')[0].trim() : fallbackOrg
  const ijazahTitle = locale === 'fr' ? 'Ijazah en Hafs ‘an ‘Asim (avec sanad)' : 'Ijazah in Hafs an ‘Asim (with sanad)'
  const ijazahOrg = locale === 'fr' ? 'Chaîne de transmission certifiée' : 'Certified chain of transmission'
  return [
    { title: first, org, year: '2016' },
    { title: ijazahTitle, org: ijazahOrg, year: '2019' },
  ]
}

function ratingBreakdown(rating: number): RatingBreakdown {
  const softer = Math.max(4.5, Math.round((rating - 0.2) * 10) / 10)
  return { reassurance: rating, clarity: softer, progression: softer, preparation: rating }
}

const TEACHING_STYLE_FALLBACK: Record<Locale, string> = {
  en: 'A warm, interactive approach that emphasises practice and active learning, tailored to your level and goals.',
  fr: 'Une approche chaleureuse et interactive qui met l’accent sur la pratique et l’apprentissage actif, adaptée à votre niveau et à vos objectifs.',
}

function strengthsFallback(tags: string[], first: string, locale: Locale): string {
  const lead = tags.slice(0, 3).join(', ')
  return locale === 'fr'
    ? `${lead}. ${first} adapte chaque séance à l’élève.`
    : `${lead}. ${first} adapts every session to the student.`
}

function mapApiTeacher(a: ApiTeacher, locale: Locale): Teacher {
  const specialties = a.specialties ?? []
  const first = firstName(a.name)
  return {
    id: a.slug || String(a.id),
    name: a.name,
    nameArabic: a.name_arabic ?? '',
    role: a.role,
    title: a.title ?? a.role,
    specialties,
    languages: a.languages ?? [],
    credentials: a.credentials ?? '',
    bio: a.bio,
    isFemale: a.is_female,
    yearsExperience: a.years_experience,
    studentsCount: a.students_count,
    country: a.country ?? 'Egypt',
    photo: a.image ?? (a.is_female ? '/images/avatar-female-1.png' : '/images/avatar-male-1.png'),
    rating: Number(a.rating),
    reviewsCount: a.reviews_count,
    hourlyRate: a.hourly_rate,
    tags: a.tags ?? [],
    elite: a.elite,
    forChildren: a.for_children,
    freeTrial: a.free_trial,
    coursesGiven: a.courses_given,
    teachingHours: a.teaching_hours,
    quote: a.quote ?? '',
    about: a.about ?? a.bio,
    teachingStyle: a.teaching_style ?? TEACHING_STYLE_FALLBACK[locale],
    strengths: a.strengths ?? strengthsFallback(a.tags ?? [], first, locale),
    specialtyDetails: specialtyDetails(specialties, locale),
    journey: journey(a.role, specialties[0] ?? 'Quran', locale),
    certifications: certifications(a.credentials ?? '', locale),
    ratingBreakdown: ratingBreakdown(Number(a.rating)),
    reviews: (a.reviews ?? []).map((r) => ({
      id: String(r.id),
      author: r.author,
      rating: r.rating,
      text: r.text,
    })),
    availability: availability(locale),
  }
}

function localeParam(locale: Locale): string {
  return locale === 'fr' ? '?locale=fr' : ''
}

export async function fetchTeachers(locale: Locale = 'en'): Promise<Teacher[]> {
  try {
    const res = await fetch(`${API}/api/v1/teachers${localeParam(locale)}`, { cache: 'no-store' })
    if (!res.ok) return []
    const json = await res.json()
    return (json.data as ApiTeacher[]).map((a) => mapApiTeacher(a, locale))
  } catch {
    return []
  }
}

export async function fetchTeacher(slug: string, locale: Locale = 'en'): Promise<Teacher | null> {
  try {
    const res = await fetch(`${API}/api/v1/teachers/${slug}${localeParam(locale)}`, { cache: 'no-store' })
    if (!res.ok) return null
    const json = await res.json()
    return mapApiTeacher(json.data as ApiTeacher, locale)
  } catch {
    return null
  }
}
