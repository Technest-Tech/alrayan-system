export type Teacher = {
  id: string
  name: string
  nameArabic: string
  role: string
  specialties: string[]
  languages: string[]
  credentials: string
  bio: string
  isFemale: boolean
  yearsExperience: number
  studentsCount: number
}

export const teachers: Teacher[] = [
  {
    id: 'sheikh-ibrahim',
    name: 'Sheikh Ibrahim Al-Rashid',
    nameArabic: 'الشيخ إبراهيم الراشد',
    role: 'Head of Quran Studies',
    specialties: ['Tajweed', 'Hifz', 'Ijazah', 'Ten Qiraat'],
    languages: ['Arabic', 'English'],
    credentials: 'Al-Azhar University — Bachelor & Master in Quranic Sciences. Ijazah in Hafs an Asim and all ten Qiraat.',
    bio: 'Sheikh Ibrahim has dedicated over 15 years to teaching the Quran internationally. A graduate of Al-Azhar with a direct chain of transmission, he has guided hundreds of students to full Hifz and Ijazah certification.',
    isFemale: false,
    yearsExperience: 15,
    studentsCount: 420,
  },
  {
    id: 'sister-aisha',
    name: 'Sister Aisha Karimi',
    nameArabic: 'الأستاذة عائشة كريمي',
    role: 'Senior Female Quran Teacher',
    specialties: ['Quran for Kids', 'Tajweed', 'Noorani Qaida', 'Hifz'],
    languages: ['Arabic', 'English', 'Urdu'],
    credentials: 'Islamic University of Madinah — Quranic Studies. Ijazah in Hafs an Asim. 12+ years teaching.',
    bio: 'Sister Aisha is beloved by students and families across the UK, USA, and Canada. Her patient, structured approach makes her the top choice for beginners and children. She holds Ijazah and is certified to grant Ijazah to her students.',
    isFemale: true,
    yearsExperience: 12,
    studentsCount: 380,
  },
  {
    id: 'sheikh-omar',
    name: 'Sheikh Omar Al-Hassan',
    nameArabic: 'الشيخ عمر الحسن',
    role: 'Ijazah Program Director',
    specialties: ['Ijazah', 'Ten Qiraat', 'Tajweed', 'Tafseer'],
    languages: ['Arabic', 'English', 'French'],
    credentials: 'Al-Azhar University — PhD in Islamic Studies. Ijazah in all ten Qiraat with Mutawatir chain.',
    bio: 'Dr. Omar leads our rigorous Ijazah program, ensuring every student receives an authentic, unbroken chain back to the Prophet ﷺ. He has granted Ijazah to over 60 students worldwide and teaches advanced Qiraat.',
    isFemale: false,
    yearsExperience: 18,
    studentsCount: 210,
  },
  {
    id: 'sister-fatima',
    name: 'Sister Fatima Benali',
    nameArabic: 'الأستاذة فاطمة بنعلي',
    role: 'Arabic Language Specialist',
    specialties: ['Arabic for Non-Arabs', 'Quranic Arabic', 'Islamic Studies'],
    languages: ['Arabic', 'English', 'French'],
    credentials: 'University of Cairo — BA Arabic Literature. Al-Azhar certified teacher. 10 years teaching Arabic online.',
    bio: 'Sister Fatima makes Arabic accessible to complete beginners. Her structured curriculum takes students from the alphabet to conversational Arabic. She also teaches Quranic grammar to help students understand the Quran directly.',
    isFemale: true,
    yearsExperience: 10,
    studentsCount: 290,
  },
  {
    id: 'sheikh-yusuf',
    name: 'Sheikh Yusuf Al-Ansari',
    nameArabic: 'الشيخ يوسف الأنصاري',
    role: 'Quran & Islamic Studies Teacher',
    specialties: ['Tafseer', 'Islamic Studies', 'Seerah', 'Aqeedah'],
    languages: ['Arabic', 'English'],
    credentials: 'Al-Azhar University — BA Islamic Studies. Specialist in Tafseer and Aqeedah. 8 years teaching.',
    bio: 'Sheikh Yusuf brings the Quran to life through deep Tafseer study. His classes help students not just recite, but understand the wisdom and guidance behind each verse. Students describe his lessons as transformative.',
    isFemale: false,
    yearsExperience: 8,
    studentsCount: 175,
  },
  {
    id: 'sister-maryam',
    name: 'Sister Maryam Saleh',
    nameArabic: 'الأستاذة مريم صالح',
    role: 'Children\'s Quran Specialist',
    specialties: ['Quran for Kids', 'Noorani Qaida', 'Tajweed', 'Islamic Studies for Kids'],
    languages: ['Arabic', 'English', 'Turkish'],
    credentials: 'Islamic Educational Institute — Quran & Pedagogy. Certified child learning specialist. 9 years experience.',
    bio: 'Sister Maryam has a gift for teaching children. Her playful, encouraging style makes even reluctant learners eager for their next class. She specializes in ages 5–14 and has helped hundreds of children complete their Noorani Qaida and begin Tajweed.',
    isFemale: true,
    yearsExperience: 9,
    studentsCount: 330,
  },
  {
    id: 'sheikh-khalid',
    name: 'Sheikh Khalid Mansour',
    nameArabic: 'الشيخ خالد منصور',
    role: 'Hifz Program Coordinator',
    specialties: ['Hifz / Memorization', 'Tajweed', 'Revision Techniques'],
    languages: ['Arabic', 'English'],
    credentials: 'Al-Azhar University — Hifz certification with full chain. Specialized in memorization methodology. 14 years.',
    bio: 'Sheikh Khalid has helped over 200 students complete their full Hifz of the Quran. His systematic approach to memorization — breaking, reviewing, and cementing — produces lasting results. His oldest student to complete Hifz was 67 years old.',
    isFemale: false,
    yearsExperience: 14,
    studentsCount: 260,
  },
  {
    id: 'sister-nour',
    name: 'Sister Nour Al-Deen',
    nameArabic: 'الأستاذة نور الدين',
    role: 'Adult Quran & Tajweed Teacher',
    specialties: ['Tajweed', 'Quran for Adults', 'Arabic', 'Hifz'],
    languages: ['Arabic', 'English', 'German'],
    credentials: 'Umm Al-Qura University — Quranic Recitation & Tajweed. Ijazah in Hafs an Asim. 7 years teaching adults.',
    bio: 'Sister Nour specializes in helping adults — especially those who grew up without Quran education — start or restart their journey with confidence. Her non-judgmental, structured approach has earned her exceptional reviews from students across Europe and North America.',
    isFemale: true,
    yearsExperience: 7,
    studentsCount: 195,
  },
]

export const featuredTeachers = teachers.slice(0, 4)
