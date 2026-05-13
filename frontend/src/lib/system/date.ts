export function formatDistanceToNow(isoString: string): string {
  const now  = Date.now()
  const then = new Date(isoString).getTime()
  const sec  = Math.floor((now - then) / 1000)
  if (sec < 60)  return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60)  return `${min}m ago`
  const hr  = Math.floor(min / 60)
  if (hr < 24)   return `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day < 30)  return `${day}d ago`
  const mo  = Math.floor(day / 30)
  if (mo < 12)   return `${mo}mo ago`
  return `${Math.floor(mo / 12)}y ago`
}
