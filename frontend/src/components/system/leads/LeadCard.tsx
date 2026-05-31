import type { Lead } from '@/types/system/lead'
import { formatDistanceToNow } from 'date-fns'
import { Globe, Users, Camera, Play, MessageCircle, Music, CircleHelp, Phone, Pencil, Trash2 } from 'lucide-react'

/* ── Islamic 8-point star ───────────────────────── */
const STAR = 'M50,5 L57.65,31.52 L81.82,18.18 L68.48,42.35 L95,50 L68.48,57.65 L81.82,81.82 L57.65,68.48 L50,95 L42.35,68.48 L18.18,81.82 L31.52,57.65 L5,50 L31.52,42.35 L18.18,18.18 L42.35,31.52 Z'

/* ── Source badge styling ───────────────────────── */
const SOURCE_LABELS: Record<string, string> = {
  google_ads:       'Google Ads',
  facebook_ads:     'Facebook Ads',
  instagram_ads:    'Instagram',
  whatsapp_direct:  'WhatsApp Direct',
  student_referral: 'Referral',
  website_form:     'Website Form',
  manual_entry:     'Manual',
}

const SOURCE_COLORS: Record<string, { bg: string; color: string }> = {
  google_ads:       { bg: 'rgba(30,90,171,0.10)',   color: 'rgb(30 90 171)' },
  facebook_ads:     { bg: 'rgba(30,90,171,0.10)',   color: 'rgb(30 90 171)' },
  instagram_ads:    { bg: 'rgba(190,24,93,0.10)',   color: 'rgb(190 24 93)' },
  whatsapp_direct:  { bg: 'rgba(14,124,90,0.10)',   color: 'rgb(14 124 90)' },
  student_referral: { bg: 'rgba(201,162,75,0.14)',  color: 'rgb(154 113 23)' },
  website_form:     { bg: 'rgba(101,56,182,0.10)',  color: 'rgb(101 56 182)' },
  manual_entry:     { bg: 'rgba(90,100,112,0.10)',  color: 'rgb(90 100 112)' },
}

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  website:   Globe,
  facebook:  Users,
  instagram: Camera,
  youtube:   Play,
  whatsapp:  MessageCircle,
  tiktok:    Music,
  other:     CircleHelp,
}

const PLATFORM_COLORS: Record<string, string> = {
  website:   'rgb(30 90 171)',
  facebook:  'rgb(30 90 171)',
  instagram: 'rgb(190 24 93)',
  youtube:   'rgb(220 40 40)',
  whatsapp:  'rgb(14 124 90)',
  tiktok:    'rgb(11 31 58)',
  other:     'rgb(90 100 112)',
}

const AVATAR_PALETTES = [
  { bg: 'rgba(30,90,171,0.14)',  color: 'rgb(30 90 171)' },
  { bg: 'rgba(14,124,90,0.14)', color: 'rgb(14 124 90)' },
  { bg: 'rgba(101,56,182,0.14)',color: 'rgb(101 56 182)' },
  { bg: 'rgba(190,24,93,0.12)', color: 'rgb(190 24 93)' },
  { bg: 'rgba(154,113,23,0.14)',color: 'rgb(154 113 23)' },
]

function avatarStyle(name: string) {
  return AVATAR_PALETTES[name.charCodeAt(0) % AVATAR_PALETTES.length]
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

interface LeadCardProps {
  lead: Lead
  dragging?: boolean
  onClick?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function LeadCard({ lead, dragging, onClick, onEdit, onDelete }: LeadCardProps) {
  const av           = avatarStyle(lead.name)
  const srcStyle     = SOURCE_COLORS[lead.source ?? ''] ?? SOURCE_COLORS.manual_entry
  const srcLabel     = SOURCE_LABELS[lead.source ?? ''] ?? lead.source ?? 'Manual'
  const PlatformIcon = lead.platform ? (PLATFORM_ICONS[lead.platform] ?? Globe) : null
  const platformColor = lead.platform ? (PLATFORM_COLORS[lead.platform] ?? 'rgb(90 100 112)') : 'rgb(90 100 112)'
  const platformLabel = lead.platform
    ? lead.platform.charAt(0).toUpperCase() + lead.platform.slice(1)
    : null

  const payloadPhones = (lead.payload as Record<string, unknown> | null)?.phones as Array<{ value: string }> | undefined
  const displayPhone  = lead.phone || payloadPhones?.[0]?.value || null

  return (
    <div
      onClick={onClick}
      className="group relative rounded-xl border overflow-hidden transition-all hover:shadow-md cursor-pointer select-none"
      style={{
        background: '#fff',
        borderColor: 'rgb(229 233 240)',
        boxShadow: '0 1px 3px rgba(11,31,58,0.05)',
        opacity: dragging ? 0.35 : 1,
        transform: dragging ? 'scale(0.97)' : undefined,
      }}
    >
      {/* Gold top accent line */}
      <div style={{ height: 1.5, background: 'linear-gradient(90deg, transparent 0%, #C9A24B44 50%, transparent 100%)' }} />

      {/* Corner star watermark */}
      <svg
        className="absolute bottom-1.5 right-1.5 pointer-events-none select-none"
        width="14" height="14" viewBox="0 0 100 100" aria-hidden
      >
        <path d={STAR} fill="#C9A24B" opacity="0.07" />
      </svg>

      {/* Hover action buttons */}
      <div className="absolute top-2 right-2 z-10 hidden group-hover:flex items-center gap-0.5">
        {onEdit && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onEdit() }}
            title="Edit lead"
            className="p-1.5 rounded-lg transition-all hover:scale-110"
            style={{ background: 'rgba(11,31,58,0.07)', color: 'rgb(30 90 171)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(30,90,171,0.15)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(11,31,58,0.07)' }}
          >
            <Pencil size={11} />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onDelete() }}
            title="Delete lead"
            className="p-1.5 rounded-lg transition-all hover:scale-110"
            style={{ background: 'rgba(11,31,58,0.07)', color: 'rgb(90 100 112)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(192,57,43,0.15)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgb(192 57 43)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(11,31,58,0.07)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgb(90 100 112)' }}
          >
            <Trash2 size={11} />
          </button>
        )}
      </div>

      <div className="p-3">
        {/* Name + avatar */}
        <div className="flex items-center gap-2 mb-2 pr-12">
          <div
            className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
            style={{ background: av.bg, color: av.color }}
          >
            {initials(lead.name)}
          </div>
          <p className="text-[13px] font-semibold truncate leading-tight" style={{ color: '#0B1F3A' }}>
            {lead.name}
          </p>
        </div>

        {/* Platform */}
        {PlatformIcon && platformLabel && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <PlatformIcon size={11} style={{ color: platformColor, flexShrink: 0 }} />
            <span className="text-[11px]" style={{ color: 'rgb(90 100 112)' }}>{platformLabel}</span>
          </div>
        )}

        {/* Phone */}
        {displayPhone && (
          <div className="flex items-center gap-1.5 mb-2">
            <Phone size={10} className="shrink-0" style={{ color: 'rgb(90 100 112)', opacity: 0.6 }} />
            <span className="text-[11px] tabular-nums" style={{ color: 'rgb(90 100 112)' }}>
              {String(displayPhone)}
            </span>
          </div>
        )}

        {/* Footer: source badge + added by / time */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {lead.source && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
              style={srcStyle}
            >
              {srcLabel}
            </span>
          )}
          {lead.supervisor_name ? (
            <span className="text-[10px] truncate ml-auto" style={{ color: 'rgb(90 100 112)' }}>
              Added by: <span style={{ color: '#0B1F3A', fontWeight: 500 }}>{lead.supervisor_name}</span>
            </span>
          ) : (
            <span className="text-[10px] ml-auto whitespace-nowrap" style={{ color: 'rgb(203 211 222)' }}>
              {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
