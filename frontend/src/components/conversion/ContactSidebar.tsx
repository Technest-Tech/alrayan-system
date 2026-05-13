'use client'

import { useState } from 'react'
import { Mail, Phone, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { whatsappLink, siteConfig } from '@/config/site'
import { ContactForm } from './ContactForm'

export function ContactSidebar() {
  const [showContactForm, setShowContactForm] = useState(false)

  return (
    <div className="md:sticky md:top-32 space-y-6">
      {/* Contact info card */}
      <div className="bg-white rounded-2xl border border-border-soft shadow-soft p-8">
        <h2 className="text-lg font-display font-semibold text-primary mb-6">Get in Touch</h2>

        <ul className="space-y-4">
          <li className="flex items-start gap-3">
            <div className="size-9 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
              <Mail className="size-4 text-secondary" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Email</p>
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
              <p className="text-xs text-muted-foreground mb-0.5">WhatsApp</p>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-primary hover:text-secondary transition-colors"
              >
                Chat on WhatsApp
              </a>
            </div>
          </li>

          <li className="flex items-start gap-3">
            <div className="size-9 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
              <Clock className="size-4 text-secondary" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Availability</p>
              <p className="text-sm font-medium text-primary">7 days a week · All timezones</p>
            </div>
          </li>
        </ul>

        <hr className="my-6 border-border-soft" />

        <button
          onClick={() => setShowContactForm((v) => !v)}
          className="flex items-center justify-between w-full text-sm text-secondary font-semibold hover:underline"
          aria-expanded={showContactForm}
        >
          Just have a quick question?
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
            Send a quick message and we&rsquo;ll reply within 24 hours.
          </p>
          <ContactForm />
        </div>
      )}
    </div>
  )
}
