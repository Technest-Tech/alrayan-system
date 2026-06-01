'use client'
import { useState, useEffect, useRef } from 'react'
import {
  X, Star, CheckCircle2, ClipboardList, User, CalendarDays,
  Clock, Sparkles, Copy, Check, BookOpen, AlertCircle,
  ImageDown, Download, Loader2, MessageSquare, Send, ChevronDown,
} from 'lucide-react'
import { toPng } from 'html-to-image'
import { toast } from 'sonner'
import type { Session } from '@/types/system/session'
import { useSubmitReport, useSessionReport } from '@/hooks/system/useSessionReports'
import { useMarkAttendance, useSendSessionReportWhatsApp } from '@/hooks/system/useSessions'
import { useTeacher } from '@/hooks/system/useTeachers'
import { SessionReportCard } from './SessionReportCard'
import type { SessionReportCardData } from './SessionReportCard'

/* ─── types ──────────────────────────────────────────── */
interface SessionExtras {
  strengths:       string
  weaknesses:      string
  recommendations: string
  parent_report:   string
}

/* ─── helpers ────────────────────────────────────────── */
function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function mapPerformance(p: string): 'excellent' | 'good' | 'needs_improvement' {
  if (['exceptional', 'excellent', 'very_good'].includes(p)) return 'excellent'
  if (['good', 'average'].includes(p)) return 'good'
  return 'needs_improvement'
}

function generateParentReport(
  studentName: string,
  teacherName: string | null | undefined,
  date: string,
  covered: string,
  performance: string,
  strengths: string,
  weaknesses: string,
  recommendations: string,
  homework: string,
): string {
  const perfEmoji: Record<string, string> = {
    exceptional: '🌟', excellent: '⭐', very_good: '✨',
    good: '👍', average: '📈', below_average: '💪',
  }
  const perfPhrase: Record<string, string> = {
    exceptional:   'truly exceptional — a natural talent mashaAllah',
    excellent:     'excellent — focused, committed and clearly excelling',
    very_good:     'very good — strong momentum with great potential ahead',
    good:          'good — consistent effort and solid understanding',
    average:       'progressing well — continued practice will bring great results',
    below_average: 'working hard — every consistent effort brings meaningful growth',
  }

  const lines: string[] = []
  lines.push(`🌙 *Al-Rayan Academy — Session Report*`)
  lines.push(`━━━━━━━━━━━━━━━━━━━━━━`)
  lines.push(``)
  lines.push(`Assalamu Alaikum wa Rahmatullahi wa Barakatuh 🤍`)
  lines.push(``)
  lines.push(`Dear Parent,`)
  lines.push(``)
  lines.push(`We are pleased to share an update on *${studentName}'s* session on *${formatDay(date)}*${teacherName ? ` with teacher *${teacherName}*` : ''}.`)
  lines.push(``)

  if (covered) {
    lines.push(`📚 *What We Covered*`)
    lines.push(covered)
    lines.push(``)
  }

  lines.push(`${perfEmoji[performance] ?? '✨'} *Session Performance*`)
  lines.push(`${studentName}'s performance was ${perfPhrase[performance] ?? 'good'}.`)
  lines.push(``)

  if (strengths) {
    lines.push(`💚 *Strengths*`)
    lines.push(strengths)
    lines.push(``)
  }

  if (weaknesses) {
    lines.push(`🎯 *Areas to Focus On*`)
    lines.push(weaknesses)
    lines.push(`_(These are completely normal and are exactly what our curriculum is designed to address.)_`)
    lines.push(``)
  }

  if (homework) {
    lines.push(`📝 *Homework / Practice*`)
    lines.push(homework)
    lines.push(``)
  }

  if (recommendations) {
    lines.push(`📋 *Plan for Next Session*`)
    lines.push(recommendations)
    lines.push(``)
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━━━━`)
  lines.push(`Jazakum Allahu Khayran for your continued trust. 🌿`)
  lines.push(``)
  lines.push(`*Al-Rayan Academy Team*`)
  lines.push(`📖 Quran | Tajweed | Islamic Studies`)

  return lines.join('\n')
}

function generateTeacherMessage(
  studentName: string,
  teacherName: string | null | undefined,
  date: string,
  duration: number,
): string {
  const lines: string[] = []
  lines.push(`🎓 *Session Report Request — Al-Rayan Academy*`)
  lines.push(`━━━━━━━━━━━━━━━━━━━━━━`)
  lines.push(``)
  lines.push(`Assalamu Alaikum${teacherName ? ` *${teacherName}*` : ''},`)
  lines.push(``)
  lines.push(`Please fill in the session report for:`)
  lines.push(`👤 Student: *${studentName}*`)
  lines.push(`📅 Date: *${new Date(date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}*`)
  lines.push(`🕐 Time: *${new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}* · *${duration} min*`)
  lines.push(``)
  lines.push(`Please reply to each point below 👇`)
  lines.push(``)
  lines.push(`*1️⃣ What did you cover today?*`)
  lines.push(`→ `)
  lines.push(``)
  lines.push(`*2️⃣ Overall performance:*`)
  lines.push(`_(Exceptional / Excellent / Very Good / Good / Average / Needs Work)_`)
  lines.push(`→ `)
  lines.push(``)
  lines.push(`*3️⃣ Student strengths:*`)
  lines.push(`→ `)
  lines.push(``)
  lines.push(`*4️⃣ Areas to improve:*`)
  lines.push(`→ `)
  lines.push(``)
  lines.push(`*5️⃣ Homework assigned:*`)
  lines.push(`→ `)
  lines.push(``)
  lines.push(`*6️⃣ Notes for next session:*`)
  lines.push(`→ `)
  lines.push(``)
  lines.push(`━━━━━━━━━━━━━━━━━━━━━━`)
  lines.push(`Jazakum Allahu Khayran 🌿`)
  lines.push(`*Al-Rayan Academy Admin*`)
  return lines.join('\n')
}

/* ─── sub-components ─────────────────────────────────── */
function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid rgb(var(--border-default,229 233 240))' }}>
      <div className="flex items-center gap-2 px-4 py-3 border-b"
        style={{ borderColor: 'rgb(var(--border-default,229 233 240))', background: 'rgb(248 250 252)' }}>
        <span style={{ color: 'rgb(14 124 90)' }}>{icon}</span>
        <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgb(90 100 112)' }}>{title}</p>
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </div>
  )
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'rgb(90 100 112)' }}>
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

const inp = 'w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)] transition-shadow resize-none'
const inpStyle = { borderColor: 'rgb(var(--border-default,229 233 240))', background: '#fff', color: 'rgb(11 31 58)' }

const PERF_OPTIONS = [
  { value: 'exceptional',   label: 'Exceptional', color: 'rgb(14 124 90)',   bg: 'rgb(14 124 90 / 0.1)' },
  { value: 'excellent',     label: 'Excellent',   color: 'rgb(30 90 171)',   bg: 'rgb(30 90 171 / 0.1)' },
  { value: 'very_good',     label: 'Very Good',   color: 'rgb(59 130 246)',  bg: 'rgb(59 130 246 / 0.08)' },
  { value: 'good',          label: 'Good',        color: 'rgb(107 114 128)', bg: 'rgb(107 114 128 / 0.08)' },
  { value: 'average',       label: 'Average',     color: 'rgb(180 83 9)',    bg: 'rgb(217 119 6 / 0.1)' },
  { value: 'below_average', label: 'Needs Work',  color: 'rgb(220 38 38)',   bg: 'rgb(220 38 38 / 0.08)' },
]

const DRAFT_KEY = (id: number) => `session_report_draft_${id}`

/* ─── props ──────────────────────────────────────────── */
interface Props {
  session:     Session | null
  open:        boolean
  studentName: string
  onClose:     () => void
  onSubmitted?: () => void
}

/* ─── main modal ─────────────────────────────────────── */
export function SessionReportModal({ session, open, studentName, onClose, onSubmitted }: Props) {
  const submit         = useSubmitReport()
  const markAttendance = useMarkAttendance()
  const sendWA         = useSendSessionReportWhatsApp()
  // Load existing report (if any) so opening "Report ✓" pre-fills the form.
  const { data: existingReport } = useSessionReport(open && session?.has_report ? session.id : null)
  // Fetch teacher details for WhatsApp number
  const { data: teacherData } = useTeacher(open ? (session?.teacher_id ?? 0) : 0)

  const [performance,      setPerformance]      = useState('good')
  const [covered,          setCovered]          = useState('')
  const [strengths,        setStrengths]        = useState('')
  const [weaknesses,       setWeaknesses]       = useState('')
  const [recommendations,  setRecommendations]  = useState('')
  const [homework,         setHomework]         = useState('')
  const [parentReport,     setParentReport]     = useState('')
  const [draftSaved,       setDraftSaved]       = useState(false)
  const [copied,           setCopied]           = useState(false)
  const [teacherMsgCopied, setTeacherMsgCopied] = useState(false)
  const [teacherMsgOpen,   setTeacherMsgOpen]   = useState(false)
  const [previewUrl,       setPreviewUrl]       = useState<string | null>(null)
  const [isGenerating,     setIsGenerating]     = useState(false)
  // Track which Wassender button is in-flight so only it shows the spinner.
  // sendWA.isPending is shared across all 3 send actions, so we need local state.
  const [activeSend,       setActiveSend]       = useState<null | 'image' | 'text' | 'teacher'>(null)

  const cardRef = useRef<HTMLDivElement>(null)

  /* load existing report (if any) first, then layer any newer local draft on top */
  useEffect(() => {
    if (!open || !session) return

    // Step 1: seed from the saved server report
    if (existingReport) {
      setPerformance(existingReport.performance       ?? 'good')
      setCovered(existingReport.covered_text          ?? '')
      setHomework(existingReport.homework_text        ?? '')
      // Server report only stores 4 fields; the rest of the form
      // (strengths/weaknesses/recommendations/parent_report) are UI-side
      // helpers that live in localStorage only.
    }

    // Step 2: overlay any local draft (more recent unsubmitted edits)
    const raw = localStorage.getItem(DRAFT_KEY(session.id))
    if (raw) {
      try {
        const d = JSON.parse(raw)
        if (d.performance)     setPerformance(d.performance)
        if (d.covered)         setCovered(d.covered)
        if (d.strengths)       setStrengths(d.strengths)
        if (d.weaknesses)      setWeaknesses(d.weaknesses)
        if (d.recommendations) setRecommendations(d.recommendations)
        if (d.homework)        setHomework(d.homework)
        if (d.parentReport)    setParentReport(d.parentReport)
      } catch {}
    }
  }, [open, session?.id, existingReport])

  /* autosave */
  useEffect(() => {
    if (!session || !covered) return
    const t = setInterval(() => {
      localStorage.setItem(DRAFT_KEY(session.id), JSON.stringify({
        performance, covered, strengths, weaknesses, recommendations, homework, parentReport,
      }))
      setDraftSaved(true)
      setTimeout(() => setDraftSaved(false), 1500)
    }, 8000)
    return () => clearInterval(t)
  }, [performance, covered, strengths, weaknesses, recommendations, homework, parentReport, session])

  if (!open || !session) return null

  const isPending = submit.isPending || markAttendance.isPending

  function handleGenerateReport() {
    setParentReport(generateParentReport(
      studentName,
      session!.teacher?.name,
      session!.scheduled_start,
      covered, performance, strengths, weaknesses, recommendations, homework,
    ))
  }

  function handleCopyParentReport() {
    navigator.clipboard.writeText(parentReport)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const cardData: SessionReportCardData = {
    studentName,
    teacherName:     session?.teacher?.name ?? '',
    date:            session?.scheduled_start ?? '',
    duration:        session?.duration_min ?? 0,
    performance, covered, strengths, weaknesses, recommendations, homework,
  }

  async function handleGenerateImage() {
    if (!cardRef.current) return
    setIsGenerating(true)
    setPreviewUrl(null)
    try {
      const url = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true })
      setPreviewUrl(url)
    } catch {
      toast.error('Failed to generate image — try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  function handleDownloadImage() {
    if (!previewUrl) return
    const a = document.createElement('a')
    a.href = previewUrl
    a.download = `${studentName.replace(/\s+/g, '_')}_Session_Report.png`
    a.click()
  }

  /* ─── WhatsApp send: text ─────────────────────────── */
  async function handleSendTextOnWhatsApp() {
    if (!session) return
    if (!parentReport.trim()) {
      toast.error('Generate or write the parent report text first.')
      return
    }
    setActiveSend('text')
    try {
      const res = await sendWA.mutateAsync({
        sessionId: session.id,
        kind:      'text',
        text:      parentReport,
      })
      toast.success(`Sent to ${res.recipient} ✓`)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to send via WhatsApp.'
      toast.error(msg)
    } finally {
      setActiveSend(null)
    }
  }

  /* ─── WhatsApp send: image ────────────────────────── */
  async function handleSendImageOnWhatsApp() {
    if (!session) return
    if (!cardRef.current) return
    setActiveSend('image')
    try {
      // Generate fresh PNG (or reuse preview) right before sending so the
      // image always matches the current form state.
      const dataUrl = previewUrl ?? (await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true }))
      if (!previewUrl) setPreviewUrl(dataUrl)

      const res = await sendWA.mutateAsync({
        sessionId: session.id,
        kind:      'image',
        image:     dataUrl,
        caption:   `Session Report — ${studentName}`,
      })
      toast.success(`Image sent to ${res.recipient} ✓`)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to send image via WhatsApp.'
      toast.error(msg)
    } finally {
      setActiveSend(null)
    }
  }

  async function handleSubmit() {
    if (!covered.trim()) { toast.error('Please fill in what was covered.'); return }

    const extras: SessionExtras = { strengths, weaknesses, recommendations, parent_report: parentReport }

    try {
      if (session!.status !== 'attended') {
        await markAttendance.mutateAsync({ id: session!.id, status: 'attended' })
      }
      await submit.mutateAsync({
        sessionId: session!.id,
        data: {
          covered_text:       covered,
          performance:        mapPerformance(performance),
          homework_text:      homework || undefined,
          next_session_notes: JSON.stringify(extras),
        },
      })
      localStorage.removeItem(DRAFT_KEY(session!.id))
      toast.success('Session report submitted.')
      onSubmitted?.()
      onClose()
    } catch {
      toast.error('Failed to submit report.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* backdrop */}
      <div className="absolute inset-0 bg-[rgb(11,31,58)]/50 backdrop-blur-sm" onClick={onClose} />

      {/* dialog */}
      <div className="relative w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ background: 'rgb(244 246 250)', border: '1px solid rgb(var(--border-default,229 233 240))', maxHeight: '92vh' }}>

        {/* gradient strip */}
        <div className="h-1 shrink-0" style={{ background: 'linear-gradient(90deg, rgb(14 124 90), rgb(30 90 171), rgb(124 58 237))' }} />

        {/* header */}
        <div className="shrink-0 px-5 py-4 flex items-start gap-4"
          style={{ background: '#fff', borderBottom: '1px solid rgb(var(--border-default,229 233 240))' }}>
          <div className="flex items-center justify-center w-11 h-11 rounded-2xl shrink-0"
            style={{ background: 'linear-gradient(135deg, rgb(14 124 90 / 0.12), rgb(30 90 171 / 0.12))' }}>
            <ClipboardList size={20} style={{ color: 'rgb(14 124 90)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base" style={{ color: 'rgb(11 31 58)' }}>Session Report</p>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'rgb(90 100 112)' }}>
                <User size={11} className="opacity-60" />{studentName}
              </span>
              <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'rgb(90 100 112)' }}>
                <CalendarDays size={11} className="opacity-60" />{formatDay(session.scheduled_start)}
              </span>
              <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'rgb(90 100 112)' }}>
                <Clock size={11} className="opacity-60" />{formatTime(session.scheduled_start)} — {session.duration_min} min
              </span>
              {session.teacher?.name && (
                <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'rgb(90 100 112)' }}>
                  <User size={11} className="opacity-60" />{session.teacher.name}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-black/5 transition-colors opacity-40 hover:opacity-80 shrink-0">
            <X size={16} />
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Teacher message template — collapsible */}
          {(() => {
            const msg = generateTeacherMessage(
              studentName, session.teacher?.name, session.scheduled_start, session.duration_min,
            )
            const teacherRec = teacherData as { phone?: string | null; whatsapp?: string | null } | undefined
            const teacherPhone = (teacherRec?.whatsapp || teacherRec?.phone || '').replace(/\D/g, '')

            const sendTeacherTemplate = async () => {
              if (!session) return
              setActiveSend('teacher')
              try {
                const res = await sendWA.mutateAsync({
                  sessionId: session.id,
                  kind:      'text',
                  text:      msg,
                  target:    'teacher',
                })
                toast.success(`Template sent to teacher (${res.recipient}) ✓`)
              } catch (e: unknown) {
                const errMsg = e instanceof Error ? e.message : 'Failed to send to teacher.'
                toast.error(errMsg)
              } finally {
                setActiveSend(null)
              }
            }
            const isSendingTeacher = activeSend === 'teacher'

            return (
              <div className="rounded-2xl overflow-hidden"
                style={{ background: '#fff', border: '1px solid rgb(var(--border-default,229 233 240))' }}>

                {/* toggle header */}
                <button type="button"
                  onClick={() => setTeacherMsgOpen(v => !v)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-black/[0.015]"
                  style={{
                    background: 'rgb(248 250 252)',
                    borderBottom: teacherMsgOpen ? '1px solid rgb(var(--border-default,229 233 240))' : 'none',
                  }}>
                  <div className="flex items-center gap-2">
                    <MessageSquare size={14} style={{ color: 'rgb(30 90 171)' }} />
                    <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgb(90 100 112)' }}>
                      Request from Teacher
                    </span>
                  </div>
                  <ChevronDown size={14} className="opacity-40 transition-transform duration-200"
                    style={{ transform: teacherMsgOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                </button>

                {/* collapsible body */}
                {teacherMsgOpen && (
                  <div className="p-4 space-y-3">
                    <p className="text-xs" style={{ color: 'rgb(90 100 112)' }}>
                      Send this message to the teacher on WhatsApp — they fill in each answer and reply. Paste their response into the form below.
                    </p>

                    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgb(30 90 171 / 0.2)' }}>
                      {/* message toolbar */}
                      <div className="flex items-center justify-between gap-2 px-3 py-2 flex-wrap"
                        style={{ background: 'rgb(30 90 171 / 0.05)', borderBottom: '1px solid rgb(30 90 171 / 0.12)' }}>
                        <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgb(30 90 171)' }}>
                          WhatsApp Template
                        </span>
                        <div className="flex items-center gap-1.5">
                          {/* Copy */}
                          <button type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(msg)
                              setTeacherMsgCopied(true)
                              setTimeout(() => setTeacherMsgCopied(false), 2000)
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors"
                            style={{ background: '#fff', color: 'rgb(30 90 171)', borderColor: 'rgb(30 90 171 / 0.3)' }}>
                            {teacherMsgCopied ? <><Check size={10} />Copied!</> : <><Copy size={10} />Copy</>}
                          </button>
                          {/* Send via Wassender (direct WhatsApp delivery, no manual click-through) */}
                          <button type="button"
                            onClick={sendTeacherTemplate}
                            disabled={!teacherPhone || activeSend !== null}
                            title={teacherPhone
                              ? `Send to teacher's WhatsApp (${teacherPhone}) via Wassender`
                              : 'Teacher has no WhatsApp/phone on file'}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
                            style={{ background: '#25D366', color: '#fff' }}>
                            {isSendingTeacher
                              ? <><Loader2 size={10} className="animate-spin" />Sending…</>
                              : <><Send size={10} />Send to Teacher</>}
                          </button>
                        </div>
                      </div>

                      {/* message preview */}
                      <div className="px-3 py-3" style={{ background: '#fff' }}>
                        <pre className="text-xs leading-relaxed whitespace-pre-wrap font-sans" style={{ color: 'rgb(11 31 58)' }}>
                          {msg}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })()}

          {/* Performance */}
          <SectionCard title="Performance Assessment" icon={<Star size={14} />}>
            <div>
              <FieldLabel required>Overall Performance</FieldLabel>
              <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
                {PERF_OPTIONS.map(o => (
                  <button key={o.value} type="button" onClick={() => setPerformance(o.value)}
                    className="py-2 px-1 rounded-xl text-xs font-semibold border transition-all"
                    style={performance === o.value
                      ? { background: o.bg, color: o.color, borderColor: o.color + '40', boxShadow: `0 2px 8px ${o.bg}` }
                      : { background: '#fff', color: 'rgb(90 100 112)', borderColor: 'rgb(var(--border-default,229 233 240))' }}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </SectionCard>

          {/* Session Content */}
          <SectionCard title="Session Content" icon={<BookOpen size={14} />}>
            <div>
              <FieldLabel required>What was covered</FieldLabel>
              <textarea
                className={inp} style={inpStyle} rows={3}
                placeholder="e.g. Reviewed Surah Al-Baqarah verses 1–10, practised noon sakinah rules, recitation corrections…"
                value={covered} onChange={e => setCovered(e.target.value)}
              />
              <p className="text-[10px] mt-1" style={{ color: 'rgb(156 163 175)' }}>
                {draftSaved ? '✓ Auto-saved' : `${covered.length} chars`}
              </p>
            </div>
            <div>
              <FieldLabel>Student Strengths</FieldLabel>
              <textarea
                className={inp} style={inpStyle} rows={2}
                placeholder="e.g. Excellent pronunciation, strong memorisation retention, attentive focus…"
                value={strengths} onChange={e => setStrengths(e.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Areas to Improve</FieldLabel>
              <textarea
                className={inp} style={inpStyle} rows={2}
                placeholder="e.g. Needs practice with madd rules, letter articulation for ق…"
                value={weaknesses} onChange={e => setWeaknesses(e.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Plan for Next Session</FieldLabel>
              <textarea
                className={inp} style={inpStyle} rows={2}
                placeholder="e.g. Continue from verse 11, review ghunnah rules, check homework…"
                value={recommendations} onChange={e => setRecommendations(e.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Homework / Practice Assigned</FieldLabel>
              <textarea
                className={inp} style={inpStyle} rows={2}
                placeholder="e.g. Practise Surah Al-Ikhlas 5× daily, review short vowels worksheet…"
                value={homework} onChange={e => setHomework(e.target.value)}
              />
            </div>
          </SectionCard>

          {/* Report Image */}
          <SectionCard title="Report Image" icon={<ImageDown size={14} />}>
            <p className="text-xs" style={{ color: 'rgb(90 100 112)' }}>
              Generate a branded report card to share with the parent via WhatsApp or print.
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <button type="button" onClick={handleGenerateImage}
                disabled={isGenerating || !covered.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, rgb(11 31 58), rgb(30 90 171))', color: '#fff', boxShadow: '0 2px 8px rgb(11 31 58 / 0.2)' }}>
                {isGenerating
                  ? <><Loader2 size={12} className="animate-spin" />Generating…</>
                  : <><ImageDown size={12} />{previewUrl ? 'Regenerate' : 'Generate Image'}</>}
              </button>
              {previewUrl && (
                <button type="button" onClick={handleDownloadImage}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{ background: 'rgb(14 124 90)', color: '#fff', boxShadow: '0 2px 8px rgb(14 124 90 / 0.25)' }}>
                  <Download size={12} />Download PNG
                </button>
              )}
              <button type="button"
                onClick={handleSendImageOnWhatsApp}
                disabled={activeSend !== null || isGenerating}
                title="Send report image to student's WhatsApp via Wassender"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                style={{ background: '#25D366', color: '#fff', boxShadow: '0 2px 8px rgb(37 211 102 / 0.3)' }}>
                {activeSend === 'image'
                  ? <><Loader2 size={12} className="animate-spin" />Sending…</>
                  : <><Send size={12} />Send Image on WhatsApp</>}
              </button>
            </div>
            {previewUrl && (
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgb(var(--border-default,229 233 240))', background: 'rgb(244 246 250)' }}>
                <img src={previewUrl} alt="Report card preview" className="w-full block" />
              </div>
            )}
            {!previewUrl && !isGenerating && (
              <div className="flex items-center justify-center rounded-xl py-8"
                style={{ background: 'rgb(248 250 252)', border: '2px dashed rgb(var(--border-default,229 233 240))' }}>
                <div className="text-center">
                  <ImageDown size={28} className="mx-auto mb-2 opacity-20" />
                  <p className="text-xs font-medium opacity-30">Preview will appear here</p>
                </div>
              </div>
            )}
            {isGenerating && (
              <div className="flex items-center justify-center rounded-xl py-8"
                style={{ background: 'rgb(248 250 252)', border: '1px solid rgb(var(--border-default,229 233 240))' }}>
                <div className="text-center">
                  <Loader2 size={24} className="mx-auto mb-2 animate-spin" style={{ color: 'rgb(30 90 171)' }} />
                  <p className="text-xs font-medium" style={{ color: 'rgb(90 100 112)' }}>Building your report card…</p>
                </div>
              </div>
            )}
          </SectionCard>

          {/* Parent Report */}
          <SectionCard title="Parent Report" icon={<Copy size={14} />}>
            <p className="text-xs" style={{ color: 'rgb(90 100 112)' }}>
              A professional WhatsApp-ready message for the parent. Auto-generate from your notes or write directly.
            </p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={handleGenerateReport}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={{ background: 'rgb(14 124 90 / 0.1)', color: 'rgb(14 124 90)', border: '1px solid rgb(14 124 90 / 0.2)' }}>
                <Sparkles size={12} />Auto-generate
              </button>
              {parentReport && (
                <button type="button" onClick={handleCopyParentReport}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                  style={{ background: copied ? 'rgb(14 124 90 / 0.1)' : 'rgb(248 250 252)', color: copied ? 'rgb(14 124 90)' : 'rgb(90 100 112)', border: '1px solid rgb(var(--border-default,229 233 240))' }}>
                  {copied ? <><Check size={11} />Copied!</> : <><Copy size={11} />Copy</>}
                </button>
              )}
              {parentReport && (
                <button type="button"
                  onClick={handleSendTextOnWhatsApp}
                  disabled={activeSend !== null}
                  title="Send this text message to the student's WhatsApp via Wassender"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                  style={{ background: '#25D366', color: '#fff', boxShadow: '0 2px 6px rgb(37 211 102 / 0.3)' }}>
                  {activeSend === 'text'
                    ? <><Loader2 size={11} className="animate-spin" />Sending…</>
                    : <><Send size={11} />Send Text on WhatsApp</>}
                </button>
              )}
            </div>
            <textarea
              className={inp} style={{ ...inpStyle, fontFamily: 'inherit', lineHeight: '1.6' }} rows={7}
              placeholder="Assalamu Alaikum, we are pleased to share the session report for…"
              value={parentReport} onChange={e => setParentReport(e.target.value)}
            />
            {parentReport && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl"
                style={{ background: 'rgb(30 90 171 / 0.05)', border: '1px solid rgb(30 90 171 / 0.15)' }}>
                <AlertCircle size={13} className="shrink-0 mt-0.5" style={{ color: 'rgb(30 90 171)' }} />
                <p className="text-xs" style={{ color: 'rgb(30 90 171)' }}>
                  Review before sending — this message will be shared directly with the parent via WhatsApp or email.
                </p>
              </div>
            )}
          </SectionCard>
        </div>

        {/* footer */}
        <div className="shrink-0 px-5 py-4 flex items-center justify-between gap-3"
          style={{ background: '#fff', borderTop: '1px solid rgb(var(--border-default,229 233 240))' }}>
          <p className="text-[11px]" style={{ color: 'rgb(156 163 175)' }}>
            {draftSaved ? '✓ Draft auto-saved' : 'Draft saves automatically'}
          </p>
          <div className="flex items-center gap-3">
            <button onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium border hover:bg-black/5 transition-colors"
              style={{ borderColor: 'rgb(var(--border-default,229 233 240))', color: 'rgb(90 100 112)' }}>
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={isPending || !covered.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, rgb(14 124 90), rgb(11 99 72))', boxShadow: '0 2px 12px rgb(14 124 90 / 0.35)' }}>
              <CheckCircle2 size={15} />
              {isPending ? 'Submitting…' : 'Submit Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Off-screen card for image capture */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0, pointerEvents: 'none', zIndex: -1 }}>
        <SessionReportCard ref={cardRef} data={cardData} />
      </div>
    </div>
  )
}
