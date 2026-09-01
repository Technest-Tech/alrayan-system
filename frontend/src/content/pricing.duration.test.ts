import { describe, it, expect } from 'vitest'
import {
  pricingPackages, pricingPackagesFr, packagePrice, lessonRate,
  durationPriceFactor, BASE_DURATION, type DurationId, type CurrencyCode,
} from '@/content/pricing'

/**
 * The 30-minute price list the academy quotes, lesson count → EUR / USD.
 * These are given prices, not derived ones, so the test states them outright.
 */
const QUOTED_30: Record<number, [number, number]> = {
  4: [19.99, 21.99],
  8: [39.99, 43.99],
  12: [59.99, 65.99],
  16: [79.99, 87.99],
  24: [110.99, 119.99],
  48: [219.99, 237.99],
  100: [449.99, 485.99],
}

/** The cent the card actually prints, not the full-precision rate behind it. */
const cents = (n: number) => Math.round(n * 100) / 100

describe('duration pricing', () => {
  it('leaves the 60-minute prices exactly as quoted', () => {
    const silver = pricingPackages.find(p => p.id === 'silver')!
    expect(packagePrice(silver, 'EUR', '60')).toBe(145.99)
    expect(packagePrice(silver, 'USD', '60')).toBe(157.99)
  })

  it('derives the 45-minute price at 80% of the hour', () => {
    const silver = pricingPackages.find(p => p.id === 'silver')!
    expect(packagePrice(silver, 'EUR', '45')).toBe(116.79)
    expect(packagePrice(silver, 'USD', '45')).toBe(126.39)
  })

  it('uses the academy’s quoted 30-minute price, not a derived one', () => {
    for (const set of [pricingPackages, pricingPackagesFr]) {
      for (const pkg of set) {
        const [eur, usd] = QUOTED_30[pkg.lessons]
        expect(packagePrice(pkg, 'EUR', '30')).toBe(eur)
        expect(packagePrice(pkg, 'USD', '30')).toBe(usd)
      }
    }
  })

  it('falls back to the duration factor when a length is not quoted', () => {
    const unquoted = { ...pricingPackages[0], quotedPrices: undefined }
    // Rounded to the cent like every derived price: 39.99 * 0.5 is 19.995.
    expect(packagePrice(unquoted, 'EUR', '30')).toBe(20)
    expect(packagePrice(unquoted, 'EUR', '30'))
      .not.toBe(packagePrice(pricingPackages[0], 'EUR', '30'))
  })

  it('defaults to the 60-minute price when no duration is given', () => {
    for (const pkg of pricingPackages) {
      for (const c of ['EUR', 'USD'] as CurrencyCode[]) {
        expect(packagePrice(pkg, c)).toBe(packagePrice(pkg, c, BASE_DURATION))
      }
    }
  })

  it('never returns a fractional cent', () => {
    for (const pkg of [...pricingPackages, ...pricingPackagesFr]) {
      for (const c of ['EUR', 'USD'] as CurrencyCode[]) {
        for (const d of Object.keys(durationPriceFactor) as DurationId[]) {
          const p = packagePrice(pkg, c, d)
          // Round-tripping through 2dp must be identity: `p * 100` cannot be
          // used to test this — 76.99 * 100 is 7698.999... in binary floating
          // point, which would fail a correct price.
          expect(Number(p.toFixed(2))).toBe(p)
        }
      }
    }
  })

  it('keeps a shorter lesson cheaper than a longer one, every package', () => {
    for (const pkg of pricingPackages) {
      for (const c of ['EUR', 'USD'] as CurrencyCode[]) {
        expect(packagePrice(pkg, c, '30')).toBeLessThan(packagePrice(pkg, c, '45'))
        expect(packagePrice(pkg, c, '45')).toBeLessThan(packagePrice(pkg, c, '60'))
      }
    }
  })

  it('charges more per minute for three quarters of an hour than for an hour', () => {
    // Only the derived length carries this promise. The quoted 30-minute
    // prices are close to half the hour, so a half-hour is priced at roughly
    // the same rate per minute as a full one.
    for (const pkg of pricingPackages) {
      const perMin = (d: DurationId, m: number) => packagePrice(pkg, 'EUR', d) / pkg.lessons / m
      expect(perMin('45', 45)).toBeGreaterThan(perMin('60', 60))
    }
  })

  it('never lets a bigger package cost more per lesson, to the cent', () => {
    for (const set of [pricingPackages, pricingPackagesFr]) {
      for (const c of ['EUR', 'USD'] as CurrencyCode[]) {
        for (const d of Object.keys(durationPriceFactor) as DurationId[]) {
          const rates = set.map(p => cents(lessonRate(p, c, d)))
          rates.forEach((r, i) => {
            if (!i) return
            expect(r).toBeLessThanOrEqual(rates[i - 1])
          })
        }
      }
    }
  })

  it('keeps the quoted 30-minute rate flat below 24 lessons and falling above', () => {
    const rate = (lessons: number) =>
      cents(lessonRate(pricingPackages.find(p => p.lessons === lessons)!, 'EUR', '30'))
    expect([4, 8, 12, 16].map(rate)).toEqual([5, 5, 5, 5])
    expect(rate(24)).toBe(4.62)
    expect(rate(48)).toBe(4.58)
    // The biggest package is the cheapest per lesson, as the page promises.
    expect(rate(100)).toBe(4.5)
  })

  it('features the 24-lesson package, and only that one', () => {
    for (const set of [pricingPackages, pricingPackagesFr]) {
      expect(set.filter(p => p.featured).map(p => p.lessons)).toEqual([24])
    }
  })

  it('keeps EN and FR price sets identical', () => {
    for (const d of Object.keys(durationPriceFactor) as DurationId[]) {
      for (const c of ['EUR', 'USD'] as CurrencyCode[]) {
        expect(pricingPackagesFr.map(p => packagePrice(p, c, d)))
          .toEqual(pricingPackages.map(p => packagePrice(p, c, d)))
      }
    }
  })
})
