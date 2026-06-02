'use client'
import { useState, useMemo } from 'react'
import {
  Pencil, Trash2, Check, X, Pin, Search, SortAsc, SortDesc,
  AlertTriangle, Star, Briefcase, TrendingUp, FileText, ChevronDown, ChevronUp,
} from 'lucide-react'
import { toast } from 'sonner'
import { useNotes, useUpdateNote, useDeleteNote } from '@/hooks/system/useNotes'
import type { Note, NoteType } from '@/types/system/note'
import { ApiError } from '@/lib/system/api'

type NoteContext = 'students' | 'teachers'
type SortOrder = 'newest' | 'oldest'

const COLLAPSE_AT = 220

// ── Helpers ────────────────────────────────────────────────────────────────────

function fullDate(d: string) {
  return new Date(d).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), dy = Math.floor(diff / 86400000)
  if (m < 2) return 'just now'
  if (m < 60) return `${m}m ago`
  if (h < 24) return `${h}h ago`
  if (dy < 7) return `${dy}d ago`
  return fullDate(d).split(',')[0]
}

function initials(name: string | null) {
  if (!name) return '?'
  return name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2)
}

function avatarColor(name: string | null): string {
  if (!name) return '#94a3b8'
  const palette = ['#7c3aed', '#2563eb', '#0891b2', '#059669', '#d97706', '#dc2626', '#db2777', '#0e7c5a', '#6366f1', '#ea580c']
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return palette[Math.abs(h) % palette.length]
}

// ── Type config ────────────────────────────────────────────────────────────────

type TypeConfig = {
  label: string
  icon: React.ReactNode
  borderColor: string
  bgClass: string
  badgeClass: string
  chipActive: string
  chipIdle: string
}

const TYPE_CFG: Record<NoteType, TypeConfig> = {
  general: {
    label: 'General', icon: <FileText size={10} />,
    borderColor: 'transparent', bgClass: '',
    badgeClass: 'bg-gray-100 text-gray-500',
    chipActive: 'bg-gray-800 text-white border-gray-800',
    chipIdle: 'text-gray-500 border-gray-200 hover:border-gray-400',
  },
  hr: {
    label: 'HR', icon: <Briefcase size={10} />,
    borderColor: 'rgb(37 99 235)', bgClass: 'bg-blue-50/40',
    badgeClass: 'bg-blue-50 text-blue-700',
    chipActive: 'bg-blue-600 text-white border-blue-600',
    chipIdle: 'text-blue-600 border-blue-200 hover:border-blue-400',
  },
  performance: {
    label: 'Performance', icon: <TrendingUp size={10} />,
    borderColor: 'rgb(147 51 234)', bgClass: 'bg-purple-50/40',
    badgeClass: 'bg-purple-50 text-purple-700',
    chipActive: 'bg-purple-600 text-white border-purple-600',
    chipIdle: 'text-purple-600 border-purple-200 hover:border-purple-400',
  },
  warning: {
    label: 'Warning', icon: <AlertTriangle size={10} />,
    borderColor: 'rgb(239 68 68)', bgClass: 'bg-red-50/50',
    badgeClass: 'bg-red-50 text-red-600',
    chipActive: 'bg-red-500 text-white border-red-500',
    chipIdle: 'text-red-500 border-red-200 hover:border-red-400',
  },
  commendation: {
    label: 'Commendation', icon: <Star size={10} />,
    borderColor: 'rgb(16 185 129)', bgClass: 'bg-emerald-50/50',
    badgeClass: 'bg-emerald-50 text-emerald-700',
    chipActive: 'bg-emerald-600 text-white border-emerald-600',
    chipIdle: 'text-emerald-600 border-emerald-200 hover:border-emerald-400',
  },
}

const ALL_TYPES: NoteType[] = ['general', 'hr', 'performance', 'warning', 'commendation']

// ── NoteItem ───────────────────────────────────────────────────────────────────

function NoteItem({ note, context, entityId }: { note: Note; context: NoteContext; entityId: number | string }) {
  const [editing,    setEditing]    = useState(false)
  const [editBody,   setEditBody]   = useState(note.body)
  const [editType,   setEditType]   = useState<NoteType>(note.note_type)
  const [confirmDel, setConfirmDel] = useState(false)
  const [expanded,   setExpanded]   = useState(false)

  const updateNote = useUpdateNote(context, entityId)
  const deleteNote = useDeleteNote(context, entityId)
  const cfg = TYPE_CFG[note.note_type] ?? TYPE_CFG.general
  const longBody = note.body.length > COLLAPSE_AT
  const bodyText = !expanded && longBody ? note.body.slice(0, COLLAPSE_AT) + '…' : note.body

  async function handleSave() {
    if (!editBody.trim()) return
    try {
      await updateNote.mutateAsync({ id: note.id, body: editBody.trim(), note_type: editType })
      toast.success('Note saved.')
      setEditing(false)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed.')
    }
  }

  async function handleDelete() {
    try {
      await deleteNote.mutateAsync(note.id)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed.')
      setConfirmDel(false)
    }
  }

  async function togglePin() {
    try {
      await updateNote.mutateAsync({ id: note.id, pinned: !note.pinned })
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed.')
    }
  }

  return (
    <div
      className={`relative flex gap-0 rounded-2xl overflow-hidden border transition-shadow group ${cfg.bgClass}`}
      style={{
        borderColor: note.pinned ? 'rgb(251 191 36 / 0.5)' : 'rgb(var(--border-default, 229 233 240))',
        boxShadow: note.pinned ? '0 0 0 2px rgb(251 191 36 / 0.12)' : undefined,
      }}
    >
      {/* Left accent */}
      <div className="w-1 shrink-0 rounded-l-2xl" style={{ background: cfg.borderColor !== 'transparent' ? cfg.borderColor : 'transparent' }} />

      <div className="flex-1 px-4 py-4 min-w-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 flex-wrap min-w-0">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 ring-2 ring-white"
              style={{ background: avatarColor(note.author_name) }}
            >
              {initials(note.author_name)}
            </div>
            <span className="font-semibold text-sm leading-none">{note.author_name ?? 'Unknown'}</span>
            {note.author_role && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500 uppercase tracking-wide">
                {note.author_role}
              </span>
            )}
            <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${cfg.badgeClass}`}>
              {cfg.icon}{cfg.label}
            </span>
            {note.pinned && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-600">
                <Pin size={9} className="fill-amber-500" />Pinned
              </span>
            )}
          </div>

          {!editing && !confirmDel && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                onClick={togglePin}
                disabled={updateNote.isPending}
                title={note.pinned ? 'Unpin' : 'Pin to top'}
                className={`p-1.5 rounded-lg transition-colors ${note.pinned ? 'text-amber-500 hover:bg-amber-50' : 'text-gray-400 hover:bg-black/5 hover:text-amber-500'}`}
              >
                <Pin size={13} className={note.pinned ? 'fill-amber-400' : ''} />
              </button>
              <button onClick={() => { setEditBody(note.body); setEditType(note.note_type); setEditing(true); setConfirmDel(false) }} className="p-1.5 rounded-lg text-gray-400 hover:bg-black/5 hover:text-gray-700 transition-colors">
                <Pencil size={13} />
              </button>
              <button onClick={() => setConfirmDel(true)} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Timestamp */}
        <p className="text-[11px] opacity-35 mt-0.5 ml-9" title={fullDate(note.created_at)}>
          {timeAgo(note.created_at)}{note.updated_at !== note.created_at && ' · edited'}
        </p>

        {/* Body */}
        {editing ? (
          <div className="mt-3 space-y-2.5">
            <textarea
              autoFocus
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              rows={4}
              className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none leading-relaxed resize-none focus:ring-2 focus:ring-[rgb(14,124,90)]"
              style={{ borderColor: 'rgb(var(--border-default, 229 233 240))', background: 'rgb(var(--surface-card, 255 255 255))' }}
            />
            <div className="flex items-center gap-1.5 flex-wrap">
              {ALL_TYPES.map((t) => {
                const tc = TYPE_CFG[t]
                return (
                  <button key={t} type="button" onClick={() => setEditType(t)}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium border transition-all ${editType === t ? tc.chipActive : tc.chipIdle}`}
                  >
                    {tc.icon}{tc.label}
                  </button>
                )
              })}
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={updateNote.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white disabled:opacity-50"
                style={{ background: 'rgb(14 124 90)' }}>
                <Check size={12} />{updateNote.isPending ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => setEditing(false)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border hover:bg-black/5 transition-colors"
                style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}>
                <X size={12} />Cancel
              </button>
            </div>
          </div>
        ) : confirmDel ? (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-red-600 font-medium">Delete this note?</span>
            <button onClick={handleDelete} disabled={deleteNote.isPending}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-500 text-white disabled:opacity-50">
              {deleteNote.isPending ? 'Deleting…' : 'Delete'}
            </button>
            <button onClick={() => setConfirmDel(false)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium border hover:bg-black/5 transition-colors"
              style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}>
              Cancel
            </button>
          </div>
        ) : (
          <div className="mt-2">
            <p className="text-sm leading-relaxed whitespace-pre-wrap opacity-80">{bodyText}</p>
            {longBody && (
              <button onClick={() => setExpanded((v) => !v)}
                className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium opacity-40 hover:opacity-70 transition-opacity">
                {expanded ? <><ChevronUp size={12} />Show less</> : <><ChevronDown size={12} />Show more</>}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Section divider ────────────────────────────────────────────────────────────

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="text-[11px] font-semibold uppercase tracking-widest opacity-30 whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px" style={{ background: 'rgb(var(--border-default, 229 233 240))' }} />
    </div>
  )
}

// ── NotesList ──────────────────────────────────────────────────────────────────

export function NotesList({ context, entityId }: { context: NoteContext; entityId: number | string }) {
  const [filter,    setFilter]    = useState<NoteType | 'all'>('all')
  const [search,    setSearch]    = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')

  const { data, isLoading } = useNotes(context, entityId)
  const allNotes: Note[] = data?.data ?? []

  const filtered = useMemo(() => {
    let notes = allNotes
    if (filter !== 'all') notes = notes.filter((n) => n.note_type === filter)
    if (search.trim()) {
      const q = search.toLowerCase()
      notes = notes.filter((n) => n.body.toLowerCase().includes(q) || (n.author_name ?? '').toLowerCase().includes(q))
    }
    if (sortOrder === 'oldest') notes = [...notes].reverse()
    return notes
  }, [allNotes, filter, search, sortOrder])

  const pinned      = filtered.filter((n) => n.pinned)
  const unpinned    = filtered.filter((n) => !n.pinned)
  const pinnedCount = allNotes.filter((n) => n.pinned).length
  const typesPresent = ALL_TYPES.filter((t) => allNotes.some((n) => n.note_type === t))

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: 'rgb(var(--surface-card-2, 248 250 252))' }} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div
        className="rounded-2xl border px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3"
        style={{ background: 'rgb(var(--surface-card, 255 255 255))', borderColor: 'rgb(var(--border-default, 229 233 240))' }}
      >
        <p className="text-sm font-semibold flex-1">
          {allNotes.length} note{allNotes.length !== 1 ? 's' : ''}
          {pinnedCount > 0 && <span className="ml-1.5 text-amber-600 font-medium">· {pinnedCount} pinned</span>}
        </p>
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-35 pointer-events-none" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notes…"
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)] bg-transparent"
            style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}
          />
        </div>
        <button
          onClick={() => setSortOrder((v) => v === 'newest' ? 'oldest' : 'newest')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium hover:bg-black/5 transition-colors shrink-0"
          style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}
        >
          {sortOrder === 'newest' ? <SortDesc size={13} /> : <SortAsc size={13} />}
          {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
        </button>
      </div>

      {/* Filter chips */}
      {typesPresent.length > 1 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${filter === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'text-gray-500 border-gray-200 hover:border-gray-400'}`}
          >
            All ({allNotes.length})
          </button>
          {typesPresent.map((t) => {
            const tc = TYPE_CFG[t]
            return (
              <button key={t} onClick={() => setFilter(filter === t ? 'all' : t)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${filter === t ? tc.chipActive : tc.chipIdle}`}
              >
                {tc.icon}{tc.label} ({allNotes.filter((n) => n.note_type === t).length})
              </button>
            )
          })}
        </div>
      )}

      {/* Empty states */}
      {allNotes.length === 0 && (
        <div className="rounded-2xl border py-12 text-center" style={{ borderColor: 'rgb(var(--border-default, 229 233 240))', borderStyle: 'dashed' }}>
          <FileText size={28} className="mx-auto mb-2 opacity-20" />
          <p className="text-sm font-medium opacity-40">No notes yet</p>
          <p className="text-xs opacity-25 mt-0.5">Add the first note above</p>
        </div>
      )}
      {allNotes.length > 0 && filtered.length === 0 && (
        <p className="text-sm opacity-40 text-center py-6">No notes match your search.</p>
      )}

      {/* Pinned section */}
      {pinned.length > 0 && (
        <>
          <Divider label={`Pinned · ${pinned.length}`} />
          <div className="space-y-2.5">
            {pinned.map((n) => <NoteItem key={n.id} note={n} context={context} entityId={entityId} />)}
          </div>
        </>
      )}

      {/* Regular notes */}
      {unpinned.length > 0 && (
        <>
          {pinned.length > 0 && <Divider label={`Notes · ${unpinned.length}`} />}
          <div className="space-y-2.5">
            {unpinned.map((n) => <NoteItem key={n.id} note={n} context={context} entityId={entityId} />)}
          </div>
        </>
      )}
    </div>
  )
}
