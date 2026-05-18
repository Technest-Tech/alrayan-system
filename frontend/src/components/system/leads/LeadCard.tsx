import type { Lead } from '@/types/system/lead'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Clock, MessageCircle, Phone, Mail } from 'lucide-react'

const SOURCE_LABELS: Record<string, string> = {
  google_ads:       'Google Ads',
  facebook_ads:     'Facebook Ads',
  instagram_ads:    'Instagram',
  whatsapp_direct:  'WhatsApp',
  student_referral: 'Referral',
  website_form:     'Website',
  manual_entry:     'Manual',
}

const SOURCE_COLORS: Record<string, { bg: string; color: string }> = {
  google_ads:       { bg: 'rgb(30 90 171 / 0.1)',   color: 'rgb(30 90 171)' },
  facebook_ads:     { bg: 'rgb(30 90 171 / 0.1)',   color: 'rgb(30 90 171)' },
  instagram_ads:    { bg: 'rgb(190 24 93 / 0.1)',   color: 'rgb(190 24 93)' },
  whatsapp_direct:  { bg: 'rgb(14 124 90 / 0.1)',   color: 'rgb(14 124 90)' },
  student_referral: { bg: 'rgb(201 162 75 / 0.12)', color: 'rgb(154 113 23)' },
  website_form:     { bg: 'rgb(101 56 182 / 0.1)',  color: 'rgb(101 56 182)' },
  manual_entry:     { bg: 'rgb(90 100 112 / 0.1)',  color: 'rgb(90 100 112)' },
}

// Deterministic avatar color from name
const AVATAR_PALETTES = [
  { bg: 'rgb(30 90 171 / 0.15)',  color: 'rgb(30 90 171)' },
  { bg: 'rgb(14 124 90 / 0.15)',  color: 'rgb(14 124 90)' },
  { bg: 'rgb(101 56 182 / 0.15)', color: 'rgb(101 56 182)' },
  { bg: 'rgb(190 24 93 / 0.12)',  color: 'rgb(190 24 93)' },
  { bg: 'rgb(154 113 23 / 0.15)', color: 'rgb(154 113 23)' },
]

function avatarStyle(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_PALETTES.length
  return AVATAR_PALETTES[idx]
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function countryFlag(code: string): string {
  const offset = 0x1f1e6 - 65
  return [...code.toUpperCase()].map(c => String.fromCodePoint(c.charCodeAt(0) + offset)).join('')
}

interface LeadCardProps {
  lead: Lead
  dragging?: boolean
}

export function LeadCard({ lead, dragging }: LeadCardProps) {
  const hasDue   = (lead.pending_follow_ups_count ?? 0) > 0
  const srcStyle = SOURCE_COLORS[lead.source] ?? SOURCE_COLORS.manual_entry
  const av       = avatarStyle(lead.name)

  return (
    <Link href={`/leads/${lead.id}`} draggable={false}>
      <div
        className="rounded-xl border p-3 hover:shadow-md transition-all cursor-pointer select-none"
        style={{
          background: '#fff',
          borderColor: 'rgb(var(--border-default,229 233 240))',
          boxShadow: '0 1px 3px rgb(11 31 58 / 0.05)',
          opacity: dragging ? 0.4 : 1,
        }}
      >
        {/* Row 1: Avatar + name + due badge */}
        <div className="flex items-start gap-2.5 mb-2.5">
          <div
            className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold"
            style={{ background: av.bg, color: av.color }}
          >
            {initials(lead.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1">
              <p className="text-sm font-semibold leading-snug truncate" style={{ color: 'rgb(11 31 58)' }}>
                {lead.name}
              </p>
              {hasDue && (
                <span
                  className="shrink-0 flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgb(154 113 23 / 0.12)', color: 'rgb(154 113 23)' }}
                  title="Follow-up due"
                >
                  <Clock size={8} />
                  Due
                </span>
              )}
            </div>
            {lead.email && (
              <p className="flex items-center gap-1 text-[10px] truncate mt-0.5" style={{ color: 'rgb(90 100 112)' }}>
                <Mail size={9} className="shrink-0 opacity-60" />
                <span className="truncate opacity-70">{lead.email}</span>
              </p>
            )}
          </div>
        </div>

        {/* Row 2: Phone + WhatsApp */}
        {(lead.phone || lead.whatsapp) && (
          <div className="flex items-center justify-between mb-2.5">
            {lead.phone && (
              <p className="flex items-center gap-1 text-[11px]" style={{ color: 'rgb(90 100 112)' }}>
                <Phone size={9} className="opacity-60" />
                <span>{lead.phone}</span>
              </p>
            )}
            {lead.whatsapp && (
              <span
                className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ml-auto"
                style={{ background: 'rgb(14 124 90 / 0.1)', color: 'rgb(14 124 90)' }}
                title={lead.whatsapp}
              >
                <MessageCircle size={9} />
                WA
              </span>
            )}
          </div>
        )}

        {/* Row 3: Source badge + country flag + time */}
        <div className="flex items-center gap-1.5">
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-md shrink-0"
            style={srcStyle}
          >
            {SOURCE_LABELS[lead.source] ?? lead.source}
          </span>
          {lead.country && (
            <span className="text-sm leading-none" title={lead.country}>
              {countryFlag(lead.country)}
            </span>
          )}
          <span className="ml-auto text-[10px] whitespace-nowrap" style={{ color: 'rgb(203 211 222)' }}>
            {formatDistanceToNow(new Date(lead.updated_at), { addSuffix: true })}
          </span>
        </div>
      </div>
    </Link>
  )
}
