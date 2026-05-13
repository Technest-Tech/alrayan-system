'use client'
import { useState, useRef, useEffect } from 'react'
import { Bookmark, ChevronDown, Plus, Trash2 } from 'lucide-react'
import { useSavedViews, useCreateSavedView, useDeleteSavedView } from '@/hooks/system/useSavedViews'
import { toast } from 'sonner'
import { ApiError } from '@/lib/system/api'

interface SavedViewsDropdownProps {
  context: string
  onApply: (params: string) => void
}

export function SavedViewsDropdown({ context, onApply }: SavedViewsDropdownProps) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newName, setNewName] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const { data: views = [] } = useSavedViews(context)
  const createView = useCreateSavedView(context)
  const deleteView = useDeleteSavedView(context)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSaving(false)
        setNewName('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSave() {
    if (!newName.trim()) return
    const params = window.location.search.replace(/^\?/, '')
    try {
      await createView.mutateAsync({ name: newName.trim(), params })
      toast.success('View saved.')
      setSaving(false)
      setNewName('')
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to save view.')
    }
  }

  async function handleDelete(id: string, name: string) {
    try {
      await deleteView.mutateAsync(id)
      toast.success(`"${name}" deleted.`)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to delete view.')
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-colors hover:bg-black/5"
        style={{ borderColor: 'rgb(var(--border-default, 229 233 240))', background: 'rgb(var(--surface-card, 255 255 255))' }}
      >
        <Bookmark size={14} />
        Saved views
        <ChevronDown size={12} className="opacity-50" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 w-64 rounded-xl shadow-lg border z-30 overflow-hidden"
          style={{ background: 'rgb(var(--surface-card, 255 255 255))', borderColor: 'rgb(var(--border-default, 229 233 240))' }}
        >
          {views.length > 0 ? (
            <ul className="py-1">
              {views.map((v) => (
                <li key={v.id} className="flex items-center gap-2 px-3 py-2 hover:bg-black/5 transition-colors group">
                  <button
                    className="flex-1 text-left text-sm truncate"
                    onClick={() => { onApply(v.params); setOpen(false) }}
                  >
                    {v.name}
                  </button>
                  <button
                    onClick={() => handleDelete(v.id, v.name)}
                    className="opacity-0 group-hover:opacity-60 hover:!opacity-100 text-red-600 transition-opacity"
                  >
                    <Trash2 size={13} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-3 py-4 text-xs opacity-50 text-center">No saved views yet.</p>
          )}

          <div
            className="border-t px-3 py-2"
            style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}
          >
            {saving ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') { setSaving(false); setNewName('') } }}
                  placeholder="View name…"
                  className="flex-1 text-xs px-2 py-1 rounded-lg border outline-none focus:ring-2 focus:ring-[rgb(14,124,90)]"
                  style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}
                />
                <button
                  onClick={handleSave}
                  disabled={createView.isPending}
                  className="text-xs px-2 py-1 rounded-lg text-white font-medium disabled:opacity-50"
                  style={{ background: 'rgb(14 124 90)' }}
                >
                  Save
                </button>
              </div>
            ) : (
              <button
                onClick={() => setSaving(true)}
                className="flex items-center gap-1.5 text-xs opacity-60 hover:opacity-100 transition-opacity w-full"
              >
                <Plus size={12} />
                Save current view
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
