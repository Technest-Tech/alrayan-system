export type TeacherReview = {
  id: string
  author: string
  rating: number
  text: string
}

export type TeacherExperience = {
  role: string
  org: string
  period: string
  location: string
  desc: string
}

export type TeacherCertification = {
  title: string
  org: string
  year: string
}

export type RatingBreakdown = {
  reassurance: number
  clarity: number
  progression: number
  preparation: number
}

export type DaySchedule = {
  day: string
  slots: string | null
}

export type SpecialtyDetail = {
  title: string
  desc: string
}

export type Teacher = {
  id: string
  name: string
  nameArabic: string
  role: string
  /** Short one-line hook shown on the listing card. */
  title: string
  specialties: string[]
  languages: string[]
  credentials: string
  bio: string
  isFemale: boolean
  yearsExperience: number
  studentsCount: number
  // ── Rich profile fields ──
  country: string
  photo: string
  rating: number
  reviewsCount: number
  hourlyRate: number
  tags: string[]
  elite: boolean
  forChildren: boolean
  freeTrial: boolean
  coursesGiven: number
  teachingHours: number
  quote: string
  about: string
  teachingStyle: string
  strengths: string
  specialtyDetails: SpecialtyDetail[]
  journey: TeacherExperience[]
  certifications: TeacherCertification[]
  ratingBreakdown: RatingBreakdown
  reviews: TeacherReview[]
  availability: DaySchedule[]
}

// ── Core, hand-authored data (identity + distinctive fields) ──
type TeacherCore = Pick<
  Teacher,
  | 'id' | 'name' | 'nameArabic' | 'role' | 'title' | 'specialties' | 'languages'
  | 'credentials' | 'bio' | 'isFemale' | 'yearsExperience' | 'studentsCount'
  | 'country' | 'rating' | 'reviewsCount' | 'hourlyRate' | 'tags' | 'elite'
  | 'forChildren' | 'freeTrial' | 'coursesGiven' | 'teachingHours' | 'quote'
>

const core: TeacherCore[] = [
  {
    id: 'sheikh-ibrahim',
    name: 'Sheikh Ibrahim Al-Rashid',
    nameArabic: 'الشيخ إبراهيم الراشد',
    role: 'Head of Quran Studies',
    title: 'Quran & Ijazah teacher — Al-Azhar graduate',
    specialties: ['Tajweed', 'Hifz', 'Ijazah', 'Ten Qiraat'],
    languages: ['Arabic', 'English'],
    credentials: 'Al-Azhar University — Bachelor & Master in Quranic Sciences. Ijazah in Hafs an Asim and all ten Qiraat.',
    bio: 'Sheikh Ibrahim has dedicated over 15 years to teaching the Quran internationally. A graduate of Al-Azhar with a direct chain of transmission, he has guided hundreds of students to full Hifz and Ijazah certification.',
    isFemale: false,
    yearsExperience: 15,
    studentsCount: 420,
    country: 'Egypt',
    rating: 5.0,
    reviewsCount: 24,
    hourlyRate: 15,
    tags: ['Rigorous', 'Al-Azhar graduate', 'Patient', 'Ijazah'],
    elite: true,
    forChildren: false,
    freeTrial: true,
    coursesGiven: 42,
    teachingHours: 12000,
    quote: 'Quran & Tajweed with an authentic chain of transmission',
  },
  {
    id: 'sister-aisha',
    name: 'Sister Aisha Karimi',
    nameArabic: 'الأستاذة عائشة كريمي',
    role: 'Senior Female Quran Teacher',
    title: 'Quran for kids & beginners — gentle and structured',
    specialties: ['Quran for Kids', 'Tajweed', 'Noorani Qaida', 'Hifz'],
    languages: ['Arabic', 'English', 'Urdu'],
    credentials: 'Islamic University of Madinah — Quranic Studies. Ijazah in Hafs an Asim. 12+ years teaching.',
    bio: 'Sister Aisha is beloved by students and families across the UK, USA, and Canada. Her patient, structured approach makes her the top choice for beginners and children. She holds Ijazah and is certified to grant Ijazah to her students.',
    isFemale: true,
    yearsExperience: 12,
    studentsCount: 380,
    country: 'Egypt',
    rating: 5.0,
    reviewsCount: 32,
    hourlyRate: 12,
    tags: ['Caring', 'Patient', 'Kids-friendly', 'Ijazah'],
    elite: true,
    forChildren: true,
    freeTrial: true,
    coursesGiven: 55,
    teachingHours: 9000,
    quote: 'A caring, structured path for children and beginners',
  },
  {
    id: 'sheikh-omar',
    name: 'Sheikh Omar Al-Hassan',
    nameArabic: 'الشيخ عمر الحسن',
    role: 'Ijazah Program Director',
    title: 'Ijazah & Ten Qiraat — advanced recitation',
    specialties: ['Ijazah', 'Ten Qiraat', 'Tajweed', 'Tafseer'],
    languages: ['Arabic', 'English', 'French'],
    credentials: 'Al-Azhar University — PhD in Islamic Studies. Ijazah in all ten Qiraat with Mutawatir chain.',
    bio: 'Dr. Omar leads our rigorous Ijazah program, ensuring every student receives an authentic, unbroken chain back to the Prophet ﷺ. He has granted Ijazah to over 60 students worldwide and teaches advanced Qiraat.',
    isFemale: false,
    yearsExperience: 18,
    studentsCount: 210,
    country: 'Egypt',
    rating: 5.0,
    reviewsCount: 18,
    hourlyRate: 20,
    tags: ['Rigorous', 'Al-Azhar graduate', 'Attentive', 'Ijazah'],
    elite: true,
    forChildren: false,
    freeTrial: true,
    coursesGiven: 30,
    teachingHours: 15000,
    quote: 'Authentic Ijazah with an unbroken chain to the Prophet ﷺ',
  },
  {
    id: 'sister-fatima',
    name: 'Sister Fatima Benali',
    nameArabic: 'الأستاذة فاطمة بنعلي',
    role: 'Arabic Language Specialist',
    title: 'Arabic for non-Arabs — from alphabet to fluency',
    specialties: ['Arabic for Non-Arabs', 'Quranic Arabic', 'Islamic Studies'],
    languages: ['Arabic', 'English', 'French'],
    credentials: 'University of Cairo — BA Arabic Literature. Al-Azhar certified teacher. 10 years teaching Arabic online.',
    bio: 'Sister Fatima makes Arabic accessible to complete beginners. Her structured curriculum takes students from the alphabet to conversational Arabic. She also teaches Quranic grammar to help students understand the Quran directly.',
    isFemale: true,
    yearsExperience: 10,
    studentsCount: 290,
    country: 'Egypt',
    rating: 4.9,
    reviewsCount: 26,
    hourlyRate: 10,
    tags: ['Caring', 'Clear', 'Structured'],
    elite: false,
    forChildren: true,
    freeTrial: true,
    coursesGiven: 45,
    teachingHours: 8000,
    quote: 'Making Arabic simple, one step at a time',
  },
  {
    id: 'sheikh-yusuf',
    name: 'Sheikh Yusuf Al-Ansari',
    nameArabic: 'الشيخ يوسف الأنصاري',
    role: 'Quran & Islamic Studies Teacher',
    title: 'Tafseer & Islamic studies — understand the Quran',
    specialties: ['Tafseer', 'Islamic Studies', 'Seerah', 'Aqeedah'],
    languages: ['Arabic', 'English'],
    credentials: 'Al-Azhar University — BA Islamic Studies. Specialist in Tafseer and Aqeedah. 8 years teaching.',
    bio: 'Sheikh Yusuf brings the Quran to life through deep Tafseer study. His classes help students not just recite, but understand the wisdom and guidance behind each verse. Students describe his lessons as transformative.',
    isFemale: false,
    yearsExperience: 8,
    studentsCount: 175,
    country: 'Egypt',
    rating: 4.9,
    reviewsCount: 16,
    hourlyRate: 12,
    tags: ['Engaging', 'Knowledgeable', 'Patient'],
    elite: false,
    forChildren: false,
    freeTrial: true,
    coursesGiven: 28,
    teachingHours: 6000,
    quote: 'Bringing the meanings of the Quran to life',
  },
  {
    id: 'sister-maryam',
    name: 'Sister Maryam Saleh',
    nameArabic: 'الأستاذة مريم صالح',
    role: "Children's Quran Specialist",
    title: 'Quran for kids — playful and encouraging',
    specialties: ['Quran for Kids', 'Noorani Qaida', 'Tajweed', 'Islamic Studies for Kids'],
    languages: ['Arabic', 'English', 'Turkish'],
    credentials: 'Islamic Educational Institute — Quran & Pedagogy. Certified child learning specialist. 9 years experience.',
    bio: 'Sister Maryam has a gift for teaching children. Her playful, encouraging style makes even reluctant learners eager for their next class. She specializes in ages 5–14 and has helped hundreds of children complete their Noorani Qaida and begin Tajweed.',
    isFemale: true,
    yearsExperience: 9,
    studentsCount: 330,
    country: 'Egypt',
    rating: 5.0,
    reviewsCount: 40,
    hourlyRate: 10,
    tags: ['Caring', 'Kids-friendly', 'Fun', 'Patient'],
    elite: true,
    forChildren: true,
    freeTrial: true,
    coursesGiven: 60,
    teachingHours: 9500,
    quote: 'Every child deserves to love their Quran class',
  },
  {
    id: 'sheikh-khalid',
    name: 'Sheikh Khalid Mansour',
    nameArabic: 'الشيخ خالد منصور',
    role: 'Hifz Program Coordinator',
    title: 'Hifz & memorization — a proven methodology',
    specialties: ['Hifz / Memorization', 'Tajweed', 'Revision Techniques'],
    languages: ['Arabic', 'English'],
    credentials: 'Al-Azhar University — Hifz certification with full chain. Specialized in memorization methodology. 14 years.',
    bio: 'Sheikh Khalid has helped over 200 students complete their full Hifz of the Quran. His systematic approach to memorization — breaking, reviewing, and cementing — produces lasting results. His oldest student to complete Hifz was 67 years old.',
    isFemale: false,
    yearsExperience: 14,
    studentsCount: 260,
    country: 'Egypt',
    rating: 5.0,
    reviewsCount: 22,
    hourlyRate: 15,
    tags: ['Rigorous', 'Structured', 'Motivating', 'Ijazah'],
    elite: true,
    forChildren: false,
    freeTrial: true,
    coursesGiven: 38,
    teachingHours: 11000,
    quote: 'A clear system to memorize — and never forget',
  },
  {
    id: 'sister-nour',
    name: 'Sister Nour Al-Deen',
    nameArabic: 'الأستاذة نور الدين',
    role: 'Adult Quran & Tajweed Teacher',
    title: 'Tajweed for adults — start with confidence',
    specialties: ['Tajweed', 'Quran for Adults', 'Arabic', 'Hifz'],
    languages: ['Arabic', 'English', 'German'],
    credentials: 'Umm Al-Qura University — Quranic Recitation & Tajweed. Ijazah in Hafs an Asim. 7 years teaching adults.',
    bio: 'Sister Nour specializes in helping adults — especially those who grew up without Quran education — start or restart their journey with confidence. Her non-judgmental, structured approach has earned her exceptional reviews from students across Europe and North America.',
    isFemale: true,
    yearsExperience: 7,
    studentsCount: 195,
    country: 'Egypt',
    rating: 4.9,
    reviewsCount: 19,
    hourlyRate: 12,
    tags: ['Caring', 'Non-judgmental', 'Encouraging'],
    elite: false,
    forChildren: false,
    freeTrial: true,
    coursesGiven: 32,
    teachingHours: 5500,
    quote: "It's never too late to begin your Quran journey",
  },
]

// ── Templated content generators ──

const SPECIALTY_DESC: Record<string, string> = {
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
}

const REVIEW_POOL: { author: string; rating: number; make: (first: string) => string }[] = [
  { author: 'Bilal S.', rating: 5, make: (f) => `Punctuality, professionalism and kindness. I highly recommend ${f}'s classes.` },
  { author: 'Nadia K.', rating: 5, make: (f) => `Excellent teacher. ${f} explains with remarkable clarity; I progress with every single lesson.` },
  { author: 'Idriss N.', rating: 4, make: (f) => `${f} is an exceptional teacher — pedagogical, attentive and always well-prepared.` },
  { author: 'Tarek M.', rating: 5, make: (f) => `Perfect for younger children. ${f} is kind, encouraging and very professional.` },
  { author: 'Nour S.', rating: 5, make: (f) => `I started from scratch and thanks to ${f} I can now read Arabic. Highly recommend!` },
  { author: 'Yasmine B.', rating: 5, make: (f) => `Alhamdulillah, ${f} is patient and genuinely cares about our progress. The best.` },
  { author: 'Hassan A.', rating: 4, make: (f) => `Very structured lessons. ${f} always knows exactly what to work on next.` },
]

function firstName(name: string): string {
  const parts = name.replace(/^(Sheikh|Sister|Dr\.?)\s+/i, '').split(' ')
  return parts[0]
}

const SHARED_AVAILABILITY: DaySchedule[] = [
  { day: 'Sunday', slots: null },
  { day: 'Monday', slots: '09:00–12:00, 16:00–20:00' },
  { day: 'Tuesday', slots: '09:00–12:00, 16:00–20:00' },
  { day: 'Wednesday', slots: '09:00–12:00, 16:00–20:00' },
  { day: 'Thursday', slots: '09:00–12:00, 16:00–20:00' },
  { day: 'Friday', slots: '16:00–20:00' },
  { day: 'Saturday', slots: '09:00–12:00, 16:00–20:00' },
]

function enrich(t: TeacherCore, i: number): Teacher {
  const first = firstName(t.name)
  const primary = t.specialties[0]
  const r = t.rating
  const softer = Math.max(4.5, Math.round((r - 0.2) * 10) / 10)

  return {
    ...t,
    photo: t.isFemale ? '/images/avatar-female-1.png' : '/images/avatar-male-1.png',

    about: `${t.bio} Lessons take place one-on-one via webcam, at your own pace, wherever you are in the world — from complete beginner to advanced level.`,

    teachingStyle:
      'A warm, interactive approach that emphasises practice and active learning. Each session alternates between clear explanation, targeted correction and personalised support, following a path tailored to your level and goals — always starting with a free introductory lesson.',

    strengths: `${t.tags.slice(0, 3).join(', ')}. ${first} adapts every session to the student, following a clear and motivating progression that keeps you moving forward with confidence.`,

    specialtyDetails: t.specialties.map((s) => ({
      title: s,
      desc: SPECIALTY_DESC[s] ?? 'Taught with care, authenticity and a personalised approach.',
    })),

    journey: [
      {
        role: t.role,
        org: 'Azhary',
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
    ],

    certifications: [
      { title: t.credentials.split('.')[0].trim(), org: t.credentials.split('—')[0].trim(), year: '2016' },
      { title: 'Ijazah in Hafs an ‘Asim (with sanad)', org: 'Certified chain of transmission', year: '2019' },
    ],

    ratingBreakdown: {
      reassurance: r,
      clarity: softer,
      progression: softer,
      preparation: r,
    },

    reviews: [0, 1, 2, 3, 4].map((k) => {
      const src = REVIEW_POOL[(i + k) % REVIEW_POOL.length]
      return {
        id: `${t.id}-rev-${k}`,
        author: src.author,
        rating: src.rating,
        text: src.make(first),
      }
    }),

    availability: SHARED_AVAILABILITY,
  }
}

export const teachers: Teacher[] = core.map(enrich)

export const featuredTeachers = teachers.slice(0, 4)

export function getTeacher(id: string): Teacher | undefined {
  return teachers.find((t) => t.id === id)
}

export function similarTeachers(id: string, count = 6): Teacher[] {
  return teachers.filter((t) => t.id !== id).slice(0, count)
}
