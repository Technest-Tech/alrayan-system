import { Suspense } from 'react'
import Image from 'next/image'
import { LoginForm } from '@/components/system/auth/LoginForm'

export const metadata = { title: 'Sign in — Alrayan Academy' }

export default function LoginPage() {
  return (
    <div data-system-root="true" className="min-h-screen flex">
      {/* ── Left panel ───────────────────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col relative overflow-hidden w-[52%] shrink-0"
        style={{ background: 'linear-gradient(160deg, #0d2548 0%, #0B1F3A 55%, #071528 100%)' }}
      >
        {/* Decorative geometric background — echoes the brand mark */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none select-none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Large faded star — top right */}
          <g transform="translate(72%, -8%) scale(3.2)" opacity="0.06">
            <path
              d="M26 4 L30 14 L40 10 L36 20 L46 24 L36 28 L40 38 L30 34 L26 44 L22 34 L12 38 L16 28 L6 24 L16 20 L12 10 L22 14 Z"
              transform="scale(0.76) translate(2,0)"
              fill="#C9A24B"
            />
          </g>
          {/* Medium star — bottom left */}
          <g transform="translate(-6%, 68%) scale(2.2)" opacity="0.08">
            <path
              d="M26 4 L30 14 L40 10 L36 20 L46 24 L36 28 L40 38 L30 34 L26 44 L22 34 L12 38 L16 28 L6 24 L16 20 L12 10 L22 14 Z"
              transform="scale(0.76) translate(2,0)"
              fill="#C9A24B"
            />
          </g>
          {/* Subtle grid dots */}
          <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="#C9A24B" opacity="0.12" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#dots)" />
          {/* Gold top accent line */}
          <rect x="0" y="0" width="100%" height="2" fill="url(#goldLine)" />
          <linearGradient id="goldLine" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C9A24B" stopOpacity="0" />
            <stop offset="30%" stopColor="#C9A24B" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#C9A24B" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#C9A24B" stopOpacity="0" />
          </linearGradient>
        </svg>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full px-16 py-14">
          {/* Logo */}
          <div>
            <Image
              src="/logo/alrayan-white.svg"
              alt="Alrayan Academy"
              width={200}
              height={52}
              priority
            />
          </div>

          {/* Centre text */}
          <div className="flex-1 flex flex-col justify-center max-w-sm mt-10">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-widest mb-8 w-fit"
              style={{ background: 'rgba(201,162,75,0.15)', color: '#C9A24B', border: '1px solid rgba(201,162,75,0.3)' }}
            >
              OPERATIONS CONSOLE
            </div>
            <h1
              className="text-4xl font-bold leading-tight text-white"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: '-0.01em' }}
            >
              Everything you need<br />to run the academy.
            </h1>
            <p className="mt-5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.9375rem' }}>
              Students, teachers, schedules, billing, payroll — managed from one unified dashboard designed for clarity and speed.
            </p>

            {/* Stats row */}
            <div className="mt-12 grid grid-cols-3 gap-6">
              {[
                { value: '500+', label: 'Students' },
                { value: '40+',  label: 'Teachers' },
                { value: '30+',  label: 'Countries' },
              ].map(({ value, label }) => (
                <div key={label}>
                  <div
                    className="text-2xl font-bold"
                    style={{ color: '#C9A24B', fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >
                    {value}
                  </div>
                  <div className="text-xs mt-0.5 tracking-wide" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom badge */}
          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
            © {new Date().getFullYear()} Alrayan Academy · All rights reserved
          </div>
        </div>
      </div>

      {/* ── Right panel ──────────────────────────────────────────────── */}
      <div
        className="flex-1 flex items-center justify-center p-6 lg:p-12"
        style={{ background: 'rgb(var(--surface-bg, 244 246 250))' }}
      >
        <div className="w-full max-w-[400px]">
          {/* Card */}
          <div
            className="rounded-2xl px-8 py-10"
            style={{
              background: 'rgb(var(--surface-card, 255 255 255))',
              boxShadow: '0 4px 6px -1px rgba(11,31,58,0.05), 0 20px 60px -10px rgba(11,31,58,0.12)',
              border: '1px solid rgb(var(--border-default, 229 233 240))',
            }}
          >
            {/* Logo — full colour, centered */}
            <div className="flex justify-center mb-8">
              <Image
                src="/logo/alrayan-full.svg"
                alt="Alrayan Academy"
                width={180}
                height={47}
                priority
              />
            </div>

            {/* Gold divider */}
            <div
              className="h-px mb-8 mx-auto"
              style={{ background: 'linear-gradient(90deg, transparent, #C9A24B55, transparent)', width: '80%' }}
            />

            {/* Heading */}
            <div className="mb-7">
              <h2
                className="text-xl font-bold"
                style={{ color: 'rgb(11 31 58)', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.5rem' }}
              >
                Welcome back
              </h2>
              <p className="text-sm mt-1" style={{ color: 'rgb(var(--status-neutral, 90 100 112))' }}>
                Sign in to your admin account to continue.
              </p>
            </div>

            <Suspense>
              <LoginForm />
            </Suspense>
          </div>

          {/* Footer note */}
          <p className="text-center text-xs mt-6" style={{ color: 'rgb(var(--status-neutral, 90 100 112))' }}>
            Authorised personnel only ·{' '}
            <a
              href="mailto:support@alrayan-academy.com"
              className="hover:underline"
              style={{ color: 'rgb(11 31 58)' }}
            >
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
