import { describe, it, expect } from 'vitest'
import { courses, coursesFr, getCourses } from '@/content/courses'
import { navCourseSlugs, courseSlugs } from '@/config/nav'
import { en } from '@/i18n/dictionaries/en'
import { fr } from '@/i18n/dictionaries/fr'

/**
 * The four courses the academy offers. They drive the header dropdown, the
 * footer and — the reason this is worth a test — the course selector in the
 * trial-booking form, which is built by filtering the full catalogue through
 * `navCourseSlugs`. A slug renamed on one side and not the other drops a course
 * out of the booking form silently.
 */
const OFFERED = ['quran', 'arabic', 'arabic-and-quran', 'islamic-studies'] as const

describe('the offered courses', () => {
  it('are the four the site features', () => {
    expect([...navCourseSlugs]).toEqual([...OFFERED])
  })

  it('each have a page in the catalogue', () => {
    for (const slug of OFFERED) {
      expect(courseSlugs).toContain(slug)
      expect(courses.some(c => c.slug === slug)).toBe(true)
    }
  })

  it('reach the trial-booking form in both languages', () => {
    for (const locale of ['en', 'fr'] as const) {
      const offered = getCourses(locale).filter(c => (OFFERED as readonly string[]).includes(c.slug))
      expect(offered).toHaveLength(OFFERED.length)
      for (const course of offered) expect(course.title.trim()).not.toBe('')
    }
  })

  it('are labelled in the nav dictionaries', () => {
    for (const slug of OFFERED) {
      expect(en.courseLinks[slug]).toBeTruthy()
      expect(fr.courseLinks[slug]).toBeTruthy()
    }
  })

  it('present Islamic Studies as a course for children', () => {
    const enCourse = courses.find(c => c.slug === 'islamic-studies')!
    const frCourse = coursesFr.find(c => c.slug === 'islamic-studies')!

    expect(enCourse.title).toBe('Islamic Studies for Kids')
    expect(frCourse.title).toBe('Sciences islamiques pour enfants')
    expect(enCourse.ageGroup).toBeTruthy()
    expect(frCourse.ageGroup).toBeTruthy()
  })

  it('keep the English and French catalogues in step', () => {
    expect(coursesFr.map(c => c.slug)).toEqual(courses.map(c => c.slug))
  })
})
