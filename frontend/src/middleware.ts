import { NextResponse, type NextRequest } from 'next/server'

const APP_HOST = process.env.NEXT_PUBLIC_APP_HOST!   // app.alrayan-academy.com OR app.localhost:3000
const SITE_HOST = process.env.NEXT_PUBLIC_SITE_HOST! // alrayan-academy.com OR localhost:3000

function isAppHost(host: string) {
  return (
    host === APP_HOST ||
    host === `app-staging.${SITE_HOST}` ||
    host.startsWith('app.localhost')
  )
}

const MARKETING_PATHS = [
  '/about', '/courses', '/pricing', '/faq', '/contact', '/blog', '/countries',
]

const SYSTEM_PATHS = [
  '/dashboard', '/students', '/teachers', '/leads', '/courses-admin',
  '/schedule', '/attendance', '/session-reports', '/quality',
  '/billing', '/payroll', '/accounting', '/certificates',
  '/notifications', '/whatsapp-groups', '/settings', '/audit-log', '/teacher',
]

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? ''
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/')) {
    return NextResponse.next()
  }

  if (isAppHost(host)) {
    if (MARKETING_PATHS.some(p => pathname.startsWith(p))) {
      return NextResponse.rewrite(new URL('/not-found', req.url))
    }
    return NextResponse.next()
  }

  if (SYSTEM_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.rewrite(new URL('/not-found', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|logo).*)'],
}
