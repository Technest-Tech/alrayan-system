import { useCallback, useRef } from 'react'

/** Builds the key for one create call; receives that call's payload. */
export type SubmissionKeyFor = (data: Record<string, unknown>) => string | undefined

function newKey(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

/**
 * Sent as `Idempotency-Key` on a create. The server replays the first response for a repeat of
 * the key instead of creating a second copy — so a double submit, or a retry after an error whose
 * first attempt had in fact saved, can't create the same student twice.
 *
 * The key is scoped to the record's name: retrying the same person (even after closing and
 * reopening the form) reuses it, while a different person entered into the same form still gets
 * created. `renew()` once a create succeeds, so the form can add another record of the same name.
 */
export function useSubmissionKey() {
  const ref = useRef<string | null>(null)
  if (ref.current == null) ref.current = newKey()

  // Encoded: a header value must be Latin-1, and an Arabic name would make fetch() throw.
  const get = useCallback<SubmissionKeyFor>(
    (data) => `${ref.current ?? newKey()}:${encodeURIComponent(String(data.name ?? '').trim().toLowerCase())}`,
    [],
  )
  const renew = useCallback(() => { ref.current = newKey() }, [])

  return { get, renew }
}

export function idempotencyHeaders(key: string | undefined): HeadersInit | undefined {
  return key ? { 'Idempotency-Key': key } : undefined
}
