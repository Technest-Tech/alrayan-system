import { Suspense } from 'react'
import Image from 'next/image'
import { LoginForm } from '@/components/system/auth/LoginForm'

export const metadata = { title: 'Sign in — Alrayan Academy' }

export default function LoginPage() {
  return (
    <div
      data-system-root="true"
      className="min-h-screen grid lg:grid-cols-2"
    >
      {/* Left panel */}
      <div
        className="hidden lg:flex items-center justify-center p-16"
        style={{ background: 'rgb(11 31 58)' }}
      >
        <div className="max-w-md text-white">
          <Image src="/logo/alrayan-white.svg" alt="Alrayan Academy" width={140} height={48} priority />
          <h1 className="font-heading text-3xl mt-12 leading-snug">
            Operations console
          </h1>
          <p className="opacity-60 mt-4 leading-relaxed">
            Manage students, teachers, schedules, billing and more — all in one place.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div
        className="flex items-center justify-center p-6"
        style={{ background: 'rgb(var(--surface-bg, 244 246 250))' }}
      >
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex justify-center">
            <div className="w-10 h-10 rounded-xl bg-[rgb(11,31,58)] flex items-center justify-center">
              <span className="text-white font-bold">A</span>
            </div>
          </div>
          <h2 className="text-2xl font-semibold">Sign in</h2>
          <p className="text-sm opacity-50 mt-1">Use your academy account.</p>
          <div className="mt-8">
            <Suspense>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
