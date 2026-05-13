'use client'
import { useUser } from '@/lib/system/auth'
import type { AuthUser } from '@/types/system/auth'

interface Props {
  roles: AuthUser['role'][]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RoleGuard({ roles, children, fallback = null }: Props) {
  const { data: user } = useUser()
  if (!user || !roles.includes(user.role)) return <>{fallback}</>
  return <>{children}</>
}
