'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api, ApiError } from '@/lib/system/api'
import { toast } from 'sonner'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
})
type FormValues = z.infer<typeof schema>

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(values: FormValues) {
    try {
      await api('/auth/forgot-password', { method: 'POST', body: JSON.stringify(values) })
      setSent(true)
    } catch (e) {
      if (e instanceof ApiError) {
        toast.error(e.message)
      } else {
        toast.error('Something went wrong. Please try again.')
      }
    }
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)]'
  const inputStyle = { borderColor: 'rgb(var(--border-default, 229 233 240))', background: 'rgb(var(--surface-card, 255 255 255))' }

  if (sent) {
    return (
      <div className="text-center space-y-4">
        <div className="text-4xl">📬</div>
        <p className="font-medium">Check your inbox</p>
        <p className="text-sm opacity-60">If that account exists, a reset link is on its way.</p>
        <a
          href="/login"
          className="text-sm opacity-60 hover:opacity-90 transition-opacity inline-block mt-2"
        >
          Back to sign in
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1.5" htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="admin@alrayan-academy.com"
          className={inputCls}
          style={inputStyle}
          {...register('email')}
        />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
        style={{ background: 'rgb(14 124 90)' }}
      >
        {isSubmitting ? 'Sending…' : 'Send reset link'}
      </button>
      <div className="text-center">
        <a href="/login" className="text-sm opacity-60 hover:opacity-90 transition-opacity">
          Back to sign in
        </a>
      </div>
    </form>
  )
}
