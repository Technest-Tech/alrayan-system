import { whatsappLink } from '@/config/site'

type SuccessStateProps = {
  reference: string
  type: 'trial' | 'contact'
}

export function SuccessState({ reference, type }: SuccessStateProps) {
  const waMessage =
    type === 'trial'
      ? `Assalamu alaikum, I just booked a free trial. I'd like to discuss scheduling.`
      : `Assalamu alaikum, I submitted a contact message. I'd like to follow up.`

  return (
    <div className="text-center py-10 px-6 max-w-sm mx-auto" role="status" aria-live="polite">
      {/* Success illustration */}
      <div className="mx-auto mb-8 w-52 h-52">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          {/* Background circle */}
          <circle cx="100" cy="100" r="90" fill="#FFF8E7" />
          <circle cx="100" cy="100" r="72" fill="#FEF0C7" />

          {/* Sparkles */}
          <circle cx="42" cy="48" r="5" fill="#F59E0B" opacity="0.6" />
          <circle cx="158" cy="52" r="4" fill="#F59E0B" opacity="0.5" />
          <circle cx="162" cy="148" r="6" fill="#F59E0B" opacity="0.4" />
          <circle cx="38" cy="152" r="4" fill="#F59E0B" opacity="0.5" />
          <circle cx="100" cy="22" r="5" fill="#F59E0B" opacity="0.45" />
          <circle cx="178" cy="100" r="4" fill="#F59E0B" opacity="0.4" />
          <circle cx="22" cy="100" r="3" fill="#F59E0B" opacity="0.4" />

          {/* Stars */}
          <path d="M60 30 L62.5 37 L70 37 L64 41.5 L66.5 48.5 L60 44 L53.5 48.5 L56 41.5 L50 37 L57.5 37 Z" fill="#F59E0B" opacity="0.7" />
          <path d="M148 28 L149.8 33.4 L155.5 33.4 L151 36.6 L152.8 42 L148 38.8 L143.2 42 L145 36.6 L140.5 33.4 L146.2 33.4 Z" fill="#F59E0B" opacity="0.55" />

          {/* Check shield */}
          <path d="M100 55 L130 68 L130 100 C130 120 116 136 100 142 C84 136 70 120 70 100 L70 68 Z" fill="#D97706" />
          <path d="M100 60 L126 72 L126 100 C126 118 113 133 100 138 C87 133 74 118 74 100 L74 72 Z" fill="#F59E0B" />

          {/* Checkmark */}
          <path d="M86 100 L96 110 L116 88" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <h2 className="text-2xl font-display font-semibold text-primary mb-3">
        {type === 'trial' ? "You're all set! 🎉" : 'Message received!'}
      </h2>

      <p className="text-muted-foreground text-sm leading-relaxed mb-8">
        {type === 'trial'
          ? 'Our team will reach out within 24 hours to confirm your teacher and schedule your free class.'
          : "We'll reply within 24 hours. Keep an eye on your inbox."}
      </p>

      <a
        href={whatsappLink(waMessage)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2.5 rounded-2xl bg-[#25D366] text-white px-7 py-3.5 font-medium text-sm shadow-md hover:bg-[#1da851] transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="size-5" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        Chat with us on WhatsApp
      </a>
    </div>
  )
}
