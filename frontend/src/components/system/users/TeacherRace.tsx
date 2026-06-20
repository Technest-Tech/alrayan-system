'use client'
import { useEffect, useState } from 'react'
import { Flag, Sparkles, Trophy } from 'lucide-react'
import { useTeacherRace, type Racer } from '@/hooks/system/useTeacherReports'
import { useI18n } from '@/lib/system/i18n'

type Mode = 'race' | 'kaaba'

/* ── identity helpers ─────────────────────────────────────────────────────── */
const CAR_PALETTE = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1']
const initials = (n: string) => n.split(' ').slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('')
function colorFor(seed: number | string) {
  const s = String(seed)
  let h = 0
  for (let i = 0; i < s.length; i++) h = (s.charCodeAt(i) + ((h << 5) - h)) | 0
  return CAR_PALETTE[Math.abs(h) % CAR_PALETTE.length]
}
const MAX_RACERS = 8

export default function TeacherRace({ currentTeacherId, month }: { currentTeacherId: number | null; month?: string }) {
  const { t } = useI18n()
  const PHRASES = [
    t('users.teacherRacePhrase1'),
    t('users.teacherRacePhrase2'),
    t('users.teacherRacePhrase3'),
    t('users.teacherRacePhrase4'),
    t('users.teacherRacePhrase5'),
  ]
  const { data, isLoading } = useTeacherRace(month)
  const [mode, setMode] = useState<Mode>('race')
  const [mounted, setMounted] = useState(false)
  useEffect(() => { const timer = setTimeout(() => setMounted(true), 60); return () => clearTimeout(timer) }, [])

  const racers = (data?.racers ?? []).slice(0, MAX_RACERS)
  const leaderHours = data?.leader_hours ?? 0
  const k = racers.length

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
      <StyleTag />

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-white">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: 'linear-gradient(135deg,#F59E0B,#F97316)' }}><Trophy size={18} /></span>
          <div>
            <h3 className="text-sm font-bold" style={{ color: 'rgb(11 31 58)' }}>{t('users.teacherRaceTitle')}</h3>
            <p className="text-[11px]" style={{ color: 'rgb(90 100 112)' }}>{t('users.teacherRaceSubtitle')}</p>
          </div>
        </div>
        <div className="inline-flex rounded-full p-0.5 text-xs font-semibold" style={{ background: 'rgb(15 23 42)' }}>
          <button onClick={() => setMode('race')} className="px-3 py-1.5 rounded-full transition-colors inline-flex items-center gap-1.5" style={mode === 'race' ? { background: '#fff', color: 'rgb(11 31 58)' } : { color: 'rgba(255,255,255,.7)' }}>
            <Flag size={12} /> {t('users.teacherRaceModeTrack')}
          </button>
          <button onClick={() => setMode('kaaba')} className="px-3 py-1.5 rounded-full transition-colors inline-flex items-center gap-1.5" style={mode === 'kaaba' ? { background: '#fff', color: 'rgb(11 31 58)' } : { color: 'rgba(255,255,255,.7)' }}>
            <Sparkles size={12} /> {t('users.teacherRaceModeKaaba')}
          </button>
        </div>
      </div>

      {/* Scene */}
      <div className="relative w-full" style={{ height: 380 }}>
        {mode === 'race' ? <RaceScene finishLabel={t('users.teacherRaceFinish')} /> : <KaabaScene />}

        {/* Racers overlay */}
        {!isLoading && racers.map((r, i) => {
          const progress = leaderHours > 0 ? r.hours / leaderHours : 0
          const left = 9 + (mounted ? progress * 73 : 0)            // % — slides in from start line
          const top = k <= 1 ? 70 : 86 - i * (46 / (k - 1))         // leader (i=0) sits front/low
          const scale = 1.04 - i * (0.26 / Math.max(1, k - 1))      // depth: front bigger
          const isYou = r.teacher_id === currentTeacherId
          return (
            <RacerNode key={r.teacher_id} racer={r} mode={mode} left={left} top={top} scale={scale} isYou={isYou} z={60 - i} phrases={PHRASES} youLabel={t('users.teacherRaceYou')} />
          )
        })}

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center text-sm" style={{ color: 'rgba(255,255,255,.85)' }}>{t('users.teacherRaceLoading')}</div>
        )}
        {!isLoading && racers.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-sm" style={{ color: 'rgba(255,255,255,.85)' }}>{t('users.teacherRaceEmpty')}</div>
        )}
      </div>

      {/* Standings strip */}
      <div className="flex gap-2 overflow-x-auto px-4 py-3 bg-white">
        {racers.map((r) => (
          <div key={r.teacher_id} className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 shrink-0 border" style={{ borderColor: r.teacher_id === currentTeacherId ? 'rgb(14 124 90)' : 'rgb(var(--border-default,229 233 240))', background: r.teacher_id === currentTeacherId ? 'rgb(14 124 90 / 0.06)' : '#fff' }}>
            <Medal rank={r.rank} />
            <span className="text-xs font-semibold" style={{ color: 'rgb(11 31 58)' }}>{r.name ?? '—'}</span>
            <span className="text-[11px] tabular-nums" style={{ color: 'rgb(90 100 112)' }}>{r.hours.toFixed(1)}h</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── racer node (avatar + car/token + labels) ─────────────────────────────── */
function RacerNode({ racer, mode, left, top, scale, isYou, z, phrases, youLabel }: {
  racer: Racer; mode: Mode; left: number; top: number; scale: number; isYou: boolean; z: number; phrases: string[]; youLabel: string
}) {
  const color = colorFor(racer.teacher_id)
  const showBubble = racer.rank <= 3
  return (
    <div className="absolute" style={{
      left: `${left}%`, top: `${top}%`, zIndex: z,
      transform: `translate(-50%,-50%) scale(${scale})`,
      transition: 'left 1.3s cubic-bezier(.22,1,.36,1)',
    }}>
      <div className="relative flex flex-col items-center animate-[raceBob_3s_ease-in-out_infinite]" style={{ animationDelay: `${racer.rank * 0.25}s` }}>
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
          {racer.rank === 1 && <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-base animate-[raceSpin_4s_linear_infinite]">👑</span>}
          {isYou && <span className="absolute -right-1 -bottom-1 text-[8px] font-extrabold px-1 rounded-full text-white" style={{ background: 'rgb(14 124 90)' }}>{youLabel}</span>}
        </div>

        {/* vehicle */}
        <div className="-mt-1">{mode === 'race' ? <Car color={color} /> : <Camel color={color} />}</div>

        {/* name + hours */}
        <div className="mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold backdrop-blur-sm shadow whitespace-nowrap" style={{ background: 'rgba(255,255,255,.92)', color: 'rgb(11 31 58)' }}>
          {(racer.name ?? '—').split(' ')[0]} · {racer.hours.toFixed(1)}h
        </div>
      </div>
    </div>
  )
}

/* ── sleek racing car (side view) ─────────────────────────────────────────── */
function Car({ color }: { color: string }) {
  const dark = shade(color, -0.25)
  return (
    <svg width="96" height="44" viewBox="0 0 96 44" fill="none">
      <ellipse cx="48" cy="40" rx="40" ry="4" fill="rgba(0,0,0,.18)" />
      {/* body */}
      <path d="M6 30 C8 22 16 21 24 20 L34 13 C38 10 44 9 52 9 C64 9 72 12 80 19 L88 22 C92 23 93 27 92 30 L90 33 C90 33 12 33 8 33 C6 33 5.5 31.5 6 30 Z" fill={color} />
      {/* lower shade */}
      <path d="M6 30 C6 31.5 6 33 8 33 L90 33 L92 30 C70 31 30 31 6 30 Z" fill={dark} opacity=".5" />
      {/* windshield / cabin */}
      <path d="M37 14 C40 11 45 10.5 51 10.5 C59 10.5 65 13 70 18 L52 18 L42 18 Z" fill="#dbeafe" opacity=".95" />
      <path d="M52 11 L52 18 L70 18 C66 14 60 11.5 52 11 Z" fill="#bfdbfe" opacity=".9" />
      {/* racing stripe */}
      <rect x="14" y="24" width="62" height="3" rx="1.5" fill="#fff" opacity=".5" />
      {/* headlight */}
      <circle cx="89" cy="26" r="2" fill="#fff7ed" />
      {/* spoiler */}
      <rect x="4" y="18" width="10" height="3" rx="1.5" fill={dark} />
      <rect x="9" y="18" width="3" height="9" rx="1.5" fill={dark} />
      {/* wheels */}
      <g className="animate-[raceSpin_0.6s_linear_infinite]" style={{ transformOrigin: '28px 34px' }}>
        <circle cx="28" cy="34" r="8" fill="#1f2937" /><circle cx="28" cy="34" r="3.4" fill="#9ca3af" />
        <rect x="27" y="28" width="2" height="12" fill="#4b5563" /><rect x="22" y="33" width="12" height="2" fill="#4b5563" />
      </g>
      <g className="animate-[raceSpin_0.6s_linear_infinite]" style={{ transformOrigin: '70px 34px' }}>
        <circle cx="70" cy="34" r="8" fill="#1f2937" /><circle cx="70" cy="34" r="3.4" fill="#9ca3af" />
        <rect x="69" y="28" width="2" height="12" fill="#4b5563" /><rect x="64" y="33" width="12" height="2" fill="#4b5563" />
      </g>
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

/* ── race-track scene (sky, sun, hills, asphalt, finish) ───────────────────── */
function RaceScene({ finishLabel }: { finishLabel: string }) {
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 380" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="rt-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7dd3fc" /><stop offset="0.55" stopColor="#bae6fd" /><stop offset="1" stopColor="#e0f2fe" />
        </linearGradient>
        <radialGradient id="rt-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff7cc" /><stop offset="0.4" stopColor="#fde68a" /><stop offset="1" stopColor="#fde68a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="rt-road" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4b5563" /><stop offset="1" stopColor="#1f2937" />
        </linearGradient>
        <linearGradient id="rt-hill1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#86efac" /><stop offset="1" stopColor="#4ade80" /></linearGradient>
        <linearGradient id="rt-hill2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#34d399" /><stop offset="1" stopColor="#10b981" /></linearGradient>
        <pattern id="rt-check" width="20" height="20" patternUnits="userSpaceOnUse">
          <rect width="20" height="20" fill="#fff" /><rect width="10" height="10" fill="#111827" /><rect x="10" y="10" width="10" height="10" fill="#111827" />
        </pattern>
      </defs>

      <rect width="1000" height="380" fill="url(#rt-sky)" />
      {/* sun */}
      <circle cx="850" cy="80" r="120" fill="url(#rt-sun)" />
      <circle cx="850" cy="80" r="38" fill="#fde047" className="animate-[racePulse_4s_ease-in-out_infinite]" style={{ transformOrigin: '850px 80px' }} />
      {/* clouds */}
      <g className="animate-[raceDrift_26s_linear_infinite]" opacity="0.95"><Cloud x={120} y={70} /><Cloud x={520} y={48} s={0.8} /><Cloud x={760} y={120} s={0.7} /></g>
      <g className="animate-[raceDrift2_34s_linear_infinite]" opacity="0.8"><Cloud x={300} y={120} s={0.6} /><Cloud x={640} y={150} s={0.5} /></g>
      {/* hills */}
      <path d="M0 230 C150 170 320 175 480 215 C650 255 820 200 1000 225 L1000 380 L0 380 Z" fill="url(#rt-hill1)" />
      <path d="M0 270 C200 225 360 255 560 250 C760 245 880 270 1000 258 L1000 380 L0 380 Z" fill="url(#rt-hill2)" />
      {/* trees */}
      <Tree x={70} y={250} /><Tree x={930} y={245} s={1.2} /><Tree x={420} y={235} s={0.8} />

      {/* road */}
      <path d="M0 250 L1000 232 L1000 380 L0 380 Z" fill="url(#rt-road)" />
      {/* curbs */}
      <path d="M0 250 L1000 232 L1000 240 L0 258 Z" fill="#ef4444" /><path d="M0 254 L1000 236 L1000 240 L0 258 Z" fill="#fff" opacity=".5" />
      {/* lane dashes */}
      {[300, 332, 364].map((y, i) => (
        <g key={i} className="animate-[raceDash_0.8s_linear_infinite]">
          {Array.from({ length: 13 }).map((_, j) => <rect key={j} x={j * 90 - 40} y={y} width="46" height="4" rx="2" fill="#fbbf24" opacity=".75" />)}
        </g>
      ))}

      {/* finish */}
      <rect x="862" y="232" width="26" height="148" fill="url(#rt-check)" opacity=".95" />
      <line x1="888" y1="232" x2="888" y2="120" stroke="#0f172a" strokeWidth="4" />
      <path d="M888 122 L948 132 L888 150 Z" fill="#ef4444" />
      <text x="900" y="120" fill="#0f172a" fontSize="15" fontWeight="bold" fontFamily="sans-serif">{finishLabel}</text>
    </svg>
  )
}

/* ── Kaaba journey scene (dusk, dunes, stars, Kaaba destination) ───────────── */
function KaabaScene() {
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
      {/* stars */}
      {[[80, 40], [180, 90], [260, 55], [420, 35], [520, 80], [610, 45], [330, 110], [150, 140], [470, 130]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 2 : 1.3} fill="#fff" className="animate-[raceTwinkle_3s_ease-in-out_infinite]" style={{ animationDelay: `${i * 0.4}s` }} />
      ))}
      {/* crescent moon */}
      <g transform="translate(150,70)"><circle cx="0" cy="0" r="26" fill="#fef9c3" /><circle cx="9" cy="-5" r="23" fill="#1e1b4b" /></g>
      {/* horizon glow */}
      <ellipse cx="780" cy="250" rx="260" ry="70" fill="url(#kb-glow)" />

      {/* Kaaba destination */}
      <g transform="translate(815,150)">
        <ellipse cx="40" cy="118" rx="86" ry="12" fill="rgba(0,0,0,.25)" />
        <rect x="-6" y="104" width="92" height="14" rx="2" fill="#e5e7eb" />
        <rect x="2" y="20" width="76" height="86" rx="3" fill="#0b0b0f" />
        <rect x="2" y="20" width="76" height="86" rx="3" fill="url(#kb-glow)" opacity=".12" />
        <rect x="2" y="44" width="76" height="9" fill="url(#kb-gold)" />
        {[14, 30, 46, 62].map((x) => <rect key={x} x={x} y="46" width="5" height="5" rx="1" fill="#7c5e10" opacity=".7" />)}
        <rect x="58" y="64" width="14" height="34" rx="2" fill="#1c1917" stroke="url(#kb-gold)" strokeWidth="1.5" />
      </g>

      {/* dunes */}
      <path d="M0 250 C180 210 320 235 520 250 C720 265 860 240 1000 258 L1000 380 L0 380 Z" fill="url(#kb-dune1)" />
      <path d="M0 290 C220 260 380 295 600 295 C800 295 900 305 1000 296 L1000 380 L0 380 Z" fill="url(#kb-dune2)" />
      {/* sand path dashes */}
      {[326, 352].map((y, i) => (
        <g key={i}>{Array.from({ length: 14 }).map((_, j) => <rect key={j} x={j * 80} y={y} width="40" height="4" rx="2" fill="#fff7ed" opacity=".4" />)}</g>
      ))}
      {/* palms */}
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

function Medal({ rank }: { rank: number }) {
  const bg = rank === 1 ? 'linear-gradient(135deg,#FCD34D,#F59E0B)' : rank === 2 ? 'linear-gradient(135deg,#e2e8f0,#94a3b8)' : rank === 3 ? 'linear-gradient(135deg,#fdba74,#c2671b)' : '#0f172a'
  const fg = rank <= 3 ? '#3f2d0b' : '#fff'
  return <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0" style={{ background: bg, color: fg }}>{rank}</span>
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
      @keyframes racePulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.08);opacity:.92} }
      @keyframes raceDrift { from{transform:translateX(0)} to{transform:translateX(60px)} }
      @keyframes raceDrift2 { from{transform:translateX(0)} to{transform:translateX(-50px)} }
      @keyframes raceDash { from{transform:translateX(0)} to{transform:translateX(-90px)} }
      @keyframes raceTwinkle { 0%,100%{opacity:.25} 50%{opacity:1} }
    `}</style>
  )
}
