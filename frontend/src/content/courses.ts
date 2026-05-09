export type Course = {
  slug: string
  title: string
  shortDescription: string
  longDescription: string
  icon: string
  ageGroup?: string
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels'
  durationMonths?: string
  features: string[]
}

export const courses: Course[] = [
  {
    slug: 'noorani-qaida',
    title: 'Noorani Qaida',
    shortDescription: 'Start from the very beginning — Arabic letters, pronunciation, and Qaida rules.',
    longDescription: 'The perfect entry point for anyone new to Arabic and Quran. Learn the Arabic alphabet, letter forms, vowel marks, and basic recitation rules through the proven Noorani Qaida methodology.',
    icon: 'BookOpen',
    level: 'Beginner',
    durationMonths: '2–4',
    features: ['Arabic alphabet mastery', 'Correct pronunciation from day one', 'Vowel marks (harakat)', 'Foundation for Tajweed'],
  },
  {
    slug: 'quran-classes-for-kids',
    title: 'Quran for Kids',
    shortDescription: 'Fun, structured Quran learning designed for children aged 5 to 14.',
    longDescription: 'Our children\'s program combines the Noorani Qaida, Tajweed basics, and age-appropriate Islamic values in a fun, encouraging environment. Teachers are certified and experienced with young learners.',
    icon: 'Star',
    ageGroup: 'Ages 5–14',
    level: 'Beginner',
    features: ['Noorani Qaida included', 'Patient, child-specialist teachers', 'Interactive and engaging lessons', 'Progress reports for parents'],
  },
  {
    slug: 'tajweed-course',
    title: 'Tajweed Course',
    shortDescription: 'Master the rules of Tajweed and recite the Quran beautifully and correctly.',
    longDescription: 'Tajweed is the science of reciting the Quran the way it was revealed — with proper pronunciation, elongation, and articulation. Our structured curriculum covers all Tajweed rules with practical application.',
    icon: 'Mic',
    level: 'Beginner',
    durationMonths: '6–12',
    features: ['All Tajweed rules covered', 'Real-time pronunciation correction', 'Practice with actual Quran verses', 'Certificate upon completion'],
  },
  {
    slug: 'hifz-memorization',
    title: 'Hifz / Memorization',
    shortDescription: 'Memorize the Quran with a structured curriculum and dedicated teacher support.',
    longDescription: 'Our Hifz program provides a structured, sustainable path to memorizing the entire Quran. Using proven memorization techniques, regular review sessions, and one-on-one teacher support, we have helped 200+ students complete their Hifz.',
    icon: 'Brain',
    level: 'Intermediate',
    features: ['Daily memorization targets', 'Systematic revision schedule', 'Dedicated Hifz teacher', 'Flexible pace options'],
  },
  {
    slug: 'ijazah-program',
    title: 'Ijazah Program',
    shortDescription: 'Earn an authenticated Ijazah with an unbroken chain back to the Prophet ﷺ.',
    longDescription: 'The Ijazah is the highest credential in Quranic recitation — an authenticated license with an unbroken chain of transmission going back through the centuries to the Prophet ﷺ himself. Our teachers hold this chain and can pass it to qualified students.',
    icon: 'Award',
    level: 'Advanced',
    features: ['Authentic chain of transmission', 'One-on-one with Ijazah-holding sheikh', 'Hafs an Asim + option for other Riwayat', 'Certificate of Ijazah granted'],
  },
  {
    slug: 'arabic-for-non-arabs',
    title: 'Arabic for Non-Arabs',
    shortDescription: 'Learn Modern Standard Arabic and conversational Arabic from scratch.',
    longDescription: 'Designed for students with zero Arabic background. Start with the alphabet, progress to reading, writing, and conversation in Modern Standard Arabic. We also offer Quranic Arabic tracks to understand the Quran directly.',
    icon: 'Globe',
    level: 'Beginner',
    durationMonths: '6–18',
    features: ['From zero to conversational', 'MSA + Quranic Arabic tracks', 'Native Arab teachers', 'Grammar + vocabulary focus'],
  },
  {
    slug: 'tafseer-course',
    title: 'Tafseer',
    shortDescription: 'Understand the meaning and wisdom behind the words of Allah.',
    longDescription: 'Go beyond recitation — understand what Allah says. Our Tafseer course explains the meaning, context, and wisdom of the Quran verse by verse, drawing on classical scholarship and making it relevant to modern life.',
    icon: 'Lightbulb',
    level: 'Intermediate',
    features: ['Verse-by-verse explanation', 'Context and Asbab al-Nuzul', 'Classical + modern scholarship', 'Available in English'],
  },
  {
    slug: 'islamic-studies',
    title: 'Islamic Studies',
    shortDescription: 'Aqeedah, Seerah, Fiqh, and Islamic history for all ages.',
    longDescription: 'A comprehensive Islamic education covering the pillars of faith, the life of the Prophet ﷺ, Islamic jurisprudence, and the history of Islam — structured for both children and adults.',
    icon: 'BookMarked',
    level: 'All Levels',
    features: ['Aqeedah (belief)', 'Seerah (Prophetic biography)', 'Fiqh (Islamic rulings)', 'Islamic history'],
  },
  {
    slug: 'ten-qiraat',
    title: 'Ten Qiraat',
    shortDescription: 'Advanced program covering all ten authentic modes of Quranic recitation.',
    longDescription: 'An advanced course for accomplished Hafiz students who wish to master all ten authenticated modes of Quranic recitation. Taught by Sheikh Omar Al-Hassan, who holds Ijazah in all ten Qiraat.',
    icon: 'Layers',
    level: 'Advanced',
    features: ['All ten Qiraat covered', 'Taught by Qiraat specialist', 'Prerequisite: Hafs Ijazah', 'Isnad (chain) provided'],
  },
  {
    slug: 'female-quran-teachers',
    title: 'Female Teachers',
    shortDescription: 'Learn with certified female teachers — comfortable, safe, and effective.',
    longDescription: 'For sisters who prefer to learn from female teachers, all our courses are available with our certified female teaching team. All teachers hold Ijazah or equivalent credentials and are experienced professionals.',
    icon: 'Heart',
    level: 'All Levels',
    features: ['Female teachers only', 'All courses available', 'Same certifications and quality', 'Flexible scheduling'],
  },
]
