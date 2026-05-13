'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/system/api'

export interface SavedView {
  id: string
  name: string
  params: string
  shared: boolean
  user_id: number
}

export function useSavedViews(context: string) {
  return useQuery({
    queryKey: ['system', 'saved-views', context],
    queryFn: () => api<{ data: SavedView[] }>(`/saved-views?context=${context}`).then(r => r.data),
  })
}

export function useCreateSavedView(context: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; params: string; shared?: boolean }) =>
      api<{ data: SavedView }>('/saved-views', {
        method: 'POST',
        body: JSON.stringify({ ...data, context }),
      }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'saved-views', context] }),
  })
}

export function useDeleteSavedView(context: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api<{ deleted: boolean }>(`/saved-views/${id}?context=${context}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'saved-views', context] }),
  })
}
