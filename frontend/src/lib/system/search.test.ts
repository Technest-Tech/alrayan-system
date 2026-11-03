import { describe, it, expect } from 'vitest'
import { matchesSearch } from './search'

describe('matchesSearch', () => {
  it('ignores case and accents in either direction', () => {
    expect(matchesSearch('Inès Karem', 'ines')).toBe(true)
    expect(matchesSearch('Ines Karem', 'INÈS')).toBe(true)
    expect(matchesSearch('Hélène Noël', 'helene noel')).toBe(true)
  })

  it('ignores stray whitespace in the query and the name', () => {
    expect(matchesSearch('Ahmed Omar', 'ahmed ')).toBe(true)
    expect(matchesSearch('Youssef  Haddad', 'youssef haddad')).toBe(true)
  })

  it('matches the typed words in any order', () => {
    expect(matchesSearch('Ahmed Omar', 'omar ahmed')).toBe(true)
  })

  it('still rejects names missing a typed word', () => {
    expect(matchesSearch('Ahmed Omar', 'ahmed karem')).toBe(false)
  })

  it('matches everything on an empty query', () => {
    expect(matchesSearch('Ahmed Omar', '   ')).toBe(true)
  })
})
