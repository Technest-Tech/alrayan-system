import { ResetPasswordForm } from '@/components/system/auth/ResetPasswordForm'

export const metadata = { title: 'Reset password — Azhary' }

interface Props {
  params:      Promise<{ token: string }>
  searchParams: Promise<{ email?: string }>
}

export default async function ResetPasswordPage({ params, searchParams }: Props) {
  const { token }  = await params
  const { email }  = await searchParams

  return (
    <div
      data-system-root="true"
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'rgb(var(--surface-bg, 244 246 250))' }}
    >
      <div className="w-full max-w-sm">
        <h2 className="text-2xl font-semibold">Set new password</h2>
        <p className="text-sm opacity-50 mt-1">Choose a strong password.</p>
        <div className="mt-8">
          <ResetPasswordForm token={token} email={email ?? ''} />
        </div>
      </div>
    </div>
  )
}
