'use client'

import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowRight, Baby, Check, Loader2, Lock, User } from 'lucide-react'
import { SuccessState } from './SuccessState'
import { courses, getCourses } from '@/content/courses'
import { navCourseSlugs } from '@/config/nav'
import { useT } from '@/i18n/MarketingI18nProvider'
import type { TranslateFn } from '@/i18n/translate'
import {
  sendWeb3FormsNotification,
  type Web3FormsFields,
} from '@/lib/web3forms'

/** Dial-code picker options for the WhatsApp field. */
const PHONE_COUNTRIES = [
  { code: 'FR', dial: '+33', flag: '🇫🇷', name: 'France' },
  { code: 'US', dial: '+1', flag: '🇺🇸', name: 'United States' },
  { code: 'GB', dial: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: 'CA', dial: '+1', flag: '🇨🇦', name: 'Canada' },
  { code: 'AU', dial: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: 'DE', dial: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: 'NL', dial: '+31', flag: '🇳🇱', name: 'Netherlands' },
  { code: 'BE', dial: '+32', flag: '🇧🇪', name: 'Belgium' },
  { code: 'SE', dial: '+46', flag: '🇸🇪', name: 'Sweden' },
  { code: 'NO', dial: '+47', flag: '🇳🇴', name: 'Norway' },
  { code: 'DK', dial: '+45', flag: '🇩🇰', name: 'Denmark' },
  { code: 'AE', dial: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: 'SA', dial: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: 'QA', dial: '+974', flag: '🇶🇦', name: 'Qatar' },
  { code: 'KW', dial: '+965', flag: '🇰🇼', name: 'Kuwait' },
  { code: 'BH', dial: '+973', flag: '🇧🇭', name: 'Bahrain' },
  { code: 'MY', dial: '+60', flag: '🇲🇾', name: 'Malaysia' },
  { code: 'PK', dial: '+92', flag: '🇵🇰', name: 'Pakistan' },
  { code: 'EG', dial: '+20', flag: '🇪🇬', name: 'Egypt' },
  { code: 'TR', dial: '+90', flag: '🇹🇷', name: 'Turkey' },
  { code: 'ZA', dial: '+27', flag: '🇿🇦', name: 'South Africa' },
] as const

// Ordered translation keys for the benefits list (free-trial highlight first).
const BENEFIT_KEYS = [
  'trialForm.benefit5',
  'trialForm.benefit1',
  'trialForm.benefit2',
  'trialForm.benefit3',
  'trialForm.benefit4',
] as const

const makeSchema = (t: TranslateFn) =>
  z.object({
    name: z.string().min(2, t('trialForm.nameRequired')),
    email: z.string().email(t('trialForm.emailInvalid')),
    phoneCountry: z.string().min(1),
    phone: z.string().min(4, t('trialForm.phoneRequired')),
    courseInterest: z.string().min(1, t('trialForm.courseRequired')),
    audience: z.enum(['adult', 'child'], { error: t('trialForm.audienceRequired') }),
    // Backend caps the message at 500 characters.
    message: z.string().max(500).optional(),
  })

type FormValues = z.infer<ReturnType<typeof makeSchema>>

type Status = 'idle' | 'loading' | 'success' | 'error'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export function TrialBookingForm() {
  const { t, locale } = useT()
  const [status, setStatus] = useState<Status>('idle')
  const [reference, setReference] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [timezone, setTimezone] = useState('')
  const [pendingNotification, setPendingNotification] = useState<Web3FormsFields | null>(
    null,
  )

  const schema = useMemo(() => makeSchema(t), [t])
  const localizedCourses = useMemo(() => getCourses(locale), [locale])
  // Only the four offered courses appear here; the value posted stays the
  // English title so leads read the same whichever language the visitor booked in.
  const courseOptions = useMemo(
    () =>
      courses.flatMap((c, i) =>
        (navCourseSlugs as readonly string[]).includes(c.slug)
          ? [{ slug: c.slug, value: c.title, label: localizedCourses[i].title }]
          : [],
      ),
    [localizedCourses],
  )

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { phoneCountry: PHONE_COUNTRIES[0].code, audience: undefined },
  })

  const audience = watch('audience')

  // Detect the visitor's timezone once — sent silently with the booking.
  useEffect(() => {
    try {
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone ?? '')
    } catch {
      // Intl unavailable — leave blank
    }
  }, [])

  const onSubmit = async (data: FormValues) => {
    setStatus('loading')
    setErrorMsg('')
    let savedInBackend = pendingNotification !== null

    const country =
      PHONE_COUNTRIES.find((c) => c.code === data.phoneCountry) ?? PHONE_COUNTRIES[0]

    // The design collects only the essentials; the rest is derived for the API.
    const payload = {
      name: data.name,
      email: data.email,
      country: country.name,
      phone: `${country.dial} ${data.phone}`.trim(),
      ageGroup: data.audience === 'adult' ? 'adult' : 'kid-9-12',
      courseInterest: data.courseInterest,
      preferredTime: 'flexible',
      timezone: timezone || 'UTC',
      message: data.message?.trim() ?? '',
    }

    try {
      let notification = pendingNotification

      if (!notification) {
        const res = await fetch(`${API_URL}/api/v1/trial-bookings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(
            (err as { message?: string }).message ?? t('trialForm.errorGeneric'),
          )
        }

        const json = (await res.json()) as { reference: string }
        setReference(json.reference)
        savedInBackend = true

        notification = {
          subject: `[Free Trial Booking] ${data.name}`,
          form_name: 'Free trial booking form',
          reference: json.reference,
          name: data.name,
          email: data.email,
          phone: payload.phone,
          country: country.name,
          audience: data.audience === 'adult' ? 'Adult' : 'Child',
          course: data.courseInterest,
          message: payload.message,
          preferred_time: payload.preferredTime,
          timezone: payload.timezone,
          language: locale.toUpperCase(),
          page_url: window.location.href,
        }
        setPendingNotification(notification)
      }

      await sendWeb3FormsNotification(notification)
      setStatus('success')
    } catch (e) {
      setStatus('error')
      setErrorMsg(
        savedInBackend
          ? t('trialForm.emailRetry')
          : e instanceof Error
            ? e.message
            : t('trialForm.errorGeneric'),
      )
    }
  }

  const retryEmailNotification = async () => {
    if (!pendingNotification) return

    setStatus('loading')
    setErrorMsg('')

    try {
      await sendWeb3FormsNotification(pendingNotification)
      setStatus('success')
    } catch {
      setStatus('error')
      setErrorMsg(t('trialForm.emailRetry'))
    }
  }

  if (status === 'success') {
    return <SuccessState type="trial" reference={reference} />
  }

  const isLoading = status === 'loading'
  const fieldsDisabled = isLoading || pendingNotification !== null

  const fieldClass =
    'w-full rounded-lg border border-white/15 bg-[#0a2a29] px-3.5 py-2.5 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-teal-400/70 focus:ring-2 focus:ring-teal-400/20 disabled:opacity-50'
  const labelClass = 'block text-xs font-medium text-white/70 mb-1.5'

  return (
    <div
      className="relative overflow-hidden rounded-[2rem] p-6 sm:p-10 lg:p-14 ring-1 ring-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
      style={{ background: 'linear-gradient(135deg, #0a2f2d 0%, #072221 60%, #061e1d 100%)' }}
    >
      {/* Gold accent line across the top */}
      <span
        className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent"
        aria-hidden="true"
      />

      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
        {/* ── Left: pitch + benefits ── */}
        <div>
          <h2 className="font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
            {t('trialForm.heading1')}
            <span className="text-accent">{t('trialForm.headingAccent')}</span>
            {t('trialForm.heading2')}
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/60">
            {t('trialForm.subheading')}
          </p>

          <ul className="mt-7 space-y-3.5">
            {BENEFIT_KEYS.map((key) => (
              <li key={key} className="flex items-center gap-3 text-sm text-white/85">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-teal-500/90">
                  <Check className="size-3 text-white" strokeWidth={3} aria-hidden="true" />
                </span>
                {t(key)}
              </li>
            ))}
          </ul>
        </div>

        {/* ── Right: register form ── */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-7">
          <h3 className="mb-6 text-center text-lg font-semibold text-white">{t('trialForm.registerNow')}</h3>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Full name */}
            <div>
              <label htmlFor="name" className={labelClass}>
                {t('trialForm.nameLabel')}
              </label>
              <input
                id="name"
                type="text"
                placeholder={t('trialForm.namePlaceholder')}
                autoComplete="name"
                disabled={fieldsDisabled}
                aria-invalid={!!errors.name}
                className={fieldClass}
                {...register('name')}
              />
              {errors.name && (
                <p role="alert" className="mt-1 text-xs text-red-400">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className={labelClass}>
                {t('trialForm.emailLabel')}
              </label>
              <input
                id="email"
                type="email"
                placeholder={t('trialForm.emailPlaceholder')}
                autoComplete="email"
                disabled={fieldsDisabled}
                aria-invalid={!!errors.email}
                className={fieldClass}
                {...register('email')}
              />
              {errors.email && (
                <p role="alert" className="mt-1 text-xs text-red-400">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Phone (WhatsApp) */}
            <div>
              <label htmlFor="phone" className={labelClass}>
                {t('trialForm.phoneLabel')}
              </label>
              <div className="flex gap-2">
                <select
                  aria-label={t('trialForm.dialCodeAria')}
                  disabled={fieldsDisabled}
                  className="shrink-0 rounded-lg border border-white/15 bg-[#0a2a29] px-2 py-2.5 text-sm text-white outline-none transition-colors focus:border-teal-400/70 focus:ring-2 focus:ring-teal-400/20 disabled:opacity-50"
                  {...register('phoneCountry')}
                >
                  {PHONE_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code} className="text-black">
                      {c.flag} {c.dial}
                    </option>
                  ))}
                </select>
                <input
                  id="phone"
                  type="tel"
                  placeholder={t('trialForm.phonePlaceholder')}
                  autoComplete="tel"
                  disabled={fieldsDisabled}
                  aria-invalid={!!errors.phone}
                  className={fieldClass}
                  {...register('phone')}
                />
              </div>
              {errors.phone && (
                <p role="alert" className="mt-1 text-xs text-red-400">
                  {errors.phone.message}
                </p>
              )}
            </div>

            {/* Desired course */}
            <div>
              <label htmlFor="courseInterest" className={labelClass}>
                {t('trialForm.courseLabel')}
              </label>
              <select
                id="courseInterest"
                disabled={fieldsDisabled}
                aria-invalid={!!errors.courseInterest}
                defaultValue=""
                className={`${fieldClass} border-teal-400/40`}
                {...register('courseInterest')}
              >
                <option value="" disabled className="text-black">
                  {t('trialForm.selectCourse')}
                </option>
                {courseOptions.map((c) => (
                  <option key={c.slug} value={c.value} className="text-black">
                    {c.label}
                  </option>
                ))}
              </select>
              {errors.courseInterest && (
                <p role="alert" className="mt-1 text-xs text-red-400">
                  {errors.courseInterest.message}
                </p>
              )}
            </div>

            {/* This course is for */}
            <div>
              <span className={labelClass}>{t('trialForm.audienceLabel')}</span>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'adult' as const, label: t('trialForm.audienceAdult'), Icon: User },
                  { value: 'child' as const, label: t('trialForm.audienceChild'), Icon: Baby },
                ].map(({ value, label, Icon }) => {
                  const selected = audience === value
                  return (
                    <button
                      key={value}
                      type="button"
                      disabled={fieldsDisabled}
                      onClick={() =>
                        setValue('audience', value, { shouldValidate: true })
                      }
                      aria-pressed={selected}
                      className={`flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm transition-colors disabled:opacity-50 ${
                        selected
                          ? 'border-teal-400 bg-teal-400/10 text-white'
                          : 'border-white/15 bg-[#0a2a29] text-white/85 hover:border-white/30'
                      }`}
                    >
                      <span
                        className={`flex size-6 items-center justify-center rounded-full ${
                          selected ? 'bg-teal-400/20 text-teal-300' : 'bg-white/10 text-white/70'
                        }`}
                      >
                        <Icon className="size-3.5" aria-hidden="true" />
                      </span>
                      {label}
                    </button>
                  )
                })}
              </div>
              {errors.audience && (
                <p role="alert" className="mt-1 text-xs text-red-400">
                  {errors.audience.message}
                </p>
              )}
            </div>

            {/* Free-text details — lands in the lead's notes in the CRM */}
            <div>
              <label htmlFor="message" className={labelClass}>
                {t('trialForm.messageLabel')}{' '}
                <span className="text-white/40">({t('trialForm.messageOptional')})</span>
              </label>
              <textarea
                id="message"
                rows={3}
                maxLength={500}
                placeholder={t('trialForm.messagePlaceholder')}
                disabled={fieldsDisabled}
                aria-invalid={!!errors.message}
                className={`${fieldClass} resize-y`}
                {...register('message')}
              />
              {errors.message && (
                <p role="alert" className="mt-1 text-xs text-red-400">
                  {errors.message.message}
                </p>
              )}
            </div>

            {/* Error alert */}
            {status === 'error' && (
              <div
                role="alert"
                className="rounded-lg border border-red-400/30 bg-red-400/10 px-3.5 py-2.5 text-xs text-red-300"
              >
                {errorMsg}
              </div>
            )}

            {/* Submit */}
            <button
              type={pendingNotification ? 'button' : 'submit'}
              disabled={isLoading}
              onClick={pendingNotification ? retryEmailNotification : undefined}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#17a398] to-[#0e8a7e] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-900/40 transition-all hover:from-[#1cb3a7] hover:to-[#10998c] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  {t('trialForm.booking')}
                </>
              ) : (
                <>
                  {pendingNotification ? t('trialForm.retryEmail') : t('trialForm.submit')}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </>
              )}
            </button>

            <p className="flex items-center justify-center gap-1.5 text-[11px] text-white/45">
              <Lock className="size-3" aria-hidden="true" />
              {t('trialForm.secureNote')}
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
