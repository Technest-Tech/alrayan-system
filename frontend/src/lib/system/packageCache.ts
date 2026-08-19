import type { QueryClient } from '@tanstack/react-query'

/**
 * Every cache key whose data is derived from the package consumption engine.
 *
 * Editing a package's hours — like a lesson's status or date — makes the server re-run
 * PackageService::rebuild, which re-walks the student's WHOLE history: allocations, session
 * numbers, package pointers, and which package each lesson lands in. The screens that show
 * that live under several different keys, and two of them are near-namesakes: the payments
 * page reads ['student-packages', …] while the calendar and the user profile read
 * ['system', 'student-packages', …]. Invalidating just the one the mutation happens to sit
 * next to leaves every other screen rendering pre-rebuild session counts until a hard reload.
 */
const PACKAGE_DERIVED_KEYS: readonly (readonly unknown[])[] = [
  ['system', 'student-packages'],  // calendar chooser, user profile package widget
  ['student-packages'],            // payments → Manage Packages
  ['system', 'lessons'],           // lesson list + drawer (session_number_hours)
  ['system', 'calendar'],          // calendar blocks and their session pills
  ['system', 'students'],          // billing state, student analytics
  ['system', 'analytics'],         // teacher hours / earnings
  ['system', 'tasks'],             // a rebuild can raise a "package complete" task
  ['payments'],
  ['payment-stats'],
  ['system-dashboard'],
]

/** Refresh everything the consumption engine may have just re-shifted. */
export function invalidatePackageDerived(qc: QueryClient): void {
  for (const queryKey of PACKAGE_DERIVED_KEYS) {
    qc.invalidateQueries({ queryKey })
  }
}
