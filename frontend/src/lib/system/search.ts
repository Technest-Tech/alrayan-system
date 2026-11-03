/** Lower-cased, accent-free, with runs of whitespace collapsed: "  Inès  KAREM " → "ines karem". */
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Forgiving name match for search boxes: ignores case, accents and stray spaces,
 * and every typed word may appear anywhere in the name, so "omar ahmed" finds
 * "Ahmed Omar". An empty query matches everything.
 */
export function matchesSearch(text: string, query: string): boolean {
  const haystack = normalize(text)
  return normalize(query)
    .split(' ')
    .every(word => haystack.includes(word))
}
