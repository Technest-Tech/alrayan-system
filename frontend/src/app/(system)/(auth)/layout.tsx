'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/system/auth'

// Redirect already-authenticated users away from login/forgot-password/reset-password
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, error } = useUser()
  const router = useRouter()

  // Only redirect if we have a confirmed user (no error means the /auth/me call succeeded)
  const isAuthenticated = !error && !!user

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard')
    }
  }, [isAuthenticated, isLoading, router])

  // Suppress flash of auth form while redirect is in flight
  if (!isLoading && isAuthenticated) return null

  return <>{children}</>
}
