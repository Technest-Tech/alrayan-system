'use client'
import { useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { X, Globe, Users, Camera, Play, MessageCircle, Music, CircleHelp, Phone, Mail, Tag, Clock, CheckCircle2, PlusCircle, RefreshCw, MapPin, Package, Calendar } from 'lucide-react'
import { useLead } from '@/hooks/system/useLeads'
import type { LeadStatus, LeadPriority, LeadActivity } from '@/types/system/lead'
import { useI18n } from '@/lib/system/i18n'

const STATUS_LABEL_KEYS: Record<string, string> = {
  new_lead:            'leads.statusNewLead',
  interested:          'leads.statusInterested',
  waiting_for_trial:   'leads.statusWaitingForTrial',
  waiting_for_payment: 'leads.statusWaitingForPayment',
  closed:              'leads.statusClosed',
  not_interested:      'leads.statusNotInterested',
  lost:                'leads.statusLost',
}
const PRIORITY_LABEL_KEYS: Record<string, string> = {
  high:   'leads.priorityHigh',
  medium: 'leads.priorityMedium',
  low:    'leads.priorityLow',
}
const SOURCE_LABEL_KEYS: Record<string, string> = {
  google_ads:       'leads.sourceGoogleAds',
  facebook_ads:     'leads.sourceFacebookAds',
  instagram_ads:    'leads.sourceInstagramShort',
  whatsapp_direct:  'leads.sourceWhatsappDirect',
  student_referral: 'leads.sourceReferral',
  website_form:     'leads.sourceWebsiteForm',
  manual_entry:     'leads.sourceManual',
}
const PLATFORM_LABEL_KEYS: Record<string, string> = {
  website:   'leads.platformWebsite',
  facebook:  'leads.platformFacebook',
  instagram: 'leads.platformInstagram',
  youtube:   'leads.platformYoutube',
  whatsapp:  'leads.platformWhatsapp',
  tiktok:    'leads.platformTiktok',
  other:     'leads.platformOther',
}

/* ── Islamic star path ──────────────────────────── */
const STAR = 'M50,5 L57.65,31.52 L81.82,18.18 L68.48,42.35 L95,50 L68.48,57.65 L81.82,81.82 L57.65,68.48 L50,95 L42.35,68.48 L18.18,81.82 L31.52,57.65 L5,50 L31.52,42.35 L18.18,18.18 L42.35,31.52 Z'

/* ── Ornamental section divider ─────────────────── */
function OrnaDivider({ title }: { title: string }) {
  const diamonds = [3, 11, 19, 27, 35, 43]
  return (
    <div className="flex items-center gap-2 mb-3">
      <svg width="50" height="12" viewBox="0 0 50 12" aria-hidden className="shrink-0">
        <line x1="0" y1="6" x2="48" y2="6" stroke="#C9A24B" strokeWidth="0.6" opacity="0.4" />
        {diamonds.map(x => (
          <polygon key={x} points={`${x},2 ${x+2.5},6 ${x},10 ${x-2.5},6`} fill="#C9A24B" opacity="0.3" />
        ))}
      </svg>
      <svg width="10" height="10" viewBox="0 0 100 100" aria-hidden className="shrink-0">
        <path d={STAR} fill="#C9A24B" opacity="0.65" />
      </svg>
      <span className="whitespace-nowrap text-[10px] font-semibold tracking-[0.13em] uppercase" style={{ color: 'rgb(90 100 112)' }}>
        {title}
      </span>
      <svg width="10" height="10" viewBox="0 0 100 100" aria-hidden className="shrink-0">
        <path d={STAR} fill="#C9A24B" opacity="0.65" />
      </svg>
      <svg width="50" height="12" viewBox="0 0 50 12" style={{ transform: 'scaleX(-1)' }} aria-hidden className="shrink-0">
        <line x1="0" y1="6" x2="48" y2="6" stroke="#C9A24B" strokeWidth="0.6" opacity="0.4" />
        {diamonds.map(x => (
          <polygon key={x} points={`${x},2 ${x+2.5},6 ${x},10 ${x-2.5},6`} fill="#C9A24B" opacity="0.3" />
        ))}
      </svg>
    </div>
  )
}

/* ── Status & Priority colors ───────────────────── */
const STATUS_COLORS: Record<LeadStatus, { bg: string; color: string; border: string }> = {
  new_lead:            { bg: 'rgb(30 90 171 / 0.12)',  color: 'rgb(30 90 171)',  border: 'rgb(30 90 171 / 0.3)' },
  interested:          { bg: 'rgb(14 124 90 / 0.12)',  color: 'rgb(14 124 90)',  border: 'rgb(14 124 90 / 0.3)' },
  waiting_for_trial:   { bg: 'rgb(180 120 0 / 0.12)',  color: 'rgb(140 95 0)',   border: 'rgb(180 120 0 / 0.3)' },
  waiting_for_payment: { bg: 'rgb(220 60 40 / 0.12)',  color: 'rgb(180 40 20)',  border: 'rgb(220 60 40 / 0.3)' },
  closed:              { bg: 'rgb(14 124 90 / 0.15)',  color: 'rgb(14 124 90)',  border: 'rgb(14 124 90 / 0.35)' },
  not_interested:      { bg: 'rgb(190 24 93 / 0.12)',  color: 'rgb(190 24 93)',  border: 'rgb(190 24 93 / 0.3)' },
  lost:                { bg: 'rgb(90 100 112 / 0.12)', color: 'rgb(60 70 85)',   border: 'rgb(90 100 112 / 0.3)' },
}

const PRIORITY_COLORS: Record<LeadPriority, { bg: string; color: string }> = {
  high:   { bg: 'rgb(220 60 40 / 0.12)', color: 'rgb(180 40 20)' },
  medium: { bg: 'rgb(180 120 0 / 0.12)', color: 'rgb(140 95 0)' },
  low:    { bg: 'rgb(90 100 112 / 0.1)', color: 'rgb(90 100 112)' },
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

/* ── Avatar helpers ─────────────────────────────── */
const PALETTES = [
  { bg: 'rgba(30,90,171,0.15)',  color: 'rgb(30 90 171)' },
  { bg: 'rgba(14,124,90,0.15)',  color: 'rgb(14 124 90)' },
  { bg: 'rgba(101,56,182,0.15)', color: 'rgb(101 56 182)' },
  { bg: 'rgba(190,24,93,0.12)',  color: 'rgb(190 24 93)' },
  { bg: 'rgba(154,113,23,0.15)', color: 'rgb(154 113 23)' },
]
function avatarStyle(name: string) { return PALETTES[name.charCodeAt(0) % PALETTES.length] }
function initials(name: string) { return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() }

/* ── Detail row ─────────────────────────────────── */
function DetailRow({ icon: Icon, label, value, accent }: {
  icon: React.ElementType; label: string; value: React.ReactNode; accent?: string
}) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-2.5 border-b last:border-0" style={{ borderColor: 'rgb(229 233 240)' }}>
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: accent ? `${accent}15` : 'rgb(244 246 250)' }}
      >
        <Icon size={13} style={{ color: accent ?? 'rgb(90 100 112)' }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wide font-medium mb-0.5" style={{ color: 'rgb(90 100 112)' }}>{label}</p>
        <div className="text-sm font-medium leading-snug" style={{ color: 'rgb(11 31 58)' }}>{value}</div>
      </div>
    </div>
  )
}

/* ── Section card ───────────────────────────────── */
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: 'rgb(229 233 240)', background: '#fff', boxShadow: '0 1px 3px rgb(11 31 58 / 0.04)' }}
    >
      {/* Gold top accent */}
      <div style={{ height: 1.5, background: 'linear-gradient(90deg, transparent, #C9A24B44, transparent)' }} />
      <div className="px-4 pt-3 pb-1">
        <OrnaDivider title={title} />
      </div>
      <div className="px-4 pb-4">{children}</div>
    </div>
  )
}

/* ── Activity helpers ───────────────────────────── */
function ActivityIcon({ event }: { event: string }) {
  if (event.includes('created')) return <PlusCircle  size={13} style={{ color: 'rgb(14 124 90)' }} />
  if (event.includes('status'))  return <RefreshCw   size={13} style={{ color: 'rgb(30 90 171)' }} />
  if (event.includes('updated')) return <CheckCircle2 size={13} style={{ color: 'rgb(154 113 23)' }} />
  return <Clock size={13} style={{ color: 'rgb(90 100 112)' }} />
}

function ActivityLabel({ event, properties }: { event: string; properties: LeadActivity['properties'] }) {
  const { t } = useI18n()
  if (event.includes('created')) return <span className="font-medium">{t('leads.activityLeadCreated')}</span>
  if (event.includes('status')) {
    const attrs = (properties as Record<string, Record<string, string>>)?.attributes ?? {}
    const old   = (properties as Record<string, Record<string, unknown>>)?.old ?? {}
    const newS  = attrs?.status ?? ''
    const oldS  = (old as Record<string, string>)?.status ?? ''
    return (
      <span>
        <span className="font-medium">{t('leads.activityStatusChanged')}</span>
        {oldS && newS && (
          <span className="ml-1 text-[10px]" style={{ color: 'rgb(90 100 112)' }}>
            {STATUS_LABEL_KEYS[oldS] ? t(STATUS_LABEL_KEYS[oldS]) : oldS}
            {' → '}
            {STATUS_LABEL_KEYS[newS] ? t(STATUS_LABEL_KEYS[newS]) : newS}
          </span>
        )}
      </span>
    )
  }
  return <span className="font-medium">{event.replace(/_/g, ' ')}</span>
}

/* ── Skeleton ───────────────────────────────────── */
function SkeletonBlock({ w = 'full', h = 4 }: { w?: string; h?: number }) {
  return <div className={`w-${w} h-${h} rounded animate-pulse`} style={{ background: 'rgb(229 233 240)' }} />
}

/* ── Main panel ─────────────────────────────────── */
interface Props {
  leadId: number | null
  onClose: () => void
}

export function LeadDetailPanel({ leadId, onClose }: Props) {
  const { t } = useI18n()
  const { data: lead, isLoading } = useLead(leadId)

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    if (leadId) {
      document.addEventListener('keydown', onKey)
      return () => document.removeEventListener('keydown', onKey)
    }
  }, [leadId, onClose])

  if (!leadId) return null

  const PlatformIcon  = lead?.platform ? (PLATFORM_ICONS[lead.platform] ?? Globe) : Globe
  const statusStyle   = lead?.status   ? (STATUS_COLORS[lead.status]   ?? STATUS_COLORS.new_lead)   : STATUS_COLORS.new_lead
  const priorityStyle = lead?.priority ? (PRIORITY_COLORS[lead.priority as LeadPriority] ?? PRIORITY_COLORS.medium) : PRIORITY_COLORS.medium
  const av            = lead ? avatarStyle(lead.name) : PALETTES[0]

  const payloadPhones = (lead?.payload as Record<string, unknown> | null)?.phones as Array<{ value: string; primary: boolean }> | undefined
  const payloadEmails = (lead?.payload as Record<string, unknown> | null)?.emails as Array<{ value: string; primary: boolean }> | undefined

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-[#0B1F3A]/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md flex flex-col shadow-2xl overflow-hidden"
        style={{ background: 'rgb(244 246 250)' }}
      >
        {/* ── Dark navy header ── */}
        <div
          className="shrink-0 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0d2548 0%, #0B1F3A 65%, #071528 100%)' }}
        >
          {/* Gold top line */}
          <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, #C9A24B, transparent)' }} />

          {/* Background star watermarks */}
          <svg className="absolute right-0 top-0 pointer-events-none" width="160" height="80" aria-hidden>
            <g transform="translate(120, -12) scale(1.5)" opacity="0.05">
              <path d={STAR} fill="#C9A24B" />
            </g>
            <g transform="translate(55, 35) scale(0.8)" opacity="0.03">
              <path d={STAR} fill="#C9A24B" />
            </g>
          </svg>
          {/* Dot grid */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden>
            <pattern id="panel-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.7" fill="#C9A24B" opacity="0.07" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#panel-dots)" />
          </svg>

          <div className="relative px-5 py-4">
            <div className="flex items-start gap-3">
              {/* Avatar */}
              {isLoading ? (
                <div className="w-10 h-10 rounded-full shrink-0 animate-pulse" style={{ background: 'rgba(255,255,255,0.1)' }} />
              ) : (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ background: av.bg, color: av.color, border: '2px solid rgba(201,162,75,0.25)' }}
                >
                  {lead ? initials(lead.name) : '?'}
                </div>
              )}

              <div className="flex-1 min-w-0">
                {isLoading ? (
                  <div className="space-y-1.5">
                    <SkeletonBlock w="40" h={4} />
                    <SkeletonBlock w="24" h={3} />
                  </div>
                ) : (
                  <>
                    <h2
                      className="font-bold text-white leading-none truncate"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.1rem' }}
                    >
                      {lead?.name}
                    </h2>
                    {lead && (
                      <p className="text-xs mt-1" style={{ color: 'rgba(201,162,75,0.7)' }}>
                        {t('leads.addedPrefix')} {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                      </p>
                    )}
                  </>
                )}
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg transition-colors shrink-0"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Status / priority badges */}
            {!isLoading && lead && (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span
                  className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border"
                  style={{ ...statusStyle, borderColor: statusStyle.border }}
                >
                  {STATUS_LABEL_KEYS[lead.status] ? t(STATUS_LABEL_KEYS[lead.status]) : lead.status}
                </span>
                {lead.priority && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={priorityStyle}>
                    {PRIORITY_LABEL_KEYS[lead.priority] ? t(PRIORITY_LABEL_KEYS[lead.priority]) : lead.priority}
                  </span>
                )}
                {lead.source && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md" style={{ background: 'rgba(201,162,75,0.15)', color: 'rgba(201,162,75,0.9)' }}>
                    {SOURCE_LABEL_KEYS[lead.source] ? t(SOURCE_LABEL_KEYS[lead.source]) : lead.source}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Gold bottom accent */}
          <div style={{ height: 1.5, background: 'linear-gradient(90deg, transparent, #C9A24B66, transparent)' }} />
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: 'thin', scrollbarColor: '#C9A24B33 transparent' }}>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-xl border p-4 space-y-3" style={{ background: '#fff', borderColor: 'rgb(229 233 240)' }}>
                  <SkeletonBlock w="1/3" h={3} />
                  <SkeletonBlock w="2/3" h={3} />
                  <SkeletonBlock w="1/2" h={3} />
                </div>
              ))}
            </div>
          ) : lead ? (
            <>
              {/* Contact Details */}
              <SectionCard title={t('leads.sectionContactDetails')}>
                {lead.platform && (
                  <DetailRow
                    icon={PlatformIcon}
                    label={t('leads.fieldPlatform')}
                    value={PLATFORM_LABEL_KEYS[lead.platform] ? t(PLATFORM_LABEL_KEYS[lead.platform]) : lead.platform.charAt(0).toUpperCase() + lead.platform.slice(1)}
                    accent="rgb(30 90 171)"
                  />
                )}
                {((payloadPhones && payloadPhones.length > 0) || lead.phone) && (
                  <DetailRow
                    icon={Phone}
                    label={t('leads.fieldPhoneNumbers')}
                    accent="rgb(14 124 90)"
                    value={
                      payloadPhones && payloadPhones.length > 0 ? (
                        <div className="space-y-1">
                          {payloadPhones.map((p, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                              <span className="text-sm">{p.value}</span>
                              {p.primary && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgb(201 162 75 / 0.15)', color: 'rgb(154 113 23)' }}>
                                  {t('leads.primary')}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : lead.phone
                    }
                  />
                )}
                {((payloadEmails && payloadEmails.length > 0) || lead.email) && (
                  <DetailRow
                    icon={Mail}
                    label={t('leads.fieldEmailAddresses')}
                    accent="rgb(101 56 182)"
                    value={
                      payloadEmails && payloadEmails.length > 0 ? (
                        <div className="space-y-1">
                          {payloadEmails.map((e, i) => (
                            <div key={i} className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs truncate">{e.value}</span>
                              {e.primary && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0" style={{ background: 'rgb(201 162 75 / 0.15)', color: 'rgb(154 113 23)' }}>
                                  {t('leads.primary')}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : lead.email
                    }
                  />
                )}
                {lead.source && (
                  <DetailRow
                    icon={Tag}
                    label={t('leads.fieldSource')}
                    value={SOURCE_LABEL_KEYS[lead.source] ? t(SOURCE_LABEL_KEYS[lead.source]) : lead.source}
                    accent="rgb(154 113 23)"
                  />
                )}
                {(lead.city || lead.country) && (
                  <DetailRow
                    icon={MapPin}
                    label={t('leads.fieldLocation')}
                    value={[lead.city, lead.country].filter(Boolean).join(', ')}
                    accent="rgb(190 24 93)"
                  />
                )}
              </SectionCard>

              {/* Package Info */}
              {(lead.package_hours || lead.subscription_price) && (
                <SectionCard title={t('leads.sectionPackageBilling')}>
                  {lead.package_hours && (
                    <DetailRow
                      icon={Clock}
                      label={t('leads.fieldPackageHours')}
                      value={t('leads.hoursValue', { hours: String(lead.package_hours) })}
                      accent="rgb(30 90 171)"
                    />
                  )}
                  {lead.subscription_price && (
                    <DetailRow
                      icon={Package}
                      label={t('leads.fieldPackagePrice')}
                      value={`${lead.subscription_price} ${lead.currency ?? 'EUR'}`}
                      accent="rgb(14 124 90)"
                    />
                  )}
                  {lead.payment_method && lead.payment_method !== 'none' && (
                    <DetailRow
                      icon={Tag}
                      label={t('leads.fieldPaymentMethod')}
                      value={lead.payment_method.replace('_', ' ')}
                      accent="rgb(101 56 182)"
                    />
                  )}
                </SectionCard>
              )}

              {/* Notes */}
              {lead.notes && (
                <SectionCard title={t('common.notes')}>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgb(11 31 58)' }}>{lead.notes}</p>
                </SectionCard>
              )}

              {/* Rejection Reason */}
              {lead.rejection_reason && (
                <SectionCard title={t('leads.sectionRejectionReason')}>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgb(180 40 20)' }}>{lead.rejection_reason}</p>
                </SectionCard>
              )}

              {/* Follow-up */}
              {(lead.payload as Record<string, unknown> | null)?.next_followup && (
                <SectionCard title={t('leads.sectionFollowUp')}>
                  <DetailRow
                    icon={Calendar}
                    label={t('leads.fieldNextFollowUp')}
                    value={String((lead.payload as Record<string, unknown>).next_followup)}
                    accent="rgb(14 124 90)"
                  />
                </SectionCard>
              )}

              {/* Activity History */}
              {lead.activities && lead.activities.length > 0 && (
                <SectionCard title={t('leads.sectionActivityHistory')}>
                  <div className="space-y-0">
                    {lead.activities.map((act, i) => (
                      <div key={act.id} className="flex gap-3">
                        {/* Timeline spine */}
                        <div className="flex flex-col items-center pt-1">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                            style={{ background: 'rgb(244 246 250)', border: '1.5px solid rgb(229 233 240)' }}
                          >
                            <ActivityIcon event={act.event} />
                          </div>
                          {i < lead.activities.length - 1 && (
                            <div className="w-px flex-1 my-1" style={{ background: 'linear-gradient(180deg, #C9A24B33, transparent)', minHeight: 16 }} />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 pb-3 min-w-0 pt-0.5">
                          <p className="text-sm" style={{ color: 'rgb(11 31 58)' }}>
                            <ActivityLabel event={act.event} properties={act.properties} />
                          </p>
                          {act.description && (
                            <p className="text-xs mt-0.5" style={{ color: 'rgb(90 100 112)' }}>{act.description}</p>
                          )}
                          <div className="flex items-center gap-1.5 mt-1">
                            {act.causer_name && (
                              <span className="text-[10px] font-semibold" style={{ color: 'rgb(11 31 58)' }}>
                                {act.causer_name}
                              </span>
                            )}
                            <span className="text-[10px]" style={{ color: 'rgb(203 211 222)' }}>·</span>
                            <span className="text-[10px]" style={{ color: 'rgb(90 100 112)' }}>
                              {formatDistanceToNow(new Date(act.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              )}
            </>
          ) : null}
        </div>
      </div>
    </>
  )
}
