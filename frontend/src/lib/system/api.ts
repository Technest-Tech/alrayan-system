const BASE   = process.env.NEXT_PUBLIC_API_URL!
const PREFIX = process.env.NEXT_PUBLIC_SYSTEM_API_PREFIX ?? '/api/system'

const TOKEN_KEY = 'sys_token'

export function getToken(): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  headers.set('Accept', 'application/json')
  headers.set('Content-Type', 'application/json')

  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${BASE}${PREFIX}${path}`, {
    ...init,
    headers,
  })

  if (res.status === 401) {
    clearToken()
    throw new ApiError(401, 'Unauthenticated')
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body.message ?? res.statusText, body.errors)
  }

  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return null as T
  }

  return res.json() as Promise<T>
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: Record<string, string[]>,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export interface Paginated<T> {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}
