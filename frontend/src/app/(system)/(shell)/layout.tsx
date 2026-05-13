import { SystemShell } from '@/components/system/shell/SystemShell'
import { ConfirmProvider } from '@/components/system/primitives/ConfirmDialog'

// All authenticated admin pages live under this layout
export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConfirmProvider>
      <SystemShell>{children}</SystemShell>
    </ConfirmProvider>
  )
}
