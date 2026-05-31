'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  CheckCircle2, AlertTriangle, Clock, XCircle,
  Download, MessageCircle, Check,
  Shield, Lock, ChevronDown, ChevronUp,
} from 'lucide-react'
import { siteConfig } from '@/config/site'

// ── Types ─────────────────────────────────────────────────────────────────

type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'void'

interface PublicLine {
  description: string
  kind: string
  quantity: number
  session_duration_min: number | null
  unit_price_minor: number
  line_total_minor: number
}

interface PublicInvoice {
  invoice_number: string
  type: string
  currency: string
  subtotal_minor: number
  discount_minor: number
  wallet_credit_minor: number
  total_minor: number
  status: InvoiceStatus
  issued_at: string | null
  due_at: string | null
  paid_at: string | null
  student_name: string | null
  course_name: string | null
  teacher_name: string | null
  sessions_per_month: number | null
  session_duration_min: number | null
  description: string | null
  lines: PublicLine[]
}

// ── Helpers ───────────────────────────────────────────────────────────────

function formatMinor(minor: number, currency: string): string {
  const amount = minor / 100
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency,
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toLocaleString()}`
  }
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const due = new Date(iso); due.setHours(0, 0, 0, 0)
  return Math.round((due.getTime() - today.getTime()) / 86_400_000)
}

function computeTotalHours(invoice: PublicInvoice): number | null {
  let totalMin = 0
  let hasData = false
  for (const line of invoice.lines) {
    if (line.session_duration_min && line.quantity > 0 && line.kind !== 'discount' && line.kind !== 'adjustment') {
      totalMin += line.quantity * line.session_duration_min
      hasData = true
    }
  }
  if (hasData && totalMin > 0) return Math.round(totalMin / 60 * 10) / 10
  if (invoice.sessions_per_month && invoice.session_duration_min) {
    return Math.round(invoice.sessions_per_month * invoice.session_duration_min / 60 * 10) / 10
  }
  return null
}

// ── Islamic geometric SVG background ──────────────────────────────────────

function IslamicBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {/* Geometric star tessellation */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="islamic-bg" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
            {/* 8-pointed star at (50,50), outer r=30, inner r=12.5 */}
            <polygon
              points="50,20 54.8,37.5 67.2,27.9 59.3,43.4 77.5,43.4 63.4,52 72.1,67.2 55.7,60.7 50,80 44.3,60.7 27.9,67.2 36.6,52 22.5,43.4 40.7,43.4 32.8,27.9 45.2,37.5"
              fill="none"
              stroke="rgba(201,169,64,0.35)"
              strokeWidth="0.7"
            />
            {/* Rotated square (diamond) overlay */}
            <rect x="29" y="29" width="42" height="42" transform="rotate(45 50 50)"
              fill="none" stroke="rgba(201,169,64,0.1)" strokeWidth="0.5" />
            {/* Centre dot */}
            <circle cx="50" cy="50" r="1.5" fill="rgba(201,169,64,0.2)" />
            {/* Corner quarter-star connectors */}
            <line x1="20" y1="0" x2="22.5" y2="43.4" stroke="rgba(201,169,64,0.12)" strokeWidth="0.5" />
            <line x1="80" y1="0" x2="77.5" y2="43.4" stroke="rgba(201,169,64,0.12)" strokeWidth="0.5" />
            <line x1="20" y1="100" x2="22.5" y2="56.6" stroke="rgba(201,169,64,0.12)" strokeWidth="0.5" />
            <line x1="80" y1="100" x2="77.5" y2="56.6" stroke="rgba(201,169,64,0.12)" strokeWidth="0.5" />
            <line x1="0" y1="20" x2="40.7" y2="43.4" stroke="rgba(201,169,64,0.12)" strokeWidth="0.5" />
            <line x1="0" y1="80" x2="40.7" y2="56.6" stroke="rgba(201,169,64,0.12)" strokeWidth="0.5" />
            <line x1="100" y1="20" x2="59.3" y2="43.4" stroke="rgba(201,169,64,0.12)" strokeWidth="0.5" />
            <line x1="100" y1="80" x2="59.3" y2="56.6" stroke="rgba(201,169,64,0.12)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#islamic-bg)" />
      </svg>
      {/* Soft radial glow at top-center */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-72 opacity-15 rounded-full"
        style={{ background: 'radial-gradient(ellipse, #c9a940 0%, transparent 70%)' }} />
      {/* Subtle vignette at edges */}
      <div className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.3) 100%)' }} />
    </div>
  )
}

// ── Ornamental divider ─────────────────────────────────────────────────────

function OrnamentDivider({ gold = true }: { gold?: boolean }) {
  const c = gold ? '#c9a940' : '#16a34a'
  return (
    <div className="flex items-center gap-3 px-7 py-1">
      <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${c}50)` }} />
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <polygon points="9,1 10.4,6.6 16,8 10.4,9.4 9,16 7.6,9.4 2,8 7.6,6.6" fill={c} opacity="0.65" />
      </svg>
      <div className="flex-1 h-px" style={{ background: `linear-gradient(to left, transparent, ${c}50)` }} />
    </div>
  )
}

// ── Detail cell ────────────────────────────────────────────────────────────

function DetailCell({ label, value, warning }: { label: string; value: string; warning?: boolean }) {
  return (
    <div className="text-center">
      <p className="text-[9px] uppercase tracking-[0.15em] font-bold mb-1" style={{ color: '#a08c65' }}>{label}</p>
      <p className={`text-sm font-bold ${warning ? 'text-red-500' : 'text-gray-800'}`}>{value}</p>
    </div>
  )
}

// ── Visa / Mastercard icons ────────────────────────────────────────────────

function VisaMastercardIcons() {
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-6 px-2 rounded border border-amber-200/60 bg-white flex items-center">
        <span className="text-[#1A1F71] font-black text-sm tracking-tight">VISA</span>
      </div>
      <div className="h-6 px-1.5 rounded border border-amber-200/60 bg-white flex items-center gap-0.5">
        <div className="w-4 h-4 rounded-full bg-[#EB001B]" />
        <div className="w-4 h-4 rounded-full bg-[#F79E1B] -ml-2" />
      </div>
    </div>
  )
}

// ── Coming-soon payment button ─────────────────────────────────────────────

function ComingSoonMethod({ emoji, label, brands, onSelect }: {
  emoji: string; label: string; brands: React.ReactNode; onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-left transition-all hover:bg-amber-50/40"
      style={{ border: '1px solid #e8d5a0' }}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
        style={{ background: '#f7f1e3', border: '1px solid #e8d5a0' }}>
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">{label}</span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide"
            style={{ background: '#fef3c7', color: '#92400e' }}>Soon</span>
        </div>
      </div>
      <div className="shrink-0">{brands}</div>
    </button>
  )
}

// ── WhatsApp / manual payment ──────────────────────────────────────────────

function ManualMethods({ whatsappText }: { whatsappText: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #e8d5a0' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:bg-amber-50/40"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
            style={{ background: '#f7f1e3', border: '1px solid #e8d5a0' }}>
            💬
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">WhatsApp / Bank Transfer</p>
            <p className="text-xs text-gray-400 mt-0.5">Send payment and confirm with us</p>
          </div>
        </div>
        {open ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
      </button>

      {open && (
        <div className="px-5 pb-5 border-t space-y-4" style={{ borderColor: '#f0e8d0' }}>
          <div className="space-y-3 pt-4">
            {[
              'Send payment via bank transfer, Vodafone Cash, or InstaPay.',
              'Take a screenshot of your transfer confirmation.',
              'Send the screenshot on WhatsApp — we confirm within minutes.',
            ].map((step, i) => (
              <div key={i} className="flex gap-3">
                <span className="w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: '#f0e8ce', color: '#8a6a20' }}>
                  {i + 1}
                </span>
                <p className="text-sm text-gray-600 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
          <a
            href={`https://wa.me/${siteConfig.whatsapp}?text=${whatsappText}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ background: '#25D366' }}
          >
            <MessageCircle size={15} />
            Open WhatsApp
          </a>
        </div>
      )}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function PublicPaymentPage() {
  const params   = useParams()
  const token    = params?.token as string
  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? ''

  const [invoice,     setInvoice]     = useState<PublicInvoice | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [toast,       setToast]       = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    fetch(`${API_BASE}/api/system/pay/${token}`, { headers: { Accept: 'application/json' } })
      .then(async r => { if (!r.ok) throw new Error(); setInvoice((await r.json()).data) })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [token, API_BASE])

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const r = await fetch(`${API_BASE}/api/system/pay/${token}/pdf`, { headers: { Accept: 'application/pdf' } })
      if (!r.ok) throw new Error()
      const url = URL.createObjectURL(await r.blob())
      Object.assign(document.createElement('a'), { href: url, download: `${invoice?.invoice_number ?? 'invoice'}.pdf` }).click()
      URL.revokeObjectURL(url)
    } catch { /* silent */ }
    finally { setDownloading(false) }
  }

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500) }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center relative" style={{ backgroundColor: '#0b3222' }}>
      <IslamicBackground />
      <div className="relative z-10 text-center">
        <div className="w-12 h-12 rounded-full border-4 border-white/10 border-t-amber-400 animate-spin mx-auto mb-4" />
        <p className="text-sm" style={{ color: 'rgba(201,169,64,0.5)' }}>Loading…</p>
      </div>
    </div>
  )

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error || !invoice) return (
    <div className="min-h-screen flex items-center justify-center relative p-4" style={{ backgroundColor: '#0b3222' }}>
      <IslamicBackground />
      <div className="relative z-10 rounded-3xl p-10 max-w-sm w-full text-center shadow-2xl"
        style={{ background: '#faf8f2', border: '1px solid rgba(201,169,64,0.3)' }}>
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <XCircle size={26} className="text-red-400" />
        </div>
        <h1 className="text-lg font-bold text-gray-900 mb-2">Link not found</h1>
        <p className="text-sm text-gray-400 mb-7 leading-relaxed">
          This payment link may have expired or been revoked. Contact us and we'll send you a fresh one.
        </p>
        <a href={`https://wa.me/${siteConfig.whatsapp}`} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          style={{ background: '#25D366' }}>
          <MessageCircle size={14} /> Contact us on WhatsApp
        </a>
      </div>
    </div>
  )

  const isPaid       = invoice.status === 'paid'
  const isVoid       = invoice.status === 'void'
  const isActionable = !isPaid && !isVoid
  const dueDays      = daysUntil(invoice.due_at)
  const isOverdue    = dueDays !== null && dueDays < 0
  const totalHours   = computeTotalHours(invoice)

  const whatsappText = encodeURIComponent(
    `Assalamu alaikum,\n\nI'd like to pay for:\nStudent: ${invoice.student_name ?? '—'}\nAmount: ${formatMinor(invoice.total_minor, invoice.currency)}\n\nJazak Allahu khairan.`
  )

  const statusConfig = {
    draft:   { label: 'Draft',        bg: '#f3f4f6', color: '#374151', icon: <Clock size={11} /> },
    sent:    { label: 'Payment Due',  bg: '#fef3c7', color: '#92400e', icon: <Clock size={11} /> },
    paid:    { label: 'Paid',         bg: '#dcfce7', color: '#166534', icon: <CheckCircle2 size={11} /> },
    overdue: { label: 'Overdue',      bg: '#fee2e2', color: '#991b1b', icon: <AlertTriangle size={11} /> },
    void:    { label: 'Cancelled',    bg: '#f3f4f6', color: '#6b7280', icon: <XCircle size={11} /> },
  }
  const st = statusConfig[invoice.status]

  const sessionLines = invoice.lines.filter(l => l.kind !== 'discount' && l.kind !== 'adjustment')

  return (
    <div className="min-h-screen relative flex flex-col" style={{ backgroundColor: '#0b3222' }}>
      <IslamicBackground />

      {/* Toast */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-gray-900 text-white text-sm font-medium shadow-2xl flex items-center gap-2.5">
          <span>🚧</span> {toast}
        </div>
      )}

      <div className="relative z-10 flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-md">

          {/* ── Academy header ──────────────────────────────────────────── */}
          <div className="text-center mb-8">
            {/* Bismillah — prominent */}
            <div className="mb-5">
              <p
                className="text-xl leading-relaxed"
                style={{
                  color: '#e8c96a',
                  fontFamily: '"Amiri", "Scheherazade New", "Traditional Arabic", Georgia, serif',
                  textShadow: '0 0 24px rgba(201,169,64,0.45), 0 1px 3px rgba(0,0,0,0.4)',
                  letterSpacing: '0.04em',
                }}
              >
                بسم الله الرحمن الرحيم
              </p>
              <div className="flex items-center justify-center gap-3 mt-2">
                <div className="flex-1 h-px max-w-[80px]" style={{ background: 'linear-gradient(to right, transparent, rgba(201,169,64,0.4))' }} />
                <svg width="8" height="8" viewBox="0 0 8 8"><polygon points="4,0 5,3 8,4 5,5 4,8 3,5 0,4 3,3" fill="rgba(201,169,64,0.6)" /></svg>
                <div className="flex-1 h-px max-w-[80px]" style={{ background: 'linear-gradient(to left, transparent, rgba(201,169,64,0.4))' }} />
              </div>
            </div>

            {/* Wordmark */}
            <div className="flex flex-col items-center leading-none">
              <span
                className="font-display font-semibold tracking-tight text-white"
                style={{ fontSize: '2.4rem', textShadow: '0 2px 16px rgba(0,0,0,0.35)' }}
              >
                Alrayan
              </span>
              <span
                className="font-sans font-semibold uppercase mt-1"
                style={{ fontSize: '0.6rem', letterSpacing: '0.22em', color: '#c9a940' }}
              >
                Quran Academy
              </span>
            </div>
          </div>

          {/* ── Main card ───────────────────────────────────────────────── */}
          <div className="rounded-3xl overflow-hidden shadow-2xl"
            style={{ background: '#faf8f2', border: '1px solid rgba(201,169,64,0.25)', boxShadow: '0 25px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(201,169,64,0.1)' }}>

            {/* ── Hero — student name + amount ─────────────────────────── */}
            <div className="relative px-8 pt-9 pb-10 text-center overflow-hidden"
              style={{ background: 'linear-gradient(155deg, #0b3222 0%, #155235 55%, #1a6040 100%)' }}>

              {/* Decorative concentric circles (top-right) */}
              <div className="absolute top-3 right-4 opacity-10">
                {[36, 56, 76].map(s => (
                  <div key={s} className="absolute rounded-full" style={{ width: s, height: s, border: '1px solid #c9a940', top: (76-s)/2, left: (76-s)/2 }} />
                ))}
              </div>
              {/* Decorative concentric circles (bottom-left) */}
              <div className="absolute bottom-8 left-4 opacity-10">
                {[28, 44, 60].map(s => (
                  <div key={s} className="absolute rounded-full" style={{ width: s, height: s, border: '1px solid #c9a940', top: (60-s)/2, left: (60-s)/2 }} />
                ))}
              </div>

              {/* Status badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-5"
                style={{ background: st.bg, color: st.color }}>
                {st.icon}
                {st.label}
              </div>

              {/* Student name */}
              {invoice.student_name && (
                <h1 className="text-2xl font-bold text-white mb-1 leading-snug">
                  {invoice.student_name}
                </h1>
              )}

              {/* Course */}
              {invoice.course_name && (
                <p className="text-sm mb-5" style={{ color: 'rgba(201,169,64,0.65)' }}>
                  {invoice.course_name}
                </p>
              )}

              {/* Amount */}
              <p className="text-[3.25rem] font-black tracking-tight leading-none"
                style={{ color: '#f0d070', textShadow: '0 2px 20px rgba(201,169,64,0.3)' }}>
                {formatMinor(invoice.total_minor, invoice.currency)}
              </p>

              {/* Due / paid */}
              {isActionable && invoice.due_at && (
                <p className={`text-sm font-medium mt-3 ${isOverdue ? 'text-red-300' : dueDays === 0 ? 'text-amber-300' : ''}`}
                  style={!isOverdue && dueDays !== 0 ? { color: 'rgba(255,255,255,0.45)' } : {}}>
                  {isOverdue
                    ? `⚠ Overdue by ${Math.abs(dueDays!)} day${Math.abs(dueDays!) !== 1 ? 's' : ''}`
                    : dueDays === 0 ? '⚡ Due today'
                    : `Due ${fmtDate(invoice.due_at)}`}
                </p>
              )}
              {isPaid && invoice.paid_at && (
                <p className="text-sm font-medium mt-3" style={{ color: 'rgba(134,239,172,0.8)' }}>
                  ✓ Paid on {fmtDate(invoice.paid_at)}
                </p>
              )}

              {/* Curved bottom */}
              <div className="absolute -bottom-px left-[-3%] right-[-3%] h-8 rounded-t-[50%]"
                style={{ background: '#faf8f2' }} />
            </div>

            {/* ── Quick-detail pills ───────────────────────────────────── */}
            <div className="px-7 pt-4 pb-5">
              <div className={`grid gap-4 ${totalHours !== null ? 'grid-cols-3' : 'grid-cols-2'}`}>
                <DetailCell
                  label="Due Date"
                  value={fmtDate(invoice.due_at)}
                  warning={isOverdue}
                />
                <DetailCell
                  label="Currency"
                  value={invoice.currency}
                />
                {totalHours !== null && (
                  <DetailCell
                    label="Total Hours"
                    value={`${totalHours} hr${totalHours !== 1 ? 's' : ''}`}
                  />
                )}
              </div>
            </div>

            {/* ── Ornamental divider ───────────────────────────────────── */}
            <OrnamentDivider />

            {/* ── Line items ───────────────────────────────────────────── */}
            {sessionLines.length > 0 && (
              <div className="px-7 pt-3 pb-5 space-y-3">
                {sessionLines.map((line, i) => (
                  <div key={i} className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 leading-snug">{line.description}</p>
                      {line.session_duration_min && line.quantity > 1 && (
                        <p className="text-[11px] mt-0.5" style={{ color: '#a08c65' }}>
                          {line.quantity} sessions × {line.session_duration_min} min
                        </p>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-gray-800 tabular-nums shrink-0">
                      {formatMinor(line.line_total_minor, invoice.currency)}
                    </p>
                  </div>
                ))}

                {/* Discount / credit rows */}
                {(invoice.discount_minor > 0 || invoice.wallet_credit_minor > 0) && (
                  <div className="pt-2 space-y-1.5 border-t" style={{ borderColor: '#f0e8d0' }}>
                    {invoice.discount_minor > 0 && (
                      <div className="flex justify-between text-sm">
                        <span style={{ color: '#a08c65' }}>Discount</span>
                        <span className="font-medium text-emerald-600">−{formatMinor(invoice.discount_minor, invoice.currency)}</span>
                      </div>
                    )}
                    {invoice.wallet_credit_minor > 0 && (
                      <div className="flex justify-between text-sm">
                        <span style={{ color: '#a08c65' }}>Credit applied</span>
                        <span className="font-medium text-emerald-600">−{formatMinor(invoice.wallet_credit_minor, invoice.currency)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Total row */}
                <div className="flex justify-between items-center pt-3 border-t" style={{ borderColor: '#e8d5a0' }}>
                  <span className="text-sm font-bold text-gray-900">Total</span>
                  <span className="text-base font-bold tabular-nums" style={{ color: '#6b4e10' }}>
                    {formatMinor(invoice.total_minor, invoice.currency)}
                  </span>
                </div>
              </div>
            )}

            {/* ── Paid confirmation banner ─────────────────────────────── */}
            {isPaid && (
              <>
                <OrnamentDivider gold={false} />
                <div className="mx-6 mb-5 rounded-2xl px-5 py-4 flex items-center gap-4"
                  style={{ background: 'linear-gradient(135deg, #052e16, #14532d)', border: '1px solid rgba(22,163,74,0.25)' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <CheckCircle2 size={20} className="text-green-300" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">Payment Confirmed</p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(134,239,172,0.75)' }}>
                      Jazak Allahu khairan{invoice.student_name ? `, ${invoice.student_name.split(' ')[0]}` : ''}!
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* ── Payment methods ──────────────────────────────────────── */}
            {isActionable && (
              <>
                {/* Labeled section divider */}
                <div className="flex items-center gap-3 px-6 py-3">
                  <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(201,169,64,0.45))' }} />
                  <span className="text-[9px] font-bold uppercase tracking-[0.18em] shrink-0" style={{ color: '#a08c65' }}>
                    Choose Payment Method
                  </span>
                  <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, rgba(201,169,64,0.45))' }} />
                </div>
                <div className="px-6 pb-6 space-y-3">
                  <ComingSoonMethod
                    emoji="💳"
                    label="Credit or Debit Card"
                    brands={<VisaMastercardIcons />}
                    onSelect={() => showToast('Card payments coming soon — use WhatsApp for now')}
                  />
                  <ManualMethods whatsappText={whatsappText} />
                </div>
              </>
            )}

            {/* ── Download PDF ─────────────────────────────────────────── */}
            <div className="px-6 pb-5">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors hover:bg-amber-50/60 disabled:opacity-50"
                style={{ border: '1px solid #e8d5a0', color: '#8a6a30' }}
              >
                {downloading
                  ? <span className="w-4 h-4 border-2 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
                  : <Download size={14} />}
                {downloading ? 'Preparing PDF…' : 'Download Invoice'}
              </button>
            </div>

            {/* ── Trust footer ─────────────────────────────────────────── */}
            <div className="px-6 py-4 flex items-center justify-center gap-7 rounded-b-3xl"
              style={{ background: 'linear-gradient(to bottom, #f5edd8, #ede0c4)', borderTop: '1px solid #e2ceaa' }}>
              <span className="flex items-center gap-1.5 text-[11px]" style={{ color: '#8a7050' }}>
                <Lock size={10} style={{ color: '#c9a940' }} /> SSL Secure
              </span>
              <span className="flex items-center gap-1.5 text-[11px]" style={{ color: '#8a7050' }}>
                <Shield size={10} style={{ color: '#c9a940' }} /> Official
              </span>
              <span className="flex items-center gap-1.5 text-[11px]" style={{ color: '#8a7050' }}>
                <Check size={10} style={{ color: '#c9a940' }} /> {siteConfig.name}
              </span>
            </div>

          </div>

          <p className="text-center text-[10px] mt-5 pb-8" style={{ color: 'rgba(255,255,255,0.18)' }}>
            © {new Date().getFullYear()} {siteConfig.name} · All rights reserved
          </p>
        </div>
      </div>
    </div>
  )
}
