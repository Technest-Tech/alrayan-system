'use client'
import { useState, useEffect } from 'react'
import { useReplaceSchedulePatterns, usePreviewSchedulePatterns } from '@/hooks/system/useSchedulePatterns'
import type { PatternPreviewOccurrence } from '@/types/system/session'

interface PatternEntry {
  day_of_week: number
  start_time: string
  duration_min: number
}

interface Props {
  studentId: number
  timezone: string
  sessionsPerMonth?: number
  sessionDurationMin?: number
  initialPatterns?: PatternEntry[]
  additionalStudentIds?: number[]
  onSaved?: () => void
  onCancel?: () => void
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2).toString().padStart(2, '0')
  const m = i % 2 === 0 ? '00' : '30'
  return `${h}:${m}`
})

export function RecurringPatternBuilder({
  studentId,
  timezone,
  sessionsPerMonth,
  sessionDurationMin = 60,
  initialPatterns = [],
  additionalStudentIds = [],
  onSaved,
  onCancel,
}: Props) {
  const [effectiveDate, setEffectiveDate] = useState(() => new Date().toISOString().split('T')[0])
  const [patterns, setPatterns]           = useState<PatternEntry[]>(initialPatterns)
  const [preview, setPreview]             = useState<PatternPreviewOccurrence[]>([])
  const [conflicts, setConflicts]         = useState<unknown[]>([])
  const [forceConflicts, setForceConflicts] = useState(false)

  const replace  = useReplaceSchedulePatterns()
  const doPreview = usePreviewSchedulePatterns()

  const targetSessions = sessionsPerMonth ? Math.round(sessionsPerMonth / 4) : null

  const toggleDay = (day: number) => {
    if (patterns.find(p => p.day_of_week === day)) {
      setPatterns(prev => prev.filter(p => p.day_of_week !== day))
    } else {
      setPatterns(prev => [...prev, { day_of_week: day, start_time: '18:00', duration_min: sessionDurationMin }].sort((a, b) => a.day_of_week - b.day_of_week))
    }
  }

  const updatePattern = (day: number, field: keyof PatternEntry, value: string | number) => {
    setPatterns(prev => prev.map(p => p.day_of_week === day ? { ...p, [field]: value } : p))
  }

  const countOk = targetSessions === null || patterns.length === targetSessions

  // Debounced preview
  useEffect(() => {
    if (patterns.length === 0) { setPreview([]); setConflicts([]); return }
    const t = setTimeout(() => {
      doPreview.mutate(
        { studentId, effectiveDate, patterns },
        {
          onSuccess: (data) => {
            const result = data as { occurrences: PatternPreviewOccurrence[]; conflicts: unknown[] }
            setPreview(result.occurrences)
            setConflicts(result.conflicts)
          },
        }
      )
    }, 600)
    return () => clearTimeout(t)
  }, [patterns, effectiveDate])

  const handleSave = async () => {
    await replace.mutateAsync({ studentId, effectiveDate, patterns, forceConflicts })
    for (const sibId of additionalStudentIds) {
      await replace.mutateAsync({ studentId: sibId, effectiveDate, patterns, forceConflicts })
    }
    onSaved?.()
  }

  return (
    <div className="space-y-6">
      {/* Effective date */}
      <div>
        <label className="text-sm font-medium">Effective from</label>
        <input
          type="date"
          className="mt-1 px-3 py-2 rounded-md border bg-background text-sm"
          value={effectiveDate}
          min={new Date().toISOString().split('T')[0]}
          onChange={e => setEffectiveDate(e.target.value)}
        />
      </div>

      {/* Day chips */}
      <div>
        <label className="text-sm font-medium mb-2 block">Days of week</label>
        <div className="flex gap-2">
          {DAY_NAMES.map((name, i) => {
            const active = patterns.some(p => p.day_of_week === i)
            return (
              <button
                key={i}
                onClick={() => toggleDay(i)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                  active ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'
                }`}
              >
                {name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Pattern rows */}
      {patterns.length > 0 && (
        <div className="space-y-2">
          {patterns.map(p => (
            <div key={p.day_of_week} className="flex items-center gap-3 p-3 rounded-md border">
              <span className="text-sm font-medium w-10">{DAY_NAMES[p.day_of_week]}</span>
              <select
                className="text-sm px-2 py-1 rounded border bg-background"
                value={p.start_time}
                onChange={e => updatePattern(p.day_of_week, 'start_time', e.target.value)}
              >
                {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <span className="text-sm text-muted-foreground">{p.duration_min} min · {timezone}</span>
              <button
                onClick={() => setPatterns(prev => prev.filter(x => x.day_of_week !== p.day_of_week))}
                className="ml-auto text-muted-foreground hover:text-destructive text-sm"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Session count validation */}
      {targetSessions !== null && (
        <div className={`text-sm font-medium ${countOk ? 'text-green-700' : 'text-orange-600'}`}>
          Total: {patterns.length}/week × 4 weeks = {patterns.length * 4} sessions/month
          {countOk ? ' ✓' : ` (expected ~${sessionsPerMonth})`}
        </div>
      )}

      {/* Live preview */}
      {preview.length > 0 && (
        <div>
          <div className="text-sm font-medium mb-2">Live preview — next 4 weeks</div>
          <div className="rounded-md border overflow-hidden max-h-48 overflow-y-auto">
            {preview.slice(0, 12).map((occ, i) => (
              <div key={i} className={`flex items-center justify-between px-3 py-2 text-sm border-b last:border-0 ${occ.has_conflict ? 'bg-orange-50' : ''}`}>
                <span>{new Date(occ.start).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                <span className="text-muted-foreground">
                  {new Date(occ.start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                  –{new Date(occ.end).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </span>
                <span className="text-xs text-muted-foreground">{occ.teacher}</span>
                {occ.has_conflict && <span className="text-xs text-orange-600">⚠</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conflict override */}
      {conflicts.length > 0 && (
        <div className="rounded-md bg-orange-50 border border-orange-200 p-3">
          <div className="text-sm font-medium text-orange-800 mb-1">⚠ {conflicts.length} conflict(s) found</div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={forceConflicts} onChange={e => setForceConflicts(e.target.checked)} />
            <span className="text-sm text-orange-700">Save anyway with override (audit-logged)</span>
          </label>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {onCancel && (
          <button onClick={onCancel} className="px-4 py-2 text-sm rounded border hover:bg-muted">
            Cancel
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={replace.isPending || patterns.length === 0 || (conflicts.length > 0 && !forceConflicts)}
          className="px-4 py-2 text-sm rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {replace.isPending ? 'Saving…' : 'Save schedule'}
        </button>
      </div>
    </div>
  )
}
