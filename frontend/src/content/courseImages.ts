/**
 * Branded illustrated thumbnails shared by the home carousel and course pages.
 */
const COURSE_IMAGES: Record<string, string> = {
  // The three headline courses reuse the artwork of their closest specialism.
  'quran': '/images/courses/quran-classes-for-adults.webp',
  'arabic': '/images/courses/arabic-for-non-arabs.webp',
  'arabic-and-quran': '/images/courses/noorani-qaida.webp',
  'noorani-qaida': '/images/courses/noorani-qaida.webp',
  'quran-classes-for-kids': '/images/courses/quran-classes-for-kids.webp',
  'quran-classes-for-adults': '/images/courses/quran-classes-for-adults.webp',
  'tajweed-course': '/images/courses/tajweed-course.webp',
  'hifz-memorization': '/images/courses/hifz-memorization.webp',
  'ijazah-program': '/images/courses/ijazah-program.webp',
  'arabic-for-non-arabs': '/images/courses/arabic-for-non-arabs.webp',
  'tafseer-course': '/images/courses/tafseer-course.webp',
  'islamic-studies': '/images/courses/islamic-studies.webp',
  'ten-qiraat': '/images/courses/ten-qiraat.webp',
  'female-quran-teachers': '/images/courses/female-quran-teachers.webp',
}

export function courseImage(slug: string): string {
  return COURSE_IMAGES[slug] ?? COURSE_IMAGES['islamic-studies']
}
