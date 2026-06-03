'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Sparkles } from 'lucide-react'
import { sendGAEvent } from '@next/third-parties/google'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { FormField } from './FormField'
import { PhoneWithCountry } from './PhoneWithCountry'
import { SuccessState } from './SuccessState'

const emptyToUndef = (v: unknown) => (v === '' ? undefined : v)

const schema = z.object({
  name: z.string().min(2, 'Please enter your name'),
  phone: z
    .string()
    .min(6, 'A valid WhatsApp number is required')
    .max(30, 'Number is too long'),
  email: z.string().email('Please enter a valid email').max(255),
  message:  z.preprocess(emptyToUndef, z.string().max(1000, 'Max 1000 characters').optional()),
  timezone: z.preprocess(emptyToUndef, z.string().max(100).optional()),
})

type FormValues = z.infer<typeof schema>

type Status = 'idle' | 'loading' | 'success' | 'error'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export function TrialBookingForm() {
  const [status, setStatus] = useState<Status>('idle')
  const [reference, setReference] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

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

      <FormField
        id="message"
        label="Tell us a bit about what you’re looking for"
        as="textarea"
        placeholder="e.g. course interest (Tajweed / Hifz / Arabic…), age group, preferred class time, current level, goals…"
        rows={5}
        error={errors.message?.message}
        disabled={isLoading}
        {...register('message')}
      />

      <input type="hidden" {...register('timezone')} />

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
