'use client'
import { useEffect, useState } from 'react'
import { Settings as SettingsIcon, Trophy, Users } from 'lucide-react'
import { useTeacherRace, type Racer, type RaceRange } from '@/hooks/system/useTeacherReports'
import { useI18n } from '@/lib/system/i18n'

type Mode = 'race' | 'kaaba'
type Tier = 'rocket' | 'plane' | 'car' | 'moto' | 'horse' | 'turtle'

/* ── identity + tier helpers ──────────────────────────────────────────────── */
const CAR_PALETTE = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1']
const initials = (n: string) => n.split(' ').slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('')
function colorFor(seed: number | string) {
  const s = String(seed)
  let h = 0
  for (let i = 0; i < s.length; i++) h = (s.charCodeAt(i) + ((h << 5) - h)) | 0
  return CAR_PALETTE[Math.abs(h) % CAR_PALETTE.length]
}
/** Faster rank ⇒ faster vehicle. Drives both the track and the legend. */
function tierFor(rank: number): Tier {
  if (rank === 1) return 'rocket'
  if (rank === 2) return 'plane'
  if (rank <= 5) return 'car'
  if (rank <= 9) return 'moto'
  if (rank <= 14) return 'horse'
  return 'turtle'
}
const LEGEND: { icon: string; label: string }[] = [
  { icon: '🚀', label: '#1' },
  { icon: '✈️', label: '#2' },
  { icon: '🏎️', label: '#3-5' },
  { icon: '🏍️', label: '#6-9' },
  { icon: '🐎', label: '#10-14' },
  { icon: '🐢', label: '#15+' },
]
const SCENE_H = 400

export default function TeacherRace({ currentTeacherId, month }: { currentTeacherId: number | null; month?: string }) {
  const { t } = useI18n()
  const PHRASES = [
    t('users.teacherRacePhrase1'),
    t('users.teacherRacePhrase2'),
    t('users.teacherRacePhrase3'),
    t('users.teacherRacePhrase4'),
    t('users.teacherRacePhrase5'),
  ]

  const [mode, setMode] = useState<Mode>('race')
  const [range, setRange] = useState<RaceRange>('month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [openPanel, setOpenPanel] = useState<'custom' | 'settings' | null>(null)
  const [taunts, setTaunts] = useState(true)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [mounted, setMounted] = useState(false)
  const motion = !reduceMotion

  // hydrate display prefs
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const tn = localStorage.getItem('teacherRace.taunts'); if (tn !== null) setTaunts(tn === '1')
        const rm = localStorage.getItem('teacherRace.reduceMotion'); if (rm !== null) setReduceMotion(rm === '1')
      } catch { /* ignore */ }
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])
  useEffect(() => { const timer = setTimeout(() => setMounted(true), 60); return () => clearTimeout(timer) }, [])
  const persistTaunts = (v: boolean) => { setTaunts(v); try { localStorage.setItem('teacherRace.taunts', v ? '1' : '0') } catch { /* ignore */ } }
  const persistMotion = (v: boolean) => { setReduceMotion(v); try { localStorage.setItem('teacherRace.reduceMotion', v ? '1' : '0') } catch { /* ignore */ } }

  const filter = range === 'custom'
    ? { range, from: customFrom, to: customTo }
    : range === 'all'
      ? { range }
      : { range: 'month' as const, month }
  const { data, isLoading } = useTeacherRace(filter)

  const racers = data?.racers ?? []
  const leaderHours = data?.leader_hours ?? 0
  const k = racers.length
  const trackWidth = Math.max(1000, 140 + k * 160)          // one straight line — a column per racer

  const RANGES: { key: RaceRange; label: string }[] = [
    { key: 'month', label: t('users.teacherRaceRangeMonth') },
    { key: 'all', label: t('users.teacherRaceRangeAll') },
    { key: 'custom', label: t('users.teacherRaceRangeCustom') },
  ]
  const pickRange = (key: RaceRange) => {
    if (key === 'custom') {
      setOpenPanel('custom')
      return
    }
    setRange(key)
    setOpenPanel(null)
  }
  const applyCustomRange = () => {
    if (!customFrom || !customTo || customFrom > customTo) return
    setRange('custom')
    setOpenPanel(null)
  }

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
      <StyleTag />

      {/* Header */}
      <div className="relative flex flex-col gap-3 px-5 py-3 bg-white lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: 'linear-gradient(135deg,#F59E0B,#F97316)' }}><Trophy size={18} /></span>
          <div>
            <h3 className="text-sm font-bold" style={{ color: 'rgb(11 31 58)' }}>{t('users.teacherRaceTitle')}</h3>
            <p className="text-[11px]" style={{ color: 'rgb(90 100 112)' }}>{t('users.teacherRaceSubtitle')}</p>
          </div>
          <span className="ml-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: 'rgb(245 247 250)', color: 'rgb(90 100 112)' }}>
            <Users size={12} /> {k} {t('users.teacherRaceCount')}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* mode toggle */}
          <div className="inline-flex rounded-full p-0.5 text-xs font-semibold" style={{ background: 'rgb(15 23 42)' }}>
            <button type="button" aria-pressed={mode === 'race'} onClick={() => setMode('race')} className="px-3 py-1.5 rounded-full transition-colors" style={mode === 'race' ? { background: '#fff', color: 'rgb(11 31 58)' } : { color: 'rgba(255,255,255,.7)' }}>
              🏁 {t('users.teacherRaceModeTrack')}
            </button>
            <button type="button" aria-pressed={mode === 'kaaba'} onClick={() => setMode('kaaba')} className="px-3 py-1.5 rounded-full transition-colors" style={mode === 'kaaba' ? { background: '#fff', color: 'rgb(11 31 58)' } : { color: 'rgba(255,255,255,.7)' }}>
              🕋 {t('users.teacherRaceModeKaaba')}
            </button>
          </div>

          {/* time-range tabs */}
          <div className="inline-flex rounded-full p-0.5 text-xs font-semibold" style={{ background: 'rgb(241 245 249)' }}>
            {RANGES.map((rg) => (
              <button type="button" aria-pressed={range === rg.key} key={rg.key} onClick={() => pickRange(rg.key)} className="px-3 py-1.5 rounded-full transition-colors"
                style={range === rg.key ? { background: '#fff', color: 'rgb(11 31 58)', boxShadow: '0 1px 2px rgba(0,0,0,.12)' } : { color: 'rgb(90 100 112)' }}>
                {rg.label}
              </button>
            ))}
          </div>

          {/* settings */}
          <button type="button" aria-expanded={openPanel === 'settings'} onClick={() => setOpenPanel((p) => (p === 'settings' ? null : 'settings'))}
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors"
            style={{ borderColor: 'rgb(226 232 240)', color: 'rgb(71 85 105)', background: openPanel === 'settings' ? 'rgb(241 245 249)' : '#fff' }}>
            <SettingsIcon size={13} /> {t('users.teacherRaceSettings')}
          </button>
        </div>

        {/* popovers */}
        {openPanel && <button type="button" aria-label={t('users.teacherRaceClosePanel')} className="fixed inset-0 z-40 cursor-default" onClick={() => setOpenPanel(null)} />}
        {openPanel === 'custom' && (
          <div className="absolute right-5 top-[calc(100%-4px)] z-50 w-64 rounded-xl border bg-white p-3 shadow-xl" style={{ borderColor: 'rgb(226 232 240)' }}>
            <div className="space-y-2">
              <label className="block text-[11px] font-semibold" style={{ color: 'rgb(90 100 112)' }}>{t('users.teacherRaceFrom')}
                <input type="date" value={customFrom} max={customTo || undefined} onChange={(e) => setCustomFrom(e.target.value)} className="mt-1 w-full rounded-lg border px-2 py-1.5 text-xs" style={{ borderColor: 'rgb(226 232 240)' }} />
              </label>
              <label className="block text-[11px] font-semibold" style={{ color: 'rgb(90 100 112)' }}>{t('users.teacherRaceTo')}
                <input type="date" value={customTo} min={customFrom || undefined} onChange={(e) => setCustomTo(e.target.value)} className="mt-1 w-full rounded-lg border px-2 py-1.5 text-xs" style={{ borderColor: 'rgb(226 232 240)' }} />
              </label>
              <button type="button" onClick={applyCustomRange} disabled={!customFrom || !customTo || customFrom > customTo}
                className="w-full rounded-lg py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                style={{ background: 'rgb(14 124 90)' }}>{t('users.teacherRaceApply')}</button>
            </div>
          </div>
        )}
        {openPanel === 'settings' && (
          <div className="absolute right-5 top-[calc(100%-4px)] z-50 w-56 rounded-xl border bg-white p-3 shadow-xl" style={{ borderColor: 'rgb(226 232 240)' }}>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wide" style={{ color: 'rgb(90 100 112)' }}>{t('users.teacherRaceDisplay')}</p>
            <ToggleRow label={t('users.teacherRaceTaunts')} checked={taunts} onChange={persistTaunts} />
            <ToggleRow label={t('users.teacherRaceMotion')} checked={reduceMotion} onChange={persistMotion} />
          </div>
        )}
      </div>

      {/* Scene */}
      <div className="w-full overflow-x-auto" style={{ scrollbarColor: '#f5d77a #f8fafc' }}>
        <div className="relative" style={{ height: SCENE_H, width: trackWidth, minWidth: '100%' }}>
          {mode === 'race' ? <RaceScene finishLabel={t('users.teacherRaceFinish')} motion={motion} /> : <KaabaScene motion={motion} />}

        {/* Racers overlay */}
        {!isLoading && racers.map((r, i) => {
          // everyone races on a single line — evenly spaced by rank, leader at the finish
          const pos = k > 1 ? 1 - i / (k - 1) : 1                        // 1 = leader (right) … 0 = last (left)
          const target = 6 + pos * 88                                   // %
          const left = motion ? (mounted ? target : 6) : target        // slide out from the start line
          const top = 70                                                // single shared track line
          const scale = 1
          const isYou = r.teacher_id === currentTeacherId
          const z = (k - i) + (isYou ? 5000 : 0)
          const tier = mode === 'race' ? tierFor(r.rank) : 'camel'
          return (
            <RacerNode key={r.teacher_id} racer={r} tier={tier} left={left} top={top} scale={scale} z={z} isYou={isYou}
              motion={motion} taunts={taunts} slide={motion} phrases={PHRASES} youLabel={t('users.teacherRaceYou')} />
          )
        })}

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center text-sm" style={{ color: 'rgba(255,255,255,.85)' }}>{t('users.teacherRaceLoading')}</div>
        )}
        {!isLoading && racers.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-sm" style={{ color: 'rgba(255,255,255,.85)' }}>{t('users.teacherRaceEmpty')}</div>
        )}
        </div>
      </div>

      {/* Rank-tier legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-3 bg-white">
        <span className="text-[11px] font-semibold" style={{ color: 'rgb(90 100 112)' }}>{t('users.teacherRaceLegend')}:</span>
        {LEGEND.map((tier) => (
          <span key={tier.label} className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: 'rgb(11 31 58)' }}>
            <span className="text-sm leading-none">{tier.icon}</span> {tier.label}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ── toggle row for the settings popover ──────────────────────────────────── */
function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex w-full items-center justify-between py-1.5 text-xs font-semibold" style={{ color: 'rgb(30 41 59)' }}>
      {label}
      <span className="relative inline-block h-5 w-9 rounded-full transition-colors" style={{ background: checked ? 'rgb(14 124 90)' : 'rgb(203 213 225)' }}>
        <span className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all" style={{ left: checked ? 18 : 2 }} />
      </span>
    </button>
  )
}

/* ── racer node (avatar + vehicle + labels) ───────────────────────────────── */
function RacerNode({ racer, tier, left, top, scale, z, isYou, motion, taunts, slide, phrases, youLabel }: {
  racer: Racer; tier: Tier | 'camel'; left: number; top: number; scale: number; z: number; isYou: boolean
  motion: boolean; taunts: boolean; slide: boolean; phrases: string[]; youLabel: string
}) {
  const color = colorFor(racer.teacher_id)
  const showBubble = taunts && racer.rank <= 3
  return (
    <div className="absolute" style={{
      left: `${left}%`, top: `${top}%`, zIndex: z,
      transform: `translate(-50%,-50%) scale(${scale})`,
      transition: slide ? 'left 1.3s cubic-bezier(.22,1,.36,1)' : 'none',
    }}>
      <div className={`relative flex flex-col items-center ${motion ? 'animate-[raceBob_3s_ease-in-out_infinite]' : ''}`} style={{ animationDelay: `${racer.rank * 0.25}s` }}>
        {/* speech bubble */}
        {showBubble && (
          <div className="absolute -top-9 whitespace-nowrap px-2.5 py-1 rounded-xl text-[10px] font-semibold text-white shadow-lg" style={{ background: color }}>
            {phrases[(racer.rank - 1) % phrases.length]}
            <span className="absolute left-1/2 -bottom-1 w-2 h-2 rotate-45 -translate-x-1/2" style={{ background: color }} />
          </div>
        )}

        {/* rank pill */}
        <div className="px-1.5 py-px rounded-full text-[10px] font-extrabold mb-0.5 shadow" style={racer.rank === 1
          ? { background: 'linear-gradient(135deg,#FCD34D,#F59E0B)', color: '#7c2d12' }
          : { background: '#0f172a', color: '#fff' }}>
          #{racer.rank}
        </div>

        {/* avatar */}
        <div className="relative">
          <div className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold text-white shadow-lg" style={{
            background: color, border: `3px solid ${isYou ? 'rgb(14 124 90)' : '#fff'}`,
            boxShadow: isYou ? '0 0 0 3px rgba(14,124,90,.35), 0 6px 14px rgba(0,0,0,.3)' : '0 6px 14px rgba(0,0,0,.3)',
          }}>
            {racer.photo_url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={racer.photo_url} alt={racer.name ?? ''} className="w-full h-full object-cover" />
              : initials(racer.name ?? '?')}
          </div>
          {racer.rank === 1 && <span className={`absolute -top-3 left-1/2 -translate-x-1/2 text-base ${motion ? 'animate-[raceSpin_4s_linear_infinite]' : ''}`}>👑</span>}
          {isYou && <span className="absolute -right-1 -bottom-1 text-[8px] font-extrabold px-1 rounded-full text-white" style={{ background: 'rgb(14 124 90)' }}>{youLabel}</span>}
        </div>

        {/* vehicle */}
        <div className="-mt-1">{tier === 'camel' ? <Camel color={color} /> : <Vehicle tier={tier} color={color} motion={motion} />}</div>

        {/* name + hours */}
        <div className="mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold backdrop-blur-sm shadow whitespace-nowrap" style={{ background: 'rgba(255,255,255,.92)', color: 'rgb(11 31 58)' }}>
          {(racer.name ?? '—').split(' ')[0]} · {racer.hours.toFixed(1)}h
        </div>
      </div>
    </div>
  )
}

/* ── tiered vehicles (side view, facing right) ────────────────────────────── */
function Vehicle({ tier, color, motion }: { tier: Tier; color: string; motion: boolean }) {
  switch (tier) {
    case 'rocket': return <Rocket color={color} motion={motion} />
    case 'plane': return <Plane color={color} />
    case 'car': return <Car color={color} motion={motion} />
    case 'moto': return <Moto color={color} motion={motion} />
    case 'horse': return <Horse color={color} />
    default: return <Turtle color={color} />
  }
}

function Rocket({ color, motion }: { color: string; motion: boolean }) {
  const dark = shade(color, -0.25)
  return (
    <svg width="94" height="46" viewBox="0 0 94 46" fill="none">
      <ellipse cx="46" cy="42" rx="30" ry="3.5" fill="rgba(0,0,0,.18)" />
      <g className={motion ? 'animate-[raceFlame_.3s_ease-in-out_infinite]' : ''} style={{ transformOrigin: '16px 23px' }}>
        <path d="M16 15 L1 23 L16 31 Z" fill="#f97316" /><path d="M16 17 L7 23 L16 29 Z" fill="#fbbf24" /><path d="M16 19 L11 23 L16 27 Z" fill="#fff7ed" />
      </g>
      <path d="M16 14 L58 14 C76 14 86 20 90 23 C86 26 76 32 58 32 L16 32 C12 32 12 14 16 14 Z" fill={color} />
      <path d="M74 15 C84 17 89 21 90 23 C89 25 84 29 74 31 C80 27 80 19 74 15 Z" fill={dark} />
      <path d="M20 14 L12 5 L30 14 Z" fill={dark} /><path d="M20 32 L12 41 L30 32 Z" fill={dark} />
      <rect x="30" y="21" width="30" height="4" rx="2" fill="#fff" opacity=".5" />
      <circle cx="50" cy="23" r="6" fill="#0b1026" /><circle cx="50" cy="23" r="4.4" fill="#7dd3fc" /><circle cx="52" cy="21" r="1.4" fill="#fff" />
    </svg>
  )
}

function Plane({ color }: { color: string }) {
  const dark = shade(color, -0.25)
  return (
    <svg width="96" height="46" viewBox="0 0 96 46" fill="none">
      <ellipse cx="48" cy="42" rx="30" ry="3.5" fill="rgba(0,0,0,.18)" />
      <path d="M8 24 L2 8 L18 20 Z" fill={color} /><path d="M8 24 L2 8 L10 12 L12 22 Z" fill={dark} />
      <path d="M40 26 L58 40 L67 40 L52 26 Z" fill={dark} />
      <path d="M8 24 C8 21 12 19 20 19 L74 19 C86 19 92 22 92 24 C92 26 86 28 74 28 L20 28 C12 28 8 27 8 24 Z" fill={color} />
      <path d="M80 19 C88 20 92 22 92 24 C92 26 88 27 80 28 C86 25 86 22 80 19 Z" fill={dark} />
      {[30, 38, 46, 54, 62].map((x) => <rect key={x} x={x} y="22" width="4" height="4" rx="1" fill="#dbeafe" />)}
      <path d="M74 20 C80 20 84 22 86 24 L75 24 C74 22.5 74 21 74 20 Z" fill="#bfdbfe" />
    </svg>
  )
}

function Car({ color, motion }: { color: string; motion: boolean }) {
  const dark = shade(color, -0.25)
  const spin = motion ? 'animate-[raceSpin_0.6s_linear_infinite]' : ''
  return (
    <svg width="96" height="44" viewBox="0 0 96 44" fill="none">
      <ellipse cx="48" cy="40" rx="40" ry="4" fill="rgba(0,0,0,.18)" />
      <path d="M6 30 C8 22 16 21 24 20 L34 13 C38 10 44 9 52 9 C64 9 72 12 80 19 L88 22 C92 23 93 27 92 30 L90 33 C90 33 12 33 8 33 C6 33 5.5 31.5 6 30 Z" fill={color} />
      <path d="M6 30 C6 31.5 6 33 8 33 L90 33 L92 30 C70 31 30 31 6 30 Z" fill={dark} opacity=".5" />
      <path d="M37 14 C40 11 45 10.5 51 10.5 C59 10.5 65 13 70 18 L52 18 L42 18 Z" fill="#dbeafe" opacity=".95" />
      <path d="M52 11 L52 18 L70 18 C66 14 60 11.5 52 11 Z" fill="#bfdbfe" opacity=".9" />
      <rect x="14" y="24" width="62" height="3" rx="1.5" fill="#fff" opacity=".5" />
      <circle cx="89" cy="26" r="2" fill="#fff7ed" />
      <rect x="4" y="18" width="10" height="3" rx="1.5" fill={dark} /><rect x="9" y="18" width="3" height="9" rx="1.5" fill={dark} />
      <g className={spin} style={{ transformOrigin: '28px 34px' }}>
        <circle cx="28" cy="34" r="8" fill="#1f2937" /><circle cx="28" cy="34" r="3.4" fill="#9ca3af" />
        <rect x="27" y="28" width="2" height="12" fill="#4b5563" /><rect x="22" y="33" width="12" height="2" fill="#4b5563" />
      </g>
      <g className={spin} style={{ transformOrigin: '70px 34px' }}>
        <circle cx="70" cy="34" r="8" fill="#1f2937" /><circle cx="70" cy="34" r="3.4" fill="#9ca3af" />
        <rect x="69" y="28" width="2" height="12" fill="#4b5563" /><rect x="64" y="33" width="12" height="2" fill="#4b5563" />
      </g>
    </svg>
  )
}

function Moto({ color, motion }: { color: string; motion: boolean }) {
  const dark = shade(color, -0.25)
  const spin = motion ? 'animate-[raceSpin_0.5s_linear_infinite]' : ''
  return (
    <svg width="84" height="48" viewBox="0 0 84 48" fill="none">
      <ellipse cx="42" cy="44" rx="30" ry="3" fill="rgba(0,0,0,.18)" />
      <g className={spin} style={{ transformOrigin: '18px 34px' }}><circle cx="18" cy="34" r="9" fill="#1f2937" /><circle cx="18" cy="34" r="3" fill="#9ca3af" /><rect x="17" y="26" width="2" height="16" fill="#4b5563" /><rect x="10" y="33" width="16" height="2" fill="#4b5563" /></g>
      <g className={spin} style={{ transformOrigin: '66px 34px' }}><circle cx="66" cy="34" r="9" fill="#1f2937" /><circle cx="66" cy="34" r="3" fill="#9ca3af" /><rect x="65" y="26" width="2" height="16" fill="#4b5563" /><rect x="58" y="33" width="16" height="2" fill="#4b5563" /></g>
      <path d="M18 34 L34 26 L52 26 L62 32 L66 34" stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M30 26 L40 19 L54 19 L58 26 Z" fill={color} />
      <path d="M58 32 L68 21" stroke={dark} strokeWidth="3" strokeLinecap="round" />
      <circle cx="70" cy="20" r="2.5" fill="#fff7ed" />
      <path d="M36 26 L44 15 L50 26 Z" fill={dark} /><circle cx="44" cy="12" r="6" fill={dark} />
    </svg>
  )
}

function Horse({ color }: { color: string }) {
  const dark = shade(color, -0.22)
  return (
    <svg width="82" height="48" viewBox="0 0 82 48" fill="none">
      <ellipse cx="41" cy="44" rx="28" ry="3" fill="rgba(0,0,0,.18)" />
      <path d="M18 24 C10 24 8 30 6 36" stroke={dark} strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M18 26 C18 20 26 18 36 18 L54 18 C60 18 62 22 62 26 L60 30 L22 30 Z" fill={color} />
      <path d="M54 20 C60 14 66 12 70 8 C72 6 74 9 72 12 C70 18 66 22 62 26 Z" fill={color} />
      <path d="M70 8 L77 10 L72 15 Z" fill={dark} />
      <path d="M54 18 C58 14 62 12 66 10 C64 14 62 18 60 22 Z" fill={dark} />
      <path d="M26 30 L20 43" stroke={dark} strokeWidth="4" strokeLinecap="round" />
      <path d="M34 30 L36 43" stroke={color} strokeWidth="4" strokeLinecap="round" />
      <path d="M50 30 L46 43" stroke={dark} strokeWidth="4" strokeLinecap="round" />
      <path d="M56 30 L60 43" stroke={color} strokeWidth="4" strokeLinecap="round" />
      <circle cx="68" cy="11" r="1.1" fill="#0f172a" />
    </svg>
  )
}

function Turtle({ color }: { color: string }) {
  const dark = shade(color, -0.22)
  const light = shade(color, 0.2)
  return (
    <svg width="76" height="42" viewBox="0 0 76 42" fill="none">
      <ellipse cx="38" cy="39" rx="26" ry="3" fill="rgba(0,0,0,.18)" />
      <ellipse cx="22" cy="34" rx="5" ry="3" fill={dark} /><ellipse cx="46" cy="34" rx="5" ry="3" fill={dark} />
      <path d="M14 28 L6 30 L14 32 Z" fill={dark} />
      <ellipse cx="56" cy="26" rx="8" ry="6" fill={light} /><circle cx="60" cy="24" r="1.3" fill="#0f172a" />
      <path d="M16 30 C16 18 26 14 36 14 C46 14 54 18 54 30 Z" fill={color} />
      <path d="M16 30 C16 18 26 14 36 14 C46 14 54 18 54 30 Z" fill="none" stroke={dark} strokeWidth="2" />
      <path d="M35 15 L35 30 M24 28 C28 22 30 20 33 16 M47 28 C43 22 41 20 38 16" stroke={dark} strokeWidth="1.4" fill="none" opacity=".7" />
    </svg>
  )
}

/* ── camel token for the Kaaba journey ────────────────────────────────────── */
function Camel({ color }: { color: string }) {
  return (
    <svg width="70" height="46" viewBox="0 0 70 46" fill="none">
      <ellipse cx="35" cy="42" rx="26" ry="3.5" fill="rgba(0,0,0,.2)" />
      <path d="M14 38 L14 28 C14 25 16 24 18 25 C19 20 22 18 25 22 C26 17 30 16 32 21 L40 21 C42 16 47 17 47 23 L52 26 C56 27 57 30 55 33 L54 38 L50 38 L49 31 L24 31 L22 38 Z" fill={color} />
      <path d="M47 23 C48 18 52 17 53 14 C54 12 52 10 51 12 C50 14 50 18 49 21 Z" fill={color} />
      <circle cx="51.5" cy="13" r="1.2" fill="#0f172a" />
      <rect x="26" y="24" width="18" height="4" rx="2" fill="#fff" opacity=".4" />
    </svg>
  )
}

/* ── night race-track scene (moon, stars, dark asphalt, finish) ────────────── */
const RACE_STARS: [number, number][] = [[70, 40], [160, 90], [250, 55], [360, 30], [470, 70], [560, 40], [300, 120], [130, 140], [430, 130], [620, 100], [520, 150], [90, 200]]
function RaceScene({ finishLabel, motion }: { finishLabel: string; motion: boolean }) {
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 380" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="rt-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b1026" /><stop offset="0.55" stopColor="#1e1b4b" /><stop offset="1" stopColor="#3b2f6b" />
        </linearGradient>
        <radialGradient id="rt-moon" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fef9c3" /><stop offset="0.45" stopColor="#fde68a" stopOpacity="0.5" /><stop offset="1" stopColor="#fde68a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="rt-road" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3b3556" /><stop offset="1" stopColor="#181528" /></linearGradient>
        <linearGradient id="rt-grass1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#166534" /><stop offset="1" stopColor="#14532d" /></linearGradient>
        <linearGradient id="rt-grass2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#15803d" /><stop offset="1" stopColor="#166534" /></linearGradient>
        <pattern id="rt-check" width="20" height="20" patternUnits="userSpaceOnUse">
          <rect width="20" height="20" fill="#fff" /><rect width="10" height="10" fill="#111827" /><rect x="10" y="10" width="10" height="10" fill="#111827" />
        </pattern>
      </defs>

      <rect width="1000" height="380" fill="url(#rt-sky)" />
      {/* stars */}
      {RACE_STARS.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.8 : 1.2} fill="#fff" className={motion ? 'animate-[raceTwinkle_3s_ease-in-out_infinite]' : ''} style={{ animationDelay: `${i * 0.35}s` }} />
      ))}
      {/* moon */}
      <circle cx="820" cy="82" r="120" fill="url(#rt-moon)" />
      <circle cx="820" cy="82" r="42" fill="#fef9c3" />
      <circle cx="806" cy="70" r="7" fill="#000" opacity=".05" /><circle cx="834" cy="90" r="9" fill="#000" opacity=".05" /><circle cx="828" cy="66" r="4" fill="#000" opacity=".05" />
      {/* clouds */}
      <g className={motion ? 'animate-[raceDrift_26s_linear_infinite]' : ''} opacity="0.35"><Cloud x={140} y={70} /><Cloud x={520} y={50} s={0.8} /><Cloud x={720} y={120} s={0.7} /></g>
      <g className={motion ? 'animate-[raceDrift2_34s_linear_infinite]' : ''} opacity="0.25"><Cloud x={320} y={120} s={0.6} /><Cloud x={640} y={150} s={0.5} /></g>
      {/* hills */}
      <path d="M0 230 C150 170 320 175 480 215 C650 255 820 200 1000 225 L1000 380 L0 380 Z" fill="url(#rt-grass1)" />
      <path d="M0 270 C200 225 360 255 560 250 C760 245 880 270 1000 258 L1000 380 L0 380 Z" fill="url(#rt-grass2)" />
      {/* trees (dark silhouettes) */}
      <g opacity="0.75"><Tree x={70} y={250} /><Tree x={930} y={245} s={1.2} /><Tree x={420} y={235} s={0.8} /></g>

      {/* road */}
      <path d="M0 250 L1000 232 L1000 380 L0 380 Z" fill="url(#rt-road)" />
      {/* neon curbs */}
      <path d="M0 250 L1000 232 L1000 240 L0 258 Z" fill="#a855f7" /><path d="M0 254 L1000 236 L1000 240 L0 258 Z" fill="#e9d5ff" opacity=".45" />
      <rect x="0" y="373" width="1000" height="7" fill="#7c3aed" opacity=".85" />
      {/* lane dashes */}
      {[300, 332, 364].map((y, i) => (
        <g key={i} className={motion ? 'animate-[raceDash_0.8s_linear_infinite]' : ''}>
          {Array.from({ length: 13 }).map((_, j) => <rect key={j} x={j * 90 - 40} y={y} width="46" height="4" rx="2" fill="#fbbf24" opacity=".7" />)}
        </g>
      ))}

      {/* finish */}
      <rect x="862" y="232" width="26" height="148" fill="url(#rt-check)" opacity=".95" />
      <line x1="888" y1="232" x2="888" y2="118" stroke="#e2e8f0" strokeWidth="4" />
      <path d="M888 120 L948 130 L888 148 Z" fill="#ef4444" />
      <text x="898" y="116" fill="#f8fafc" fontSize="15" fontWeight="bold" fontFamily="sans-serif">{finishLabel}</text>
    </svg>
  )
}

/* ── Kaaba journey scene (dusk, dunes, stars, Kaaba destination) ───────────── */
function KaabaScene({ motion }: { motion: boolean }) {
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 380" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="kb-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1e1b4b" /><stop offset="0.45" stopColor="#4c1d95" /><stop offset="0.75" stopColor="#9d174d" /><stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
        <linearGradient id="kb-dune1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fbbf24" /><stop offset="1" stopColor="#d97706" /></linearGradient>
        <linearGradient id="kb-dune2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f59e0b" /><stop offset="1" stopColor="#b45309" /></linearGradient>
        <radialGradient id="kb-glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#fde68a" stopOpacity=".9" /><stop offset="1" stopColor="#fde68a" stopOpacity="0" /></radialGradient>
        <linearGradient id="kb-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fde68a" /><stop offset="1" stopColor="#d4af37" /></linearGradient>
      </defs>

      <rect width="1000" height="380" fill="url(#kb-sky)" />
      {[[80, 40], [180, 90], [260, 55], [420, 35], [520, 80], [610, 45], [330, 110], [150, 140], [470, 130]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 2 : 1.3} fill="#fff" className={motion ? 'animate-[raceTwinkle_3s_ease-in-out_infinite]' : ''} style={{ animationDelay: `${i * 0.4}s` }} />
      ))}
      <g transform="translate(150,70)"><circle cx="0" cy="0" r="26" fill="#fef9c3" /><circle cx="9" cy="-5" r="23" fill="#1e1b4b" /></g>
      <ellipse cx="780" cy="250" rx="260" ry="70" fill="url(#kb-glow)" />

      <g transform="translate(815,150)">
        <ellipse cx="40" cy="118" rx="86" ry="12" fill="rgba(0,0,0,.25)" />
        <rect x="-6" y="104" width="92" height="14" rx="2" fill="#e5e7eb" />
        <rect x="2" y="20" width="76" height="86" rx="3" fill="#0b0b0f" />
        <rect x="2" y="20" width="76" height="86" rx="3" fill="url(#kb-glow)" opacity=".12" />
        <rect x="2" y="44" width="76" height="9" fill="url(#kb-gold)" />
        {[14, 30, 46, 62].map((x) => <rect key={x} x={x} y="46" width="5" height="5" rx="1" fill="#7c5e10" opacity=".7" />)}
        <rect x="58" y="64" width="14" height="34" rx="2" fill="#1c1917" stroke="url(#kb-gold)" strokeWidth="1.5" />
      </g>

      <path d="M0 250 C180 210 320 235 520 250 C720 265 860 240 1000 258 L1000 380 L0 380 Z" fill="url(#kb-dune1)" />
      <path d="M0 290 C220 260 380 295 600 295 C800 295 900 305 1000 296 L1000 380 L0 380 Z" fill="url(#kb-dune2)" />
      {[326, 352].map((y, i) => (
        <g key={i}>{Array.from({ length: 14 }).map((_, j) => <rect key={j} x={j * 80} y={y} width="40" height="4" rx="2" fill="#fff7ed" opacity=".4" />)}</g>
      ))}
      <Palm x={70} y={300} /><Palm x={250} y={310} s={0.8} />
    </svg>
  )
}

/* ── small vector props ───────────────────────────────────────────────────── */
function Cloud({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} fill="#fff">
      <ellipse cx="0" cy="0" rx="34" ry="22" /><ellipse cx="30" cy="6" rx="28" ry="18" /><ellipse cx="-28" cy="6" rx="24" ry="16" /><rect x="-50" y="2" width="108" height="20" rx="10" />
    </g>
  )
}
function Tree({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <rect x="-3" y="0" width="6" height="22" rx="2" fill="#92400e" />
      <circle cx="0" cy="-6" r="16" fill="#16a34a" /><circle cx="-11" cy="2" r="12" fill="#22c55e" /><circle cx="11" cy="2" r="12" fill="#15803d" />
    </g>
  )
}
function Palm({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <path d="M0 0 C-4 -20 -3 -40 2 -58" stroke="#78350f" strokeWidth="6" fill="none" strokeLinecap="round" />
      <g fill="#15803d" transform="translate(2,-58)">
        <path d="M0 0 C-22 -6 -40 2 -52 16 C-30 6 -12 6 0 0 Z" /><path d="M0 0 C22 -6 40 2 52 16 C30 6 12 6 0 0 Z" />
        <path d="M0 0 C-10 -22 -6 -40 4 -52 C2 -30 4 -12 0 0 Z" /><path d="M0 0 C16 -16 34 -18 48 -12 C28 -8 12 -4 0 0 Z" />
      </g>
    </g>
  )
}

/* ── helpers + keyframes ──────────────────────────────────────────────────── */
function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16)
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  r = Math.round(Math.min(255, Math.max(0, r + amt * 255)))
  g = Math.round(Math.min(255, Math.max(0, g + amt * 255)))
  b = Math.round(Math.min(255, Math.max(0, b + amt * 255)))
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

function StyleTag() {
  return (
    <style>{`
      @keyframes raceBob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
      @keyframes raceSpin { to { transform: rotate(360deg) } }
      @keyframes raceFlame { 0%,100%{transform:scaleX(1);opacity:1} 50%{transform:scaleX(1.5);opacity:.7} }
      @keyframes raceDrift { from{transform:translateX(0)} to{transform:translateX(60px)} }
      @keyframes raceDrift2 { from{transform:translateX(0)} to{transform:translateX(-50px)} }
      @keyframes raceDash { from{transform:translateX(0)} to{transform:translateX(-90px)} }
      @keyframes raceTwinkle { 0%,100%{opacity:.25} 50%{opacity:1} }
    `}</style>
  )
}
