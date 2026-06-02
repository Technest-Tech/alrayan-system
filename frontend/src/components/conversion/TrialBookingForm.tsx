'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronDown, Loader2, Sparkles } from 'lucide-react'
import { sendGAEvent } from '@next/third-parties/google'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { FormField } from './FormField'
import { PhoneWithCountry } from './PhoneWithCountry'
import { SuccessState } from './SuccessState'
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

const AGE_GROUPS = [
  { value: 'kid-5-8', label: 'Child (5–8)' },
  { value: 'kid-9-12', label: 'Child (9–12)' },
  { value: 'teen', label: 'Teen (13–17)' },
  { value: 'adult', label: 'Adult (18+)' },
] as const

// Empty-string → undefined so an opened-then-closed optional section doesn't
// block submission (z.enum(...).optional() rejects "" but accepts undefined).
const emptyToUndef = (v: unknown) => (v === '' ? undefined : v)

const schema = z.object({
  name: z.string().min(2, 'Please enter your name'),
  phone: z
    .string()
    .min(6, 'A valid WhatsApp number is required')
    .max(30, 'Number is too long'),
  email: z.string().email('Please enter a valid email').max(255),
  country:        z.preprocess(emptyToUndef, z.string().max(100).optional()),
  ageGroup:       z.preprocess(emptyToUndef, z.enum(['kid-5-8', 'kid-9-12', 'teen', 'adult']).optional()),
  courseInterest: z.preprocess(emptyToUndef, z.string().max(100).optional()),
  preferredTime:  z.preprocess(emptyToUndef, z.string().max(50).optional()),
  timezone:       z.preprocess(emptyToUndef, z.string().max(100).optional()),
  message:        z.preprocess(emptyToUndef, z.string().max(500, 'Max 500 characters').optional()),
})

type FormValues = z.infer<typeof schema>

type Status = 'idle' | 'loading' | 'success' | 'error'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export function TrialBookingForm() {
  const [status, setStatus] = useState<Status>('idle')
  const [reference, setReference] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [showDetails, setShowDetails] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { phone: '' },
  })

  // Register the phone field so RHF tracks it (the custom component sets the value).
  useEffect(() => {
    register('phone')
  }, [register])

  const phoneValue = watch('phone') ?? ''

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (tz) setValue('timezone', tz)
    } catch {
      // Intl not available — leave blank
    }
  }, [setValue])

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
      sendGAEvent('event', 'book_trial', {
        reference: json.reference,
        course: data.course,
        country: data.country,
      })
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
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <div className="flex items-center gap-2 rounded-2xl border border-secondary/20 bg-gradient-to-r from-secondary/5 via-secondary/10 to-secondary/5 px-4 py-2.5">
        <Sparkles className="size-4 text-secondary" aria-hidden="true" />
        <p className="text-xs sm:text-sm text-primary/80">
          Just <span className="font-semibold text-primary">name, WhatsApp & email</span> — we&apos;ll handle the rest on a call.
        </p>
      </div>

      <FormField
        id="name"
        label="Full Name"
        required
        autoComplete="name"
        placeholder="Your full name"
        error={errors.name?.message}
        disabled={isLoading}
        {...register('name')}
      />

      <div className="grid sm:grid-cols-2 gap-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone" className="text-primary">
            WhatsApp Number
            <span className="text-destructive ml-1" aria-hidden="true">*</span>
          </Label>
          <PhoneWithCountry
            id="phone"
            value={phoneValue}
            onChange={(combined) =>
              setValue('phone', combined, { shouldValidate: true, shouldDirty: true })
            }
            disabled={isLoading}
            invalid={!!errors.phone}
            placeholder="12 345 6789"
          />
          {errors.phone && (
            <p role="alert" aria-live="polite" className="text-destructive text-sm">
              {errors.phone.message}
            </p>
          )}
        </div>
        <FormField
          id="email"
          label="Email Address"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          disabled={isLoading}
          {...register('email')}
        />
      </div>

      <button
        type="button"
        onClick={() => setShowDetails((v) => !v)}
        aria-expanded={showDetails}
        className="flex w-full items-center justify-between rounded-xl border border-border-soft bg-white/50 px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-white"
      >
        <span className="flex items-center gap-2">
          <span className="inline-flex size-5 items-center justify-center rounded-full bg-secondary/15 text-[10px] font-bold text-secondary">+</span>
          Add details to speed up scheduling <span className="text-muted-foreground font-normal">(optional)</span>
        </span>
        <ChevronDown
          className={`size-4 text-muted-foreground transition-transform ${showDetails ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {showDetails && (
        <div className="space-y-5 rounded-2xl border border-border-soft bg-white/40 p-4 sm:p-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <FormField
              id="country"
              label="Country"
              as="select"
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
              id="courseInterest"
              label="Course of Interest"
              as="select"
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
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-primary mb-2">Age Group</legend>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {AGE_GROUPS.map(({ value, label }) => (
                <label
                  key={value}
                  className="flex items-center justify-center gap-2 cursor-pointer rounded-xl border border-border-soft bg-white px-3 py-2.5 text-xs sm:text-sm text-primary has-[:checked]:border-secondary has-[:checked]:bg-secondary/5 has-[:checked]:shadow-sm hover:border-secondary/50 transition-all"
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
          </fieldset>

          <FormField
            id="preferredTime"
            label="Preferred Class Time"
            as="select"
            error={errors.preferredTime?.message}
            disabled={isLoading}
            {...register('preferredTime')}
          >
            <option value="">Any time works</option>
            {PREFERRED_TIMES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </FormField>

          <FormField
            id="message"
            label="Anything you'd like us to know?"
            as="textarea"
            placeholder="Current level, goals, scheduling constraints…"
            rows={3}
            error={errors.message?.message}
            disabled={isLoading}
            {...register('message')}
          />

          <input type="hidden" {...register('timezone')} />
        </div>
      )}

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
        className="w-full justify-center group relative overflow-hidden"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Sending…
          </>
        ) : (
          <>
            Book My Free Trial Class
            <span aria-hidden="true" className="ml-1 transition-transform group-hover:translate-x-1">→</span>
          </>
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        ✓ Free first class &middot; ✓ Instant WhatsApp confirmation &middot; ✓ No credit card
      </p>
    </form>
  )
}
