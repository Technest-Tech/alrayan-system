import '@/styles/system.css'
import { QueryProvider } from '@/lib/system/query-client'
import { Toaster } from 'sonner'

// Shared providers for both (shell) and (auth) sub-groups
export default function SystemBaseLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      {children}
      <Toaster position="top-right" richColors closeButton />
    </QueryProvider>
  )
}
