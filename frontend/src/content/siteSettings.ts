import { siteConfig } from '@/config/site'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8001'

export type SiteContact = {
  email: string
  phone: string
  whatsapp: string
  address: string
}

export type SiteSocial = {
  facebook: string
  instagram: string
  youtube: string
  twitter: string
  tiktok: string
  telegram: string
}

export type SiteSettings = { contact: SiteContact; social: SiteSocial }

/** Static fallback so the site still renders if the API is unreachable. */
const FALLBACK: SiteSettings = {
  contact: {
    email: siteConfig.email,
    phone: siteConfig.phone,
    whatsapp: siteConfig.whatsapp,
    address: siteConfig.address,
  },
  social: {
    facebook: siteConfig.social.facebook,
    instagram: siteConfig.social.instagram,
    youtube: siteConfig.social.youtube,
    twitter: siteConfig.social.twitter,
    tiktok: '',
    telegram: '',
  },
}

function merge<T extends Record<string, string>>(fallback: T, data: Partial<T> | undefined): T {
  const out = { ...fallback }
  if (data) {
    for (const k of Object.keys(out) as (keyof T)[]) {
      const v = data[k]
      if (typeof v === 'string' && v.trim()) out[k] = v as T[keyof T]
    }
  }
  return out
}

export async function fetchSiteSettings(): Promise<SiteSettings> {
  try {
    const res = await fetch(`${API}/api/v1/site-settings`, { cache: 'no-store' })
    if (!res.ok) return FALLBACK
    const json = await res.json()
    return {
      contact: merge(FALLBACK.contact, json.data?.contact),
      social: merge(FALLBACK.social, json.data?.social),
    }
  } catch {
    return FALLBACK
  }
}

/** Build a wa.me link from the managed WhatsApp number. */
export function waLink(whatsapp: string, message?: string): string {
  const text = message ?? siteConfig.whatsappDefaultMessage
  return `https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`
}
