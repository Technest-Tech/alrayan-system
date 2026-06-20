'use client'
import { useState, useEffect, useRef } from 'react'
import type { Session, SessionReport } from '@/types/system/session'
import { useSubmitReport, useSessionReport } from '@/hooks/system/useSessionReports'
import { useI18n } from '@/lib/system/i18n'

interface Props {
  session: Session
  onSubmitted?: () => void
}

const PERF_OPTIONS = [
  { value: 'excellent',         key: 'sessionReports.perfExcellent' },
  { value: 'good',              key: 'sessionReports.perfGood' },
  { value: 'needs_improvement', key: 'sessionReports.perfNeedsImprovement' },
]

const DRAFT_KEY = (id: number) => `session_report_draft_${id}`

export function SessionReportForm({ session, onSubmitted }: Props) {
  const { t } = useI18n()
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
    const interval = setInterval(() => {
      localStorage.setItem(DRAFT_KEY(session.id), JSON.stringify({
        covered_text: coveredText, performance, homework_text: homeworkText, next_session_notes: nextSessionNotes,
      }))
      setDraftSaved(true)
      setTimeout(() => setDraftSaved(false), 1500)
    }, 5000)
    return () => clearInterval(interval)
  }, [coveredText, performance, homeworkText, nextSessionNotes, session.id])

  if (isLoading) return <div className="text-sm text-muted-foreground">{t('common.loading')}</div>

  // Read-only mode if already submitted
  if (existing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-green-700 font-medium">✅ {t('sessionReports.reportSubmitted')}</div>
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
        <label className="text-sm font-medium">{t('sessionReports.coveredLabel')} <span className="text-destructive">*</span></label>
        <textarea
          className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm resize-none"
          rows={4}
          placeholder={t('sessionReports.coveredPlaceholder')}
          value={coveredText}
          onChange={e => setCoveredText(e.target.value)}
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
          <span>{draftSaved ? `✓ ${t('sessionReports.autoSaved')}` : t('sessionReports.autoSaving')}</span>
          <span>{t('sessionReports.charCount', { n: String(coveredText.length) })}</span>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium block mb-2">{t('sessionReports.performanceLabel')}</label>
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
              <span className="text-sm">{t(o.key)}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">{t('sessionReports.homeworkLabel')} <span className="text-muted-foreground text-xs">({t('sessionReports.optional')})</span></label>
        <textarea
          className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm resize-none"
          rows={2}
          placeholder={t('sessionReports.homeworkPlaceholder')}
          value={homeworkText}
          onChange={e => setHomeworkText(e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm font-medium">{t('sessionReports.nextSessionLabel')} <span className="text-muted-foreground text-xs">({t('sessionReports.optional')})</span></label>
        <textarea
          className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm resize-none"
          rows={2}
          placeholder={t('sessionReports.nextSessionPlaceholder')}
          value={nextSessionNotes}
          onChange={e => setNextSessionNotes(e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSaveDraft}
          className="px-4 py-2 text-sm rounded border hover:bg-muted"
        >
          {t('sessionReports.saveDraft')}
        </button>
        <button
          onClick={handleSubmit}
          disabled={submit.isPending || !coveredText.trim()}
          className="px-4 py-2 text-sm rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {submit.isPending ? t('common.submitting') : t('sessionReports.submitReport')}
        </button>
      </div>
    </div>
  )
}

function ReportReadView({ report }: { report: SessionReport }) {
  const { t } = useI18n()
  const PERF_LABELS: Record<string, string> = {
    excellent: t('sessionReports.perfExcellent'),
    good: t('sessionReports.perfGood'),
    needs_improvement: t('sessionReports.perfNeedsImprovement'),
  }
  return (
    <div className="space-y-3 text-sm">
      <div><span className="font-medium">{t('sessionReports.readCovered')}</span> <span className="text-muted-foreground">{report.covered_text}</span></div>
      <div><span className="font-medium">{t('sessionReports.readPerformance')}</span> <span className="text-muted-foreground">{PERF_LABELS[report.performance]}</span></div>
      {report.homework_text && <div><span className="font-medium">{t('sessionReports.readHomework')}</span> <span className="text-muted-foreground">{report.homework_text}</span></div>}
      {report.next_session_notes && <div><span className="font-medium">{t('sessionReports.readNextSession')}</span> <span className="text-muted-foreground">{report.next_session_notes}</span></div>}
      <div className="text-xs text-muted-foreground">{t('sessionReports.submittedAt', { date: new Date(report.submitted_at).toLocaleString() })}</div>
    </div>
  )
}
