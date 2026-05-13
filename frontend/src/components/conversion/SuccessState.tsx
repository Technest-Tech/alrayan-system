import { CheckCircle2 } from 'lucide-react'
import { whatsappLink } from '@/config/site'

type SuccessStateProps = {
  reference: string
  type: 'trial' | 'contact'
}

export function SuccessState({ reference, type }: SuccessStateProps) {
  const waMessage =
    type === 'trial'
      ? `Assalamu alaikum, I just booked a free trial (Ref: ${reference}). I'd like to discuss scheduling.`
      : `Assalamu alaikum, I submitted a contact message (Ref: ${reference}). I'd like to follow up.`

  return (
    <div className="text-center py-12 px-6 max-w-md mx-auto" role="status" aria-live="polite">
      <div className="size-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="size-8 text-secondary" aria-hidden="true" />
      </div>
      <h2 className="text-2xl font-display font-semibold text-primary mb-2">
        {type === 'trial' ? 'Trial Class Booked!' : 'Message Received!'}
      </h2>
      <p className="text-muted-foreground mb-1">Your reference number:</p>
      <p className="font-mono text-lg font-semibold text-primary mb-4">{reference}</p>
      <p className="text-muted-foreground text-sm mb-8">
        {type === 'trial'
          ? 'Check your inbox — a confirmation email is on its way. We will be in touch within 24 hours to confirm your teacher and time slot.'
          : 'We have received your message and will reply within 24 hours. Check your email for a confirmation.'}
      </p>
      <a
        href={whatsappLink(waMessage)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] text-white px-6 py-3 font-medium hover:bg-[#1da851] transition-colors"
      >
        Continue on WhatsApp
      </a>
    </div>
  )
}
