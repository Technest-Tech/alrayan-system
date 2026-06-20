'use client'
import type { StudentTimelineEntry } from '@/types/system/student'
import {
  UserCheck, UserX, Pause, Play, BookOpen, CreditCard,
  MessageSquare, Bell, Settings, Circle,
} from 'lucide-react'
import { useI18n } from '@/lib/system/i18n'

const EVENT_ICONS: Record<string, React.ElementType> = {
  enrolled:       UserCheck,
  cancelled:      UserX,
  paused:         Pause,
  resumed:        Play,
  status_changed: Settings,
  session_added:  BookOpen,
  payment_added:  CreditCard,
  note_added:     MessageSquare,
  notification:   Bell,
}

interface StudentTimelineProps {
  entries: StudentTimelineEntry[]
  isLoading: boolean
}

export function StudentTimeline({ entries, isLoading }: StudentTimelineProps) {
  const { t } = useI18n()

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins  = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days  = Math.floor(diff / 86400000)
    if (mins < 2)   return t('students.timelineJustNow')
    if (mins < 60)  return t('students.timelineMinAgo', { n: String(mins) })
    if (hours < 24) return t('students.timelineHourAgo', { n: String(hours) })
    return t('students.timelineDayAgo', { n: String(days) })
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="w-8 h-8 rounded-xl animate-pulse shrink-0" style={{ background: 'rgb(var(--surface-card-2, 248 250 252))' }} />
            <div className="flex-1 space-y-1.5 pt-1">
              <div className="h-3 w-2/3 rounded animate-pulse" style={{ background: 'rgb(var(--surface-card-2, 248 250 252))' }} />
              <div className="h-3 w-1/3 rounded animate-pulse" style={{ background: 'rgb(var(--surface-card-2, 248 250 252))' }} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!entries.length) {
    return <p className="text-sm opacity-40 text-center py-10">{t('students.timelineEmpty')}</p>
  }

  return (
    <div className="space-y-1">
      {entries.map((entry, idx) => {
        const Icon = EVENT_ICONS[entry.event_type] ?? Circle
        const label = (entry.event_type as string).replace(/_/g, ' ')

        return (
          <div key={entry.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgb(var(--surface-card-2, 248 250 252))' }}
              >
                <Icon size={14} className="opacity-60" />
              </div>
              {idx < entries.length - 1 && (
                <div className="w-px flex-1 mt-1 mb-1" style={{ background: 'rgb(var(--border-default, 229 233 240))' }} />
              )}
            </div>
            <div className="pb-4 min-w-0">
              <p className="text-sm font-medium capitalize">{label}</p>
              <div className="flex items-center gap-2 text-xs opacity-50 mt-0.5">
                {entry.actor_name && <span>{entry.actor_name}</span>}
                {entry.actor_name && <span>·</span>}
                <span>{timeAgo(entry.created_at)}</span>
              </div>
              {entry.payload && Object.keys(entry.payload).length > 0 && (
                <div
                  className="mt-1.5 px-3 py-2 rounded-lg text-xs opacity-60"
                  style={{ background: 'rgb(var(--surface-card-2, 248 250 252))' }}
                >
                  {Object.entries(entry.payload).map(([k, v]) => (
                    <span key={k} className="mr-3">
                      <span className="font-medium">{k}:</span> {String(v)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
