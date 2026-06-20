'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useLeadAnalytics } from '@/hooks/system/useLeads'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend,
} from 'recharts'
import {
  Users, UserPlus, TrendingUp, Target,
  RefreshCw, ArrowLeft, Search, ChevronDown, Globe, BarChart2,
} from 'lucide-react'
import { useI18n } from '@/lib/system/i18n'

const STATUS_LABEL_KEYS: Record<string, string> = {
  closed:              'leads.statusClosed',
  waiting_for_trial:   'leads.statusWaitingForTrial',
  waiting_for_payment: 'leads.statusWaitingForPayment',
  lost:                'leads.statusLost',
  interested:          'leads.statusInterested',
  new_lead:            'leads.statusNewLead',
  not_interested:      'leads.statusNotInterested',
}

/* ─────────────── helpers ─────────────── */
const STAR_PATH = 'M50,5 L57.65,31.52 L81.82,18.18 L68.48,42.35 L95,50 L68.48,57.65 L81.82,81.82 L57.65,68.48 L50,95 L42.35,68.48 L18.18,81.82 L31.52,57.65 L5,50 L31.52,42.35 L18.18,18.18 L42.35,31.52 Z'

function KhatamStar({ size = 18, color = '#C9A24B', opacity = 1 }: { size?: number; color?: string; opacity?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ opacity }}>
      <path d={STAR_PATH} fill={color} />
    </svg>
  )
}

function GoldDivider() {
  return (
    <div className="flex items-center gap-0" style={{ height: 2 }}>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, #C9A24B88)' }} />
      <div style={{ width: 6, height: 6, background: '#C9A24B', transform: 'rotate(45deg)', margin: '0 4px', opacity: 0.7 }} />
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, #C9A24B88, transparent)' }} />
    </div>
  )
}

/* ─────────────── Status colours ─────────────── */
const STATUS_COLOR: Record<string, string> = {
  closed:              '#0E7C5A',
  waiting_for_trial:   '#B47800',
  waiting_for_payment: '#BE185D',
  lost:                '#C0392B',
  interested:          '#10b981',
  new_lead:            '#1E5AAB',
  not_interested:      '#64748b',
}

/* ─────────────── Chart card wrapper ─────────────── */
function Card({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        {icon && <span className="text-[#0E7C5A]">{icon}</span>}
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </div>
      {children}
    </div>
  )
}

/* ─────────────── KPI card ─────────────── */
function KpiCard({
  label, value, sub, icon, loading,
}: { label: string; value: string | number; sub?: string; icon: React.ReactNode; loading?: boolean }) {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(14,124,90,0.08)' }}>
        <span className="text-[#0E7C5A]">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">{label}</p>
        {loading
          ? <div className="h-8 w-20 rounded-lg bg-gray-100 animate-pulse" />
          : <p className="text-3xl font-bold text-gray-900 tabular-nums leading-none">{value}</p>
        }
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

/* ─────────────── Filter bar ─────────────── */
const STATUS_OPTIONS = [
  { value: '', key: 'leads.filterAllStatuses' },
  { value: 'new_lead', key: 'leads.statusNewLead' },
  { value: 'interested', key: 'leads.statusInterested' },
  { value: 'waiting_for_trial', key: 'leads.statusWaitingForTrial' },
  { value: 'waiting_for_payment', key: 'leads.statusWaitingForPayment' },
  { value: 'closed', key: 'leads.statusClosed' },
  { value: 'not_interested', key: 'leads.statusNotInterested' },
  { value: 'lost', key: 'leads.statusLost' },
]
const SOURCE_OPTIONS = [
  { value: '', key: 'leads.filterAllSources' },
  { value: 'google_ads', key: 'leads.sourceGoogleAds' },
  { value: 'facebook_ads', key: 'leads.sourceFacebookAds' },
  { value: 'instagram_ads', key: 'leads.sourceInstagramShort' },
  { value: 'whatsapp_direct', key: 'leads.platformWhatsapp' },
  { value: 'student_referral', key: 'leads.sourceStudentReferral' },
  { value: 'teacher_referral', key: 'leads.sourceTeacherReferral' },
  { value: 'website_form', key: 'leads.sourceWebsiteForm' },
  { value: 'superprof', key: 'leads.sourceSuperprof' },
  { value: 'leboncoin', key: 'leads.sourceLeboncoin' },
  { value: 'walk_in', key: 'leads.sourceWalkIn' },
  { value: 'other', key: 'leads.sourceOther' },
]
const PRIORITY_OPTIONS = [
  { value: '', key: 'leads.filterAllPriorities' },
  { value: 'high', key: 'leads.priorityHigh' },
  { value: 'medium', key: 'leads.priorityMedium' },
  { value: 'low', key: 'leads.priorityLow' },
]

function NativeSelect({ value, onChange, options, className = '' }: {
  value: string; onChange: (v: string) => void
  options: { value: string; key: string }[]; className?: string
}) {
  const { t } = useI18n()
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full h-9 pl-3 pr-8 rounded-lg text-sm border border-gray-200 bg-white text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#0E7C5A]/30 cursor-pointer"
      >
        {options.map(o => <option key={o.value} value={o.value}>{t(o.key)}</option>)}
      </select>
      <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  )
}

/* ─────────────── Donut center label ─────────────── */
function DonutCenter({ total }: { total: number }) {
  const { t } = useI18n()
  return (
    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
      <tspan x="50%" dy="-0.4em" fontSize="22" fontWeight="700" fill="#111827">{total.toLocaleString()}</tspan>
      <tspan x="50%" dy="1.3em" fontSize="10" fill="#9ca3af">{t('leads.totalLeadsCaps')}</tspan>
    </text>
  )
}

/* ─────────────── Date presets ─────────────── */
const PRESETS: Record<string, { labelKey: string; from: string; to: string }> = {
  '30d':  { labelKey: 'leads.preset30d',  from: new Date(Date.now() - 30  * 86400000).toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) },
  '90d':  { labelKey: 'leads.preset90d',  from: new Date(Date.now() - 90  * 86400000).toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) },
  '180d': { labelKey: 'leads.preset180d', from: new Date(Date.now() - 180 * 86400000).toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) },
  '1y':   { labelKey: 'leads.preset1y',   from: new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) },
}

/* ─────────────── Tab button ─────────────── */
function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
      style={active
        ? { background: '#0E7C5A', color: '#fff' }
        : { color: '#6b7280' }
      }
    >
      {children}
    </button>
  )
}

/* ─────────────── Tabs ─────────────── */
type Tab = 'overview' | 'by_source' | 'performance' | 'demographics'

/* ═══════════════ Page ═══════════════ */
export default function LeadStatisticsPage() {
  const { t } = useI18n()
  const router = useRouter()
  const qc = useQueryClient()

  const [preset, setPreset] = useState('30d')
  const [tab, setTab] = useState<Tab>('overview')
  const [fromCustom, setFromCustom] = useState('')
  const [toCustom, setToCustom] = useState('')

  const from = fromCustom || PRESETS[preset].from
  const to   = toCustom   || PRESETS[preset].to

  const { data, isLoading, isFetching } = useLeadAnalytics(from, to)

  /* ── donut data ── */
  const donutData = data
    ? Object.entries(data.by_status)
        .map(([status, total]) => ({ name: STATUS_LABEL_KEYS[status] ? t(STATUS_LABEL_KEYS[status]) : status, value: total, status, color: STATUS_COLOR[status] ?? '#9ca3af' }))
        .sort((a, b) => b.value - a.value)
    : []

  /* ── funnel bar data ── */
  const funnelData = data
    ? Object.entries(data.by_status)
        .map(([status, total]) => ({ status: STATUS_LABEL_KEYS[status] ? t(STATUS_LABEL_KEYS[status]) : status, total, color: STATUS_COLOR[status] ?? '#9ca3af' }))
        .sort((a, b) => b.total - a.total)
    : []

  /* ── source bar data ── */
  const sourceData = data
    ? [...data.by_source]
        .sort((a, b) => b.total - a.total)
        .map(s => ({ source: s.source.replace(/_/g, ' '), total: s.total }))
    : []

  /* ── supervisor bar data ── */
  const supervisorData = data
    ? [...data.by_supervisor]
        .sort((a, b) => b.enrolled_count - a.enrolled_count)
        .map(s => ({
          name: s.supervisor?.name ?? `#${s.assigned_supervisor_id}`,
          total: s.total,
          enrolled: s.enrolled_count,
          rate: s.total > 0 ? Math.round((s.enrolled_count / s.total) * 100) : 0,
        }))
    : []

  /* ── country bar data ── */
  const countryData = data ? [...data.by_country].slice(0, 10) : []

  /* ── gender data ── */
  const genderData = data
    ? Object.entries(data.by_gender).map(([gender, total]) => ({ name: gender ?? 'unknown', value: total }))
    : []

  return (
    <div className="min-w-0">
      {/* ── Dark header ── */}
      <div
        className="rounded-2xl mb-5 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0d2548 0%, #0B1F3A 60%, #071528 100%)',
          boxShadow: '0 4px 24px rgb(11 31 58 / 0.18)',
        }}
      >
        <div style={{ height: 2, background: 'linear-gradient(90deg, transparent 0%, #C9A24B 30%, #C9A24B 70%, transparent 100%)' }} />
        <div className="relative px-5 py-4 overflow-hidden">
          <svg className="absolute right-0 top-0 pointer-events-none select-none" width="220" height="90" aria-hidden>
            <g transform="translate(140, -20) scale(1.8)" opacity="0.04"><path d={STAR_PATH} fill="#C9A24B" /></g>
            <g transform="translate(60, 30) scale(1.1)" opacity="0.03"><path d={STAR_PATH} fill="#C9A24B" /></g>
          </svg>
          <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden>
            <pattern id="stat-dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.8" fill="#C9A24B" opacity="0.08" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#stat-dots)" />
          </svg>

          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <KhatamStar size={22} color="#C9A24B" opacity={0.9} />
              <div>
                <h1 className="text-2xl font-bold text-white leading-none" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: '-0.01em' }}>
                  {t('leads.crmTitle')}
                </h1>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(201,162,75,0.7)' }}>{t('leads.statisticsAnalytics')}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => qc.invalidateQueries({ queryKey: ['system', 'leads', 'analytics'] })}
                disabled={isFetching}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
                {t('leads.refresh')}
              </button>

              <button
                onClick={() => router.push('/leads')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: 'rgba(201,162,75,0.15)', color: 'rgba(201,162,75,0.9)', border: '1px solid rgba(201,162,75,0.25)' }}
              >
                <ArrowLeft size={12} />
                {t('leads.backToCrm')}
              </button>
            </div>
          </div>
        </div>
        <GoldDivider />
      </div>

      {/* ── Filters ── */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 mb-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">{t('leads.filtersTitle')}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              readOnly
              placeholder={t('leads.searchPlaceholder')}
              className="w-full h-9 pl-8 pr-3 rounded-lg text-sm border border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
            />
          </div>
          <NativeSelect value="" onChange={() => {}} options={STATUS_OPTIONS} />
          <NativeSelect value="" onChange={() => {}} options={[{ value: '', key: 'leads.filterAllPlatforms' }]} />
          <NativeSelect value="" onChange={() => {}} options={SOURCE_OPTIONS} />
          <NativeSelect value="" onChange={() => {}} options={PRIORITY_OPTIONS} />
          <NativeSelect value="" onChange={() => {}} options={[{ value: '', key: 'leads.filterAllAssignees' }]} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
          <NativeSelect value="" onChange={() => {}} options={[{ value: '', key: 'leads.filterAllPackages' }]} />
          <NativeSelect
            value={preset}
            onChange={v => { setPreset(v); setFromCustom(''); setToCustom('') }}
            options={Object.entries(PRESETS).map(([k, p]) => ({ value: k, key: p.labelKey }))}
          />
          <div className="relative">
            <input
              type="date"
              value={fromCustom}
              onChange={e => { setFromCustom(e.target.value); setPreset('') }}
              className="w-full h-9 pl-3 pr-3 rounded-lg text-sm border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0E7C5A]/30"
            />
          </div>
          <div className="relative">
            <input
              type="date"
              value={toCustom}
              onChange={e => { setToCustom(e.target.value); setPreset('') }}
              className="w-full h-9 pl-3 pr-3 rounded-lg text-sm border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0E7C5A]/30"
            />
          </div>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <KpiCard label={t('leads.kpiTotalLeads')} value={data?.summary.total.toLocaleString() ?? '—'} sub={t('leads.kpiInDatabase')} icon={<Users size={18} />} loading={isLoading} />
        <KpiCard label={t('leads.kpiNewThisMonth')} value={data?.summary.new_this_month.toLocaleString() ?? '—'} sub={t('leads.kpiThisWeek', { count: String(data?.summary.new_this_week ?? 0) })} icon={<UserPlus size={18} />} loading={isLoading} />
        <KpiCard label={t('leads.kpiConversionRate')} value={data ? `${data.summary.conversion_rate}%` : '—'} sub={t('leads.kpiLeadsClosed')} icon={<TrendingUp size={18} />} loading={isLoading} />
        <KpiCard label={t('leads.kpiClosedDeals')} value={data?.summary.closed.toLocaleString() ?? '—'} sub={t('leads.kpiSuccessfulConversions')} icon={<Target size={18} />} loading={isLoading} />
      </div>

      {/* ── Tab navigation ── */}
      <div className="flex items-center gap-1 mb-5 bg-white border border-gray-100 rounded-xl p-1 shadow-sm w-fit">
        <TabBtn active={tab === 'overview'}     onClick={() => setTab('overview')}>     <BarChart2 size={14} />{t('leads.tabOverview')}</TabBtn>
        <TabBtn active={tab === 'by_source'}    onClick={() => setTab('by_source')}>    <Globe size={14} />{t('leads.tabBySource')}</TabBtn>
        <TabBtn active={tab === 'performance'}  onClick={() => setTab('performance')}>  <TrendingUp size={14} />{t('leads.tabPerformance')}</TabBtn>
        <TabBtn active={tab === 'demographics'} onClick={() => setTab('demographics')}> <Users size={14} />{t('leads.tabDemographics')}</TabBtn>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="rounded-2xl bg-white border border-gray-100 h-72 animate-pulse" />)}
        </div>
      )}

      {data && tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Leads over time */}
            <Card title={`${t('leads.cardLeadsOverTime')} — ${PRESETS[preset]?.labelKey ? t(PRESETS[preset].labelKey) : t('leads.customRange')}`} icon={<BarChart2 size={15} />}>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={data.trend_daily} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="grad-leads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#0E7C5A" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#0E7C5A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Area type="monotone" dataKey="leads_count" stroke="#0E7C5A" fill="url(#grad-leads)" strokeWidth={2} name={t('leads.chartLeadsName')} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            {/* Status distribution donut */}
            <Card title={t('leads.cardStatusDistribution')} icon={<Target size={15} />}>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={68}
                    outerRadius={95}
                    paddingAngle={2}
                    dataKey="value"
                    labelLine={false}
                  >
                    {donutData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <DonutCenter total={data.summary.total} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2">
                {donutData.map(d => (
                  <div key={d.status} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                    {d.name} <span className="font-semibold text-gray-800">{d.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Conversion funnel (status bar chart) */}
            <Card title={t('leads.cardConversionFunnel')} icon={<TrendingUp size={15} />}>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={funnelData} margin={{ top: 4, right: 4, bottom: 24, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="status" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} angle={-20} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={48}>
                    {funnelData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* By source */}
            <Card title={t('leads.tabBySource')} icon={<Globe size={15} />}>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={sourceData} layout="vertical" margin={{ top: 4, right: 4, bottom: 0, left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="source" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={60} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="total" fill="#0E7C5A" radius={[0, 4, 4, 0]} maxBarSize={18} name={t('leads.chartLeadsName')} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card title={t('leads.cardRecentActivity')} icon={<Users size={15} />}>
            {data.recent_activity.length === 0
              ? <p className="text-sm text-gray-400 py-4 text-center">{t('leads.noRecentActivity')}</p>
              : (
                <div className="divide-y divide-gray-50">
                  {data.recent_activity.map(a => (
                    <div key={a.id} className="flex items-start justify-between gap-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{a.subject_name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {(a.event ?? 'updated').replace(/_/g, ' ').toUpperCase()}
                          {a.causer_name && <span className="text-gray-500"> · {a.causer_name}</span>}
                        </p>
                      </div>
                      <time className="text-xs text-gray-400 shrink-0 mt-0.5">
                        {new Date(a.created_at).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
                      </time>
                    </div>
                  ))}
                </div>
              )
            }
          </Card>
        </div>
      )}

      {data && tab === 'by_source' && (
        <div className="space-y-4">
          <Card title={t('leads.cardLeadsBySource')} icon={<Globe size={15} />}>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={sourceData} layout="vertical" margin={{ top: 4, right: 32, bottom: 0, left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="source" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={80} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="total" fill="#0E7C5A" radius={[0, 4, 4, 0]} maxBarSize={22} name={t('leads.chartLeadsName')} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card title={t('leads.cardConversionBySource')} icon={<TrendingUp size={15} />}>
            <div className="divide-y divide-gray-50">
              <div className="grid grid-cols-4 gap-4 pb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                <span>{t('leads.fieldSource')}</span><span className="text-right">{t('leads.colLeads')}</span><span className="text-right">{t('status.enrolled')}</span><span className="text-right">{t('leads.colRate')}</span>
              </div>
              {data.by_source
                .sort((a, b) => b.total - a.total)
                .map(s => {
                  const rate = s.total > 0 ? Math.round((s.enrolled_count / s.total) * 100) : 0
                  return (
                    <div key={s.source} className="grid grid-cols-4 gap-4 py-2.5 text-sm">
                      <span className="capitalize text-gray-700">{s.source.replace(/_/g, ' ')}</span>
                      <span className="text-right text-gray-900 font-medium">{s.total}</span>
                      <span className="text-right text-gray-900 font-medium">{s.enrolled_count}</span>
                      <span className="text-right font-semibold" style={{ color: rate >= 50 ? '#0E7C5A' : rate >= 25 ? '#B47800' : '#C0392B' }}>{rate}%</span>
                    </div>
                  )
                })}
            </div>
          </Card>
        </div>
      )}

      {data && tab === 'performance' && (
        <div className="space-y-4">
          <Card title={t('leads.cardPerformanceBySupervisor')} icon={<Users size={15} />}>
            {supervisorData.length === 0
              ? <p className="text-sm text-gray-400 py-4 text-center">{t('leads.noSupervisorData')}</p>
              : (
                <>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={supervisorData} margin={{ top: 4, right: 4, bottom: 24, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} angle={-20} textAnchor="end" />
                      <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Bar dataKey="total" fill="#1E5AAB" radius={[4, 4, 0, 0]} maxBarSize={36} name={t('leads.chartTotalLeadsName')} />
                      <Bar dataKey="enrolled" fill="#0E7C5A" radius={[4, 4, 0, 0]} maxBarSize={36} name={t('status.enrolled')} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="divide-y divide-gray-50 mt-2">
                    <div className="grid grid-cols-4 gap-4 pb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      <span>{t('leads.columnSupervisor')}</span><span className="text-right">{t('leads.colLeads')}</span><span className="text-right">{t('status.enrolled')}</span><span className="text-right">{t('leads.colRate')}</span>
                    </div>
                    {supervisorData.map(s => (
                      <div key={s.name} className="grid grid-cols-4 gap-4 py-2.5 text-sm">
                        <span className="text-gray-700">{s.name}</span>
                        <span className="text-right text-gray-900 font-medium">{s.total}</span>
                        <span className="text-right text-gray-900 font-medium">{s.enrolled}</span>
                        <span className="text-right font-semibold" style={{ color: s.rate >= 50 ? '#0E7C5A' : s.rate >= 25 ? '#B47800' : '#C0392B' }}>{s.rate}%</span>
                      </div>
                    ))}
                  </div>
                </>
              )
            }
          </Card>
        </div>
      )}

      {data && tab === 'demographics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title={t('leads.cardByCountry')} icon={<Globe size={15} />}>
            {countryData.length === 0
              ? <p className="text-sm text-gray-400 py-4 text-center">{t('leads.noCountryData')}</p>
              : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={countryData} layout="vertical" margin={{ top: 4, right: 32, bottom: 0, left: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="country" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={60} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Bar dataKey="total" fill="#1E5AAB" radius={[0, 4, 4, 0]} maxBarSize={18} name={t('leads.chartLeadsName')} />
                  </BarChart>
                </ResponsiveContainer>
              )
            }
          </Card>

          <Card title={t('leads.cardByGender')} icon={<Users size={15} />}>
            {genderData.length === 0
              ? <p className="text-sm text-gray-400 py-4 text-center">{t('leads.noGenderData')}</p>
              : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={genderData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={false}>
                      {genderData.map((_, i) => (
                        <Cell key={i} fill={['#0E7C5A', '#1E5AAB', '#B47800', '#9ca3af'][i % 4]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              )
            }
          </Card>
        </div>
      )}
    </div>
  )
}
