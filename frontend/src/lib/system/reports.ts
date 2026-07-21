import { ApiError, getToken } from './api'

const BASE   = process.env.NEXT_PUBLIC_API_URL!
const PREFIX = process.env.NEXT_PUBLIC_SYSTEM_API_PREFIX ?? '/api/system'

/**
 * Render the lesson report on the server and hand it straight to the browser as a
 * download, so it can be shared by hand instead of sent over WhatsApp. Production
 * serves a real PNG; a local/CI environment with no Chromium serves the report
 * HTML instead — the extension follows whatever the server actually returned.
 *
 * @param nameStem file name without extension, e.g. "report-Yusuf-2026-07-21".
 */
export async function downloadLessonReport(lessonId: number, nameStem?: string): Promise<void> {
  const token = getToken()
  const headers: Record<string, string> = { Accept: 'image/png, text/html' }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${BASE}${PREFIX}/lessons/${lessonId}/report/download`, { headers })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body.message ?? 'Report download failed', body.errors)
  }

  const type = res.headers.get('content-type') ?? ''
  const ext  = type.includes('html') ? 'html' : 'png'

  const blob = await res.blob()
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `${nameStem ?? `lesson-report-${lessonId}`}.${ext}`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
