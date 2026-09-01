import { describe, it, expect } from 'vitest'
import { localizedHref, stripLocale, switchLocalePath } from './href'

describe('localizedHref', () => {
  it('leaves English paths unprefixed', () => {
    expect(localizedHref('/', 'en')).toBe('/')
    expect(localizedHref('/courses', 'en')).toBe('/courses')
  })

  it('prefixes French paths with /fr', () => {
    expect(localizedHref('/', 'fr')).toBe('/fr')
    expect(localizedHref('/courses', 'fr')).toBe('/fr/courses')
    expect(localizedHref('/courses/tajweed-course', 'fr')).toBe('/fr/courses/tajweed-course')
  })

  it('passes through non-path hrefs untouched', () => {
    expect(localizedHref('https://wa.me/123', 'fr')).toBe('https://wa.me/123')
    expect(localizedHref('mailto:a@b.com', 'fr')).toBe('mailto:a@b.com')
    expect(localizedHref('#teachers', 'fr')).toBe('#teachers')
  })

  it('keeps hash fragments attached to the localized path', () => {
    expect(localizedHref('/#teachers', 'fr')).toBe('/fr/#teachers')
  })
})

describe('stripLocale', () => {
  it('detects the French prefix and returns the base path', () => {
    expect(stripLocale('/fr/courses')).toEqual({ locale: 'fr', path: '/courses' })
    expect(stripLocale('/fr')).toEqual({ locale: 'fr', path: '/' })
  })

  it('treats unprefixed paths as English', () => {
    expect(stripLocale('/courses')).toEqual({ locale: 'en', path: '/courses' })
    expect(stripLocale('/')).toEqual({ locale: 'en', path: '/' })
  })

  it('does not mistake a path segment that merely starts with "fr"', () => {
    expect(stripLocale('/france')).toEqual({ locale: 'en', path: '/france' })
  })
})

describe('switchLocalePath', () => {
  it('round-trips between locales preserving the path', () => {
    expect(switchLocalePath('/courses', 'fr')).toBe('/fr/courses')
    expect(switchLocalePath('/fr/courses', 'en')).toBe('/courses')
  })

  it('handles the home page in both directions', () => {
    expect(switchLocalePath('/', 'fr')).toBe('/fr')
    expect(switchLocalePath('/fr', 'en')).toBe('/')
  })

  it('is idempotent when target equals current locale', () => {
    expect(switchLocalePath('/fr/pricing', 'fr')).toBe('/fr/pricing')
    expect(switchLocalePath('/pricing', 'en')).toBe('/pricing')
  })

  it('preserves deep nested paths', () => {
    expect(switchLocalePath('/fr/our-teachers/sheikh-ibrahim', 'en')).toBe('/our-teachers/sheikh-ibrahim')
    expect(switchLocalePath('/countries/usa', 'fr')).toBe('/fr/countries/usa')
  })
})
