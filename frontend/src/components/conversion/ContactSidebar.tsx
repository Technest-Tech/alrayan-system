'use client'

import { useState } from 'react'
import { Mail, Phone, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { whatsappLink, siteConfig } from '@/config/site'
import { ContactForm } from './ContactForm'
import { useT } from '@/i18n/MarketingI18nProvider'

export function ContactSidebar() {
  const { t } = useT()
  const [showContactForm, setShowContactForm] = useState(false)

  return (
    <div className="md:sticky md:top-32 space-y-6">
      {/* Contact info card */}
      <div className="bg-white rounded-2xl border border-border-soft shadow-soft p-8">
        <h2 className="text-lg font-display font-semibold text-primary mb-6">{t('contactSidebar.heading')}</h2>

        <ul className="space-y-4">
          <li className="flex items-start gap-3">
            <div className="size-9 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
              <Mail className="size-4 text-secondary" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">{t('contactSidebar.emailLabel')}</p>
              <a
                href={`mailto:${siteConfig.email}`}
                className="text-sm font-medium text-primary hover:text-secondary transition-colors"
              >
                {siteConfig.email}
              </a>
            </div>
          </li>

          <li className="flex items-start gap-3">
            <div className="size-9 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
              <Phone className="size-4 text-secondary" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">{t('contactSidebar.whatsappLabel')}</p>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-primary hover:text-secondary transition-colors"
              >
                {t('contactSidebar.chatWhatsapp')}
              </a>
            </div>
          </li>

          <li className="flex items-start gap-3">
            <div className="size-9 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
              <Clock className="size-4 text-secondary" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">{t('contactSidebar.availabilityLabel')}</p>
              <p className="text-sm font-medium text-primary">{t('contactSidebar.availabilityValue')}</p>
            </div>
          </li>
        </ul>

        <hr className="my-6 border-border-soft" />

        <button
          onClick={() => setShowContactForm((v) => !v)}
          className="flex items-center justify-between w-full text-sm text-secondary font-semibold hover:underline"
          aria-expanded={showContactForm}
        >
          {t('contactSidebar.toggleQuestion')}
          {showContactForm ? (
            <ChevronUp className="size-4" aria-hidden="true" />
          ) : (
            <ChevronDown className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {showContactForm && (
        <div className="bg-white rounded-2xl border border-border-soft shadow-soft p-6">
          <p className="text-sm text-muted-foreground mb-5">
            {t('contactSidebar.quickMessageNote')}
          </p>
          <ContactForm />
        </div>
      )}
    </div>
  )
}
