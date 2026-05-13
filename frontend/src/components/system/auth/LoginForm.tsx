'use client'
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

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(values: FormValues) {
    try {
      const res = await api<{ token: string } & Record<string, unknown>>('/auth/login', { method: 'POST', body: JSON.stringify(values) })
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

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)]'
  const inputStyle = { borderColor: 'rgb(var(--border-default, 229 233 240))', background: 'rgb(var(--surface-card, 255 255 255))' }

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
      <div>
        <label className="block text-sm font-medium mb-1.5" htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          className={inputCls}
          style={inputStyle}
          {...register('password')}
        />
        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        <a
          href="/forgot-password"
          className="text-xs opacity-60 hover:opacity-90 transition-opacity mt-1 inline-block"
        >
          Forgot your password?
        </a>
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
        style={{ background: 'rgb(14 124 90)' }}
      >
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
