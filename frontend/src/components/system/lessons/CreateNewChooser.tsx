'use client'
import { BookOpen, Repeat, Clock, X as XIcon } from 'lucide-react'

const BORDER   = 'rgb(var(--border-default,229 233 240))'
const NAVY     = 'rgb(11 31 58)'
const MUTED    = 'rgb(90 100 112)'
const TEAL_50  = '#F0FDFA'
const TEAL_100 = '#CCFBF1'
const TEAL_600 = '#0d9488'

export interface ChooserSelection {
  date: string            // YYYY-MM-DD
  startTime: string       // HH:MM
  durationMinutes: number
}

interface Props {
  open: boolean
  selection: ChooserSelection | null
  onChooseLesson: () => void
  onChooseSchedule: () => void
  onClose: () => void
}

function fmtSelected(sel: ChooserSelection): string {
  const d = new Date(`${sel.date}T${sel.startTime}`)
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

function fmtDuration(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return [h ? `${h}h` : '', m ? `${m}min` : ''].filter(Boolean).join(' ') || '0min'
}

export function CreateNewChooser({ open, selection, onChooseLesson, onChooseSchedule, onClose }: Props) {
  if (!open || !selection) return null

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4" style={{ background: 'rgba(11,31,58,0.35)' }} onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden"
        style={{ border: `1px solid ${BORDER}` }}
        onClick={e => e.stopPropagation()}
      >
        <div className="h-0.5" style={{ background: `linear-gradient(to right, ${TEAL_600}, #2DD4BF, transparent)` }} />
        <div className="px-6 pt-5 pb-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold flex items-center gap-2" style={{ color: NAVY }}>
              📅 Create New
            </h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/5" aria-label="Close">
              <XIcon size={16} style={{ color: MUTED }} />
            </button>
          </div>

          {/* Selection summary */}
          <div className="rounded-xl px-4 py-3 mb-5 space-y-1.5" style={{ background: TEAL_50, border: `1px solid ${TEAL_100}` }}>
            <div className="flex items-center gap-2 text-sm" style={{ color: NAVY }}>
              <Clock size={14} style={{ color: TEAL_600 }} />
              <span style={{ color: MUTED }}>Selected Date:</span>
              <span className="font-semibold">{fmtSelected(selection)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm" style={{ color: NAVY }}>
              <Clock size={14} style={{ color: TEAL_600 }} />
              <span style={{ color: MUTED }}>Duration:</span>
              <span className="font-semibold">{fmtDuration(selection.durationMinutes)}</span>
            </div>
          </div>

          <p className="text-center text-sm mb-4" style={{ color: MUTED }}>What would you like to create?</p>

          {/* Choices */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onChooseLesson}
              className="rounded-xl p-4 text-center transition-colors hover:bg-teal-50/60"
              style={{ border: `1px solid ${BORDER}` }}
            >
              <div className="w-11 h-11 mx-auto rounded-full flex items-center justify-center mb-2" style={{ background: TEAL_50 }}>
                <BookOpen size={20} style={{ color: TEAL_600 }} />
              </div>
              <div className="text-sm font-semibold" style={{ color: NAVY }}>Create Lesson</div>
              <div className="text-xs mt-0.5" style={{ color: MUTED }}>Create a single lesson</div>
            </button>

            <button
              onClick={onChooseSchedule}
              className="rounded-xl p-4 text-center transition-colors hover:bg-violet-50/60"
              style={{ border: `1px solid ${BORDER}` }}
            >
              <div className="w-11 h-11 mx-auto rounded-full flex items-center justify-center mb-2" style={{ background: '#F5F3FF' }}>
                <Repeat size={20} style={{ color: '#7C3AED' }} />
              </div>
              <div className="text-sm font-semibold" style={{ color: NAVY }}>Create Schedule</div>
              <div className="text-xs mt-0.5" style={{ color: MUTED }}>Create a recurring schedule</div>
            </button>
          </div>

          <button onClick={onClose} className="w-full mt-4 py-2 text-sm font-medium" style={{ color: MUTED }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
