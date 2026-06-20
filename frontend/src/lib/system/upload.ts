import { getToken } from './api'

const BASE = process.env.NEXT_PUBLIC_API_URL!
const PREFIX = process.env.NEXT_PUBLIC_SYSTEM_API_PREFIX ?? '/api/system'

/** Upload a file and return its public URL. */
export async function uploadFile(file: File, folder: 'photos' | 'documents'): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('folder', folder)

  const token = getToken()
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${BASE}${PREFIX}/uploads`, { method: 'POST', headers, body: fd })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message ?? 'Upload failed')
  }
  const json = await res.json()
  return json.data.url as string
}
