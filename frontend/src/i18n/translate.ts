import { en, type Messages } from './dictionaries/en'
import { fr } from './dictionaries/fr'
import type { Locale } from './config'

export const dictionaries: Record<Locale, Messages> = { en, fr }

function getNested(obj: Record<string, unknown>, path: string): string | undefined {
  let cur: unknown = obj
  for (const key of path.split('.')) {
    if (cur == null || typeof cur !== 'object') return undefined
    cur = (cur as Record<string, unknown>)[key]
  }
  return typeof cur === 'string' ? cur : undefined
}

/**
 * Look up a dot-path key in a messages object, falling back to English then the
 * raw key, and interpolate `{var}` placeholders. Shared by server + client.
 */
export function translate(
  messages: Messages,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const msg =
    getNested(messages as unknown as Record<string, unknown>, key) ??
    getNested(en as unknown as Record<string, unknown>, key) ??
    key
  if (!vars) return msg
  return msg.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`))
}

export type TranslateFn = (key: string, vars?: Record<string, string | number>) => string
