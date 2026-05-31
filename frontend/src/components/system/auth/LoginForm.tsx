'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api, ApiError, setToken } from '@/lib/system/api'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})
type FormValues = z.infer<typeof schema>

export function LoginForm() {
  const router      = useRouter()
  const params      = useSearchParams()
  const queryClient = useQueryClient()
  const [showPw, setShowPw] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(values: FormValues) {
    try {
      const res = await api<{ token: string } & Record<string, unknown>>(
        '/auth/login',
        { method: 'POST', body: JSON.stringify(values) },
      )
      setToken(res.token)
      const { token: _t, ...user } = res
      queryClient.setQueryData(['me'], user)
      router.push(params.get('from') ?? '/dashboard')
    } catch (e) {
      if (e instanceof ApiError) {
        toast.error(e.status === 429 ? e.message : 'Invalid email or password')
      } else {
        toast.error('Something went wrong. Please try again.')
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="block text-xs font-semibold tracking-wide mb-2 uppercase"
          style={{ color: 'rgb(11 31 58)', letterSpacing: '0.06em' }}
        >
          Email address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@alrayan-academy.com"
          className={[
            'w-full px-4 py-3 rounded-xl text-sm outline-none transition-all',
            'focus:bg-white focus:border-[#C9A24B]',
            errors.email
              ? 'border-[1.5px] border-[rgb(var(--status-danger,166_39_30))]'
              : 'border-[1.5px] border-[rgb(var(--border-default,229_233_240))]',
          ].join(' ')}
          style={{ background: 'rgb(var(--surface-bg, 244 246 250))', color: 'rgb(11 31 58)' }}
          {...register('email')}
        />
        {errors.email && (
          <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: 'rgb(var(--status-danger, 166 39 30))' }}>
            <span aria-hidden>⚠</span> {errors.email.message}
          </p>
        )}
      </div>

      {/* Password */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label
            htmlFor="password"
            className="block text-xs font-semibold tracking-wide uppercase"
            style={{ color: 'rgb(11 31 58)', letterSpacing: '0.06em' }}
          >
            Password
          </label>
          <a
            href="/forgot-password"
            className="text-xs transition-colors"
            style={{ color: '#C9A24B' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#a07d30')}
            onMouseLeave={e => (e.currentTarget.style.color = '#C9A24B')}
          >
            Forgot password?
          </a>
        </div>
        <div className="relative">
          <input
            id="password"
            type={showPw ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••••"
            className={[
              'w-full px-4 py-3 pr-11 rounded-xl text-sm outline-none transition-all',
              'focus:bg-white focus:border-[#C9A24B]',
              errors.password
                ? 'border-[1.5px] border-[rgb(var(--status-danger,166_39_30))]'
                : 'border-[1.5px] border-[rgb(var(--border-default,229_233_240))]',
            ].join(' ')}
            style={{ background: 'rgb(var(--surface-bg, 244 246 250))', color: 'rgb(11 31 58)' }}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPw(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-opacity hover:opacity-80"
            aria-label={showPw ? 'Hide password' : 'Show password'}
            style={{ color: 'rgb(var(--status-neutral, 90 100 112))' }}
          >
            {showPw ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 0 0-1.06 1.06l14.5 14.5a.75.75 0 1 0 1.06-1.06l-1.745-1.745a10.029 10.029 0 0 0 3.3-4.38 1.651 1.651 0 0 0 0-1.186A10.004 10.004 0 0 0 9.999 3a9.956 9.956 0 0 0-4.744 1.194L3.28 2.22ZM7.752 6.69l1.092 1.092a2.5 2.5 0 0 1 3.374 3.373l1.091 1.092a4 4 0 0 0-5.557-5.557Z" clipRule="evenodd" />
                <path d="M10.748 13.93l2.523 2.523a10.006 10.006 0 0 1-8.555-3.422 1.651 1.651 0 0 1 0-1.186 10.13 10.13 0 0 1 1.06-1.998l1.59 1.59a4 4 0 0 0 3.382 3.003Z" />
              </svg>
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: 'rgb(var(--status-danger, 166 39 30))' }}>
            <span aria-hidden>⚠</span> {errors.password.message}
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all mt-2 flex items-center justify-center gap-2"
        style={{
          background: isSubmitting
            ? 'rgb(11 31 58 / 0.7)'
            : 'linear-gradient(135deg, #0B1F3A 0%, #163566 100%)',
          boxShadow: isSubmitting ? 'none' : '0 4px 14px rgba(11,31,58,0.3)',
          letterSpacing: '0.03em',
        }}
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Signing in…
          </>
        ) : (
          <>
            Sign in
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 opacity-70">
              <path fillRule="evenodd" d="M2 8a.75.75 0 0 1 .75-.75h8.69L9.22 5.03a.75.75 0 0 1 1.06-1.06l3.5 3.5a.75.75 0 0 1 0 1.06l-3.5 3.5a.75.75 0 1 1-1.06-1.06l2.22-2.22H2.75A.75.75 0 0 1 2 8Z" clipRule="evenodd" />
            </svg>
          </>
        )}
      </button>
    </form>
  )
}
