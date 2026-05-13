import { ForgotPasswordForm } from '@/components/system/auth/ForgotPasswordForm'

export const metadata = { title: 'Forgot password — Alrayan Academy' }

export default function ForgotPasswordPage() {
  return (
    <div
      data-system-root="true"
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'rgb(var(--surface-bg, 244 246 250))' }}
    >
      <div className="w-full max-w-sm">
        <h2 className="text-2xl font-semibold">Forgot password</h2>
        <p className="text-sm opacity-50 mt-1">
          Enter your email and we&apos;ll send a reset link.
        </p>
        <div className="mt-8">
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  )
}
