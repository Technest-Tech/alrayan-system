'use client'
import { useEffect, useRef, useState } from 'react'

export interface CertData {
  studentName: string
  typeLabel: string
  title: string
  description: string
  courseName: string
  issuedOn: string
  teacherName: string
  directorName: string
  certNumber: string
}

// ─── Islamic 8-pointed star (Khatam) ──────────────────────────────────────────
// Path computed from outer R=45, inner R=19, center=(50,50), 8 outer points at 45° intervals
const S8 = 'M50,5 L57.65,31.52 L81.82,18.18 L68.48,42.35 L95,50 L68.48,57.65 L81.82,81.82 L57.65,68.48 L50,95 L42.35,68.48 L18.18,81.82 L31.52,57.65 L5,50 L31.52,42.35 L18.18,18.18 L42.35,31.52 Z'

// ─── Reusable SVG star ────────────────────────────────────────────────────────
function KhatamStar({
  cx, cy, size, fill = '#C9A24B', opacity = 1,
}: { cx: number; cy: number; size: number; fill?: string; opacity?: number }) {
  const s = size / 100
  return (
    <g transform={`translate(${cx - 50 * s},${cy - 50 * s}) scale(${s})`} opacity={opacity}>
      <path d={S8} fill={fill} />
    </g>
  )
}

// ─── Ornamental divider (star flanked by diamond chains) ─────────────────────
function OrnaDiv({
  width = 400, cy = 14, color = '#C9A24B',
}: { width?: number; cy?: number; color?: string }) {
  const half = width / 2
  const starSize = 28
  const diamonds = [0.2, 0.32, 0.44, 0.56, 0.68, 0.8].map(t => t * (half - 20))
  return (
    <svg width={width} height={28} viewBox={`0 0 ${width} 28`} overflow="visible">
      {/* Lines */}
      <line x1={0} y1={cy} x2={half - starSize / 2 - 6} y2={cy} stroke={color} strokeWidth={0.8} opacity={0.7} />
      <line x1={half + starSize / 2 + 6} y1={cy} x2={width} y2={cy} stroke={color} strokeWidth={0.8} opacity={0.7} />
      {/* Left diamond chain */}
      {diamonds.map(x => (
        <polygon key={x} points={`${x},${cy - 5} ${x + 5},${cy} ${x},${cy + 5} ${x - 5},${cy}`}
          fill={color} opacity={0.4} />
      ))}
      {/* Right diamond chain (mirrored) */}
      {diamonds.map(x => (
        <polygon key={x} points={`${width - x},${cy - 5} ${width - x + 5},${cy} ${width - x},${cy + 5} ${width - x - 5},${cy}`}
          fill={color} opacity={0.4} />
      ))}
      {/* Center khatam star */}
      <KhatamStar cx={half} cy={cy} size={starSize} fill={color} />
    </svg>
  )
}

// ─── CLASSIC: "Quranic Gold" — Cream, Arabesque borders, Bismillah, Khatam corners ──────
// W=940 H=665
export function ClassicCert({ data }: { data: CertData }) {
  const W = 940, H = 665
  // Inner border at inset 22 — corner star centers are exactly there
  const starSz = 36, starS = starSz / 100
  // translate so that star center (50*scale, 50*scale) falls on border corner
  const tlX = 22 - 50 * starS, tlY = 22 - 50 * starS  // top-left

  return (
    <div style={{
      width: W, height: H, background: '#FDF8EE',
      position: 'relative', overflow: 'hidden',
      fontFamily: 'Georgia, "Times New Roman", serif',
    }}>

      {/* ── Geometric SVG layer ─────────────────────────────────── */}
      <svg
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
        width={W} height={H} viewBox={`0 0 ${W} ${H}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Diamond grid background pattern */}
          <pattern id="cl-bg" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M25,0 L50,25 L25,50 L0,25 Z" fill="none" stroke="#C9A24B" strokeWidth="0.5" opacity="0.1" />
          </pattern>
          {/* Gold gradient for border */}
          <linearGradient id="cl-gold-h" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C9A24B" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#C9A24B" stopOpacity="1" />
            <stop offset="100%" stopColor="#C9A24B" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="cl-gold-v" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#C9A24B" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#C9A24B" stopOpacity="1" />
            <stop offset="100%" stopColor="#C9A24B" stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {/* Faint diamond-grid background */}
        <rect x={0} y={0} width={W} height={H} fill="url(#cl-bg)" />

        {/* Outer border */}
        <rect x={12} y={12} width={W - 24} height={H - 24} fill="none" stroke="#C9A24B" strokeWidth={3} />
        {/* Inner border */}
        <rect x={20} y={20} width={W - 40} height={H - 40} fill="none" stroke="#C9A24B" strokeWidth={1} />

        {/* Mid-point border ornaments (small diamonds at edge midpoints) */}
        {/* Top edge mid */}
        <polygon points={`${W / 2},12 ${W / 2 + 6},18 ${W / 2},24 ${W / 2 - 6},18`} fill="#C9A24B" opacity={0.5} />
        {/* Bottom edge mid */}
        <polygon points={`${W / 2},${H - 12} ${W / 2 + 6},${H - 18} ${W / 2},${H - 24} ${W / 2 - 6},${H - 18}`} fill="#C9A24B" opacity={0.5} />
        {/* Left edge mid */}
        <polygon points={`12,${H / 2} 18,${H / 2 + 6} 24,${H / 2} 18,${H / 2 - 6}`} fill="#C9A24B" opacity={0.5} />
        {/* Right edge mid */}
        <polygon points={`${W - 12},${H / 2} ${W - 18},${H / 2 + 6} ${W - 24},${H / 2} ${W - 18},${H / 2 - 6}`} fill="#C9A24B" opacity={0.5} />

        {/* ── 4 corner Khatam stars, centered exactly on inner-border corners ── */}
        <g transform={`translate(${tlX},${tlY}) scale(${starS})`}><path d={S8} fill="#C9A24B" /></g>
        <g transform={`translate(${W - 22 - 50 * starS},${tlY}) scale(${starS})`}><path d={S8} fill="#C9A24B" /></g>
        <g transform={`translate(${tlX},${H - 22 - 50 * starS}) scale(${starS})`}><path d={S8} fill="#C9A24B" /></g>
        <g transform={`translate(${W - 22 - 50 * starS},${H - 22 - 50 * starS}) scale(${starS})`}><path d={S8} fill="#C9A24B" /></g>

        {/* Subtle large central watermark star */}
        <KhatamStar cx={W / 2} cy={H / 2} size={260} fill="#C9A24B" opacity={0.025} />
      </svg>

      {/* ── Text content ─────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', inset: 40,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center',
      }}>

        {/* Bismillah */}
        <div style={{
          fontSize: 15, color: '#9B7A2E', marginBottom: 8,
          fontFamily: '"Amiri", "Scheherazade New", "Traditional Arabic", serif',
          direction: 'rtl', letterSpacing: 1,
        }}>
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </div>

        {/* Logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo/alrayan-mark.svg" alt="Azhary" style={{ height: 48, marginBottom: 6, objectFit: 'contain' }} />

        {/* Academy name EN */}
        <div style={{ fontSize: 10, letterSpacing: 7, textTransform: 'uppercase', color: '#7A6030', marginBottom: 2 }}>
          Azhary
        </div>
        {/* Academy name AR */}
        <div style={{
          fontSize: 14, color: '#C9A24B', marginBottom: 10,
          fontFamily: '"Amiri", "Scheherazade New", serif',
          direction: 'rtl',
        }}>
          أكاديمية أزهري
        </div>

        {/* Ornamental divider */}
        <OrnaDiv width={420} cy={14} />

        {/* Certificate title */}
        <div style={{ fontSize: 26, color: '#1C1208', fontWeight: 700, marginTop: 10, marginBottom: 4, letterSpacing: 0.5 }}>
          Certificate of {data.typeLabel}
        </div>

        {/* Certifies text */}
        <div style={{ fontSize: 12, color: '#6B5B35', fontStyle: 'italic', marginBottom: 7 }}>
          This is to certify that
        </div>

        {/* Student name with twin gold rules */}
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <div style={{ height: 1.5, background: 'linear-gradient(90deg, transparent, #C9A24B 30%, #C9A24B 70%, transparent)', marginBottom: 5 }} />
          <div style={{
            fontSize: 30, color: '#0B1F3A', fontStyle: 'italic',
            paddingInline: 40, letterSpacing: 0.5,
            minWidth: 300,
          }}>
            {data.studentName || 'Student Name'}
          </div>
          <div style={{ height: 1.5, background: 'linear-gradient(90deg, transparent, #C9A24B 30%, #C9A24B 70%, transparent)', marginTop: 5 }} />
        </div>

        {data.title && (
          <div style={{ fontSize: 13, color: '#2C2008', fontWeight: 600, marginBottom: 4 }}>
            {data.title}
          </div>
        )}

        {data.description && (
          <div style={{ fontSize: 11, color: '#5A4A28', fontStyle: 'italic', maxWidth: 540, lineHeight: 1.6, marginBottom: 6 }}>
            {data.description}
          </div>
        )}

        <div style={{ display: 'flex', gap: 28, fontSize: 10, color: '#6B5B35', marginBottom: 20 }}>
          {data.courseName && <span><strong>Course:</strong> {data.courseName}</span>}
          {data.issuedOn && <span><strong>Date:</strong> {data.issuedOn}</span>}
        </div>

        {/* Signatures */}
        <div style={{ display: 'flex', justifyContent: 'space-between', width: 460 }}>
          {([
            [data.directorName || 'Academy Director', 'Academy Director'],
            [data.teacherName || 'Instructor', 'Instructor'],
          ] as [string, string][]).map(([name, role]) => (
            <div key={role} style={{ textAlign: 'center', width: 185 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                <div style={{ flex: 1, height: 1, background: '#C9A24B', opacity: 0.4 }} />
                <svg width={10} height={10} viewBox="0 0 100 100"><path d={S8} fill="#C9A24B" opacity={0.5} /></svg>
                <div style={{ flex: 1, height: 1, background: '#C9A24B', opacity: 0.4 }} />
              </div>
              <div style={{ fontSize: 10, color: '#2C2008', fontWeight: 600 }}>{name}</div>
              <div style={{ fontSize: 9, color: '#9B8860', marginTop: 2 }}>{role}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Cert number */}
      <div style={{ position: 'absolute', bottom: 24, right: 32, fontSize: 8, color: '#C9A24B', fontFamily: 'monospace', opacity: 0.7 }}>
        {data.certNumber}
      </div>
    </div>
  )
}

// ─── MODERN: "Royal Islamic" — Navy, circle-lattice header, green footer ─────
// W=940 H=665
export function ModernCert({ data }: { data: CertData }) {
  const W = 940, H = 665
  const HDR = 170  // header height

  return (
    <div style={{
      width: W, height: H, background: '#F9FAFB',
      position: 'relative', overflow: 'hidden',
      fontFamily: '"Arial", system-ui, sans-serif',
    }}>

      {/* ── Full SVG decorative layer ─────────────────────────── */}
      <svg
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
        width={W} height={H} viewBox={`0 0 ${W} ${H}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Islamic circle-lattice (flower of life) pattern for header */}
          <pattern id="md-circles" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="0"  cy="0"  r="20" fill="none" stroke="white" strokeWidth="0.6" opacity="0.12" />
            <circle cx="40" cy="0"  r="20" fill="none" stroke="white" strokeWidth="0.6" opacity="0.12" />
            <circle cx="0"  cy="40" r="20" fill="none" stroke="white" strokeWidth="0.6" opacity="0.12" />
            <circle cx="40" cy="40" r="20" fill="none" stroke="white" strokeWidth="0.6" opacity="0.12" />
            <circle cx="20" cy="20" r="20" fill="none" stroke="white" strokeWidth="0.6" opacity="0.12" />
          </pattern>
          <clipPath id="md-hdr-clip"><rect x="0" y="0" width={W} height={HDR} /></clipPath>

          {/* Subtle diamond grid for body */}
          <pattern id="md-body-bg" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M30,0 L60,30 L30,60 L0,30 Z" fill="none" stroke="#0B1F3A" strokeWidth="0.3" opacity="0.04" />
          </pattern>
        </defs>

        {/* Navy header fill */}
        <rect x={0} y={0} width={W} height={HDR} fill="#0B1F3A" />
        {/* Islamic circle pattern overlay on header */}
        <rect x={0} y={0} width={W} height={HDR} fill="url(#md-circles)" clipPath="url(#md-hdr-clip)" />
        {/* Large central khatam watermark in header */}
        <KhatamStar cx={W / 2} cy={HDR / 2 + 10} size={180} fill="#C9A24B" opacity={0.07} />
        {/* Small white khatam stars at header corners */}
        <KhatamStar cx={20} cy={20} size={22} fill="white" opacity={0.18} />
        <KhatamStar cx={W - 20} cy={20} size={22} fill="white" opacity={0.18} />

        {/* Gold separator bar */}
        <rect x={0} y={HDR} width={W} height={4} fill="#C9A24B" />

        {/* Left gold accent bar (full height below header) */}
        <rect x={0} y={HDR + 4} width={5} height={H - HDR - 4 - 56} fill="#C9A24B" />

        {/* Body diamond background */}
        <rect x={0} y={HDR + 4} width={W} height={H - HDR - 60} fill="url(#md-body-bg)" />

        {/* Right decorative khatam column */}
        {[0.25, 0.4, 0.55, 0.7].map((t, i) => {
          const y = HDR + 4 + t * (H - HDR - 60)
          return <KhatamStar key={i} cx={W - 28} cy={y} size={22} fill="#C9A24B" opacity={0.12} />
        })}

        {/* Green footer */}
        <rect x={0} y={H - 56} width={W} height={56} fill="#0E7C5A" />
        {/* Subtle star in footer */}
        <KhatamStar cx={W / 2} cy={H - 28} size={40} fill="white" opacity={0.06} />
      </svg>

      {/* ── Header content: logo + academy name ──────────────── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: HDR,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18,
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo-nobg.png" alt="Azhary"
          style={{ height: 54, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
        <div>
          <div style={{ color: '#ffffff', fontSize: 22, fontWeight: 800, letterSpacing: 3 }}>AZHARY</div>
          <div style={{
            color: '#C9A24B', fontSize: 13, marginTop: 3,
            fontFamily: '"Amiri", "Scheherazade New", serif', direction: 'rtl',
          }}>
            أكاديمية أزهري
          </div>
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: HDR + 8, left: 18, right: 50, bottom: 64,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center',
      }}>

        {/* Bismillah (small, gold) */}
        <div style={{
          fontSize: 12, color: '#C9A24B', marginBottom: 8,
          fontFamily: '"Amiri", "Scheherazade New", serif',
          direction: 'rtl',
        }}>
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </div>

        {/* Certificate label */}
        <div style={{ fontSize: 8.5, letterSpacing: 5, textTransform: 'uppercase', color: '#C9A24B', marginBottom: 8 }}>
          Certificate of Achievement
        </div>

        {/* Type */}
        <div style={{ fontSize: 26, fontWeight: 800, color: '#0B1F3A', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>
          {data.typeLabel || 'Course Completion'}
        </div>

        {/* Ornamental divider */}
        <OrnaDiv width={380} cy={14} color="#C9A24B" />

        <div style={{ fontSize: 11, color: '#6B7280', marginTop: 12, marginBottom: 6 }}>This is to certify that</div>

        {/* Student name framed by gold rules */}
        <div style={{ width: '72%', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, #C9A24B)' }} />
            <svg width={12} height={12} viewBox="0 0 100 100"><path d={S8} fill="#C9A24B" /></svg>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left, transparent, #C9A24B)' }} />
          </div>
          <div style={{
            fontSize: 36, fontWeight: 300, color: '#0B1F3A',
            fontFamily: 'Georgia, serif', fontStyle: 'italic', letterSpacing: 1,
          }}>
            {data.studentName || 'Student Name'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, #C9A24B)' }} />
            <svg width={12} height={12} viewBox="0 0 100 100"><path d={S8} fill="#C9A24B" /></svg>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left, transparent, #C9A24B)' }} />
          </div>
        </div>

        {data.title && (
          <div style={{ fontSize: 12, color: '#0E7C5A', fontWeight: 700, marginBottom: 4 }}>
            {data.title}
          </div>
        )}
        {data.description && (
          <div style={{ fontSize: 10, color: '#6B7280', maxWidth: 500, lineHeight: 1.65, marginBottom: 8 }}>
            {data.description}
          </div>
        )}

        <div style={{ display: 'flex', gap: 24, fontSize: 10, color: '#9CA3AF', marginBottom: 18 }}>
          {data.courseName && <span>Course: <strong style={{ color: '#0B1F3A' }}>{data.courseName}</strong></span>}
          {data.issuedOn && <span>Date: <strong style={{ color: '#0B1F3A' }}>{data.issuedOn}</strong></span>}
        </div>

        {/* Signatures */}
        <div style={{ display: 'flex', justifyContent: 'space-between', width: 460 }}>
          {([
            [data.directorName || 'Academy Director', 'Academy Director'],
            [data.teacherName || 'Instructor', 'Instructor'],
          ] as [string, string][]).map(([name, role]) => (
            <div key={role} style={{ textAlign: 'center', width: 190 }}>
              <div style={{ borderTop: '2px solid #0B1F3A', paddingTop: 8, fontSize: 10.5, fontWeight: 700, color: '#0B1F3A' }}>{name}</div>
              <div style={{ fontSize: 8.5, color: '#9CA3AF', marginTop: 2 }}>{role}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer text */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 28px',
      }}>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 9 }}>www.alrayanacademy.com</div>
        <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9, fontFamily: 'monospace' }}>{data.certNumber}</div>
      </div>
    </div>
  )
}

// ─── Scaled canvas wrapper ────────────────────────────────────────────────────
export function CertificateCanvas({ data, template }: { data: CertData; template: 'classic' | 'modern' }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.7)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => setScale(el.clientWidth / 940)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={containerRef} style={{ width: '100%', height: Math.round(665 * scale), position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, transformOrigin: 'top left', transform: `scale(${scale})` }}>
        {template === 'classic' ? <ClassicCert data={data} /> : <ModernCert data={data} />}
      </div>
    </div>
  )
}

// ─── PDF HTML Generators ──────────────────────────────────────────────────────
const ARABICFONT = "@import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&display=swap');"

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// Star SVG for HTML string (mm-based viewBox)
function htmlStar8(cx: number, cy: number, size: number, fill: string, opacity = 1) {
  const s = size / 100
  const tx = cx - 50 * s, ty = cy - 50 * s
  return `<g transform="translate(${tx},${ty}) scale(${s})" opacity="${opacity}"><path d="${S8}" fill="${fill}"/></g>`
}

function htmlOrnaDiv(cx: number, cy: number, halfWidth: number, color: string) {
  const starSize = 8, starScale = starSize / 100
  const starTx = cx - 50 * starScale, starTy = cy - 50 * starScale
  const dw = 1.5  // diamond half-width in mm
  // 6 diamond positions on each side
  const dPositions = [0.15, 0.28, 0.41, 0.54, 0.67, 0.80].map(t => t * (halfWidth - 5))
  const diamondsSVG = dPositions.map(dx =>
    `<polygon points="${cx - dx},${cy - dw} ${cx - dx + dw},${cy} ${cx - dx},${cy + dw} ${cx - dx - dw},${cy}" fill="${color}" opacity="0.4"/>` +
    `<polygon points="${cx + dx},${cy - dw} ${cx + dx + dw},${cy} ${cx + dx},${cy + dw} ${cx + dx - dw},${cy}" fill="${color}" opacity="0.4"/>`
  ).join('')
  return `
    <line x1="${cx - halfWidth}" y1="${cy}" x2="${cx - starSize / 2 - 2}" y2="${cy}" stroke="${color}" stroke-width="0.25" opacity="0.7"/>
    <line x1="${cx + starSize / 2 + 2}" y1="${cy}" x2="${cx + halfWidth}" y2="${cy}" stroke="${color}" stroke-width="0.25" opacity="0.7"/>
    ${diamondsSVG}
    <g transform="translate(${starTx},${starTy}) scale(${starScale})"><path d="${S8}" fill="${color}"/></g>`
}

function buildClassicHTML(d: CertData, logo: string, mark: string): string {
  // A4 landscape: 297mm × 210mm, viewBox in mm
  const W = 297, H = 210
  const cx = W / 2, cy = H / 2
  // Corner stars: 10mm, centered at inner border corners (8.5mm from edge)
  const ss = 10 / 100, sc = 8.5
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
${ARABICFONT}
*{margin:0;padding:0;box-sizing:border-box}
@page{size:A4 landscape;margin:0}
body{width:297mm;height:210mm;background:#FDF8EE;position:relative;overflow:hidden;font-family:Georgia,"Times New Roman",serif}
.geo{position:absolute;top:0;left:0;width:297mm;height:210mm;overflow:hidden}
.content{position:absolute;inset:14mm;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.bismillah{font-size:8.5pt;color:#9B7A2E;margin-bottom:2.5mm;font-family:'Amiri','Scheherazade New','Traditional Arabic',serif;direction:rtl;letter-spacing:.3mm}
.logo{height:14mm;margin-bottom:2mm;object-fit:contain}
.an-en{font-size:6.5pt;letter-spacing:4px;text-transform:uppercase;color:#7A6030;margin-bottom:1mm}
.an-ar{font-size:8pt;color:#C9A24B;font-family:'Amiri','Scheherazade New',serif;direction:rtl;margin-bottom:3mm}
.ct{font-size:18pt;color:#1C1208;font-weight:bold;margin-bottom:1.5mm;letter-spacing:.3mm}
.at{font-size:8pt;color:#6B5B35;font-style:italic;margin-bottom:2.5mm}
.sn-wrap{position:relative;margin-bottom:3mm}
.sn-line{height:.5mm;background:linear-gradient(90deg,transparent,#C9A24B 30%,#C9A24B 70%,transparent)}
.sn{font-size:20pt;color:#0B1F3A;font-style:italic;padding:1mm 12mm;letter-spacing:.3mm}
.ach{font-size:8.5pt;color:#2C2008;font-weight:bold;margin-bottom:1.5mm}
.desc{font-size:7pt;color:#5A4A28;font-style:italic;max-width:170mm;line-height:1.6;margin-bottom:2mm}
.meta{display:flex;gap:8mm;font-size:7pt;color:#6B5B35;margin-bottom:6mm}
.sigs{display:flex;justify-content:space-between;width:140mm}
.sb{text-align:center;width:58mm}
.sl-wrap{display:flex;align-items:center;gap:2mm;margin-bottom:1.5mm}
.sl-line{flex:1;height:.4mm;background:#C9A24B;opacity:.4}
.sl-star{display:inline-block;width:2.5mm;height:2.5mm}
.sn-name{font-size:7.5pt;color:#2C2008;font-weight:bold}
.sn-role{font-size:6pt;color:#9B8860;margin-top:.5mm}
.cn{position:absolute;bottom:7mm;right:9mm;font-size:5.5pt;color:#C9A24B;font-family:monospace;opacity:.7}
</style></head><body>
<svg class="geo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 297 210" width="297mm" height="210mm">
  <defs>
    <pattern id="cl-bg" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
      <path d="M7,0 L14,7 L7,14 L0,7 Z" fill="none" stroke="#C9A24B" stroke-width="0.15" opacity="0.1"/>
    </pattern>
  </defs>
  <rect x="0" y="0" width="${W}" height="${H}" fill="url(#cl-bg)"/>
  <rect x="4.5" y="4.5" width="${W - 9}" height="${H - 9}" fill="none" stroke="#C9A24B" stroke-width="1"/>
  <rect x="7.5" y="7.5" width="${W - 15}" height="${H - 15}" fill="none" stroke="#C9A24B" stroke-width=".35"/>
  <!-- Mid-point ornaments -->
  <polygon points="${cx},4.5 ${cx + 2},7.5 ${cx},10.5 ${cx - 2},7.5" fill="#C9A24B" opacity=".5"/>
  <polygon points="${cx},${H - 4.5} ${cx + 2},${H - 7.5} ${cx},${H - 10.5} ${cx - 2},${H - 7.5}" fill="#C9A24B" opacity=".5"/>
  <polygon points="4.5,${cy} 7.5,${cy + 2} 10.5,${cy} 7.5,${cy - 2}" fill="#C9A24B" opacity=".5"/>
  <polygon points="${W - 4.5},${cy} ${W - 7.5},${cy + 2} ${W - 10.5},${cy} ${W - 7.5},${cy - 2}" fill="#C9A24B" opacity=".5"/>
  <!-- Corner khatam stars (10mm, centered on inner border corners at 7.5mm) -->
  ${htmlStar8(sc, sc, 10, '#C9A24B')}
  ${htmlStar8(W - sc, sc, 10, '#C9A24B')}
  ${htmlStar8(sc, H - sc, 10, '#C9A24B')}
  ${htmlStar8(W - sc, H - sc, 10, '#C9A24B')}
  <!-- Large central watermark -->
  ${htmlStar8(cx, cy, 80, '#C9A24B', 0.025)}
</svg>
<div class="content">
  <div class="bismillah">بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ</div>
  <img class="logo" src="${mark}" alt="Logo">
  <div class="an-en">Azhary</div>
  <div class="an-ar">أكاديمية أزهري</div>
  <svg width="130mm" height="8mm" viewBox="0 0 130 8" xmlns="http://www.w3.org/2000/svg" style="margin-bottom:3mm">
    ${htmlOrnaDiv(65, 4, 60, '#C9A24B')}
  </svg>
  <div class="ct">Certificate of ${esc(d.typeLabel)}</div>
  <div class="at">This is to certify that</div>
  <div class="sn-wrap">
    <div class="sn-line"></div>
    <div class="sn">${esc(d.studentName || 'Student Name')}</div>
    <div class="sn-line"></div>
  </div>
  ${d.title ? `<div class="ach">${esc(d.title)}</div>` : ''}
  ${d.description ? `<div class="desc">${esc(d.description)}</div>` : ''}
  <div class="meta">${d.courseName ? `<span><strong>Course:</strong> ${esc(d.courseName)}</span>` : ''}${d.issuedOn ? `<span><strong>Date:</strong> ${esc(d.issuedOn)}</span>` : ''}</div>
  <div class="sigs">
    <div class="sb">
      <div class="sl-wrap">
        <div class="sl-line"></div>
        <svg class="sl-star" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="${S8}" fill="#C9A24B" opacity=".5"/></svg>
        <div class="sl-line"></div>
      </div>
      <div class="sn-name">${esc(d.directorName || 'Academy Director')}</div>
      <div class="sn-role">Academy Director</div>
    </div>
    <div class="sb">
      <div class="sl-wrap">
        <div class="sl-line"></div>
        <svg class="sl-star" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="${S8}" fill="#C9A24B" opacity=".5"/></svg>
        <div class="sl-line"></div>
      </div>
      <div class="sn-name">${esc(d.teacherName || 'Instructor')}</div>
      <div class="sn-role">Instructor</div>
    </div>
  </div>
</div>
<div class="cn">${esc(d.certNumber)}</div>
</body></html>`
}

function buildModernHTML(d: CertData, logo: string): string {
  const W = 297, H = 210, HDR = 56  // mm
  const cx = W / 2
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
${ARABICFONT}
*{margin:0;padding:0;box-sizing:border-box}
@page{size:A4 landscape;margin:0}
body{width:297mm;height:210mm;background:#F9FAFB;position:relative;overflow:hidden;font-family:Arial,system-ui,sans-serif}
.geo{position:absolute;top:0;left:0;width:297mm;height:210mm;overflow:hidden}
.hdr-content{position:absolute;top:0;left:0;right:0;height:${HDR}mm;display:flex;align-items:center;justify-content:center;gap:5mm}
.logo{height:13mm;object-fit:contain;filter:brightness(0) invert(1)}
.an-en{color:#fff;font-size:14pt;font-weight:800;letter-spacing:3px}
.an-ar{color:#C9A24B;font-size:8pt;font-family:'Amiri','Scheherazade New',serif;direction:rtl;margin-top:1.5mm}
.content{position:absolute;top:${HDR + 1.5}mm;left:4mm;right:14mm;bottom:18mm;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.bismillah{font-size:7pt;color:#C9A24B;margin-bottom:2.5mm;font-family:'Amiri','Scheherazade New',serif;direction:rtl}
.cl{font-size:5.5pt;letter-spacing:4px;text-transform:uppercase;color:#C9A24B;margin-bottom:2.5mm}
.ct{font-size:17pt;font-weight:800;color:#0B1F3A;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4mm}
.at{font-size:7.5pt;color:#9CA3AF;margin-bottom:2.5mm}
.sn-frame{width:70%;margin-bottom:3mm}
.sn-rule{display:flex;align-items:center;gap:3mm}
.sn-rl{flex:1;height:.4mm}
.sn-rl-l{background:linear-gradient(to right,transparent,#C9A24B)}
.sn-rl-r{background:linear-gradient(to left,transparent,#C9A24B)}
.sn-star{display:inline-block;width:3mm;height:3mm}
.sn{font-size:22pt;font-weight:300;color:#0B1F3A;font-family:Georgia,serif;font-style:italic;letter-spacing:.5px;padding:1.5mm 0}
.ach{font-size:8pt;color:#0E7C5A;font-weight:700;margin-bottom:1.5mm}
.desc{font-size:6.5pt;color:#9CA3AF;max-width:160mm;line-height:1.65;margin-bottom:2mm}
.meta{display:flex;gap:7mm;font-size:7pt;color:#9CA3AF;margin-bottom:5mm}
.sigs{display:flex;justify-content:space-between;width:130mm}
.sb{text-align:center;width:55mm}
.sl{border-top:1.5px solid #0B1F3A;padding-top:2mm;font-size:7.5pt;font-weight:700;color:#0B1F3A}
.sr{font-size:6pt;color:#9CA3AF;margin-top:.5mm}
.ftr{position:absolute;bottom:0;left:0;right:0;height:17mm;display:flex;align-items:center;justify-content:space-between;padding:0 8mm}
.fl{color:rgba(255,255,255,.6);font-size:5.5pt}
.fr{color:rgba(255,255,255,.4);font-size:5.5pt;font-family:monospace}
</style></head><body>
<svg class="geo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 297 210" width="297mm" height="210mm">
  <defs>
    <pattern id="md-circ" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
      <circle cx="0" cy="0" r="6" fill="none" stroke="white" stroke-width="0.2" opacity="0.12"/>
      <circle cx="12" cy="0" r="6" fill="none" stroke="white" stroke-width="0.2" opacity="0.12"/>
      <circle cx="0" cy="12" r="6" fill="none" stroke="white" stroke-width="0.2" opacity="0.12"/>
      <circle cx="12" cy="12" r="6" fill="none" stroke="white" stroke-width="0.2" opacity="0.12"/>
      <circle cx="6" cy="6" r="6" fill="none" stroke="white" stroke-width="0.2" opacity="0.12"/>
    </pattern>
    <pattern id="md-body" x="0" y="0" width="18" height="18" patternUnits="userSpaceOnUse">
      <path d="M9,0 L18,9 L9,18 L0,9 Z" fill="none" stroke="#0B1F3A" stroke-width="0.1" opacity="0.04"/>
    </pattern>
    <clipPath id="md-hclip"><rect x="0" y="0" width="${W}" height="${HDR}"/></clipPath>
  </defs>
  <!-- Navy header -->
  <rect x="0" y="0" width="${W}" height="${HDR}" fill="#0B1F3A"/>
  <rect x="0" y="0" width="${W}" height="${HDR}" fill="url(#md-circ)" clip-path="url(#md-hclip)"/>
  ${htmlStar8(cx, HDR / 2 + 3, 56, '#C9A24B', 0.07)}
  ${htmlStar8(7, 7, 7, 'white', 0.18)}
  ${htmlStar8(W - 7, 7, 7, 'white', 0.18)}
  <!-- Gold bar -->
  <rect x="0" y="${HDR}" width="${W}" height="1.5" fill="#C9A24B"/>
  <!-- Left accent -->
  <rect x="0" y="${HDR + 1.5}" width="1.8" height="${H - HDR - 18}" fill="#C9A24B"/>
  <!-- Body background -->
  <rect x="0" y="${HDR}" width="${W}" height="${H - HDR - 17}" fill="url(#md-body)"/>
  <!-- Right stars column -->
  ${[0.25, 0.42, 0.59, 0.76].map(t => htmlStar8(W - 7, HDR + 1.5 + t * (H - HDR - 19), 7, '#C9A24B', 0.12)).join('')}
  <!-- Green footer -->
  <rect x="0" y="${H - 17}" width="${W}" height="17" fill="#0E7C5A"/>
  ${htmlStar8(cx, H - 8.5, 14, 'white', 0.06)}
</svg>
<div class="hdr-content">
  <img class="logo" src="${logo}" alt="Logo">
  <div><div class="an-en">AZHARY</div><div class="an-ar">أكاديمية أزهري</div></div>
</div>
<div class="content">
  <div class="bismillah">بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ</div>
  <div class="cl">Certificate of Achievement</div>
  <div class="ct">${esc(d.typeLabel)}</div>
  <svg width="120mm" height="8mm" viewBox="0 0 120 8" xmlns="http://www.w3.org/2000/svg" style="margin-bottom:3mm">
    ${htmlOrnaDiv(60, 4, 55, '#C9A24B')}
  </svg>
  <div class="at">This is to certify that</div>
  <div class="sn-frame">
    <div class="sn-rule">
      <div class="sn-rl sn-rl-l"></div>
      <svg class="sn-star" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="${S8}" fill="#C9A24B"/></svg>
      <div class="sn-rl sn-rl-r"></div>
    </div>
    <div class="sn">${esc(d.studentName || 'Student Name')}</div>
    <div class="sn-rule">
      <div class="sn-rl sn-rl-l"></div>
      <svg class="sn-star" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="${S8}" fill="#C9A24B"/></svg>
      <div class="sn-rl sn-rl-r"></div>
    </div>
  </div>
  ${d.title ? `<div class="ach">${esc(d.title)}</div>` : ''}
  ${d.description ? `<div class="desc">${esc(d.description)}</div>` : ''}
  <div class="meta">${d.courseName ? `<span>Course: <strong style="color:#0B1F3A">${esc(d.courseName)}</strong></span>` : ''}${d.issuedOn ? `<span>Date: <strong style="color:#0B1F3A">${esc(d.issuedOn)}</strong></span>` : ''}</div>
  <div class="sigs">
    <div class="sb"><div class="sl">${esc(d.directorName || 'Academy Director')}</div><div class="sr">Academy Director</div></div>
    <div class="sb"><div class="sl">${esc(d.teacherName || 'Instructor')}</div><div class="sr">Instructor</div></div>
  </div>
</div>
<div class="ftr"><div class="fl">www.alrayanacademy.com</div><div class="fr">${esc(d.certNumber)}</div></div>
</body></html>`
}

// ─── PDF Download ─────────────────────────────────────────────────────────────
async function toDataUrl(path: string): Promise<string> {
  try {
    const blob = await fetch(path).then(r => r.blob())
    return await new Promise((res, rej) => {
      const fr = new FileReader()
      fr.onload = () => res(fr.result as string)
      fr.onerror = rej
      fr.readAsDataURL(blob)
    })
  } catch { return '' }
}

export async function downloadCertificatePDF(data: CertData, template: 'classic' | 'modern') {
  const [logoDataUrl, markDataUrl] = await Promise.all([
    toDataUrl('/images/logo-nobg.png'),
    toDataUrl('/logo/alrayan-mark.svg'),
  ])

  const html = template === 'classic'
    ? buildClassicHTML(data, logoDataUrl, markDataUrl)
    : buildModernHTML(data, logoDataUrl)

  const blob = new Blob([html], { type: 'text/html; charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const w = window.open(url, '_blank')
  if (w) {
    w.addEventListener('load', () => {
      setTimeout(() => { w.print(); URL.revokeObjectURL(url) }, 600)
    })
  }
}
