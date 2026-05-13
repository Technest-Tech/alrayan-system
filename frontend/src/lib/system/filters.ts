'use client'
import { useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export function useUrlFilters(keys: string[]) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const filters = Object.fromEntries(
    keys.map((k) => [k, searchParams.get(k) ?? ''])
  )

  const setFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete('page')
      router.push('?' + params.toString(), { scroll: false })
    },
    [searchParams, router]
  )

  const resetFilters = useCallback(() => {
    router.push(window.location.pathname, { scroll: false })
  }, [router])

  return { filters, setFilter, resetFilters }
}
