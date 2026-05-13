'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FormField } from './FormField'
import { SuccessState } from './SuccessState'
import { TurnstileWidget } from './TurnstileWidget'
import { courses } from '@/content/courses'

const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
  'France', 'Netherlands', 'Belgium', 'Sweden', 'Norway', 'Denmark',
  'UAE', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain', 'Malaysia',
  'Pakistan', 'Egypt', 'Turkey', 'South Africa', 'Other',
]

const PREFERRED_TIMES = [
  { value: 'early-morning', label: 'Early Morning (6–9 AM)' },
  { value: 'morning', label: 'Morning (9 AM–12 PM)' },
  { value: 'afternoon', label: 'Afternoon (12–4 PM)' },
  { value: 'evening', label: 'Evening (4–8 PM)' },
  { value: 'night', label: 'Night (8 PM+)' },
]

const schema = z.object({
  name: z.string().min(2, 'Full name required'),
  email: z.string().email('Valid email required'),
  country: z.string().min(1, 'Please select your country'),
  phone: z.string().optional(),
  ageGroup: z.enum(['kid-5-8', 'kid-9-12', 'teen', 'adult'], {
    error: 'Please select an age group',
  }),
  courseInterest: z.string().min(1, 'Please select a course'),
  preferredTime: z.string().min(1, 'Please select a preferred time'),
  timezone: z.string().min(1, 'Timezone required'),
  message: z.string().max(500, 'Max 500 characters').optional(),
  turnstileToken: z.string().min(1, 'Please complete the security check'),
})

type FormValues = z.infer<typeof schema>

type Status = 'idle' | 'loading' | 'success' | 'error'

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '1x00000000000000000000AA'
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export function TrialBookingForm() {
  const [status, setStatus] = useState<Status>('idle')
  const [reference, setReference] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  // Pre-fill timezone on mount
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (tz) setValue('timezone', tz)
    } catch {
      // Intl not available — leave blank
    }
  }, [setValue])

  const handleTurnstileSuccess = useCallback(
    (token: string) => setValue('turnstileToken', token),
    [setValue],
  )

  const onSubmit = async (data: FormValues) => {
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch(`${API_URL}/api/v1/trial-bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { message?: string }).message ?? 'Submission failed')
      }
      const json = (await res.json()) as { reference: string }
      setReference(json.reference)
      setStatus('success')
    } catch (e) {
      setStatus('error')
      setErrorMsg(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    }
  }

  if (status === 'success') {
    return <SuccessState type="trial" reference={reference} />
  }

  const isLoading = status === 'loading'

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-5">
        <FormField
          id="name"
          label="Full Name"
          required
          placeholder="Your full name"
          error={errors.name?.message}
          disabled={isLoading}
          {...register('name')}
        />
        <FormField
          id="email"
          label="Email Address"
          type="email"
          required
          placeholder="you@example.com"
          error={errors.email?.message}
          disabled={isLoading}
          {...register('email')}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <FormField
          id="country"
          label="Country"
          as="select"
          required
          error={errors.country?.message}
          disabled={isLoading}
          {...register('country')}
        >
          <option value="">Select your country…</option>
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </FormField>
        <FormField
          id="phone"
          label="Phone (optional)"
          type="tel"
          placeholder="+1 555 000 0000"
          error={errors.phone?.message}
          disabled={isLoading}
          {...register('phone')}
        />
      </div>

      {/* Age Group — radio buttons */}
      <fieldset>
        <legend className="text-sm font-medium text-primary mb-2">
          Age Group <span className="text-destructive ml-1" aria-hidden="true">*</span>
        </legend>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { value: 'kid-5-8', label: 'Child (5–8)' },
            { value: 'kid-9-12', label: 'Child (9–12)' },
            { value: 'teen', label: 'Teen (13–17)' },
            { value: 'adult', label: 'Adult (18+)' },
          ].map(({ value, label }) => (
            <label
              key={value}
              className="flex items-center gap-2.5 cursor-pointer rounded-xl border border-border-soft bg-white px-4 py-3 text-sm text-primary has-[:checked]:border-secondary has-[:checked]:bg-secondary/5 hover:border-secondary/50 transition-colors"
            >
              <input
                type="radio"
                value={value}
                disabled={isLoading}
                className="accent-secondary"
                {...register('ageGroup')}
              />
              {label}
            </label>
          ))}
        </div>
        {errors.ageGroup && (
          <p role="alert" aria-live="polite" className="text-destructive text-sm mt-1.5">
            {errors.ageGroup.message}
          </p>
        )}
      </fieldset>

      <div className="grid sm:grid-cols-2 gap-5">
        <FormField
          id="courseInterest"
          label="Course of Interest"
          as="select"
          required
          error={errors.courseInterest?.message}
          disabled={isLoading}
          {...register('courseInterest')}
        >
          <option value="">Select a course…</option>
          {courses.map((c) => (
            <option key={c.slug} value={c.title}>
              {c.title}
            </option>
          ))}
        </FormField>
        <FormField
          id="preferredTime"
          label="Preferred Class Time"
          as="select"
          required
          error={errors.preferredTime?.message}
          disabled={isLoading}
          {...register('preferredTime')}
        >
          <option value="">Select a time…</option>
          {PREFERRED_TIMES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </FormField>
      </div>

      <FormField
        id="timezone"
        label="Your Timezone"
        required
        placeholder="e.g. America/New_York"
        error={errors.timezone?.message}
        disabled={isLoading}
        {...register('timezone')}
      />

      <FormField
        id="message"
        label="Additional Notes (optional)"
        as="textarea"
        placeholder="Anything else you'd like us to know — current level, specific goals, scheduling constraints…"
        rows={3}
        error={errors.message?.message}
        disabled={isLoading}
        {...register('message')}
      />

      {/* Turnstile */}
      <div>
        <TurnstileWidget
          siteKey={SITE_KEY}
          onSuccess={handleTurnstileSuccess}
        />
        {errors.turnstileToken && (
          <p role="alert" aria-live="polite" className="text-destructive text-sm mt-1">
            {errors.turnstileToken.message}
          </p>
        )}
      </div>

      {/* Error alert */}
      {status === 'error' && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {errorMsg}
        </div>
      )}

      <Button
        type="submit"
        variant="gold"
        size="lg"
        className="w-full justify-center"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Submitting…
          </>
        ) : (
          'Book My Free Trial Class →'
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        ✓ Free first class &middot; ✓ No credit card required &middot; ✓ Cancel anytime
      </p>
    </form>
  )
}
