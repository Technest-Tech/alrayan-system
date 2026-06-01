'use client'
import { forwardRef } from 'react'

/* ─── types ─────────────────────────────────────────── */
export interface SessionReportCardData {
  studentName:     string
  teacherName:     string
  date:            string
  duration:        number
  performance:     string
  covered:         string
  strengths:       string
  weaknesses:      string
  recommendations: string
  homework:        string
}

/* ─── helpers ────────────────────────────────────────── */
function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}
function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase() ?? '').join('')
}

const PERF_CONFIG: Record<string, { label: string; emoji: string; stars: number; color: string; phrase: string }> = {
  exceptional:   { label: 'Exceptional',    emoji: '🌟', stars: 5, color: '#0E7C5A', phrase: 'A natural talent — truly exceptional progress mashaAllah' },
  excellent:     { label: 'Excellent',       emoji: '⭐', stars: 5, color: '#0E7C5A', phrase: 'Focused, committed and clearly excelling' },
  very_good:     { label: 'Very Good',       emoji: '✨', stars: 4, color: '#1E5AAB', phrase: 'Strong momentum with great potential ahead' },
  good:          { label: 'Good',            emoji: '👍', stars: 3, color: '#1E5AAB', phrase: 'Consistent effort and solid understanding' },
  average:       { label: 'Progressing',     emoji: '📈', stars: 3, color: '#B45309', phrase: 'Progressing steadily — continued practice will bring great results' },
  below_average: { label: 'Needs Practice',  emoji: '💪', stars: 2, color: '#B45309', phrase: 'Working hard — every consistent effort brings meaningful growth' },
}

/* ─── sub-pieces ─────────────────────────────────────── */
function Stars({ count, total = 5 }: { count: number; total?: number }) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} style={{ fontSize: 16, lineHeight: 1, opacity: i < count ? 1 : 0.2 }}>★</span>
      ))}
    </div>
  )
}

function BulletList({ text, color }: { text: string; color: string }) {
  const items = text.split(/[,،;\n]+/).map(s => s.trim()).filter(Boolean)
  if (items.length === 0) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, marginTop: 7, flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.55 }}>{item}</span>
        </div>
      ))}
    </div>
  )
}

/**
 * A uniform block — every body section uses this shape so the card reads as
 * a clean grid of equal panels rather than mixed-height containers.
 */
function Block({
  title, accent, bg, icon, children,
}: {
  title: string
  accent: string
  bg:     string
  icon:   string
  children: React.ReactNode
}) {
  return (
    <div style={{
      background: bg,
      borderRadius: 14,
      padding: '18px 18px 16px',
      border: `1px solid ${accent}30`,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      minHeight: 130,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          width: 26, height: 26, borderRadius: 8,
          background: `${accent}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14,
        }}>{icon}</span>
        <p style={{
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
          color: accent,
        }}>{title}</p>
      </div>
      <div>{children}</div>
    </div>
  )
}

function Paragraph({ text, color = '#374151' }: { text: string; color?: string }) {
  return <p style={{ fontSize: 13, color, lineHeight: 1.6 }}>{text}</p>
}

/* ─── main card ──────────────────────────────────────── */
export const SessionReportCard = forwardRef<HTMLDivElement, { data: SessionReportCardData }>(
  function SessionReportCard({ data }, ref) {
    const perf = PERF_CONFIG[data.performance] ?? PERF_CONFIG.good

    const hasCovered    = data.covered.trim().length > 0
    const hasStrengths  = data.strengths.trim().length > 0
    const hasWeaknesses = data.weaknesses.trim().length > 0
    const hasHomework   = data.homework.trim().length > 0
    const hasRecs       = data.recommendations.trim().length > 0

    return (
      <div ref={ref} style={{
        width: 720,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        background: '#F4F6FA',
        borderRadius: 24,
        overflow: 'hidden',
        boxShadow: '0 25px 80px rgba(11,31,58,0.18)',
      }}>

        {/* ── header ── */}
        <div style={{
          background: 'linear-gradient(135deg, #0B1F3A 0%, #0B3154 45%, #1E5AAB 100%)',
          padding: '32px 36px 28px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
          <div style={{ position: 'absolute', bottom: -60, left: -30, width: 200, height: 200, borderRadius: '50%', background: 'rgba(30,90,171,0.15)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🌙</div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Al-Rayan Academy</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Quran · Tajweed · Islamic Studies</p>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Session Report</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 3 }}>{formatDay(data.date)}</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 60, height: 60, borderRadius: 17, background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.08))', border: '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
              {initials(data.studentName)}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 24, fontWeight: 800, color: '#fff', lineHeight: 1.15, letterSpacing: '-0.01em' }}>{data.studentName}</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
                with {data.teacherName || 'our teacher'} · {data.duration} min
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 99, padding: '6px 13px' }}>
                <span style={{ fontSize: 14 }}>{perf.emoji}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{perf.label}</span>
              </div>
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
                <Stars count={perf.stars} />
              </div>
            </div>
          </div>
        </div>

        {/* ── performance phrase banner ── */}
        <div style={{ background: perf.color, padding: '11px 36px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16 }}>{perf.emoji}</span>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', fontStyle: 'italic' }}>{perf.phrase}</p>
        </div>

        {/* ── body: organized 2-column block grid ── */}
        <div style={{
          padding: '24px 28px 28px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 14,
        }}>
          {hasCovered && (
            <div style={{ gridColumn: '1 / span 2' }}>
              <Block title="What We Covered" accent="#1E5AAB" bg="#fff" icon="📚">
                <Paragraph text={data.covered} />
              </Block>
            </div>
          )}

          {hasStrengths && (
            <Block title="Strengths" accent="#0E7C5A" bg="#F0FDF4" icon="💚">
              <BulletList text={data.strengths} color="#0E7C5A" />
            </Block>
          )}

          {hasWeaknesses && (
            <Block title="Areas to Develop" accent="#B45309" bg="#FFFBEB" icon="🎯">
              <BulletList text={data.weaknesses} color="#B45309" />
            </Block>
          )}

          {/* Auto-balance: if only one of strengths/weaknesses exists, let it span 2 cols */}
          {(hasStrengths && !hasWeaknesses) || (!hasStrengths && hasWeaknesses)
            ? <></> // (the rendered single one stays in col 1; nothing to add)
            : null}

          {hasHomework && (
            <div style={{ gridColumn: hasRecs ? 'auto' : '1 / span 2' }}>
              <Block title="Homework / Practice" accent="#7C3AED" bg="#FAF5FF" icon="📝">
                <Paragraph text={data.homework} />
              </Block>
            </div>
          )}

          {hasRecs && (
            <div style={{ gridColumn: hasHomework ? 'auto' : '1 / span 2' }}>
              <Block title="Plan for Next Session" accent="#1E40AF" bg="#EFF6FF" icon="📋">
                <Paragraph text={data.recommendations} color="#1E40AF" />
              </Block>
            </div>
          )}
        </div>

        {/* ── footer ── */}
        <div style={{ background: '#0B1F3A', padding: '16px 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14 }}>🌙</span>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: '0.05em' }}>Al-Rayan Academy</p>
          </div>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>📖 Quran · Tajweed · Islamic Studies</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1E5AAB' }} />
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Session Report</p>
          </div>
        </div>
      </div>
    )
  }
)
