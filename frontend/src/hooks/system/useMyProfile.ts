'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/system/api'

export interface Relative {
  name: string
  relation?: string | null
  phone?: string | null
}

export interface MyProfile {
  id: number
  user_id: number
  name: string
  email: string | null
  phone: string | null
  whatsapp: string | null
  birthday: string | null
  gender: 'male' | 'female' | null
  language: string | null
  photo_url: string | null
  documents: Record<string, string>
  relatives: Relative[]
  payment_method: string | null
  payment_account_details: string | null
  status: string
  role: string
  is_active: boolean
  member_since: string | null
}

export type MyProfileUpdate = Partial<
  Pick<MyProfile,
    'name' | 'phone' | 'whatsapp' | 'birthday' | 'gender' | 'language' |
    'photo_url' | 'documents' | 'relatives' | 'payment_method' | 'payment_account_details'
  >
>

/** The authenticated teacher's own profile (identity + payment fields). */
export function useMyProfile() {
  return useQuery({
    queryKey: ['system', 'teachers', 'me', 'profile'],
    queryFn: () => api<{ data: MyProfile }>('/teachers/me/profile').then(r => r.data),
  })
}

/** Update the authenticated teacher's own profile. */
export function useUpdateMyProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: MyProfileUpdate) =>
      api<{ data: MyProfile }>('/teachers/me/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['system', 'teachers', 'me', 'profile'] })
      qc.invalidateQueries({ queryKey: ['me'] })
    },
  })
}
