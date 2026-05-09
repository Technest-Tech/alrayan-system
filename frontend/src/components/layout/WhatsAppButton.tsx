'use client'

import { usePathname } from 'next/navigation'
import { whatsappLink } from '@/config/site'

export function WhatsAppButton() {
  const pathname = usePathname()

  // On the contact page the form is the primary booking action — suppress the button
  if (pathname === '/contact') return null

  return (
    <a
      href={whatsappLink()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="
        fixed bottom-6 right-6 z-40
        flex items-center justify-center
        size-14 rounded-full
        bg-[#25D366] text-white
        shadow-lg hover:shadow-xl
        hover:scale-110
        transition-all duration-200
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]
        motion-safe:animate-[whatsapp-pulse_3s_ease-in-out_infinite]
      "
    >
      <WhatsAppSVG />
    </a>
  )
}

function WhatsAppSVG() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="size-7"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.09.541 4.05 1.488 5.756L.057 23.667a.5.5 0 0 0 .61.637l6.084-1.596A11.948 11.948 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.886 0-3.661-.508-5.185-1.394l-.372-.22-3.856 1.011 1.03-3.756-.242-.386A9.929 9.929 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
    </svg>
  )
}
