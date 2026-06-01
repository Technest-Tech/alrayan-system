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
    <div style={{ display: 'flex', gap: 4 }}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} style={{ fontSize: 18, lineHeight: 1, opacity: i < count ? 1 : 0.18 }}>★</span>
      ))}
    </div>
  )
}

function BulletList({ text, color }: { text: string; color: string }) {
  const items = text.split(/[,،;\n]+/).map(s => s.trim()).filter(Boolean)
  if (items.length === 0) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, marginTop: 5, flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{item}</span>
        </div>
      ))}
    </div>
  )
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
        background: '#F8FAFC',
        borderRadius: 24,
        overflow: 'hidden',
        boxShadow: '0 25px 80px rgba(11,31,58,0.18)',
      }}>

        {/* ── header ── */}
        <div style={{
          background: 'linear-gradient(135deg, #0B1F3A 0%, #0B3154 45%, #1E5AAB 100%)',
          padding: '40px 44px 36px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* decorative circles */}
          <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
          <div style={{ position: 'absolute', bottom: -60, left: -30, width: 200, height: 200, borderRadius: '50%', background: 'rgba(30,90,171,0.15)' }} />

          {/* academy name + report type */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
              🌙
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Al-Rayan Academy</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Quran · Tajweed · Islamic Studies</p>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Session Report</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{formatDay(data.date)}</p>
            </div>
          </div>

          {/* student */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.08))', border: '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
              {initials(data.studentName)}
            </div>
            <div>
              <p style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1.2, letterSpacing: '-0.01em' }}>{data.studentName}</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
                with {data.teacherName || 'our teacher'} · {data.duration} min
              </p>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 99, padding: '6px 14px' }}>
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
        <div style={{ background: perf.color, padding: '12px 44px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16 }}>{perf.emoji}</span>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', fontStyle: 'italic' }}>{perf.phrase}</p>
        </div>

        {/* ── body ── */}
        <div style={{ padding: '32px 44px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* what was covered */}
          {hasCovered && (
            <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', border: '1px solid #E5E9F0' }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B7280', marginBottom: 10 }}>📚 What We Covered</p>
              <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.7 }}>{data.covered}</p>
            </div>
          )}

          {/* strengths + weaknesses */}
          {(hasStrengths || hasWeaknesses) && (
            <div style={{ display: 'flex', gap: 16 }}>
              {hasStrengths && (
                <div style={{ flex: 1, background: '#F0FDF4', borderRadius: 16, padding: '20px 20px', border: '1px solid #BBF7D0' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#0E7C5A', marginBottom: 12 }}>💚 Strengths</p>
                  <BulletList text={data.strengths} color="#0E7C5A" />
                </div>
              )}
              {hasWeaknesses && (
                <div style={{ flex: 1, background: '#FFFBEB', borderRadius: 16, padding: '20px 20px', border: '1px solid #FDE68A' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#B45309', marginBottom: 12 }}>🎯 Areas to Develop</p>
                  <BulletList text={data.weaknesses} color="#B45309" />
                </div>
              )}
            </div>
          )}

          {/* homework */}
          {hasHomework && (
            <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', border: '1px solid #E5E9F0', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 22, lineHeight: 1 }}>📝</span>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B7280', marginBottom: 6 }}>Homework / Practice</p>
                <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.7 }}>{data.homework}</p>
              </div>
            </div>
          )}

          {/* recommendations / next session */}
          {hasRecs && (
            <div style={{ background: '#EFF6FF', borderRadius: 16, padding: '20px 24px', border: '1px solid #BFDBFE' }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#1E5AAB', marginBottom: 10 }}>📋 Plan for Next Session</p>
              <p style={{ fontSize: 13, color: '#1E40AF', lineHeight: 1.7 }}>{data.recommendations}</p>
            </div>
          )}
        </div>

        {/* ── footer ── */}
        <div style={{ background: '#0B1F3A', padding: '20px 44px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
