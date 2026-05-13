'use client'
import { useState } from 'react'
import { Send } from 'lucide-react'
import { toast } from 'sonner'
import { useAddNote } from '@/hooks/system/useNotes'
import { ApiError } from '@/lib/system/api'

type NoteContext = 'students' | 'teachers'

interface NoteComposerProps {
  context: NoteContext
  entityId: number | string
  onAdded?: () => void
}

export function NoteComposer({ context, entityId, onAdded }: NoteComposerProps) {
  const [body,    setBody]    = useState('')
  const [focused, setFocused] = useState(false)
  const addNote = useAddNote(context, entityId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    try {
      await addNote.mutateAsync(body.trim())
      setBody('')
      setFocused(false)
      onAdded?.()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to add note.')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border overflow-hidden transition-shadow"
      style={{
        borderColor: focused ? 'rgb(var(--status-success, 14 124 90))' : 'rgb(var(--border-default, 229 233 240))',
        background: 'rgb(var(--surface-card, 255 255 255))',
        boxShadow: focused ? '0 0 0 2px rgb(14 124 90 / 0.15)' : undefined,
      }}
    >
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Add a note…"
        rows={focused || body ? 3 : 1}
        className="w-full px-4 py-3 text-sm outline-none resize-none bg-transparent transition-all"
        style={{ minHeight: '44px' }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(e as unknown as React.FormEvent)
        }}
      />
      {(focused || body) && (
        <div
          className="flex items-center justify-between px-3 pb-2.5"
        >
          <span className="text-xs opacity-30">⌘ + Enter to submit</span>
          <button
            type="submit"
            disabled={!body.trim() || addNote.isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50 transition-opacity"
            style={{ background: 'rgb(14 124 90)' }}
          >
            <Send size={12} />
            {addNote.isPending ? 'Adding…' : 'Add note'}
          </button>
        </div>
      )}
    </form>
  )
}
