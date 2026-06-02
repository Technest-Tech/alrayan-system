'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/system/api'
import type { Note, NoteType } from '@/types/system/note'

type NoteContext = 'students' | 'teachers'

export function useNotes(context: NoteContext, entityId: number | string, options?: { includeTrashed?: boolean }) {
  const basePath = context === 'students' ? `/students/${entityId}/notes` : `/teachers/${entityId}/notes`
  const qs = options?.includeTrashed ? '?include_trashed=1' : ''
  return useQuery({
    queryKey: ['system', context, entityId, 'notes', options],
    queryFn: () => api<Paginated<Note>>(`${basePath}${qs}`),
    enabled: !!entityId,
  })
}

interface AddNotePayload {
  body: string
  note_type?: NoteType
  pinned?: boolean
}

export function useAddNote(context: NoteContext, entityId: number | string) {
  const qc = useQueryClient()
  const basePath = context === 'students' ? `/students/${entityId}/notes` : `/teachers/${entityId}/notes`
  return useMutation({
    mutationFn: (payload: AddNotePayload) =>
      api<{ data: Note }>(basePath, { method: 'POST', body: JSON.stringify(payload) }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', context, entityId, 'notes'] }),
  })
}

interface UpdateNotePayload {
  id: number
  body?: string
  note_type?: NoteType
  pinned?: boolean
}

export function useUpdateNote(context: NoteContext, entityId: number | string) {
  const qc = useQueryClient()
  const notePathPrefix = context === 'students' ? '/student-notes' : '/teacher-notes'
  return useMutation({
    mutationFn: ({ id, ...rest }: UpdateNotePayload) =>
      api<{ data: Note }>(`${notePathPrefix}/${id}`, { method: 'PATCH', body: JSON.stringify(rest) }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', context, entityId, 'notes'] }),
  })
}

export function useDeleteNote(context: NoteContext, entityId: number | string) {
  const qc = useQueryClient()
  const notePathPrefix = context === 'students' ? '/student-notes' : '/teacher-notes'
  return useMutation({
    mutationFn: (id: number) =>
      api<{ deleted: boolean }>(`${notePathPrefix}/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', context, entityId, 'notes'] }),
  })
}
