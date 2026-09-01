'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/system/api'
import type { SiteTeacher, SiteTeacherReview } from '@/types/system/siteTeacher'

const KEY = ['system', 'site', 'teachers']

export function useSiteTeachers() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api<{ data: SiteTeacher[] }>('/site/teachers').then((r) => r.data),
  })
}

export function useSiteTeacher(slug: string | null) {
  return useQuery({
    queryKey: [...KEY, slug],
    queryFn: () => api<{ data: SiteTeacher }>(`/site/teachers/${slug}`).then((r) => r.data),
    enabled: !!slug,
  })
}

export function useCreateSiteTeacher() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api<{ data: SiteTeacher }>('/site/teachers', { method: 'POST', body: JSON.stringify(data) }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUpdateSiteTeacher(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api<{ data: SiteTeacher }>(`/site/teachers/${slug}`, { method: 'PATCH', body: JSON.stringify(data) }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

/**
 * Patch any teacher, naming the slug at call time.
 *
 * `useUpdateSiteTeacher` binds one slug at render, which a list of rows cannot
 * do — hooks can't be called per row. This is the variant the table uses for
 * its inline toggles.
 */
export function usePatchSiteTeacher() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ slug, ...data }: Record<string, unknown> & { slug: string }) =>
      api<{ data: SiteTeacher }>(`/site/teachers/${slug}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteSiteTeacher() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (slug: string) => api<null>(`/site/teachers/${slug}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

/**
 * Save a new display order for the public teachers list.
 *
 * Takes the ids in their final order; the server writes each one's position.
 */
export function useReorderSiteTeachers() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ids: number[]) =>
      api<{ data: SiteTeacher[] }>('/site/teachers/reorder', {
        method: 'POST',
        body: JSON.stringify({ ids }),
      }).then((r) => r.data),
    onSuccess: (teachers) => {
      // The response is the freshly ordered list, so seed the cache with it
      // rather than making the table flash through a refetch.
      qc.setQueryData(KEY, teachers)
    },
  })
}

// ── Reviews ──

export function useCreateReview(teacherSlug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<SiteTeacherReview>) =>
      api<{ data: SiteTeacherReview }>(`/site/teachers/${teacherSlug}/reviews`, { method: 'POST', body: JSON.stringify(data) }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUpdateReview(teacherSlug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<SiteTeacherReview> & { id: number }) =>
      api<{ data: SiteTeacherReview }>(`/site/reviews/${id}`, { method: 'PATCH', body: JSON.stringify(data) }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...KEY, teacherSlug] }),
  })
}

export function useDeleteReview(teacherSlug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api<null>(`/site/reviews/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...KEY, teacherSlug] }),
  })
}
