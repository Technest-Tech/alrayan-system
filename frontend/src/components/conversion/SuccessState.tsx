'use client'

import {
  CheckCircle2,
  Database,
  MailCheck,
  MessageCircle,
  Sparkles,
} from 'lucide-react'
import { whatsappLink } from '@/config/site'
import { useT } from '@/i18n/MarketingI18nProvider'

type SuccessStateProps = {
  reference: string
  type: 'trial' | 'contact'
}

export function SuccessState({ reference, type }: SuccessStateProps) {
  const { t } = useT()

  const waMessage =
    type === 'trial'
      ? t('success.waTrial', { ref: reference })
      : t('success.waContact', { ref: reference })

  return (
    <div
      className="relative mx-auto max-w-2xl animate-in overflow-hidden rounded-[2rem] border border-emerald-200/70 bg-white px-6 py-10 text-center shadow-[0_28px_80px_rgba(6,78,59,0.2)] duration-500 fade-in zoom-in-95 sm:px-12 sm:py-12"
      role="status"
      aria-live="polite"
    >
      <div
        className="pointer-events-none absolute -right-20 -top-20 size-56 rounded-full bg-emerald-100/70 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-20 size-56 rounded-full bg-amber-100/60 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative">
        <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.13em] text-emerald-700">
          <Sparkles className="size-3.5" aria-hidden="true" />
          {t('success.statusBadge')}
        </span>

        <div className="relative mx-auto mb-6 flex size-20 items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-emerald-100" aria-hidden="true" />
          <span
            className="absolute inset-2 rounded-full border border-emerald-300 bg-white shadow-sm"
            aria-hidden="true"
          />
          <CheckCircle2
            className="relative size-10 text-emerald-600"
            strokeWidth={2.4}
            aria-hidden="true"
          />
        </div>

        <h2 className="mb-3 font-display text-2xl font-semibold text-primary sm:text-3xl">
          {type === 'trial' ? t('success.titleTrial') : t('success.titleContact')}
        </h2>
        <p className="mx-auto mb-7 max-w-lg text-sm leading-6 text-muted-foreground sm:text-base">
          {type === 'trial' ? t('success.bodyTrial') : t('success.bodyContact')}
        </p>

        <div className="mx-auto mb-6 grid max-w-lg gap-3 text-left sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Database className="size-4" aria-hidden="true" />
            </span>
            <span className="text-sm font-medium text-emerald-950">
              {t('success.savedStatus')}
            </span>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <MailCheck className="size-4" aria-hidden="true" />
            </span>
            <span className="text-sm font-medium text-emerald-950">
              {t('success.emailedStatus')}
            </span>
          </div>
        </div>

        <div className="mx-auto mb-7 max-w-lg rounded-xl border border-border-soft bg-muted/40 px-4 py-3">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('success.referenceLabel')}
          </p>
          <p className="font-mono text-lg font-semibold tracking-wide text-primary">{reference}</p>
        </div>

        <a
          href={whatsappLink(waMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-900/15 transition-all hover:-translate-y-0.5 hover:bg-[#1da851] hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
        >
          <MessageCircle className="size-4" aria-hidden="true" />
          {t('success.continueWhatsapp')}
        </a>
      </div>
    </div>
  )
}
