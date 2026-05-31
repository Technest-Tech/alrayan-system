'use client'
import { useState } from 'react'
import { Send, Pin, AlertTriangle, Star, Briefcase, TrendingUp, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { useAddNote } from '@/hooks/system/useNotes'
import type { NoteType } from '@/types/system/note'
import { ApiError } from '@/lib/system/api'

type NoteContext = 'students' | 'teachers'

interface NoteComposerProps {
  context: NoteContext
  entityId: number | string
  onAdded?: () => void
}

const MAX_CHARS = 5000

const NOTE_TYPES: {
  value: NoteType
  label: string
  icon: React.ReactNode
  activeClass: string
  idleClass: string
}[] = [
  { value: 'general',      label: 'General',      icon: <FileText size={11} />,      activeClass: 'bg-gray-800 text-white border-gray-800',          idleClass: 'text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700' },
  { value: 'hr',           label: 'HR',           icon: <Briefcase size={11} />,     activeClass: 'bg-blue-600 text-white border-blue-600',           idleClass: 'text-blue-600 border-blue-200 hover:border-blue-400' },
  { value: 'performance',  label: 'Performance',  icon: <TrendingUp size={11} />,    activeClass: 'bg-purple-600 text-white border-purple-600',        idleClass: 'text-purple-600 border-purple-200 hover:border-purple-400' },
  { value: 'warning',      label: 'Warning',      icon: <AlertTriangle size={11} />, activeClass: 'bg-red-500 text-white border-red-500',             idleClass: 'text-red-500 border-red-200 hover:border-red-400' },
  { value: 'commendation', label: 'Commendation', icon: <Star size={11} />,         activeClass: 'bg-emerald-600 text-white border-emerald-600',      idleClass: 'text-emerald-600 border-emerald-200 hover:border-emerald-400' },
]

const ACCENT: Record<NoteType, string> = {
  general:      'rgb(14 124 90)',
  hr:           'rgb(37 99 235)',
  performance:  'rgb(147 51 234)',
  warning:      'rgb(239 68 68)',
  commendation: 'rgb(16 185 129)',
}

const STRIP: Record<NoteType, string> = {
  general:      'transparent',
  hr:           'rgb(37 99 235)',
  performance:  'rgb(147 51 234)',
  warning:      'rgb(239 68 68)',
  commendation: 'rgb(16 185 129)',
}

export function NoteComposer({ context, entityId, onAdded }: NoteComposerProps) {
  const [body,     setBody]     = useState('')
  const [focused,  setFocused]  = useState(false)
  const [noteType, setNoteType] = useState<NoteType>('general')
  const [pinned,   setPinned]   = useState(false)
  const addNote = useAddNote(context, entityId)

  const expanded  = focused || !!body
  const charCount = body.length
  const nearLimit = charCount > MAX_CHARS * 0.85
  const overLimit = charCount > MAX_CHARS
  const accent    = ACCENT[noteType]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim() || overLimit) return
    try {
      await addNote.mutateAsync({ body: body.trim(), note_type: noteType, pinned })
      setBody('')
      setFocused(false)
      setPinned(false)
      setNoteType('general')
      onAdded?.()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to add note.')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div
        className="rounded-2xl border overflow-hidden transition-all duration-150"
        style={{
          borderColor: focused ? accent : 'rgb(var(--border-default, 229 233 240))',
          background: 'rgb(var(--surface-card, 255 255 255))',
          boxShadow: focused ? `0 0 0 3px ${accent}1a` : '0 1px 3px rgb(0 0 0 / 0.04)',
        }}
      >
        {/* Colored type strip */}
        {expanded && noteType !== 'general' && (
          <div className="h-0.5 w-full" style={{ background: STRIP[noteType] }} />
        )}

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Add a note…"
          rows={expanded ? 4 : 1}
          className="w-full px-4 py-3.5 text-sm outline-none resize-none bg-transparent transition-all leading-relaxed"
          style={{ minHeight: '48px' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(e as unknown as React.FormEvent)
          }}
        />

        {expanded && (
          <div className="px-4 pb-3.5 space-y-3">
            <div className="border-t" style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }} />

            {/* Type chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold uppercase tracking-wide opacity-35 mr-0.5">Type</span>
              {NOTE_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setNoteType(t.value)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                    noteType === t.value ? t.activeClass : t.idleClass
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>

            {/* Bottom row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPinned((v) => !v)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                    pinned ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-transparent text-gray-400 hover:bg-black/5 hover:text-gray-600'
                  }`}
                >
                  <Pin size={12} className={pinned ? 'fill-amber-500 text-amber-500' : ''} />
                  {pinned ? 'Pinned' : 'Pin'}
                </button>
                <span className={`text-[11px] tabular-nums transition-colors ${
                  overLimit ? 'text-red-500 font-semibold' : nearLimit ? 'text-amber-500' : 'opacity-25'
                }`}>
                  {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] opacity-25 hidden sm:block">⌘ Return</span>
                <button
                  type="submit"
                  disabled={!body.trim() || overLimit || addNote.isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold text-white disabled:opacity-40 transition-opacity"
                  style={{ background: accent }}
                >
                  <Send size={11} />
                  {addNote.isPending ? 'Saving…' : 'Add note'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </form>
  )
}
