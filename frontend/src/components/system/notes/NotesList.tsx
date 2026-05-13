'use client'
import { useState } from 'react'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { useNotes, useUpdateNote, useDeleteNote } from '@/hooks/system/useNotes'
import type { Note } from '@/types/system/note'
import { ApiError } from '@/lib/system/api'

type NoteContext = 'students' | 'teachers'

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 2)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function initials(name: string | null) {
  if (!name) return '?'
  return name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2)
}

const ROLE_COLORS: Record<string, string> = {
  admin:      'bg-purple-100 text-purple-700',
  supervisor: 'bg-blue-100 text-blue-700',
  teacher:    'bg-amber-100 text-amber-700',
}

interface NoteItemProps {
  note: Note
  context: NoteContext
  entityId: number | string
}

function NoteItem({ note, context, entityId }: NoteItemProps) {
  const [editing,  setEditing]  = useState(false)
  const [body,     setBody]     = useState(note.body)
  const updateNote = useUpdateNote(context, entityId)
  const deleteNote = useDeleteNote(context, entityId)

  async function handleSave() {
    if (!body.trim()) return
    try {
      await updateNote.mutateAsync({ id: note.id, body: body.trim() })
      toast.success('Note updated.')
      setEditing(false)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to update note.')
    }
  }

  async function handleDelete() {
    try {
      await deleteNote.mutateAsync(note.id)
      toast.success('Note deleted.')
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to delete note.')
    }
  }

  return (
    <div className="flex gap-3 group">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
        style={{ background: 'rgb(var(--status-neutral, 90 100 112))' }}
      >
        {initials(note.author_name)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{note.author_name ?? 'Unknown'}</span>
          {note.author_role && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${ROLE_COLORS[note.author_role] ?? 'bg-gray-100 text-gray-600'}`}>
              {note.author_role}
            </span>
          )}
          <span className="text-xs opacity-40">{timeAgo(note.created_at)}</span>
          {note.updated_at !== note.created_at && (
            <span className="text-xs opacity-30">(edited)</span>
          )}
        </div>

        {editing ? (
          <div className="mt-2 space-y-2">
            <textarea
              autoFocus
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)]"
              style={{ borderColor: 'rgb(var(--border-default, 229 233 240))', background: 'rgb(var(--surface-card, 255 255 255))' }}
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={updateNote.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50"
                style={{ background: 'rgb(14 124 90)' }}
              >
                <Check size={12} />
                Save
              </button>
              <button
                onClick={() => { setEditing(false); setBody(note.body) }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border hover:bg-black/5 transition-colors"
                style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}
              >
                <X size={12} />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap opacity-80">{note.body}</p>
        )}
      </div>

      {!editing && (
        <div className="flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 rounded-lg hover:bg-black/10 transition-colors opacity-60 hover:opacity-100"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteNote.isPending}
            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-red-500 opacity-60 hover:opacity-100 disabled:opacity-30"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  )
}

interface NotesListProps {
  context: NoteContext
  entityId: number | string
}

export function NotesList({ context, entityId }: NotesListProps) {
  const { data, isLoading } = useNotes(context, entityId)
  const notes: Note[] = data?.data ?? []

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="w-8 h-8 rounded-full animate-pulse shrink-0" style={{ background: 'rgb(var(--surface-card-2, 248 250 252))' }} />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-3 w-1/3 rounded animate-pulse" style={{ background: 'rgb(var(--surface-card-2, 248 250 252))' }} />
              <div className="h-10 rounded animate-pulse" style={{ background: 'rgb(var(--surface-card-2, 248 250 252))' }} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!notes.length) {
    return <p className="text-sm opacity-40 text-center py-8">No notes yet. Add one above.</p>
  }

  return (
    <div className="space-y-5">
      {notes.map((note) => (
        <NoteItem key={note.id} note={note} context={context} entityId={entityId} />
      ))}
    </div>
  )
}
