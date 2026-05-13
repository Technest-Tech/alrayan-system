'use client'
import { useState, useEffect, useRef } from 'react'
import type { Session, SessionReport } from '@/types/system/session'
import { useSubmitReport, useSessionReport } from '@/hooks/system/useSessionReports'

interface Props {
  session: Session
  onSubmitted?: () => void
}

const PERF_OPTIONS = [
  { value: 'excellent',         label: 'Excellent' },
  { value: 'good',              label: 'Good' },
  { value: 'needs_improvement', label: 'Needs improvement' },
]

const DRAFT_KEY = (id: number) => `session_report_draft_${id}`

export function SessionReportForm({ session, onSubmitted }: Props) {
  const { data: existing, isLoading } = useSessionReport(session.id)
  const submit = useSubmitReport()

  const [coveredText, setCoveredText]           = useState('')
  const [performance, setPerformance]           = useState<string>('good')
  const [homeworkText, setHomeworkText]         = useState('')
  const [nextSessionNotes, setNextSessionNotes] = useState('')
  const [draftSaved, setDraftSaved]             = useState(false)

  // Load draft from localStorage on mount
  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY(session.id))
    if (draft) {
      try {
        const d = JSON.parse(draft)
        setCoveredText(d.covered_text ?? '')
        setPerformance(d.performance ?? 'good')
        setHomeworkText(d.homework_text ?? '')
        setNextSessionNotes(d.next_session_notes ?? '')
      } catch {}
    }
  }, [session.id])

  // Autosave draft every 5s
  useEffect(() => {
    if (!coveredText && !homeworkText) return
    const t = setInterval(() => {
      localStorage.setItem(DRAFT_KEY(session.id), JSON.stringify({
        covered_text: coveredText, performance, homework_text: homeworkText, next_session_notes: nextSessionNotes,
      }))
      setDraftSaved(true)
      setTimeout(() => setDraftSaved(false), 1500)
    }, 5000)
    return () => clearInterval(t)
  }, [coveredText, performance, homeworkText, nextSessionNotes, session.id])

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>

  // Read-only mode if already submitted
  if (existing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-green-700 font-medium">✅ Report submitted</div>
        <ReportReadView report={existing} />
      </div>
    )
  }

  const handleSubmit = () => {
    submit.mutate(
      {
        sessionId: session.id,
        data: { covered_text: coveredText, performance, homework_text: homeworkText || undefined, next_session_notes: nextSessionNotes || undefined },
      },
      {
        onSuccess: () => {
          localStorage.removeItem(DRAFT_KEY(session.id))
          onSubmitted?.()
        },
      }
    )
  }

  const handleSaveDraft = () => {
    localStorage.setItem(DRAFT_KEY(session.id), JSON.stringify({
      covered_text: coveredText, performance, homework_text: homeworkText, next_session_notes: nextSessionNotes,
    }))
    setDraftSaved(true)
    setTimeout(() => setDraftSaved(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">What was covered <span className="text-destructive">*</span></label>
        <textarea
          className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm resize-none"
          rows={4}
          placeholder="Reviewed Surah Al-Fatihah, focus on madd…"
          value={coveredText}
          onChange={e => setCoveredText(e.target.value)}
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
          <span>{draftSaved ? '✓ Auto-saved' : 'auto-saving every 5s'}</span>
          <span>{coveredText.length} / 2000 chars</span>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium block mb-2">Performance</label>
        <div className="flex gap-4">
          {PERF_OPTIONS.map(o => (
            <label key={o.value} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name={`perf_${session.id}`}
                value={o.value}
                checked={performance === o.value}
                onChange={() => setPerformance(o.value)}
              />
              <span className="text-sm">{o.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Homework / assignment <span className="text-muted-foreground text-xs">(optional)</span></label>
        <textarea
          className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm resize-none"
          rows={2}
          placeholder="Practice madd letters daily…"
          value={homeworkText}
          onChange={e => setHomeworkText(e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Notes for next session <span className="text-muted-foreground text-xs">(optional)</span></label>
        <textarea
          className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm resize-none"
          rows={2}
          placeholder="Continue with Surah Al-Baqarah, ayat 1–10…"
          value={nextSessionNotes}
          onChange={e => setNextSessionNotes(e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSaveDraft}
          className="px-4 py-2 text-sm rounded border hover:bg-muted"
        >
          Save draft
        </button>
        <button
          onClick={handleSubmit}
          disabled={submit.isPending || !coveredText.trim()}
          className="px-4 py-2 text-sm rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {submit.isPending ? 'Submitting…' : 'Submit report'}
        </button>
      </div>
    </div>
  )
}

function ReportReadView({ report }: { report: SessionReport }) {
  const PERF_LABELS: Record<string, string> = { excellent: 'Excellent', good: 'Good', needs_improvement: 'Needs improvement' }
  return (
    <div className="space-y-3 text-sm">
      <div><span className="font-medium">Covered:</span> <span className="text-muted-foreground">{report.covered_text}</span></div>
      <div><span className="font-medium">Performance:</span> <span className="text-muted-foreground">{PERF_LABELS[report.performance]}</span></div>
      {report.homework_text && <div><span className="font-medium">Homework:</span> <span className="text-muted-foreground">{report.homework_text}</span></div>}
      {report.next_session_notes && <div><span className="font-medium">Next session:</span> <span className="text-muted-foreground">{report.next_session_notes}</span></div>}
      <div className="text-xs text-muted-foreground">Submitted {new Date(report.submitted_at).toLocaleString()}</div>
    </div>
  )
}
