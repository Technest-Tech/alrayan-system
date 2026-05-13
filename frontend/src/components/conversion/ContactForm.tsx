'use client'

import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FormField } from './FormField'
import { SuccessState } from './SuccessState'
import { TurnstileWidget } from './TurnstileWidget'

const schema = z.object({
  name: z.string().min(2, 'Full name required'),
  email: z.string().email('Valid email required'),
  subject: z.string().min(3, 'Subject required'),
  message: z.string().min(10, 'Please write at least 10 characters'),
  turnstileToken: z.string().min(1, 'Please complete the security check'),
})

type FormValues = z.infer<typeof schema>

type Status = 'idle' | 'loading' | 'success' | 'error'

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '1x00000000000000000000AA'
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export function ContactForm() {
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

  const handleTurnstileSuccess = useCallback(
    (token: string) => setValue('turnstileToken', token),
    [setValue],
  )

  const onSubmit = async (data: FormValues) => {
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch(`${API_URL}/api/v1/contacts`, {
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
    return <SuccessState type="contact" reference={reference} />
  }

  const isLoading = status === 'loading'

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <FormField
          id="contact-name"
          label="Full Name"
          required
          placeholder="Your name"
          error={errors.name?.message}
          disabled={isLoading}
          {...register('name')}
        />
        <FormField
          id="contact-email"
          label="Email Address"
          type="email"
          required
          placeholder="you@example.com"
          error={errors.email?.message}
          disabled={isLoading}
          {...register('email')}
        />
      </div>

      <FormField
        id="contact-subject"
        label="Subject"
        required
        placeholder="What is your question about?"
        error={errors.subject?.message}
        disabled={isLoading}
        {...register('subject')}
      />

      <FormField
        id="contact-message"
        label="Message"
        as="textarea"
        required
        placeholder="Write your message here…"
        rows={4}
        error={errors.message?.message}
        disabled={isLoading}
        {...register('message')}
      />

      <div>
        <TurnstileWidget siteKey={SITE_KEY} onSuccess={handleTurnstileSuccess} />
        {errors.turnstileToken && (
          <p role="alert" aria-live="polite" className="text-destructive text-sm mt-1">
            {errors.turnstileToken.message}
          </p>
        )}
      </div>

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
        size="default"
        className="w-full justify-center"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Sending…
          </>
        ) : (
          'Send Message'
        )}
      </Button>
    </form>
  )
}
