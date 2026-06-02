'use client'
import { useState, useEffect, useRef } from 'react'
import {
  X, Star, CheckCircle2, ClipboardList, User, CalendarDays,
  Clock, Sparkles, Copy, Check, ChevronDown, BookOpen, AlertCircle,
  ImageDown, Download, Loader2,
} from 'lucide-react'
import { toPng } from 'html-to-image'
import { toast } from 'sonner'
import type { Session, SessionReport } from '@/types/system/session'
import { useSubmitReport, useSessionReport } from '@/hooks/system/useSessionReports'
import { TrialReportCard } from './TrialReportCard'
import type { TrialReportCardData } from './TrialReportCard'

/* ─── types ──────────────────────────────────────────── */
interface TrialExtras {
  trial_outcome: string
  recitation_accuracy: string
  tajweed_level: string
  engagement: string
  memorization: string
  strengths: string
  weaknesses: string
  recommendations: string
  parent_report: string
}

/* ─── helpers ────────────────────────────────────────── */
function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function parseExtras(raw: string | null | undefined): Partial<TrialExtras> {
  if (!raw) return {}
  try { return JSON.parse(raw) } catch { return {} }
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
  outcome: string,
  performance: string,
  strengths: string,
  weaknesses: string,
  recommendations: string,
): string {
  const perfEmoji: Record<string, string> = {
    exceptional:   '🌟',
    excellent:     '⭐',
    very_good:     '✨',
    good:          '👍',
    average:       '📈',
    below_average: '💪',
  }
  const perfPhrase: Record<string, string> = {
    exceptional:   'truly exceptional — a natural talent that left us genuinely impressed',
    excellent:     'excellent — confident, focused, and clearly gifted',
    very_good:     'very good — strong foundations with great potential ahead',
    good:          'good — a solid start with a clear path forward',
    average:       'promising — with the right guidance, great progress is within reach',
    below_average: 'at the beginning of a beautiful journey — every expert was once a beginner',
  }
  const outcomeBlock: Record<string, string> = {
    excellent_candidate:
      '🎉 *Our Recommendation*\nWe are delighted to welcome ' + studentName + ' to Al-Rayan Academy! Based on this trial, we strongly recommend enrolling right away. We are confident this will be a wonderful and fruitful journey.',
    good_candidate:
      '✅ *Our Recommendation*\nWe warmly recommend enrolling ' + studentName + '. With consistent practice and our structured curriculum, we are confident in their growth and success.',
    needs_follow_up:
      '🔄 *Our Recommendation*\nWe suggest scheduling a second free trial to help ' + studentName + ' settle in further before committing. We want to ensure the perfect fit.',
    not_interested:
      '🙏 *Thank You*\nWe truly appreciate the opportunity to meet ' + studentName + '. Our doors remain open whenever you are ready — we would love to welcome them in the future.',
    no_show: '',
  }

  const lines: string[] = []

  lines.push(`🌙 *Al-Rayan Academy — Trial Class Report*`)
  lines.push(`━━━━━━━━━━━━━━━━━━━━━━`)
  lines.push(``)
  lines.push(`Assalamu Alaikum wa Rahmatullahi wa Barakatuh 🤍`)
  lines.push(``)
  lines.push(`Dear Parent,`)
  lines.push(``)
  lines.push(`We are honoured to share the full report for *${studentName}'s* trial class, held on *${formatDay(date)}* with our teacher *${teacherName ?? 'one of our specialists'}*.`)
  lines.push(``)

  lines.push(`📚 *What We Covered*`)
  if (covered) {
    lines.push(covered)
  } else {
    lines.push(`A comprehensive assessment of recitation, Tajweed foundations, and learning readiness.`)
  }
  lines.push(``)

  lines.push(`${perfEmoji[performance] ?? '✨'} *Overall Performance*`)
  lines.push(`${studentName}'s performance was ${perfPhrase[performance] ?? 'good'}.`)
  lines.push(``)

  if (strengths) {
    lines.push(`💚 *Strengths We Noticed*`)
    lines.push(strengths)
    lines.push(``)
  }

  if (weaknesses) {
    lines.push(`🎯 *Areas to Develop*`)
    lines.push(`${weaknesses}`)
    lines.push(`_(These are completely normal for this level and are exactly what our program is designed for.)_`)
    lines.push(``)
  }

  if (recommendations) {
    lines.push(`📋 *Our Plan for ${studentName}*`)
    lines.push(recommendations)
    lines.push(``)
  }

  const outcomeMsg = outcomeBlock[outcome]
  if (outcomeMsg) {
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━`)
    lines.push(outcomeMsg)
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━`)
    lines.push(``)
  }

  lines.push(`Should you have any questions, we are always here for you. 💬`)
  lines.push(``)
  lines.push(`Jazakum Allahu Khayran 🌿`)
  lines.push(``)
  lines.push(`*Al-Rayan Academy Team*`)
  lines.push(`📖 Quran | Tajweed | Islamic Studies`)

  return lines.join('\n')
}

/* ─── sub-components ─────────────────────────────────── */
function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid rgb(var(--border-default,229 233 240))' }}>
      <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'rgb(var(--border-default,229 233 240))', background: 'rgb(248 250 252)' }}>
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

const inp = 'w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)] transition-shadow'
const inpStyle = { borderColor: 'rgb(var(--border-default,229 233 240))', background: '#fff', color: 'rgb(11 31 58)' }

function SelectField({ value, onChange, options, placeholder }: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string; desc?: string }[]
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [dropPos, setDropPos] = useState<{ top: number; left: number; width: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const selected = options.find(o => o.value === value)

  function handleToggle() {
    if (open) { setOpen(false); return }
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setDropPos({ top: r.bottom + 4, left: r.left, width: r.width })
    }
    setOpen(true)
  }

  return (
    <div>
      <button
        ref={btnRef}
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-sm text-left transition-shadow focus:ring-2 focus:ring-[rgb(14,124,90)]"
        style={{ borderColor: value ? 'rgb(14 124 90 / 0.5)' : 'rgb(var(--border-default,229 233 240))', background: '#fff', color: value ? 'rgb(11 31 58)' : 'rgb(156 163 175)' }}
      >
        <span className="truncate font-medium">{selected?.label ?? placeholder ?? 'Select…'}</span>
        <ChevronDown size={13} className="shrink-0 opacity-50" />
      </button>
      {open && dropPos && (
        <>
          <div className="fixed inset-0 z-[199]" onClick={() => setOpen(false)} />
          <div
            className="fixed z-[200] rounded-xl border shadow-xl overflow-y-auto"
            style={{
              top: dropPos.top,
              left: dropPos.left,
              width: dropPos.width,
              maxHeight: 280,
              background: '#fff',
              borderColor: 'rgb(var(--border-default,229 233 240))',
            }}
          >
            {options.map(o => (
              <button key={o.value} type="button"
                onClick={() => { onChange(o.value); setOpen(false) }}
                className="w-full px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
                style={o.value === value ? { background: 'rgb(14 124 90 / 0.08)' } : undefined}>
                <p className="text-sm font-medium" style={{ color: o.value === value ? 'rgb(14 124 90)' : 'rgb(11 31 58)' }}>{o.label}</p>
                {o.desc && <p className="text-[11px] mt-0.5" style={{ color: 'rgb(90 100 112)' }}>{o.desc}</p>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function RatingButtons({ value, onChange, options }: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string; color: string; bg: string }[]
}) {
  return (
    <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
      {options.map(o => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)}
          className="py-2 px-1 rounded-xl text-xs font-semibold border transition-all"
          style={value === o.value
            ? { background: o.bg, color: o.color, borderColor: o.color + '40', boxShadow: `0 2px 8px ${o.bg}` }
            : { background: '#fff', color: 'rgb(90 100 112)', borderColor: 'rgb(var(--border-default,229 233 240))' }}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* ─── read-only view ─────────────────────────────────── */
function TrialReportReadView({ report }: { report: SessionReport }) {
  const extras = parseExtras(report.next_session_notes)
  const [copied, setCopied] = useState(false)

  const outcomeLabels: Record<string, { label: string; color: string; bg: string }> = {
    excellent_candidate: { label: 'Excellent Candidate — Recommend Enrollment', color: 'rgb(14 124 90)', bg: 'rgb(14 124 90 / 0.08)' },
    good_candidate:      { label: 'Good Candidate — Recommend Enrollment',      color: 'rgb(30 90 171)', bg: 'rgb(30 90 171 / 0.08)' },
    needs_follow_up:     { label: 'Needs Follow-up',                             color: 'rgb(180 83 9)', bg: 'rgb(217 119 6 / 0.08)' },
    not_interested:      { label: 'Not Interested',                              color: 'rgb(107 114 128)', bg: 'rgb(107 114 128 / 0.08)' },
    no_show:             { label: 'No Show',                                     color: 'rgb(220 38 38)', bg: 'rgb(220 38 38 / 0.08)' },
  }

  const perfLabels: Record<string, string> = {
    exceptional: 'Exceptional', excellent: 'Excellent', very_good: 'Very Good',
    good: 'Good', average: 'Average', below_average: 'Below Average',
  }

  const outcome = outcomeLabels[extras.trial_outcome ?? '']

  function copyParentReport() {
    navigator.clipboard.writeText(extras.parent_report ?? '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
        style={{ background: 'rgb(14 124 90 / 0.06)', border: '1px solid rgb(14 124 90 / 0.2)' }}>
        <CheckCircle2 size={16} style={{ color: 'rgb(14 124 90)' }} />
        <p className="text-sm font-semibold" style={{ color: 'rgb(14 124 90)' }}>Trial report submitted</p>
        <span className="text-xs ml-auto" style={{ color: 'rgb(90 100 112)' }}>
          {new Date(report.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </div>

      {outcome && (
        <div className="px-3 py-2.5 rounded-xl font-semibold text-sm" style={{ background: outcome.bg, color: outcome.color }}>
          {outcome.label}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {extras.recitation_accuracy && (
          <div className="p-3 rounded-xl" style={{ background: 'rgb(248 250 252)', border: '1px solid rgb(var(--border-default,229 233 240))' }}>
            <p className="text-[10px] uppercase tracking-widest font-semibold mb-0.5" style={{ color: 'rgb(90 100 112)' }}>Recitation</p>
            <p className="text-sm font-semibold" style={{ color: 'rgb(11 31 58)' }}>{extras.recitation_accuracy.replace(/_/g, ' ')}</p>
          </div>
        )}
        {extras.tajweed_level && (
          <div className="p-3 rounded-xl" style={{ background: 'rgb(248 250 252)', border: '1px solid rgb(var(--border-default,229 233 240))' }}>
            <p className="text-[10px] uppercase tracking-widest font-semibold mb-0.5" style={{ color: 'rgb(90 100 112)' }}>Tajweed Level</p>
            <p className="text-sm font-semibold" style={{ color: 'rgb(11 31 58)' }}>{extras.tajweed_level.replace(/_/g, ' ')}</p>
          </div>
        )}
        {extras.engagement && (
          <div className="p-3 rounded-xl" style={{ background: 'rgb(248 250 252)', border: '1px solid rgb(var(--border-default,229 233 240))' }}>
            <p className="text-[10px] uppercase tracking-widest font-semibold mb-0.5" style={{ color: 'rgb(90 100 112)' }}>Engagement</p>
            <p className="text-sm font-semibold" style={{ color: 'rgb(11 31 58)' }}>{extras.engagement.replace(/_/g, ' ')}</p>
          </div>
        )}
        {extras.memorization && (
          <div className="p-3 rounded-xl" style={{ background: 'rgb(248 250 252)', border: '1px solid rgb(var(--border-default,229 233 240))' }}>
            <p className="text-[10px] uppercase tracking-widest font-semibold mb-0.5" style={{ color: 'rgb(90 100 112)' }}>Memorization</p>
            <p className="text-sm font-semibold" style={{ color: 'rgb(11 31 58)' }}>{extras.memorization.replace(/_/g, ' ')}</p>
          </div>
        )}
      </div>

      {report.covered_text && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'rgb(90 100 112)' }}>Session Overview</p>
          <p className="text-sm" style={{ color: 'rgb(11 31 58)' }}>{report.covered_text}</p>
        </div>
      )}

      {extras.strengths && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'rgb(90 100 112)' }}>Strengths</p>
          <p className="text-sm" style={{ color: 'rgb(11 31 58)' }}>{extras.strengths}</p>
        </div>
      )}
      {extras.weaknesses && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'rgb(90 100 112)' }}>Areas to Improve</p>
          <p className="text-sm" style={{ color: 'rgb(11 31 58)' }}>{extras.weaknesses}</p>
        </div>
      )}
      {report.homework_text && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'rgb(90 100 112)' }}>Homework / Practice</p>
          <p className="text-sm" style={{ color: 'rgb(11 31 58)' }}>{report.homework_text}</p>
        </div>
      )}

      {extras.parent_report && (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgb(14 124 90 / 0.25)' }}>
          <div className="flex items-center justify-between px-3 py-2" style={{ background: 'rgb(14 124 90 / 0.06)', borderBottom: '1px solid rgb(14 124 90 / 0.15)' }}>
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgb(14 124 90)' }}>Parent Report</p>
            <button onClick={copyParentReport}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-lg transition-colors"
              style={{ background: 'rgb(14 124 90)', color: '#fff' }}>
              {copied ? <><Check size={11} />Copied!</> : <><Copy size={11} />Copy to send</>}
            </button>
          </div>
          <div className="px-3 py-3 bg-white">
            <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: 'rgb(11 31 58)' }}>{extras.parent_report}</p>
          </div>
        </div>
      )}

      <div className="text-[11px] text-center" style={{ color: 'rgb(156 163 175)' }}>
        Overall performance: {perfLabels[report.performance] ?? report.performance}
      </div>
    </div>
  )
}

/* ─── main modal ─────────────────────────────────────── */
interface Props {
  session: Session | null
  open: boolean
  studentName: string
  onClose: () => void
  onSubmitted?: () => void
}

const PERF_OPTIONS = [
  { value: 'exceptional', label: 'Exceptional', color: 'rgb(14 124 90)',   bg: 'rgb(14 124 90 / 0.1)' },
  { value: 'excellent',   label: 'Excellent',   color: 'rgb(30 90 171)',   bg: 'rgb(30 90 171 / 0.1)' },
  { value: 'very_good',   label: 'Very Good',   color: 'rgb(59 130 246)',  bg: 'rgb(59 130 246 / 0.08)' },
  { value: 'good',        label: 'Good',        color: 'rgb(107 114 128)', bg: 'rgb(107 114 128 / 0.08)' },
  { value: 'average',     label: 'Average',     color: 'rgb(180 83 9)',    bg: 'rgb(217 119 6 / 0.1)' },
  { value: 'below_average', label: 'Needs Work', color: 'rgb(220 38 38)', bg: 'rgb(220 38 38 / 0.08)' },
]

const OUTCOME_OPTIONS = [
  { value: 'excellent_candidate', label: '⭐ Excellent Candidate',      desc: 'Strongly recommend immediate enrollment' },
  { value: 'good_candidate',      label: '✅ Good Candidate',           desc: 'Recommend enrollment with regular practice' },
  { value: 'needs_follow_up',     label: '🔄 Needs Follow-up',         desc: 'Schedule a second trial before deciding' },
  { value: 'not_interested',      label: '❌ Not Interested',           desc: 'Student / parent declined enrollment' },
  { value: 'no_show',             label: '🚫 No Show',                  desc: 'Student did not attend the trial' },
]

const RECITATION_OPTIONS = [
  { value: 'mastered',   label: 'Mastered',    desc: 'Fluent with no errors' },
  { value: 'very_good',  label: 'Very Good',   desc: 'Minor errors only' },
  { value: 'good',       label: 'Good',        desc: 'Some errors, self-corrects' },
  { value: 'fair',       label: 'Fair',        desc: 'Frequent errors, needs support' },
  { value: 'beginner',   label: 'Beginner',    desc: 'Learning alphabet / basics' },
]

const TAJWEED_OPTIONS = [
  { value: 'advanced',          label: 'Advanced',          desc: 'Applies rules consistently' },
  { value: 'intermediate',      label: 'Intermediate',      desc: 'Knows basic rules' },
  { value: 'beginner',          label: 'Beginner',          desc: 'Limited tajweed awareness' },
  { value: 'complete_beginner', label: 'Complete Beginner', desc: 'No prior tajweed knowledge' },
]

const ENGAGEMENT_OPTIONS = [
  { value: 'highly_engaged', label: 'Highly Engaged',  desc: 'Enthusiastic, focused, participates' },
  { value: 'engaged',        label: 'Engaged',         desc: 'Attentive and responsive' },
  { value: 'moderate',       label: 'Moderate',        desc: 'Sometimes distracted' },
  { value: 'low',            label: 'Low Engagement',  desc: 'Frequently distracted' },
]

const MEMORIZATION_OPTIONS = [
  { value: 'excellent', label: 'Excellent',  desc: 'Retains quickly' },
  { value: 'good',      label: 'Good',       desc: 'Retains with repetition' },
  { value: 'average',   label: 'Average',    desc: 'Needs extra review' },
  { value: 'needs_work', label: 'Needs Work', desc: 'Significant support required' },
]

const DRAFT_KEY = (id: number) => `trial_report_draft_${id}`

export function TrialReportModal({ session, open, studentName, onClose, onSubmitted }: Props) {
  const { data: existing, isLoading } = useSessionReport(open && session ? session.id : null)
  const submit = useSubmitReport()

  // form state
  const [outcome,        setOutcome]        = useState('excellent_candidate')
  const [performance,    setPerformance]    = useState('good')
  const [recitation,     setRecitation]     = useState('')
  const [tajweed,        setTajweed]        = useState('')
  const [engagement,     setEngagement]     = useState('')
  const [memorization,   setMemorization]   = useState('')
  const [covered,        setCovered]        = useState('')
  const [strengths,      setStrengths]      = useState('')
  const [weaknesses,     setWeaknesses]     = useState('')
  const [recommendations, setRecommendations] = useState('')
  const [homework,       setHomework]       = useState('')
  const [parentReport,   setParentReport]   = useState('')
  const [draftSaved,     setDraftSaved]     = useState(false)
  const [copied,         setCopied]         = useState(false)
  const [previewUrl,     setPreviewUrl]     = useState<string | null>(null)
  const [isGenerating,   setIsGenerating]   = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // load draft
  useEffect(() => {
    if (!open || !session) return
    const raw = localStorage.getItem(DRAFT_KEY(session.id))
    if (raw) {
      try {
        const d = JSON.parse(raw)
        setOutcome(d.outcome ?? 'excellent_candidate')
        setPerformance(d.performance ?? 'good')
        setRecitation(d.recitation ?? '')
        setTajweed(d.tajweed ?? '')
        setEngagement(d.engagement ?? '')
        setMemorization(d.memorization ?? '')
        setCovered(d.covered ?? '')
        setStrengths(d.strengths ?? '')
        setWeaknesses(d.weaknesses ?? '')
        setRecommendations(d.recommendations ?? '')
        setHomework(d.homework ?? '')
        setParentReport(d.parentReport ?? '')
      } catch {}
    }
  }, [open, session?.id])

  // autosave
  useEffect(() => {
    if (!session || !covered) return
    const t = setInterval(() => {
      localStorage.setItem(DRAFT_KEY(session.id), JSON.stringify({
        outcome, performance, recitation, tajweed, engagement, memorization,
        covered, strengths, weaknesses, recommendations, homework, parentReport,
      }))
      setDraftSaved(true)
      setTimeout(() => setDraftSaved(false), 1500)
    }, 8000)
    return () => clearInterval(t)
  }, [outcome, performance, recitation, tajweed, engagement, memorization,
      covered, strengths, weaknesses, recommendations, homework, parentReport, session])

  if (!open || !session) return null

  function handleGenerateReport() {
    const generated = generateParentReport(
      studentName,
      session!.teacher?.name,
      session!.scheduled_start,
      covered,
      outcome,
      performance,
      strengths,
      weaknesses,
      recommendations,
    )
    setParentReport(generated)
  }

  function handleCopyParentReport() {
    navigator.clipboard.writeText(parentReport)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const cardData: TrialReportCardData = {
    studentName,
    teacherName:  session?.teacher?.name ?? '',
    date:         session?.scheduled_start ?? '',
    duration:     session?.duration_min ?? 0,
    outcome, performance, recitation, tajweed, engagement, memorization,
    covered, strengths, weaknesses, recommendations, homework,
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
    a.download = `${studentName.replace(/\s+/g, '_')}_Trial_Report.png`
    a.click()
  }

  async function handleSubmit() {
    if (!session || !covered.trim()) { toast.error('Please fill in what was covered.'); return }

    const extras: TrialExtras = {
      trial_outcome:  outcome,
      recitation_accuracy: recitation,
      tajweed_level:  tajweed,
      engagement,
      memorization,
      strengths,
      weaknesses,
      recommendations,
      parent_report:  parentReport,
    }

    try {
      await submit.mutateAsync({
        sessionId: session.id,
        data: {
          covered_text:      covered,
          performance:       mapPerformance(performance),
          homework_text:     homework || undefined,
          next_session_notes: JSON.stringify(extras),
        },
      })
      localStorage.removeItem(DRAFT_KEY(session.id))
      toast.success('Trial report submitted.')
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
        <div className="shrink-0 px-5 py-4 flex items-start gap-4" style={{ background: '#fff', borderBottom: '1px solid rgb(var(--border-default,229 233 240))' }}>
          <div className="flex items-center justify-center w-11 h-11 rounded-2xl shrink-0"
            style={{ background: 'linear-gradient(135deg, rgb(14 124 90 / 0.12), rgb(30 90 171 / 0.12))' }}>
            <ClipboardList size={20} style={{ color: 'rgb(14 124 90)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base" style={{ color: 'rgb(11 31 58)' }}>Trial Class Report</p>
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

          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-gray-100" />)}
            </div>
          ) : existing ? (
            <TrialReportReadView report={existing} />
          ) : (
            <>
              {/* Trial Outcome */}
              <SectionCard title="Trial Outcome" icon={<Star size={14} />}>
                <div>
                  <FieldLabel required>What is your recommendation?</FieldLabel>
                  <SelectField value={outcome} onChange={setOutcome} options={OUTCOME_OPTIONS} />
                </div>
              </SectionCard>

              {/* Performance */}
              <SectionCard title="Performance Assessment" icon={<Sparkles size={14} />}>
                <div>
                  <FieldLabel required>Overall Performance</FieldLabel>
                  <RatingButtons value={performance} onChange={setPerformance} options={PERF_OPTIONS} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Recitation Accuracy</FieldLabel>
                    <SelectField value={recitation} onChange={setRecitation} options={RECITATION_OPTIONS} placeholder="Select level…" />
                  </div>
                  <div>
                    <FieldLabel>Tajweed Knowledge</FieldLabel>
                    <SelectField value={tajweed} onChange={setTajweed} options={TAJWEED_OPTIONS} placeholder="Select level…" />
                  </div>
                  <div>
                    <FieldLabel>Engagement &amp; Focus</FieldLabel>
                    <SelectField value={engagement} onChange={setEngagement} options={ENGAGEMENT_OPTIONS} placeholder="Select level…" />
                  </div>
                  <div>
                    <FieldLabel>Memorization Ability</FieldLabel>
                    <SelectField value={memorization} onChange={setMemorization} options={MEMORIZATION_OPTIONS} placeholder="Select level…" />
                  </div>
                </div>
              </SectionCard>

              {/* Session Content */}
              <SectionCard title="Session Content" icon={<BookOpen size={14} />}>
                <div>
                  <FieldLabel required>What was covered / assessed</FieldLabel>
                  <textarea
                    className={inp} style={inpStyle} rows={3}
                    placeholder="e.g. Assessed Surah Al-Fatihah recitation, introduced Noon Sakinah rules, evaluated reading pace…"
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
                    placeholder="e.g. Strong pronunciation, excellent focus, good memory recall…"
                    value={strengths} onChange={e => setStrengths(e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>Areas to Improve</FieldLabel>
                  <textarea
                    className={inp} style={inpStyle} rows={2}
                    placeholder="e.g. Needs practice with elongation (madd) rules, letter articulation for ق and غ…"
                    value={weaknesses} onChange={e => setWeaknesses(e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>Our Recommendation</FieldLabel>
                  <textarea
                    className={inp} style={inpStyle} rows={2}
                    placeholder="e.g. Begin with Noorani Qaida course, 3 sessions/week recommended…"
                    value={recommendations} onChange={e => setRecommendations(e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>Homework / Practice Assigned</FieldLabel>
                  <textarea
                    className={inp} style={inpStyle} rows={2}
                    placeholder="e.g. Practice Surah Al-Ikhlas daily, review short vowels worksheet…"
                    value={homework} onChange={e => setHomework(e.target.value)}
                  />
                </div>
              </SectionCard>

              {/* Report Image */}
              <SectionCard title="Report Image" icon={<ImageDown size={14} />}>
                <p className="text-xs" style={{ color: 'rgb(90 100 112)' }}>
                  Generate a beautiful branded report card to download and send directly to the parent via WhatsApp or print.
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <button type="button" onClick={handleGenerateImage}
                    disabled={isGenerating || !covered.trim()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, rgb(11 31 58), rgb(14 124 90))', color: '#fff', boxShadow: '0 2px 8px rgb(11 31 58 / 0.2)' }}>
                    {isGenerating
                      ? <><Loader2 size={12} className="animate-spin" />Generating…</>
                      : <><ImageDown size={12} />{previewUrl ? 'Regenerate' : 'Generate Image'}</>}
                  </button>
                  {previewUrl && (
                    <button type="button" onClick={handleDownloadImage}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{ background: 'rgb(14 124 90)', color: '#fff', boxShadow: '0 2px 8px rgb(14 124 90 / 0.25)' }}>
                      <Download size={12} />
                      Download PNG
                    </button>
                  )}
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
                      <Loader2 size={24} className="mx-auto mb-2 animate-spin" style={{ color: 'rgb(14 124 90)' }} />
                      <p className="text-xs font-medium" style={{ color: 'rgb(90 100 112)' }}>Building your report card…</p>
                    </div>
                  </div>
                )}
              </SectionCard>

              {/* Parent Report */}
              <SectionCard title="Parent Report" icon={<Copy size={14} />}>
                <p className="text-xs" style={{ color: 'rgb(90 100 112)' }}>
                  A professional message to share with the parent. Generate from your notes or write directly.
                </p>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={handleGenerateReport}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                    style={{ background: 'rgb(14 124 90 / 0.1)', color: 'rgb(14 124 90)', border: '1px solid rgb(14 124 90 / 0.2)' }}>
                    <Sparkles size={12} />
                    Auto-generate
                  </button>
                  {parentReport && (
                    <button type="button" onClick={handleCopyParentReport}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                      style={{ background: copied ? 'rgb(14 124 90 / 0.1)' : 'rgb(248 250 252)', color: copied ? 'rgb(14 124 90)' : 'rgb(90 100 112)', border: '1px solid rgb(var(--border-default,229 233 240))' }}>
                      {copied ? <><Check size={11} />Copied!</> : <><Copy size={11} />Copy</>}
                    </button>
                  )}
                </div>
                <textarea
                  className={inp} style={{ ...inpStyle, fontFamily: 'inherit', lineHeight: '1.6' }} rows={7}
                  placeholder="Assalamu Alaikum, we are pleased to share the trial class report for…"
                  value={parentReport} onChange={e => setParentReport(e.target.value)}
                />
                {parentReport && (
                  <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl"
                    style={{ background: 'rgb(30 90 171 / 0.05)', border: '1px solid rgb(30 90 171 / 0.15)' }}>
                    <AlertCircle size={13} className="shrink-0 mt-0.5" style={{ color: 'rgb(30 90 171)' }} />
                    <p className="text-xs" style={{ color: 'rgb(30 90 171)' }}>
                      Review before sending. This message will be shared directly with the parent via WhatsApp or email.
                    </p>
                  </div>
                )}
              </SectionCard>
            </>
          )}
        </div>

        {/* footer */}
        {!isLoading && !existing && (
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
              <button onClick={handleSubmit} disabled={submit.isPending || !covered.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, rgb(14 124 90), rgb(11 99 72))', boxShadow: '0 2px 12px rgb(14 124 90 / 0.35)' }}>
                <CheckCircle2 size={15} />
                {submit.isPending ? 'Submitting…' : 'Submit Trial Report'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Off-screen card used for image capture — always mounted when modal is open */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0, pointerEvents: 'none', zIndex: -1 }}>
        <TrialReportCard ref={cardRef} data={cardData} />
      </div>
    </div>
  )
}
