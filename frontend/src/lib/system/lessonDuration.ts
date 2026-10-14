type Translate = (key: string, vars?: Record<string, string>) => string

/**
 * Bookable lesson lengths: quarter-hour steps from 15 minutes to 3 hours. Mirrors
 * Lesson::durationRules() on the backend — change both together.
 */
export const LESSON_MAX_MINUTES = 180

/** The lesson form picks a length as hours + minutes. */
export const LESSON_HOUR_OPTIONS   = [0, 1, 2, 3]
export const LESSON_MINUTE_OPTIONS = [0, 15, 30, 45]

/** The schedule dialog offers the common lengths in a single list. */
export const SCHEDULE_DURATION_OPTIONS = [15, 30, 45, 60, 75, 90, 120, 150, 180]

/** 45 → "45min", 120 → "2h", 90 → "1h 30min" (localized). */
export function formatLessonDuration(minutes: number, t: Translate): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return t('lessons.form.minutesShort', { n: String(m) })
  if (m === 0) return t('lessons.form.hoursShort', { n: String(h) })
  return t('lessons.form.hoursMinutesShort', { h: String(h), m: String(m) })
}
