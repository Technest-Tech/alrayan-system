/**
 * Central media config — fill in YouTube URLs / IDs here once you have them.
 *
 * Accepts any of these forms for video fields:
 *   - Full URL:   https://www.youtube.com/watch?v=VIDEO_ID
 *   - Short URL:  https://youtu.be/VIDEO_ID
 *   - Embed URL:  https://www.youtube.com/embed/VIDEO_ID
 *   - Raw ID:     VIDEO_ID
 *
 * Leave a field empty ('') to keep the image/text fallback in place.
 */

export const mediaConfig = {
  /** Hero video — replaces the right-side hero image when set. ~30–60s preferred. */
  hero: {
    youtubeUrl: '',
    /** Optional custom poster image; defaults to current hero PNG. */
    posterImage: '/hero/2children-learn-quran-online.png',
  },

  /**
   * Featured video testimonials shown above the marquee.
   * Up to 3 render in the grid. Leave list empty to hide the section.
   */
  videoTestimonials: [
    // {
    //   id: 'vt1',
    //   youtubeUrl: '',
    //   posterImage: '/images/testimonial-1-poster.jpg',
    //   parentName: 'Sarah A.',
    //   location: 'London, UK',
    //   quote: 'My daughter went from struggling to confident in 3 months.',
    //   course: 'Quran for Kids',
    // },
  ] as Array<{
    id: string
    youtubeUrl: string
    posterImage: string
    parentName: string
    location: string
    quote: string
    course: string
  }>,

  /**
   * Teacher recitation audio + photo overrides — keyed by teacher id from
   * `src/content/teachers.ts`. Leave a field empty to keep the placeholder.
   */
  teacherMedia: {
    'sheikh-ibrahim':  { photo: '', recitationAudio: '' },
    'sister-aisha':    { photo: '', recitationAudio: '' },
    'sheikh-omar':     { photo: '', recitationAudio: '' },
    'sister-fatima':   { photo: '', recitationAudio: '' },
    'sheikh-yusuf':    { photo: '', recitationAudio: '' },
    'sister-maryam':   { photo: '', recitationAudio: '' },
    'sheikh-khalid':   { photo: '', recitationAudio: '' },
    'sister-nour':     { photo: '', recitationAudio: '' },
  } satisfies Record<string, { photo: string; recitationAudio: string }>,

  /**
   * Optional 10–15s course preview videos — keyed by course slug from
   * `src/content/courses.ts`. Shows a play button overlay on the course card.
   */
  coursePreviews: {
    'noorani-qaida':     '',
    'quran-for-kids':    '',
    'tajweed':           '',
    'hifz':              '',
    'ijazah':            '',
    'arabic-for-non-arabs': '',
    'islamic-studies':   '',
    'quran-for-adults':  '',
  } as Record<string, string>,
} as const

/**
 * Normalize any YouTube URL form to a privacy-enhanced embed URL.
 * Returns `null` if the input is empty or unrecognized.
 */
export function youtubeEmbedUrl(input: string): string | null {
  if (!input) return null
  const trimmed = input.trim()
  // Try to extract a video id from common URL forms.
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([A-Za-z0-9_-]{11})/,
    /^([A-Za-z0-9_-]{11})$/, // raw ID
  ]
  for (const p of patterns) {
    const m = trimmed.match(p)
    if (m) return `https://www.youtube-nocookie.com/embed/${m[1]}?rel=0&modestbranding=1`
  }
  return null
}

/** Get a YouTube thumbnail URL for the given video id/URL. */
export function youtubeThumbUrl(input: string): string | null {
  if (!input) return null
  const trimmed = input.trim()
  const m = trimmed.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([A-Za-z0-9_-]{11})/) ?? trimmed.match(/^([A-Za-z0-9_-]{11})$/)
  return m ? `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg` : null
}
