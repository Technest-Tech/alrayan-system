import 'server-only'
import { dictionaries, translate, type TranslateFn } from './translate'
import type { Messages } from './dictionaries/en'
import type { Locale } from './config'

/** Server-side dictionary access. */
export function getDictionary(locale: Locale): Messages {
  return dictionaries[locale]
}

/** Server-side translator bound to a locale: `const t = getT(locale)`. */
export function getT(locale: Locale): TranslateFn {
  const messages = dictionaries[locale]
  return (key, vars) => translate(messages, key, vars)
}
