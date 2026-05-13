'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api, ApiError } from '@/lib/system/api'
import { toast } from 'sonner'

const schema = z.object({
  password:              z.string().min(8, 'Password must be at least 8 characters'),
  password_confirmation: z.string(),
}).refine((d) => d.password === d.password_confirmation, {
  message: 'Passwords do not match',
  path:    ['password_confirmation'],
})
type FormValues = z.infer<typeof schema>

interface Props {
  token: string
  email: string
}

export function ResetPasswordForm({ token, email }: Props) {
  const [done, setDone] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(values: FormValues) {
    try {
      await api('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ ...values, token, email }),
      })
      setDone(true)
    } catch (e) {
      if (e instanceof ApiError) {
        toast.error(e.status === 422 ? 'This link is invalid or has expired.' : e.message)
      } else {
        toast.error('Something went wrong. Please try again.')
      }
    }
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)]'
  const inputStyle = { borderColor: 'rgb(var(--border-default, 229 233 240))', background: 'rgb(var(--surface-card, 255 255 255))' }

  if (done) {
    return (
      <div className="text-center space-y-4">
        <div className="text-4xl">✅</div>
        <p className="font-medium">Password updated</p>
        <p className="text-sm opacity-60">You can now sign in with your new password.</p>
        <a
          href="/login"
          className="inline-block w-full py-2.5 rounded-xl text-sm font-semibold text-white text-center mt-2"
          style={{ background: 'rgb(14 124 90)' }}
        >
          Sign in now
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1.5" htmlFor="password">New password</label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          className={inputCls}
          style={inputStyle}
          {...register('password')}
        />
        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5" htmlFor="password_confirmation">Confirm password</label>
        <input
          id="password_confirmation"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          className={inputCls}
          style={inputStyle}
          {...register('password_confirmation')}
        />
        {errors.password_confirmation && (
          <p className="text-red-500 text-xs mt-1">{errors.password_confirmation.message}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
        style={{ background: 'rgb(14 124 90)' }}
      >
        {isSubmitting ? 'Resetting…' : 'Reset password'}
      </button>
    </form>
  )
}
