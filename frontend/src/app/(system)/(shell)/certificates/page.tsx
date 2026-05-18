'use client'
import { useState, useCallback } from 'react'
import Link from 'next/link'
import { Download, Layers, FileText, ChevronLeft, CheckCircle2 } from 'lucide-react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { useCertificates } from '@/hooks/system/useCertificates'
import { CERTIFICATE_TYPE_LABELS, type CertificateType } from '@/types/system/certificate'
import {
  CertificateCanvas,
  downloadCertificatePDF,
  type CertData,
} from '@/components/system/certificates/CertificateCanvas'

type Tab = 'builder' | 'issued'
type Template = 'classic' | 'modern'

const CERT_YEAR = new Date().getFullYear()

const DEFAULT_DATA: CertData = {
  studentName:  '',
  typeLabel:    'Course Completion',
  title:        '',
  description:  '',
  courseName:   '',
  issuedOn:     new Date().toISOString().slice(0, 10),
  teacherName:  '',
  directorName: 'Academy Director',
  certNumber:   `CRT-${CERT_YEAR}-00001`,
}

// ─── 8-pointed khatam star for thumbnails ─────────────────────────────────────
const S8 = 'M50,5 L57.65,31.52 L81.82,18.18 L68.48,42.35 L95,50 L68.48,57.65 L81.82,81.82 L57.65,68.48 L50,95 L42.35,68.48 L18.18,81.82 L31.52,57.65 L5,50 L31.52,42.35 L18.18,18.18 L42.35,31.52 Z'
function ThumbnailStar({ cx, cy, size, fill, opacity = 1 }: { cx: number; cy: number; size: number; fill: string; opacity?: number }) {
  const s = size / 100
  return (
    <g transform={`translate(${cx - 50 * s},${cy - 50 * s}) scale(${s})`} opacity={opacity}>
      <path d={S8} fill={fill} />
    </g>
  )
}

// ─── Template Picker ──────────────────────────────────────────────────────────
function TemplatePicker({ onSelect }: { onSelect: (t: Template) => void }) {
  return (
    <div className="mt-8">
      <p className="text-sm opacity-50 mb-6">Choose a template to get started</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">

        {/* Classic — Quranic Gold */}
        <button
          onClick={() => onSelect('classic')}
          className="group text-left rounded-2xl overflow-hidden transition-all shadow-sm hover:shadow-lg"
          style={{ border: '2px solid rgb(var(--border-default))' }}
        >
          {/* Thumbnail */}
          <div style={{ background: '#FDF8EE', position: 'relative', height: 196, overflow: 'hidden' }}>
            {/* Faint diamond grid */}
            <svg style={{ position: 'absolute', inset: 0 }} width="100%" height="100%">
              <defs>
                <pattern id="th-cl-bg" x="0" y="0" width="18" height="18" patternUnits="userSpaceOnUse">
                  <path d="M9,0 L18,9 L9,18 L0,9 Z" fill="none" stroke="#C9A24B" strokeWidth="0.4" opacity="0.12" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#th-cl-bg)" />
            </svg>

            {/* Gold double border */}
            <div style={{ position: 'absolute', inset: 10, border: '2px solid #C9A24B' }} />
            <div style={{ position: 'absolute', inset: 14, border: '1px solid #C9A24B' }} />

            {/* Mid-point diamond ornaments */}
            <svg style={{ position: 'absolute', inset: 0 }} width="100%" height="100%">
              <polygon points="148,10 152,14 148,18 144,14" fill="#C9A24B" opacity="0.5" />
              <polygon points="148,178 152,182 148,186 144,182" fill="#C9A24B" opacity="0.5" />
              <polygon points="10,98 14,102 18,98 14,94" fill="#C9A24B" opacity="0.5" />
              <polygon points="278,98 282,102 286,98 282,94" fill="#C9A24B" opacity="0.5" />
            </svg>

            {/* Corner khatam stars */}
            <svg style={{ position: 'absolute', inset: 0 }} width="100%" height="100%" viewBox="0 0 296 196">
              <ThumbnailStar cx={14} cy={14} size={18} fill="#C9A24B" />
              <ThumbnailStar cx={282} cy={14} size={18} fill="#C9A24B" />
              <ThumbnailStar cx={14} cy={182} size={18} fill="#C9A24B" />
              <ThumbnailStar cx={282} cy={182} size={18} fill="#C9A24B" />
              {/* Large central watermark */}
              <ThumbnailStar cx={148} cy={98} size={80} fill="#C9A24B" opacity={0.04} />
            </svg>

            {/* Content */}
            <div style={{ position: 'absolute', inset: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, textAlign: 'center' }}>
              {/* Bismillah hint */}
              <div style={{ fontSize: 9, color: '#9B7A2E', fontFamily: 'serif', direction: 'rtl', marginBottom: 1 }}>بسم الله الرحمن الرحيم</div>
              {/* Logo circle */}
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#E8DFC8', border: '1px solid #C9A24B' }} />
              {/* Academy name */}
              <div style={{ width: 90, height: 5, background: '#7A6030', borderRadius: 2, opacity: 0.5 }} />
              {/* Arabic name */}
              <div style={{ width: 60, height: 5, background: '#C9A24B', borderRadius: 2, opacity: 0.6 }} />
              {/* Divider with star */}
              <svg width={110} height={10} viewBox="0 0 110 10">
                <line x1={0} y1={5} x2={48} y2={5} stroke="#C9A24B" strokeWidth={0.6} opacity={0.7} />
                <line x1={62} y1={5} x2={110} y2={5} stroke="#C9A24B" strokeWidth={0.6} opacity={0.7} />
                <ThumbnailStar cx={55} cy={5} size={12} fill="#C9A24B" />
              </svg>
              {/* Title */}
              <div style={{ width: 105, height: 8, background: '#1C1208', borderRadius: 2, opacity: 0.6 }} />
              {/* Student name with rules */}
              <div style={{ width: '80%', height: 0.5, background: '#C9A24B', opacity: 0.7 }} />
              <div style={{ width: 110, height: 9, background: '#0B1F3A', borderRadius: 2, opacity: 0.4 }} />
              <div style={{ width: '80%', height: 0.5, background: '#C9A24B', opacity: 0.7 }} />
              {/* Signatures */}
              <div style={{ display: 'flex', justifyContent: 'space-between', width: 110, marginTop: 5 }}>
                <div style={{ width: 42, height: 0.5, background: '#C9A24B', opacity: 0.5, marginTop: 8 }} />
                <div style={{ width: 42, height: 0.5, background: '#C9A24B', opacity: 0.5, marginTop: 8 }} />
              </div>
            </div>
          </div>
          {/* Label */}
          <div className="px-4 py-3" style={{ background: 'rgb(var(--surface-card))' }}>
            <div className="font-semibold text-sm">Quranic Gold</div>
            <div className="text-xs opacity-40 mt-0.5">Cream · Khatam stars · Bismillah · Arabesque borders</div>
          </div>
        </button>

        {/* Modern — Royal Islamic */}
        <button
          onClick={() => onSelect('modern')}
          className="group text-left rounded-2xl overflow-hidden transition-all shadow-sm hover:shadow-lg"
          style={{ border: '2px solid rgb(var(--border-default))' }}
        >
          {/* Thumbnail */}
          <div style={{ background: '#F9FAFB', position: 'relative', height: 196, overflow: 'hidden' }}>

            {/* Navy header with circle pattern */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 58, background: '#0B1F3A', overflow: 'hidden' }}>
              {/* Circle lattice in header */}
              <svg style={{ position: 'absolute', inset: 0, opacity: 0.18 }} width="100%" height="100%">
                <defs>
                  <pattern id="th-md-circ" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
                    <circle cx="0" cy="0" r="7" fill="none" stroke="white" strokeWidth="0.4" />
                    <circle cx="14" cy="0" r="7" fill="none" stroke="white" strokeWidth="0.4" />
                    <circle cx="0" cy="14" r="7" fill="none" stroke="white" strokeWidth="0.4" />
                    <circle cx="14" cy="14" r="7" fill="none" stroke="white" strokeWidth="0.4" />
                    <circle cx="7" cy="7" r="7" fill="none" stroke="white" strokeWidth="0.4" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#th-md-circ)" />
              </svg>
              {/* Khatam stars in header */}
              <svg style={{ position: 'absolute', inset: 0 }} width="100%" height="58" viewBox="0 0 296 58">
                <ThumbnailStar cx={148} cy={29} size={60} fill="#C9A24B" opacity={0.08} />
                <ThumbnailStar cx={8} cy={8} size={10} fill="white" opacity={0.2} />
                <ThumbnailStar cx={288} cy={8} size={10} fill="white" opacity={0.2} />
              </svg>
              {/* Gold bar */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2.5, background: '#C9A24B' }} />
              {/* Logo + name */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.18)' }} />
                <div>
                  <div style={{ width: 80, height: 6, background: 'rgba(255,255,255,0.75)', borderRadius: 2 }} />
                  <div style={{ width: 52, height: 4, background: 'rgba(201,162,75,0.85)', borderRadius: 2, marginTop: 4 }} />
                </div>
              </div>
            </div>

            {/* Left gold accent */}
            <div style={{ position: 'absolute', left: 0, top: 60.5, bottom: 22, width: 3, background: '#C9A24B' }} />
            {/* Right khatam column */}
            <svg style={{ position: 'absolute', right: 0, top: 58, width: 20, height: 116 }} viewBox="0 0 20 116">
              {[20, 48, 76, 104].map((y, i) => (
                <ThumbnailStar key={i} cx={10} cy={y} size={14} fill="#C9A24B" opacity={0.13} />
              ))}
            </svg>

            {/* Body diamond grid */}
            <svg style={{ position: 'absolute', top: 60, left: 0, right: 0, bottom: 22, opacity: 0.04 }} width="100%" height="100%">
              <defs>
                <pattern id="th-md-body" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M10,0 L20,10 L10,20 L0,10 Z" fill="none" stroke="#0B1F3A" strokeWidth="0.4" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#th-md-body)" />
            </svg>

            {/* Mock content */}
            <div style={{ position: 'absolute', top: 65, left: 8, right: 20, bottom: 26, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, textAlign: 'center' }}>
              <div style={{ fontSize: 7, color: '#C9A24B', direction: 'rtl', fontFamily: 'serif' }}>بسم الله الرحمن الرحيم</div>
              <div style={{ width: 55, height: 3, background: '#C9A24B', borderRadius: 2, opacity: 0.65 }} />
              <div style={{ width: 105, height: 10, background: '#0B1F3A', borderRadius: 2, opacity: 0.65 }} />
              {/* Diamond divider */}
              <svg width={90} height={8} viewBox="0 0 90 8">
                <line x1={0} y1={4} x2={37} y2={4} stroke="#C9A24B" strokeWidth={0.6} opacity={0.7} />
                <line x1={53} y1={4} x2={90} y2={4} stroke="#C9A24B" strokeWidth={0.6} opacity={0.7} />
                <ThumbnailStar cx={45} cy={4} size={10} fill="#C9A24B" />
              </svg>
              {/* Student name framed */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, width: 130 }}>
                <div style={{ flex: 1, height: 0.5, background: 'linear-gradient(to right, transparent, #C9A24B)' }} />
                <svg width={7} height={7} viewBox="0 0 100 100"><path d={S8} fill="#C9A24B" /></svg>
                <div style={{ flex: 1, height: 0.5, background: 'linear-gradient(to left, transparent, #C9A24B)' }} />
              </div>
              <div style={{ width: 115, height: 12, background: '#0B1F3A', borderRadius: 2, opacity: 0.35 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, width: 130 }}>
                <div style={{ flex: 1, height: 0.5, background: 'linear-gradient(to right, transparent, #C9A24B)' }} />
                <svg width={7} height={7} viewBox="0 0 100 100"><path d={S8} fill="#C9A24B" /></svg>
                <div style={{ flex: 1, height: 0.5, background: 'linear-gradient(to left, transparent, #C9A24B)' }} />
              </div>
              <div style={{ width: 72, height: 5.5, background: '#0E7C5A', borderRadius: 2, opacity: 0.7 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', width: 110, marginTop: 4 }}>
                <div style={{ width: 42, height: 1.5, background: '#0B1F3A', opacity: 0.4 }} />
                <div style={{ width: 42, height: 1.5, background: '#0B1F3A', opacity: 0.4 }} />
              </div>
            </div>
            {/* Green footer */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 22, background: '#0E7C5A', overflow: 'hidden' }}>
              <svg style={{ position: 'absolute', inset: 0, opacity: 0.08 }} width="100%" height="100%">
                <ThumbnailStar cx={148} cy={11} size={30} fill="white" />
              </svg>
            </div>
          </div>
          {/* Label */}
          <div className="px-4 py-3" style={{ background: 'rgb(var(--surface-card))' }}>
            <div className="font-semibold text-sm">Royal Islamic</div>
            <div className="text-xs opacity-40 mt-0.5">Navy header · Khatam stars · Bismillah · Circle lattice · Green footer</div>
          </div>
        </button>
      </div>
    </div>
  )
}

// ─── Field ─────────────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium opacity-50 mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full rounded-xl border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A24B]/40'
const inputStyle = { borderColor: 'rgb(var(--border-default))' }

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function CertificatesPage() {
  const [tab, setTab]           = useState<Tab>('builder')
  const [template, setTemplate] = useState<Template | null>(null)
  const [downloading, setDown]  = useState(false)
  const [certType, setCertType] = useState<CertificateType>('course_completion')
  const [data, setData]         = useState<CertData>(DEFAULT_DATA)

  const { data: issuedData, isLoading: issuedLoading } = useCertificates()
  const certs = issuedData?.data ?? []

  const setField = useCallback(<K extends keyof CertData>(k: K, v: CertData[K]) => {
    setData(d => ({ ...d, [k]: v }))
  }, [])

  function handleTypeChange(t: CertificateType) {
    setCertType(t)
    setField('typeLabel', CERTIFICATE_TYPE_LABELS[t])
  }

  async function handleDownload() {
    if (!template) return
    setDown(true)
    try { await downloadCertificatePDF(data, template) } finally { setDown(false) }
  }

  return (
    <>
      <PageHeader title="Certificate Builder" description="Design premium certificates and download as PDF." />

      {/* Tab bar */}
      <div
        className="flex gap-1 mt-5 p-1 rounded-xl w-fit"
        style={{ background: 'rgb(var(--surface-card-2))' }}
      >
        {([
          { id: 'builder', label: 'Builder', Icon: Layers },
          { id: 'issued',  label: 'Issued Certificates', Icon: FileText },
        ] as const).map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === id ? 'bg-white shadow-sm' : 'opacity-45 hover:opacity-70'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Builder tab ── */}
      {tab === 'builder' && (
        <div className="mt-6">
          {!template ? (
            <TemplatePicker onSelect={setTemplate} />
          ) : (
            <>
              {/* Back to template picker */}
              <button
                onClick={() => setTemplate(null)}
                className="flex items-center gap-1 text-xs opacity-40 hover:opacity-70 mb-5 transition-opacity"
              >
                <ChevronLeft size={13} />
                Change template
              </button>

              {/* Template badge */}
              <div className="flex items-center gap-2 mb-6">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                  style={{ background: 'rgb(var(--surface-card-2))', border: '1px solid rgb(var(--border-default))' }}
                >
                  <CheckCircle2 size={12} className="text-[#0E7C5A]" />
                  {template === 'classic' ? 'Classic Elegance' : 'Royal Modern'} selected
                </span>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-8">
                {/* ── Form ── */}
                <div className="space-y-4">
                  <Field label="Student Name">
                    <input
                      value={data.studentName}
                      onChange={e => setField('studentName', e.target.value)}
                      placeholder="e.g. Ahmed Al-Rashid"
                      className={inputCls} style={inputStyle}
                    />
                  </Field>

                  <Field label="Certificate Type">
                    <select
                      value={certType}
                      onChange={e => handleTypeChange(e.target.value as CertificateType)}
                      className={inputCls} style={inputStyle}
                    >
                      {(Object.keys(CERTIFICATE_TYPE_LABELS) as CertificateType[]).map(t => (
                        <option key={t} value={t}>{CERTIFICATE_TYPE_LABELS[t]}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Achievement Title">
                    <input
                      value={data.title}
                      onChange={e => setField('title', e.target.value)}
                      placeholder="e.g. Completed Juz Amma with Tajweed"
                      className={inputCls} style={inputStyle}
                    />
                  </Field>

                  <Field label="Description (optional)">
                    <textarea
                      value={data.description}
                      onChange={e => setField('description', e.target.value)}
                      rows={3}
                      placeholder="Additional details about the achievement…"
                      className={inputCls} style={inputStyle}
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Course Name">
                      <input
                        value={data.courseName}
                        onChange={e => setField('courseName', e.target.value)}
                        placeholder="e.g. Quran Memorization"
                        className={inputCls} style={inputStyle}
                      />
                    </Field>
                    <Field label="Date Issued">
                      <input
                        type="date"
                        value={data.issuedOn}
                        onChange={e => setField('issuedOn', e.target.value)}
                        className={inputCls} style={inputStyle}
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Teacher / Instructor">
                      <input
                        value={data.teacherName}
                        onChange={e => setField('teacherName', e.target.value)}
                        placeholder="Teacher Name"
                        className={inputCls} style={inputStyle}
                      />
                    </Field>
                    <Field label="Director Name">
                      <input
                        value={data.directorName}
                        onChange={e => setField('directorName', e.target.value)}
                        placeholder="Academy Director"
                        className={inputCls} style={inputStyle}
                      />
                    </Field>
                  </div>

                  <Field label="Certificate Number">
                    <input
                      value={data.certNumber}
                      onChange={e => setField('certNumber', e.target.value)}
                      placeholder="CRT-2026-00001"
                      className={`${inputCls} font-mono`} style={inputStyle}
                    />
                  </Field>

                  {/* Actions */}
                  <div className="pt-2 space-y-2">
                    <button
                      onClick={handleDownload}
                      disabled={downloading}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
                      style={{ background: '#C9A24B' }}
                    >
                      <Download size={15} />
                      {downloading ? 'Preparing PDF…' : 'Download PDF'}
                    </button>
                    <p className="text-center text-xs opacity-30">
                      Opens print dialog — save as PDF from there
                    </p>
                  </div>

                  {/* Link to issue + save via backend */}
                  <div className="pt-1 text-center">
                    <Link href="/certificates/new" className="text-xs opacity-40 hover:opacity-60 underline underline-offset-2">
                      Issue &amp; save to database instead →
                    </Link>
                  </div>
                </div>

                {/* ── Live Preview ── */}
                <div className="flex flex-col gap-3">
                  <div className="text-xs font-medium opacity-40 uppercase tracking-wide">Live Preview</div>
                  <div
                    className="rounded-2xl overflow-hidden shadow-md"
                    style={{ border: '1px solid rgb(var(--border-default))', background: '#e5e7eb' }}
                  >
                    <div className="p-4">
                      <CertificateCanvas data={data} template={template} />
                    </div>
                  </div>
                  <p className="text-xs opacity-30 text-center">
                    The downloaded PDF exactly matches this preview · A4 landscape
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Issued tab ── */}
      {tab === 'issued' && (
        <div className="mt-6 rounded-2xl overflow-hidden" style={{ border: '1px solid rgb(var(--border-default))' }}>
          <table className="w-full text-sm">
            <thead style={{ background: 'rgb(var(--surface-card-2))' }}>
              <tr>
                {['Number', 'Student', 'Type', 'Title', 'Issued', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium opacity-60 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {issuedLoading && Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} style={{ borderTop: '1px solid rgb(var(--border-default))' }}>
                  {[1,2,3,4,5,6].map(j => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 animate-pulse rounded" style={{ background: 'rgb(var(--surface-card-2))' }} />
                    </td>
                  ))}
                </tr>
              ))}
              {certs.map(c => (
                <tr key={c.id} className="hover:bg-black/[0.015] transition-colors" style={{ borderTop: '1px solid rgb(var(--border-default))' }}>
                  <td className="px-4 py-3">
                    <Link href={`/certificates/${c.id}`} className="font-mono text-xs opacity-60 hover:opacity-100">{c.certificate_number}</Link>
                  </td>
                  <td className="px-4 py-3 font-medium">{c.student?.name ?? '—'}</td>
                  <td className="px-4 py-3 opacity-60">{CERTIFICATE_TYPE_LABELS[c.type]}</td>
                  <td className="px-4 py-3 max-w-xs truncate">{c.title}</td>
                  <td className="px-4 py-3 whitespace-nowrap opacity-60">{c.issued_on}</td>
                  <td className="px-4 py-3">
                    {c.is_revoked
                      ? <span className="px-2 py-0.5 text-xs rounded-full bg-red-50 text-red-600 border border-red-100">Revoked</span>
                      : <span className="px-2 py-0.5 text-xs rounded-full bg-green-50 text-green-700 border border-green-100">Active</span>}
                  </td>
                </tr>
              ))}
              {!issuedLoading && certs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center opacity-30 text-sm">
                    No certificates issued yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
