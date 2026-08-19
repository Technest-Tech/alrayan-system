import { describe, it, expect } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { invalidatePackageDerived } from './packageCache'

/**
 * The bug this guards: editing a package's hours re-ran the engine on the server, but the
 * calendar kept rendering the session numbers it had cached before the rebuild — because the
 * payments page invalidated ['student-packages'] while the calendar reads
 * ['system', 'student-packages'] and ['system', 'calendar'].
 */
const ENGINE_DERIVED = [
  ['system', 'student-packages', 7],
  ['student-packages', 7],
  ['system', 'lessons', { studentId: 7 }],
  ['system', 'calendar', { start: '2026-08-01' }],
  ['system', 'students', 7, 'billing-state'],
  ['system', 'analytics', '2026-08', 3],
  ['system', 'tasks', {}],
  ['payments', {}],
  ['payment-stats'],
  ['system-dashboard'],
]

function seed(qc: QueryClient, key: unknown[]) {
  qc.setQueryData(key, { seeded: true })
}

describe('invalidatePackageDerived', () => {
  it('marks every screen fed by the consumption engine stale', () => {
    const qc = new QueryClient()
    ENGINE_DERIVED.forEach(key => seed(qc, key))

    invalidatePackageDerived(qc)

    ENGINE_DERIVED.forEach(key => {
      expect(qc.getQueryState(key)?.isInvalidated, `${JSON.stringify(key)} must be invalidated`).toBe(true)
    })
  })

  it('leaves unrelated caches alone', () => {
    const qc = new QueryClient()
    seed(qc, ['system', 'lesson-subjects'])
    seed(qc, ['system', 'user-directory', 'stats'])

    invalidatePackageDerived(qc)

    expect(qc.getQueryState(['system', 'lesson-subjects'])?.isInvalidated).toBe(false)
    expect(qc.getQueryState(['system', 'user-directory', 'stats'])?.isInvalidated).toBe(false)
  })
})
